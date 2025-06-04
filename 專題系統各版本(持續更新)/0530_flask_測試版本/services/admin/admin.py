from flask import Blueprint, render_template
from flask_login import login_required, current_user
from utils import db
from config import get_config

admin_bp = Blueprint('admin', __name__,url_prefix='/admin')

# 讀取配置中的管理員信箱
config_class = get_config()
ADMIN_EMAILS = config_class.ADMIN_EMAILS

# 共用判斷函式
def is_admin():
    return current_user.is_authenticated and current_user.id in ADMIN_EMAILS

# 儀表板
@admin_bp.route('/dashboard')
@login_required
def admin_dashboard():
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
