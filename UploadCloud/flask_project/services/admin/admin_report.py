"""
管理員舉報審核模組（清理後）

提供管理員處理使用者舉報的功能：
- 舉報列表查看
- 舉報詳情審核
- 人工回覆與狀態更新
- 處理歷程記錄

主要路由：
- /admin/report: 舉報列表
- /admin/report/<report_id>: 舉報詳情審核
- /admin/report/<report_id>/update: 更新處理狀態
- /admin/report/stats: 舉報統計資訊

權限管理：
- 僅管理員可訪問
- 記錄所有處理動作
- 自動通知相關人員
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import pymysql
from flask import (
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user, login_required

from services.line.line_bot import notify_admins
from utils import db
from . import admin_bp  # Blueprint 由上層 __init__.py 載入
from .admin import is_admin

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# 輔助函式
# ──────────────────────────────────────────────────────────────

def log_report_action(
    report_id: int,
    action: str,
    performed_by: str | int,
    description: str,
) -> None:
    """寫入 Report_Audit_Log。"""
    try:
        conn = db.get_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO Report_Audit_Log (Report_id, Action, Performed_by, Description)
                VALUES (%s, %s, %s, %s)
                """,
                (report_id, action, performed_by, description),
            )
        conn.commit()
    except Exception:  # pragma: no cover  # noqa: BLE001
        logger.exception("記錄舉報歷程失敗")
    finally:
        conn.close()


# ──────────────────────────────────────────────────────────────
# 舉報列表
# ──────────────────────────────────────────────────────────────


@admin_bp.route("/report")
@login_required
def admin_reports():
    """顯示舉報列表，支援分頁與狀態篩選。"""
    if not is_admin():
        flash("您沒有管理員權限，無法訪問此頁面", "error")
        return redirect(url_for("admin.admin_dashboard"))

    # 參數解析
    status_filter: Optional[str] = request.args.get("status")
    page: int = max(1, int(request.args.get("page", 1)))
    per_page: int = 20
    offset: int = (page - 1) * per_page

    # 查詢組裝
    where_clause = "WHERE r.Status = %s" if status_filter else ""
    where_params: Tuple[Any, ...] = (status_filter,) if status_filter else tuple()

    count_sql = f"""
        SELECT COUNT(*) AS total
        FROM Reports r
        {where_clause}
    """

    list_sql = f"""
        SELECT r.Report_id,
               r.User_Email,
               u.User_name,
               r.Theme,
               r.Options,
               r.Status,
               r.AI_Valid,
               r.AI_Confidence,
               r.Created_at,
               r.Updated_at,
               r.Staff_Reply
        FROM Reports r
        LEFT JOIN User u ON r.User_Email = u.User_Email
        {where_clause}
        ORDER BY
            CASE r.Status
                WHEN 'pending' THEN 1
                WHEN 'accepted' THEN 2
                WHEN 'rejected' THEN 3
                WHEN 'closed' THEN 4
            END,
            r.Created_at DESC
        LIMIT %s OFFSET %s
    """

    conn = db.get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 總筆數
            cursor.execute(count_sql, where_params)
            total_count: int = cursor.fetchone()["total"]

            # 列表資料
            cursor.execute(list_sql, where_params + (per_page, offset))
            reports: List[Dict[str, Any]] = list(cursor.fetchall())

            # 狀態統計
            cursor.execute(
                """
                SELECT Status, COUNT(*) AS cnt
                FROM Reports
                GROUP BY Status
                """
            )
            status_stats = {row["Status"]: row["cnt"] for row in cursor.fetchall()}
    finally:
        conn.close()

    # 處理 JSON 欄位
    for report in reports:
        options_raw = report.get("Options")
        if options_raw:
            try:
                report["Options"] = json.loads(options_raw)
            except json.JSONDecodeError:
                report["Options"] = []

    # 分頁計算
    total_pages = (total_count + per_page - 1) // per_page
    pagination = {
        "page": page,
        "total_pages": total_pages,
        "total_count": total_count,
        "has_prev": page > 1,
        "has_next": page < total_pages,
        "prev_num": page - 1 if page > 1 else None,
        "next_num": page + 1 if page < total_pages else None,
    }

    return render_template(
        "admin/report_list.html",
        reports=reports,
        status_filter=status_filter,
        status_stats=status_stats,
        pagination=pagination,
    )


# ──────────────────────────────────────────────────────────────
# 舉報詳情
# ──────────────────────────────────────────────────────────────


@admin_bp.route("/report/<int:report_id>")
@login_required
def admin_report_detail(report_id: int):
    """顯示舉報詳細資訊。"""
    if not is_admin():
        flash("您沒有管理員權限，無法訪問此頁面", "error")
        return redirect(url_for("admin.admin_dashboard"))

    conn = db.get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 舉報本體
            cursor.execute(
                """
                SELECT r.*, u.User_name, u.User_Avatar
                FROM Reports r
                LEFT JOIN User u ON r.User_Email = u.User_Email
                WHERE r.Report_id = %s
                """,
                (report_id,),
            )
            report = cursor.fetchone()
            if not report:
                flash("找不到該舉報記錄", "error")
                return redirect(url_for("admin.admin_reports"))

            # 歷程
            cursor.execute(
                """
                SELECT Action, Performed_by, Description, Created_at
                FROM Report_Audit_Log
                WHERE Report_id = %s
                ORDER BY Created_at ASC
                """,
                (report_id,),
            )
            audit_logs = cursor.fetchall()

            # 關聯貼文
            post_info: Optional[Dict[str, Any]] = None
            if report.get("Post_id"):
                cursor.execute(
                    """
                    SELECT p.Post_id, p.Content, p.User_Email, u.User_name
                    FROM Posts p
                    LEFT JOIN User u ON p.User_Email = u.User_Email
                    WHERE p.Post_id = %s
                    """,
                    (report["Post_id"],),
                )
                post_info = cursor.fetchone()
    finally:
        conn.close()

    # JSON 欄位處理
    options_raw = report.get("Options")
    if options_raw:
        try:
            report["Options"] = json.loads(options_raw)
        except json.JSONDecodeError:
            report["Options"] = []

    return render_template(
        "admin/report_detail.html",
        report=report,
        audit_logs=audit_logs,
        post_info=post_info,
    )


# ──────────────────────────────────────────────────────────────
# 更新舉報狀態
# ──────────────────────────────────────────────────────────────


@admin_bp.route("/report/<int:report_id>/update", methods=["POST"])
@login_required
def admin_report_update(report_id: int):
    """更新舉報狀態與管理員回覆。"""
    if not is_admin():
        flash("您沒有管理員權限，無法執行此操作", "error")
        return redirect(url_for("admin.admin_reports"))

    # 取得表單資料
    new_status = request.form.get("status")
    staff_reply = request.form.get("staff_reply", "").strip()
    notify_user = request.form.get("notify_user") == "on"

    valid_statuses = {"pending", "accepted", "rejected", "closed"}
    if new_status not in valid_statuses:
        flash("無效的狀態值", "error")
        return redirect(url_for("admin.admin_report_detail", report_id=report_id))

    if new_status in {"accepted", "rejected"} and not staff_reply:
        flash("處理結果為接受或拒絕時，必須填寫管理員回覆", "error")
        return redirect(url_for("admin.admin_report_detail", report_id=report_id))

    conn = db.get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 現有舉報紀錄
            cursor.execute(
                """
                SELECT User_Email, Status, Theme
                FROM Reports
                WHERE Report_id = %s
                """,
                (report_id,),
            )
            current_report = cursor.fetchone()
            if not current_report:
                flash("找不到該舉報記錄", "error")
                return redirect(url_for("admin.admin_reports"))

            old_status = current_report["Status"]

            # 更新
            cursor.execute(
                """
                UPDATE Reports
                SET Status = %s,
                    Staff_Reply = %s,
                    Notified = %s,
                    Updated_at = %s
                WHERE Report_id = %s
                """,
                (
                    new_status,
                    staff_reply,
                    1 if notify_user else 0,
                    datetime.now(),
                    report_id,
                ),
            )
            conn.commit()

        # 歷程
        action_desc = f"狀態由 {old_status} 更新為 {new_status}"
        if staff_reply:
            trimmed = staff_reply[:50] + ("..." if len(staff_reply) > 50 else "")
            action_desc += f"，管理員回覆：{trimmed}"
        log_report_action(report_id, "manual_review", current_user.id, action_desc)

        # LINE 通知
        if notify_user and new_status in {"accepted", "rejected"}:
            status_text = "已接受" if new_status == "accepted" else "已拒絕"
            notify_admins(f"已完成舉報 #{report_id} 的處理，狀態：{status_text}")
            log_report_action(report_id, "notify_user", current_user.id, f"已通知舉報者：{status_text}")

        flash(f"舉報狀態已更新為「{new_status}」", "success")
        return redirect(url_for("admin.admin_report_detail", report_id=report_id))

    except Exception:  # pragma: no cover  # noqa: BLE001
        logger.exception("更新舉報狀態失敗")
        flash("更新失敗，請稍後再試", "error")
        return redirect(url_for("admin.admin_report_detail", report_id=report_id))
    finally:
        conn.close()


# ──────────────────────────────────────────────────────────────
# 舉報統計
# ──────────────────────────────────────────────────────────────


@admin_bp.route("/report/stats")
@login_required
def admin_report_stats():
    """顯示舉報統計頁面。"""
    if not is_admin():
        flash("您沒有管理員權限，無法訪問此頁面", "error")
        return redirect(url_for("admin.admin_dashboard"))

    conn = db.get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 基本統計
            cursor.execute(
                """
                SELECT COUNT(*) AS total_reports,
                       SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
                       SUM(CASE WHEN Status = 'accepted' THEN 1 ELSE 0 END) AS accepted_count,
                       SUM(CASE WHEN Status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
                       SUM(CASE WHEN AI_Valid = 1 THEN 1 ELSE 0 END) AS ai_valid_count,
                       AVG(AI_Confidence) AS avg_confidence
                FROM Reports
                """
            )
            basic_stats = cursor.fetchone()

            # 最近 30 天每日趨勢
            cursor.execute(
                """
                SELECT DATE(Created_at) AS report_date, COUNT(*) AS cnt
                FROM Reports
                WHERE Created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(Created_at)
                ORDER BY report_date DESC
                """
            )
            daily_trends = cursor.fetchall()

            # 主題統計
            cursor.execute(
                """
                SELECT Theme, COUNT(*) AS cnt
                FROM Reports
                GROUP BY Theme
                ORDER BY cnt DESC
                LIMIT 10
                """
            )
            theme_stats = cursor.fetchall()

            # AI 準確性
            cursor.execute(
                """
                SELECT AI_Valid, Status, COUNT(*) AS cnt
                FROM Reports
                WHERE Status IN ('accepted', 'rejected')
                GROUP BY AI_Valid, Status
                """
            )
            ai_accuracy = cursor.fetchall()
    finally:
        conn.close()

    return render_template(
        "admin/report_stats.html",
        basic_stats=basic_stats,
        daily_trends=daily_trends,
        theme_stats=theme_stats,
        ai_accuracy=ai_accuracy,
    )
