"""
用戶設定模組

提供用戶個人設定相關功能：
- 個人資料編輯（姓名、個人簡介）
- 帳號設定檢視（登入記錄）
- 頭像上傳（待實作）

主要路由：
- /settings/profile: 個人資料編輯頁面
- /settings/acc_settings: 帳號設定檢視頁面
"""

from flask import render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from utils import db
from datetime import datetime
from flask import Blueprint

# 在__init__.py中引用此藍圖
settings_bp = Blueprint('settings', __name__, url_prefix="/settings", template_folder='../../templates/settings')

@settings_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    """
    個人資料管理頁面
    
    GET: 顯示個人資料編輯表單
    POST: 處理個人資料更新請求
    
    Form Data (POST):
        username (str): 新的用戶名稱
        bio (str): 個人簡介
        
    Returns:
        str: 個人資料頁面或重導向
    """

    if request.method == 'POST':
        new_name = request.form.get('username')
        bio = request.form.get('bio')
        # TODO: 圖片上傳未實作，可補上

        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE User
            SET User_name = %s, bio = %s, Updated_at = %s
            WHERE User_Email = %s
        """, (new_name, bio, datetime.now(), current_user.id))
        conn.commit()
        conn.close()
        flash("個人資料已更新")
        return redirect(url_for('settings.profile'))

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT User_name, bio, User_Avatar FROM User WHERE User_Email = %s", (current_user.id,))
    result = cursor.fetchone()
    conn.close()

    return render_template(
        'settings/profile.html',
        username=result[0],
        bio=result[1],
        avatar_url=result[2] if result[2] else None
    )

@settings_bp.route('/acc_settings', methods=['GET'])
@login_required
def account_settings():
    """
    帳號設定檢視頁面
    
    顯示帳號相關資訊，包括最後登入時間和 IP 位址
    
    Returns:
        str: 帳號設定頁面
    """

    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT last_login_time, last_login_ip FROM User WHERE User_Email = %s", (current_user.id,))
    row = cursor.fetchone()
    conn.close()

    login_time = row[0].strftime("%Y-%m-%d %H:%M:%S") if row and row[0] else "無資料"
    login_ip = row[1] if row and row[1] else "無資料"

    return render_template(
        'settings/acc_settings.html',
        login_time=login_time,
        login_ip=login_ip
    )