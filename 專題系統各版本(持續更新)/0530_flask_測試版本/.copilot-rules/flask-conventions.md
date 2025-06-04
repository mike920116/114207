# Flask 專案約定

## 應用程式結構

### 主應用程式 (app.py)
```python
from flask import Flask
from flask_socketio import SocketIO

# 創建應用程式實例
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'

# 初始化擴展
socketio = SocketIO(app, cors_allowed_origins="*")

# 導入並註冊藍圖
from services.user.user import user_bp
from services.diary.diary import diary_bp
from services.admin.admin import admin_bp

app.register_blueprint(user_bp, url_prefix='/user')
app.register_blueprint(diary_bp, url_prefix='/diary')
app.register_blueprint(admin_bp, url_prefix='/admin')

# 主頁路由
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.run(app, debug=True)
```

### Blueprint 組織
每個服務模組都應該定義自己的 Blueprint：

```python
# services/user/user.py
from flask import Blueprint, render_template, request

user_bp = Blueprint('user', __name__)

@user_bp.route('/login')
def login():
    return render_template('user/login.html')

@user_bp.route('/signup')
def signup():
    return render_template('user/signup.html')
```

## 配置管理

### 環境配置
```python
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    
class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False
    
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

## 模板約定

### 基礎模板 (base.html)
```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}應用程式{% endblock %}</title>
    
    <!-- 基礎樣式 -->
    <link rel="stylesheet" href="{{ url_for('static', filename='css/base.css') }}">
    
    <!-- 模組專用樣式 -->
    {% block styles %}{% endblock %}
</head>
<body>
    <!-- 導航列 -->
    {% include 'components/header.html' %}
    
    <!-- 側邊欄 -->
    {% include 'components/sidebar.html' %}
    
    <!-- 主要內容 -->
    <main>
        {% block content %}{% endblock %}
    </main>
    
    <!-- 頁腳 -->
    {% include 'components/footer.html' %}
    
    <!-- 基礎腳本 -->
    <script src="{{ url_for('static', filename='js/base.js') }}"></script>
    
    <!-- 模組專用腳本 -->
    {% block scripts %}{% endblock %}
</body>
</html>
```

### 模組模板繼承
```html
<!-- templates/diary/diary_form.html -->
{% extends "base.html" %}

{% block title %}寫日記{% endblock %}

{% block styles %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/module/diary/diary_form.css') }}">
{% endblock %}

{% block content %}
<div class="diary-form-container">
    <h1>寫新日記</h1>
    <form id="diary-form">
        <!-- 表單內容 -->
    </form>
</div>
{% endblock %}

{% block scripts %}
<script src="{{ url_for('static', filename='js/module/diary/diary_form.js') }}"></script>
{% endblock %}
```

## SocketIO 約定

### 事件命名規範
```python
# 客戶端到服務端事件：動詞_名詞
'send_message'      # 發送訊息
'create_diary'      # 創建日記
'update_settings'   # 更新設定

# 服務端到客戶端事件：名詞_狀態
'message_received'  # 訊息已接收
'diary_created'     # 日記已創建
'error_occurred'    # 發生錯誤
```

### 事件處理器模式
```python
# services/socketio_setup.py
from flask_socketio import emit

@socketio.on('send_message')
def handle_message(data):
    try:
        # 驗證數據
        if not validate_message_data(data):
            emit('error_occurred', {'message': '數據格式錯誤'})
            return
        
        # 處理業務邏輯
        result = MessageService().process_message(data)
        
        # 回應客戶端
        emit('message_received', {
            'success': True,
            'data': result
        })
        
    except Exception as e:
        emit('error_occurred', {'message': str(e)})
```

## 表單處理約定

### 表單驗證
```python
from wtforms import Form, StringField, TextAreaField, validators

class DiaryForm(Form):
    title = StringField('標題', [
        validators.Length(min=1, max=100, message='標題長度必須在1-100字之間')
    ])
    
    content = TextAreaField('內容', [
        validators.Length(min=1, max=10000, message='內容長度必須在1-10000字之間')
    ])

# 在路由中使用
@diary_bp.route('/create', methods=['POST'])
def create_diary():
    form = DiaryForm(request.form)
    
    if not form.validate():
        return jsonify({
            'success': False,
            'errors': form.errors
        }), 400
    
    # 處理有效數據
    result = DiaryService().create_entry(
        user_id=current_user.id,
        title=form.title.data,
        content=form.content.data
    )
    
    return jsonify(result)
```

## 數據庫約定

### 連接管理
```python
# utils/db.py
import sqlite3
from contextlib import contextmanager

@contextmanager
def get_db_connection():
    """獲取數據庫連接的上下文管理器"""
    conn = None
    try:
        conn = sqlite3.connect('app.db')
        conn.row_factory = sqlite3.Row  # 允許按列名訪問
        yield conn
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

# 使用方式
def get_user_by_id(user_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        return cursor.fetchone()
```

### SQL 查詢約定
```python
# 使用參數化查詢防止 SQL 注入
cursor.execute(
    "SELECT * FROM diaries WHERE user_id = ? AND created_at > ?",
    (user_id, start_date)
)

# 複雜查詢使用多行格式
query = """
    SELECT d.*, u.username 
    FROM diaries d 
    JOIN users u ON d.user_id = u.id 
    WHERE d.created_at BETWEEN ? AND ?
    ORDER BY d.created_at DESC
    LIMIT ?
"""
cursor.execute(query, (start_date, end_date, limit))
```

## 錯誤處理約定

### API 回應格式
```python
# 成功回應
{
    "success": True,
    "data": {...}
}

# 錯誤回應
{
    "success": False,
    "error": "錯誤訊息",
    "code": "ERROR_CODE"  # 可選的錯誤代碼
}

# 驗證錯誤回應
{
    "success": False,
    "errors": {
        "field_name": ["錯誤訊息1", "錯誤訊息2"]
    }
}
```
