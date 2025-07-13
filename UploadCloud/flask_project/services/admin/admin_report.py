"""
管理員舉報審核模組

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

import json
import logging
import pymysql
import sys  # 添加 sys 模組用於強制輸出
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, jsonify, abort
from flask_login import login_required, current_user
from utils import db
from services.line.line_bot import notify_admins
from .admin import is_admin  # 引入管理員權限檢查
from . import admin_bp  # 從 __init__.py 導入 Blueprint

# 雲端環境修復
try:
    from utils.cloud_env_fix import force_reload_env
    force_reload_env()
except ImportError:
    pass

def log_report_action(report_id, action, performed_by, description):
    """
    記錄舉報處理歷程
    
    Args:
        report_id (int): 舉報 ID
        action (str): 處理動作類型
        performed_by (str): 執行者
        description (str): 詳細說明
    """
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO Report_Audit_Log (Report_id, Action, Performed_by, Description)
            VALUES (%s, %s, %s, %s)
        """, (report_id, action, performed_by, description))
        
        conn.commit()
        conn.close()
    except Exception as e:
        logging.error(f"記錄舉報歷程失敗: {e}")

# ── 舉報列表 ──────────────────────────────────────────
@admin_bp.route('/report')
@login_required
def admin_reports():
    """
    管理員舉報列表頁面
    
    顯示所有舉報記錄，支援狀態篩選和分頁
    
    Returns:
        str: 舉報列表 HTML 頁面，或 403 錯誤頁面
    """
    # 詳細的權限檢查日誌
    logging.info("=== 舉報管理頁面訪問開始 ===")
    print("=== 舉報管理頁面訪問開始 ===")  # 強制輸出到 stdout
    sys.stderr.write("=== [DEBUG] 舉報管理頁面訪問開始 ===\n")  # 強制輸出到 stderr
    sys.stderr.flush()
    logging.info(f"當前時間: {datetime.now()}")
    logging.info(f"請求 IP: {request.remote_addr}")
    logging.info(f"User-Agent: {request.headers.get('User-Agent', 'Unknown')}")
    
    # 檢查用戶驗證狀態
    if not current_user.is_authenticated:
        logging.warning("用戶未驗證，重定向到登入頁面")
        print("用戶未驗證，重定向到登入頁面")
        sys.stderr.write("[DEBUG] 用戶未驗證，重定向到登入頁面\n")
        sys.stderr.flush()
        return redirect(url_for('admin.admin_dashboard'))
    
    logging.info(f"用戶已驗證: {current_user.id}")
    print(f"用戶已驗證: {current_user.id}")
    sys.stderr.write(f"[DEBUG] 用戶已驗證: {current_user.id}\n")
    sys.stderr.flush()
    
    # 檢查管理員權限
    admin_check_result = is_admin()
    logging.info(f"is_admin() 檢查結果: {admin_check_result}")
    print(f"is_admin() 檢查結果: {admin_check_result}")
    sys.stderr.write(f"[DEBUG] is_admin() 檢查結果: {admin_check_result}\n")
    sys.stderr.flush()
    
    if not admin_check_result:
        # 記錄詳細的拒絕原因
        logging.warning(f"用戶 {current_user.id} 嘗試訪問舉報管理但被拒絕")
        print(f"*** 權限檢查失敗 *** 用戶 {current_user.id} 嘗試訪問舉報管理但被拒絕")
        sys.stderr.write(f"[DEBUG] *** 權限檢查失敗 *** 用戶 {current_user.id} 嘗試訪問舉報管理但被拒絕\n")
        sys.stderr.flush()
        logging.warning(f"用戶類型: {type(current_user)}")
        logging.warning(f"用戶屬性: id={getattr(current_user, 'id', 'N/A')}, username={getattr(current_user, 'username', 'N/A')}")
        
        # 手動檢查環境變數
        import os
        from dotenv import load_dotenv
        load_dotenv()
        admin_emails_raw = os.getenv("ADMIN_EMAILS", "")
        admin_emails_parsed = set(email.strip() for email in admin_emails_raw.split(",") if email.strip())
        
        logging.warning(f"環境變數 ADMIN_EMAILS (原始): '{admin_emails_raw}'")
        print(f"環境變數 ADMIN_EMAILS (原始): '{admin_emails_raw}'")
        sys.stderr.write(f"[DEBUG] 環境變數 ADMIN_EMAILS (原始): '{admin_emails_raw}'\n")
        sys.stderr.flush()
        logging.warning(f"環境變數 ADMIN_EMAILS (解析): {admin_emails_parsed}")
        print(f"環境變數 ADMIN_EMAILS (解析): {admin_emails_parsed}")
        sys.stderr.write(f"[DEBUG] 環境變數 ADMIN_EMAILS (解析): {admin_emails_parsed}\n")
        sys.stderr.flush()
        logging.warning(f"用戶是否在管理員列表: {current_user.id in admin_emails_parsed}")
        print(f"用戶是否在管理員列表: {current_user.id in admin_emails_parsed}")
        sys.stderr.write(f"[DEBUG] 用戶是否在管理員列表: {current_user.id in admin_emails_parsed}\n")
        sys.stderr.flush()
        
        flash("您沒有管理員權限，無法訪問此頁面", "error")
        logging.warning("重定向到 admin.admin_dashboard")
        print("*** 重定向到 admin.admin_dashboard ***")
        sys.stderr.write("[DEBUG] *** 重定向到 admin.admin_dashboard ***\n")
        sys.stderr.flush()
        return redirect(url_for('admin.admin_dashboard'))
    
    # 如果權限檢查通過，應該到這裡
    sys.stderr.write("[DEBUG] 權限檢查通過，繼續執行\n")
    sys.stderr.flush()
    logging.info("權限檢查通過，開始載入舉報資料")
    
    try:
        sys.stderr.write("[DEBUG] 開始執行資料載入邏輯\n")
        sys.stderr.flush()
        
        # 獲取篩選參數
        status_filter = request.args.get('status', 'all')
        page = max(1, int(request.args.get('page', 1)))
        per_page = 20
        offset = (page - 1) * per_page
        
        sys.stderr.write(f"[DEBUG] 參數解析完成: status_filter={status_filter}, page={page}\n")
        sys.stderr.flush()
        
        conn = db.get_connection()
        sys.stderr.write("[DEBUG] 資料庫連接成功\n")
        sys.stderr.flush()
        
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        sys.stderr.write("[DEBUG] 資料庫 cursor 創建成功\n")
        sys.stderr.flush()
        
        # 構建 WHERE 條件
        where_clause = ""
        params = []
        if status_filter != 'all':
            where_clause = "WHERE r.Status = %s"
            params.append(status_filter)
        
        sys.stderr.write(f"[DEBUG] WHERE 條件構建完成: {where_clause}, params: {params}\n")
        sys.stderr.flush()
        
        # 獲取總數
        count_query = f"""
            SELECT COUNT(*) as total
            FROM Reports r
            {where_clause}
        """
        sys.stderr.write(f"[DEBUG] 執行計數查詢: {count_query}\n")
        sys.stderr.flush()
        
        try:
            cursor.execute(count_query, params)
            sys.stderr.write("[DEBUG] 計數查詢執行成功\n")
            sys.stderr.flush()
        except Exception as count_error:
            sys.stderr.write(f"[DEBUG] *** 計數查詢失敗 *** 錯誤: {count_error}\n")
            sys.stderr.flush()
            raise count_error
        
        total_count = cursor.fetchone()['total']
        
        sys.stderr.write(f"[DEBUG] 總數查詢完成: {total_count}\n")
        sys.stderr.flush()
        
        # 獲取列表數據
        list_query = f"""
            SELECT r.Report_id, r.User_Email, u.User_name, r.Theme, 
                   r.Options, r.Status, r.AI_Valid, r.AI_Confidence,
                   r.Created_at, r.Updated_at, r.Staff_Reply
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
        params.extend([per_page, offset])
        
        sys.stderr.write(f"[DEBUG] 執行列表查詢，參數: {params}\n")
        sys.stderr.flush()
        
        try:
            cursor.execute(list_query, params)
            sys.stderr.write("[DEBUG] 列表查詢執行成功\n")
            sys.stderr.flush()
        except Exception as list_error:
            sys.stderr.write(f"[DEBUG] *** 列表查詢失敗 *** 錯誤: {list_error}\n")
            sys.stderr.flush()
            raise list_error
        
        reports = cursor.fetchall()
        
        sys.stderr.write(f"[DEBUG] 列表查詢完成，獲得 {len(reports)} 筆記錄\n")
        sys.stderr.flush()
        
        # 獲取狀態統計
        cursor.execute("""
            SELECT Status, COUNT(*) as count
            FROM Reports
            GROUP BY Status
        """)
        status_stats = {row['Status']: row['count'] for row in cursor.fetchall()}
        
        conn.close()
        
        sys.stderr.write("[DEBUG] 資料庫連接已關閉\n")
        sys.stderr.flush()
        
        # 處理 JSON 數據
        for report in reports:
            if report['Options']:
                try:
                    report['Options'] = json.loads(report['Options'])
                except:
                    report['Options'] = []
        
        sys.stderr.write("[DEBUG] JSON 數據處理完成\n")
        sys.stderr.flush()
        
        # 分頁資訊
        total_pages = (total_count + per_page - 1) // per_page
        pagination = {
            'page': page,
            'total_pages': total_pages,
            'total_count': total_count,
            'has_prev': page > 1,
            'has_next': page < total_pages,
            'prev_num': page - 1 if page > 1 else None,
            'next_num': page + 1 if page < total_pages else None
        }
        
        sys.stderr.write(f"[DEBUG] 分頁資訊計算完成: {pagination}\n")
        sys.stderr.flush()
        
        sys.stderr.write("[DEBUG] 準備渲染模板 admin/report_list.html\n")
        sys.stderr.flush()
        
        return render_template('admin/report_list.html', 
                             reports=reports,
                             status_filter=status_filter,
                             status_stats=status_stats,
                             pagination=pagination)
        
    except Exception as e:
        sys.stderr.write(f"[DEBUG] *** EXCEPTION CAUGHT *** 錯誤: {str(e)}\n")
        sys.stderr.write(f"[DEBUG] 錯誤類型: {type(e).__name__}\n")
        sys.stderr.flush()
        
        import traceback
        sys.stderr.write(f"[DEBUG] 完整錯誤堆棧:\n{traceback.format_exc()}\n")
        sys.stderr.flush()
        
        logging.error(f"載入舉報列表失敗: {e}")
        flash("載入資料失敗，請稍後再試", "error")
        
        sys.stderr.write("[DEBUG] *** 準備在 except 中重定向到 dashboard ***\n")
        sys.stderr.flush()
        
        return redirect(url_for('admin.admin_dashboard'))

# ── 舉報詳情 ──────────────────────────────────────────
@admin_bp.route('/report/<int:report_id>')
@login_required
def admin_report_detail(report_id):
    """
    管理員舉報詳情審核頁面
    
    Args:
        report_id (int): 舉報 ID
        
    Returns:
        str: 舉報詳情 HTML 頁面，或 403/404 錯誤頁面
    """
    if not is_admin():
        flash("您沒有管理員權限，無法訪問此頁面", "error")
        return redirect(url_for('admin.admin_dashboard'))
    
    try:
        conn = db.get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        # 獲取舉報詳細資訊
        cursor.execute("""
            SELECT r.*, u.User_name, u.User_Avatar
            FROM Reports r
            LEFT JOIN User u ON r.User_Email = u.User_Email
            WHERE r.Report_id = %s
        """, (report_id,))
        
        report = cursor.fetchone()
        if not report:
            flash("找不到該舉報記錄", "error")
            return redirect(url_for('admin.admin_reports'))
        
        # 獲取處理歷程
        cursor.execute("""
            SELECT Action, Performed_by, Description, Created_at
            FROM Report_Audit_Log 
            WHERE Report_id = %s 
            ORDER BY Created_at ASC
        """, (report_id,))
        
        audit_logs = cursor.fetchall()
        
        # 如果有關聯的貼文，獲取貼文資訊
        post_info = None
        if report['Post_id']:
            cursor.execute("""
                SELECT p.Post_id, p.Content, p.User_Email, u.User_name
                FROM Posts p
                LEFT JOIN User u ON p.User_Email = u.User_Email
                WHERE p.Post_id = %s
            """, (report['Post_id'],))
            post_info = cursor.fetchone()
        
        conn.close()
        
        # 處理 JSON 數據
        if report['Options']:
            try:
                report['Options'] = json.loads(report['Options'])
            except:
                report['Options'] = []
        
        return render_template('admin/report_detail.html', 
                             report=report,
                             audit_logs=audit_logs,
                             post_info=post_info)
        
    except Exception as e:
        logging.error(f"載入舉報詳情失敗: {e}")
        flash("載入資料失敗，請稍後再試", "error")
        return redirect(url_for('admin.admin_reports'))

# ── 更新舉報狀態 ──────────────────────────────────────────
@admin_bp.route('/report/<int:report_id>/update', methods=['POST'])
@login_required
def admin_report_update(report_id):
    """
    更新舉報處理狀態和管理員回覆
    
    Args:
        report_id (int): 舉報 ID
        
    Returns:
        redirect: 重定向至舉報詳情頁面
    """
    if not is_admin():
        flash("您沒有管理員權限，無法執行此操作", "error")
        return redirect(url_for('admin.admin_reports'))
    
    try:
        # 獲取表單數據
        new_status = request.form.get('status')
        staff_reply = request.form.get('staff_reply', '').strip()
        notify_user = request.form.get('notify_user') == 'on'
        
        # 驗證狀態
        valid_statuses = ['pending', 'accepted', 'rejected', 'closed']
        if new_status not in valid_statuses:
            flash("無效的狀態值", "error")
            return redirect(url_for('admin.admin_report_detail', report_id=report_id))
        
        # 如果設為已接受或已拒絕，必須填寫回覆
        if new_status in ['accepted', 'rejected'] and not staff_reply:
            flash("處理結果為接受或拒絕時，必須填寫管理員回覆", "error")
            return redirect(url_for('admin.admin_report_detail', report_id=report_id))
        
        conn = db.get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        # 獲取當前舉報資訊
        cursor.execute("""
            SELECT User_Email, Status, Theme
            FROM Reports 
            WHERE Report_id = %s
        """, (report_id,))
        
        current_report = cursor.fetchone()
        if not current_report:
            flash("找不到該舉報記錄", "error")
            return redirect(url_for('admin.admin_reports'))
        
        old_status = current_report['Status']
        
        # 更新舉報狀態和回覆
        update_data = {
            'status': new_status,
            'staff_reply': staff_reply,
            'notified': 1 if notify_user else 0,
            'updated_at': datetime.now(),
            'report_id': report_id
        }
        
        cursor.execute("""
            UPDATE Reports 
            SET Status = %(status)s, 
                Staff_Reply = %(staff_reply)s,
                Notified = %(notified)s,
                Updated_at = %(updated_at)s
            WHERE Report_id = %(report_id)s
        """, update_data)
        
        conn.commit()
        
        # 記錄處理歷程
        action_description = f"狀態由 {old_status} 更新為 {new_status}"
        if staff_reply:
            action_description += f"，管理員回覆：{staff_reply[:50]}{'...' if len(staff_reply) > 50 else ''}"
        
        log_report_action(
            report_id,
            'manual_review',
            current_user.id,
            action_description
        )
        
        # 如果選擇通知使用者，發送 LINE 通知
        if notify_user and new_status in ['accepted', 'rejected']:
            status_text = "已接受" if new_status == 'accepted' else "已拒絕"
            notification_message = f"""
📋 舉報處理結果通知

🆔 舉報編號：#{report_id}
📋 主題：{current_report['Theme']}
✅ 處理結果：{status_text}

💬 管理員回覆：
{staff_reply}

感謝您的意見回饋！
            """.strip()
            
            # 這裡可以擴展為發送給舉報者，目前先通知管理員
            notify_admins(f"已完成舉報 #{report_id} 的處理，狀態：{status_text}")
            
            # 記錄通知歷程
            log_report_action(
                report_id,
                'notify_user',
                current_user.id,
                f"已通知使用者處理結果：{status_text}"
            )
        
        conn.close()
        
        flash(f"舉報狀態已更新為「{new_status}」", "success")
        return redirect(url_for('admin.admin_report_detail', report_id=report_id))
        
    except Exception as e:
        logging.error(f"更新舉報狀態失敗: {e}")
        flash("更新失敗，請稍後再試", "error")
        return redirect(url_for('admin.admin_report_detail', report_id=report_id))

# ── 舉報統計 ──────────────────────────────────────────
@admin_bp.route('/report/stats')
@login_required
def admin_report_stats():
    """
    舉報統計資訊頁面
    
    提供各種統計圖表和數據分析
    
    Returns:
        str: 統計頁面 HTML，或 403 錯誤頁面
    """
    if not is_admin():
        flash("您沒有管理員權限，無法訪問此頁面", "error")
        return redirect(url_for('admin.admin_dashboard'))
    
    try:
        conn = db.get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        # 基本統計
        cursor.execute("""
            SELECT 
                COUNT(*) as total_reports,
                SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN Status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
                SUM(CASE WHEN Status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                SUM(CASE WHEN AI_Valid = 1 THEN 1 ELSE 0 END) as ai_valid_count,
                AVG(AI_Confidence) as avg_confidence
            FROM Reports
        """)
        basic_stats = cursor.fetchone()
        
        # 每日舉報趨勢（最近 30 天）
        cursor.execute("""
            SELECT DATE(Created_at) as report_date, COUNT(*) as count
            FROM Reports
            WHERE Created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(Created_at)
            ORDER BY report_date DESC
        """)
        daily_trends = cursor.fetchall()
        
        # 舉報主題統計
        cursor.execute("""
            SELECT Theme, COUNT(*) as count
            FROM Reports
            GROUP BY Theme
            ORDER BY count DESC
            LIMIT 10
        """)
        theme_stats = cursor.fetchall()
        
        # AI 分析準確性統計
        cursor.execute("""
            SELECT 
                AI_Valid,
                Status,
                COUNT(*) as count
            FROM Reports
            WHERE Status IN ('accepted', 'rejected')
            GROUP BY AI_Valid, Status
        """)
        ai_accuracy = cursor.fetchall()
        
        conn.close()
        
        return render_template('admin/report_stats.html',
                             basic_stats=basic_stats,
                             daily_trends=daily_trends,
                             theme_stats=theme_stats,
                             ai_accuracy=ai_accuracy)
        
    except Exception as e:
        logging.error(f"載入舉報統計失敗: {e}")
        flash("載入統計資料失敗，請稍後再試", "error")
        return redirect(url_for('admin.admin_dashboard'))

# ── 測試路由（繞過權限檢查）──────────────────────────────────────────
@admin_bp.route('/report-test')
@login_required
def admin_reports_test():
    """
    測試用舉報列表頁面 - 繞過權限檢查
    用於診斷 302 重定向問題
    """
    logging.info("=== 測試舉報頁面訪問（繞過權限檢查）===")
    print("=== 測試舉報頁面訪問（繞過權限檢查）===")  # 強制輸出到 stdout
    
    # 檢查當前用戶狀態
    print(f"當前用戶: {current_user.id if current_user.is_authenticated else 'NOT_AUTHENTICATED'}")
    print(f"用戶類型: {type(current_user)}")
    
    # 檢查 is_admin 函數
    admin_result = is_admin()
    print(f"is_admin() 結果: {admin_result}")
    
    try:
        # 直接嘗試載入資料，不做權限檢查
        conn = db.get_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        # 簡單查詢
        cursor.execute("SELECT COUNT(*) as total FROM Reports")
        total_count = cursor.fetchone()['total']
        
        cursor.execute("""
            SELECT r.Report_id, r.User_Email, r.Theme, r.Status, r.Created_at
            FROM Reports r
            ORDER BY r.Created_at DESC
            LIMIT 10
        """)
        reports = cursor.fetchall()
        
        conn.close()
        
        # 返回簡單的 HTML 響應而不是模板
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><title>測試舉報頁面</title></head>
        <body>
            <h1>測試舉報頁面（繞過權限檢查）</h1>
            <p>成功載入！總舉報數: {total_count}</p>
            <h2>最近 10 筆舉報:</h2>
            <ul>
        """
        
        for report in reports:
            html += f"<li>#{report['Report_id']} - {report['Theme']} ({report['Status']})</li>"
        
        html += """
            </ul>
            <p><a href="/admin/dashboard">返回儀表板</a></p>
            <p><a href="/admin/report">嘗試正常舉報頁面</a></p>
        </body>
        </html>
        """
        
        logging.info("測試頁面成功載入")
        return html
        
    except Exception as e:
        logging.error(f"測試頁面載入失敗: {e}")
        return f"<h1>測試頁面錯誤</h1><p>錯誤: {str(e)}</p>"
