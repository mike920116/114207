#!/usr/bin/env python3
"""
最終驗證：檢查生產伺服器是否已修復逗號問題
"""

import requests
import time

def final_verification():
    """最終驗證修復效果"""
    
    print("=" * 60)
    print("🏁 最終修復驗證")
    print("=" * 60)
    
    test_urls = [
        "https://soulcraftjournal.studio/coopcard",
        "https://soulcraftjournal.studio/coopcard/",
    ]
    
    for i, url in enumerate(test_urls, 1):
        print(f"\n🔍 測試 {i}: {url}")
        print("-" * 50)
        
        try:
            # 不跟隨重定向，檢查第一個響應
            response = requests.head(url, allow_redirects=False, timeout=10)
            
            print(f"狀態碼: {response.status_code}")
            
            if response.status_code in [301, 302, 307, 308]:
                location = response.headers.get('Location', '')
                print(f"重定向到: {location}")
                
                if ',' in location:
                    print("❌ 仍然有逗號問題！需要重新部署")
                    print("建議：")
                    print("  1. 重新啟動 Flask 應用程式")
                    print("  2. 重新載入 nginx/Apache 配置")
                    print("  3. 清除所有快取")
                else:
                    print("✅ 重定向正常")
            else:
                print("✅ 沒有重定向（可能需要登入）")
                
        except Exception as e:
            print(f"❌ 測試失敗: {e}")
    
    # 檢查修改摘要
    print(f"\n" + "=" * 60)
    print("🔧 已實施的修復")
    print("=" * 60)
    print("1. ✅ app.py - 添加 app.url_map.strict_slashes = False")
    print("2. ✅ coopcard.py - 添加 strict_slashes=False 參數")
    print("3. ✅ ProxyFix - x_host=0 避免域名重複")
    print()
    print("📋 部署檢查清單：")
    print("□ 重新啟動 Flask 應用程式")
    print("□ 重新載入反向代理配置")
    print("□ 清除瀏覽器快取")
    print("□ 測試所有相關連結")

if __name__ == "__main__":
    final_verification()