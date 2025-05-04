#-----------------------
# 匯入必要模組
#-----------------------
from flask import Flask, render_template
from flask_login import LoginManager, current_user  # 用於處理使用者登入功能
from utils import db  # 匯入資料庫工具
from datetime import datetime

#-----------------------
# **匯入藍圖
#-----------------------
from services.user import user_bp  # 匯入使用者相關的藍圖
from services.user import load_user as user_load_user  # 匯入使用者載入函數
from services.diary import diary_bp  # 匯入日記相關的藍圖
from services.admin import admin_bp

#-----------------------
# 產生 Flask 網站物件
#-----------------------
app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # 設定應用程式的密鑰，用於session加密


#-------------------------
# **註冊藍圖的服務
#-------------------------
app.register_blueprint(user_bp, url_prefix='/user')  # 註冊使用者藍圖，路由前綴為/user
app.register_blueprint(diary_bp, url_prefix='/diary')  # 註冊日記藍圖，路由前綴為/diary
app.register_blueprint(admin_bp, url_prefix='/admin')  # 註冊後台藍圖，路由前綴為/admin

#-----------------------
# 初始化 Flask-Login
#-----------------------
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

#-----------------------
# 啟動網站
#-----------------------
if __name__ == '__main__':
    app.run(debug=True)  # 以除錯模式啟動應用程式