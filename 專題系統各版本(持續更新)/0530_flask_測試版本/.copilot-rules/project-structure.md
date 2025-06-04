# 專案結構規範

## 目錄架構原則

### 模組化設計
```
專案根目錄/
├── app.py                 # 應用程式入口點
├── services/              # 業務邏輯層
│   ├── admin/            # 管理員功能模組
│   ├── ai/               # AI 相關功能
│   ├── diary/            # 日記功能模組
│   └── user/             # 用戶管理模組
├── static/               # 靜態資源
│   ├── css/module/       # 按模組組織的樣式
│   └── js/module/        # 按模組組織的腳本
├── templates/            # 模板文件
│   ├── admin/            # 管理員模板
│   ├── components/       # 可重用組件
│   └── [module]/         # 各模組專用模板
└── utils/                # 工具函數
```

### 命名規範

#### 文件命名
- Python 文件：使用 snake_case (例: `user_settings.py`)
- HTML 模板：使用 snake_case (例: `diary_form.html`)
- CSS/JS 文件：與對應模組保持一致

#### 資料夾命名
- 模組資料夾：使用單數形式 (例: `diary/`, `user/`)
- 複數只用於內容類型 (例: `templates/`, `components/`)

### 模組組織原則

1. **功能導向**：每個 services 子目錄代表一個功能模組
2. **對應性**：static 和 templates 的結構與 services 對應
3. **分層清晰**：業務邏輯、展示層、靜態資源分離
4. **可擴展性**：新功能可以輕鬆添加新模組

### 文件組織規則

#### Services 模組結構
```
services/[module]/
├── __init__.py           # 模組初始化
├── [module].py           # 主要業務邏輯
└── [module]_chat.py      # 聊天相關功能（如適用）
```

#### Templates 模組結構
```
templates/[module]/
├── layout.html           # 模組專用佈局（如需要）
├── [module]_form.html    # 表單頁面
├── [module]_list.html    # 列表頁面
└── [feature].html        # 其他功能頁面
```

#### Static 資源結構
```
static/css/module/[module]/
├── [module].css          # 主要樣式
├── [module]_form.css     # 表單專用樣式
└── [module]_list.css     # 列表專用樣式
```
