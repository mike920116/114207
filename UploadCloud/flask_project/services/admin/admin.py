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
from flask import render_template, jsonify, flash, redirect, url_for
from flask_login import login_required, current_user
from utils import db
from dotenv import load_dotenv
from . import admin_bp  # 從 __init__.py 導入 Blueprint

# 雲端環境修復
try:
    from utils.cloud_env_fix import force_reload_env
    force_reload_env()
except ImportError:
    pass

load_dotenv()  # 讀取 .env 檔案

# 共用判斷函式
def is_admin():
    """
    檢查當前用戶是否為管理員
    
    根據環境變數 ADMIN_EMAILS 判斷用戶權限
    雲端環境增強版本
    
    Returns:
        bool: 如果是管理員則返回 True，否則返回 False
    """
    try:
        if not current_user.is_authenticated:
            logging.info("is_admin: 用戶未驗證")
            return False
        
        # 多層次環境變數載入策略
        admin_emails_str = None
        
        # 1. 嘗試從 os.environ 直接獲取（雲端平台常用）
        admin_emails_str = os.environ.get("ADMIN_EMAILS")
        if admin_emails_str:
            logging.info(f"is_admin: 從 os.environ 獲取 ADMIN_EMAILS: {admin_emails_str}")
        
        # 2. 如果沒有，嘗試重新載入 .env 並獲取
        if not admin_emails_str:
            load_dotenv(override=True)
            admin_emails_str = os.getenv("ADMIN_EMAILS")
            if admin_emails_str:
                logging.info(f"is_admin: 重新載入後獲取 ADMIN_EMAILS: {admin_emails_str}")
        
        # 3. 最後的備用方案 - 硬編碼檢查（僅用於緊急情況）
        if not admin_emails_str:
            # 檢查用戶是否是已知的管理員郵箱
            known_admin_emails = ["2025dify@gmail.com"]  # 你的管理員郵箱
            if current_user.id in known_admin_emails:
                logging.warning(f"is_admin: 使用備用管理員檢查，允許 {current_user.id}")
                return True
            logging.error("is_admin: 無法獲取 ADMIN_EMAILS 環境變數")
            return False
        
        # 解析管理員郵箱列表
        admin_emails = set(email.strip() for email in admin_emails_str.split(",") if email.strip())
        
        if not admin_emails:
            logging.error("is_admin: 管理員郵箱列表為空")
            return False
        
        # 檢查當前用戶
        user_id = current_user.id
        result = user_id in admin_emails
        
        # 詳細日誌記錄
        logging.info(f"is_admin: 用戶={user_id}, 管理員列表={admin_emails}, 結果={result}")
        
        return result
        
    except Exception as e:
        logging.error(f"is_admin() 檢查失敗: {e}")
        # 在發生錯誤時，檢查是否是已知管理員
        try:
            if current_user.is_authenticated and current_user.id == "2025dify@gmail.com":
                logging.warning(f"is_admin: 錯誤情況下允許已知管理員 {current_user.id}")
                return True
        except:
            pass
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

# ── 雲端調試路由 ──────────────────────────────────────────
@admin_bp.route('/cloud-debug')
def cloud_debug():
    """
    雲端部署調試頁面 - 無需登入即可訪問
    用於診斷雲端環境配置問題
    """
    import os
    from datetime import datetime
    
    try:
        # 獲取環境資訊
        debug_info = {
            "timestamp": datetime.now().isoformat(),
            "environment": {
                "ADMIN_EMAILS_raw": os.getenv("ADMIN_EMAILS", ""),
                "ADMIN_EMAILS_parsed": list(set(email.strip() for email in os.getenv("ADMIN_EMAILS", "").split(",") if email.strip())),
                "SECRET_KEY_set": bool(os.getenv("SECRET_KEY")),
                "FLASK_ENV": os.getenv("FLASK_ENV", ""),
                "working_directory": os.getcwd(),
                "env_file_exists": os.path.exists('.env'),
            },
            "current_user": {
                "authenticated": getattr(current_user, 'is_authenticated', False),
                "user_id": getattr(current_user, 'id', None) if hasattr(current_user, 'id') else None,
                "username": getattr(current_user, 'username', None) if hasattr(current_user, 'username') else None,
            },
            "database": None,
            "admin_check": None
        }
        
        # 測試數據庫連接
        try:
            from utils.db import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM User")
            user_count = cursor.fetchone()[0]
            debug_info["database"] = {
                "connection": "success",
                "user_count": user_count
            }
            
            # 檢查管理員用戶是否存在
            admin_emails = debug_info["environment"]["ADMIN_EMAILS_parsed"]
            if admin_emails:
                placeholders = ','.join(['%s'] * len(admin_emails))
                cursor.execute(f"SELECT User_Email, User_name FROM User WHERE User_Email IN ({placeholders})", admin_emails)
                admin_users = cursor.fetchall()
                debug_info["database"]["admin_users_found"] = [{"email": row[0], "name": row[1]} for row in admin_users]
            
            cursor.close()
            conn.close()
            
        except Exception as db_error:
            debug_info["database"] = {
                "connection": "failed",
                "error": str(db_error)
            }
        
        # 測試 is_admin() 函數
        try:
            debug_info["admin_check"] = is_admin()
        except Exception as admin_error:
            debug_info["admin_check"] = f"Error: {admin_error}"
        
        # 生成 HTML 報告
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>雲端部署調試報告</title>
            <style>
                body {{ font-family: monospace; margin: 20px; }}
                .success {{ color: green; }}
                .error {{ color: red; }}
                .warning {{ color: orange; }}
                .info {{ color: blue; }}
                pre {{ background: #f5f5f5; padding: 10px; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <h1>雲端部署調試報告</h1>
            <p>生成時間: {debug_info['timestamp']}</p>
            
            <h2>環境變數</h2>
            <ul>
                <li>ADMIN_EMAILS (原始): "{debug_info['environment']['ADMIN_EMAILS_raw']}"</li>
                <li>ADMIN_EMAILS (解析): {debug_info['environment']['ADMIN_EMAILS_parsed']}</li>
                <li>SECRET_KEY 已設定: <span class="{'success' if debug_info['environment']['SECRET_KEY_set'] else 'error'}">{debug_info['environment']['SECRET_KEY_set']}</span></li>
                <li>FLASK_ENV: {debug_info['environment']['FLASK_ENV']}</li>
                <li>工作目錄: {debug_info['environment']['working_directory']}</li>
                <li>.env 檔案存在: <span class="{'success' if debug_info['environment']['env_file_exists'] else 'error'}">{debug_info['environment']['env_file_exists']}</span></li>
            </ul>
            
            <h2>當前用戶狀態</h2>
            <ul>
                <li>已驗證: <span class="{'success' if debug_info['current_user']['authenticated'] else 'error'}">{debug_info['current_user']['authenticated']}</span></li>
                <li>用戶 ID: {debug_info['current_user']['user_id'] or 'None'}</li>
                <li>用戶名: {debug_info['current_user']['username'] or 'None'}</li>
            </ul>
            
            <h2>數據庫狀態</h2>
            {'<span class="success">連接成功</span>' if debug_info['database'] and debug_info['database'].get('connection') == 'success' else f'<span class="error">連接失敗: {debug_info["database"]["error"] if debug_info["database"] else "未知錯誤"}</span>'}
            {f'<br>用戶總數: {debug_info["database"]["user_count"]}' if debug_info['database'] and 'user_count' in debug_info['database'] else ''}
            {f'<br>找到的管理員用戶: {debug_info["database"]["admin_users_found"]}' if debug_info['database'] and 'admin_users_found' in debug_info['database'] else ''}
            
            <h2>權限檢查結果</h2>
            <span class="{'success' if debug_info['admin_check'] is True else 'error'}">{debug_info['admin_check']}</span>
            
            <h2>完整調試資訊</h2>
            <pre>{json.dumps(debug_info, indent=2, ensure_ascii=False, default=str)}</pre>
            
            <p><a href="/admin/dashboard">返回管理員儀表板</a> | <a href="/admin/report">嘗試訪問舉報管理</a></p>
        </body>
        </html>
        """
        
        return html
        
    except Exception as e:
        return f"""
        <h1>調試頁面錯誤</h1>
        <p style="color: red;">錯誤: {str(e)}</p>
        <pre>{str(e.__class__.__name__)}: {str(e)}</pre>
        """

# ── 重定向測試路由 ──────────────────────────────────────────
@admin_bp.route('/test-redirect')
@login_required
def test_redirect():
    """
    測試重定向行為的路由
    """
    try:
        # 檢查權限
        admin_result = is_admin()
        
        if admin_result:
            return f"""
            <h1>權限檢查通過</h1>
            <p>用戶: {current_user.id}</p>
            <p>權限: 管理員</p>
            <p><a href="/admin/report">前往舉報管理</a></p>
            <p><a href="/admin/dashboard">返回儀表板</a></p>
            """
        else:
            # 不使用 redirect，直接返回資訊
            return f"""
            <h1 style="color: red;">權限檢查失敗</h1>
            <p>用戶: {current_user.id if current_user.is_authenticated else '未登入'}</p>
            <p>權限: 一般用戶</p>
            <p>這就是導致 302 重定向的原因</p>
            <p><a href="/admin/cloud-debug">查看詳細調試資訊</a></p>
            <p><a href="/admin/dashboard">嘗試訪問儀表板</a></p>
            """
            
    except Exception as e:
        return f"""
        <h1 style="color: red;">測試路由錯誤</h1>
        <p>錯誤: {str(e)}</p>
        <p><a href="/admin/cloud-debug">查看調試資訊</a></p>
        """

# ── 雲端測試路由 ──────────────────────────────────────────
@admin_bp.route('/cloud-test')
@login_required
def cloud_test():
    """
    雲端環境測試頁面
    用於測試舉報管理功能在雲端環境中的行為
    """
    if not is_admin():
        flash("您沒有管理員權限，無法訪問此頁面", "error")
        return redirect(url_for('admin.admin_dashboard'))
    
    return render_template('admin/cloud_test.html')

# ── 即時權限診斷路由 ──────────────────────────────────────────
@admin_bp.route('/debug-permission')
@login_required  
def debug_permission():
    """
    即時權限診斷頁面 - 幫助診斷權限問題
    """
    import os
    from datetime import datetime
    from dotenv import load_dotenv
    
    # 強制重新載入環境變數
    load_dotenv(override=True)
    
    # 收集診斷資訊
    debug_data = {
        "timestamp": datetime.now().isoformat(),
        "user_info": {
            "authenticated": current_user.is_authenticated,
            "user_id": getattr(current_user, 'id', None),
            "username": getattr(current_user, 'username', None),
            "user_type": str(type(current_user)),
        },
        "environment": {
            "admin_emails_os_environ": os.environ.get("ADMIN_EMAILS"),
            "admin_emails_getenv": os.getenv("ADMIN_EMAILS"),
            "admin_emails_raw": repr(os.getenv("ADMIN_EMAILS", "")),
        },
        "permission_check": {},
        "system_info": {
            "working_directory": os.getcwd(),
            "env_file_exists": os.path.exists('.env'),
            "python_path": os.environ.get('PYTHONPATH', 'Not Set'),
        }
    }
    
    # 手動執行權限檢查步驟
    try:
        # 步驟 1: 檢查環境變數
        admin_emails_str = os.getenv("ADMIN_EMAILS", "")
        debug_data["permission_check"]["step1_env_var"] = {
            "value": admin_emails_str,
            "is_empty": not admin_emails_str.strip(),
        }
        
        # 步驟 2: 解析郵箱列表
        if admin_emails_str.strip():
            admin_emails = set(email.strip() for email in admin_emails_str.split(",") if email.strip())
            debug_data["permission_check"]["step2_parsed_emails"] = {
                "parsed_set": list(admin_emails),
                "count": len(admin_emails),
            }
        else:
            debug_data["permission_check"]["step2_parsed_emails"] = {
                "error": "環境變數為空，無法解析",
            }
            admin_emails = set()
        
        # 步驟 3: 檢查用戶是否在列表中
        if current_user.is_authenticated and admin_emails:
            user_in_list = current_user.id in admin_emails
            debug_data["permission_check"]["step3_user_check"] = {
                "user_id": current_user.id,
                "in_admin_list": user_in_list,
                "exact_matches": [email for email in admin_emails if email == current_user.id],
                "similar_matches": [email for email in admin_emails if current_user.id.lower() in email.lower() or email.lower() in current_user.id.lower()],
            }
        else:
            debug_data["permission_check"]["step3_user_check"] = {
                "error": "用戶未驗證或管理員列表為空",
            }
        
        # 步驟 4: 執行實際的 is_admin() 函數
        admin_result = is_admin()
        debug_data["permission_check"]["step4_is_admin_result"] = admin_result
        
    except Exception as e:
        debug_data["permission_check"]["error"] = str(e)
    
    # 生成 HTML 報告
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>權限診斷報告</title>
        <style>
            body {{ font-family: 'Courier New', monospace; margin: 20px; background: #f5f5f5; }}
            .container {{ background: white; padding: 20px; border-radius: 8px; max-width: 1200px; }}
            .section {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
            .success {{ background: #d4edda; border-color: #c3e6cb; }}
            .error {{ background: #f8d7da; border-color: #f5c6cb; }}
            .warning {{ background: #fff3cd; border-color: #ffeaa7; }}
            .info {{ background: #d1ecf1; border-color: #bee5eb; }}
            pre {{ background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }}
            .btn {{ display: inline-block; padding: 8px 16px; margin: 5px; text-decoration: none; 
                   border-radius: 4px; color: white; }}
            .btn-primary {{ background: #007bff; }}
            .btn-success {{ background: #28a745; }}
            .btn-danger {{ background: #dc3545; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔍 權限診斷報告</h1>
            <p><strong>生成時間:</strong> {debug_data['timestamp']}</p>
            
            <div class="section info">
                <h2>👤 用戶資訊</h2>
                <ul>
                    <li><strong>已驗證:</strong> {'✅' if debug_data['user_info']['authenticated'] else '❌'} {debug_data['user_info']['authenticated']}</li>
                    <li><strong>用戶 ID:</strong> {debug_data['user_info']['user_id']}</li>
                    <li><strong>用戶名:</strong> {debug_data['user_info']['username']}</li>
                    <li><strong>用戶類型:</strong> {debug_data['user_info']['user_type']}</li>
                </ul>
            </div>
            
            <div class="section {'success' if debug_data['environment']['admin_emails_getenv'] else 'error'}">
                <h2>🌐 環境變數</h2>
                <ul>
                    <li><strong>os.environ.get('ADMIN_EMAILS'):</strong> {debug_data['environment']['admin_emails_os_environ'] or '未設定'}</li>
                    <li><strong>os.getenv('ADMIN_EMAILS'):</strong> {debug_data['environment']['admin_emails_getenv'] or '未設定'}</li>
                    <li><strong>原始值:</strong> {debug_data['environment']['admin_emails_raw']}</li>
                </ul>
            </div>
            
            <div class="section {'success' if debug_data['permission_check'].get('step4_is_admin_result') else 'error'}">
                <h2>🔐 權限檢查步驟</h2>
    """
    
    # 添加權限檢查詳情
    for step, data in debug_data['permission_check'].items():
        html_content += f"<h3>{step}:</h3><pre>{json.dumps(data, indent=2, ensure_ascii=False, default=str)}</pre>"
    
    html_content += f"""
            </div>
            
            <div class="section info">
                <h2>💻 系統資訊</h2>
                <ul>
                    <li><strong>工作目錄:</strong> {debug_data['system_info']['working_directory']}</li>
                    <li><strong>.env 檔案存在:</strong> {'✅' if debug_data['system_info']['env_file_exists'] else '❌'} {debug_data['system_info']['env_file_exists']}</li>
                    <li><strong>PYTHONPATH:</strong> {debug_data['system_info']['python_path']}</li>
                </ul>
            </div>
            
            <div class="section">
                <h2>🔗 測試連結</h2>
                <a href="/admin/report" class="btn btn-primary">嘗試訪問舉報管理</a>
                <a href="/admin/dashboard" class="btn btn-success">返回儀表板</a>
                <a href="/admin/cloud-debug" class="btn btn-danger">完整環境診斷</a>
                <a href="javascript:location.reload()" class="btn btn-secondary">重新整理</a>
            </div>
            
            <div class="section">
                <h2>📋 完整診斷資料</h2>
                <pre>{json.dumps(debug_data, indent=2, ensure_ascii=False, default=str)}</pre>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_content