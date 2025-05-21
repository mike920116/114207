import logging
import os
import smtplib
import platform
from datetime import datetime, timedelta
from email.header import Header
from email.mime.text import MIMEText

import bcrypt
from dotenv import load_dotenv
from flask import render_template, request, redirect, url_for, current_app
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user
from itsdangerous import URLSafeTimedSerializer

from utils import db
from . import user_bp

# 載入環境變數
load_dotenv()

# 設置日誌路徑
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "flaskapp.log")

logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s"
)

# 確保日誌目錄存在
os.makedirs(log_dir, exist_ok=True)

# 設置日誌
logging.basicConfig(
    level=logging.DEBUG,
    filename=log_file,
    filemode='a',
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 初始化序列化工具與藍圖
serializer = URLSafeTimedSerializer(os.environ.get("SECRET_KEY", "default_secret"))
login_manager = LoginManager()

# 使用者類別
class User(UserMixin):
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

    def get_id(self):
        return self.id

# 載入使用者
@login_manager.user_loader
def load_user(user_id):
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT User_Email, User_name, password_hash FROM User WHERE User_Email = %s", (user_id,))
        result = cursor.fetchone()
        if result:
            return User(id=result[0], username=result[1], password=result[2])
        return None
    except Exception as e:
        logger.error(f"[載入使用者錯誤] user_id: {user_id}, 錯誤: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# 註冊頁面
@user_bp.route('/signup/form')
def user_signup_form():
    return render_template('user/signup_form.html')

# 註冊邏輯
@user_bp.route('/signup', methods=['POST'])
def signup():
    conn = None
    cursor = None
    try:
        email = request.form.get('email')
        username = request.form.get('username')
        password = request.form.get('password1')
        password2 = request.form.get('password2')

        logger.debug(f"處理註冊請求，Email: {email}")
        if password != password2:
            logger.warning(f"密碼不一致，Email: {email}")
            return render_template('user/signup.html', success=False, error_message="兩次密碼不一致")

        # 檢查 Email 是否已存在
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM User WHERE User_Email = %s", (email,))
        count = cursor.fetchone()[0]
        logger.debug(f"Email {email} 計數: {count}")
        if count > 0:
            logger.warning(f"Email {email} 已存在")
            return render_template('user/signup.html', success=False, error_message="此信箱已被註冊")

        # 插入新使用者
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
        logger.info(f"成功插入新使用者，Email: {email}")

        send_verification_email(email, token)
        return render_template("user/signup.html", success=True)
    except Exception as e:
        logger.error(f"[註冊錯誤] Email: {email}, 錯誤: {e}")
        return render_template("user/signup.html", success=False, error_message=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# 登入畫面
@user_bp.route('/login/form')
def user_login_form():
    return render_template('user/login_form.html')

# 登入邏輯
@user_bp.route('/login', methods=['POST'])
def login():
    conn = None
    cursor = None
    try:
        email = request.form.get('email')
        password = request.form.get('password')
        logger.debug(f"處理登入請求，Email: {email}")

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT User_Email, User_name, password_hash, is_verified
            FROM User
            WHERE User_Email = %s
        """, (email,))
        result = cursor.fetchone()

        if result is None:
            logger.warning(f"帳號不存在，Email: {email}")
            return render_template('user/login.html', error_message="帳號不存在")

        user_email, username, hashed_password, is_verified = result[0], result[1], result[2].encode('utf-8'), result[3]

        if is_verified != 1:
            logger.warning(f"帳號未驗證，Email: {email}")
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
            logger.info(f"登入成功，Email: {email}, IP: {login_ip}")

            return redirect('/')
        else:
            logger.warning(f"密碼錯誤，Email: {email}")
            return render_template('user/login.html', error_message="密碼錯誤")
    except Exception as e:
        logger.error(f"[登入錯誤] Email: {email}, 錯誤: {e}")
        return render_template('user/login.html', error_message=f"發生錯誤: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# 登出
@user_bp.route('/logout')
@login_required
def logout():
    logout_user()
    logger.info("使用者登出")
    return redirect('/user/login/form')

# 信箱驗證
@user_bp.route("/verify_email/<token>")
def verify_email(token):
    conn = None
    cursor = None
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)
        logger.debug(f"處理信箱驗證，Email: {email}")

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT token_expiry FROM User WHERE User_Email = %s", (email,))
        row = cursor.fetchone()
        if not row or row[0] < datetime.now():
            logger.warning(f"驗證連結過期，Email: {email}")
            return render_template("user/verify_failed.html", message="驗證連結已過期，請重新註冊")

        cursor.execute("""
            UPDATE User
            SET is_verified = 1, email_verification_token = NULL, token_expiry = NULL
            WHERE User_Email = %s
        """, (email,))
        conn.commit()
        logger.info(f"信箱驗證成功，Email: {email}")

        return render_template("user/verify_success.html")
    except Exception as e:
        logger.error(f"[信箱驗證錯誤] Token: {token}, 錯誤: {e}")
        return render_template("user/verify_failed.html", message=f"連結錯誤或過期：{str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# 忘記密碼 - 顯示表單
@user_bp.route('/forgot/form')
def forgot_form():
    logout_user()
    return render_template('user/forgot_form.html')

# 忘記密碼 - 寄送重設密碼信
@user_bp.route('/forgot', methods=['POST'])
def forgot_password():
    conn = None
    cursor = None
    try:
        email = request.form.get('email')
        logger.debug(f"處理忘記密碼請求，Email: {email}")

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM User WHERE User_Email = %s", (email,))
        exists = cursor.fetchone()[0] > 0

        if not exists:
            logger.warning(f"找不到該 Email，Email: {email}")
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
            logger.info(f"重設密碼信寄送成功，Email: {email}")
            return render_template("user/reset_password_sent.html")
        except Exception as e:
            logger.error(f"[郵件發送錯誤] Email: {email}, 錯誤: {e}")
            return render_template("user/forgot_form.html", error_message=f"寄送失敗：{str(e)}")
    except Exception as e:
        logger.error(f"[忘記密碼錯誤] Email: {email}, 錯誤: {e}")
        return render_template("user/forgot_form.html", error_message=f"寄送失敗：{str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# 重設密碼 - 表單
@user_bp.route("/reset_password/<token>")
def reset_password_form(token):
    try:
        email = serializer.loads(token, salt="reset-password", max_age=3600)
        logger.debug(f"顯示重設密碼表單，Email: {email}")
        return render_template("user/reset_password_form.html", token=token, email=email)
    except Exception as e:
        logger.error(f"[重設密碼表單錯誤] Token: {token}, 錯誤: {e}")
        return render_template("user/verify_failed.html", message="重設連結無效或已過期，請重新申請。")

# 重設密碼 - 提交
@user_bp.route("/reset_password", methods=["POST"])
def reset_password():
    conn = None
    cursor = None
    try:
        token = request.form.get("token")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")
        
        logger.debug(f"處理重設密碼請求，Token: {token}")

        if password != confirm_password:
            logger.warning("重設密碼時密碼不一致")
            return render_template("user/reset_password_form.html", 
                                  token=token, 
                                  error_message="兩次密碼不相符")

        try:
            email = serializer.loads(token, salt="reset-password", max_age=3600)
        except Exception as e:
            logger.error(f"[重設密碼錯誤] 無效的token，錯誤: {e}")
            return render_template("user/verify_failed.html", message=f"連結錯誤或過期：{str(e)}")

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE User
            SET password_hash = %s, Updated_at = %s
            WHERE User_Email = %s
        """, (hashed_password, datetime.now(), email))
        conn.commit()
        logger.info(f"密碼重設成功，Email: {email}")

        return render_template("user/reset_password_success.html")
    except Exception as e:
        logger.error(f"[重設密碼錯誤] 錯誤: {e}")
        return render_template("user/verify_failed.html", message=f"重設密碼失敗：{str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# 寄送驗證信
def send_verification_email(to_email: str, token: str) -> None:
    try:
        verification_link = url_for("user.verify_email", token=token, _external=True)
        subject = "驗證您的帳號"
        body = f"請點擊以下連結驗證您的電子郵件（1 小時內有效）：\n{verification_link}"

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = os.environ.get("MAIL_DEFAULT_SENDER")
        msg["To"] = to_email

        with smtplib.SMTP(os.environ.get("MAIL_SERVER"), int(os.environ.get("MAIL_PORT"))) as server:
            server.starttls()
            server.login(os.environ.get("MAIL_USERNAME"), os.environ.get("MAIL_PASSWORD"))
            server.send_message(msg)
        logger.info(f"驗證郵件發送成功，Email: {to_email}")
    except Exception as e:
        logger.error(f"[驗證郵件發送錯誤] Email: {to_email}, 錯誤: {e}")
        raise 