#!/usr/bin/env python3
"""
簡化版本：只測試 Flask 路由配置，不需要資料庫連線
"""

import os
from flask import Flask

# 建立簡化的 Flask 應用來測試路由
app = Flask(__name__)
app.secret_key = "test_key"

# 應用相同的修復配置
app.url_map.strict_slashes = False

from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_for=1,
    x_proto=1,
    x_host=0
)

# 建立簡化的測試 Blueprint
from flask import Blueprint

test_bp = Blueprint("coopcard", __name__)

@test_bp.route('/', strict_slashes=False)
def coopcard_main():
    return "Coopcard Main"

# 註冊 Blueprint
app.register_blueprint(test_bp, url_prefix="/coopcard")

def test_route_behavior():
    """測試路由行為"""
    
    print("=" * 60)
    print("🧪 路由配置測試")
    print("=" * 60)
    
    print(f"全域 strict_slashes: {app.url_map.strict_slashes}")
    
    # 檢查路由映射
    print("\n🔍 路由映射:")
    print("-" * 40)
    
    for rule in app.url_map.iter_rules():
        if 'coopcard' in rule.rule:
            print(f"路由: {rule.rule}")
            print(f"  端點: {rule.endpoint}")
            print(f"  strict_slashes: {rule.strict_slashes}")
            print(f"  方法: {rule.methods}")
            print()
    
    # 使用 test_client 測試重定向行為
    print("\n🔍 路由測試:")
    print("-" * 40)
    
    with app.test_client() as client:
        
        # 測試 /coopcard (無斜線)
        print("測試 GET /coopcard")
        response = client.get('/coopcard', follow_redirects=False)
        print(f"  狀態碼: {response.status_code}")
        
        if 'Location' in response.headers:
            location = response.headers['Location']
            print(f"  重定向到: {location}")
            
            if ',' in location:
                print("  ❌ 發現逗號問題!")
            else:
                print("  ✅ 重定向正常")
        else:
            print("  ✅ 沒有重定向")
            
        print()
        
        # 測試 /coopcard/ (有斜線)
        print("測試 GET /coopcard/")
        response = client.get('/coopcard/', follow_redirects=False)
        print(f"  狀態碼: {response.status_code}")
        
        if 'Location' in response.headers:
            location = response.headers['Location']
            print(f"  重定向到: {location}")
            
            if ',' in location:
                print("  ❌ 發現逗號問題!")
            else:
                print("  ✅ 重定向正常")
        else:
            print("  ✅ 沒有重定向")

if __name__ == "__main__":
    test_route_behavior()