#!/usr/bin/env python3
"""
測試修復後的 coopcard 路由行為
"""

import requests

def test_coopcard_routing():
    """測試 coopcard 路由的各種情況"""
    
    print("=" * 60)
    print("🎯 CoopCard 路由修復測試")
    print("=" * 60)
    
    test_cases = [
        {
            "name": "測試 /coopcard (無斜線)",
            "url": "https://soulcraftjournal.studio/coopcard",
            "expected": "應該重定向到登入頁面，而不是首頁"
        },
        {
            "name": "測試 /coopcard/ (有斜線)",
            "url": "https://soulcraftjournal.studio/coopcard/",
            "expected": "應該重定向到登入頁面，而不是首頁"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🔍 {test_case['name']}")
        print("-" * 50)
        print(f"期望結果: {test_case['expected']}")
        
        try:
            # 不跟隨重定向，檢查第一個響應
            response = requests.get(test_case["url"], allow_redirects=False, timeout=10)
            
            print(f"狀態碼: {response.status_code}")
            
            if response.status_code in [301, 302, 307, 308]:
                location = response.headers.get('Location', '')
                print(f"重定向到: {location}")
                
                # 檢查重定向目標
                if location == '/':
                    print("❌ 錯誤：重定向到首頁（問題未解決）")
                elif 'login' in location.lower():
                    print("✅ 正確：重定向到登入頁面")
                elif ',' in location:
                    print("❌ 錯誤：仍有逗號問題")
                else:
                    print(f"⚠️  未知重定向目標: {location}")
            else:
                print(f"⚠️  非重定向狀態碼: {response.status_code}")
                
        except Exception as e:
            print(f"❌ 測試失敗: {e}")
    
    # 總結
    print(f"\n" + "=" * 60)
    print("📋 修復摘要")
    print("=" * 60)
    print("1. ✅ app.py - 添加 app.url_map.strict_slashes = False")
    print("2. ✅ coopcard.py - 添加 strict_slashes=False 參數")
    print("3. ✅ coopcard.py - 修改錯誤處理邏輯")
    print("4. ✅ 模板 - 添加錯誤訊息顯示功能")
    print("\n如果測試仍顯示重定向到首頁，請重新啟動 Flask 應用程式。")

if __name__ == "__main__":
    test_coopcard_routing()