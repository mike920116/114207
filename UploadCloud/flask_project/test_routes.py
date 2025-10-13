#!/usr/bin/env python3
"""
測試 Flask 路由重定向的腳本
"""

import requests
import sys

def test_route(url):
    """測試指定 URL 的重定向行為"""
    print(f"\n🔍 測試 URL: {url}")
    
    try:
        # 使用 allow_redirects=False 來查看原始響應
        response = requests.head(url, allow_redirects=False, timeout=5)
        
        print(f"狀態碼: {response.status_code}")
        print(f"標頭: {dict(response.headers)}")
        
        if 'Location' in response.headers:
            location = response.headers['Location']
            print(f"🎯 重定向到: {location}")
            
            # 檢查是否包含逗號
            if ',' in location:
                print("❌ 發現逗號問題！")
                return False
            else:
                print("✅ 重定向 URL 正常")
                return True
        else:
            print("✅ 沒有重定向")
            return True
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 請求失敗: {e}")
        return False

def main():
    """主測試函數"""
    print("=" * 50)
    print("Flask 路由重定向測試")
    print("=" * 50)
    
    test_urls = [
        "http://127.0.0.1:5000/coopcard",      # 無尾部斜線
        "http://127.0.0.1:5000/coopcard/",     # 有尾部斜線
        "https://soulcraftjournal.studio/coopcard",   # 生產環境測試
        "https://soulcraftjournal.studio/coopcard/",
    ]
    
    results = []
    for url in test_urls:
        result = test_route(url)
        results.append((url, result))
    
    print("\n" + "=" * 50)
    print("測試結果總結:")
    print("=" * 50)
    
    for url, success in results:
        status = "✅ 通過" if success else "❌ 失敗"
        print(f"{status} - {url}")

if __name__ == "__main__":
    main()