from flask import Blueprint, render_template, request, redirect, url_for,current_app
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user
import bcrypt
from utils import db
from datetime import datetime, timedelta
from itsdangerous import URLSafeTimedSerializer
import os,smtplib
from email.header import Header
from email.mime.text import MIMEText
from dotenv import load_dotenv
load_dotenv()

serializer = URLSafeTimedSerializer(os.environ.get("SECRET_KEY", "default_secret"))
user_bp = Blueprint('user', __name__)
login_manager = LoginManager()

# 使用者類別
class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

    def get_id(self):
        return self.id

@login_manager.user_loader
def load_user(user_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT User_Email, User_name, password_hash FROM User WHERE User_Email = %s", (user_id,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return User(id=result[0], username=result[1], password=result[2])
    return None

# 註冊頁面
@user_bp.route('/signup/form')
def user_signup_form():
    return render_template('user/signup_form.html')

# 註冊邏輯
@user_bp.route('/signup', methods=['POST'])
def signup():
    try:
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password1')
        password2 = request.form.get('password2')

        if password != password2:
            return render_template('user/signup.html', success=False)

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM User WHERE User_Email = %s", (email,))
        if cursor.fetchone()[0] > 0:
            return render_template('user/signup.html', success=False)

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        current_time = datetime.now()
        token = serializer.dumps(email, salt="email-confirm")
        expiry = current_time + timedelta(hours=1)

        cursor.execute("""
            INSERT INTO User (
                User_Email, User_name, password_hash, Is_Anonymous,
                email_verification_token, token_expiry, is_verified,
                Created_at, Updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (email, username, hashed_password, 0, token, expiry, 0, current_time, current_time))
        conn.commit()
        conn.close()

        send_verification_email(email, token)
        return render_template("user/signup.html", success=True)
    except Exception as e:
        print(f"[Signup Error] {e}")
        return render_template("user/signup.html", success=False)

# 登入畫面
@user_bp.route('/login/form')
def user_login_form():
    return render_template('user/login_form.html')

# 登入邏輯
@user_bp.route('/login', methods=['POST'])
def login():
    try:
        email = request.form.get('email')
        password = request.form.get('password')

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT User_Email, User_name, password_hash, is_verified
            FROM User
            WHERE User_Email = %s
        """, (email,))
        result = cursor.fetchone()

        if result is None:
            conn.close()
            return render_template('user/login.html', error_message="帳號不存在")

        user_email, username, hashed_password, is_verified = result[0], result[1], result[2].encode('utf-8'), result[3]

        if is_verified != 1:
            conn.close()
            return render_template('user/login.html', error_message="請先完成帳號驗證後再登入")

        if bcrypt.checkpw(password.encode('utf-8'), hashed_password):
            user = User(id=user_email, username=username, password=hashed_password)
            login_user(user)

            # 更新登入時間與IP
            login_time = datetime.now()
            login_ip = request.headers.get("X-Forwarded-For", request.remote_addr) or "未知"
            cursor.execute("""
                UPDATE User SET last_login_time = %s, last_login_ip = %s WHERE User_Email = %s
            """, (login_time, login_ip, email))
            conn.commit()
            conn.close()

            return redirect('/')
        else:
            conn.close()
            return render_template('user/login.html', error_message="密碼錯誤")
    except Exception as e:
        return render_template('user/login.html', error_message=f"發生錯誤: {str(e)}")

# 登出
@user_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/user/login/form')

# 信箱驗證
@user_bp.route("/verify_email/<token>")
def verify_email(token):
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)
    except Exception as e:
        return render_template("user/verify_failed.html", message=f"連結錯誤或過期：{str(e)}")

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT token_expiry FROM User WHERE User_Email = %s", (email,))
    row = cursor.fetchone()
    if not row or row[0] < datetime.now():
        return render_template("user/verify_failed.html", message="驗證連結已過期，請重新註冊")

    cursor.execute("""
        UPDATE User
        SET is_verified = 1, email_verification_token = NULL, token_expiry = NULL
        WHERE User_Email = %s
    """, (email,))
    conn.commit()
    conn.close()

    return render_template("user/verify_success.html")

# 忘記密碼 - 顯示表單
@user_bp.route('/forgot/form')
def forgot_form():
    logout_user()
    return render_template('user/forgot_form.html')

# 忘記密碼 - 寄送重設密碼信
@user_bp.route('/forgot', methods=['POST'])
def forgot_password():
    email = request.form.get('email')
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM User WHERE User_Email = %s", (email,))
    exists = cursor.fetchone()[0] > 0
    conn.close()

    if not exists:
        return render_template("user/forgot_form.html", error_message="找不到該 Email")

    token = serializer.dumps(email, salt="reset-password")
    reset_link = url_for("user.reset_password_form", token=token, _external=True)
    subject = "重設您的密碼"
    body = f"請點擊以下連結重設密碼（1 小時內有效）：\n{reset_link}"

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = os.environ.get("MAIL_DEFAULT_SENDER")
    msg["To"] = email

    try:
        with smtplib.SMTP(os.environ.get("MAIL_SERVER"), int(os.environ.get("MAIL_PORT"))) as server:
            server.starttls()
            server.login(os.environ.get("MAIL_USERNAME"), os.environ.get("MAIL_PASSWORD"))
            server.send_message(msg)
    except Exception as e:
        return render_template("user/forgot_form.html", error_message=f"寄送失敗：{str(e)}")

    return render_template("user/forgot_form.html", success=True)

# 重設密碼 - 表單
@user_bp.route("/reset_password/<token>")
def reset_password_form(token):
    try:
        email = serializer.loads(token, salt="reset-password", max_age=3600)
        return render_template("user/reset_form.html", token=token)
    except Exception as e:
        return render_template("user/verify_failed.html", message="重設連結無效或已過期，請重新申請。")

# 重設密碼 - 提交
@user_bp.route("/reset_password", methods=["POST"])
def reset_password():
    token = request.form.get("token")
    password1 = request.form.get("password1")
    password2 = request.form.get("password2")

    if password1 != password2:
        return render_template("user/reset_form.html", token=token, error_message="兩次密碼不一致")

    try:
        email = serializer.loads(token, salt="reset-password", max_age=3600)
    except Exception as e:
        return render_template("user/verify_failed.html", message="重設連結已過期或無效，請重新申請。")

    hashed_password = bcrypt.hashpw(password1.encode("utf-8"), bcrypt.gensalt())

    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE User
            SET password_hash = %s, Updated_at = %s
            WHERE User_Email = %s
        """, (hashed_password, datetime.now(), email))
        conn.commit()
        conn.close()
    except Exception as e:
        return render_template("user/reset_form.html", token=token, error_message="密碼更新失敗，請稍後再試。")

    logout_user()
    return render_template("user/reser_success.html")

# 寄驗證信共用方法
def send_verification_email(to_email: str, token: str) -> None:
    verify_link = url_for("user.verify_email", token=token, _external=True)

    subject = "【Soulcraft】請驗證您的帳號"
    body = (
        "您好，\n\n"
        f"請在 1 小時內點擊以下連結完成帳號驗證：\n{verify_link}\n\n"
        "若您並未申請註冊，請忽略此信。"
    )

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = os.environ["MAIL_DEFAULT_SENDER"]
    msg["To"] = to_email

    try:
        with smtplib.SMTP(os.environ["MAIL_SERVER"], int(os.environ["MAIL_PORT"])) as server:
            server.ehlo()
            if os.environ.get("MAIL_USE_TLS", "True").lower() in ("true", "1"):
                server.starttls()
                server.ehlo()
            server.login(os.environ["MAIL_USERNAME"], os.environ["MAIL_PASSWORD"])
            server.send_message(msg)
    except Exception as e:
        # 建議寫入 logs，並在前端顯示友善提示
        current_app.logger.exception(f"❌ 寄送驗證信給 {to_email} 失敗：{e}")
        raise  # 讓呼叫端決定如何回應
