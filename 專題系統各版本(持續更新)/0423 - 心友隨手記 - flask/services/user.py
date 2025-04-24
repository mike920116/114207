from flask import Blueprint, render_template, request, redirect
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import bcrypt
from utils import db
from datetime import datetime

#建立使用者藍圖
user_bp = Blueprint('user', __name__)

#定義使用者類別
class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id  # 使用者Email作為ID
        self.username = username  # 使用者名稱
        self.password = password  # 加密後的密碼

    def get_id(self):
        return self.id

#建立登入管理器實例
login_manager = LoginManager()

#使用者載入函數
@login_manager.user_loader
def load_user(user_id):
    # 從資料庫查詢使用者資料
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT User_Email, User_name, password_hash FROM user WHERE User_Email = %s", (user_id,))
    result = cursor.fetchone()
    conn.close()

    # 如果找到使用者則返回使用者物件
    if result:
        return User(id=result[0], username=result[1], password=result[2])
    return None

#宣告註冊畫面
@user_bp.route('/signup/form')
def user_signup_form():
    return render_template('user/signup_form.html')

#使用者註冊
@user_bp.route('/signup', methods=['POST'])
def signup():
    try:
        # 取得表單資料
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password1')
        
        # 檢查確認密碼
        password2 = request.form.get('password2')
        if password != password2:
            return render_template('user/signup.html', success=False, message="兩次密碼輸入不一致")

        # 密碼加密
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # 生成時間戳
        current_time = datetime.now()

        # 將使用者資料寫入資料庫
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user (User_Email, User_name, password_hash, Is_Anonymous, Created_at, Updated_at) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (email, username, hashed_password, 0, current_time, current_time))
        conn.commit()
        conn.close()

        return render_template('user/signup.html', success=True)
    except Exception as e:
        return render_template('user/signup.html', success=False, message=f"發生錯誤: {str(e)}")

#宣告登入畫面
@user_bp.route('/login/form')
def user_login_form():
    return render_template('user/login_form.html')

#使用者登入
@user_bp.route('/login', methods=['POST'])
def login():
    try:
        # 取得表單資料
        email = request.form.get('email')
        password = request.form.get('password')

        # 查詢使用者資料
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT User_Email, User_name, password_hash FROM user WHERE User_Email = %s", (email,))
        result = cursor.fetchone()
        conn.close()

        # 驗證使用者
        if result is None:
            return render_template('user/login_form.html', error_message="帳號不存在")

        user_email, username, hashed_password = result[0], result[1], result[2].encode('utf-8')

        # 驗證密碼
        if bcrypt.checkpw(password.encode('utf-8'), hashed_password):
            user = User(id=user_email, username=username, password=hashed_password)
            login_user(user)  # 登入使用者
            return redirect('/')
        else:
            return render_template('user/login_form.html', error_message="密碼錯誤")

    except Exception as e:
        return render_template('user/login_form.html', error_message=f"發生錯誤: {str(e)}")

#使用者登出
@user_bp.route('/logout')
@login_required  # 需要登入才能存取
def logout():
    logout_user()  # 登出使用者
    return redirect('/user/login/form')