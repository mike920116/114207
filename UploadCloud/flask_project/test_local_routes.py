#!/usr/bin/env python3
"""
測試本地 Flask 應用是否修復了斜線重定向問題
"""

import os
import sys

# 添加項目根目錄到 Python 路徑
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from app import app

def test_local_routes():
    """測試本地 Flask 應用的路由行為"""
    
    print("=" * 60)
    print("🧪 本地 Flask 路由測試")
    print("=" * 60)
    
    with app.test_client() as client:
        
        # 測試 1: 直接訪問 /coopcard（無結尾斜線）
        print("\n🔍 測試 1: GET /coopcard")
        print("-" * 40)
        
        response = client.get('/coopcard', follow_redirects=False)
        
        print(f"狀態碼: {response.status_code}")
        print(f"響應頭: {dict(response.headers)}")
        
        if response.status_code in [301, 302, 307, 308]:
            location = response.headers.get('Location', '')
            print(f"重定向到: {location}")
            
            if ',' in location:
                print("❌ 本地應用仍有逗號問題！")
            else:
                print("✅ 本地重定向正常")
        else:
            print("✅ 沒有重定向")
            
        # 測試 2: 直接訪問 /coopcard/（有結尾斜線）
        print("\n🔍 測試 2: GET /coopcard/")
        print("-" * 40)
        
        response = client.get('/coopcard/', follow_redirects=False)
        
        print(f"狀態碼: {response.status_code}")
        
        if response.status_code in [301, 302, 307, 308]:
            location = response.headers.get('Location', '')
            print(f"重定向到: {location}")
            
            if ',' in location:
                print("❌ 本地應用仍有逗號問題！")
            else:
                print("✅ 本地重定向正常")
        else:
            print("✅ 沒有重定向")
            
        # 測試 3: 檢查 URL 映射
        print("\n🔍 測試 3: 路由映射檢查")
        print("-" * 40)
        
        print(f"strict_slashes 設定: {app.url_map.strict_slashes}")
        
        # 列出所有相關路由
        relevant_routes = []
        for rule in app.url_map.iter_rules():
            if 'coopcard' in rule.rule:
                relevant_routes.append((rule.rule, rule.endpoint, rule.strict_slashes))
        
        if relevant_routes:
            print("找到的 coopcard 相關路由:")
            for rule, endpoint, strict in relevant_routes:
                print(f"  - {rule} → {endpoint} (strict_slashes={strict})")
        else:
            print("❌ 沒有找到 coopcard 路由！")

def check_app_configuration():
    """檢查應用程式配置"""
    
    print("\n" + "=" * 60)
    print("⚙️  Flask 應用配置檢查")
    print("=" * 60)
    
    print(f"Flask 版本: {app.config.get('VERSION', '未設置')}")
    print(f"Debug 模式: {app.debug}")
    print(f"URL Map strict_slashes: {app.url_map.strict_slashes}")
    print(f"已註冊的 Blueprint:")
    
    for bp_name, bp in app.blueprints.items():
        print(f"  - {bp_name}: {bp.url_prefix}")

if __name__ == "__main__":
    test_local_routes()
    check_app_configuration()