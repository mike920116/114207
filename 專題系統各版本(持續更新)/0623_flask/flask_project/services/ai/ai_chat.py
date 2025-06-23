"""
AI 聊天服務模組

提供使用者與 AI 助理的聊天功能，整合以下特色：
- Dify API 整合（智能對話）
- 聊天記錄持久化儲存
- WebSocket 即時通訊
- 真人客服呼叫功能
- 會話狀態管理

主要功能：
- 建立和管理聊天會話（session）
- 與 Dify AI 進行對話交互
- 儲存聊天歷史記錄
- 支援暫停/恢復 AI 對話
- 管理員通知與真人接手功能

技術特點：
- conversation_id 跨訊息維持對話連續性
- session_id 統一字串化處理
- WebSocket 事件驅動架構

主要路由：
- /ai/chat: 聊天頁面
- /ai/chat/api: 發送訊息 API
- /ai/chat/history: 聊天歷史
- /ai/chat/pause: 暫停 AI 對話
- /ai/chat/resume: 恢復 AI 對話
"""

import os, requests, logging
from flask import render_template, request, jsonify, current_app
from flask_login import login_required, current_user
from utils import db
from services.line.line_bot import notify_admins
from . import ai_chat_bp  # 從 __init__.py 導入 Blueprint

# ─── Dify 連線設定 ──────────────────────────────────────────
DIFY_API_URL = os.getenv("DIFY_API_URL", "https://api.dify.ai/v1/chat-messages")
DIFY_KEY     = os.getenv("DIFY_API_KEY_For_Chat")
HEADERS = {
    "Authorization": f"Bearer {DIFY_KEY}",
    "Content-Type": "application/json"
}


# ─── 公用：取 socketio 實例 ───────────────────────────────
def get_socketio():
    return current_app.extensions.get("socketio")


# ─── 公用：將任何值轉成 str（None → None） ────────────────
def to_str(v):
    return str(v) if v is not None else None


# ─── 取得（或新建）聊天 session，回傳 (session_id, conv_id) ──
def _get_or_create_session():
    """
    獲取或建立聊天會話
    
    查詢當前用戶是否有開啟中的聊天會話，如沒有則建立新會話
    
    Returns:
        tuple: (session_id, conversation_id) 
               session_id 為會話 ID，conversation_id 為 Dify 對話 ID
    """

    conn = db.get_connection()
    cur  = conn.cursor()
    cur.execute("""
        SELECT session_id         -- 0
             , conversation_id    -- 1
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
    return session_id, conv_id


# ────────────────────────────────────────────────────────────
#  1. 前端頁面
# ────────────────────────────────────────────────────────────
@ai_chat_bp.route("/chat")
@login_required
def chat_page():
    """
    顯示 AI 聊天頁面
    
    Returns:
        str: 渲染後的 AI 聊天 HTML 頁面
    """
    return render_template("ai/ai_chat.html")


# ────────────────────────────────────────────────────────────
#  2. 主要 API：傳送訊息 → Dify → 回傳
# ────────────────────────────────────────────────────────────
@ai_chat_bp.route("/chat/api", methods=["POST"])
@login_required
def chat_api():
    """
    處理聊天訊息 API 請求
    
    流程：
    1. 獲取或建立聊天會話
    2. 將訊息發送至 Dify API
    3. 儲存對話記錄至資料庫
    4. 透過 WebSocket 廣播訊息
    
    JSON Payload:
        query (str): 用戶訊息內容
        
    Returns:
        JSON: 包含 AI 回覆和會話資訊
    """

    req   = request.get_json(silent=True) or {}
    query = (req.get("query") or "").strip()
    if not query:
        return jsonify({"reply": "請輸入內容"}), 400

    # 先取得 session 與 conversation_id
    session_id, conversation_id = _get_or_create_session()
    logging.info(f"[chat_api] session={session_id}, conversation_id={conversation_id}")

    # ↓↓↓  儲存使用者訊息、廣播給管理端  ↓↓↓
    conn = db.get_connection()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO AIChatLogs (session_id, role, message)
        VALUES (%s, 'user', %s)
        """, (session_id, query))
    conn.commit()

    socketio = get_socketio()
    if socketio:        socketio.emit("msg_added", {
            "session_id": to_str(session_id),
            "role"      : "user",
            "message"   : query,
            "email"     : current_user.id
        }, namespace="/chat")

    # 若在客服暫停模式 → 不呼叫 Dify
    is_paused = session_id in current_app.dify_paused_sessions
    if is_paused:
        logging.info(f"[chat_api] session {session_id} in paused set, skip Dify")
        conn.close()
        return jsonify({"reply": "", "session_id": to_str(session_id)})

    # ──  呼叫 Dify，帶入 conversation_id  ───────────────────
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
        conv_id_from_dify = r_json.get("conversation_id")  # 首次回傳 conversation_id
    except Exception as e:
        logging.exception("Dify API error")
        return jsonify({
            "reply": f"⚠️ AI 服務異常：{str(e)}",
            "session_id": to_str(session_id)
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

    # 廣播 AI 回覆（不要再送給自己）
    skip_sid = None
    for s, sess_id in current_app.active_chat_connections.items():
        if sess_id == to_str(session_id):
            skip_sid = s
            break

    if socketio:        socketio.emit("msg_added", {
            "session_id": to_str(session_id),
            "role"      : "ai",
            "message"   : reply,
            "email"     : current_user.id
        }, namespace="/chat", skip_sid=skip_sid)

    return jsonify({
        "reply"      : reply,
        "session_id" : to_str(session_id)
    })


# ────────────────────────────────────────────────────────────
#  3. 叫真人客服
# ────────────────────────────────────────────────────────────
@ai_chat_bp.route("/chat/api/call_services", methods=["POST"])
@login_required
def call_human():
    """
    呼叫真人客服服務
    
    流程：
    1. 標記會話需要真人協助
    2. 暫停 Dify AI 回覆
    3. 記錄客服請求訊息
    4. 透過 WebSocket 通知管理員
    5. 發送 LINE 通知給管理員
    
    Returns:
        JSON: 包含通知狀態和會話 ID
    """

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
    conn.close()    # 暫停 Dify
    current_app.dify_paused_sessions.add(session_id)

    socketio = get_socketio()
    if socketio:
        socketio.emit("msg_added", {
            "session_id": to_str(session_id),
            "role"      : "user",
            "message"   : help_msg,
            "email"     : current_user.id
        }, namespace="/chat")
        socketio.emit("need_human", {
            "session_id": to_str(session_id),
            "email"     : current_user.id
        }, namespace="/chat")

    # 🔔 發送 LINE 通知給所有管理員
    try:
        notify_admins(f"📣 使用者 {current_user.id} 呼叫真人客服，請至後台查看")
    except Exception as e:
        logging.exception("LINE 通知失敗")

    return jsonify({"message": "已通知真人客服", "session_id": to_str(session_id)})


# ────────────────────────────────────────────────────────────
#  4. 關閉 / 刪除會話
# ────────────────────────────────────────────────────────────
@ai_chat_bp.route("/chat/api/close_session", methods=["POST"])
@login_required
def close_session():
    """
    關閉並刪除聊天會話
    
    清除當前用戶的開啟中會話，包括：
    1. 刪除聊天記錄
    2. 刪除會話資料
    3. 清理相關狀態
    
    Returns:
        JSON: 包含關閉狀態
    """

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
