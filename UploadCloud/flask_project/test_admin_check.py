#!/usr/bin/env python3
"""
權限檢查測試工具
模擬登入用戶並測試 is_admin() 函數
"""

import os
import sys
from dotenv import load_dotenv

# 添加項目根目錄到 Python 路徑
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.db import get_connection
from services.user.user import User

def test_admin_check():
    # 載入環境變數
    load_dotenv()
    
    # 模擬管理員用戶物件
    admin_email = "2025dify@gmail.com"
    admin_user = User(id=admin_email, username="luhan", password="dummy")
    
    # 獲取環境變數中的管理員郵箱
    admin_emails = set(email.strip() for email in os.getenv("ADMIN_EMAILS", "").split(","))
    
    print("權限檢查測試:")
    print(f"用戶 ID: {admin_user.id}")
    print(f"用戶 ID 類型: {type(admin_user.id)}")
    print(f"環境變數 ADMIN_EMAILS: {admin_emails}")
    print(f"ADMIN_EMAILS 中的郵箱類型: {[type(email) for email in admin_emails]}")
    print()
    
    # 檢查是否在管理員列表中
    is_in_list = admin_user.id in admin_emails
    print(f"用戶是否在管理員列表中: {is_in_list}")
    
    # 如果不在，逐一比較
    if not is_in_list:
        print("\n詳細比較:")
        for email in admin_emails:
            print(f"  '{admin_user.id}' == '{email}': {admin_user.id == email}")
            print(f"    長度比較: {len(admin_user.id)} vs {len(email)}")
            print(f"    repr比較: {repr(admin_user.id)} vs {repr(email)}")
    
    # 測試環境變數讀取
    print(f"\n原始環境變數: '{os.getenv('ADMIN_EMAILS')}'")
    print(f"分割後: {os.getenv('ADMIN_EMAILS', '').split(',')}")
    print(f"去空白後: {[email.strip() for email in os.getenv('ADMIN_EMAILS', '').split(',')]}")

if __name__ == "__main__":
    test_admin_check()
