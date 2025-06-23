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

    conn = db.get_connection()
    cur  = conn.cursor(cursor=pymysql.cursors.DictCursor)
    cur.execute("SELECT COUNT(*) AS total FROM Announcements")
    total = cur.fetchone()["total"]

    cur.execute(
        """SELECT * FROM Announcements
           ORDER BY created_at DESC
           LIMIT %s OFFSET %s""",
        (per, offset),
    )
    rows = cur.fetchall()
    cur.close(); conn.close()

    pages = math.ceil(total / per)
    return render_template(
        "admin/announcements.html",
        rows=rows, page=page, pages=pages
    )


@admin_announcement_bp.route("/edit", methods=["GET", "POST"])
@login_required
def edit():
    if not is_admin():
        abort(403)

    conn = db.get_connection()
    cur  = conn.cursor(cursor=pymysql.cursors.DictCursor)
    aid = request.values.get("id")

    if request.method == "POST":
        f = request.form
        data = (
            f["title"], f["body"],
            f["start_time"] or None, f["end_time"] or None,
        )

        if f.get("id"):  # 更新
            cur.execute(
                """UPDATE Announcements
                   SET title=%s, body=%s, start_time=%s, end_time=%s
                   WHERE id=%s""",
                (*data, f["id"]),
            )
        else:  # 新增
            cur.execute(
                """INSERT INTO Announcements
                   (title, body, start_time, end_time)
                   VALUES (%s,%s,%s,%s)""",
                data,
            )
        conn.commit()
        cur.close(); conn.close()
        return redirect(url_for("admin_announce.list_"))

    # GET
    row = None
    if aid:
        cur.execute("SELECT * FROM Announcements WHERE id=%s", (aid,))
        row = cur.fetchone()
    cur.close(); conn.close()
    return render_template("admin/announcement_form.html", row=row)


@admin_announcement_bp.post("/delete/<int:aid>")
@login_required
def delete(aid):
    if not is_admin():
        abort(403)

    try:
        conn = db.get_connection()
        cur  = conn.cursor()
        cur.execute("DELETE FROM Announcements WHERE id=%s", (aid,))
        conn.commit(); cur.close(); conn.close()
        return ("", 204)
    except Exception as e:
        return (f"刪除失敗: {str(e)}", 500)
