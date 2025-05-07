import eventlet
eventlet.monkey_patch()

#-----------------------
# 匯入必要模組
#-----------------------
from flask import Flask, render_template, request, current_app # 確保 current_app 已匯入
from flask_login import LoginManager, current_user  # 用於處理使用者登入功能
from utils import db  # 匯入資料庫工具 # <--- 確認 db 已在此處匯入
from datetime import datetime
from flask_socketio import SocketIO
import logging

#-----------------------
# 用於載入環境變數
#-----------------------
import os                      # 系統環境變數
from dotenv import load_dotenv # 載入環境變數
load_dotenv()
#-----------------------
# **匯入藍圖
#-----------------------
from services.user import user_bp , load_user as user_load_user  # 匯入使用者藍圖、載入函數
from services.diary import diary_bp  # 匯入日記相關的藍圖
from services.admin.admin import admin_bp
from services.admin.admin_chat import admin_chat_bp  
from services.settings import settings_bp  # 匯入設定相關的藍圖
from services.ai.ai_chat import ai_chat_bp
#-----------------------
# 產生 Flask 網站物件
#-----------------------
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")  # 設定應用程式的密鑰，用於session加密

# 修改：將 dify_paused_sessions 初始化為 app 的屬性
app.dify_paused_sessions = set()
app.active_chat_connections = {}  # Maps Socket.IO SID to a chat session_id
app.session_id_to_sids = {}     # Maps a chat session_id to a set of Socket.IO SIDs

# 只保留一次 SocketIO 初始化，並確保 async_mode 和 cors_allowed_origins 正確設定
# 啟用更詳細的日誌記錄 logger=True, engineio_logger=True
socketio = SocketIO(app, async_mode="eventlet", cors_allowed_origins="*", logger=True, engineio_logger=True)
app.extensions['socketio'] = socketio  # 新增這行，讓其他檔案可以透過 current_app 使用 socketio

#-------------------------
# **註冊藍圖的服務
#-----------------------
app.register_blueprint(admin_bp,url_prefix="/admin")            # admin.py   內含 /admin
app.register_blueprint(admin_chat_bp, url_prefix="/admin/chat")
app.register_blueprint(ai_chat_bp,url_prefix="/ai")             # ai_chat.py 內含 /ai/chat
app.register_blueprint(user_bp, url_prefix='/user')             # 註冊使用者藍圖，路由前綴為/user
app.register_blueprint(diary_bp, url_prefix='/diary')           # 註冊日記藍圖，路由前綴為/diary
app.register_blueprint(settings_bp, url_prefix='/settings')     # 註冊設定藍圖，路由前綴為/settings
#-----------------------
# 初始化 Flask-Login
login_manager = LoginManager(app)
login_manager.login_view = '/user/login/form'  # 設定未登入時重導向的頁面
login_manager.login_message = '請先登入'  # 設定未登入時的提示訊息

#-----------------------
# 載入使用者
#-----------------------
@login_manager.user_loader
def load_user(user_id):
    return user_load_user(user_id)  # 根據使用者ID載入使用者資料

#-----------------------
# 設定主畫面路由
#-----------------------
@app.route('/')
def index():
    return render_template(
        'index.html',
        message=f'歡迎使用者 {current_user.username}' if current_user.is_authenticated else '目前未登入',
        is_authenticated=current_user.is_authenticated  # 這個要傳入
    )


#-----------------------
# 全域模板參數
#-----------------------
@app.context_processor
def inject_today_date():
    return {'today_date': datetime.now().strftime('%Y-%m-%d')}

logging.basicConfig(level=logging.INFO)

#-----------------------
# WebSocket 事件處理
#-----------------------
@socketio.on('connect', namespace='/chat')
def handle_chat_connect(auth=None): # 新增 auth=None 參數
    # 使用 current_app.logger 或 logging
    current_app.logger.info(f"Client attempting to connect to /chat namespace. SID: {request.sid}. Auth: {auth}")
    return True # Explicitly allow connection

@socketio.on('subscribe_to_session', namespace='/chat')
def handle_subscribe_to_session(data):
    sid = request.sid
    session_id = data.get('session_id')
    # user_email = current_user.id if hasattr(current_user, 'id') else 'Anonymous' # Requires Flask-Login context in SocketIO

    if not session_id:
        current_app.logger.error(f"SID {sid} tried to subscribe without session_id.")
        return

    # Attempt to get user_email for logging, handle if current_user is not available or not authenticated
    user_display = 'UnknownUser'
    if 'current_user' in globals() and hasattr(current_user, 'is_authenticated') and current_user.is_authenticated:
        user_display = current_user.id
    
    current_app.logger.info(f"SID {sid} (User: {user_display}) attempting to subscribe to session_id {session_id}.")

    # If this SID was previously subscribed to another session, clean up old subscription
    previous_session_id = current_app.active_chat_connections.get(sid)
    if previous_session_id and previous_session_id != session_id:
        if previous_session_id in current_app.session_id_to_sids:
            current_app.session_id_to_sids[previous_session_id].discard(sid)
            current_app.logger.info(f"SID {sid} removed from old session_id {previous_session_id}'s SID list.")
            if not current_app.session_id_to_sids[previous_session_id]:
                del current_app.session_id_to_sids[previous_session_id]
                current_app.logger.info(f"Old session_id {previous_session_id} has no more SIDs, removing from session_id_to_sids map.")
    
    current_app.active_chat_connections[sid] = session_id
    current_app.session_id_to_sids.setdefault(session_id, set()).add(sid)
    current_app.logger.info(f"SID {sid} successfully subscribed to session_id {session_id}. Active SIDs for this session: {len(current_app.session_id_to_sids[session_id])}")

@socketio.on('disconnect', namespace='/chat')
def handle_chat_disconnect():
    disconnected_sid = request.sid
    current_app.logger.info(f"Client disconnected from /chat namespace. SID: {disconnected_sid}.")

    session_id_to_check = current_app.active_chat_connections.pop(disconnected_sid, None)

    if session_id_to_check:
        current_app.logger.info(f"Socket.IO SID {disconnected_sid} was associated with chat session_id {session_id_to_check}.")

        # 查詢資料庫確認此會話和用戶信息
        conn = None
        try:
            conn = db.get_connection()
            cur = conn.cursor()
            cur.execute("SELECT need_human, user_email FROM AIChatSessions WHERE session_id = %s", (session_id_to_check,))
            result = cur.fetchone()
            
            if result and result[0] == 1:  # need_human = 1，表示這是需要人工客服的會話
                user_email = result[1] if result[1] else "未知使用者"
                
                # 發送離開通知給所有連接到聊天的客戶端
                socketio = current_app.extensions.get("socketio")
                if socketio:
                    current_app.logger.info(f"準備發送用戶離開通知，用戶: {user_email}, 會話ID: {session_id_to_check}")
                    socketio.emit("user_left", {
                        "session_id": session_id_to_check,
                        "email": user_email,
                        "message": f"使用者 {user_email} 已離開聊天"
                    }, namespace="/chat")
                    current_app.logger.info(f"已發送用戶離開通知")
        except Exception as e:
            current_app.logger.error(f"查詢資料庫或發送通知時發生錯誤: {e}")
        finally:
            if conn:
                conn.close()

        # 處理遺留的 SID-會話 關聯
        sids_for_session = current_app.session_id_to_sids.get(session_id_to_check)
        if sids_for_session:
            sids_for_session.discard(disconnected_sid)
            current_app.logger.info(f"Removed SID {disconnected_sid} from session_id {session_id_to_check}. Remaining SIDs for session: {len(sids_for_session)}")

            if not sids_for_session:  # No more SIDs for this session_id
                current_app.logger.info(f"No more SIDs for session_id {session_id_to_check}. Proceeding with deletion of chat data.")
                # Remove the session_id entry from the map itself
                current_app.session_id_to_sids.pop(session_id_to_check, None)
                
                conn = None
                try:
                    conn = db.get_connection()
                    cur = conn.cursor()
                    
                    current_app.logger.info(f"Deleting logs from AIChatLogs for session_id: {session_id_to_check}")
                    cur.execute("DELETE FROM AIChatLogs WHERE session_id = %s", (session_id_to_check,))
                    
                    current_app.logger.info(f"Deleting session from AIChatSessions for session_id: {session_id_to_check}")
                    cur.execute("DELETE FROM AIChatSessions WHERE session_id = %s", (session_id_to_check,))
                    
                    conn.commit()
                    current_app.logger.info(f"Successfully deleted chat data for session_id: {session_id_to_check}")
                except Exception as e:
                    if conn:
                        conn.rollback()
                    current_app.logger.error(f"Error deleting chat data for session_id {session_id_to_check}: {e}")
                finally:
                    if conn:
                        conn.close()

                # Also remove from dify_paused_sessions if it was there
                current_app.dify_paused_sessions.discard(session_id_to_check)
                current_app.logger.info(f"Removed session_id {session_id_to_check} from dify_paused_sessions if present.")
            else:
                current_app.logger.info(f"Session_id {session_id_to_check} still has {len(sids_for_session)} active SIDs. Not deleting from DB yet.")
        else:
            current_app.logger.warning(f"Session_id {session_id_to_check} not found in session_id_to_sids map during disconnect.")
    else:
        current_app.logger.info(f"Socket.IO SID {disconnected_sid} was not associated with any active chat session_id.")

@socketio.on('send_message') # This is for the default namespace
def handle_send_message(data):
    current_app.logger.info(f"Default namespace received message: {data}")
    socketio.emit('receive_message', data, broadcast=True)

#-----------------------
# 啟動網站
#-----------------------
if __name__ == '__main__':
    socketio.run(app,debug=True)  # 以除錯模式啟動應用程式