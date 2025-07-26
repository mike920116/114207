# 心理健康支援平台 - 專案 README

這是一個基於 Flask 的綜合性心理健康支援平台，整合了日記管理、AI 聊天諮詢、社交互動、門診預約、客服支援等多項功能，旨在為用戶提供全方位的心理健康服務。

## 1. 專案概覽

### 核心技術
*   Python
*   Flask (Web 框架)
*   Jinja2 (模板引擎)
*   HTML, CSS, JavaScript (前端)
*   Flask-SocketIO (即時通訊)
*   MySQL/MariaDB (資料庫)
*   Dify API (AI 聊天服務)
*   LINE Bot API (訊息推送)

### 主要功能
*   **使用者模組 (`services/user/`)**:
    *   使用者註冊、登入、登出
    *   密碼重設
    *   使用者個人資料設定
*   **日記模組 (`services/diary/`)**:
    *   使用者日記撰寫、查看、管理
*   **AI 互動模組 (`services/ai/`)**:
    *   AI 聊天機器人 (整合 Dify API)
    *   智能對話與聊天記錄
    *   真人客服呼叫功能
*   **社交互動模組 (`services/social/`)**:
    *   社群貼文發表與瀏覽
    *   用戶等級系統
    *   互動功能 (點讚、評論、分享)
*   **門診預約模組 (`services/clinic/`)**:
    *   線上門診預約
    *   預約歷史查詢
    *   預約狀態管理
*   **客服支援模組 (`services/support/`)**:
    *   意見反饋系統
    *   問題回報功能
    *   FAQ 常見問題
*   **公告系統 (`services/announcement/`)**:
    *   系統公告發布
    *   動態公告顯示
*   **LINE Bot 整合 (`services/line/`)**:
    *   Webhook 接收
    *   管理員通知推送
*   **管理員後台模組 (`services/admin/`)**:
    *   使用者管理
    *   日記內容管理
    *   客服即時聊天面板
    *   公告管理
    *   預約管理查看
    *   意見回報處理
*   **即時通訊 (`services/socketio_manager.py`)**:
    *   支援客服聊天與 AI 聊天
    *   WebSocket 即時訊息傳遞



### 架構特色
*   **模組化設計**: 使用 Flask Blueprints 將不同功能模組化 (例如 `user`, `diary`, `admin`, `ai`, `social`, `clinic`, `support`, `announcement`, `line`)，提高程式碼的可維護性和擴展性。
*   **分層架構**: 清晰劃分表現層 (`templates/`)、業務邏輯層 (`services/`)、靜態資源 (`static/`) 和工具函式 (`utils/`)。
*   **資料庫連線池**: 使用 `dbutils.pooled_db` (於 `utils/db.py` 中配置) 管理資料庫連線，提升效能和資源利用率。
*   **即時互動**: 透過 Flask-SocketIO 實現即時通訊功能，支援客服聊天和 AI 對話。
*   **API 整合**: 整合多項外部 API 服務，包括 Dify AI 聊天和 LINE Bot 推送。
*   **響應式設計**: 支援桌面端和行動裝置的響應式介面設計。



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
│   │   ├── admin.py            # 主控制面板
│   │   ├── admin_chat.py       # 客服聊天功能
│   │   ├── admin_announcement.py # 公告管理
│   │   └── admin_report.py     # 報告管理
│   ├── ai/                     # AI 互動功能
│   │   ├── __init__.py
│   │   └── ai_chat.py          # AI 聊天服務
│   ├── announcement/           # 公告系統
│   │   ├── __init__.py
│   │   └── announcement.py
│   ├── clinic/                 # 門診預約功能
│   │   ├── __init__.py
│   │   └── clinic.py
│   ├── diary/                  # 使用者日記功能
│   │   ├── __init__.py
│   │   └── diary.py
│   ├── line/                   # LINE Bot 功能
│   │   ├── __init__.py
│   │   ├── line_bot.py         # 通知推送
│   │   └── webhook.py          # Webhook 處理
│   ├── social/                 # 社交互動功能
│   │   ├── __init__.py
│   │   └── social_main.py      # 社群主功能
│   ├── support/                # 客服支援功能
│   │   ├── __init__.py
│   │   ├── support.py          # 主支援功能
│   │   └── support_report.py   # 問題回報
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
│   │       ├── clinic/appointment.css, appointment_history.css
│   │       ├── diary/diary_form.css, diary_list.css
│   │       ├── social/social_main.css, create_post.css, level_guide.css
│   │       ├── support/support.css, report.css
│   │       └── user/settings.css, user.css
│   └── js/
│       ├── base.js             # 全站通用基礎客戶端腳本
│       └── modules/             # 各功能模組的專屬客戶端腳本
│           ├── admin/admin.js
│           ├── ai/ai_chat.js
│           ├── clinic/appointment.js, appointment_history.js
│           ├── diary/diary_form.js, diary_list.js
│           ├── social/social_main.js, create_post.js
│           ├── support/support.js, report.js
│           └── user/settings.js, user.js
├── templates/                  # Jinja2 模板檔案
│   ├── base.html               # 所有頁面的基礎佈局模板
│   ├── index.html              # 網站首頁模板
│   ├── admin/                  # 管理員後台相關頁面模板
│   │   ├── layout.html
│   │   ├── dashboard.html
│   │   ├── users.html
│   │   ├── announcements.html
│   │   ├── announcement_form.html
│   │   ├── appointment_hospitals.html
│   │   ├── appointment_management.html
│   │   ├── report_list.html
│   │   ├── report_detail.html
│   │   ├── report_stats.html
│   │   └── chat_panel.html
│   ├── ai/                     # AI 功能相關頁面模板
│   │   └── ai_chat.html
│   ├── clinic/                 # 門診預約相關頁面模板
│   │   ├── appointment.html
│   │   └── appointment_history.html
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
│   ├── social/                 # 社交功能相關頁面模板
│   │   ├── social_main.html
│   │   ├── create_post.html
│   │   └── level_guide.html
│   ├── support/                # 客服支援相關頁面模板
│   │   ├── faq.html
│   │   ├── usage.html
│   │   ├── report_form.html
│   │   ├── report_detail.html
│   │   └── report_history.html
│   └── user/                   # 使用者驗證流程頁面模板
│       ├── login.html
│       ├── signup.html
│       ├── login_form.html
│       ├── signup_form.html
│       ├── forgot_form.html
│       ├── forgot_password_sent.html
│       ├── reset_password_form.html
│       ├── reset_password_success.html
│       ├── verification_email.html
│       ├── verify_success.html
│       └── verify_failed.html
└── utils/                      # 共用工具函式、類別或設定
    ├── __init__.py
    ├── db.py                   # 資料庫連線設定與管理
    ├── encryption.py           # 密碼加密工具
    ├── ip.py                   # IP 地址處理
    ├── keygen.py               # 金鑰生成工具
    └── level_system.py         # 用戶等級系統
```




## 3. 功能特色詳述

### 🤖 AI 聊天系統
- **智能對話**: 整合 Dify API，提供專業的心理諮詢對話
- **真人客服**: 用戶可隨時呼叫真人客服，系統會透過 WebSocket 和 LINE Bot 通知管理員
- **聊天記錄**: 完整的對話歷史保存，支援跨會話的連續性對話
- **會話管理**: 管理員可透過後台面板即時回覆用戶訊息

### 🏥 門診預約系統
- **線上預約**: 支援多家醫院、多科別的線上門診預約
- **預約管理**: 用戶可查看、取消、修改預約記錄
- **狀態追踪**: 即時更新預約狀態（待處理、已確認、已完成、已取消）
- **後台管理**: 管理員可查看所有預約記錄及統計數據

### 💬 社交互動平台
- **社群貼文**: 用戶可發表心情分享、經驗交流等貼文
- **互動功能**: 支援點讚、評論、分享等社交互動
- **等級系統**: 根據用戶活躍度設計的成長等級機制
- **等級獎勵**: 發文、互動等行為可獲得經驗值並升級

### 🛠️ 客服支援系統
- **問題回報**: 用戶可提交各類問題和建議
- **FAQ 系統**: 常見問題的自助查詢功能
- **處理追踪**: 管理員可處理並追踪問題解決進度
- **即時通知**: 透過 LINE Bot 即時通知管理員新的回報

### 📢 公告系統
- **動態公告**: 管理員可發布系統公告和重要通知
- **跑馬燈顯示**: 首頁和社群頁面的動態公告展示
- **公告管理**: 後台支援公告的新增、編輯、刪除功能

### 🔔 LINE Bot 整合
- **即時推送**: 重要事件（客服呼叫、問題回報等）即時推送給管理員
- **Webhook 接收**: 支援 LINE 平台的訊息接收和處理
- **多管理員通知**: 可同時通知多位管理員

### 📊 管理員後台
- **統一控制台**: 集中管理所有系統功能
- **用戶管理**: 查看和管理註冊用戶
- **內容管理**: 管理日記、貼文等用戶生成內容
- **即時客服**: 即時聊天面板，支援多用戶同時服務
- **數據統計**: 各功能模組的使用統計和分析

## 4. 環境變數設定

請參考以下設定，並根據您的實際環境修改。建議將敏感資訊（如 API 金鑰、密碼）儲存在作業系統的環境變數中，而非直接寫在此文件中。

```
# Flask 應用程式設定
FLASK_APP=app.py
FLASK_ENV=development # 開發環境: development, 生產環境: production
FLASK_RUN_PORT=5000

# DIFY API Token (請替換為您的金鑰)
DIFY_API_KEY_For_Diary = app-XXXXXXXXXXXXXXX
DIFY_API_KEY_For_Chat = app-XXXXXXXXXXXXXXX

# LINE Bot 設定 (選用)
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
ADMIN_LINE_USER_IDS=USER_ID_1,USER_ID_2  # 管理員 LINE 用戶 ID，逗號分隔

# 管理員信箱
ADMIN_EMAILS=2025dify@gmail.com # 可設定多個，以逗號分隔

# Flask Secret Key (請務必修改為一個隨機且複雜的字串)
SECRET_KEY=2025_flask_project

# 資料庫設定
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=your_database_name
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password

# SMTP 郵件伺服器設定 (以 Zoho 為例，請根據您的郵件服務商修改)
MAIL_SERVER=smtp.zoho.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=dify2025@soulcraftjournal.studio
MAIL_PASSWORD=XXXX XXXX XXXX # 請替換為您的郵件帳號密碼
MAIL_DEFAULT_SENDER=dify2025@soulcraftjournal.studio
```



## 5. 注意事項

*   **安裝依賴**: 在啟動專案前，請確保已安裝 `requirements.txt` 中列出的所有 Python 套件。可使用指令 `pip install -r requirements.txt`。
*   **環境變數**: 正確設定上述環境變數是專案正常運行的關鍵。特別注意 `SECRET_KEY` 的唯一性和保密性，以及 API 金鑰和郵件密碼等敏感資訊。
*   **資料庫設定**: `utils/db.py` 中包含資料庫連線設定，請確保其配置正確以符合您的資料庫環境。
*   **Dify API**: AI 聊天功能需要有效的 Dify API 金鑰，請至 Dify 平台申請並設定環境變數。
*   **LINE Bot 設定**: LINE 通知功能為選用功能，如不需要可留空相關環境變數。
*   **執行專案**: 使用 `python app.py` 啟動開發伺服器，系統會自動啟用 SocketIO 支援。
*   **詳細說明**: 更詳細的設計理念或特定功能實現細節，可以參考各功能模組的文檔或 `APPOINTMENT_MANAGEMENT_README.md` 等專項文檔。
