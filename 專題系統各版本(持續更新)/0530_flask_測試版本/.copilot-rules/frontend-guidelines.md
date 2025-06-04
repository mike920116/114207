# 前端開發指南

## CSS 組織架構

### 基礎樣式 (base.css)
```css
/* 重置和基礎樣式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Microsoft YaHei', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

/* 工具類 */
.text-center { text-align: center; }
.text-right { text-align: right; }
.hidden { display: none; }
.visible { display: block; }

/* 按鈕基礎樣式 */
.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-primary:hover {
    background-color: #0056b3;
}
```

### 模組樣式約定
每個模組的 CSS 應該：
1. 使用模組名稱作為前綴
2. 遵循 BEM 命名法則
3. 避免全域樣式污染

```css
/* diary_form.css */
.diary-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.diary-form__title {
    font-size: 24px;
    margin-bottom: 20px;
    color: #2c3e50;
}

.diary-form__field {
    margin-bottom: 15px;
}

.diary-form__label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.diary-form__input,
.diary-form__textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.diary-form__button {
    background-color: #28a745;
    color: white;
    padding: 12px 30px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.diary-form__button:hover {
    background-color: #218838;
}
```

## JavaScript 組織架構

### 基礎腳本 (base.js)
```javascript
// 全域工具函數
window.AppUtils = {
    // API 請求封裝
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || '請求失敗');
            }
            
            return data;
        } catch (error) {
            console.error('API 請求錯誤:', error);
            throw error;
        }
    },
    
    // 顯示通知
    showNotification(message, type = 'info') {
        // 實作通知顯示邏輯
        console.log(`${type.toUpperCase()}: ${message}`);
    },
    
    // 表單驗證
    validateForm(formElement) {
        const errors = [];
        const inputs = formElement.querySelectorAll('input[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                errors.push(`${input.name} 為必填欄位`);
            }
        });
        
        return errors;
    }
};

// SocketIO 基礎設定
if (typeof io !== 'undefined') {
    window.socket = io();
    
    socket.on('connect', function() {
        console.log('已連接到伺服器');
    });
    
    socket.on('disconnect', function() {
        console.log('與伺服器斷開連接');
    });
    
    socket.on('error_occurred', function(data) {
        AppUtils.showNotification(data.message, 'error');
    });
}
```

### 模組腳本模式
```javascript
// diary_form.js
(function() {
    'use strict';
    
    class DiaryForm {
        constructor() {
            this.form = document.getElementById('diary-form');
            this.titleInput = document.getElementById('title');
            this.contentTextarea = document.getElementById('content');
            
            this.init();
        }
        
        init() {
            if (!this.form) return;
            
            this.bindEvents();
            this.setupSocketIO();
        }
        
        bindEvents() {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
            
            // 自動儲存功能
            this.contentTextarea.addEventListener('input', 
                this.debounce(() => this.autoSave(), 2000)
            );
        }
        
        setupSocketIO() {
            if (typeof socket !== 'undefined') {
                socket.on('diary_created', (data) => {
                    AppUtils.showNotification('日記已成功保存', 'success');
                    this.resetForm();
                });
            }
        }
        
        async handleSubmit() {
            try {
                // 驗證表單
                const errors = AppUtils.validateForm(this.form);
                if (errors.length > 0) {
                    AppUtils.showNotification(errors.join(', '), 'error');
                    return;
                }
                
                // 準備數據
                const formData = {
                    title: this.titleInput.value.trim(),
                    content: this.contentTextarea.value.trim()
                };
                
                // 發送到伺服器
                if (typeof socket !== 'undefined') {
                    socket.emit('create_diary', formData);
                } else {
                    const result = await AppUtils.request('/api/diaries', {
                        method: 'POST',
                        body: JSON.stringify(formData)
                    });
                    
                    AppUtils.showNotification('日記已成功保存', 'success');
                    this.resetForm();
                }
                
            } catch (error) {
                AppUtils.showNotification(error.message, 'error');
            }
        }
        
        autoSave() {
            const content = this.contentTextarea.value.trim();
            if (content.length > 10) {
                localStorage.setItem('diary_draft', content);
            }
        }
        
        resetForm() {
            this.form.reset();
            localStorage.removeItem('diary_draft');
        }
        
        // 工具函數
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    }
    
    // 頁面載入完成後初始化
    document.addEventListener('DOMContentLoaded', () => {
        new DiaryForm();
    });
})();
```

## HTML 模板約定

### 表單結構
```html
<form id="diary-form" class="diary-form">
    <div class="diary-form__field">
        <label for="title" class="diary-form__label">標題</label>
        <input 
            type="text" 
            id="title" 
            name="title" 
            class="diary-form__input" 
            required
            maxlength="100"
        >
    </div>
    
    <div class="diary-form__field">
        <label for="content" class="diary-form__label">內容</label>
        <textarea 
            id="content" 
            name="content" 
            class="diary-form__textarea" 
            rows="10" 
            required
            maxlength="10000"
        ></textarea>
    </div>
    
    <div class="diary-form__actions">
        <button type="submit" class="diary-form__button btn btn-primary">
            保存日記
        </button>
    </div>
</form>
```

### 列表結構
```html
<div class="diary-list">
    <div class="diary-list__header">
        <h2 class="diary-list__title">我的日記</h2>
        <a href="/diary/create" class="btn btn-primary">寫新日記</a>
    </div>
    
    <div class="diary-list__items" id="diary-items">
        <!-- 動態載入的日記項目 -->
    </div>
    
    <div class="diary-list__pagination" id="pagination">
        <!-- 分頁控制 -->
    </div>
</div>

<!-- 日記項目模板 -->
<template id="diary-item-template">
    <div class="diary-item" data-diary-id="">
        <div class="diary-item__header">
            <h3 class="diary-item__title"></h3>
            <span class="diary-item__date"></span>
        </div>
        <div class="diary-item__content"></div>
        <div class="diary-item__actions">
            <button class="btn btn-sm btn-outline-primary edit-btn">編輯</button>
            <button class="btn btn-sm btn-outline-danger delete-btn">刪除</button>
        </div>
    </div>
</template>
```

## 響應式設計約定

### 中斷點定義
```css
/* 手機 */
@media (max-width: 767px) {
    .diary-form {
        padding: 10px;
    }
    
    .diary-form__button {
        width: 100%;
    }
}

/* 平板 */
@media (min-width: 768px) and (max-width: 1023px) {
    .diary-form {
        padding: 20px;
    }
}

/* 桌面 */
@media (min-width: 1024px) {
    .diary-form {
        max-width: 800px;
        margin: 0 auto;
    }
}
```

## 性能優化約定

### 圖片優化
```html
<!-- 使用適當的圖片格式和尺寸 -->
<img 
    src="/static/images/avatar-small.webp" 
    alt="用戶頭像"
    loading="lazy"
    width="50" 
    height="50"
>
```

### CSS/JS 載入優化
```html
<!-- 關鍵 CSS 內聯 -->
<style>
    /* 首屏關鍵樣式 */
</style>

<!-- 非關鍵 CSS 延遲載入 -->
<link rel="preload" href="/static/css/module/diary/diary_form.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

<!-- JavaScript 異步載入 -->
<script src="/static/js/module/diary/diary_form.js" async></script>
```
