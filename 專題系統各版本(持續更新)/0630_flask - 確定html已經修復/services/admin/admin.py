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

import os
from flask import render_template
from flask_login import login_required, current_user
from utils import db
from dotenv import load_dotenv
from . import admin_bp  # 從 __init__.py 導入 Blueprint

load_dotenv()  # 讀取 .env 檔案

# 讀取環境變數中的管理員信箱
ADMIN_EMAILS = set(email.strip() for email in os.getenv("ADMIN_EMAILS", "").split(","))

# 共用判斷函式
def is_admin():
    """
    檢查當前用戶是否為管理員
    
    根據環境變數 ADMIN_EMAILS 判斷用戶權限
    
    Returns:
        bool: 如果是管理員則返回 True，否則返回 False
    """
    return current_user.is_authenticated and current_user.id in ADMIN_EMAILS

# 儀表板
@admin_bp.route('/dashboard')
@login_required
def admin_dashboard():
    """
    管理員儀表板頁面
    
    顯示系統統計資訊，包括用戶數量和日記數量
    
    Returns:
        str: 儀表板 HTML 頁面，或 403 錯誤頁面
    """
    if not is_admin():
        return "你沒有權限進入後台", 403

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM User")
    user_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM DiaryRecords")
    diary_count = cursor.fetchone()[0]
    conn.close()

    return render_template(
        'admin/dashboard.html',
        user_count=user_count,
        diary_count=diary_count
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

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT User_Email, User_name, Created_at,last_login_ip FROM User ORDER BY Created_at DESC")
    users = cursor.fetchall()
    conn.close()

    return render_template('admin/users.html', users=users)

# 日記紀錄
@admin_bp.route('/diaries')
@login_required
def admin_diaries():
    """
    日記記錄檢視頁面
    
    顯示所有用戶的日記記錄，包括：
    - 日記 ID 和作者資訊
    - 日記內容摘要（前 80 字元）
    - AI 分析結果
    - 建立時間
    
    Returns:
        str: 日記列表 HTML 頁面，或 403 錯誤頁面
    """
    if not is_admin():
        return "你沒有權限進入後台", 403

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.Diary_id,
               d.User_Email,
               COALESCE(u.User_name, '') AS name,
               LEFT(d.Diary_Content, 80) AS snippet,
               d.AI_analysis_content,
               d.Created_at
        FROM DiaryRecords d
        LEFT JOIN User u ON d.User_Email = u.User_Email
        ORDER BY d.Created_at DESC
    """)
    diaries = cursor.fetchall()
    conn.close()

    return render_template('admin/diaries.html', diaries=diaries)
