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
"""

from flask import render_template
from flask_login import login_required, current_user
from utils import db
from . import social_bp  # 從 __init__.py 導入 Blueprint

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

    # 取得所有貼文的基本資訊
    database_cursor.execute("""
        SELECT 
            p.Post_id,
            p.User_Email,
            u.User_name,
            p.Content,
            p.Is_public,
            p.Created_at,
            COUNT(l.Like_id) AS likes_count
        FROM Posts p
        LEFT JOIN User u ON p.User_Email = u.User_Email
        LEFT JOIN Likes l ON p.Post_id = l.Post_id
        GROUP BY p.Post_id
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
            'username': post_item[2],
            'content': post_item[3],
            'is_public': post_item[4],
            'created_at': post_item[5],
            'likes_count': post_item[6],
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

