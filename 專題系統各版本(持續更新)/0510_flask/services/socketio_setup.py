"""
Socket.IO 初始化與事件處理模組
放置路徑：services/socketio_setup.py
"""

from flask_socketio import SocketIO
from flask import request, current_app
from utils import db

socketio = SocketIO(
    async_mode="eventlet",
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

def init_socketio(app):
    """綁定 SocketIO 到 Flask app，並註冊所有事件"""
    socketio.init_app(app)
    app.extensions['socketio'] = socketio   # 供其他模組使用

    # ───────────────────────── connect
    @socketio.on('connect', namespace='/chat')
    def handle_chat_connect(auth=None):
        current_app.logger.info(
            f"[WS] connect /chat  sid={request.sid}  auth={auth}")
        return True   # 允許連線

    # ───────────────────────── subscribe
    @socketio.on('subscribe_to_session', namespace='/chat')
    def handle_subscribe(data):
        sid        = request.sid
        session_id = data.get('session_id')

        if not session_id:
            current_app.logger.error("[WS] subscribe 無 session_id")
            return

        # 若同一個 SID 之前訂閱過別的 session，先清理
        prev = current_app.active_chat_connections.get(sid)
        if prev and prev != session_id:
            current_app.session_id_to_sids[prev].discard(sid)
            if not current_app.session_id_to_sids[prev]:
                current_app.session_id_to_sids.pop(prev)

        current_app.active_chat_connections[sid] = session_id
        current_app.session_id_to_sids.setdefault(session_id, set()).add(sid)

        current_app.logger.info(
            f"[WS] sid={sid} 訂閱 session={session_id}  "
            f"目前連線數={len(current_app.session_id_to_sids[session_id])}"
        )

    # ───────────────────────── disconnect
    @socketio.on('disconnect', namespace='/chat')
    def handle_chat_disconnect():
        sid = request.sid
        session_id = current_app.active_chat_connections.pop(sid, None)
        current_app.logger.info(f"[WS] disconnect sid={sid} session={session_id}")

        # 從映射中移除 sid
        if session_id:
            sids = current_app.session_id_to_sids.get(session_id)
            if sids:
                sids.discard(sid)
                if not sids:
                    current_app.session_id_to_sids.pop(session_id, None)
                    _delete_chat_session(session_id)

    # ───────────────────────── send_message (default namespace)
    @socketio.on('send_message')
    def handle_send_message(data):
        current_app.logger.info(f"[WS] default send_message: {data}")
        socketio.emit('receive_message', data, broadcast=True)

# ──────────────────────────────────────────────────────────────
#                      Helper  Function
# ──────────────────────────────────────────────────────────────
def _delete_chat_session(session_id:str):
    """資料庫與緩存清理"""
    conn = None
    try:
        conn = db.get_connection()
        cur  = conn.cursor()

        cur.execute("SELECT need_human, user_email FROM AIChatSessions WHERE session_id=%s",
                    (session_id,))
        result = cur.fetchone()

        if result and result[0] == 1:   # need_human = 1
            email = result[1] or "未知使用者"
            socketio.emit("user_left", {
                "session_id": session_id,
                "email": email,
                "message": f"使用者 {email} 已離開聊天"
            }, namespace="/chat")

        # 刪除 DB 紀錄
        cur.execute("DELETE FROM AIChatLogs WHERE session_id=%s", (session_id,))
        cur.execute("DELETE FROM AIChatSessions WHERE session_id=%s", (session_id,))
        conn.commit()
        current_app.logger.info(f"[WS] 已刪除 session {session_id} 的聊天紀錄")

    except Exception as e:
        if conn: conn.rollback()
        current_app.logger.error(f"[WS] 刪除 session {session_id} 時出錯: {e}")

    finally:
        if conn: conn.close()

    # 移除暫停清單
    current_app.dify_paused_sessions.discard(session_id)
