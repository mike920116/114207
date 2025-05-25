from flask import render_template
from flask_login import login_required, current_user
from utils import db
from services.social import social_bp  # 導入 Blueprint

@social_bp.route('/main')
@login_required
def main():
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

