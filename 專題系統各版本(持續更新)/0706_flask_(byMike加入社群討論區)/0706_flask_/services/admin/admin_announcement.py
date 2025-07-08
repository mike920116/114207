import math
from datetime import datetime
from flask import render_template, request, redirect, url_for, abort
from flask_login import login_required
from utils import db
from .admin import is_admin
from . import admin_announcement_bp  # 從 __init__.py 導入 Blueprint
import pymysql.cursors


@admin_announcement_bp.get("/")
@login_required
def list_():
    if not is_admin():
        abort(403)

    page = max(int(request.args.get("p", 1)), 1)
    per  = 10
    offset = (page - 1) * per

    database_connection = db.get_connection()
    database_cursor  = database_connection.cursor(cursor=pymysql.cursors.DictCursor)
    database_cursor.execute("SELECT COUNT(*) AS total FROM Announcements")
    total = database_cursor.fetchone()["total"]

    database_cursor.execute(
        """SELECT * FROM Announcements
           ORDER BY created_at DESC
           LIMIT %s OFFSET %s""",
        (per, offset),
    )
    announcements_data = database_cursor.fetchall()
    database_cursor.close(); database_connection.close()

    pages = math.ceil(total / per)
    return render_template(
        "admin/announcements.html",
        rows=announcements_data, page=page, pages=pages
    )


@admin_announcement_bp.route("/edit", methods=["GET", "POST"])
@login_required
def edit():
    if not is_admin():
        abort(403)

    database_connection = db.get_connection()
    database_cursor = database_connection.cursor(cursor=pymysql.cursors.DictCursor)
    announcement_id = request.values.get("id")

    if request.method == "POST":
        form_data = request.form
        announcement_data = (
            form_data["title"], form_data["body"],
            form_data["start_time"] or None, form_data["end_time"] or None,
        )

        if form_data.get("id"):  # 更新
            database_cursor.execute(
                """UPDATE Announcements
                   SET title=%s, body=%s, start_time=%s, end_time=%s
                   WHERE id=%s""",
                (*announcement_data, form_data["id"]),
            )
        else:  # 新增
            database_cursor.execute(
                """INSERT INTO Announcements
                   (title, body, start_time, end_time)
                   VALUES (%s,%s,%s,%s)""",
                announcement_data,
            )
        database_connection.commit()
        database_cursor.close(); database_connection.close()
        return redirect(url_for("admin_announce.list_"))

    # GET
    announcement_row = None
    if announcement_id:
        database_cursor.execute("SELECT * FROM Announcements WHERE id=%s", (announcement_id,))
        announcement_row = database_cursor.fetchone()
    database_cursor.close(); database_connection.close()
    return render_template("admin/announcement_form.html", row=announcement_row)


@admin_announcement_bp.post("/delete/<int:aid>")
@login_required
def delete(aid):
    if not is_admin():
        abort(403)

    try:
        database_connection = db.get_connection()
        database_cursor  = database_connection.cursor()
        database_cursor.execute("DELETE FROM Announcements WHERE id=%s", (aid,))
        database_connection.commit(); database_cursor.close(); database_connection.close()
        return ("", 204)
    except Exception as e:
        return (f"刪除失敗: {str(e)}", 500)
