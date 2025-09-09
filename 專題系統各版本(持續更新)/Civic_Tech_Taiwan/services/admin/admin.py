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

load_dotenv()  # 讀取 .env 檔案

# 從 clinic 模組導入預約資料
from services.clinic import HOSPITAL_DATA, APPOINTMENT_RECORDS

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

# 預約管理 - 醫院選擇頁面
@admin_bp.route('/appointment-hospitals')
@login_required
def appointment_hospitals():
    """
    預約管理 - 醫院選擇頁面
    
    顯示所有合作醫院列表，供管理員選擇要管理的醫院
    
    Returns:
        str: 醫院選擇 HTML 頁面，或 403 錯誤頁面
    """
    if not is_admin():
        return "你沒有權限進入後台", 403
    
    return render_template('admin/appointment_hospitals.html')

# 預約管理 - 特定醫院的預約管理
@admin_bp.route('/appointment-management/<hospital_id>')
@login_required
def appointment_management(hospital_id):
    """
    預約管理 - 特定醫院的預約管理頁面
    
    顯示指定醫院的所有預約紀錄和管理功能
    
    Args:
        hospital_id (str): 醫院 ID
    
    Returns:
        str: 預約管理 HTML 頁面，或 404/403 錯誤頁面
    """
    if not is_admin():
        return "你沒有權限進入後台", 403
    
    # 檢查醫院是否存在
    if hospital_id not in HOSPITAL_DATA:
        return "找不到指定的醫院", 404
    
    hospital_info = HOSPITAL_DATA[hospital_id]
    hospital_name = hospital_info['name']
    doctors = hospital_info['doctors']
    
    # 根據醫院篩選預約紀錄
    hospital_appointments = [
        appointment for appointment in APPOINTMENT_RECORDS 
        if appointment['hospital'] == hospital_name
    ]
    
    return render_template(
        'admin/appointment_management.html',
        hospital_id=hospital_id,
        hospital_name=hospital_name,
        doctors=doctors,
        appointments=hospital_appointments
    )

