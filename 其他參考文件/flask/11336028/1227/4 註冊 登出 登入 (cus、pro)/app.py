#-----------------------
# 匯入必要模組
#-----------------------
from flask import Flask, render_template
from flask_login import LoginManager, current_user
from utils import db

#-----------------------
# 匯入藍圖與函數
#-----------------------
from services.customer import customer_bp
from services.product import product_bp
from services.user import user_bp, load_user
from services.assistant import assistant_bp

#-----------------------
# 產生 Flask 網站物件
#-----------------------
app = Flask(__name__)
app.secret_key = 'my_secret_key'

#-------------------------
# 在主程式註冊服務
#-------------------------
app.register_blueprint(customer_bp, url_prefix='/customer')
app.register_blueprint(user_bp, url_prefix='/user')
app.register_blueprint(product_bp, url_prefix='/product')
app.register_blueprint(assistant_bp, url_prefix='/assistant')
#-----------------------
# 初始化 Flask-Login
#-----------------------
login_manager = LoginManager(app)
login_manager.login_view = '/user/login/form'  # 未登入時的重導頁面

#-----------------------
# 載入使用者
#-----------------------
@login_manager.user_loader
def load_user_wrapper(user_id):
    return load_user(user_id)

#-----------------------
# 路由設定
#-----------------------
@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template('index.html', message=f'歡迎使用者 {current_user.username}')
    else:
        return render_template('index.html', message='目前未登入')

#-----------------------
# 啟動網站
#-----------------------
if __name__ == '__main__':
    app.run(debug=True)
