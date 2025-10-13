# -*- coding: utf-8 -*-
"""
User ID 管理 API 模組

提供用戶友善ID的完整管理功能：
- 檢查用戶是否已設定user_id
- 驗證user_id的唯一性和格式
- 創建user_id並綁定到User_Email

設計原則：
- User_Email 作為主鍵與 task_cards 表建立關聯
- user_id 與 User_Email 進行一對一綁定
- 確保所有 user_id 的唯一性
- 提供清晰的錯誤訊息和用戶反饋
"""

from flask import request, jsonify
from flask_login import login_required, current_user
from utils import db
import logging
import re
from . import coopcard_bp

# 設置日誌
logger = logging.getLogger(__name__)

# user_id 格式規則
USER_ID_MIN_LENGTH = 3
USER_ID_MAX_LENGTH = 30
USER_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]+$')

def validate_user_id_format(user_id):
    """
    驗證 user_id 格式
    
    Args:
        user_id (str): 要驗證的 user_id
        
    Returns:
        dict: {valid: bool, message: str}
    """
    if not user_id:
        return {
            'valid': False,
            'message': 'User ID 不能為空'
        }
    
    if len(user_id) < USER_ID_MIN_LENGTH:
        return {
            'valid': False,
            'message': f'User ID 長度至少需要 {USER_ID_MIN_LENGTH} 個字元'
        }
    
    if len(user_id) > USER_ID_MAX_LENGTH:
        return {
            'valid': False,
            'message': f'User ID 長度不能超過 {USER_ID_MAX_LENGTH} 個字元'
        }
    
    if not USER_ID_PATTERN.match(user_id):
        return {
            'valid': False,
            'message': 'User ID 只能包含英文字母、數字、底線(_)和連字號(-)'
        }
    
    return {
        'valid': True,
        'message': 'User ID 格式正確'
    }

@coopcard_bp.route('/api/check-user-id', methods=['GET'])
@login_required
def check_user_id():
    """
    檢查當前用戶是否已設定 user_id
    
    Returns:
        JSON: {
            success: bool,
            has_user_id: bool,
            user_id: str|null,
            message: str
        }
    """
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 查詢當前用戶的 user_id
        cursor.execute("""
            SELECT user_id FROM user 
            WHERE User_Email = %s
        """, (current_user.id,))
        
        result = cursor.fetchone()
        
        if not result:
            logger.error(f"用戶 {current_user.id} 在資料庫中不存在")
            return jsonify({
                'success': False,
                'message': '用戶資料不存在，請重新登入'
            }), 404
        
        user_id_value = result[0]
        has_user_id = user_id_value is not None and user_id_value.strip() != ''
        
        logger.info(f"用戶 {current_user.id} user_id 檢查結果: {has_user_id}")
        
        return jsonify({
            'success': True,
            'has_user_id': has_user_id,
            'user_id': user_id_value if has_user_id else None,
            'message': 'User ID 狀態檢查完成'
        })
        
    except Exception as e:
        logger.error(f"檢查 user_id 時發生錯誤: {str(e)}")
        return jsonify({
            'success': False,
            'message': '系統錯誤，請稍後再試'
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

@coopcard_bp.route('/api/validate-user-id', methods=['POST'])
@login_required
def validate_user_id():
    """
    驗證 user_id 是否可用（格式檢查 + 唯一性檢查）
    
    Request Body:
        {user_id: str}
        
    Returns:
        JSON: {
            success: bool,
            message: str,
            available: bool
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': '請求資料格式錯誤'
            }), 400
        
        user_id = data.get('user_id', '').strip()
        
        # 格式驗證
        format_result = validate_user_id_format(user_id)
        if not format_result['valid']:
            return jsonify({
                'success': True,
                'available': False,
                'message': format_result['message']
            })
        
        # 唯一性檢查
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT User_Email FROM user 
            WHERE user_id = %s
        """, (user_id,))
        
        existing_user = cursor.fetchone()
        
        if existing_user:
            # 檢查是否是當前用戶自己的 user_id
            if existing_user[0] == current_user.id:
                return jsonify({
                    'success': True,
                    'available': True,
                    'message': '這是您目前的 User ID'
                })
            else:
                return jsonify({
                    'success': True,
                    'available': False,
                    'message': '此 User ID 已被其他用戶使用，請選擇其他 ID'
                })
        
        # user_id 可用
        logger.info(f"用戶 {current_user.id} 驗證 user_id '{user_id}' 結果: 可用")
        
        return jsonify({
            'success': True,
            'available': True,
            'message': '✓ 此 User ID 可以使用'
        })
        
    except Exception as e:
        logger.error(f"驗證 user_id 時發生錯誤: {str(e)}")
        return jsonify({
            'success': False,
            'message': '驗證失敗，請稍後再試'
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

@coopcard_bp.route('/api/create-user-id', methods=['POST'])
@login_required
def create_user_id():
    """
    創建 user_id 並綁定到當前用戶的 User_Email
    
    Request Body:
        {user_id: str}
        
    Returns:
        JSON: {
            success: bool,
            message: str,
            user_id: str (if success)
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': '請求資料格式錯誤'
            }), 400
        
        user_id = data.get('user_id', '').strip()
        
        # 再次進行格式驗證（防止前端繞過）
        format_result = validate_user_id_format(user_id)
        if not format_result['valid']:
            return jsonify({
                'success': False,
                'message': format_result['message']
            }), 400
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # 在事務中進行操作，確保資料一致性
        conn.begin()
        
        try:
            # 再次檢查唯一性（防止併發問題）
            cursor.execute("""
                SELECT User_Email FROM user 
                WHERE user_id = %s
            """, (user_id,))
            
            existing_user = cursor.fetchone()
            
            if existing_user and existing_user[0] != current_user.id:
                return jsonify({
                    'success': False,
                    'message': '此 User ID 已被其他用戶使用，請選擇其他 ID'
                }), 409
            
            # 檢查當前用戶是否已經設定過 user_id
            cursor.execute("""
                SELECT user_id FROM user 
                WHERE User_Email = %s
            """, (current_user.id,))
            
            current_user_data = cursor.fetchone()
            
            if not current_user_data:
                conn.rollback()
                return jsonify({
                    'success': False,
                    'message': '用戶資料不存在，請重新登入'
                }), 404
            
            current_user_id = current_user_data[0]
            
            # 如果用戶已經有 user_id，檢查是否與要設定的相同
            if current_user_id and current_user_id.strip():
                if current_user_id == user_id:
                    conn.rollback()
                    return jsonify({
                        'success': True,
                        'message': f'您的 User ID 已經是 "{user_id}"',
                        'user_id': user_id
                    })
                else:
                    conn.rollback()
                    return jsonify({
                        'success': False,
                        'message': f'您已經設定過 User ID: "{current_user_id}"。如需修改請聯繫管理員'
                    }), 409
            
            # 更新 user_id
            cursor.execute("""
                UPDATE user 
                SET user_id = %s 
                WHERE User_Email = %s
            """, (user_id, current_user.id))
            
            if cursor.rowcount == 0:
                conn.rollback()
                return jsonify({
                    'success': False,
                    'message': '更新失敗，請稍後再試'
                }), 500
            
            # 提交事務
            conn.commit()
            
            logger.info(f"用戶 {current_user.id} 成功創建 user_id: {user_id}")
            
            return jsonify({
                'success': True,
                'message': f'🎉 User ID "{user_id}" 創建成功！',
                'user_id': user_id
            })
            
        except Exception as e:
            conn.rollback()
            raise e
            
    except Exception as e:
        logger.error(f"創建 user_id 時發生錯誤: {str(e)}")
        return jsonify({
            'success': False,
            'message': '創建失敗，請稍後再試'
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

# 擴展好友搜尋功能，支援 user_id 搜尋
@coopcard_bp.route('/api/search_users_extended', methods=['GET'])
@login_required  
def search_users_extended():
    """
    擴展的用戶搜尋功能，支援 user_id、User_Email 和 User_name
    
    Query Parameters:
        q: 搜尋關鍵字
        
    Returns:
        JSON: {
            success: bool,
            users: list,
            message: str
        }
    """
    try:
        search_query = request.args.get('q', '').strip()
        
        if not search_query:
            return jsonify({
                'success': False,
                'message': '請輸入搜尋關鍵字'
            })
        
        if len(search_query) < 2:
            return jsonify({
                'success': False,
                'message': '搜尋關鍵字至少需要2個字元'
            })
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        search_pattern = f'%{search_query}%'
        
        # 擴展搜尋以支援 user_id - 添加 COLLATE 修復字符集問題
        cursor.execute("""
            SELECT User_Email, User_name, User_Avatar, bio, user_level, user_id
            FROM user 
            WHERE (
                User_Email COLLATE utf8mb4_unicode_ci LIKE %s 
                OR User_name COLLATE utf8mb4_unicode_ci LIKE %s 
                OR (user_id IS NOT NULL AND user_id COLLATE utf8mb4_unicode_ci LIKE %s)
            )
            AND User_Email COLLATE utf8mb4_unicode_ci != %s
            ORDER BY 
                CASE 
                    WHEN user_id COLLATE utf8mb4_unicode_ci = %s THEN 0
                    WHEN user_id COLLATE utf8mb4_unicode_ci LIKE %s THEN 1
                    WHEN User_name COLLATE utf8mb4_unicode_ci LIKE %s THEN 2
                    WHEN User_Email COLLATE utf8mb4_unicode_ci LIKE %s THEN 3
                    ELSE 4
                END,
                User_name
            LIMIT 10
        """, (
            search_pattern, search_pattern, search_pattern,  # WHERE 條件
            current_user.id,  # 排除自己
            search_query,  # 精確匹配 user_id
            search_pattern, search_pattern, search_pattern  # ORDER BY 條件
        ))
        
        users = []
        for row in cursor.fetchall():
            user_email, user_name, user_avatar, bio, user_level, user_id = row
            
            # 判斷匹配類型以提供更好的搜尋體驗
            match_type = 'email'
            if user_id and search_query.lower() in user_id.lower():
                match_type = 'user_id'
            elif search_query.lower() in user_name.lower():
                match_type = 'name'
            
            users.append({
                'email': user_email,
                'name': user_name,
                'avatar': user_avatar,
                'bio': bio,
                'user_level': user_level,
                'user_id': user_id,
                'match_type': match_type
            })
        
        logger.info(f"用戶 {current_user.id} 搜尋 '{search_query}' 找到 {len(users)} 個結果")
        
        return jsonify({
            'success': True,
            'users': users,
            'message': f'找到 {len(users)} 個用戶'
        })
        
    except Exception as e:
        logger.error(f"搜尋用戶時發生錯誤: {str(e)}")
        return jsonify({
            'success': False,
            'message': '搜尋失敗，請稍後再試'
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()