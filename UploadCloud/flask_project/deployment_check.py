#!/usr/bin/env python3
"""
檢查部署狀態的腳本
"""

import requests

def check_deployment_status():
    """檢查部署是否生效"""
    
    print("=" * 60)
    print("🚀 部署狀態檢查")
    print("=" * 60)
    
    # 檢查特定的修改是否生效
    test_urls = [
        "https://soulcraftjournal.studio/",
        "https://soulcraftjournal.studio/coopcard",
        "https://soulcraftjournal.studio/coopcard/",
    ]
    
    for url in test_urls:
        print(f"\n🔍 測試: {url}")
        print("-" * 40)
        
        try:
            response = requests.head(url, allow_redirects=False, timeout=5)
            
            print(f"狀態碼: {response.status_code}")
            
            # 檢查伺服器時間戳記（可以判斷是否有更新）
            if 'Date' in response.headers:
                print(f"伺服器時間: {response.headers['Date']}")
            
            if 'Location' in response.headers:
                location = response.headers['Location']
                print(f"重定向到: {location}")
                
                if ',' in location:
                    print("❌ 仍然有逗號問題！")
                else:
                    print("✅ 重定向正常")
            else:
                print("沒有重定向")
                
        except Exception as e:
            print(f"❌ 錯誤: {e}")

def check_html_source():
    """檢查 HTML 原始碼中的連結"""
    
    print("\n" + "=" * 60)
    print("📄 HTML 原始碼檢查")
    print("=" * 60)
    
    try:
        response = requests.get("https://soulcraftjournal.studio/", timeout=10)
        
        if response.status_code == 200:
            html_content = response.text
            
            # 查找 coopcard 相關的所有連結
            import re
            
            # 查找所有包含 coopcard 的 href 屬性
            coopcard_patterns = [
                r'href="([^"]*coopcard[^"]*)"',
                r"href='([^']*coopcard[^']*)'",
                r'url_for\([^)]*coopcard[^)]*\)',
            ]
            
            found_issues = False
            
            for i, pattern in enumerate(coopcard_patterns, 1):
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                
                if matches:
                    print(f"\n🎯 模式 {i} 找到的連結:")
                    for j, match in enumerate(matches, 1):
                        print(f"  {j}. {match}")
                        
                        if ',' in match:
                            print(f"     ❌ 連結 {j} 包含逗號！")
                            found_issues = True
                        else:
                            print(f"     ✅ 連結 {j} 正常")
            
            if not found_issues:
                print("✅ HTML 中沒有發現逗號問題")
            else:
                print("❌ HTML 中發現逗號問題！")
                
        else:
            print(f"❌ 無法獲取首頁，狀態碼: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 檢查 HTML 時發生錯誤: {e}")

if __name__ == "__main__":
    check_deployment_status()
    check_html_source()