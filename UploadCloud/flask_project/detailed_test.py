#!/usr/bin/env python3
"""
詳細測試 Flask 路由重定向問題
"""

import requests
import sys

def detailed_test():
    """詳細測試重定向行為"""
    
    urls_to_test = [
        "http://soulcraftjournal.studio/coopcard",      # HTTP 無尾部斜線
        "https://soulcraftjournal.studio/coopcard",     # HTTPS 無尾部斜線  
        "https://soulcraftjournal.studio/coopcard/",    # HTTPS 有尾部斜線
    ]
    
    print("=" * 70)
    print("詳細重定向測試")
    print("=" * 70)
    
    for url in urls_to_test:
        print(f"\n🔍 測試 URL: {url}")
        print("-" * 50)
        
        try:
            # 跟蹤完整的重定向鏈
            response = requests.head(url, allow_redirects=True, timeout=10)
            
            print(f"最終狀態碼: {response.status_code}")
            print(f"最終 URL: {response.url}")
            
            if response.history:
                print(f"重定向鏈 ({len(response.history)} 步驟):")
                for i, hist_response in enumerate(response.history, 1):
                    location = hist_response.headers.get('Location', 'N/A')
                    print(f"  {i}. {hist_response.status_code} → {location}")
                    
                    # 檢查是否包含逗號
                    if ',' in location:
                        print(f"     ❌ 發現逗號問題在步驟 {i}！")
            else:
                print("沒有重定向")
                
            # 檢查最終 URL 是否有逗號
            if ',' in response.url:
                print(f"❌ 最終 URL 包含逗號: {response.url}")
            else:
                print("✅ 最終 URL 正常")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 請求失敗: {e}")

def test_without_redirects():
    """測試不跟蹤重定向的原始響應"""
    
    print("\n" + "=" * 70)
    print("原始響應測試（不跟蹤重定向）")
    print("=" * 70)
    
    urls = [
        "https://soulcraftjournal.studio/coopcard",
        "https://soulcraftjournal.studio/coopcard/", 
    ]
    
    for url in urls:
        print(f"\n🎯 測試 {url}")
        try:
            response = requests.head(url, allow_redirects=False, timeout=5)
            print(f"狀態碼: {response.status_code}")
            
            if 'Location' in response.headers:
                location = response.headers['Location']
                print(f"Location: {location}")
                
                if ',' in location:
                    print("❌ 發現逗號問題！")
                else:
                    print("✅ 重定向正常")
            else:
                print("✅ 沒有重定向")
                
        except Exception as e:
            print(f"❌ 錯誤: {e}")

if __name__ == "__main__":
    detailed_test()
    test_without_redirects()