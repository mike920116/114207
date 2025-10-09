# 專案 README

## 1. 專案概覽

### 核心技術
*   Python
*   Flask (Web 框架)
*   Jinja2 (模板引擎)
*   HTML, CSS, JavaScript (前端)
*   Flask-SocketIO (即時通訊)

### 主要功能
*   **使用者模組 (`services/user/`)**:
    *   使用者註冊、登入、登出
    *   密碼重設
    *   使用者個人資料設定
*   **日記模組 (`services/diary/`)**:
    *   使用者日記撰寫、查看、管理
*   **AI 互動模組 (`services/ai/`)**:
    *   AI 聊天機器人
*   **好友互動模組 (`services/coopcard/`)**:
    *   好友搜尋與請求管理
    *   協作任務卡片系統
    *   好友互動小視窗（三標籤系統）
*   **管理員後台模組 (`services/admin/`)**:
    *   使用者管理
    *   日記內容管理
    *   客服即時聊天
*   **即時通訊 (`services/socketio_manager.py`)**:
    *   支援客服聊天與 AI 聊天



### 架構特色
*   **模組化設計**: 使用 Flask Blueprints 將不同功能模組化 (例如 `user`, `diary`, `admin`, `ai`)，提高程式碼的可維護性和擴展性。
*   **分層架構**: 清晰劃分表現層 (`templates/`)、業務邏輯層 (`services/`)、靜態資源 (`static/`) 和工具函式 (`utils/`)。
*   **資料庫連線池**: 可能使用如 `dbutils.pooled_db` (於 `utils/db.py` 中配置) 管理資料庫連線，提升效能和資源利用率。
*   **即時互動**: 透過 Flask-SocketIO 實現即時通訊功能。



## 2. 目錄結構

本專案的建議目錄結構如下：

```
.
├── app.py                      # Flask 應用程式主檔案、進入點
├── requirements.txt            # 專案依賴的 Python 套件列表
├── readme.txt                  # (本檔案) 專案說明文件
├── explain.md                  # 更詳細的專案設計理念或開發者筆記
├── services/                   # 核心業務邏輯模組
│   ├── __init__.py
│   ├── socketio_manager.py       # Flask-SocketIO 設定
│   ├── admin/                  # 管理員後台功能
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   └── admin_chat.py
│   ├── ai/                     # AI 互動功能
│   │   ├── __init__.py
│   │   └── ai_chat.py
│   ├── diary/                  # 使用者日記功能
│   │   ├── __init__.py
│   │   └── diary.py
│   └── user/                   # 使用者帳號及設定功能
│       ├── __init__.py
│       ├── user.py
│       └── settings.py
├── static/                     # 靜態檔案 (CSS, JavaScript, 圖片等)
│   ├── css/
│   │   ├── base.css            # 全站通用基礎樣式
│   │   └── modules/             # 各功能模組的專屬樣式
│   │       ├── admin/admin.css
│   │       ├── ai/ai_chat.css
│   │       ├── diary/diary_form.css, diary_list.css
│   │       └── user/settings.css, user.css
│   └── js/
│       ├── base.js             # 全站通用基礎客戶端腳本
│       └── modules/             # 各功能模組的專屬客戶端腳本
│           ├── admin/admin.js
│           ├── ai/ai_chat.js
│           ├── diary/diary_form.js, diary_list.js
│           └── user/settings.js, user.js
├── templates/                  # Jinja2 模板檔案
│   ├── base.html               # 所有頁面的基礎佈局模板
│   ├── index.html              # 網站首頁模板
│   ├── admin/                  # 管理員後台相關頁面模板
│   │   ├── layout.html
│   │   ├── dashboard.html
│   │   ├── users.html
│   │   ├── diaries.html
│   │   └── chat_panel.html
│   ├── ai/                     # AI 功能相關頁面模板
│   │   └── ai_chat.html
│   ├── components/             # 可重複使用的模板片段
│   │   ├── header.html
│   │   ├── footer.html
│   │   └── sidebar.html
│   ├── diary/                  # 日記功能相關頁面模板
│   │   ├── diary_list.html
│   │   └── diary_form.html
│   ├── settings/               # 使用者設定相關頁面模板
│   │   ├── profile.html
│   │   └── acc_settings.html
│   └── user/                   # 使用者驗證流程頁面模板
│       ├── login.html
│       ├── signup.html
│       ├── login_form.html
│       ├── signup_form.html
│       ├── forgot_form.html
│       ├── reset_form.html
│       ├── verify_success.html
│       ├── verify_failed.html
│       └── reset_success.html
└── utils/                      # 共用工具函式、類別或設定
    ├── __init__.py
    └── db.py                   # 資料庫連線設定與管理
```



## 3. 環境變數設定

請參考以下設定，並根據您的實際環境修改。建議將敏感資訊（如 API 金鑰、密碼）儲存在作業系統的環境變數中，而非直接寫在此文件中。

```
# Flask 應用程式設定
FLASK_APP=app.py
FLASK_ENV=development # 開發環境: development, 生產環境: production
FLASK_RUN_PORT=5000

# DIFY API Token (請替換為您的金鑰)
DIFY_API_KEY_For_Diary = app-XXXXXXXXXXXXXXX
DIFY_API_KEY_For_Chat = app-XXXXXXXXXXXXXXX

# 管理員信箱
ADMIN_EMAILS=2025dify@gmail.com # 可設定多個，以逗號分隔

# Flask Secret Key (請務必修改為一個隨機且複雜的字串)
SECRET_KEY=2025_flask_project

# SMTP 郵件伺服器設定 (以 Zoho 為例，請根據您的郵件服務商修改)
MAIL_SERVER=smtp.zoho.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=dify2025@soulcraftjournal.studio
MAIL_PASSWORD=XXXX XXXX XXXX # 請替換為您的郵件帳號密碼
MAIL_DEFAULT_SENDER=dify2025@soulcraftjournal.studio
```



## 4. 注意事項

*   **安裝依賴**: 在啟動專案前，請確保已安裝 `requirements.txt` 中列出的所有 Python 套件。可使用指令 `pip install -r requirements.txt`。
*   **環境變數**: 正確設定上述環境變數是專案正常運行的關鍵。特別注意 `SECRET_KEY` 的唯一性和保密性，以及 API 金鑰和郵件密碼等敏感資訊。
*   **資料庫設定**: `utils/db.py` 中包含資料庫連線設定，請確保其配置正確以符合您的資料庫環境。
*   **執行專案**: 通常使用 `flask run` 指令啟動開發伺服器 (需先設定 `FLASK_APP` 和 `FLASK_ENV` 環境變數)。
*   **詳細說明**: 更詳細的設計理念或特定功能實現細節，可以參考 `explain.md` 文件。
