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
from werkzeug.utils import secure_filename
import os
import uuid
from . import social_bp  # 從 __init__.py 導入 Blueprint

# 圖片上傳設定
UPLOAD_FOLDER = '0706_flask_/static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    """檢查檔案是否為允許的圖片格式"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
            
            # 處理圖片上傳
            image_url = None
            if 'image' in request.files:
                image_file = request.files['image']
                if image_file and image_file.filename != '' and allowed_file(image_file.filename):
                    try:
                        # 檢查檔案大小
                        image_file.seek(0, os.SEEK_END)
                        file_size = image_file.tell()
                        image_file.seek(0)  # 重置檔案指標
                        
                        if file_size > MAX_FILE_SIZE:
                            return jsonify({
                                'success': False,
                                'message': '圖片檔案大小不能超過5MB'
                            }), 400
                        
                        # 生成唯一檔名
                        file_extension = image_file.filename.rsplit('.', 1)[1].lower()
                        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                        
                        # 確保上傳資料夾存在
                        upload_path = os.path.join(UPLOAD_FOLDER)
                        if not os.path.exists(upload_path):
                            os.makedirs(upload_path)
                        
                        # 儲存檔案
                        file_path = os.path.join(upload_path, unique_filename)
                        image_file.save(file_path)
                        
                        # 儲存相對路徑到資料庫（用於網頁顯示）
                        # 使用 url_for 來生成正確的靜態檔案 URL
                        image_url = f"/0706_flask_/static/uploads/{unique_filename}"
                        
                    except Exception as e:
                        print(f"[ERROR] 圖片上傳失敗: {str(e)}")
                        return jsonify({
                            'success': False,
                            'message': f'圖片上傳失敗：{str(e)}'
                        }), 500
            
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
    - 當前用戶的按讚狀態
    - 按時間倒序排列
    
    Returns:
        str: 渲染後的社交主頁 HTML 頁面
    """
    database_connection = db.get_connection()
    database_cursor = database_connection.cursor()

    # 取得所有貼文的基本資訊（包含新增的欄位和當前用戶按讚狀態）
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
            COUNT(l.Like_id) AS likes_count,
            MAX(CASE WHEN l.User_Email = %s THEN 1 ELSE 0 END) AS user_liked
        FROM Posts p
        LEFT JOIN User u ON p.User_Email = u.User_Email
        LEFT JOIN Likes l ON p.Post_id = l.Post_id
        WHERE p.Is_public = TRUE
        GROUP BY p.Post_id, p.User_Email, u.User_name, p.title, p.Content, p.Mood, p.Is_Anonymous, p.Image_URL, p.Is_public, p.Created_at
        ORDER BY p.Created_at DESC
        """, (current_user.id,))
    
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
                c.Reply_to_id,
                c.Reply_to_username,
                c.Is_public,
                c.Created_at
            FROM Comments c
            LEFT JOIN User u ON c.User_Email = u.User_Email
            WHERE c.Post_id = %s AND c.Is_public = TRUE
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
            'user_liked': bool(post_item[11]),  # 當前用戶是否已按讚
            'comments': [
                {
                    'comment_id': comment_item[0],
                    'user_email': comment_item[1],
                    'username': comment_item[2],
                    'content': comment_item[3],
                    'reply_to_id': comment_item[4],
                    'reply_to_username': comment_item[5],
                    'is_public': comment_item[6],
                    'created_at': comment_item[7]
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

@social_bp.route('/toggle_like/<int:post_id>', methods=['POST'])
@login_required
def toggle_like(post_id):
    """
    切換貼文按讚狀態
    
    Args:
        post_id (int): 貼文ID
        
    Returns:
        JSON: 按讚狀態和更新後的數量
    """
    try:
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        
        # 檢查貼文是否存在
        database_cursor.execute("SELECT Post_id FROM Posts WHERE Post_id = %s", (post_id,))
        if not database_cursor.fetchone():
            return jsonify({
                'success': False,
                'message': '貼文不存在'
            }), 404
        
        # 檢查用戶是否已經按過讚
        database_cursor.execute("""
            SELECT Like_id FROM Likes 
            WHERE Post_id = %s AND User_Email = %s
        """, (post_id, current_user.id))
        
        existing_like = database_cursor.fetchone()
        
        if existing_like:
            # 取消按讚
            database_cursor.execute("""
                DELETE FROM Likes 
                WHERE Post_id = %s AND User_Email = %s
            """, (post_id, current_user.id))
            is_liked = False
            action = 'unliked'
        else:
            # 新增按讚
            current_time = datetime.now()
            database_cursor.execute("""
                INSERT INTO Likes (Post_id, User_Email, Created_at) 
                VALUES (%s, %s, %s)
            """, (post_id, current_user.id, current_time))
            is_liked = True
            action = 'liked'
        
        # 獲取更新後的按讚數量
        database_cursor.execute("""
            SELECT COUNT(*) FROM Likes WHERE Post_id = %s
        """, (post_id,))
        likes_count = database_cursor.fetchone()[0]
        
        database_connection.commit()
        database_connection.close()
        
        # 如果是按讚（不是取消），更新用戶等級
        if is_liked:
            level_update = update_user_level_and_stats(current_user.id)
        else:
            level_update = None
        
        response_data = {
            'success': True,
            'is_liked': is_liked,
            'likes_count': likes_count,
            'action': action
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
        print(f"[ERROR] 按讚操作失敗: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'操作失敗：{str(e)}'
        }), 500

@social_bp.route('/add_comment/<int:post_id>', methods=['POST'])
@login_required
def add_comment(post_id):
    """
    新增評論
    
    Args:
        post_id (int): 貼文ID
        
    Returns:
        JSON: 評論結果和新評論資料
    """
    try:
        content = request.form.get('content', '').strip()
        reply_to_id = request.form.get('reply_to_id', '').strip()
        reply_to_username = request.form.get('reply_to_username', '').strip()
        
        # 驗證評論內容
        if not content:
            return jsonify({
                'success': False,
                'message': '請輸入評論內容'
            }), 400
        
        if len(content) > 500:
            return jsonify({
                'success': False,
                'message': '評論內容不能超過500字'
            }), 400
        
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        
        # 檢查貼文是否存在
        database_cursor.execute("SELECT Post_id FROM Posts WHERE Post_id = %s", (post_id,))
        if not database_cursor.fetchone():
            return jsonify({
                'success': False,
                'message': '貼文不存在'
            }), 404
        
        # 如果是回覆，檢查被回覆的評論是否存在
        if reply_to_id:
            database_cursor.execute("SELECT Comment_id FROM Comments WHERE Comment_id = %s AND Post_id = %s", (reply_to_id, post_id))
            if not database_cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': '被回覆的評論不存在'
                }), 404
        
        # 新增評論
        current_time = datetime.now()
        database_cursor.execute("""
            INSERT INTO Comments (Post_id, User_Email, Content, Reply_to_id, Reply_to_username, Is_public, Created_at, Updated_at) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (post_id, current_user.id, content, reply_to_id or None, reply_to_username or None, True, current_time, current_time))
        
        comment_id = database_cursor.lastrowid
        
        # 獲取用戶名稱
        database_cursor.execute("SELECT User_name FROM User WHERE User_Email = %s", (current_user.id,))
        user_data = database_cursor.fetchone()
        username = user_data[0] if user_data else '未知用戶'
        
        # 獲取更新後的評論數量
        database_cursor.execute("""
            SELECT COUNT(*) FROM Comments WHERE Post_id = %s
        """, (post_id,))
        comments_count = database_cursor.fetchone()[0]
        
        database_connection.commit()
        database_connection.close()
        
        # 更新用戶等級
        level_update = update_user_level_and_stats(current_user.id)
        
        response_data = {
            'success': True,
            'comment': {
                'comment_id': comment_id,
                'username': username,
                'content': content,
                'reply_to_id': reply_to_id or None,
                'reply_to_username': reply_to_username or None,
                'created_at': current_time.strftime('%Y-%m-%d %H:%M')
            },
            'comments_count': comments_count
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
        print(f"[ERROR] 新增評論失敗: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'評論失敗：{str(e)}'
        }), 500

@social_bp.route('/get_comments/<int:post_id>')
@login_required
def get_comments(post_id):
    """
    獲取貼文的所有評論
    
    Args:
        post_id (int): 貼文ID
        
    Returns:
        JSON: 評論列表
    """
    try:
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        
        # 獲取評論列表
        database_cursor.execute("""
            SELECT 
                c.Comment_id,
                c.User_Email,
                u.User_name,
                c.Content,
                c.Reply_to_id,
                c.Reply_to_username,
                c.Created_at
            FROM Comments c
            LEFT JOIN User u ON c.User_Email = u.User_Email
            WHERE c.Post_id = %s AND c.Is_public = TRUE
            ORDER BY c.Created_at ASC
        """, (post_id,))
        
        comments_data = database_cursor.fetchall()
        database_connection.close()
        
        comments = [
            {
                'comment_id': comment[0],
                'user_email': comment[1],
                'username': comment[2] or '未知用戶',
                'content': comment[3],
                'reply_to_id': comment[4],
                'reply_to_username': comment[5],
                'created_at': comment[6].strftime('%Y-%m-%d %H:%M')
            }
            for comment in comments_data
        ]
        
        return jsonify({
            'success': True,
            'comments': comments
        })
        
    except Exception as e:
        print(f"[ERROR] 獲取評論失敗: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'獲取評論失敗：{str(e)}'
        }), 500

@social_bp.route('/edit_comment/<int:comment_id>', methods=['GET', 'POST'])
@login_required
def edit_comment(comment_id):
    """
    編輯留言功能
    
    GET: 獲取留言資料
    POST: 處理編輯提交
    
    Args:
        comment_id (int): 要編輯的留言ID
        
    Returns:
        GET: JSON回應包含留言資料
        POST: JSON回應
    """
    database_connection = db.get_connection()
    database_cursor = database_connection.cursor()
    
    # 檢查留言是否存在且屬於當前用戶
    database_cursor.execute("""
        SELECT Comment_id, User_Email, Content 
        FROM Comments 
        WHERE Comment_id = %s AND User_Email = %s
    """, (comment_id, current_user.id))
    
    comment_data = database_cursor.fetchone()
    
    if not comment_data:
        database_connection.close()
        return jsonify({
            'success': False,
            'message': '留言不存在或您沒有權限編輯此留言'
        }), 403
    
    if request.method == 'GET':
        # 返回留言資料供前端表單使用
        database_connection.close()
        return jsonify({
            'success': True,
            'comment': {
                'comment_id': comment_data[0],
                'content': comment_data[2]
            }
        })
    
    elif request.method == 'POST':
        try:
            # 處理編輯提交
            content = request.form.get('content', '').strip()
            
            # 驗證必要欄位
            if not content:
                return jsonify({
                    'success': False,
                    'message': '請輸入留言內容'
                }), 400
            
            if len(content) > 500:
                return jsonify({
                    'success': False,
                    'message': '留言內容不能超過500字'
                }), 400
            
            # 更新留言
            current_time = datetime.now()
            database_cursor.execute("""
                UPDATE Comments 
                SET Content = %s, Updated_at = %s
                WHERE Comment_id = %s AND User_Email = %s
            """, (content, current_time, comment_id, current_user.id))
            
            database_connection.commit()
            database_connection.close()
            
            return jsonify({
                'success': True,
                'message': '留言已成功更新',
                'content': content
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'更新失敗：{str(e)}'
            }), 500

@social_bp.route('/delete_comment/<int:comment_id>', methods=['POST'])
@login_required
def delete_comment(comment_id):
    """
    刪除留言功能
    
    Args:
        comment_id (int): 要刪除的留言ID
        
    Returns:
        JSON: 刪除結果
    """
    try:
        print(f"[DEBUG] 嘗試刪除留言 ID: {comment_id}, 用戶: {current_user.id}")
        
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        
        # 先檢查留言是否存在且屬於當前用戶，同時獲取貼文ID用於更新留言數
        database_cursor.execute("""
            SELECT User_Email, Post_id FROM Comments 
            WHERE Comment_id = %s AND User_Email = %s
        """, (comment_id, current_user.id))
        
        comment_data = database_cursor.fetchone()
        print(f"[DEBUG] 留言查詢結果: {comment_data}")
        
        if not comment_data:
            print(f"[DEBUG] 留言不存在或無權限，Comment_id: {comment_id}, User: {current_user.id}")
            return jsonify({
                'success': False,
                'message': '留言不存在或您沒有權限刪除此留言'
            }), 403
        
        post_id = comment_data[1]
        
        # 刪除留言
        database_cursor.execute("DELETE FROM Comments WHERE Comment_id = %s", (comment_id,))
        affected_rows = database_cursor.rowcount
        print(f"[DEBUG] 刪除影響的行數: {affected_rows}")
        
        # 獲取更新後的留言數量
        database_cursor.execute("""
            SELECT COUNT(*) FROM Comments WHERE Post_id = %s
        """, (post_id,))
        comments_count = database_cursor.fetchone()[0]
        
        database_connection.commit()
        database_connection.close()
        
        print(f"[DEBUG] 留言 {comment_id} 刪除成功")
        return jsonify({
            'success': True,
            'message': '留言已成功刪除',
            'post_id': post_id,
            'comments_count': comments_count
        })
        
    except Exception as e:
        print(f"[ERROR] 刪除留言時發生錯誤: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'刪除失敗：{str(e)}'
        }), 500

@social_bp.route('/check_like_status/<int:post_id>')
@login_required
def check_like_status(post_id):
    """
    檢查用戶對特定貼文的按讚狀態
    
    Args:
        post_id (int): 貼文ID
        
    Returns:
        JSON: 按讚狀態
    """
    try:
        database_connection = db.get_connection()
        database_cursor = database_connection.cursor()
        
        # 檢查用戶是否已按讚
        database_cursor.execute("""
            SELECT Like_id FROM Likes 
            WHERE Post_id = %s AND User_Email = %s
        """, (post_id, current_user.id))
        
        is_liked = database_cursor.fetchone() is not None
        
        # 獲取總按讚數
        database_cursor.execute("""
            SELECT COUNT(*) FROM Likes WHERE Post_id = %s
        """, (post_id,))
        likes_count = database_cursor.fetchone()[0]
        
        database_connection.close()
        
        return jsonify({
            'success': True,
            'is_liked': is_liked,
            'likes_count': likes_count
        })
        
    except Exception as e:
        print(f"[ERROR] 檢查按讚狀態失敗: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'檢查失敗：{str(e)}'
        }), 500

