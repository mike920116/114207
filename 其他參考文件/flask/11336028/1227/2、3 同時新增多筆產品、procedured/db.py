import pymysql

# MySQL 連線資訊
DB_HOST = "localhost"
DB_PORT = 3306  # MySQL 預設埠號
DB_NAME = "north" #想要連到的資料庫名稱
DB_USER = "root" #啟動超級使用者模式修改
DB_PASSWORD = "56985698" #預設密碼11056$$$

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