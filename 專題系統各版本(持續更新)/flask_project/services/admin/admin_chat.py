# services/admin/admin_chat.py
"""後台真人客服面板"""
import pymysql
from flask import render_template, request, jsonify, current_app, abort
from flask_login import login_required, current_user
from utils import db
from services.admin.admin import is_admin  # 引入 is_admin 函數
from . import admin_chat_bp  # 從 __init__.py 導入 Blueprint

# 安全取得 socketio 實例
def get_socketio():
    socketio_instance = current_app.extensions.get("socketio")
    if socketio_instance is None:
        current_app.logger.error("get_socketio in admin_chat.py: Failed to get socketio from current_app.extensions.")
    return socketio_instance

# 1. 顯示需要真人客服的對話列表
@admin_chat_bp.route("/panel", endpoint="panel")
@login_required
def panel():
    # 檢查用戶是否為管理員
    if not is_admin():
        return abort(403, "您沒有管理員權限，無法訪問此頁面")
    
    database_connection = db.get_connection()
    database_cursor = database_connection.cursor(pymysql.cursors.DictCursor)
    database_cursor.execute("""
        SELECT s.session_id, s.user_email,
               COUNT(l.id) AS msg_total,
               s.is_open
        FROM AIChatSessions AS s
        LEFT JOIN AIChatLogs AS l
               ON l.session_id = s.session_id
        WHERE s.need_human = 1 AND s.is_open = 1
        GROUP BY s.session_id
        ORDER BY s.updated_at DESC
    """)
    sessions = database_cursor.fetchall()
    database_connection.close()
    return render_template("admin/chat_panel.html", sessions=sessions)

# 2. 取得單一 session 的聊天紀錄
@admin_chat_bp.route("/logs/<int:session_id>")
@login_required
def get_chat_logs(session_id):
    # 檢查用戶是否為管理員
    if not is_admin():
        return jsonify({"error": "權限不足"}), 403
    
    # 先檢查該會話是否存在且開放中
    database_connection = db.get_connection()
    database_cursor = database_connection.cursor(pymysql.cursors.DictCursor)
    
    # 查詢會話狀態
    database_cursor.execute("SELECT is_open FROM AIChatSessions WHERE session_id=%s", (session_id,))
    session_info = database_cursor.fetchone()
    
    if not session_info:
        database_connection.close()
        return jsonify({"error": "找不到此會話"}), 404
    
    # 即使會話已關閉，仍然允許查看聊天記錄，但會添加狀態標記
    is_open = session_info['is_open'] == 1
    
    database_cursor.execute("""
        SELECT role, message, created_at
        FROM AIChatLogs
        WHERE session_id=%s
        ORDER BY id
    """, (session_id,))
    messages = database_cursor.fetchall()
    database_connection.close()
    
    # 在回傳的資料中添加會話狀態訊息
    response = {
        "messages": messages,
        "is_open": is_open
    }
    
    return jsonify(response)

# 3. 管理員回覆
@admin_chat_bp.route("/reply", methods=["POST"])
@login_required
def reply():
    # 檢查用戶是否為管理員
    if not is_admin():
        return jsonify({"error": "權限不足"}), 403
    
    request_data = request.get_json()
    session_id = request_data.get("session_id")
    admin_message = request_data.get("message")

    database_connection = db.get_connection()
    database_cursor = database_connection.cursor()

    # 檢查會話是否仍然開放
    database_cursor.execute("SELECT is_open FROM AIChatSessions WHERE session_id=%s", (session_id,))
    session_query_result = database_cursor.fetchone()
    if not session_query_result or session_query_result[0] == 0:
        database_connection.close()
        return jsonify({"error": "此會話已關閉"}), 400

    # 寫入管理員訊息
    database_cursor.execute("INSERT INTO AIChatLogs (session_id, role, message) VALUES (%s, 'admin', %s)", (session_id, admin_message))
    # 更新會話的 updated_at，但不再自動將 need_human 設為 0，也不再將 is_open 設為 0
    # 讓 Dify API 保持暫停，直到使用者端重整頁面產生新的 session_id
    database_cursor.execute("UPDATE AIChatSessions SET updated_at = NOW() WHERE session_id = %s", (session_id,))
    database_connection.commit()
    database_connection.close()

    # 從暫停列表中移除 session_id，因為管理員已回覆，但 Dify API 仍應對此 session_id 保持暫停
    # 實際上，Dify API 的暫停是基於 current_app.dify_paused_sessions 集合，
    # 並且只在新訊息進來時在 ai_chat.py 中檢查。管理員回覆不直接影響此集合。
    # 如果希望管理員回覆後，使用者可以繼續和 Dify 互動（不建議，因為已轉真人），才需要移除。
    # 目前的邏輯是：一旦轉真人，該 session_id 的 Dify 功能就停用，直到使用者重整得到新 session_id。

    # 廣播訊息給特定 session 的所有客戶端 (包括使用者和可能的其他管理員)
    socketio = get_socketio()
    if socketio:
        socketio.emit("msg_added", {
            "session_id": session_id,
            "role": "admin",
            "message": admin_message
        }, namespace="/chat") # 確保廣播到 /chat namespace

    return jsonify({"ok": True})

# 4. 新增API端點來處理用戶離開狀態
@admin_chat_bp.route("/update_session_status", methods=["POST"])
@login_required
def update_session_status():
    # 檢查用戶是否為管理員
    if not is_admin():
        return jsonify({"error": "權限不足"}), 403
    
    request_data = request.get_json()
    session_id = request_data.get("session_id")
    is_open = request_data.get("is_open", 0)  # 預設關閉會話
    
    database_connection = db.get_connection()
    database_cursor = database_connection.cursor()
    
    # 更新會話狀態
    database_cursor.execute("UPDATE AIChatSessions SET is_open = %s WHERE session_id = %s", 
                (is_open, session_id))
    
    database_connection.commit()
    database_connection.close()
    
    return jsonify({"ok": True, "session_id": session_id, "is_open": is_open})
