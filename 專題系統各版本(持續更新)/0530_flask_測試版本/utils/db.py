import pymysql
from dbutils.pooled_db import PooledDB
from config import get_config

# 獲取配置
config_class = get_config()
db_config = config_class.get_db_config()

# MySQL 連線資訊（從配置獲取）
DB_HOST = db_config['host']
DB_PORT = db_config['port']
DB_NAME = db_config['database']
DB_USER = db_config['user']
DB_PASSWORD = db_config['password']

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
    autocommit=True, # 建議在 Web 應用中設定為 True，或者確保手動管理事務
    reset=True  # 在每次使用後重置連接
)

# 從連線池取得資料庫連線
def get_connection():
    conn = pool.connection()
    conn.ping(reconnect=True)  # 檢查連線是否有效
    return conn