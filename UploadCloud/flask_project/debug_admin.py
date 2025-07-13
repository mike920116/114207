#!/usr/bin/env python3
"""
管理員權限調試工具
檢查用戶表中的管理員用戶，以及權限配置
"""

import os
import sys
from dotenv import load_dotenv

# 添加項目根目錄到 Python 路徑
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.db import get_connection

def main():
    # 載入環境變數
    load_dotenv()
    
    # 獲取管理員郵箱列表
    admin_emails = set(email.strip() for email in os.getenv("ADMIN_EMAILS", "").split(","))
    print(f"環境變數 ADMIN_EMAILS: {admin_emails}")
    print()
    
    try:
        # 連接數據庫
        conn = get_connection()
        cursor = conn.cursor()
        
        # 查詢所有用戶
        cursor.execute("SELECT User_Email, User_name, Created_at FROM User ORDER BY Created_at DESC")
        users = cursor.fetchall()
        
        print("數據庫中的所有用戶:")
        print("-" * 80)
        for user in users:
            email, name, created_at = user
            is_admin = email in admin_emails
            status = "★ 管理員" if is_admin else "一般用戶"
            print(f"{status:<10} | {email:<30} | {name:<20} | {created_at}")
        
        print(f"\n總共 {len(users)} 個用戶")
        
        # 檢查管理員用戶是否存在
        admin_found = []
        for email in admin_emails:
            cursor.execute("SELECT User_Email, User_name FROM User WHERE User_Email = %s", (email,))
            result = cursor.fetchone()
            if result:
                admin_found.append(result)
            else:
                print(f"⚠️  管理員 {email} 不存在於數據庫中")
        
        if admin_found:
            print(f"\n✅ 找到 {len(admin_found)} 個管理員用戶:")
            for admin in admin_found:
                print(f"   - {admin[0]} ({admin[1]})")
        else:
            print("\n❌ 沒有找到任何管理員用戶！")
            
    except Exception as e:
        print(f"數據庫錯誤: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
