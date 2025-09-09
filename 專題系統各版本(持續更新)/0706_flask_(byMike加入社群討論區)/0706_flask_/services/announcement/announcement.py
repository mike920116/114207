from datetime import datetime
from flask import jsonify
from utils import db
import pymysql.cursors
from . import announcement_bp  # 從 __init__.py 導入 Blueprint


@announcement_bp.get("/announcements")
def api_announcements():
    """列出在生效期間內的公告 (最多 20 筆，供首頁跑馬燈)"""
    database_connection = db.get_connection()
    database_cursor  = database_connection.cursor(cursor=pymysql.cursors.DictCursor)
    now  = datetime.now()
    database_cursor.execute(
        """
        SELECT id, title, body, created_at
        FROM   Announcements
        WHERE  (start_time IS NULL OR start_time <= %s)
          AND  (end_time   IS NULL OR end_time   >= %s)
        ORDER  BY created_at DESC
        LIMIT  20
        """,
        (now, now),
    )
    announcements_data = database_cursor.fetchall()
    database_cursor.close(); database_connection.close()
    return jsonify(announcements_data)
