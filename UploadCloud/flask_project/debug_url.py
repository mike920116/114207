#!/usr/bin/env python3
"""
調試 URL 生成問題的工具
"""

import requests
import sys

def check_server_logs():
    """檢查伺服器的實際響應"""
    
    print("=" * 70)
    print("🔍 伺服器 Log 檢查工具")
    print("=" * 70)
    
    # 測試從首頁點擊連結的行為
    print("\n📋 模擬從首頁點擊連結：")
    print("-" * 50)
    
    try:
        # 1. 先訪問首頁
        print("1️⃣ 訪問首頁...")
        session = requests.Session()
        
        response = session.get("https://soulcraftjournal.studio/", 
                             allow_redirects=True, timeout=10)
        print(f"首頁狀態: {response.status_code}")
        print(f"首頁 URL: {response.url}")
        
        # 2. 檢查首頁中的 coopcard 連結
        print("\n2️⃣ 檢查首頁中的連結...")
        if response.status_code == 200:
            content = response.text
            
            # 查找 coopcard 相關的連結
            import re
            coopcard_links = re.findall(r'href="([^"]*coopcard[^"]*)"', content, re.IGNORECASE)
            
            if coopcard_links:
                print("找到的 coopcard 連結：")
                for i, link in enumerate(coopcard_links, 1):
                    print(f"  {i}. {link}")
                    
                    # 檢查是否有逗號
                    if ',' in link:
                        print(f"     ❌ 連結 {i} 包含逗號！")
                    else:
                        print(f"     ✅ 連結 {i} 正常")
            else:
                print("❌ 沒有找到 coopcard 連結")
        
        # 3. 測試實際點擊行為
        print("\n3️⃣ 模擬點擊 coopcard 連結...")
        
        # 使用 referer 來模擬從首頁點擊
        headers = {
            'Referer': 'https://soulcraftjournal.studio/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
        }
        
        coopcard_response = session.get("https://soulcraftjournal.studio/coopcard/",
                                      headers=headers,
                                      allow_redirects=False, 
                                      timeout=10)
        
        print(f"Coopcard 響應狀態: {coopcard_response.status_code}")
        
        if 'Location' in coopcard_response.headers:
            location = coopcard_response.headers['Location']
            print(f"重定向到: {location}")
            
            if ',' in location:
                print("❌ 重定向 URL 包含逗號！")
            else:
                print("✅ 重定向 URL 正常")
        
        # 4. 檢查所有相關的標頭
        print(f"\n4️⃣ 響應標頭：")
        for key, value in coopcard_response.headers.items():
            if key.lower() in ['location', 'server', 'set-cookie']:
                print(f"  {key}: {value}")
                
    except Exception as e:
        print(f"❌ 錯誤: {e}")

def test_direct_flask_url():
    """測試 Flask url_for 生成的 URL"""
    print("\n" + "=" * 70)
    print("🧪 Flask URL 生成測試")
    print("=" * 70)
    
    # 這部分需要在伺服器上運行
    flask_test_code = '''
import sys
sys.path.append("/path/to/your/flask/project")

from flask import url_for
from app import app

with app.test_request_context():
    try:
        coopcard_url = url_for('coopcard.coopcard_main')
        print(f"Generated URL: {coopcard_url}")
        
        if ',' in coopcard_url:
            print("❌ Flask url_for 生成的 URL 包含逗號！")
        else:
            print("✅ Flask url_for 生成的 URL 正常")
            
    except Exception as e:
        print(f"❌ url_for 錯誤: {e}")
'''
    
    print("請在伺服器上執行以下 Python 代碼來測試 Flask URL 生成：")
    print("-" * 50)
    print(flask_test_code)

if __name__ == "__main__":
    check_server_logs()
    test_direct_flask_url()