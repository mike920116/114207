# -*- coding: utf-8 -*-
"""
社交功能主模組

提供用戶社交互動功能：
- 查看所有用戶的公開貼文
- 貼文點讚和評論系統
- 匿名/實名發文選擇
- 心情狀態顯示

主要功能：
- 顯示社交動態主頁
- 聚合貼文、按讚數、評論數據
- 支援匿名發文隱私保護
- 按時間倒序排列貼文

主要路由：
- /social/main: 社交動態主頁
- /social/create_post: 新增貼文頁面
"""

from flask import render_template, request, jsonify, redirect, url_for
from flask_login import login_required, current_user
from utils import db
from utils.level_system import UserLevelSystem, update_user_level_and_stats, get_user_level_info
from datetime import datetime
from . import social_bp  # 從 __init__.py 導入 Blueprint

@social_bp.route('/create_post', methods=['GET', 'POST'])
@login_required
def create_post():
    """
    新增貼文功能
    
    GET: 顯示新增貼文表單
    POST: 處理貼文提交
    
    Form Data (POST):
        content (str): 貼文內容
        mood (str): 心情標籤 (happy, sad, angry, surprised, relaxed, neutral)
        anonymous (str): 是否匿名發文 ("1" 表示匿名)
        image (file): 上傳的圖片 (可選)
        
    Returns:
        GET: 新增貼文表單頁面
        POST: JSON 回應或重導向
    """
    if request.method == 'GET':
        # 顯示新增貼文表單
        return render_template('social/create_post.html')
    
    elif request.method == 'POST':
        try:
            # 處理表單資料
            title = request.form.get('title', '').strip()
            content = request.form.get('content', '').strip()
            mood = request.form.get('mood', 'neutral')
            is_anonymous = request.form.get('anonymous') == '1'
            
            # 驗證必要欄位
            if not content:
                return jsonify({
                    'success': False,
                    'message': '請輸入貼文內容'
                }), 400
            
            if len(content) > 1000:
                return jsonify({
                    'success': False,
                    'message': '貼文內容不能超過1000字'
                }), 400
            
            if title and len(title) > 100:
                return jsonify({
                    'success': False,
                    'message': '貼文標題不能超過100字'
                }), 400
            
            # 處理圖片上傳 (暫時不實作，留待後續)
            image_url = None
            
            # 儲存到資料庫
            database_connection = db.get_connection()
            database_cursor = database_connection.cursor()
            
            current_time = datetime.now()
            
            database_cursor.execute("""
                INSERT INTO Posts (
                    User_Email, title, Content, Mood, Is_Anonymous, 
                    Image_URL, Is_public, Created_at, Updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                current_user.id,  # User_Email
                title,           # title
                content,          # Content
                mood,            # Mood
                is_anonymous,    # Is_Anonymous
                image_url,       # Image_URL
                True,            # Is_public (預設為公開)
                current_time,    # Created_at
                current_time     # Updated_at
            ))
            
            database_connection.commit()
            database_connection.close()
            
            # 發文成功後更新用戶等級
            level_update = update_user_level_and_stats(current_user.id)
            
            # 回傳成功訊息
            response_data = {
                'success': True,
                'message': '貼文發布成功！'
            }
            
            # 如果等級提升，添加升級信息
            if level_update and level_update.get('level_changed'):
                new_level_info = UserLevelSystem.get_level_info(level_update['new_level'])
                response_data['level_up'] = {
                    'new_level': level_update['new_level'],
                    'new_title': new_level_info['title'],
                    'new_emoji': new_level_info['emoji'],
                    'message': f'🎉 恭喜！您已升級為 {new_level_info["emoji"]} {new_level_info["title"]}！'
                }
            
            return jsonify(response_data)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'發布失敗：{str(e)}'
            }), 500

@social_bp.route('/main')
@login_required
def main():
    """
    社交動態主頁
    
    顯示所有用戶的公開貼文，包括：
    - 貼文內容和發布時間
    - 作者資訊（匿名/實名）
    - 點讚數和評論列表
    - 按時間倒序排列
    
    Returns:
        str: 渲染後的社交主頁 HTML 頁面
    """
    database_connection = db.get_connection()
    database_cursor = database_connection.cursor()

    # 取得所有貼文的基本資訊（包含新增的欄位）
    database_cursor.execute("""
        SELECT 
            p.Post_id,
            p.User_Email,
            u.User_name,
            p.title,
            p.Content,
            p.Mood,
            p.Is_Anonymous,
            p.Image_URL,
            p.Is_public,
            p.Created_at,
            COUNT(l.Like_id) AS likes_count
        FROM Posts p
        LEFT JOIN User u ON p.User_Email = u.User_Email
        LEFT JOIN Likes l ON p.Post_id = l.Post_id
        WHERE p.Is_public = TRUE
        GROUP BY p.Post_id, p.User_Email, u.User_name, p.title, p.Content, p.Mood, p.Is_Anonymous, p.Image_URL, p.Is_public, p.Created_at
        ORDER BY p.Created_at DESC
        """)
    
    raw_posts_data = database_cursor.fetchall()

    # 為每個貼文處理評論資料
    formatted_post_data = []
    for post_item in raw_posts_data:
        post_id = post_item[0]
        
        # 獲取該貼文的評論
        database_cursor.execute("""
            SELECT 
                c.Comment_id,
                c.User_Email,
                u.User_name,
                c.Content,
                c.Is_public,
                c.Created_at
            FROM Comments c
            LEFT JOIN User u ON c.User_Email = u.User_Email
            WHERE c.Post_id = %s
            ORDER BY c.Created_at ASC
        """, (post_id,))
        
        comments_data = database_cursor.fetchall()
        
        # 組裝完整的貼文資料
        complete_post_data = {
            'post_id': post_item[0],
            'user_email': post_item[1],
            'username': post_item[2] if not post_item[6] else '匿名用戶',  # 如果匿名則顯示匿名用戶
            'title': post_item[3],
            'content': post_item[4],
            'mood': post_item[5],
            'is_anonymous': post_item[6],
            'image_url': post_item[7],
            'is_public': post_item[8],
            'created_at': post_item[9],
            'likes_count': post_item[10],
            'comments': [
                {
                    'comment_id': comment_item[0],
                    'user_email': comment_item[1],
                    'username': comment_item[2],
                    'content': comment_item[3],
                    'is_public': comment_item[4],
                    'created_at': comment_item[5]
                }
                for comment_item in comments_data
            ]
        }
        
        formatted_post_data.append(complete_post_data)
    
    database_connection.close()

    return render_template('social/social_main.html', posts=formatted_post_data)

@social_bp.route('/delete_post/<int:post_id>', methods=['POST'])
@login_required
def delete_post(post_id):
    """
    刪除貼文功能
    
    Args:
        post_id (int): 要刪除的貼文ID
        
    Returns:
        JSON: 刪除結果
    """
    try:
        print(f"[DEBUG] 嘗試刪除貼文 ID: {post_id}, 用戶: {current_user.id}")
        
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        
        # 先檢查貼文是否存在且屬於當前用戶
        database_cursor.execute("""
            SELECT User_Email FROM Posts 
            WHERE Post_id = %s AND User_Email = %s
        """, (post_id, current_user.id))
        
        post_owner = database_cursor.fetchone()
        print(f"[DEBUG] 貼文所有者查詢結果: {post_owner}")
        
        if not post_owner:
            print(f"[DEBUG] 貼文不存在或無權限，Post_id: {post_id}, User: {current_user.id}")
            return jsonify({
                'success': False,
                'message': '貼文不存在或您沒有權限刪除此貼文'
            }), 403
        
        # 刪除相關的評論和按讚記錄（由於外鍵約束會自動刪除）
        # 刪除貼文
        database_cursor.execute("DELETE FROM Posts WHERE Post_id = %s", (post_id,))
        affected_rows = database_cursor.rowcount
        print(f"[DEBUG] 刪除影響的行數: {affected_rows}")
        
        database_connection.commit()
        database_connection.close()
        
        print(f"[DEBUG] 貼文 {post_id} 刪除成功")
        return jsonify({
            'success': True,
            'message': '貼文已成功刪除'
        })
        
    except Exception as e:
        print(f"[ERROR] 刪除貼文時發生錯誤: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'刪除失敗：{str(e)}'
        }), 500

@social_bp.route('/edit_post/<int:post_id>', methods=['GET', 'POST'])
@login_required
def edit_post(post_id):
    """
    編輯貼文功能
    
    GET: 顯示編輯表單
    POST: 處理編輯提交
    
    Args:
        post_id (int): 要編輯的貼文ID
        
    Returns:
        GET: 編輯表單頁面
        POST: JSON 回應
    """
    database_connection = db.get_connection()
    database_cursor = database_connection.cursor()
    
    # 檢查貼文是否存在且屬於當前用戶
    database_cursor.execute("""
        SELECT Post_id, User_Email, title, Content, Mood, Is_Anonymous 
        FROM Posts 
        WHERE Post_id = %s AND User_Email = %s
    """, (post_id, current_user.id))
    
    post_data = database_cursor.fetchone()
    
    if not post_data:
        database_connection.close()
        return jsonify({
            'success': False,
            'message': '貼文不存在或您沒有權限編輯此貼文'
        }), 403
    
    if request.method == 'GET':
        # 返回貼文資料供前端表單使用
        database_connection.close()
        return jsonify({
            'success': True,
            'post': {
                'post_id': post_data[0],
                'title': post_data[2] or '',
                'content': post_data[3],
                'mood': post_data[4],
                'is_anonymous': bool(post_data[5])
            }
        })
    
    elif request.method == 'POST':
        try:
            # 處理編輯提交
            title = request.form.get('title', '').strip()
            content = request.form.get('content', '').strip()
            mood = request.form.get('mood', 'neutral')
            is_anonymous = request.form.get('anonymous') == '1'
            
            # 驗證必要欄位
            if not content:
                return jsonify({
                    'success': False,
                    'message': '請輸入貼文內容'
                }), 400
            
            if len(content) > 1000:
                return jsonify({
                    'success': False,
                    'message': '貼文內容不能超過1000字'
                }), 400
            
            if title and len(title) > 100:
                return jsonify({
                    'success': False,
                    'message': '貼文標題不能超過100字'
                }), 400
            
            # 更新貼文
            current_time = datetime.now()
            database_cursor.execute("""
                UPDATE Posts 
                SET title = %s, Content = %s, Mood = %s, Is_Anonymous = %s, Updated_at = %s
                WHERE Post_id = %s AND User_Email = %s
            """, (title, content, mood, is_anonymous, current_time, post_id, current_user.id))
            
            database_connection.commit()
            database_connection.close()
            
            return jsonify({
                'success': True,
                'message': '貼文已成功更新'
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'更新失敗：{str(e)}'
            }), 500

@social_bp.route('/my_contributions')
@login_required
def my_contributions():
    """
    獲取當前用戶的貢獻統計
    
    Returns:
        JSON: 用戶貢獻統計資料
    """
    try:
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        
        # 獲取用戶的貼文總數
        database_cursor.execute("""
            SELECT COUNT(*) as total_posts
            FROM Posts 
            WHERE User_Email = %s AND Is_public = TRUE
        """, (current_user.id,))
        
        total_posts = database_cursor.fetchone()[0]
        
        # 獲取用戶的貼文按心情分類統計
        database_cursor.execute("""
            SELECT Mood, COUNT(*) as count
            FROM Posts 
            WHERE User_Email = %s AND Is_public = TRUE
            GROUP BY Mood
        """, (current_user.id,))
        
        mood_stats = {}
        for mood, count in database_cursor.fetchall():
            mood_stats[mood or 'neutral'] = count
        
        # 獲取用戶的獲讚總數
        database_cursor.execute("""
            SELECT COUNT(*) as total_likes
            FROM Likes l
            JOIN Posts p ON l.Post_id = p.Post_id
            WHERE p.User_Email = %s AND p.Is_public = TRUE
        """, (current_user.id,))
        
        total_likes = database_cursor.fetchone()[0]
        
        # 獲取用戶的評論總數
        database_cursor.execute("""
            SELECT COUNT(*) as total_comments
            FROM Comments c
            JOIN Posts p ON c.Post_id = p.Post_id
            WHERE p.User_Email = %s AND p.Is_public = TRUE
        """, (current_user.id,))
        
        total_comments = database_cursor.fetchone()[0]
        
        database_connection.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total_posts': total_posts,
                'total_likes': total_likes,
                'total_comments': total_comments,
                'mood_stats': mood_stats
            }
        })
        
    except Exception as e:
        print(f"[ERROR] 獲取用戶貢獻統計時發生錯誤: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'獲取統計失敗：{str(e)}'
        }), 500

@social_bp.route('/user_level_info')
@login_required
def user_level_info():
    """獲取當前用戶的等級信息"""
    level_info = get_user_level_info(current_user.id)
    return jsonify(level_info)

@social_bp.route('/level_guide')
@login_required
def level_guide():
    """等級規範指南頁面"""
    return render_template('social/level_guide.html', level_config=UserLevelSystem.get_all_levels())

