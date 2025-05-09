import pymysql
from dbutils.pooled_db import PooledDB

# MySQL 連線資訊
DB_HOST = "localhost"
DB_PORT = 3306  # MySQL 預設埠號
DB_NAME = "flaskdb"
DB_USER = "root"
DB_PASSWORD = "56985698"

# 建立資料庫連線池
# mincached: 啟動時建立的空閒連接數
# maxcached: 連線池中最大空閒連接數
# maxconnections: 連線池允許的最大連接數
# blocking: 連接池中無可用連接是否阻塞等待 True/False
pool = PooledDB(
    creator=pymysql,  # 指定使用的資料庫模組
    mincached=5,
    maxcached=10,
    maxconnections=20,
    blocking=True,
    host=DB_HOST,
    port=DB_PORT,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
    charset="utf8mb4",
    autocommit=True # 建議在 Web 應用中設定為 True，或者確保手動管理事務
)

# 從連線池取得資料庫連線
def get_connection():
    return pool.connection()