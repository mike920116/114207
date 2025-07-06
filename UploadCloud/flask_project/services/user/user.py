"""
用戶認證模組
提供註冊、登入、驗證、密碼重設等功能
"""

import logging
import os
import smtplib
import platform
from datetime import datetime, timedelta
from email.header import Header
from email.mime.text import MIMEText

import bcrypt
from dotenv import load_dotenv
from flask import render_template, request, redirect, url_for
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user
from itsdangerous import URLSafeTimedSerializer

from utils.db import get_connection
from . import user_bp

load_dotenv()

# 設置日誌
if platform.system() == "Windows":
    log_dir = os.path.join(os.path.dirname(__file__), "logs")
    log_file = os.path.join(log_dir, "flaskapp.log")
else:
    log_dir = "/var/log"
    log_file = os.path.join(log_dir, "flaskapp.log")

os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.DEBUG,
    filename=log_file,
    filemode='a',
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 初始化序列化工具
serializer = URLSafeTimedSerializer(os.environ.get("SECRET_KEY", "default_secret"))
login_manager = LoginManager()

class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

    def get_id(self):
        return self.id

@login_manager.user_loader
def load_user(user_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT User_Email, User_name, password_hash FROM User WHERE User_Email = %s", (user_id,))
        user_data = cursor.fetchone()
        if user_data:
            return User(id=user_data[0], username=user_data[1], password=user_data[2])
        return None
    except Exception as e:
        logger.error(f"載入使用者錯誤: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route('/signup/form')
def user_signup_form():
    return render_template('user/signup_form.html')

@user_bp.route('/signup', methods=['POST'])
def signup():
    conn = None
    cursor = None
    try:
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password1')
        password2 = request.form.get('password2')

        if password != password2:
            return render_template('user/signup.html', success=False, error_message="兩次密碼不一致")

        # 檢查信箱是否已存在
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM User WHERE User_Email = %s", (email,))
        if cursor.fetchone()[0] > 0:
            return render_template('user/signup.html', success=False, error_message="此信箱已被註冊")

        # 建立新用戶
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        current_time = datetime.now()
        verification_token = serializer.dumps(email, salt="email-confirm")
        expiry_time = current_time + timedelta(hours=1)

        cursor.execute("""
            INSERT INTO User (
                User_Email, User_name, password_hash, Is_Anonymous,
                email_verification_token, token_expiry, is_verified,
                Created_at, Updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (email, username, hashed_password, 0, verification_token, expiry_time, 0, current_time, current_time))
        conn.commit()

        # 發送驗證信件
        try:
            send_verification_email(email, verification_token)
            logger.info(f"成功發送驗證信件至 {email}")
        except Exception as email_error:
            logger.error(f"發送驗證信件失敗: {email_error}")

        return render_template("user/signup.html", success=True)
    except Exception as e:
        logger.error(f"註冊錯誤: {e}")
        return render_template("user/signup.html", success=False, error_message="註冊時發生錯誤")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route('/login/form')
def user_login_form():
    return render_template('user/login_form.html')

@user_bp.route('/login', methods=['POST'])
def login():
    conn = None
    cursor = None
    try:
        email = request.form.get('email')
        password = request.form.get('password')

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT User_Email, User_name, password_hash, is_verified
            FROM User WHERE User_Email = %s
        """, (email,))
        user_data = cursor.fetchone()

        if not user_data:
            return render_template('user/login.html', success=False, error_message="帳號或密碼錯誤")

        if not user_data[3]:  # is_verified
            return render_template('user/login.html', success=False, error_message="此帳號尚未驗證，請至信箱收取驗證信")

        if bcrypt.checkpw(password.encode('utf-8'), user_data[2].encode('utf-8')):
            user_object = User(id=user_data[0], username=user_data[1], password=user_data[2])
            login_user(user_object)
            
            # 記錄登入時間
            cursor.execute("UPDATE User SET last_login_time = %s, last_login_ip = %s WHERE User_Email = %s", 
                         (datetime.now(), request.remote_addr, email))
            conn.commit()
            
            return redirect(url_for('index'))
        else:
            return render_template('user/login.html', success=False, error_message="帳號或密碼錯誤")
    except Exception as e:
        logger.error(f"登入錯誤: {e}")
        return render_template('user/login.html', success=False, error_message="登入時發生錯誤")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/user/login/form')

@user_bp.route("/verify_email/<token>")
def verify_email(token):
    conn = None
    cursor = None
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)
        
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT is_verified, token_expiry FROM User WHERE User_Email = %s", (email,))
        user_data = cursor.fetchone()

        if user_data and not user_data[0]:
            if datetime.now() > user_data[1]:
                return render_template('user/verify_failed.html', message="驗證連結已過期")
            
            cursor.execute("UPDATE User SET is_verified = 1, Updated_at = %s WHERE User_Email = %s", 
                         (datetime.now(), email))
            conn.commit()
            return render_template('user/verify_success.html')
        elif user_data and user_data[0]:
            return render_template('user/verify_failed.html', message="此帳號已被驗證")
        else:
            return render_template('user/verify_failed.html', message="無效的驗證連結")
    except Exception as e:
        logger.error(f"驗證失敗: {e}")
        return render_template('user/verify_failed.html', message="驗證連結無效或已過期")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route('/forgot/form')
def forgot_form():
    return render_template('user/forgot_form.html')

@user_bp.route('/forgot', methods=['POST'])
def forgot_password():
    conn = None
    cursor = None
    try:
        email = request.form.get("email")
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM User WHERE User_Email = %s", (email,))
        user_exists = cursor.fetchone()[0]

        if user_exists:
            reset_token = serializer.dumps(email, salt="password-reset")
            reset_link = url_for("user.reset_password_form", token=reset_token, _external=True)
            
            # 發送重設密碼信件
            sender_email = os.environ.get("GMAIL_USERNAME")
            subject = "密碼重設請求"
            body = f"請點擊以下連結重設您的密碼: {reset_link}"
            
            msg = MIMEText(body, "plain", "utf-8")
            msg["Subject"] = Header(subject, "utf-8")
            msg["From"] = sender_email
            msg["To"] = email
            
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(sender_email, os.environ.get("GMAIL_PASSWORD"))
                server.sendmail(sender_email, email, msg.as_string())

        return render_template("user/forgot_password_sent.html", email=email)
    except Exception as e:
        logger.error(f"密碼重設請求失敗: {e}")
        return render_template('user/forgot_form.html', error_message="處理請求時發生錯誤")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@user_bp.route("/reset_password/<token>")
def reset_password_form(token):
    try:
        email = serializer.loads(token, salt="password-reset", max_age=3600)
        return render_template("user/reset_password_form.html", token=token, email=email)
    except Exception as e:
        logger.error(f"重設密碼表單錯誤: {e}")
        return render_template("user/verify_failed.html", message="重設連結無效或已過期")

@user_bp.route("/reset_password", methods=["POST"])
def reset_password():
    conn = None
    cursor = None
    try:
        token = request.form.get("token")
        password = request.form.get("password")
        password2 = request.form.get("password2")

        if password != password2:
            return render_template("user/reset_password_form.html", token=token, error_message="兩次密碼不一致")

        email = serializer.loads(token, salt="password-reset", max_age=3600)
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE User SET password_hash = %s, Updated_at = %s WHERE User_Email = %s",
                     (hashed_password, datetime.now(), email))
        conn.commit()

        return render_template("user/reset_password_success.html")
    except Exception as e:
        logger.error(f"密碼重設失敗: {e}")
        return render_template("user/verify_failed.html", message="密碼重設失敗或連結已過期")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def send_verification_email(recipient_email, verification_token):
    try:
        sender_email = os.environ.get("MAIL_USERNAME")  
        password = os.environ.get("MAIL_PASSWORD")
        
        if not sender_email or not password:
            logger.error("Zoho 環境變數未設置")
            return
        
        subject = "歡迎加入 - 請驗證您的電子信箱"
        verification_link = url_for("user.verify_email", token=verification_token, _external=True)

        # 嘗試使用 HTML 模板，失敗則用純文字
        try:
            html_content = render_template("user/verification_email.html",
                                           username=recipient_email,
                                           verification_link=verification_link)
            message = MIMEText(html_content, "html", "utf-8")
        except Exception:
            text_content = f"歡迎加入！請點擊以下連結驗證您的電子信箱：{verification_link}"
            message = MIMEText(text_content, "plain", "utf-8")

        message["Subject"] = Header(subject, "utf-8")
        message["From"] = sender_email
        message["To"] = recipient_email

        with smtplib.SMTP("smtp.zoho.com", 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, recipient_email, message.as_string())

        logger.info(f"✅ 驗證信成功寄出：{recipient_email}")

    except Exception as e:
        logger.error(f"❌ 發送驗證信件失敗: {e}")
        raise