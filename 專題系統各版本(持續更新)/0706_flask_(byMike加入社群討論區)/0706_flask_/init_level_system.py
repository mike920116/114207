# -*- coding: utf-8 -*-
"""
資料庫初始化/更新腳本 - 等級系統

確保 User 表包含等級系統所需的欄位：
- user_level: 用戶等級 (1-7)
- user_points: 用戶積分
- posts_count: 發文數量
- likes_received: 獲得讚數
- comments_made: 發表評論數
- login_days: 登入天數
- last_level_update: 最後等級更新時間

使用方式：
python init_level_system.py
"""

import pymysql
from dotenv import load_dotenv
import os

# 載入環境變數
load_dotenv()

# 資料庫連接配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'flask_diary'),
    'charset': 'utf8mb4',
    'autocommit': True
}

def create_level_tables():
    """創建或更新等級系統相關的資料表"""
    
    try:
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🚀 開始初始化等級系統資料庫...")
        
        # 1. 檢查並新增 User 表的等級欄位
        print("📝 檢查 User 表結構...")
        
        # 獲取當前 User 表結構
        cursor.execute("DESCRIBE User")
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        # 需要新增的欄位定義
        required_columns = {
            'user_level': "INT DEFAULT 1 COMMENT '用戶等級 (1-7)'",
            'user_points': "INT DEFAULT 0 COMMENT '用戶積分'",
            'posts_count': "INT DEFAULT 0 COMMENT '發文數量'",
            'likes_received': "INT DEFAULT 0 COMMENT '獲得讚數'",
            'comments_made': "INT DEFAULT 0 COMMENT '發表評論數'",
            'login_days': "INT DEFAULT 1 COMMENT '登入天數'",
            'last_level_update': "DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最後等級更新時間'"
        }
        
        # 新增缺少的欄位
        for column_name, column_definition in required_columns.items():
            if column_name not in existing_columns:
                alter_sql = f"ALTER TABLE User ADD COLUMN {column_name} {column_definition}"
                cursor.execute(alter_sql)
                print(f"✅ 新增欄位: {column_name}")
            else:
                print(f"⏩ 欄位已存在: {column_name}")
        
        # 2. 創建用戶等級歷史記錄表
        print("📊 創建等級歷史記錄表...")
        
        create_history_table_sql = """
        CREATE TABLE IF NOT EXISTS UserLevelHistory (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            old_level INT NOT NULL,
            new_level INT NOT NULL,
            old_title VARCHAR(100),
            new_title VARCHAR(100),
            points_earned INT DEFAULT 0,
            reason VARCHAR(255) DEFAULT '活動參與',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_email (user_email),
            INDEX idx_created_at (created_at),
            FOREIGN KEY (user_email) REFERENCES User(User_Email) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='用戶等級升級歷史記錄表'
        """
        
        cursor.execute(create_history_table_sql)
        print("✅ 等級歷史記錄表已就緒")
        
        # 3. 初始化現有用戶的等級數據
        print("🔄 初始化現有用戶等級數據...")
        
        # 檢查是否有用戶需要初始化
        cursor.execute("SELECT COUNT(*) FROM User WHERE user_level IS NULL OR user_level = 0")
        users_need_init = cursor.fetchone()[0]
        
        if users_need_init > 0:
            print(f"📊 發現 {users_need_init} 位用戶需要初始化等級數據")
            
            # 初始化所有用戶的基本等級資料
            init_users_sql = """
            UPDATE User 
            SET 
                user_level = 1,
                user_points = 0,
                posts_count = 0,
                likes_received = 0,
                comments_made = 0,
                login_days = GREATEST(1, DATEDIFF(NOW(), Created_at) + 1),
                last_level_update = NOW()
            WHERE user_level IS NULL OR user_level = 0
            """
            
            cursor.execute(init_users_sql)
            print(f"✅ 已初始化 {users_need_init} 位用戶的等級數據")
        else:
            print("⏩ 所有用戶等級數據已是最新")
        
        # 4. 創建索引優化查詢性能
        print("🚀 優化資料庫索引...")
        
        try:
            # User 表等級相關索引
            cursor.execute("CREATE INDEX idx_user_level ON User(user_level)")
            print("✅ 創建用戶等級索引")
        except pymysql.err.OperationalError:
            print("⏩ 用戶等級索引已存在")
        
        try:
            cursor.execute("CREATE INDEX idx_user_points ON User(user_points)")
            print("✅ 創建用戶積分索引")
        except pymysql.err.OperationalError:
            print("⏩ 用戶積分索引已存在")
        
        print("\n🎉 等級系統資料庫初始化完成！")
        print("📋 系統包含以下功能：")
        print("   • 7 級等級制度 (新手村民 → 傳奇貢獻者)")
        print("   • 積分計算系統 (發文×10 + 獲讚×3 + 評論×5 + 登入天數×2)")
        print("   • 等級升級歷史記錄")
        print("   • 用戶等級統計與進度追蹤")
        print("   • 前端動態等級卡片顯示")
        
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ 資料庫初始化失敗: {e}")
        return False

def test_level_system():
    """測試等級系統功能"""
    try:
        from utils.level_system import UserLevelSystem, update_user_level_and_stats, get_user_level_info
        
        print("\n🧪 測試等級系統功能...")
        
        # 測試等級配置
        print("📋 等級配置檢查:")
        for level in range(1, 8):
            level_info = UserLevelSystem.get_level_info(level)
            print(f"   Lv.{level}: {level_info['emoji']} {level_info['title']} ({level_info['min_points']}+ 積分)")
        
        # 測試積分計算
        test_points = UserLevelSystem.calculate_points(5, 10, 3, 30)  # 5篇文章, 10個讚, 3條評論, 30天
        test_level = UserLevelSystem.get_level_by_points(test_points)
        print(f"💎 積分計算測試: {test_points} 積分 = 等級 {test_level}")
        
        print("✅ 等級系統功能測試通過")
        return True
        
    except Exception as e:
        print(f"❌ 等級系統測試失敗: {e}")
        return False

if __name__ == "__main__":
    print("🌟 Flask 社群等級系統初始化工具")
    print("=" * 50)
    
    # 創建資料表和初始化數據
    if create_level_tables():
        # 測試等級系統
        test_level_system()
        
        print("\n" + "=" * 50)
        print("🎊 等級系統已成功部署到您的專案中！")
        print("🚀 現在可以啟動應用程式並體驗完整的等級功能")
        print("📖 訪問 /social/level_guide 查看等級規範")
    else:
        print("\n❌ 初始化過程中發生錯誤，請檢查資料庫配置")
