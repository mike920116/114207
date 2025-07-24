"""
用戶設定模組

提供用戶個人設定相關功能：
- 個人資料編輯（姓名、個人簡介）
- 帳號設定檢視（登入記錄）
- 頭像選擇（伺服器內建 icon）

主要路由：
- /settings/profile: 個人資料編輯頁面
- /settings/acc_settings: 帳號設定檢視頁面
"""

import os
from datetime import datetime
from flask import (
    render_template, request, redirect, url_for,
    flash, Blueprint, current_app
)
from flask_login import login_required, current_user
from utils import db
from utils.ip import get_client_ip

# 在 __init__.py 中註冊此藍圖
settings_bp = Blueprint(
    "settings",
    __name__,
    url_prefix="/settings",
    template_folder="../../templates/settings",
)

# -------------------------------------------------
# 共用工具：取得可用頭像清單
# -------------------------------------------------
def _get_available_avatars() -> list[str]:
    """
    讀取 static/icons/avatars/ 內所有檔案，回傳檔名清單
    """
    avatar_dir = os.path.join(current_app.static_folder, "icons", "avatars")
    try:
        return [
            f
            for f in os.listdir(avatar_dir)
            if os.path.isfile(os.path.join(avatar_dir, f))
        ]
    except FileNotFoundError:
        return []


# -------------------------------------------------
# /settings/profile
# -------------------------------------------------
@settings_bp.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    """
    個人資料管理頁面
    GET : 顯示表單
    POST: 更新資料
    """

    # ---------- POST：更新 ----------
    if request.method == "POST":
        new_name        = request.form.get("username") or None
        bio             = request.form.get("bio") or None
        selected_avatar = request.form.get("avatar") or None  # radio 選取的檔名

        conn = db.get_connection()
        cur  = conn.cursor()

        if selected_avatar:  # 同時更新頭像
            cur.execute(
                """
                UPDATE User
                SET User_name   = %s,
                    bio         = %s,
                    User_Avatar = %s,
                    Updated_at  = %s
                WHERE User_Email = %s
                """,
                (
                    new_name,
                    bio,
                    f"icons/avatars/{selected_avatar}",
                    datetime.now(),
                    current_user.id,
                ),
            )
        else:  # 只更新文字欄位
            cur.execute(
                """
                UPDATE User
                SET User_name  = %s,
                    bio        = %s,
                    Updated_at = %s
                WHERE User_Email = %s
                """,
                (new_name, bio, datetime.now(), current_user.id),
            )

        conn.commit()
        conn.close()
        flash("個人資料已更新")
        return redirect(url_for("settings.profile"))

    # ---------- GET：顯示 ----------
    conn = db.get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        SELECT User_name, bio, User_Avatar
        FROM   User
        WHERE  User_Email = %s
        """,
        (current_user.id,),
    )
    user_row = cur.fetchone()
    conn.close()

    current_avatar = (
        user_row[2] if user_row and user_row[2] else "icons/avatars/default.png"
    )

    return render_template(
        "settings/profile.html",
        username   = user_row[0],
        bio        = user_row[1],
        avatar_url = current_avatar,
        avatars    = _get_available_avatars(),  # 傳給前端渲染
    )


# -------------------------------------------------
# /settings/acc_settings
# -------------------------------------------------
@settings_bp.route("/acc_settings", methods=["GET"])
@login_required
def account_settings():
    """
    帳號設定檢視頁面（登入記錄）
    """

    conn = db.get_connection()
    cur  = conn.cursor()
    cur.execute(
        """
        SELECT last_login_time, last_login_ip
        FROM   User
        WHERE  User_Email = %s
        """,
        (current_user.id,),
    )
    rec = cur.fetchone()
    conn.close()

    login_time = (
        rec[0].strftime("%Y-%m-%d %H:%M:%S") if rec and rec[0] else "無資料"
    )
    login_ip = rec[1] if rec and rec[1] else "無資料"

    return render_template(
        "settings/acc_settings.html",
        login_time=login_time,
        login_ip=login_ip,
    )
