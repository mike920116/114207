#!/usr/bin/env python3
"""
雲端服務器環境變數檢查腳本
直接檢查環境變數配置，無需啟動 Flask 應用程式
"""

import os
import sys
from dotenv import load_dotenv, find_dotenv

def check_environment():
    print("=" * 60)
    print("雲端服務器環境變數檢查")
    print("=" * 60)
    
    # 檢查工作目錄
    print(f"當前工作目錄: {os.getcwd()}")
    
    # 檢查 .env 檔案
    env_file = find_dotenv()
    print(f".env 檔案路徑: {env_file if env_file else '未找到'}")
    
    if os.path.exists('.env'):
        print(".env 檔案存在")
        try:
            with open('.env', 'r') as f:
                lines = f.readlines()
                print(f".env 檔案行數: {len(lines)}")
                for i, line in enumerate(lines[:10], 1):  # 只顯示前10行
                    if 'ADMIN' in line.upper():
                        print(f"  第{i}行: {line.strip()}")
        except Exception as e:
            print(f"讀取 .env 檔案失敗: {e}")
    else:
        print(".env 檔案不存在")
    
    print("\n" + "-" * 40)
    print("環境變數檢查")
    print("-" * 40)
    
    # 方法1: 直接從系統環境變數檢查
    admin_emails_system = os.environ.get('ADMIN_EMAILS')
    print(f"系統環境變數 ADMIN_EMAILS: {admin_emails_system}")
    
    # 方法2: 載入 .env 後檢查
    print("\n載入 .env 檔案...")
    load_dotenv()
    admin_emails_dotenv = os.getenv('ADMIN_EMAILS')
    print(f"載入 .env 後 ADMIN_EMAILS: {admin_emails_dotenv}")
    
    # 方法3: 強制重新載入
    print("\n強制重新載入 .env 檔案...")
    load_dotenv(override=True)
    admin_emails_reload = os.getenv('ADMIN_EMAILS')
    print(f"強制重新載入後 ADMIN_EMAILS: {admin_emails_reload}")
    
    # 分析結果
    print("\n" + "-" * 40)
    print("分析結果")
    print("-" * 40)
    
    if admin_emails_system:
        print("✅ 系統環境變數中有 ADMIN_EMAILS")
        emails = [email.strip() for email in admin_emails_system.split(',')]
        print(f"   管理員郵箱: {emails}")
    elif admin_emails_dotenv or admin_emails_reload:
        print("⚠️  系統環境變數中沒有 ADMIN_EMAILS，但 .env 檔案中有")
        final_emails = admin_emails_reload or admin_emails_dotenv
        emails = [email.strip() for email in final_emails.split(',')]
        print(f"   管理員郵箱: {emails}")
    else:
        print("❌ 所有方法都無法找到 ADMIN_EMAILS")
        print("   可能的原因:")
        print("   1. .env 檔案不存在或不在正確位置")
        print("   2. .env 檔案中沒有 ADMIN_EMAILS 設定")
        print("   3. 環境變數名稱錯誤")
        print("   4. 檔案權限問題")
    
    # 檢查其他相關環境變數
    print("\n其他相關環境變數:")
    for var in ['SECRET_KEY', 'FLASK_ENV', 'DATABASE_URL']:
        value = os.getenv(var)
        if value:
            display_value = value[:20] + "..." if len(value) > 20 else value
            print(f"  {var}: {display_value}")
        else:
            print(f"  {var}: 未設定")

if __name__ == "__main__":
    check_environment()
