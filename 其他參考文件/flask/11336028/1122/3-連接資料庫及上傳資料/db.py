import pymysql

# MySQL 連線資訊
DB_HOST = "localhost"
DB_PORT = 3306  # MySQL 預設埠號
DB_NAME = "north"
DB_USER = "root"
DB_PASSWORD = "11056$$$"

# 建立資料庫連線
def get_connection():
    connection = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4"  # 設定字元集
    )
    return connection