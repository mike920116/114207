from datetime import datetime
from flask import jsonify
from utils import db
import pymysql.cursors
from . import announcement_bp  # 從 __init__.py 導入 Blueprint


@announcement_bp.get("/announcements")
def api_announcements():
    """列出在生效期間內的公告 (最多 20 筆，供首頁跑馬燈)"""
    conn = db.get_connection()
    cur  = conn.cursor(cursor=pymysql.cursors.DictCursor)
    now  = datetime.now()
    cur.execute(
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
    rows = cur.fetchall()
    cur.close(); conn.close()
    return jsonify(rows)
