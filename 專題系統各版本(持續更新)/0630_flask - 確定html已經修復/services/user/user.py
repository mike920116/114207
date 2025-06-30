"""
用戶認證與管理模組

提供用戶註冊、登入、驗證等核心功能：
- 用戶註冊與信箱驗證
- 用戶登入與認證
- 密碼重設功能
- 用戶狀態管理

主要類別：
- User: 用戶模型類別，實現 Flask-Login 所需接口

主要路由：
- /signup: 用戶註冊
- /login: 用戶登入
- /verify: 信箱驗證
- /forgot: 忘記密碼
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
from flask import render_template, request, redirect, url_for, current_app
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user
from itsdangerous import URLSafeTimedSerializer

from utils.db import get_connection
from . import user_bp  # 從 __init__.py 導入 Blueprint

# 載入環境變數
load_dotenv()

# 根據作業系統設置日誌路徑
if platform.system() == "Windows":
    log_dir = os.path.join(os.path.dirname(__file__), "logs")
    log_file = os.path.join(log_dir, "flaskapp.log")
else:
    log_dir = "/var/log"
    log_file = os.path.join(log_dir, "flaskapp.log")

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
    """
    用戶模型類別
    
    實現 Flask-Login 所需的用戶接口，用於會話管理
    
    Attributes:
        id (str): 用戶唯一識別碼（通常為信箱）
        username (str): 用戶顯示名稱
        password (bytes): 加密後的密碼雜湊值
    """
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password

    def get_id(self):
        """
        獲取用戶 ID
        
        Flask-Login 要求實現此方法
        
        Returns:
            str: 用戶 ID
        """
        return self.id

# 載入使用者
@login_manager.user_loader
def load_user(user_id):
    """
    Flask-Login 用戶載入回調函數
    
    根據用戶 ID 從資料庫載入用戶資料
    
    Args:
        user_id (str): 用戶 ID（信箱）
        
    Returns:
        User: 用戶物件，如果找不到則返回 None
    """
    database_connection = None
    database_cursor = None
    try:
        database_connection = get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("SELECT User_Email, User_name, password_hash FROM User WHERE User_Email = %s", (user_id,))
        user_data = database_cursor.fetchone()
        if user_data:
            return User(id=user_data[0], username=user_data[1], password=user_data[2])
        return None
    except Exception as e:
        logger.error(f"[載入使用者錯誤] user_id: {user_id}, 錯誤: {e}")
        return None
    finally:
        if database_cursor:
            database_cursor.close()
        if database_connection:
            database_connection.close()

# 註冊頁面
@user_bp.route('/signup/form')
def user_signup_form():
    """
    顯示用戶註冊表單頁面
    
    Returns:
        str: 渲染後的註冊表單 HTML 頁面
    """
    return render_template('user/signup_form.html')

# 註冊邏輯
@user_bp.route('/signup', methods=['POST'])
def signup():
    """
    處理用戶註冊請求
    
    流程：
    1. 驗證密碼一致性
    2. 檢查信箱是否已註冊
    3. 建立新用戶帳號（未驗證狀態）
    4. 發送驗證信件
    
    Form Data:
        email (str): 用戶信箱
        username (str): 用戶名稱
        password1 (str): 密碼
        password2 (str): 確認密碼
        
    Returns:
        str: 註冊結果頁面
    """
    database_connection = None
    database_cursor = None
    try:
        email = request.form.get('email')
        username = request.form.get('username')
        password_raw = request.form.get('password1')
        password_confirm = request.form.get('password2')

        logger.debug(f"處理註冊請求，Email: {email}")
        if password_raw != password_confirm:
            logger.warning(f"密碼不一致，Email: {email}")
            return render_template('user/signup.html', success=False, error_message="兩次密碼不一致")

        # 檢查 Email 是否已存在
        database_connection = get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("SELECT COUNT(*) FROM User WHERE User_Email = %s", (email,))
        existing_user_count = database_cursor.fetchone()[0]
        logger.debug(f"Email {email} 計數: {existing_user_count}")
        if existing_user_count > 0:
            logger.warning(f"Email {email} 已存在")
            return render_template('user/signup.html', success=False, error_message="此信箱已被註冊")

        # 插入新使用者
        hashed_password = bcrypt.hashpw(password_raw.encode('utf-8'), bcrypt.gensalt())
        current_time = datetime.now()
        verification_token = serializer.dumps(email, salt="email-confirm")
        expiry_time = current_time + timedelta(hours=1)

        database_cursor.execute("""
            INSERT INTO User (
                User_Email, User_name, password_hash, Is_Anonymous,
                email_verification_token, token_expiry, is_verified,
                Created_at, Updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (email, username, hashed_password, 0, verification_token, expiry_time, 0, current_time, current_time))
        database_connection.commit()
        logger.info(f"成功插入新使用者，Email: {email}")

        send_verification_email(email, verification_token)
        return render_template("user/signup.html", success=True)
    except Exception as e:
        logger.error(f"[註冊錯誤] Email: {email}, 錯誤: {e}")
        return render_template("user/signup.html", success=False, error_message=str(e))
    finally:
        if database_cursor:
            database_cursor.close()
        if database_connection:
            database_connection.close()


# 登入畫面
@user_bp.route('/login/form')
def user_login_form():
    """
    顯示用戶登入表單頁面
    
    Returns:
        str: 渲染後的登入表單 HTML 頁面
    """
    return render_template('user/login_form.html')

# 登入邏輯
@user_bp.route('/login', methods=['POST'])
def login():
    """
    處理用戶登入請求
    
    流程：
    1. 驗證用戶帳號存在
    2. 檢查帳號是否已驗證
    3. 驗證密碼正確性
    4. 建立用戶會話
    5. 記錄登入時間與 IP
    
    Form Data:
        email (str): 用戶信箱
        password (str): 密碼
        
    Returns:
        str: 登入結果頁面或重導向至首頁
    """
    database_connection = None
    database_cursor = None
    try:
        email = request.form.get('email')
        password_raw = request.form.get('password')
        logger.debug(f"處理登入請求，Email: {email}")

        database_connection = get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("""
            SELECT User_Email, User_name, password_hash, is_verified
            FROM User
            WHERE User_Email = %s
        """, (email,))
        user_data = database_cursor.fetchone()

        if not user_data:
            logger.warning(f"登入失敗，找不到使用者: {email}")
            return render_template('user/login.html', success=False, error_message="帳號或密碼錯誤")

        if not user_data[3]:  # is_verified
            logger.warning(f"登入失敗，使用者未驗證: {email}")
            return render_template('user/login.html', success=False, error_message="此帳號尚未驗證，請至信箱收取驗證信")

        password_hash_from_db = user_data[2]
        if bcrypt.checkpw(password_raw.encode('utf-8'), password_hash_from_db.encode('utf-8')):
            user_object = User(id=user_data[0], username=user_data[1], password=password_hash_from_db)
            login_user(user_object)
            logger.info(f"使用者 {email} 成功登入")

            # 記錄登入活動
            login_time = datetime.now()
            ip_address = request.remote_addr
            database_cursor.execute("""
                INSERT INTO Login_History (User_Email, Login_Time, IP_Address)
                VALUES (%s, %s, %s)
            """, (email, login_time, ip_address))
            database_connection.commit()

            return redirect(url_for('user.user_profile'))
        else:
            logger.warning(f"登入失敗，密碼錯誤: {email}")
            return render_template('user/login.html', success=False, error_message="帳號或密碼錯誤")
    except Exception as e:
        logger.error(f"[登入錯誤] Email: {email}, 錯誤: {e}")
        return render_template('user/login.html', success=False, error_message="登入時發生錯誤")
    finally:
        if database_cursor:
            database_cursor.close()
        if database_connection:
            database_connection.close()

# 登出
@user_bp.route('/logout')
@login_required
def logout():
    """
    處理用戶登出請求
    
    需要用戶已登入，登出後重導向至登入頁面
    
    Returns:
        Response: 重導向至登入表單頁面
    """
    logout_user()
    logger.info("使用者登出")
    return redirect('/user/login/form')

# 信箱驗證
@user_bp.route("/verify_email/<token>")
def verify_email(token):
    """
    處理信箱驗證連結
    
    Args:
        token (str): 驗證權杖
        
    Returns:
        str: 驗證結果頁面
    """
    database_connection = None
    database_cursor = None
    try:
        email = serializer.loads(token, salt="email-confirm", max_age=3600)
        logger.info(f"正在驗證 Email: {email}，使用 token: {token}")
        
        database_connection = get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("SELECT is_verified, token_expiry FROM User WHERE User_Email = %s", (email,))
        user_data = database_cursor.fetchone()

        if user_data and not user_data[0]:
            token_expiry_time = user_data[1]
            if datetime.now() > token_expiry_time:
                 return "<h1>驗證連結已過期</h1>"
            
            database_cursor.execute("UPDATE User SET is_verified = 1, Updated_at = %s WHERE User_Email = %s", (datetime.now(), email))
            database_connection.commit()
            logger.info(f"Email {email} 驗證成功")
            return render_template('user/verification_success.html')
        elif user_data and user_data[0]:
            logger.warning(f"Email {email} 已被驗證")
            return "<h1>此帳號已被驗證</h1>"
        else:
            logger.warning(f"找不到需要驗證的 Email: {email}")
            return "<h1>無效的驗證連結</h1>"
    except Exception as e:
        logger.error(f"驗證 token 失敗: {e}")
        return "<h1>驗證連結無效或已過期</h1>"
    finally:
        if database_cursor:
            database_cursor.close()
        if database_connection:
            database_connection.close()

# 忘記密碼表單
@user_bp.route('/forgot/form')
def forgot_form():
    logout_user()
    return render_template('user/forgot_form.html')

# 忘記密碼 - 寄送重設密碼信
@user_bp.route('/forgot', methods=['POST'])
def forgot_password():
    """
    處理忘記密碼請求，發送密碼重設信件
    
    Form Data:
        email (str): 用戶信箱
        
    Returns:
        str: 請求結果頁面
    """
    database_connection = None
    database_cursor = None
    try:
        email = request.form.get("email")
        database_connection = get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute("SELECT COUNT(*) FROM User WHERE User_Email = %s", (email,))
        user_exists = database_cursor.fetchone()[0]

        if user_exists:
            reset_token = serializer.dumps(email, salt="password-reset")
            reset_link = url_for("user.reset_password_form", token=reset_token, _external=True)
            
            # 發送郵件
            sender_email = os.environ.get("GMAIL_USERNAME")
            receiver_email = email
            subject = "密碼重設請求"
            body = f"請點擊以下連結以重設您的密碼: {reset_link}"
            
            msg = MIMEText(body, "plain", "utf-8")
            msg["Subject"] = Header(subject, "utf-8")
            msg["From"] = sender_email
            msg["To"] = receiver_email
            
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(sender_email, os.environ.get("GMAIL_PASSWORD"))
                server.sendmail(sender_email, receiver_email, msg.as_string())
            logger.info(f"已發送密碼重設信件至 {email}")

        return render_template("user/forgot_password_sent.html", email=email)
    except Exception as e:
        logger.error(f"發送密碼重設信件失敗: {e}")
        return "<h1>處理請求時發生錯誤</h1>"
    finally:
        if database_cursor:
            database_cursor.close()
        if database_connection:
            database_connection.close()

# 密碼重設表單
@user_bp.route("/reset_password/<token>")
def reset_password_form(token):
    try:
        email = serializer.loads(token, salt="reset-password", max_age=3600)
        logger.debug(f"顯示重設密碼表單，Email: {email}")
        return render_template("user/reset_password_form.html", token=token, email=email)
    except Exception as e:
        logger.error(f"[重設密碼表單錯誤] Token: {token}, 錯誤: {e}")
        return render_template("user/verify_failed.html", message="重設連結無效或已過期，請重新申請。")

# 密碼重設 - 提交
@user_bp.route("/reset_password", methods=["POST"])
def reset_password():
    """
    處理密碼重設請求
    
    Form Data:
        token (str): 密碼重設權杖
        password (str): 新密碼
        password2 (str): 確認新密碼
        
    Returns:
        str: 密碼重設結果頁面
    """
    database_connection = None
    database_cursor = None
    try:
        token = request.form.get("token")
        password_raw = request.form.get("password")
        password_confirm = request.form.get("password2")

        if password_raw != password_confirm:
            return "<h1>兩次密碼不一致</h1>"

        email = serializer.loads(token, salt="password-reset", max_age=3600)
        hashed_password = bcrypt.hashpw(password_raw.encode("utf-8"), bcrypt.gensalt())

        database_connection = get_connection()
        database_cursor = database_connection.cursor()
        database_cursor.execute(
            "UPDATE User SET password_hash = %s, Updated_at = %s WHERE User_Email = %s",
            (hashed_password, datetime.now(), email),
        )
        database_connection.commit()
        logger.info(f"使用者 {email} 成功重設密碼")

        return render_template("user/reset_password_success.html")
    except Exception as e:
        logger.error(f"密碼重設失敗: {e}")
        return "<h1>密碼重設失敗或連結已過期</h1>"
    finally:
        if database_cursor:
            database_cursor.close()
        if database_connection:
            database_connection.close()

# 寄送驗證信
def send_verification_email(recipient_email: str, verification_token: str) -> None:
    """
    發送用戶註冊的驗證信件
    
    Args:
        recipient_email (str): 收件人信箱
        verification_token (str): 用於驗證的權杖
    """
    sender_email = os.environ.get("GMAIL_USERNAME")
    password = os.environ.get("GMAIL_PASSWORD")
    
    subject = "歡迎加入 - 請驗證您的電子信箱"
    verification_link = url_for("user.verify_email", token=verification_token, _external=True)
    
    html_content = render_template(
        "user/verification_email.html",
        username=recipient_email,
        verification_link=verification_link
    )
    
    message = MIMEText(html_content, "html", "utf-8")
    message["Subject"] = Header(subject, "utf-8")
    message["From"] = sender_email
    message["To"] = recipient_email
    
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, recipient_email, message.as_string())
        logger.info(f"成功發送驗證信件至 {recipient_email}")
    except Exception as e:
        logger.error(f"發送驗證信件至 {recipient_email} 失敗: {e}")