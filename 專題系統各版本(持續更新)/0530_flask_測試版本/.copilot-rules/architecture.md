# 系統架構原則

## 整體架構模式

### 模組化架構
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端層        │    │   業務邏輯層     │    │   數據層        │
│  (Templates)    │◄──►│   (Services)    │◄──►│   (Database)    │
│  - HTML/CSS/JS  │    │  - User Service │    │  - SQLite/MySQL │
│  - SocketIO     │    │  - Diary Service│    │  - 文件系統     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 服務導向設計
每個功能模組都應該：
1. **獨立性**：模組間低耦合，高內聚
2. **可測試性**：每個服務都可以獨立測試
3. **可擴展性**：新功能可以輕鬆添加
4. **可維護性**：清晰的職責分離

## 設計模式應用

### Service Layer 模式
```python
# 每個功能都有對應的服務類
class DiaryService:
    def create_entry(self, user_id, content):
        # 業務邏輯處理
        pass
    
    def get_entries(self, user_id, filters=None):
        # 查詢邏輯
        pass

class UserService:
    def authenticate(self, username, password):
        # 認證邏輯
        pass
    
    def create_user(self, user_data):
        # 用戶創建邏輯
        pass
```

### Repository 模式（建議）
```python
class DiaryRepository:
    """處理日記數據的持久化操作"""
    
    def save(self, diary_entry):
        # 保存日記
        pass
    
    def find_by_user(self, user_id):
        # 查找用戶日記
        pass

class DiaryService:
    def __init__(self):
        self.repository = DiaryRepository()
    
    def create_entry(self, user_id, content):
        # 使用 repository 進行數據操作
        pass
```

## 通信架構

### SocketIO 事件架構
```
客戶端                服務端
   │                    │
   ├── user_message ────┤
   │                    ├── 驗證用戶
   │                    ├── 處理訊息
   │                    ├── 儲存數據
   │                    │
   ├──── response ◄─────┤
   │                    │
   ├── admin_action ────┤
   │                    ├── 檢查權限
   │                    ├── 執行操作
   │                    │
   ├──── broadcast ◄────┤ (廣播給所有用戶)
```

### RESTful API 設計
```
GET    /api/users          # 獲取用戶列表
POST   /api/users          # 創建新用戶
GET    /api/users/{id}     # 獲取特定用戶
PUT    /api/users/{id}     # 更新用戶
DELETE /api/users/{id}     # 刪除用戶

GET    /api/diaries        # 獲取日記列表
POST   /api/diaries        # 創建新日記
GET    /api/diaries/{id}   # 獲取特定日記
PUT    /api/diaries/{id}   # 更新日記
DELETE /api/diaries/{id}   # 刪除日記
```

## 錯誤處理架構

### 統一錯誤處理
```python
class AppError(Exception):
    """應用程式基礎錯誤類"""
    def __init__(self, message, code=500):
        self.message = message
        self.code = code

class ValidationError(AppError):
    """驗證錯誤"""
    def __init__(self, message):
        super().__init__(message, 400)

class AuthenticationError(AppError):
    """認證錯誤"""
    def __init__(self, message):
        super().__init__(message, 401)

# 全域錯誤處理器
@app.errorhandler(AppError)
def handle_app_error(error):
    return jsonify({
        "success": False,
        "error": error.message
    }), error.code
```

### 日誌架構
```python
import logging

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# 在服務中使用
class UserService:
    def create_user(self, user_data):
        try:
            logger.info(f"創建用戶: {user_data.get('username')}")
            # 創建邏輯
            logger.info("用戶創建成功")
        except Exception as e:
            logger.error(f"用戶創建失敗: {e}")
            raise
```

## 安全架構原則

### 認證與授權
```python
from functools import wraps

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 檢查用戶認證
        if not current_user.is_authenticated:
            return redirect('/login')
        return f(*args, **kwargs)
    return decorated_function

def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 檢查管理員權限
        if not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)
    return decorated_function
```

### 輸入驗證
```python
def validate_diary_content(content):
    """驗證日記內容"""
    if not content or len(content.strip()) == 0:
        raise ValidationError("日記內容不能為空")
    
    if len(content) > 10000:
        raise ValidationError("日記內容太長")
    
    # 過濾危險字符
    return sanitize_html(content)
```

## 性能考量

### 數據庫優化
- 適當使用索引
- 避免 N+1 查詢問題
- 實施數據庫連接池
- 考慮緩存策略

### 前端優化
- CSS/JS 文件壓縮
- 圖片優化
- 懶加載實施
- SocketIO 連接管理
