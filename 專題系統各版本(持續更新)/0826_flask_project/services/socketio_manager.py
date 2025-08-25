"""
Socket.IO 初始化與事件處理模組
路徑：services/socketio_manager.py

2025-05-16  update:  統一 session_id 為 str
2025-05-17  fix   :  _delete_chat_session() 以 int 查 DB
2025-05-18  feat  :  區分 user / admin 連線；user 斷線即廣播離開
"""

from flask_socketio import SocketIO
from flask import request, current_app
from utils import db

socketio = SocketIO(
    async_mode="eventlet",
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True,
)

# ───────────────────────── helper
def to_str(v):
    """將任何值轉成字串（None → None）"""
    return str(v) if v is not None else None

# sid → "user" / "admin"
SID_ROLES = {}

# ───────────────────────── init
def init_socketio(app):
    """綁定 SocketIO 到 Flask app，並註冊所有事件"""
    socketio.init_app(app)
    app.extensions["socketio"] = socketio   # 供其他模組使用

    # ─────────────────────── connect
    @socketio.on("connect", namespace="/chat")
    def handle_chat_connect(auth=None):
        current_app.logger.info(f"[WS] connect sid={request.sid}")
        return True   # 允許連線

    # ─────────────────────── subscribe
    @socketio.on("subscribe_to_session", namespace="/chat")
    def handle_subscribe(socket_data):
        sid         = request.sid
        raw_id      = socket_data.get("session_id")
        role        = socket_data.get("role") or "unknown"     # 前端需帶入
        session_id  = to_str(raw_id)

        if not session_id:
            current_app.logger.error("[WS] subscribe 無 session_id")
            return

        # 清前一個訂閱
        prev = current_app.active_chat_connections.get(sid)
        if prev and prev != session_id:
            current_app.session_id_to_sids.get(prev, set()).discard(sid)
            if not current_app.session_id_to_sids.get(prev):
                current_app.session_id_to_sids.pop(prev, None)

        # 建立新記錄
        current_app.active_chat_connections[sid] = session_id
        current_app.session_id_to_sids.setdefault(session_id, set()).add(sid)
        SID_ROLES[sid] = role

        current_app.logger.info(
            f"[WS] sid={sid} ({role}) 訂閱 session={session_id} "
            f"在線人數={len(current_app.session_id_to_sids[session_id])}"
        )

    # ─────────────────────── disconnect
    @socketio.on("disconnect", namespace="/chat")
    def handle_chat_disconnect():
        sid        = request.sid
        session_id = current_app.active_chat_connections.pop(sid, None)
        role       = SID_ROLES.pop(sid, "unknown")
        current_app.logger.info(f"[WS] disconnect sid={sid} role={role} session={session_id}")

        if session_id:
            sids = current_app.session_id_to_sids.get(session_id, set())
            sids.discard(sid)

            # 若 user 端斷線且還有 admin 在線 → 廣播離開 & 關閉會話
            if role == "user":
                _broadcast_user_left(session_id)
                _close_session(session_id)

            # 房間已空 → 刪除整個會話
            if not sids:
                current_app.session_id_to_sids.pop(session_id, None)
                _delete_chat_session(session_id)

    # ─────────────────────── send_message (default namespace)
    @socketio.on("send_message")
    def handle_send_message(socket_data):
        current_app.logger.info(f"[WS] default send_message: {socket_data}")
        socketio.emit("receive_message", socket_data, broadcast=True)


# ──────────────────────────────────────────────────────────────
#                      Helper  Function
# ──────────────────────────────────────────────────────────────
def _broadcast_user_left(session_id: str):
    """向所有管理端廣播使用者已離開"""
    database_connection = db.get_connection()
    database_cursor  = database_connection.cursor()
    database_cursor.execute(
        "SELECT user_email FROM AIChatSessions WHERE session_id=%s",
        (int(session_id),)
    )
    row   = database_cursor.fetchone()
    email = row[0] if row else "未知使用者"
    database_connection.close()

    socketio.emit(
        "user_left",
        {
            "session_id": to_str(session_id),
            "email"     : email,
            "message"   : f"使用者 {email} 已離開聊天",
        },
        namespace="/chat",
    )

def _close_session(session_id: str):
    """標記該 session 已關閉 (is_open = 0)"""
    database_connection = db.get_connection()
    database_cursor  = database_connection.cursor()
    database_cursor.execute("UPDATE AIChatSessions SET is_open = 0 WHERE session_id=%s",
                (int(session_id),))
    database_connection.commit()
    database_connection.close()

def _delete_chat_session(session_id: str):
    """
    移除過期會話：
    1. 刪 DB
    2. 清緩存
    """
    room    = to_str(session_id)
    sid_int = int(session_id)

    database_connection = None
    try:
        database_connection = db.get_connection()
        database_cursor  = database_connection.cursor()

        database_cursor.execute(
            "SELECT need_human, user_email "
            "FROM AIChatSessions WHERE session_id=%s",
            (sid_int,),
        )
        session_query_result = database_cursor.fetchone()

        if session_query_result and session_query_result[0] == 1:
            email = session_query_result[1] or "未知使用者"
            socketio.emit(
                "user_left",
                {
                    "session_id": room,
                    "email": email,
                    "message": f"使用者 {email} 已離開聊天",
                },
                namespace="/chat",
            )

        # 刪除 DB 紀錄
        database_cursor.execute("DELETE FROM AIChatLogs WHERE session_id=%s", (sid_int,))
        database_cursor.execute("DELETE FROM AIChatSessions WHERE session_id=%s", (sid_int,))
        database_connection.commit()
        current_app.logger.info(f"[WS] 已刪除 session {session_id} 的聊天紀錄")

    except Exception as e:
        if database_connection:
            database_connection.rollback()
        current_app.logger.error(f"[WS] 刪除 session {session_id} 時出錯: {e}")

    finally:
        if database_connection:
            database_connection.close()

    current_app.dify_paused_sessions.discard(session_id)
