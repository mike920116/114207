"""使用者端 AI 聊天（整合 Dify + 聊天記錄 + 呼叫真人客服 + WebSocket）
    ⚙️ 2025‑05‑10 修正：
    1. 在 AIChatSessions 增加 conversation_id，跨訊息沿用同一段 Dify 對話
    2. 每次呼叫 Dify 時帶入 conversation_id；若第一次取得則寫回資料庫
"""
import os, requests, logging
from flask import Blueprint, render_template, request, jsonify, current_app
from flask_login import login_required, current_user
from utils import db

ai_chat_bp = Blueprint("ai_chat", __name__, url_prefix="/ai")

# ─── Dify 連線設定 ──────────────────────────────────────────
DIFY_API_URL = os.getenv("DIFY_API_URL", "https://api.dify.ai/v1/chat-messages")
DIFY_KEY     = os.getenv("DIFY_API_KEY_For_Chat")
HEADERS = {
    "Authorization": f"Bearer {DIFY_KEY}",
    "Content-Type": "application/json"
}

def get_socketio():
    return current_app.extensions.get("socketio")

# ─── 取得（或新建）聊天 session，回傳 session_id ────────────
def _get_or_create_session():
    conn = db.get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT session_id   -- 0
             , conversation_id   -- 1
        FROM   AIChatSessions
        WHERE  user_email = %s AND is_open = 1
        """, (current_user.id,))
    row = cur.fetchone()
    if row:
        session_id, conv_id = row
    else:
        cur.execute("""
            INSERT INTO AIChatSessions (user_email)
            VALUES (%s)
            """, (current_user.id,))
        session_id = cur.lastrowid
        conv_id    = None
        conn.commit()
    conn.close()
    return session_id, conv_id  # ← 直接回傳 conversation_id

# ────────────────────────────────────────────────────────────
#  1. 前端頁面
# ────────────────────────────────────────────────────────────
@ai_chat_bp.route("/chat")
@login_required
def chat_page():
    return render_template("ai/ai_chat.html")

# ────────────────────────────────────────────────────────────
#  2. 主要 API：傳送訊息 → Dify → 回傳
# ────────────────────────────────────────────────────────────
@ai_chat_bp.route("/chat/api", methods=["POST"])
@login_required
def chat_api():
    req   = request.get_json(silent=True) or {}
    query = (req.get("query") or "").strip()
    if not query:
        return jsonify({"reply": "請輸入內容"}), 400

    # 先取得 session 與 conversation_id
    session_id, conversation_id = _get_or_create_session()
    logging.info(f"[chat_api] session={session_id}, conversation_id={conversation_id}")

    # ↓↓↓  === 儲存使用者訊息、廣播給管理端  ====================
    conn = db.get_connection()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO AIChatLogs (session_id, role, message)
        VALUES (%s, 'user', %s)
        """, (session_id, query))
    conn.commit()

    socketio = get_socketio()
    if socketio:
        socketio.emit("msg_added", {
            "session_id": session_id,
            "role"      : "user",
            "message"   : query,
            "email"     : current_user.id
        }, namespace="/chat")

    # 若在客服暫停模式 → 不呼叫 Dify
    is_paused = session_id in current_app.dify_paused_sessions
    if is_paused:
        logging.info(f"[chat_api] session {session_id} in paused set, skip Dify")
        conn.close()
        return jsonify({"reply": "", "session_id": session_id})

    # ↑↑↑  === 使用者層結束 =====================================

    # ──  呼叫 Dify，帶入 conversation_id  ──────────────────────
    payload = {
        "inputs"        : {},
        "query"         : query,
        "response_mode" : "blocking",
        "conversation_id": conversation_id or "",
        "user"          : current_user.id,
    }
    try:
        r      = requests.post(DIFY_API_URL, headers=HEADERS, json=payload, timeout=30)
        r_json = r.json()
        reply  = r_json.get("answer", "（AI 無回應）")
        conv_id_from_dify = r_json.get("conversation_id")  # ⚠️ Dify 會在首次回傳 conversation_id
    except Exception as e:
        logging.exception("Dify API error")
        return jsonify({
            "reply": f"⚠️ AI 服務異常：{str(e)}",
            "session_id": session_id
        }), 500


    # 第一次取得 conversation_id → 寫回資料庫
    if conv_id_from_dify and not conversation_id:
        logging.info(f"[chat_api] first conv_id {conv_id_from_dify} → save")
        cur.execute("""
            UPDATE AIChatSessions
               SET conversation_id = %s
             WHERE session_id = %s
            """, (conv_id_from_dify, session_id))
        conn.commit()
        conversation_id = conv_id_from_dify

    # 儲存 AI 回覆
    cur.execute("""
        INSERT INTO AIChatLogs (session_id, role, message)
        VALUES (%s, 'ai', %s)
        """, (session_id, reply))
    conn.commit()
    conn.close()

    # 廣播 AI 回覆
    # 嘗試找出自己對應的 WebSocket sid
    sid = None
    for s, sess_id in current_app.active_chat_connections.items():
        if sess_id == session_id:
            sid = s
            break

    if socketio:
        socketio.emit("msg_added", {
            "session_id": session_id,
            "role"      : "ai",
            "message"   : reply,
            "email"     : current_user.id
        }, namespace="/chat",skip_sid=sid)

    return jsonify({
        "reply"        : reply,
        "session_id"   : session_id
        # 前端暫不需 conversation_id，若要用可一起回傳
    })

# ────────────────────────────────────────────────────────────
#  3. 叫真人客服
# ────────────────────────────────────────────────────────────
@ai_chat_bp.route("/chat/api/call_services", methods=["POST"])
@login_required
def call_human():
    session_id, _ = _get_or_create_session()
    conn = db.get_connection()
    cur  = conn.cursor()

    # 將 need_human 置 1
    cur.execute("""
        UPDATE AIChatSessions SET need_human = 1 WHERE session_id = %s
        """, (session_id,))
    help_msg = "我需要真人客服協助，謝謝！"
    cur.execute("""
        INSERT INTO AIChatLogs (session_id, role, message)
        VALUES (%s, 'user', %s)
        """, (session_id, help_msg))
    conn.commit()
    conn.close()

    # 暫停 Dify
    current_app.dify_paused_sessions.add(session_id)

    socketio = get_socketio()
    if socketio:
        socketio.emit("msg_added", {
            "session_id": session_id,
            "role"      : "user",
            "message"   : help_msg,
            "email"     : current_user.id
        }, namespace="/chat")
        socketio.emit("need_human", {
            "session_id": session_id,
            "email"     : current_user.id
        }, namespace="/chat")

    return jsonify({"message": "已通知真人客服", "session_id": session_id})

# ────────────────────────────────────────────────────────────
#  4. 關閉 / 刪除會話
# ────────────────────────────────────────────────────────────
@ai_chat_bp.route("/chat/api/close_session", methods=["POST"])
@login_required
def close_session():
    conn = db.get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT session_id FROM AIChatSessions
        WHERE user_email = %s AND is_open = 1
        """, (current_user.id,))
    row = cur.fetchone()
    if row:
        sid = row[0]
        cur.execute("DELETE FROM AIChatLogs WHERE session_id=%s", (sid,))
        cur.execute("DELETE FROM AIChatSessions WHERE session_id=%s", (sid,))
        conn.commit()
    conn.close()
    return jsonify({"status": "closed"})
