#!/usr/bin/env python3
"""
門診預約系統測試腳本

用於驗證門診預約功能是否正常運作
"""

from app import app
import json

def test_clinic_routes():
    """測試門診預約路由"""
    print("=== 門診預約系統測試 ===\n")
    
    with app.test_client() as client:
        print("1. 測試預約頁面路由...")
        response = client.get('/clinic/appointment')
        if response.status_code in [200, 302]:
            print("   ✅ 預約頁面路由正常")
        else:
            print(f"   ❌ 預約頁面路由錯誤: {response.status_code}")
        
        print("2. 測試預約紀錄頁面路由...")
        response = client.get('/clinic/history')
        if response.status_code in [200, 302]:
            print("   ✅ 預約紀錄頁面路由正常")
        else:
            print(f"   ❌ 預約紀錄頁面路由錯誤: {response.status_code}")
        
        print("3. 測試獲取醫師列表 API...")
        response = client.get('/clinic/api/doctors/hospital1')
        if response.status_code in [200, 302]:
            print("   ✅ 醫師列表 API 正常")
        else:
            print(f"   ❌ 醫師列表 API 錯誤: {response.status_code}")
    
    print("\n=== 檔案結構檢查 ===\n")
    
    import os
    base_path = "."
    
    # 檢查模板檔案
    templates = [
        "templates/clinic/appointment.html",
        "templates/clinic/appointment_history.html"
    ]
    
    for template in templates:
        if os.path.exists(os.path.join(base_path, template)):
            print(f"   ✅ {template}")
        else:
            print(f"   ❌ {template} 不存在")
    
    # 檢查 CSS 檔案
    css_files = [
        "static/css/modules/clinic/appointment.css",
        "static/css/modules/clinic/appointment_history.css"
    ]
    
    for css_file in css_files:
        if os.path.exists(os.path.join(base_path, css_file)):
            print(f"   ✅ {css_file}")
        else:
            print(f"   ❌ {css_file} 不存在")
    
    # 檢查 JS 檔案
    js_files = [
        "static/js/modules/clinic/appointment.js",
        "static/js/modules/clinic/appointment_history.js"
    ]
    
    for js_file in js_files:
        if os.path.exists(os.path.join(base_path, js_file)):
            print(f"   ✅ {js_file}")
        else:
            print(f"   ❌ {js_file} 不存在")
    
    # 檢查 Python 模組
    python_files = [
        "services/clinic/__init__.py",
        "services/clinic/clinic.py"
    ]
    
    for py_file in python_files:
        if os.path.exists(os.path.join(base_path, py_file)):
            print(f"   ✅ {py_file}")
        else:
            print(f"   ❌ {py_file} 不存在")
    
    print("\n=== 路由檢查 ===\n")
    
    clinic_routes = [rule for rule in app.url_map.iter_rules() if 'clinic' in rule.rule]
    print(f"發現 {len(clinic_routes)} 個門診相關路由:")
    for route in clinic_routes:
        print(f"   ✅ {route.rule} -> {route.endpoint}")
    
    print("\n=== 測試完成 ===")
    print("如果所有項目都顯示 ✅，表示門診預約系統已正確設置。")
    print("您可以啟動應用程式並訪問以下 URL：")
    print("- http://localhost:5000/clinic/appointment (預約頁面)")
    print("- http://localhost:5000/clinic/history (預約紀錄)")

if __name__ == "__main__":
    test_clinic_routes()
