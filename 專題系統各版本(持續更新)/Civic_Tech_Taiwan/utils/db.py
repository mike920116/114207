"""
資料庫連線管理模組

提供 MySQL 資料庫連線池管理功能：
- 連線池自動管理與優化
- 連線重用與回收機制
- 自動重連與錯誤處理
- 環境變數配置支援

連線池配置：
- mincached: 5 個最小空閒連線
- maxcached: 10 個最大空閒連線
- maxconnections: 20 個最大總連線數
- blocking: 阻塞等待可用連線
- autocommit: 自動提交事務

環境變數：
- DB_HOST: 資料庫主機（預設: localhost）
- DB_PORT: 資料庫埠號（預設: 3306）
- DB_NAME: 資料庫名稱（預設: flaskdb）
- DB_USER: 資料庫用戶（預設: root）
- DB_PASSWORD: 資料庫密碼（預設: NTUB）

使用方式：
    from utils.db import get_connection
    conn = get_connection()
    cursor = conn.cursor()
    # 執行 SQL 操作...
    conn.close()
"""

import pymysql
import os
from dbutils.pooled_db import PooledDB
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# MySQL 連線資訊
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", 3306))
DB_NAME = os.environ.get("DB_NAME", "flaskdb")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "NTUB")

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
    """
    從連線池獲取資料庫連線
    
    自動檢查連線有效性，提供可靠的資料庫連線
    
    Returns:
        Connection: PyMySQL 資料庫連線物件
        
    Note:
        使用後請記得呼叫 conn.close() 以歸還連線至連線池
    """
    conn = pool.connection()
    conn.ping(reconnect=True)  # 檢查連線是否有效
    return conn