"""
心理健康日記 Flask 應用程式主檔案

這是一個多功能的心理健康日記平台，包含以下核心功能：
- 用戶註冊/登入系統
- 個人日記管理
- AI 聊天輔導
- 管理員後台
- 社交互動功能
- LINE Bot 整合
- 即時通訊（Socket.IO）

啟動方式：python app.py
"""

import eventlet
eventlet.monkey_patch()

from socketio import WSGIApp
import os, logging
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, render_template
from flask_login import LoginManager, current_user

# ─── 自訂模組 ─────────────────────────────
from services.socketio_manager import socketio, init_socketio
from services.user import user_bp, load_user as user_load_user, settings_bp
from services.diary import diary_bp
from services.admin import admin_bp, admin_chat_bp, admin_announcement_bp
from services.ai import ai_chat_bp
from services.line import line_webhook_bp
from services.support import support_bp
from services.social import social_bp
from services.announcement import announcement_bp
# ─────────────────────────────────────────

load_dotenv()

# ── 建立 Flask App ────────────────────────
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")

# 設定 Flask 編碼
app.config['JSON_AS_ASCII'] = False
app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'

# Socket 相關資料結構（供事件處理共用）
# 用於管理 AI 聊天暫停狀態和連線狀態
app.dify_paused_sessions = set()        # 存放暫停的 AI 對話 session
app.active_chat_connections = {}        # sid -> session_id 映射
app.session_id_to_sids   = {}          # session_id -> set(sid) 映射

# 初始化 SocketIO（並把事件綁進 app）
init_socketio(app)

# ── 註冊 Blueprint ────────────────────────
app.register_blueprint(admin_bp,        url_prefix="/admin")
app.register_blueprint(admin_chat_bp,   url_prefix="/admin/chat")
app.register_blueprint(ai_chat_bp,      url_prefix="/ai")
app.register_blueprint(user_bp,         url_prefix="/user")
app.register_blueprint(diary_bp,        url_prefix="/diary")
app.register_blueprint(settings_bp,     url_prefix="/settings")
app.register_blueprint(support_bp,      url_prefix="/support") 
app.register_blueprint(line_webhook_bp)
app.register_blueprint(social_bp,       url_prefix="/social")
app.register_blueprint(announcement_bp)               # frontend API
app.register_blueprint(admin_announcement_bp)         # admin CRUD

# ── 登入系統 ──────────────────────────────
login_manager = LoginManager(app)
login_manager.login_view = '/user/login/form'
login_manager.login_message = '請先登入'

@login_manager.user_loader
def load_user(user_id):
    """
    Flask-Login 用戶載入回調函數
    
    Args:
        user_id (str): 用戶 ID
        
    Returns:
        User: 用戶物件，如果找不到則返回 None
    """
    return user_load_user(user_id)

# ── 首頁 ───────────────────────────────────
@app.route('/')
def index():
    """
    應用程式首頁
    
    顯示歡迎訊息，根據用戶登入狀態顯示不同內容
    
    Returns:
        str: 渲染後的 HTML 頁面
    """
    return render_template(
        'index.html',
        message=f'歡迎使用者 {current_user.username}' if current_user.is_authenticated else '目前未登入',
        is_authenticated=current_user.is_authenticated
    )

# ── 全域模板參數 ───────────────────────────
@app.context_processor
def inject_today_date():
    """
    全域模板變數注入器
    
    為所有模板提供今日日期變數，格式為 YYYY-MM-DD
    
    Returns:
        dict: 包含 today_date 的字典
    """
    return {'today_date': datetime.now().strftime('%Y-%m-%d')}

os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    filename="logs/app.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s"
)

# ── 啟動 ───────────────────────────────────

if __name__ == '__main__':
    socketio.run(app, debug=True)
else:
    # 生產環境：包裝 Socket.IO 以支援 WSGI 部署
    application = WSGIApp(socketio, app)