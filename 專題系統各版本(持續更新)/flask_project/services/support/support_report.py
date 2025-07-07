"""
使用者舉報服務模組

提供使用者舉報和意見回饋功能：
- 問題舉報表單提交
- Dify AI 自動分析
- 舉報記錄查詢
- 回覆狀態查看

主要路由：
- /support/report: 舉報表單頁面
- /support/report/submit: 提交舉報
- /support/report/history: 查看舉報歷史
- /support/report/detail/<report_id>: 查看舉報詳情

流程說明：
1. 使用者填寫舉報表單
2. 後端送至 Dify 進行 AI 分析
3. 儲存至 Reports 表並記錄處理歷程
4. LINE Bot 通知管理員
5. 使用者可查詢處理進度
"""

import os
import json
import logging
import requests
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from utils import db
from services.line.line_bot import notify_admins
from . import support_bp  # 從 __init__.py 導入 Blueprint

# ─── Dify 連線設定 ──────────────────────────────────────────
DIFY_API_URL = os.getenv("DIFY_API_URL", "https://api.dify.ai/v1/chat-messages") 
DIFY_KEY = os.getenv("DIFY_API_KEY_For_Report")  # 專門用於舉報分析的 API Key
HEADERS = {
    "Authorization": f"Bearer {DIFY_KEY}",
    "Content-Type": "application/json"
}

def send_to_dify_for_analysis(theme, options, context):
    """
    將舉報內容發送至 Dify 進行 AI 分析
    
    Args:
        theme (str): 舉報主題
        options (list): 選擇的類型選項
        context (str): 詳細說明
        
    Returns:
        dict: Dify 回傳的分析結果，包含：
            - is_valid: 是否為有效意見
            - category: 分類類別  
            - reason: 分析簡述
            - confidence: 判斷可信度
            - suggest_action: 建議行動
    """
    # 如果 DIFY_KEY 未設定，返回預設分析結果
    if not DIFY_KEY:
        logging.warning("DIFY_API_KEY_For_Report 未設定，使用預設分析結果")
        return {
            "is_valid": True,
            "category": "待人工審核",
            "reason": "Dify API 未配置，需要人工審核",
            "confidence": 0.5,
            "suggest_action": "轉交管理員進行人工審核"
        }
    
    try:
        dify_payload = {
            "inputs": {
                "theme": theme,
                "options": options,
                "context": context
            },
            "query": f"分析舉報：主題={theme}, 類型={options}, 說明={context}",
            "conversation_id": None,
            "response_mode": "blocking", 
            "user": str(current_user.id)
        }
        
        logging.info(f"發送 Dify 請求：{DIFY_API_URL}")
        response = requests.post(DIFY_API_URL, json=dify_payload, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        answer = result.get('answer', '{}')
        
        # 嘗試解析 JSON 回應
        try:
            analysis_result = json.loads(answer)
            logging.info(f"Dify 分析成功：{analysis_result}")
            return analysis_result
        except json.JSONDecodeError:
            # 如果不是 JSON 格式，返回預設分析結果
            logging.warning(f"Dify 回應格式異常：{answer}")
            return {
                "is_valid": True,
                "category": "待人工審核", 
                "reason": "AI 分析格式異常，需要人工審核",
                "confidence": 0.5,
                "suggest_action": "轉交管理員進行人工審核"
            }
            
    except requests.exceptions.Timeout:
        logging.error("Dify API 請求超時")
        return {
            "is_valid": True,
            "category": "系統錯誤",
            "reason": "AI 分析請求超時",
            "confidence": 0.0,
            "suggest_action": "系統恢復後重新分析"
        }
    except requests.exceptions.RequestException as e:
        logging.error(f"Dify API 請求失敗: {e}")
        return {
            "is_valid": True,
            "category": "系統錯誤",
            "reason": f"AI 分析系統暫時無法使用",
            "confidence": 0.0,
            "suggest_action": "系統恢復後重新分析"
        }
    except Exception as e:
        logging.error(f"Dify 分析失敗: {e}")
        return {
            "is_valid": True,
            "category": "系統錯誤",
            "reason": f"AI 分析系統暫時無法使用: {str(e)}",
            "confidence": 0.0,
            "suggest_action": "系統恢復後重新分析"
        }

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

# ── 舉報表單頁面 ──────────────────────────────────────────
@support_bp.route("/report")
@login_required
def report_form():
    """
    顯示舉報表單頁面
    
    Returns:
        str: 舉報表單 HTML 頁面
    """
    return render_template("support/report_form.html")

# ── 提交舉報 ──────────────────────────────────────────
@support_bp.route("/report/submit", methods=["POST"])
@login_required
def submit_report():
    """
    處理舉報表單提交
    
    接收表單數據，進行 AI 分析，儲存至資料庫並通知管理員
    
    Returns:
        redirect: 重定向至舉報歷史頁面
    """
    try:
        # 獲取表單數據
        theme = request.form.get('theme', '').strip()
        selected_options = request.form.getlist('options')  # 多選項目
        context = request.form.get('context', '').strip()
        post_id = request.form.get('post_id', None)  # 可選的貼文 ID
        
        # 日誌記錄接收到的數據
        logging.info(f"收到舉報提交：使用者={current_user.id}, 主題={theme}, 選項={selected_options}, 內容長度={len(context)}")
        
        # 基本驗證
        if not theme or not selected_options or not context:
            flash("請填寫所有必填欄位", "error")
            return redirect(url_for('support.report_form'))
        
        if len(context) < 10:
            flash("詳細說明至少需要 10 個字元", "error")
            return redirect(url_for('support.report_form'))
        
        # 處理 post_id（如果提供的話）
        if post_id and post_id.strip():  # 確保不是空字串
            try:
                post_id = int(post_id)
            except ValueError:
                post_id = None
        else:
            post_id = None  # 空字串或 None 都轉換為 None
        
        # 呼叫 Dify 進行 AI 分析
        logging.info("開始進行 Dify AI 分析...")
        analysis_result = send_to_dify_for_analysis(theme, selected_options, context)
        logging.info(f"AI 分析結果：{analysis_result}")
        
        # 儲存至資料庫
        logging.info("開始儲存至資料庫...")
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO Reports (
                User_Email, Post_id, Theme, Options, Context,
                AI_Valid, AI_Confidence, AI_Reason, AI_Suggest_Action,
                Status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            current_user.id,
            post_id,
            theme,
            json.dumps(selected_options, ensure_ascii=False),
            context,
            1 if analysis_result.get('is_valid') else 0,
            analysis_result.get('confidence', 0.0),
            analysis_result.get('reason', ''),
            analysis_result.get('suggest_action', ''),
            'pending'
        ))
        
        report_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logging.info(f"舉報已儲存，ID：{report_id}")
        
        # 記錄 AI 檢查歷程
        log_report_action(
            report_id, 
            'ai_check', 
            'system',
            f"AI 分析完成：{analysis_result.get('category', '未分類')}，可信度：{analysis_result.get('confidence', 0.0)}"
        )
        
        # LINE Bot 通知管理員
        notification_message = f"""
📢 新的舉報需要處理

🆔 舉報編號：#{report_id}
👤 舉報者：{current_user.id}
📋 主題：{theme}
🏷️ 類型：{', '.join(selected_options)}
📝 說明：{context[:100]}{'...' if len(context) > 100 else ''}

🤖 AI 分析：
• 分類：{analysis_result.get('category', '未分類')}
• 有效性：{'有效' if analysis_result.get('is_valid') else '無效'}
• 可信度：{analysis_result.get('confidence', 0.0):.2f}
• 建議：{analysis_result.get('suggest_action', '無建議')}

請至後台進行人工審核：/admin/report/{report_id}
        """.strip()
        
        try:
            notify_admins(notification_message)
            logging.info("LINE Bot 通知已發送")
        except Exception as line_error:
            logging.error(f"LINE Bot 通知失敗: {line_error}")
        
        flash("舉報已成功提交，我們會盡快處理。您可以在「舉報歷史」中查看處理進度。", "success")
        return redirect(url_for('support.report_history'))
        
    except Exception as e:
        logging.error(f"提交舉報失敗: {e}")
        import traceback
        logging.error(traceback.format_exc())
        flash("系統錯誤，請稍後再試", "error")
        return redirect(url_for('support.report_form'))

# ── 舉報歷史 ──────────────────────────────────────────
@support_bp.route("/report/history")
@login_required
def report_history():
    """
    顯示使用者的舉報歷史
    
    Returns:
        str: 舉報歷史 HTML 頁面
    """
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 添加日誌記錄
        logging.info(f"使用者 {current_user.id} 查詢舉報歷史")
        
        cursor.execute("""
            SELECT Report_id, Theme, Options, Context, Status, 
                   Staff_Reply, Created_at, Updated_at,
                   AI_Valid, AI_Confidence, AI_Reason
            FROM Reports 
            WHERE User_Email = %s 
            ORDER BY Created_at DESC
        """, (current_user.id,))
        
        reports = cursor.fetchall()
        logging.info(f"找到 {len(reports)} 筆舉報記錄")
        conn.close()
        
        # 處理 JSON 數據
        processed_reports = []
        for report in reports:
            report_dict = {
                'report_id': report[0],
                'theme': report[1],
                'options': json.loads(report[2]) if report[2] else [],
                'context': report[3],
                'status': report[4],
                'staff_reply': report[5],
                'created_at': report[6],
                'updated_at': report[7],
                'ai_valid': report[8],
                'ai_confidence': report[9],
                'ai_reason': report[10]
            }
            processed_reports.append(report_dict)
        
        return render_template("support/report_history.html", reports=processed_reports)
        
    except Exception as e:
        logging.error(f"獲取舉報歷史失敗: {e}")
        import traceback
        logging.error(traceback.format_exc())
        flash("載入資料失敗，請稍後再試", "error")
        return redirect(url_for('support.support_usage'))

# ── 舉報詳情 ──────────────────────────────────────────
@support_bp.route("/report/detail/<int:report_id>")
@login_required
def report_detail(report_id):
    """
    顯示舉報詳細資訊（僅限本人）
    """
    try:
        logging.debug(f"[report_detail] user={current_user.id} report_id={report_id}")

        conn   = db.get_connection()
        cursor = conn.cursor()

        # 只取屬於自己的舉報
        cursor.execute("""
            SELECT Report_id, Theme, Options, Context, Status,
                   Staff_Reply, Created_at, Updated_at,
                   AI_Valid, AI_Confidence, AI_Reason, AI_Suggest_Action,
                   Post_id
            FROM Reports
            WHERE Report_id = %s AND User_Email = %s
        """, (report_id, current_user.id))        # ← 關鍵：用 id

        report = cursor.fetchone()
        if not report:
            flash("找不到該舉報記錄", "error")
            return redirect(url_for('support.report_history'))

        # 讀取處理歷程
        cursor.execute("""
            SELECT Action, Performed_by, Description, Created_at
            FROM Report_Audit_Log
            WHERE Report_id = %s
            ORDER BY Created_at ASC
        """, (report_id,))
        audit_logs_raw = cursor.fetchall()
        conn.close()

        # 處理 audit_logs 數據
        audit_logs = []
        for log in audit_logs_raw:
            log_dict = {
                'Action': log[0],
                'Performed_by': log[1], 
                'Description': log[2],
                'Created_at': log[3]
            }
            audit_logs.append(log_dict)

        # 整理資料給 template
        report_data = {
            'report_id'       : report[0],
            'theme'           : report[1],
            'options'         : json.loads(report[2]) if report[2] else [],
            'context'         : report[3],
            'status'          : report[4],
            'staff_reply'     : report[5],
            'created_at'      : report[6],
            'updated_at'      : report[7],
            'ai_valid'        : report[8],
            'ai_confidence'   : report[9],
            'ai_reason'       : report[10],
            'ai_suggest_action': report[11],
            'post_id'         : report[12]
        }

        return render_template("support/report_detail.html",
                               report=report_data,
                               audit_logs=audit_logs)

    except Exception as e:
        logging.exception("[report_detail] error")
        flash("載入資料失敗，請稍後再試", "error")
        return redirect(url_for('support.report_history'))
