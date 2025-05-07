from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from utils import db
from datetime import datetime

settings_bp = Blueprint('settings', __name__, template_folder='templates/settings')

@settings_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        new_name = request.form.get('username')
        bio = request.form.get('bio')
        # 未實作圖片上傳，若要補請告知

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
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT last_login_time, last_login_ip FROM User WHERE User_Email = %s", (current_user.id,))
    row = cursor.fetchone()
    conn.close()

    login_time = row[0].strftime("%Y-%m-%d %H:%M:%S") if row and row[0] else "無資料"
    login_ip = row[1] if row and row[1] else "無資料"

    return render_template('settings/acc_settings.html', login_time=login_time, login_ip=login_ip)
