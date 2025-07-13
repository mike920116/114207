#!/usr/bin/env python3
"""
雲端環境診斷工具
用於診斷雲端部署時的環境變數和配置問題
"""

import os
import sys
from datetime import datetime

def diagnose_environment():
    """診斷當前環境的配置狀態"""
    
    print("=" * 60)
    print("雲端環境診斷報告")
    print("=" * 60)
    print(f"診斷時間: {datetime.now()}")
    print(f"Python 版本: {sys.version}")
    print(f"工作目錄: {os.getcwd()}")
    print()
    
    # 檢查環境變數
    print("環境變數檢查:")
    print("-" * 40)
    
    # 關鍵環境變數
    key_vars = [
        'ADMIN_EMAILS',
        'SECRET_KEY', 
        'FLASK_ENV',
        'DATABASE_URL',
        'PORT',
        'FLASK_RUN_PORT'
    ]
    
    for var in key_vars:
        value = os.getenv(var)
        if value:
            # 敏感資訊只顯示前幾個字符
            if var in ['SECRET_KEY', 'DATABASE_URL']:
                display_value = f"{value[:10]}..." if len(value) > 10 else value
            else:
                display_value = value
            print(f"✅ {var}: {display_value}")
        else:
            print(f"❌ {var}: 未設定")
    
    print()
    
    # 檢查檔案存在性
    print("檔案檢查:")
    print("-" * 40)
    
    files_to_check = [
        '.env',
        'app.py',
        'services/admin/admin.py',
        'services/admin/admin_report.py',
        'utils/db.py'
    ]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"✅ {file_path}: {size} bytes")
        else:
            print(f"❌ {file_path}: 不存在")
    
    print()
    
    # 檢查 .env 檔案內容（如果存在）
    if os.path.exists('.env'):
        print(".env 檔案內容:")
        print("-" * 40)
        try:
            with open('.env', 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for i, line in enumerate(lines, 1):
                    line = line.strip()
                    if line and not line.startswith('#'):
                        # 隱藏敏感資訊
                        if any(sensitive in line.upper() for sensitive in ['PASSWORD', 'SECRET', 'KEY']):
                            key = line.split('=')[0] if '=' in line else line
                            print(f"{i:2d}: {key}=***")
                        else:
                            print(f"{i:2d}: {line}")
                    elif line:
                        print(f"{i:2d}: {line}")
        except Exception as e:
            print(f"❌ 讀取 .env 檔案失敗: {e}")
    
    print()
    
    # 嘗試連接數據庫
    print("數據庫連接測試:")
    print("-" * 40)
    try:
        sys.path.append(os.getcwd())
        from utils.db import get_connection
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # 測試簡單查詢
        cursor.execute("SELECT 1 as test")
        result = cursor.fetchone()
        print(f"✅ 數據庫連接成功: {result}")
        
        # 檢查管理員用戶
        cursor.execute("SELECT User_Email, User_name FROM User WHERE User_Email = %s", 
                      (os.getenv("ADMIN_EMAILS", "").split(",")[0].strip(),))
        admin_user = cursor.fetchone()
        
        if admin_user:
            print(f"✅ 管理員用戶存在: {admin_user[0]} ({admin_user[1]})")
        else:
            print(f"❌ 管理員用戶不存在: {os.getenv('ADMIN_EMAILS', '')}")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ 數據庫連接失敗: {e}")
    
    print()
    
    # 測試權限檢查邏輯
    print("權限檢查邏輯測試:")
    print("-" * 40)
    
    try:
        # 模擬權限檢查
        admin_emails_str = os.getenv("ADMIN_EMAILS", "")
        if admin_emails_str.strip():
            admin_emails = set(email.strip() for email in admin_emails_str.split(",") if email.strip())
            print(f"✅ ADMIN_EMAILS 解析: {admin_emails}")
            
            # 檢查是否為空集合
            if admin_emails:
                print(f"✅ 管理員郵箱數量: {len(admin_emails)}")
            else:
                print("❌ 管理員郵箱集合為空")
        else:
            print("❌ ADMIN_EMAILS 環境變數為空或未設定")
            
    except Exception as e:
        print(f"❌ 權限檢查邏輯測試失敗: {e}")
    
    print()
    print("=" * 60)
    print("診斷完成")
    print("=" * 60)

if __name__ == "__main__":
    diagnose_environment()
