"""
雲端環境修復工具
用於修復雲端部署時的環境變數載入問題
"""

import os
from dotenv import load_dotenv, find_dotenv

def force_reload_env():
    """強制重新載入環境變數"""
    
    # 方法1：重新載入 .env 檔案
    if os.path.exists('.env'):
        load_dotenv('.env', override=True)
        print("✅ 重新載入 .env 檔案")
    
    # 方法2：尋找並載入 .env 檔案
    env_file = find_dotenv()
    if env_file:
        load_dotenv(env_file, override=True)
        print(f"✅ 找到並載入環境檔案: {env_file}")
    
    # 方法3：手動設定關鍵環境變數（如果在雲端平台上設定了）
    # 這適用於 Heroku、Railway 等平台
    platform_vars = [
        'ADMIN_EMAILS',
        'SECRET_KEY',
        'DATABASE_URL'
    ]
    
    for var in platform_vars:
        value = os.environ.get(var)  # 使用 os.environ 而不是 os.getenv
        if value:
            os.environ[var] = value  # 確保設定到環境中
            print(f"✅ 載入平台環境變數: {var}")
    
    # 驗證關鍵變數
    admin_emails = os.getenv("ADMIN_EMAILS", "")
    if admin_emails.strip():
        print(f"✅ ADMIN_EMAILS 載入成功: {admin_emails}")
        return True
    else:
        print("❌ ADMIN_EMAILS 仍然未載入")
        return False

# 在模組載入時執行
if __name__ != "__main__":
    force_reload_env()
