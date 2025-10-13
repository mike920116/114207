#!/usr/bin/env python3
"""
檢查 Flask 路由註冊的腳本
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 設定環境變數（模擬）
os.environ.setdefault("SECRET_KEY", "test_key")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_USER", "root") 
os.environ.setdefault("DB_PASSWORD", "password")
os.environ.setdefault("DB_NAME", "test_db")

try:
    from app import app
    
    print("=" * 60)
    print("Flask 路由註冊檢查")
    print("=" * 60)
    
    print("\n📋 所有註冊的路由：")
    print("-" * 40)
    
    for rule in app.url_map.iter_rules():
        print(f"{rule.methods} {rule.rule} → {rule.endpoint}")
        
        # 特別關注 coopcard 相關的路由
        if 'coopcard' in rule.rule.lower() or 'coopcard' in rule.endpoint.lower():
            print(f"  🎯 Coopcard 路由: {rule.rule}")
    
    print(f"\n📊 總共 {len(list(app.url_map.iter_rules()))} 個路由")
    
    # 檢查 coopcard Blueprint
    print("\n🔍 Coopcard Blueprint 檢查：")
    print("-" * 40)
    
    coopcard_routes = [rule for rule in app.url_map.iter_rules() 
                      if 'coopcard' in rule.endpoint.lower()]
    
    if coopcard_routes:
        print(f"找到 {len(coopcard_routes)} 個 coopcard 路由：")
        for route in coopcard_routes:
            print(f"  • {route.rule} → {route.endpoint}")
    else:
        print("❌ 沒有找到 coopcard 路由！")
        
except Exception as e:
    print(f"❌ 錯誤: {e}")
    print(f"錯誤類型: {type(e).__name__}")
    import traceback
    print(f"詳細追蹤: {traceback.format_exc()}")