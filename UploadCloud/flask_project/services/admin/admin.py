"""
管理員後台主功能模組

提供系統管理員後台管理功能：
- 儀表板統計資訊
- 用戶管理與檢視
- 日記記錄管理
- 權限控制機制

權限驗證：
- 透過環境變數 ADMIN_EMAILS 設定管理員清單
- 所有管理功能需要管理員權限

主要路由：
- /admin/dashboard: 管理員儀表板
- /admin/users: 用戶列表管理
- /admin/diaries: 日記記錄檢視
"""

import os, logging, json
from flask import render_template, jsonify
from flask_login import login_required, current_user
from utils import db
from dotenv import load_dotenv
from . import admin_bp  # 從 __init__.py 導入 Blueprint

load_dotenv()  # 讀取 .env 檔案

# 共用判斷函式
def is_admin():
    """
    檢查當前用戶是否為管理員
    
    根據環境變數 ADMIN_EMAILS 判斷用戶權限
    
    Returns:
        bool: 如果是管理員則返回 True，否則返回 False
    """
    try:
        if not current_user.is_authenticated:
            return False
        
        # 每次檢查時重新載入環境變數，確保最新配置
        load_dotenv()
        admin_emails_str = os.getenv("ADMIN_EMAILS", "")
        if not admin_emails_str.strip():
            logging.warning("ADMIN_EMAILS 環境變數未設定或為空")
            return False
            
        admin_emails = set(email.strip() for email in admin_emails_str.split(",") if email.strip())
        
        # 記錄調試資訊
        logging.info(f"is_admin() 檢查: user_id={current_user.id}, admin_emails={admin_emails}")
        
        result = current_user.id in admin_emails
        logging.info(f"is_admin() 結果: {result}")
        return result
        
    except Exception as e:
        logging.error(f"is_admin() 檢查失敗: {e}")
        return False

# 儀表板
@admin_bp.route('/dashboard')
@login_required
def admin_dashboard():
    """
    管理員儀表板頁面
    
    顯示系統統計資訊，包括用戶數量、日記數量和舉報統計
    
    Returns:
        str: 儀表板 HTML 頁面，或 403 錯誤頁面
    """
    if not is_admin():
        if current_user.is_authenticated:
            logging.warning(f"用戶 {current_user.id} 嘗試訪問管理員儀表板但被拒絕")
        return "你沒有權限進入後台", 403

    database_connection = db.get_connection()
    database_cursor = database_connection.cursor()
    
    # 基本統計
    database_cursor.execute("SELECT COUNT(*) FROM User")
    user_count = database_cursor.fetchone()[0]
    
    database_cursor.execute("SELECT COUNT(*) FROM DiaryRecords")
    diary_count = database_cursor.fetchone()[0]
    
    # 舉報統計
    database_cursor.execute("SELECT COUNT(*) FROM Reports")
    total_reports = database_cursor.fetchone()[0]
    
    database_cursor.execute("SELECT COUNT(*) FROM Reports WHERE Status = 'pending'")
    pending_reports = database_cursor.fetchone()[0]
    
    # 今日新增統計
    database_cursor.execute("SELECT COUNT(*) FROM User WHERE DATE(Created_at) = CURDATE()")
    new_users_today = database_cursor.fetchone()[0]
    
    database_cursor.execute("SELECT COUNT(*) FROM DiaryRecords WHERE DATE(Created_at) = CURDATE()")
    new_diaries_today = database_cursor.fetchone()[0]
    
    database_cursor.execute("SELECT COUNT(*) FROM Reports WHERE DATE(Created_at) = CURDATE()")
    new_reports_today = database_cursor.fetchone()[0]
    
    # 最近活動
    database_cursor.execute("""
        SELECT r.Report_id, r.Theme, u.User_name, r.Created_at 
        FROM Reports r
        LEFT JOIN User u ON r.User_Email = u.User_Email
        ORDER BY r.Created_at DESC 
        LIMIT 5
    """)
    recent_reports = [
        {
            'Report_ID': row[0],
            'Theme': row[1],
            'Reporter_Name': row[2] or '匿名用戶',
            'Created_at': row[3]
        }
        for row in database_cursor.fetchall()
    ]
    
    database_cursor.execute("""
        SELECT User_Email as Username, User_Email as Email, Created_at 
        FROM User 
        ORDER BY Created_at DESC 
        LIMIT 5
    """)
    recent_users = [
        {
            'Username': row[0].split('@')[0],  # 使用 email 前綴作為顯示名稱
            'Email': row[1],
            'Created_at': row[2]
        }
        for row in database_cursor.fetchall()
    ]
    
    database_connection.close()

    return render_template(
        'admin/dashboard.html',
        user_count=user_count,
        diary_count=diary_count,
        total_reports=total_reports,
        pending_reports=pending_reports,
        new_users_today=new_users_today,
        new_diaries_today=new_diaries_today,
        new_reports_today=new_reports_today,
        recent_reports=recent_reports,
        recent_users=recent_users
    )

# 使用者列表
@admin_bp.route('/users')
@login_required
def admin_users():
    """
    用戶列表管理頁面
    
    顯示所有註冊用戶的資訊，包括信箱、姓名、註冊時間和最後登入 IP
    
    Returns:
        str: 用戶列表 HTML 頁面，或 403 錯誤頁面
    """
    if not is_admin():
        return "你沒有權限進入後台", 403

    database_connection = db.get_connection()
    database_cursor = database_connection.cursor()
    database_cursor.execute("SELECT User_Email, User_name, Created_at, last_login_ip FROM User ORDER BY Created_at DESC")
    users_data = database_cursor.fetchall()
    database_connection.close()

    return render_template('admin/users.html', users=users_data)

# ── 調試路由 ──────────────────────────────────────────
@admin_bp.route('/debug')
@login_required
def admin_debug():
    """
    管理員調試頁面 - 顯示當前用戶的權限狀態
    """
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    admin_emails = set(email.strip() for email in os.getenv("ADMIN_EMAILS", "").split(","))
    
    debug_info = {
        "current_user_authenticated": current_user.is_authenticated,
        "current_user_id": getattr(current_user, 'id', 'N/A'),
        "current_user_username": getattr(current_user, 'username', 'N/A'),
        "current_user_type": type(current_user).__name__,
        "admin_emails": list(admin_emails),
        "admin_emails_raw": os.getenv("ADMIN_EMAILS", ""),
        "is_admin_result": is_admin(),
        "user_in_admin_list": getattr(current_user, 'id', None) in admin_emails if hasattr(current_user, 'id') else False
    }
    
    return f"""
    <h1>管理員權限調試資訊</h1>
    <pre>{json.dumps(debug_info, indent=2, ensure_ascii=False)}</pre>
    <p><a href="/admin/dashboard">返回儀表板</a></p>
    """