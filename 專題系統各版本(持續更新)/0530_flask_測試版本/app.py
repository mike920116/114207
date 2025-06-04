import eventlet
eventlet.monkey_patch()

from socketio import WSGIApp
import os, logging
from datetime import datetime
from flask import Flask, render_template
from flask_login import LoginManager, current_user

# ─── 配置和自訂模組 ─────────────────────────────
from config import get_config
from utils import db
from services.socketio_setup import socketio, init_socketio   # ← 新增
from services.user import user_bp, load_user as user_load_user
from services.user.settings import settings_bp
from services.diary import diary_bp
from services.admin.admin import admin_bp
from services.admin.admin_chat import admin_chat_bp
from services.ai.ai_chat import ai_chat_bp
# ─────────────────────────────────────────

# ── 建立 Flask App ────────────────────────
app = Flask(__name__)

# 載入配置
config_class = get_config()
app.config.from_object(config_class)
app.secret_key = config_class.SECRET_KEY

# 驗證配置(正式完成後需移除)
config_errors = config_class.validate_config()
if config_errors:
    print("⚠️ 配置錯誤:")
    for error in config_errors:
        print(f"  - {error}")
    print("請檢查 .env 檔案中的設定")

# Socket 相關資料結構（供事件處理共用）
app.dify_paused_sessions = set()
app.active_chat_connections = {}      # sid -> session_id
app.session_id_to_sids   = {}         # session_id -> set(sid)

# 初始化 SocketIO（並把事件綁進 app）
init_socketio(app)

# ── 註冊 Blueprint ────────────────────────
app.register_blueprint(admin_bp,        url_prefix="/admin")
app.register_blueprint(admin_chat_bp,   url_prefix="/admin/chat")
app.register_blueprint(ai_chat_bp,      url_prefix="/ai")
app.register_blueprint(user_bp,         url_prefix="/user")
app.register_blueprint(diary_bp,        url_prefix="/diary")
app.register_blueprint(settings_bp,     url_prefix="/settings")

# ── 登入系統 ──────────────────────────────
login_manager = LoginManager(app)
login_manager.login_view = '/user/login/form'
login_manager.login_message = '請先登入'

@login_manager.user_loader
def load_user(user_id):
    return user_load_user(user_id)

# ── 首頁 ───────────────────────────────────
@app.route('/')
def index():
    return render_template(
        'index.html',
        message=f'歡迎使用者 {current_user.username}' if current_user.is_authenticated else '目前未登入',
        is_authenticated=current_user.is_authenticated
    )

# ── 全域模板參數 ───────────────────────────
@app.context_processor
def inject_today_date():
    return {'today_date': datetime.now().strftime('%Y-%m-%d')}

os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    filename="logs/app.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s"
)

# ── 啟動 ───────────────────────────────────

if __name__ == '__main__':
    # 綁定到 0.0.0.0 讓其他設備可以訪問
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
else:
    application = app