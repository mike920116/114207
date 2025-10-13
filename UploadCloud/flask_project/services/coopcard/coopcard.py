# -*- coding: utf-8 -*-
"""
好友互動功能主模組 (CoopCard)

提供好友互動核心功能：
- 好友搜尋與請求發送
- 好友請求管理（接受/拒絕）
- 好友列表查看
- 好友狀態與互動記錄

主要功能：
- 支援email和username搜尋用戶
- 完整的好友請求生命週期管理
- 好友關係雙向確認機制
- 與情緒AI功能深度整合

主要路由：
- /coopcard/: 好友互動主頁
- /coopcard/friend_requests: 好友請求管理
- /coopcard/friends_list: 好友列表
"""

from flask import render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user
from utils import db
from datetime import datetime
import logging
from . import coopcard_bp  # 從 __init__.py 導入 Blueprint

# 設置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 導入 User ID 管理 API
from . import user_id_api

# ===== 工具函數 =====

def get_avatar_url(user_avatar):
    """
    統一的頭像URL處理函數
    
    處理各種頭像路徑格式，統一轉換為完整的URL路徑。
    支援：NULL、相對路徑、完整路徑、外部URL
    
    Args:
        user_avatar: 從資料庫取得的 User_Avatar 值
        
    Returns:
        str: 完整的頭像URL路徑
        
    Examples:
        None -> '/static/icons/avatars/default.png'
        'avatar1.png' -> '/static/icons/avatars/avatar1.png'
        'icons/avatars/avatar1.png' -> '/static/icons/avatars/avatar1.png'
        '/static/icons/avatars/avatar1.png' -> '/static/icons/avatars/avatar1.png'
        'https://example.com/avatar.jpg' -> 'https://example.com/avatar.jpg'
    """
    # 如果沒有頭像，返回預設頭像
    if not user_avatar:
        return '/static/icons/avatars/default.png'
    
    # 如果已經是完整URL（http/https開頭）或絕對路徑（/開頭），直接返回
    if user_avatar.startswith(('http://', 'https://', '/')):
        return user_avatar
    
    # 如果是相對路徑（icons/avatars/開頭），加上 /static/ 前綴
    if user_avatar.startswith('icons/avatars/'):
        return f'/static/{user_avatar}'
    
    # 如果只是檔名，加上完整路徑
    return f'/static/icons/avatars/{user_avatar}'

# ===== 路由定義 =====

@coopcard_bp.route('/', strict_slashes=False)
@login_required
def coopcard_main():
    """好友互動主頁"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 獲取待處理的好友請求數量
        cursor.execute("""
            SELECT COUNT(*) FROM friend_requests 
            WHERE receiver_email = %s AND status = 'pending'
        """, (current_user.id,))
        pending_requests_count = cursor.fetchone()[0]
        
        # 獲取好友總數
        cursor.execute("""
            SELECT COUNT(*) FROM friend_requests 
            WHERE (requester_email = %s OR receiver_email = %s) AND status = 'accepted'
        """, (current_user.id, current_user.id))
        friends_count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return render_template('coopcard/coopcard_main.html',
                             pending_requests_count=pending_requests_count,
                             friends_count=friends_count)
                             
    except Exception as e:
        logger.error(f"載入好友互動主頁失敗: {e}")
        flash('載入頁面失敗，請稍後再試', 'error')
        return redirect(url_for('index'))



@coopcard_bp.route('/friend_requests')
@login_required
def friend_requests():
    """好友請求管理頁面"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 獲取收到的待處理請求
        cursor.execute("""
            SELECT fr.id, fr.requester_email, u.User_name, u.User_Avatar, fr.created_at
            FROM friend_requests fr
            JOIN user u ON fr.requester_email COLLATE utf8mb4_unicode_ci = u.User_Email COLLATE utf8mb4_unicode_ci
            WHERE fr.receiver_email = %s AND fr.status = 'pending'
            ORDER BY fr.created_at DESC
        """, (current_user.id,))
        
        incoming_requests = cursor.fetchall()
        
        # 獲取發送的請求狀態
        cursor.execute("""
            SELECT fr.id, fr.receiver_email, u.User_name, u.User_Avatar, fr.status, fr.created_at
            FROM friend_requests fr
            JOIN user u ON fr.receiver_email COLLATE utf8mb4_unicode_ci = u.User_Email COLLATE utf8mb4_unicode_ci
            WHERE fr.requester_email = %s
            ORDER BY fr.created_at DESC
        """, (current_user.id,))
        
        outgoing_requests = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template('coopcard/friend_requests.html',
                             incoming_requests=incoming_requests,
                             outgoing_requests=outgoing_requests)
                             
    except Exception as e:
        logger.error(f"載入好友請求頁面失敗: {e}")
        flash('載入頁面失敗，請稍後再試', 'error')
        return redirect(url_for('coopcard.coopcard_main'))

@coopcard_bp.route('/respond_request', methods=['POST'])
@login_required
def respond_request():
    """回應好友請求（接受/拒絕）"""
    try:
        request_id = request.form.get('request_id')
        action = request.form.get('action')  # 'accept' or 'reject'
        
        if not request_id or action not in ['accept', 'reject']:
            return jsonify({'success': False, 'message': '無效的請求參數'})
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 驗證請求是否存在且屬於當前用戶
        cursor.execute("""
            SELECT requester_email FROM friend_requests 
            WHERE id = %s AND receiver_email = %s AND status = 'pending'
        """, (request_id, current_user.id))
        
        request_info = cursor.fetchone()
        
        if not request_info:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '找不到該好友請求'})
        
        # 更新請求狀態
        new_status = 'accepted' if action == 'accept' else 'rejected'
        cursor.execute("""
            UPDATE friend_requests 
            SET status = %s, updated_at = NOW()
            WHERE id = %s
        """, (new_status, request_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        message = '已接受好友請求' if action == 'accept' else '已拒絕好友請求'
        return jsonify({'success': True, 'message': message})
        
    except Exception as e:
        logger.error(f"回應好友請求失敗: {e}")
        return jsonify({'success': False, 'message': '操作失敗，請稍後再試'})

@coopcard_bp.route('/friends_list')
@login_required
def friends_list():
    """好友列表頁面"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 獲取所有已接受的好友關係
        cursor.execute("""
            SELECT DISTINCT
                CASE 
                    WHEN fr.requester_email = %s THEN fr.receiver_email
                    ELSE fr.requester_email
                END as friend_email,
                u.User_name, u.User_Avatar, u.bio, u.user_level,
                fr.updated_at as friend_since
            FROM friend_requests fr
            JOIN user u ON (
                CASE 
                    WHEN fr.requester_email = %s THEN fr.receiver_email = u.User_Email
                    ELSE fr.requester_email = u.User_Email
                END
            )
            WHERE (fr.requester_email = %s OR fr.receiver_email = %s)
            AND fr.status = 'accepted'
            ORDER BY fr.updated_at DESC
        """, (current_user.id, current_user.id, current_user.id, current_user.id))
        
        friends = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template('coopcard/friends_list.html', friends=friends)
        
    except Exception as e:
        logger.error(f"載入好友列表失敗: {e}")
        flash('載入好友列表失敗，請稍後再試', 'error')
        return redirect(url_for('coopcard.coopcard_main'))

# ============================================================================
# 簡化的好友功能API - 重新設計以避免複雜邏輯干擾
# ============================================================================

@coopcard_bp.route('/api/friend_requests_simple')
@login_required  
def get_friend_requests_simple():
    """簡化的好友請求API - 獲取當前用戶的待處理好友請求"""
    try:
        logger.info(f"[簡化好友API] 用戶 {current_user.id} 請求好友請求列表")
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 簡化的查詢，添加 COLLATE 修復字符集問題
        cursor.execute("""
            SELECT fr.id, fr.requester_email, u.User_name, u.User_Avatar, u.user_id, fr.created_at
            FROM friend_requests fr
            JOIN user u ON fr.requester_email COLLATE utf8mb4_unicode_ci = u.User_Email COLLATE utf8mb4_unicode_ci
            WHERE fr.receiver_email COLLATE utf8mb4_unicode_ci = %s AND fr.status = 'pending'
            ORDER BY fr.created_at DESC
            LIMIT 10
        """, (current_user.id,))
        
        requests = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # 組織返回資料
        requests_data = []
        for req in requests:
            # 決定顯示名稱：優先user_id，其次User_name，最後email前綴
            display_name = req[4] if req[4] else (req[2] if req[2] and req[2] != req[1] else req[1].split('@')[0])
            
            requests_data.append({
                'id': req[0],
                'requester_email': req[1], 
                'name': display_name,
                'full_name': req[2] or '未設置姓名',
                'avatar': get_avatar_url(req[3]),
                'user_id': req[4] or '未設置ID',
                'created_at': req[5].strftime('%Y-%m-%d %H:%M') if req[5] else ''
            })
        
        logger.info(f"[簡化好友API] 返回 {len(requests_data)} 個待處理請求")
        
        return jsonify({
            'success': True,
            'requests': requests_data,
            'count': len(requests_data)
        })
        
    except Exception as e:
        logger.error(f"[簡化好友API] 獲取好友請求失敗: {e}")
        import traceback
        logger.error(f"[簡化好友API] 詳細錯誤: {traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'message': '載入好友請求失敗，請稍後再試',
            'requests': [],
            'count': 0
        }), 500

@coopcard_bp.route('/api/respond_friend_request_simple', methods=['POST'])
@login_required
def respond_friend_request_simple():
    """簡化的好友請求回應API"""
    try:
        data = request.get_json()
        request_id = data.get('request_id')
        action = data.get('action')  # 'accept' or 'reject'
        
        if not request_id or action not in ['accept', 'reject']:
            return jsonify({'success': False, 'message': '無效的請求參數'})
        
        logger.info(f"[簡化回應API] 用戶 {current_user.id} {action} 好友請求 {request_id}")
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 驗證請求屬於當前用戶 - 添加 COLLATE 修復字符集問題
        cursor.execute("""
            SELECT requester_email FROM friend_requests 
            WHERE id = %s AND receiver_email COLLATE utf8mb4_unicode_ci = %s AND status = 'pending'
        """, (request_id, current_user.id))
        
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '請求不存在或已處理'})
        
        # 更新請求狀態
        new_status = 'accepted' if action == 'accept' else 'rejected'
        cursor.execute("""
            UPDATE friend_requests 
            SET status = %s, updated_at = NOW()
            WHERE id = %s
        """, (new_status, request_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        action_text = '接受' if action == 'accept' else '拒絕'
        message = f'已{action_text}好友請求'
        
        logger.info(f"[簡化回應API] 成功{action_text}請求 {request_id}")
        
        return jsonify({
            'success': True,
            'message': message
        })
        
    except Exception as e:
        logger.error(f"[簡化回應API] 回應好友請求失敗: {e}")
        return jsonify({'success': False, 'message': '操作失敗，請稍後再試'})

@coopcard_bp.route('/api/send_friend_request_simple', methods=['POST'])
@login_required
def send_friend_request_simple():
    """簡化的發送好友請求API"""
    try:
        data = request.get_json()
        target_email = data.get('target_email', '').strip()
        
        if not target_email:
            return jsonify({'success': False, 'message': '缺少目標用戶信息'})
        
        if target_email == current_user.id:
            return jsonify({'success': False, 'message': '不能向自己發送好友請求'})
        
        logger.info(f"[簡化發送API] 用戶 {current_user.id} 向 {target_email} 發送好友請求")
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 檢查目標用戶是否存在
        cursor.execute("SELECT User_Email, User_name FROM user WHERE User_Email = %s", (target_email,))
        target_user = cursor.fetchone()
        
        if not target_user:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '目標用戶不存在'})
        
        # 檢查是否已有好友關係或請求 - 添加 COLLATE 修復字符集問題
        cursor.execute("""
            SELECT status FROM friend_requests 
            WHERE (requester_email COLLATE utf8mb4_unicode_ci = %s 
                   AND receiver_email COLLATE utf8mb4_unicode_ci = %s) 
               OR (requester_email COLLATE utf8mb4_unicode_ci = %s 
                   AND receiver_email COLLATE utf8mb4_unicode_ci = %s)
        """, (current_user.id, target_email, target_email, current_user.id))
        
        existing = cursor.fetchone()
        
        if existing:
            status = existing[0]
            if status == 'accepted':
                message = '你們已經是好友了'
            elif status == 'pending':
                message = '好友請求已發送，請等待回應'
            else:
                # 如果是rejected，允许重新发送 - 添加 COLLATE
                cursor.execute("""
                    DELETE FROM friend_requests 
                    WHERE (requester_email COLLATE utf8mb4_unicode_ci = %s 
                           AND receiver_email COLLATE utf8mb4_unicode_ci = %s) 
                       OR (requester_email COLLATE utf8mb4_unicode_ci = %s 
                           AND receiver_email COLLATE utf8mb4_unicode_ci = %s)
                """, (current_user.id, target_email, target_email, current_user.id))
                # 继续执行发送逻辑
                existing = None
        
        if existing:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': message})
        
        # 發送好友請求
        cursor.execute("""
            INSERT INTO friend_requests (requester_email, receiver_email, status, created_at)
            VALUES (%s, %s, 'pending', NOW())
        """, (current_user.id, target_email))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"[簡化發送API] 成功發送好友請求給 {target_email}")
        
        return jsonify({
            'success': True,
            'message': f'已向 {target_user[1] or target_email} 發送好友請求'
        })
        
    except Exception as e:
        logger.error(f"[簡化發送API] 發送好友請求失敗: {e}")
        import traceback
        logger.error(f"[簡化發送API] 詳細錯誤: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': '發送請求失敗，請稍後再試'})



@coopcard_bp.route('/api/search_users')
@login_required
def api_search_users():
    """即時搜尋用戶API - 支援模糊匹配和好友狀態檢查"""
    try:
        search_query = request.args.get('q', '').strip()
        logger.info(f"[搜尋好友API] 收到搜尋請求 - 用戶: {current_user.id}, 搜尋關鍵字: '{search_query}'")
        
        if not search_query or len(search_query) < 1:
            return jsonify({'success': True, 'users': []})
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 模糊搜尋用戶（排除自己）
        search_pattern = f'%{search_query}%'
        cursor.execute("""
            SELECT User_Email, User_name, User_Avatar, bio, user_level
            FROM user 
            WHERE (User_Email LIKE %s OR User_name LIKE %s) 
            AND User_Email != %s
            ORDER BY 
                CASE 
                    WHEN User_name LIKE %s THEN 1
                    WHEN User_Email LIKE %s THEN 2
                    ELSE 3
                END,
                User_name ASC
            LIMIT 20
        """, (search_pattern, search_pattern, current_user.id, 
              f'{search_query}%', f'{search_query}%'))
        
        users_data = cursor.fetchall()
        users_list = []
        
        for user in users_data:
            user_email = user[0]
            
            # 檢查與當前用戶的好友關係狀態
            cursor.execute("""
                SELECT status, requester_email, receiver_email 
                FROM friend_requests 
                WHERE (requester_email = %s AND receiver_email = %s) 
                   OR (requester_email = %s AND receiver_email = %s)
            """, (current_user.id, user_email, user_email, current_user.id))
            
            friend_relationship = cursor.fetchone()
            
            # 判斷好友狀態
            if friend_relationship:
                status = friend_relationship[0]
                requester = friend_relationship[1]
                
                if status == 'accepted':
                    friend_status = 'friends'
                    status_text = '已成為好友!'
                    button_class = 'status-friends'
                    button_disabled = True
                elif status == 'pending':
                    if requester == current_user.id:
                        friend_status = 'request_sent' 
                        status_text = '請求已發送'
                        button_class = 'status-pending'
                        button_disabled = True
                    else:
                        friend_status = 'request_received'
                        status_text = '已收到請求'
                        button_class = 'status-received'
                        button_disabled = True
                else:  # rejected
                    friend_status = 'can_send'
                    status_text = '發送好友請求'
                    button_class = 'status-can-send'
                    button_disabled = False
            else:
                friend_status = 'can_send'
                status_text = '發送好友請求'
                button_class = 'status-can-send'
                button_disabled = False
            
            users_list.append({
                'email': user_email,
                'name': user[1] or '未設置姓名',
                'avatar': get_avatar_url(user[2]),
                'bio': user[3] or '',
                'user_level': user[4] or 1,
                'friend_status': friend_status,
                'status_text': status_text,
                'button_class': button_class,
                'button_disabled': button_disabled
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True, 
            'users': users_list,
            'query': search_query,
            'total': len(users_list)
        })
        
    except Exception as e:
        logger.error(f"[搜尋好友API] 搜尋失敗 - 用戶: {current_user.id}, 錯誤: {str(e)}")
        logger.error(f"[搜尋好友API] 錯誤詳情: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"[搜尋好友API] 堆疊追蹤: {traceback.format_exc()}")
        return jsonify({'success': False, 'users': [], 'error': f'搜尋服務暫時不可用：{str(e)}'})

@coopcard_bp.route('/api/search_users_extended')
@login_required
def api_search_users_extended():
    """擴展的用戶搜尋API - 支援user_id和email/name搜尋"""
    try:
        search_query = request.args.get('q', '').strip()
        logger.info(f"[擴展搜尋API] 收到搜尋請求 - 用戶: {current_user.id}, 搜尋關鍵字: '{search_query}'")
        
        if not search_query or len(search_query) < 1:
            return jsonify({'success': True, 'users': []})
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 擴展搜尋：支援user_id、email和name的模糊匹配
        search_pattern = f'%{search_query}%'
        cursor.execute("""
            SELECT User_Email, User_name, User_Avatar, bio, user_level, user_id
            FROM user 
            WHERE (User_Email LIKE %s OR User_name LIKE %s OR user_id LIKE %s) 
            AND User_Email != %s
            ORDER BY 
                CASE 
                    WHEN user_id LIKE %s THEN 1
                    WHEN User_name LIKE %s THEN 2
                    WHEN User_Email LIKE %s THEN 3
                    ELSE 4
                END,
                User_name ASC
            LIMIT 20
        """, (search_pattern, search_pattern, search_pattern, current_user.id, 
              f'{search_query}%', f'{search_query}%', f'{search_query}%'))
        
        users_data = cursor.fetchall()
        users_list = []
        
        for user in users_data:
            user_email = user[0]
            
            # 檢查與當前用戶的好友關係狀態
            cursor.execute("""
                SELECT status, requester_email, receiver_email 
                FROM friend_requests 
                WHERE (requester_email = %s AND receiver_email = %s) 
                   OR (requester_email = %s AND receiver_email = %s)
            """, (current_user.id, user_email, user_email, current_user.id))
            
            friend_relationship = cursor.fetchone()
            
            # 判斷好友狀態
            if friend_relationship:
                status = friend_relationship[0]
                requester = friend_relationship[1]
                
                if status == 'accepted':
                    friend_status = 'friends'
                    status_text = '已成為好友!'
                    button_class = 'status-friends'
                    button_disabled = True
                elif status == 'pending':
                    if requester == current_user.id:
                        friend_status = 'request_sent' 
                        status_text = '請求已發送'
                        button_class = 'status-pending'
                        button_disabled = True
                    else:
                        friend_status = 'request_received'
                        status_text = '已收到請求'
                        button_class = 'status-received'
                        button_disabled = True
                else:  # rejected
                    friend_status = 'can_send'
                    status_text = '發送好友請求'
                    button_class = 'status-can-send'
                    button_disabled = False
            else:
                friend_status = 'can_send'
                status_text = '發送好友請求'
                button_class = 'status-can-send'
                button_disabled = False
            
            users_list.append({
                'email': user_email,
                'name': user[1] or '未設置姓名',
                'avatar': get_avatar_url(user[2]),
                'bio': user[3] or '',
                'user_level': user[4] or 1,
                'user_id': user[5],  # 添加user_id字段
                'friend_status': friend_status,
                'status_text': status_text,
                'button_class': button_class,
                'button_disabled': button_disabled
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True, 
            'users': users_list,
            'query': search_query,
            'total': len(users_list)
        })
        
    except Exception as e:
        logger.error(f"[擴展搜尋API] 搜尋失敗 - 用戶: {current_user.id}, 錯誤: {str(e)}")
        logger.error(f"[擴展搜尋API] 錯誤詳情: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"[擴展搜尋API] 堆疊追蹤: {traceback.format_exc()}")
        return jsonify({'success': False, 'users': [], 'error': f'搜尋服務暫時不可用：{str(e)}'})

# ==================== 任務卡片功能 ====================

@coopcard_bp.route('/api/save-task-card', methods=['POST'])
@login_required
def save_task_card():
    """保存任務卡片API - 更新版支援新的進度追蹤功能"""
    try:
        # 獲取表單數據
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()
        stamp_icon = request.form.get('stamp_icon', 'fas fa-leaf').strip()  # 預設改為葉子
        daily_executions = int(request.form.get('daily_executions', 2))
        max_participants = int(request.form.get('max_participants', 5))
        
        # 新增：支援結束日期輸入
        end_date = request.form.get('end_date', '').strip()
        if not end_date:
            # 如果沒有提供結束日期，使用duration_days計算（向後兼容）
            duration_days = int(request.form.get('duration_days', 3))
            from datetime import datetime, timedelta
            end_date = (datetime.now() + timedelta(days=duration_days)).strftime('%Y-%m-%d')
        
        # 驗證必填欄位
        if not title or not content:
            return jsonify({'success': False, 'message': '標題和內容不能為空'})
        
        # 驗證數值範圍
        if daily_executions < 1 or daily_executions > 20:
            return jsonify({'success': False, 'message': '每日執行次數必須在1-20之間'})
        
        if max_participants < 1 or max_participants > 10:
            return jsonify({'success': False, 'message': '參與人數必須在1-10之間'})
        
        # 驗證結束日期
        try:
            from datetime import datetime
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            if end_date_obj <= datetime.now().date():
                return jsonify({'success': False, 'message': '結束日期必須晚於今天'})
        except ValueError:
            return jsonify({'success': False, 'message': '結束日期格式無效'})
        
        # 保存到資料庫
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 更新SQL以支援新欄位
        cursor.execute("""
            INSERT INTO task_cards (user_id, title, content, stamp_icon, 
                                   daily_executions, max_participants, end_date,
                                   daily_completed_count, last_reset_date, participants_count,
                                   status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'published', NOW())
        """, (current_user.id, title, content, stamp_icon, 
              daily_executions, max_participants, end_date,
              0, datetime.now().date(), 1))
        
        card_id = cursor.lastrowid
        
        # 同時在participants表中添加創建者記錄
        cursor.execute("""
            INSERT INTO card_participants (card_id, user_id, status, joined_at)
            VALUES (%s, %s, 'active', NOW())
        """, (card_id, current_user.id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"用戶 {current_user.id} 創建了任務卡片 {card_id}: {title}")
        
        return jsonify({
            'success': True, 
            'message': '任務卡片已成功掛上清單！',
            'card_id': card_id
        })
        
    except ValueError as e:
        return jsonify({'success': False, 'message': '數值格式錯誤'})
    except Exception as e:
        logger.error(f"保存任務卡片失敗: {e}")
        return jsonify({'success': False, 'message': '保存卡片失敗，請稍後再試'})

@coopcard_bp.route('/api/get-task-cards')
@login_required
def get_task_cards():
    """獲取任務卡片列表API - 更新版支援進度追蹤，包含參與的卡片"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 修改SQL查詢以包含用戶參與的所有卡片（自己創建的 + 參與的）
        # 排除已歸檔和已結算的卡片
        cursor.execute("""
            SELECT DISTINCT tc.id, tc.title, tc.content, tc.stamp_icon, tc.daily_executions, 
                   tc.max_participants, tc.status, tc.created_at, tc.updated_at,
                   tc.daily_completed_count, tc.last_reset_date, tc.end_date, tc.participants_count,
                   tc.user_id,
                   CASE WHEN tc.user_id = %s THEN 'owner' ELSE 'participant' END as user_role
            FROM task_cards tc
            LEFT JOIN card_participants cp ON tc.id = cp.card_id
            WHERE (tc.user_id = %s OR (cp.user_id = %s AND cp.status = 'active'))
              AND tc.status = 'published'
            ORDER BY tc.created_at DESC
        """, (current_user.id, current_user.id, current_user.id))
        
        cards_data = cursor.fetchall()
        
        # 檢查並重置需要重置的卡片
        from datetime import date, datetime
        today = date.today()
        cards_to_reset = []
        
        for card in cards_data:
            if card[10] and card[10] != today:  # last_reset_date != today
                cards_to_reset.append(card[0])  # card_id
        
        # 批量重置過期的每日計數
        if cards_to_reset:
            cursor.execute("""
                UPDATE task_cards 
                SET daily_completed_count = 0, last_reset_date = %s
                WHERE id IN ({})
            """.format(','.join(['%s'] * len(cards_to_reset))), 
            [today] + cards_to_reset)
            conn.commit()
        
        # 保留連線用於查詢參與者頭像
        # cursor 和 conn 將在處理完所有卡片後關閉
        
        cards_list = []
        for card in cards_data:
            # 重置後的計數（如果卡片被重置的話）
            daily_completed = 0 if card[0] in cards_to_reset else card[9]
            
            # 計算天數進度
            created_date = card[7].date() if isinstance(card[7], datetime) else card[7]
            end_date = card[11]
            total_days = (end_date - created_date).days + 1
            elapsed_days = min((today - created_date).days + 1, total_days)
            remaining_days = max(0, (end_date - today).days)
            
            # 判斷卡片類型和顏色主題
            is_owner = card[13] == current_user.id  # user_id == current_user.id
            card_theme = 'own' if is_owner else 'friend'
            
            logger.debug(f"[獲取卡片] 卡片 {card[0]}: 創建者={card[13]}, 當前用戶={current_user.id}, is_owner={is_owner}")
            
            # 查詢該卡片的實際參與者總數（修復：不使用 participants_count 欄位）
            cursor.execute("""
                SELECT COUNT(*) 
                FROM card_participants 
                WHERE card_id = %s AND status = 'active'
            """, (card[0],))
            actual_participants_count = cursor.fetchone()[0]
            
            # 查詢該卡片的參與者頭像資訊（最多10位）
            cursor.execute("""
                SELECT u.User_Avatar, u.User_name, u.User_Email
                FROM card_participants cp
                JOIN user u ON cp.user_id = u.User_Email
                WHERE cp.card_id = %s AND cp.status = 'active'
                ORDER BY cp.joined_at ASC
                LIMIT 10
            """, (card[0],))
            participants_avatars = cursor.fetchall()
            
            # 處理參與者頭像資料，使用 get_avatar_url 統一處理路徑
            avatars_list = [
                {
                    'avatar': get_avatar_url(p[0]),
                    'name': p[1] or '未命名用戶',
                    'email': p[2]
                }
                for p in participants_avatars
            ]
            
            cards_list.append({
                'id': card[0],
                'title': card[1],
                'content': card[2],
                'stamp_icon': card[3],
                'daily_executions': card[4],
                'max_participants': card[5],
                'status': card[6],
                'created_at': card[7].strftime('%Y-%m-%d %H:%M:%S') if card[7] else '',
                'updated_at': card[8].strftime('%Y-%m-%d %H:%M:%S') if card[8] else '',
                # 新增關鍵字段
                'user_id': card[13],  # 原始創建者ID
                'user_role': card[14],  # 'owner' 或 'participant'
                'card_theme': card_theme,  # 'own' 或 'friend' - 用於前端顏色主題
                'is_owner': is_owner,  # 是否為創建者
                # 新增的進度信息
                'progress': {
                    'daily': {
                        'completed': daily_completed,
                        'total': card[4],
                        'percentage': round((daily_completed / card[4]) * 100, 1) if card[4] > 0 else 0
                    },
                    'timeline': {
                        'elapsed_days': elapsed_days,
                        'total_days': total_days,
                        'remaining_days': remaining_days,
                        'percentage': round((elapsed_days / total_days) * 100, 1) if total_days > 0 else 0,
                        'end_date': end_date.strftime('%Y-%m-%d')
                    },
                    'participants': {
                        'current': actual_participants_count,  # 修復：使用實際查詢的參與者數量
                        'max': card[5],
                        'percentage': round((actual_participants_count / card[5]) * 100, 1) if card[5] > 0 else 0,
                        'avatars': avatars_list  # 新增：參與者頭像列表
                    }
                }
            })
        
        # 關閉資料庫連線
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'cards': cards_list
        })
        
    except Exception as e:
        logger.error(f"獲取任務卡片失敗: {e}")
        return jsonify({'success': False, 'cards': [], 'message': '獲取卡片清單失敗'})

@coopcard_bp.route('/api/delete-task-card/<int:card_id>', methods=['DELETE'])
@login_required
def delete_task_card(card_id):
    """刪除任務卡片API"""
    try:
        logger.info(f"[刪除API] 用戶 {current_user.id} 嘗試刪除卡片 {card_id}")
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 檢查卡片是否屬於當前用戶
        cursor.execute("""
            SELECT id, user_id FROM task_cards 
            WHERE id = %s AND user_id = %s
        """, (card_id, current_user.id))
        
        result = cursor.fetchone()
        if not result:
            logger.warning(f"[刪除API] 用戶 {current_user.id} 無權限刪除卡片 {card_id}（不是創建者或卡片不存在）")
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '找不到該卡片或無權限刪除'})
        
        # 軟刪除（標記為archived）
        cursor.execute("""
            UPDATE task_cards 
            SET status = 'archived', updated_at = NOW()
            WHERE id = %s AND user_id = %s
        """, (card_id, current_user.id))
        
        conn.commit()
        
        logger.info(f"[刪除API] ✅ 用戶 {current_user.id} 成功刪除卡片 {card_id}")
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': '任務卡片已刪除'})
        
    except Exception as e:
        logger.error(f"刪除任務卡片失敗: {e}")
        return jsonify({'success': False, 'message': '刪除失敗，請稍後再試'})

@coopcard_bp.route('/api/leave-task-card/<int:card_id>', methods=['POST'])
@login_required
def leave_task_card(card_id):
    """參與者退出任務卡片API"""
    try:
        logger.info(f"[退出API] 用戶 {current_user.id} 嘗試退出卡片 {card_id}")
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 檢查用戶是否為此卡片的參與者（且不是創建者）
        cursor.execute("""
            SELECT cp.id, tc.user_id, tc.title
            FROM card_participants cp
            JOIN task_cards tc ON cp.card_id = tc.id
            WHERE cp.card_id = %s AND cp.user_id = %s AND cp.status = 'active'
        """, (card_id, current_user.id))
        
        result = cursor.fetchone()
        if not result:
            logger.warning(f"[退出API] 用戶 {current_user.id} 不是卡片 {card_id} 的參與者")
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '找不到該卡片或您不是參與者'})
        
        participant_id, creator_id, card_title = result
        
        logger.info(f"[退出API] 卡片 {card_id} 創建者: {creator_id}, 當前用戶: {current_user.id}")
        
        # 檢查用戶不是創建者
        if creator_id == current_user.id:
            logger.warning(f"[退出API] ❌ 用戶 {current_user.id} 是創建者，不能退出")
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '創建者無法退出，請使用刪除功能'})
        
        # 更新參與者狀態為 left（軟刪除，保留歷史記錄）
        cursor.execute("""
            UPDATE card_participants 
            SET status = 'left', updated_at = NOW()
            WHERE card_id = %s AND user_id = %s
        """, (card_id, current_user.id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"[退出API] ✅ 用戶 {current_user.id} 成功退出任務卡片 {card_id}: {card_title}")
        
        return jsonify({'success': True, 'message': f'已成功退出任務「{card_title}」'})
        
    except Exception as e:
        logger.error(f"退出任務卡片失敗: {e}")
        return jsonify({'success': False, 'message': '退出失敗，請稍後再試'})

# ==================== 新增：進度追蹤功能 API ====================

@coopcard_bp.route('/api/update-daily-progress/<int:card_id>', methods=['POST'])
@login_required
def update_daily_progress(card_id):
    """更新每日完成進度API"""
    try:
        action = request.json.get('action', 'increment')  # increment 或 decrement
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 檢查用戶是否有權限操作此卡片（創建者或參與者）
        cursor.execute("""
            SELECT tc.daily_completed_count, tc.daily_executions, tc.last_reset_date
            FROM task_cards tc
            LEFT JOIN card_participants cp ON tc.id = cp.card_id
            WHERE tc.id = %s AND (tc.user_id = %s OR cp.user_id = %s)
            AND tc.status = 'published'
        """, (card_id, current_user.id, current_user.id))
        
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '找不到該卡片或無權限操作'})
        
        current_count, daily_limit, last_reset = result
        
        # 檢查是否需要重置計數（跨日檢查）
        from datetime import date
        today = date.today()
        if last_reset != today:
            # 需要重置
            current_count = 0
            cursor.execute("""
                UPDATE task_cards 
                SET daily_completed_count = 0, last_reset_date = %s
                WHERE id = %s
            """, (today, card_id))
        
        # 根據動作更新計數
        if action == 'increment':
            if current_count >= daily_limit:
                cursor.close()
                conn.close()
                return jsonify({'success': False, 'message': '今日完成次數已達上限'})
            new_count = current_count + 1
        elif action == 'decrement':
            if current_count <= 0:
                cursor.close()
                conn.close()
                return jsonify({'success': False, 'message': '今日完成次數不能小於0'})
            new_count = current_count - 1
        else:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '無效的操作類型'})
        
        # 更新計數
        cursor.execute("""
            UPDATE task_cards 
            SET daily_completed_count = %s, last_reset_date = %s
            WHERE id = %s
        """, (new_count, today, card_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': f'進度已更新為 {new_count}/{daily_limit}',
            'current_count': new_count,
            'daily_limit': daily_limit,
            'progress_percentage': round((new_count / daily_limit) * 100, 1)
        })
        
    except Exception as e:
        logger.error(f"更新每日進度失敗: {e}")
        return jsonify({'success': False, 'message': '更新進度失敗，請稍後再試'})

@coopcard_bp.route('/api/get-task-card-progress/<int:card_id>')
@login_required 
def get_task_card_progress(card_id):
    """獲取任務卡片進度信息API"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 獲取卡片進度信息
        cursor.execute("""
            SELECT tc.daily_completed_count, tc.daily_executions, tc.last_reset_date,
                   tc.end_date, tc.participants_count, tc.max_participants, tc.created_at
            FROM task_cards tc
            LEFT JOIN card_participants cp ON tc.id = cp.card_id
            WHERE tc.id = %s AND (tc.user_id = %s OR cp.user_id = %s)
            AND tc.status = 'published'
        """, (card_id, current_user.id, current_user.id))
        
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '找不到該卡片'})
        
        daily_completed, daily_total, last_reset, end_date, participants_count, max_participants, created_at = result
        
        # 檢查是否需要重置每日計數
        from datetime import date, datetime
        today = date.today()
        if last_reset != today:
            daily_completed = 0
            # 同時更新資料庫
            cursor.execute("""
                UPDATE task_cards 
                SET daily_completed_count = 0, last_reset_date = %s
                WHERE id = %s
            """, (today, card_id))
            conn.commit()
        
        # 計算天數進度
        created_date = created_at.date() if isinstance(created_at, datetime) else created_at
        total_days = (end_date - created_date).days + 1
        elapsed_days = (today - created_date).days + 1
        remaining_days = max(0, (end_date - today).days)
        
        # 獲取參與者頭像信息
        cursor.execute("""
            SELECT u.User_Avatar, u.User_name, u.User_Email
            FROM card_participants cp
            JOIN user u ON cp.user_id = u.User_Email
            WHERE cp.card_id = %s AND cp.status = 'active'
            LIMIT 10
        """, (card_id,))
        participants_avatars = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'progress': {
                'daily': {
                    'completed': daily_completed,
                    'total': daily_total,
                    'percentage': round((daily_completed / daily_total) * 100, 1) if daily_total > 0 else 0,
                    'can_increment': daily_completed < daily_total
                },
                'timeline': {
                    'total_days': total_days,
                    'elapsed_days': min(elapsed_days, total_days),
                    'remaining_days': remaining_days,
                    'percentage': round((min(elapsed_days, total_days) / total_days) * 100, 1) if total_days > 0 else 0,
                    'end_date': end_date.strftime('%Y-%m-%d')
                },
                'participants': {
                    'current': participants_count,
                    'max': max_participants,
                    'percentage': round((participants_count / max_participants) * 100, 1) if max_participants > 0 else 0,
                    'avatars': [
                        {
                            'avatar': get_avatar_url(p[0]),
                            'name': p[1] or '未命名用戶',
                            'email': p[2]
                        }
                        for p in participants_avatars
                    ]
                }
            }
        })
        
    except Exception as e:
        logger.error(f"獲取卡片進度失敗: {e}")
        return jsonify({'success': False, 'message': '獲取進度信息失敗'})

# ===== 好友互動小視窗 API 端點 =====

@coopcard_bp.route('/api/friends_widget')
@login_required
def api_friends_widget():
    """獲取好友列表用於小視窗顯示"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 獲取好友列表（簡化版，只包含必要信息）
        # 修復字符集不匹配問題：使用 COLLATE 統一字符集比較
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN fr.requester_email = %s THEN fr.receiver_email
                    ELSE fr.requester_email
                END as friend_email,
                CASE 
                    WHEN fr.requester_email = %s THEN receiver.User_name
                    ELSE requester.User_name
                END as friend_name,
                CASE 
                    WHEN fr.requester_email = %s THEN receiver.User_Avatar
                    ELSE requester.User_Avatar
                END as friend_avatar,
                CASE 
                    WHEN fr.requester_email = %s THEN receiver.user_level
                    ELSE requester.user_level
                END as friend_level
                    ,
                    CASE 
                        WHEN fr.requester_email = %s THEN receiver.user_id
                        ELSE requester.user_id
                    END as friend_user_id
            FROM friend_requests fr
            LEFT JOIN user requester ON fr.requester_email COLLATE utf8mb4_unicode_ci = requester.User_Email COLLATE utf8mb4_unicode_ci
            LEFT JOIN user receiver ON fr.receiver_email COLLATE utf8mb4_unicode_ci = receiver.User_Email COLLATE utf8mb4_unicode_ci
            WHERE (fr.requester_email = %s OR fr.receiver_email = %s) 
            AND fr.status = 'accepted'
            ORDER BY fr.created_at DESC
            LIMIT 10
    """, (current_user.id, current_user.id, current_user.id, current_user.id, current_user.id, current_user.id, current_user.id))
        
        friends = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # 格式化好友數據
        friends_data = []
        for friend in friends:
            friends_data.append({
                'email': friend[0],
                'name': friend[1],
                'avatar': get_avatar_url(friend[2]),
                'level': friend[3] or 1,
                'user_id': friend[4] or None
            })
        
        return jsonify({
            'success': True,
            'friends': friends_data
        })
        
    except Exception as e:
        logger.error(f"獲取好友小視窗列表失敗: {e}")
        return jsonify({'success': False, 'message': '獲取好友列表失敗'})

@coopcard_bp.route('/api/friends_stats')
@login_required
def api_friends_stats():
    """獲取好友統計信息"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 獲取好友總數 - 添加 COLLATE 修復字符集問題
        cursor.execute("""
            SELECT COUNT(*) FROM friend_requests 
            WHERE (requester_email COLLATE utf8mb4_unicode_ci = %s 
                   OR receiver_email COLLATE utf8mb4_unicode_ci = %s) 
            AND status = 'accepted'
        """, (current_user.id, current_user.id))
        friends_count = cursor.fetchone()[0]
        
        # 獲取待處理請求數 - 添加 COLLATE
        cursor.execute("""
            SELECT COUNT(*) FROM friend_requests 
            WHERE receiver_email COLLATE utf8mb4_unicode_ci = %s AND status = 'pending'
        """, (current_user.id,))
        pending_requests_count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'friends_count': friends_count,
            'pending_requests_count': pending_requests_count
        })
        
    except Exception as e:
        logger.error(f"獲取好友統計失敗: {e}")
        return jsonify({'success': False, 'message': '獲取統計信息失敗'})

@coopcard_bp.route('/remove_friend', methods=['POST'])
@login_required
def remove_friend():
    """刪除好友"""
    try:
        data = request.get_json()
        friend_email = data.get('friend_email')
        
        if not friend_email:
            return jsonify({'success': False, 'message': '缺少好友郵箱參數'})
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 檢查好友關係是否存在 - 添加 COLLATE 修復字符集問題
        cursor.execute("""
            SELECT id FROM friend_requests 
            WHERE ((requester_email COLLATE utf8mb4_unicode_ci = %s 
                    AND receiver_email COLLATE utf8mb4_unicode_ci = %s) 
                   OR (requester_email COLLATE utf8mb4_unicode_ci = %s 
                       AND receiver_email COLLATE utf8mb4_unicode_ci = %s))
            AND status = 'accepted'
        """, (current_user.id, friend_email, friend_email, current_user.id))
        
        friendship = cursor.fetchone()
        if not friendship:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '好友關係不存在'})
        
        # 刪除好友關係 - 添加 COLLATE
        cursor.execute("""
            DELETE FROM friend_requests 
            WHERE ((requester_email COLLATE utf8mb4_unicode_ci = %s 
                    AND receiver_email COLLATE utf8mb4_unicode_ci = %s) 
                   OR (requester_email COLLATE utf8mb4_unicode_ci = %s 
                       AND receiver_email COLLATE utf8mb4_unicode_ci = %s))
            AND status = 'accepted'
        """, (current_user.id, friend_email, friend_email, current_user.id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"用戶 {current_user.id} 刪除好友 {friend_email}")
        
        return jsonify({
            'success': True,
            'message': '好友已刪除'
        })
        
    except Exception as e:
        logger.error(f"刪除好友失敗: {e}")
        return jsonify({'success': False, 'message': '刪除好友失敗'})

# 新增的好友請求API端點 - 專為小視窗功能設計

@coopcard_bp.route('/api/friend_requests')
@login_required
def get_friend_requests():
    """獲取好友請求列表 - API格式"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 獲取收到的待處理好友請求
        cursor.execute("""
            SELECT fr.id, fr.requester_email, u.User_name, u.User_Email, u.User_name, u.User_Avatar, fr.created_at
            FROM friend_requests fr
            JOIN user u ON fr.requester_email COLLATE utf8mb4_unicode_ci = u.User_Email COLLATE utf8mb4_unicode_ci
            WHERE fr.receiver_email = %s AND fr.status = 'pending'
            ORDER BY fr.created_at DESC
        """, (current_user.id,))
        
        requests = []
        for row in cursor.fetchall():
            requests.append({
                'id': row[0],
                'requester_email': row[1],
                'username': row[2],
                'email': row[3],
                'name': row[4] or row[2],  # 如果沒有name，使用username
                'profile_picture': row[5],
                'created_at': row[6].strftime('%Y-%m-%d %H:%M') if row[6] else ''
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': requests,
            'count': len(requests)
        })
        
    except Exception as e:
        logger.error(f"獲取好友請求失敗: {e}")
        return jsonify({'success': False, 'message': '獲取請求失敗'})

@coopcard_bp.route('/api/accept_friend_request', methods=['POST'])
@login_required
def accept_friend_request():
    """接受好友請求 - API格式"""
    try:
        data = request.get_json()
        request_id = data.get('request_id')
        
        if not request_id:
            return jsonify({'success': False, 'message': '缺少請求ID'})
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 確認請求存在且屬於當前用戶
        cursor.execute("""
            SELECT requester_email FROM friend_requests 
            WHERE id = %s AND receiver_email = %s AND status = 'pending'
        """, (request_id, current_user.id))
        
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '請求不存在或已處理'})
        
        requester_email = result[0]
        
        # 更新請求狀態為已接受
        cursor.execute("""
            UPDATE friend_requests 
            SET status = 'accepted', updated_at = %s 
            WHERE id = %s
        """, (datetime.now(), request_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"用戶 {current_user.id} 接受了來自 {requester_email} 的好友請求")
        
        return jsonify({
            'success': True,
            'message': '已接受好友請求'
        })
        
    except Exception as e:
        logger.error(f"接受好友請求失敗: {e}")
        return jsonify({'success': False, 'message': '接受請求失敗'})

@coopcard_bp.route('/api/reject_friend_request', methods=['POST'])
@login_required
def reject_friend_request():
    """拒絕好友請求 - API格式"""
    try:
        data = request.get_json()
        request_id = data.get('request_id')
        
        if not request_id:
            return jsonify({'success': False, 'message': '缺少請求ID'})
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 確認請求存在且屬於當前用戶
        cursor.execute("""
            SELECT requester_email FROM friend_requests 
            WHERE id = %s AND receiver_email = %s AND status = 'pending'
        """, (request_id, current_user.id))
        
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '請求不存在或已處理'})
        
        requester_email = result[0]
        
        # 更新請求狀態為已拒絕
        cursor.execute("""
            UPDATE friend_requests 
            SET status = 'rejected', updated_at = %s 
            WHERE id = %s
        """, (datetime.now(), request_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"用戶 {current_user.id} 拒絕了來自 {requester_email} 的好友請求")
        
        return jsonify({
            'success': True,
            'message': '已拒絕好友請求'
        })
        
    except Exception as e:
        logger.error(f"拒絕好友請求失敗: {e}")
        return jsonify({'success': False, 'message': '拒絕請求失敗'})

# ============================================================================
# 任務卡片邀請功能 API 端點
# ============================================================================

@coopcard_bp.route('/api/send-card-invitation', methods=['POST'])
@login_required
def send_card_invitation():
    """發送任務卡片邀請給好友"""
    try:
        data = request.get_json()
        card_id = data.get('card_id')
        receiver_emails = data.get('receiver_emails', [])
        invitation_message = data.get('message', '')
        
        # 參數驗證
        if not card_id:
            return jsonify({'success': False, 'message': '缺少任務卡片ID'})
        if not receiver_emails or not isinstance(receiver_emails, list):
            return jsonify({'success': False, 'message': '請選擇至少一位好友'})
        if len(receiver_emails) > 10:
            return jsonify({'success': False, 'message': '一次最多只能邀請10位好友'})
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 驗證卡片存在且屬於當前用戶
        cursor.execute("""
            SELECT id, user_id, title, content, stamp_icon, daily_executions, 
                   duration_days, max_participants, created_at
            FROM task_cards 
            WHERE id = %s AND user_id = %s
        """, (card_id, current_user.id))
        
        card_data = cursor.fetchone()
        if not card_data:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '任務卡片不存在或無權限邀請'})
        
        # 創建卡片快照
        card_snapshot = {
            'id': card_data[0],
            'user_id': card_data[1],
            'title': card_data[2],
            'content': card_data[3],
            'stamp_icon': card_data[4],
            'daily_executions': card_data[5],
            'duration_days': card_data[6],
            'max_participants': card_data[7],
            'created_at': card_data[8].isoformat() if card_data[8] else None
        }
        
        # 第一層去重：檢查現有待處理邀請
        format_strings = ','.join(['%s'] * len(receiver_emails))
        cursor.execute(f"""
            SELECT receiver_email FROM card_invitations 
            WHERE card_id = %s AND receiver_email IN ({format_strings}) AND status = 'pending'
        """, [card_id] + receiver_emails)
        
        existing_invitations = [row[0] for row in cursor.fetchall()]
        new_receiver_emails = [email for email in receiver_emails if email not in existing_invitations]
        
        if not new_receiver_emails:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False, 
                'message': '所選好友都已收到此任務的邀請',
                'existing_invitations': existing_invitations
            })
        
        # 驗證接收者都是好友
        cursor.execute(f"""
            SELECT DISTINCT 
                CASE 
                    WHEN fr.requester_email = %s THEN fr.receiver_email 
                    ELSE fr.requester_email 
                END as friend_email
            FROM friend_requests fr
            WHERE ((fr.requester_email = %s AND fr.receiver_email IN ({format_strings}))
                   OR (fr.receiver_email = %s AND fr.requester_email IN ({format_strings})))
            AND fr.status = 'accepted'
        """, [current_user.id, current_user.id] + new_receiver_emails + [current_user.id] + new_receiver_emails)
        
        friends = [row[0] for row in cursor.fetchall()]
        non_friends = [email for email in new_receiver_emails if email not in friends]
        
        if non_friends:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False, 
                'message': f'部分用戶不是您的好友：{", ".join(non_friends)}'
            })
        
        # 批量插入邀請記錄
        invitation_records = []
        import json
        for receiver_email in new_receiver_emails:
            invitation_records.append((
                card_id,
                current_user.id,
                receiver_email,
                'pending',
                invitation_message,
                json.dumps(card_snapshot, ensure_ascii=False)
            ))
        
        cursor.executemany("""
            INSERT INTO card_invitations 
            (card_id, sender_email, receiver_email, status, invitation_message, card_snapshot)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, invitation_records)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # 發送WebSocket通知給收到邀請的好友們
        try:
            from services.socketio_manager import send_invitation_notification
            for receiver_email in new_receiver_emails:
                invitation_data = {
                    'id': None,  # 由於是批量插入，暫不獲取具體ID
                    'card_id': card_id,
                    'sender_email': current_user.id,
                    'sender_name': getattr(current_user, 'username', current_user.id),
                    'card_title': card_snapshot.get('title', ''),
                    'invitation_message': invitation_message,
                    'card_snapshot': card_snapshot
                }
                send_invitation_notification(receiver_email, invitation_data)
        except Exception as ws_error:
            logger.warning(f"WebSocket通知發送失敗: {ws_error}")
        
        logger.info(f"用戶 {current_user.id} 向 {len(new_receiver_emails)} 位好友發送了任務卡片邀請")
        
        return jsonify({
            'success': True,
            'message': f'已成功發送 {len(new_receiver_emails)} 份邀請',
            'sent_count': len(new_receiver_emails),
            'skipped_count': len(existing_invitations)
        })
        
    except Exception as e:
        logger.error(f"發送卡片邀請失敗: {e}")
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({'success': False, 'message': '發送邀請失敗，請稍後再試'})

@coopcard_bp.route('/api/card-invitations')
@login_required
def get_card_invitations():
    """獲取當前用戶收到的卡片邀請"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 獲取收到的待處理邀請
        cursor.execute("""
            SELECT ci.id, ci.card_id, ci.sender_email, ci.invitation_message, 
                   ci.card_snapshot, ci.created_at,
                   u.User_name, u.User_Avatar, u.user_id
            FROM card_invitations ci
            JOIN user u ON ci.sender_email = u.User_Email
            WHERE ci.receiver_email = %s AND ci.status = 'pending'
            ORDER BY ci.created_at DESC
        """, (current_user.id,))
        
        invitations = []
        import json
        for row in cursor.fetchall():
            try:
                card_snapshot = json.loads(row[4]) if row[4] else {}
            except:
                card_snapshot = {}
                
            invitations.append({
                'id': row[0],
                'card_id': row[1],
                'sender_info': {
                    'email': row[2],
                    'name': row[6],
                    'avatar': get_avatar_url(row[7]),
                    'user_id': row[8]
                },
                'message': row[3],
                'card_data': card_snapshot,
                'created_at': row[5].strftime('%Y-%m-%d %H:%M:%S') if row[5] else ''
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'invitations': invitations,
            'count': len(invitations)
        })
        
    except Exception as e:
        logger.error(f"獲取卡片邀請失敗: {e}")
        return jsonify({'success': False, 'message': '獲取邀請列表失敗'})

@coopcard_bp.route('/api/respond-card-invitation', methods=['POST'])
@login_required
def respond_card_invitation():
    """回應卡片邀請（接受或拒絕）"""
    try:
        data = request.get_json()
        invitation_id = data.get('invitation_id')
        action = data.get('action')  # 'accept' or 'reject'
        
        # 參數驗證
        if not invitation_id:
            return jsonify({'success': False, 'message': '缺少邀請ID'})
        if action not in ['accept', 'reject']:
            return jsonify({'success': False, 'message': '無效的操作類型'})
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 驗證邀請存在且屬於當前用戶
        cursor.execute("""
            SELECT ci.card_id, ci.sender_email, ci.card_snapshot, ci.status
            FROM card_invitations ci
            WHERE ci.id = %s AND ci.receiver_email = %s
        """, (invitation_id, current_user.id))
        
        invitation = cursor.fetchone()
        if not invitation:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '邀請不存在'})
        
        if invitation[3] != 'pending':
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '邀請已經處理過'})
        
        card_id = invitation[0]
        sender_email = invitation[1]
        
        # 更新邀請狀態
        new_status = 'accepted' if action == 'accept' else 'rejected'
        cursor.execute("""
            UPDATE card_invitations 
            SET status = %s, responded_at = NOW()
            WHERE id = %s
        """, (new_status, invitation_id))
        
        # 如果接受邀請，將用戶加入任務卡片
        if action == 'accept':
            # 檢查是否已經參與此任務
            cursor.execute("""
                SELECT id FROM card_participants 
                WHERE card_id = %s AND user_id = %s
            """, (card_id, current_user.id))
            
            if not cursor.fetchone():
                # 添加為參與者
                cursor.execute("""
                    INSERT INTO card_participants (card_id, user_id, status, role)
                    VALUES (%s, %s, 'active', 'participant')
                """, (card_id, current_user.id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # 發送WebSocket回應通知給邀請者
        try:
            from services.socketio_manager import send_invitation_response_notification
            response_data = {
                'invitation_id': invitation_id,
                'card_id': card_id,
                'responder_email': current_user.id,
                'responder_name': getattr(current_user, 'username', current_user.id),
                'action': action,
                'status': new_status
            }
            send_invitation_response_notification(sender_email, response_data)
        except Exception as ws_error:
            logger.warning(f"WebSocket回應通知發送失敗: {ws_error}")
        
        action_text = '接受' if action == 'accept' else '拒絕'
        logger.info(f"用戶 {current_user.id} {action_text}了來自 {sender_email} 的任務邀請")
        
        return jsonify({
            'success': True,
            'message': f'已{action_text}邀請' + ('，您已加入該任務' if action == 'accept' else '')
        })
        
    except Exception as e:
        logger.error(f"回應卡片邀請失敗: {e}")
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({'success': False, 'message': '處理邀請失敗，請稍後再試'})

# ============================================================================
# 任務卡片結算與復活功能 API 端點
# ============================================================================

@coopcard_bp.route('/api/store-task-card/<int:card_id>', methods=['POST'])
@login_required
def store_task_card(card_id):
    """存放（結算）任務卡片"""
    try:
        logger.info(f"[結算API] 用戶 {current_user.id} 嘗試結算卡片 {card_id}")
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 檢查用戶是否有權限操作此卡片（創建者或參與者）
        cursor.execute("""
            SELECT tc.id, tc.user_id, tc.title
            FROM task_cards tc
            LEFT JOIN card_participants cp ON tc.id = cp.card_id
            WHERE tc.id = %s 
              AND (tc.user_id = %s OR (cp.user_id = %s AND cp.status = 'active'))
              AND tc.status = 'published'
        """, (card_id, current_user.id, current_user.id))
        
        result = cursor.fetchone()
        if not result:
            logger.warning(f"[結算API] 用戶 {current_user.id} 無權限結算卡片 {card_id} 或卡片不存在")
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '找不到該卡片或無權限操作'})
        
        card_title = result[2]
        
        # 更新卡片狀態為 archived
        cursor.execute("""
            UPDATE task_cards 
            SET status = 'archived', updated_at = NOW()
            WHERE id = %s
        """, (card_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"[結算API] ✅ 用戶 {current_user.id} 成功結算卡片 {card_id}: {card_title}")
        
        return jsonify({
            'success': True,
            'message': f'任務「{card_title}」已成功結算！'
        })
        
    except Exception as e:
        logger.error(f"[結算API] 結算任務卡片失敗: {e}")
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({'success': False, 'message': '結算失敗，請稍後再試'})

@coopcard_bp.route('/api/revive-task-card/<int:card_id>', methods=['POST'])
@login_required
def revive_task_card(card_id):
    """復活已結算的任務卡片"""
    try:
        logger.info(f"[復活API] 用戶 {current_user.id} 嘗試復活卡片 {card_id}")
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 檢查用戶是否有權限操作此卡片（創建者或參與者）
        cursor.execute("""
            SELECT tc.id, tc.user_id, tc.title
            FROM task_cards tc
            LEFT JOIN card_participants cp ON tc.id = cp.card_id
            WHERE tc.id = %s 
              AND (tc.user_id = %s OR (cp.user_id = %s AND cp.status = 'active'))
              AND tc.status = 'archived'
        """, (card_id, current_user.id, current_user.id))
        
        result = cursor.fetchone()
        if not result:
            logger.warning(f"[復活API] 用戶 {current_user.id} 無權限復活卡片 {card_id} 或卡片不存在")
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': '找不到該已結算卡片或無權限操作'})
        
        card_title = result[2]
        
        # 更新卡片狀態為 published
        cursor.execute("""
            UPDATE task_cards 
            SET status = 'published', updated_at = NOW()
            WHERE id = %s
        """, (card_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"[復活API] ✅ 用戶 {current_user.id} 成功復活卡片 {card_id}: {card_title}")
        
        return jsonify({
            'success': True,
            'message': f'任務「{card_title}」已成功復活！'
        })
        
    except Exception as e:
        logger.error(f"[復活API] 復活任務卡片失敗: {e}")
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({'success': False, 'message': '復活失敗，請稍後再試'})

@coopcard_bp.route('/api/get-stored-cards')
@login_required
def get_stored_cards():
    """獲取已結算的任務卡片列表"""
    try:
        logger.info(f"[獲取結算卡片API] 用戶 {current_user.id} 請求已結算卡片列表")
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 獲取用戶參與的所有已結算卡片（自己創建的 + 參與的）
        cursor.execute("""
            SELECT DISTINCT tc.id, tc.title, tc.content, tc.stamp_icon, 
                   tc.daily_executions, tc.max_participants, tc.status, 
                   tc.created_at, tc.updated_at, tc.user_id
            FROM task_cards tc
            LEFT JOIN card_participants cp ON tc.id = cp.card_id
            WHERE (tc.user_id = %s OR (cp.user_id = %s AND cp.status = 'active'))
              AND tc.status = 'archived'
            ORDER BY tc.updated_at DESC
        """, (current_user.id, current_user.id))
        
        cards_data = cursor.fetchall()
        cursor.close()
        conn.close()
        
        cards_list = []
        for card in cards_data:
            cards_list.append({
                'id': card[0],
                'title': card[1],
                'content': card[2],
                'stamp_icon': card[3],
                'daily_executions': card[4],
                'max_participants': card[5],
                'status': card[6],
                'created_at': card[7].strftime('%Y-%m-%d %H:%M:%S') if card[7] else '',
                'updated_at': card[8].strftime('%Y-%m-%d %H:%M:%S') if card[8] else '',
                'user_id': card[9]
            })
        
        logger.info(f"[獲取結算卡片API] 返回 {len(cards_list)} 個已結算卡片")
        
        return jsonify({
            'success': True,
            'cards': cards_list
        })
        
    except Exception as e:
        logger.error(f"[獲取結算卡片API] 獲取失敗: {e}")
        return jsonify({'success': False, 'cards': [], 'message': '獲取已結算卡片失敗'})
