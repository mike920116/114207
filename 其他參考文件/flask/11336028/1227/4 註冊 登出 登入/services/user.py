from flask import Blueprint, render_template, request, redirect
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import bcrypt
from utils import db

# 建立 Blueprint
user_bp = Blueprint('user', __name__)

# 使用者類別
class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

# Flask-Login 的 LoginManager
login_manager = LoginManager()

# 載入使用者
@login_manager.user_loader
def load_user(user_id):
    # 從資料庫取得使用者資料
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT userno, username, password FROM user WHERE userno = %s", (user_id,))
    result = cursor.fetchone()
    conn.close()

    if result:
        return User(id=result[0], username=result[1], password=result[2])
    return None

# 註冊畫面
@user_bp.route('/signup/form')
def user_signup_form():
    return render_template('user/signup_form.html')

# 使用者註冊
@user_bp.route('/signup', methods=['POST'])
def signup():
    try:
        # 取得使用者的輸入值
        userno = request.form.get('userno')
        username = request.form.get('username')
        password = request.form.get('password1')

        # 加密密碼
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # 寫入資料庫
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO user (userno, username, password) VALUES (%s, %s, %s)",
                       (userno, username, hashed_password))
        conn.commit()
        conn.close()

        return render_template('user/signup.html', success=True)
    except Exception as e:
        return render_template('user/signup.html', success=False, message=f"發生錯誤: {str(e)}")

# 登入畫面
@user_bp.route('/login/form')
def user_login_form():
    return render_template('user/login_form.html')

# 使用者登入
@user_bp.route('/login', methods=['POST'])
def login():
    try:
        # 取得使用者的輸入值
        userno = request.form.get('userno')
        password = request.form.get('password')

        # 取得資料庫連線
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT userno, username, password FROM user WHERE userno = %s", (userno,))
        result = cursor.fetchone()
        conn.close()

        if result is None:
            return render_template('user/login.html', success=False, message="帳號不存在")

        username, hashed_password = result[1], result[2].encode('utf-8')

        if bcrypt.checkpw(password.encode('utf-8'), hashed_password):
            user = User(id=userno, username=username, password=hashed_password)
            login_user(user)  # Flask-Login 登入
            return redirect('/')
        else:
            return render_template('user/login.html', success=False, message="密碼錯誤")

    except Exception as e:
        return render_template('user/login.html', success=False, message=f"發生錯誤: {str(e)}")

# 使用者登出
@user_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/user/login/form')