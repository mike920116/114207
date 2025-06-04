# 程式碼撰寫標準

## Python 程式碼規範

### 導入順序
```python
# 1. 標準庫
import os
import sys
from datetime import datetime

# 2. 第三方庫
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

# 3. 本地模組
from utils.db import get_connection
from services.user.user import UserService
```

### 函數設計原則
```python
def create_user(username: str, email: str, password: str) -> dict:
    """
    創建新用戶
    
    Args:
        username: 用戶名稱
        email: 電子信箱
        password: 密碼
        
    Returns:
        dict: 包含用戶信息的字典，如果失敗則包含錯誤信息
        
    Raises:
        ValueError: 當輸入參數無效時
    """
    # 函數實現
```

### 錯誤處理模式
```python
try:
    # 主要邏輯
    result = perform_operation()
    return {"success": True, "data": result}
except SpecificException as e:
    logger.error(f"操作失敗: {e}")
    return {"success": False, "error": str(e)}
except Exception as e:
    logger.error(f"未預期錯誤: {e}")
    return {"success": False, "error": "系統錯誤"}
```

### 類別設計規範
```python
class UserService:
    """用戶服務類，處理所有用戶相關操作"""
    
    def __init__(self):
        self.db = get_connection()
    
    def create_user(self, user_data: dict) -> dict:
        """創建新用戶"""
        pass
    
    def get_user(self, user_id: int) -> dict:
        """獲取用戶信息"""
        pass
```

## Flask 特定規範

### 路由定義
```python
@app.route('/api/users', methods=['GET'])
def get_users():
    """獲取用戶列表"""
    try:
        users = UserService().get_all_users()
        return jsonify({"success": True, "data": users})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
```

### 模板渲染
```python
@app.route('/users')
def users_page():
    """用戶頁面"""
    users = UserService().get_all_users()
    return render_template('user/users.html', users=users)
```

### SocketIO 事件處理
```python
@socketio.on('user_message')
def handle_user_message(data):
    """處理用戶訊息"""
    try:
        # 處理邏輯
        emit('response', {"success": True, "data": response_data})
    except Exception as e:
        emit('error', {"message": str(e)})
```

## 變數命名規範

### Python 變數
- 使用 snake_case：`user_name`, `email_address`
- 常數使用大寫：`MAX_LOGIN_ATTEMPTS`, `DEFAULT_TIMEOUT`
- 私有變數以底線開頭：`_internal_method()`

### 資料庫相關
- 表名：複數形式，snake_case (`users`, `diary_entries`)
- 欄位名：snake_case (`created_at`, `user_id`)
- 外鍵：`[table]_id` 格式 (`user_id`, `diary_id`)

## 註解規範

### 文件字符串
```python
def process_diary_entry(entry_text: str, user_id: int) -> dict:
    """
    處理日記條目
    
    這個函數會驗證日記內容，儲存到資料庫，
    並觸發相關的通知機制。
    
    Args:
        entry_text: 日記內容文字
        user_id: 用戶 ID
        
    Returns:
        dict: 處理結果，包含狀態和日記 ID
        
    Example:
        >>> result = process_diary_entry("今天很開心", 123)
        >>> print(result["success"])
        True
    """
```

### 行內註解
```python
# 驗證用戶權限
if not user.has_permission('diary.create'):
    return {"error": "權限不足"}

# TODO: 增加內容過濾功能
content = sanitize_content(entry_text)
```
