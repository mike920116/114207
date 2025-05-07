"""使用者端 AI 聊天（整合 Dify + 聊天記錄 + 呼叫真人客服 + WebSocket）"""

import os, requests
import logging # 新增 logging 模組
from flask import Blueprint, render_template, request, jsonify, current_app
from flask_login import login_required, current_user
from utils import db

ai_chat_bp = Blueprint("ai_chat", __name__, url_prefix="/ai")

# 🔌 Dify 設定
DIFY_API_URL = os.getenv("DIFY_API_URL", "https://api.dify.ai/v1/chat-messages")
DIFY_KEY     = os.getenv("DIFY_API_KEY_For_Chat")
HEADERS = {
    "Authorization": f"Bearer {DIFY_KEY}",
    "Content-Type": "application/json"
}

def get_socketio():
    return current_app.extensions.get("socketio")


# 取得或建立會話
def _get_or_create_session():
    conn = db.get_connection()
    cur  = conn.cursor()
    cur.execute("SELECT session_id FROM AIChatSessions WHERE user_email=%s AND is_open=1", (current_user.id,))
    row = cur.fetchone()
    if row:
        session_id = row[0]
    else:
        cur.execute("INSERT INTO AIChatSessions(user_email) VALUES (%s)", (current_user.id,))
        session_id = cur.lastrowid
        conn.commit()
    conn.close()
    return session_id


@ai_chat_bp.route("/chat")
@login_required
def chat_page():
    return render_template("ai/ai_chat.html")


@ai_chat_bp.route("/chat/api", methods=["POST"])
@login_required
def chat_api():
    req = request.get_json(silent=True) or {}
    query = req.get("query", "").strip()
    if not query:
        return jsonify({"reply": "請輸入內容"}), 400

    session_id = _get_or_create_session()

    # 在這裡就先檢查是否為客服模式
    is_paused = session_id in current_app.dify_paused_sessions
    logging.info(f"Session ID {session_id} is in dify_paused_sessions: {is_paused}")
    
    # 檢查資料庫中的 need_human 狀態以雙重確認
    conn = db.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT need_human FROM AIChatSessions WHERE session_id=%s", (session_id,))
    need_human_in_db = cur.fetchone()[0] == 1  # 轉換為布爾值
    logging.info(f"Session ID {session_id} has need_human=1 in database: {need_human_in_db}")
    
    # 記錄使用者訊息到資料庫
    cur.execute("INSERT INTO AIChatLogs(session_id,role,message) VALUES (%s,'user',%s)", (session_id, query))
    conn.commit()

    # 若資料庫顯示需要人工客服但不在暫停集合中，將其加入
    if need_human_in_db and not is_paused:
        current_app.dify_paused_sessions.add(session_id)
        is_paused = True
        logging.info(f"Added session ID {session_id} to dify_paused_sessions based on database need_human flag")

    # 廣播使用者訊息給所有訂閱者（包括管理員）
    socketio = get_socketio()
    if socketio:
        socketio.emit("msg_added", {
            "session_id": session_id,
            "role": "user",
            "message": query,
            "email": current_user.id
        }, namespace="/chat")

    # 檢查是否為真人客服模式 (任一條件成立即認為是)
    if is_paused or need_human_in_db:
        conn.close()
        logging.info(f"Skipping Dify API call for session {session_id} - in customer service mode")
        return jsonify({"reply": "", "session_id": session_id})  # 空回覆，使用者前端不會顯示任何系統訊息

    # 非客服模式，確認可以呼叫 Dify API
    logging.info(f"Proceeding with Dify API call for session {session_id} - not in customer service mode")
    payload = {
        "inputs": {},
        "query": query,
        "response_mode": "blocking",
        "conversation_id": "",
        "user": current_user.id,
    }
    
    try:
        r = requests.post(DIFY_API_URL, headers=HEADERS, json=payload, timeout=30)
        reply = r.json().get("answer", "（AI 無回應）")
    except Exception as e:
        reply = f"⚠️ AI 服務異常：{e}"
        logging.error(f"Error calling Dify API: {e}")

    # 記錄 AI 回覆到資料庫
    cur.execute("INSERT INTO AIChatLogs(session_id,role,message) VALUES (%s,'ai',%s)", (session_id, reply))
    conn.commit()
    conn.close()

    # 廣播 AI 回覆
    if socketio:
        socketio.emit("msg_added", {
            "session_id": session_id,
            "role": "ai",
            "message": reply,
            "email": current_user.id
        }, namespace="/chat")

    return jsonify({"reply": reply, "session_id": session_id})


@ai_chat_bp.route("/chat/api/call_services", methods=["POST"])
@login_required
def call_human():
    session_id = _get_or_create_session()
    conn = db.get_connection()
    cur = conn.cursor()
    
    # 更新資料庫狀態
    cur.execute("UPDATE AIChatSessions SET need_human=1 WHERE session_id=%s", (session_id,))
    conn.commit()
    
    # 在請求協助頁面加入使用者訊息
    help_message = "我需要真人客服協助，謝謝！"
    cur.execute("INSERT INTO AIChatLogs(session_id,role,message) VALUES (%s,'user',%s)", (session_id, help_message))
    conn.commit()
    conn.close()

    # 將 session_id 加入到暫停集合中
    current_app.dify_paused_sessions.add(session_id)
    logging.info(f"Session {session_id} added to dify_paused_sessions.")

    # 廣播訊息給管理員
    socketio = get_socketio()
    if socketio:
        # 廣播使用者的求助訊息
        socketio.emit("msg_added", {
            "session_id": session_id,
            "role": "user",
            "message": help_message,
            "email": current_user.id
        }, namespace="/chat")
        
        # 通知管理員有新的求助請求
        event_data = {
            "session_id": session_id,
            "email": current_user.id
        }
        logging.info(f"準備發送 need_human 事件: {event_data}")
        socketio.emit("need_human", event_data, namespace="/chat")
        logging.info("need_human 事件已發送")
    else:
        logging.warning("無法獲取 socketio 實例，無法發送 need_human 事件")

    return jsonify({
        "message": "已通知真人客服",
        "session_id": session_id  # 確保回傳 session_id
    })


@ai_chat_bp.route("/chat/api/close_session", methods=["POST"])
@login_required
def close_session():
    conn = db.get_connection()
    cur  = conn.cursor()
    cur.execute("SELECT session_id FROM AIChatSessions WHERE user_email=%s AND is_open=1", (current_user.id,))
    row = cur.fetchone()
    if row:
        sid = row[0]
        cur.execute("DELETE FROM AIChatLogs WHERE session_id=%s", (sid,))
        cur.execute("DELETE FROM AIChatSessions WHERE session_id=%s", (sid,))
        conn.commit()
    conn.close()
    return jsonify({"status": "closed"})
