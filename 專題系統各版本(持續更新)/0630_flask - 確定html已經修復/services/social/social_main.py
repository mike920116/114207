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
    conn = db.get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT p.Post_id, p.Content, p.Created_at, p.Is_public,
                   u.User_name
            FROM Posts p
            JOIN User u ON p.User_Email = u.User_Email
            ORDER BY p.Created_at DESC
        """)
        posts_raw = cursor.fetchall()

        post_data = []
        for p in posts_raw:
            post_id, content, created_at, is_public, user_name = p

            cursor.execute("SELECT COUNT(*) FROM Likes WHERE Post_id = %s", (post_id,))
            likes = cursor.fetchone()[0]

            cursor.execute("SELECT * FROM Comments WHERE Post_id = %s", (post_id,))
            comments = cursor.fetchall()

            post_data.append({
                'id': post_id,
                'content': content,
                'author': user_name if is_public else '匿名',
                'created_at': created_at,
                'likes': likes,
                'comments': comments,
                'anonymous': not is_public,
                'mood': '未知'
            })

        return render_template("social/social_main.html", posts=post_data)
    finally:
        cursor.close()
        conn.close()

