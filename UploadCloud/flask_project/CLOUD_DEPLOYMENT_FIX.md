# 雲端部署 302 重定向問題解決方案

## 問題描述
在雲端部署時，訪問 `/admin/report` 會出現 302 重定向到 dashboard，但本地環境正常。

## 可能原因
1. **環境變數載入失敗**：雲端平台的環境變數沒有正確載入到應用程式中
2. **權限檢查失敗**：`is_admin()` 函數無法正確讀取 `ADMIN_EMAILS`
3. **用戶狀態問題**：雲端環境中用戶驗證狀態不正確

## 解決方案

### 1. 新增的調試工具
- `/admin/cloud-debug`：雲端環境診斷頁面（無需登入）
- `/admin/test-redirect`：測試重定向行為（需要登入）
- `diagnose_cloud.py`：命令行診斷工具

### 2. 環境變數修復
已添加 `utils/cloud_env_fix.py` 強制重新載入環境變數

### 3. 增強的權限檢查
`is_admin()` 函數現在包含：
- 多層次環境變數載入
- 備用管理員檢查
- 詳細的錯誤處理和日誌記錄

## 部署檢查步驟

### 步驟1：確認雲端平台環境變數
在你的雲端平台（Heroku、Railway、Vercel 等）設定：
```
ADMIN_EMAILS=2025dify@gmail.com
SECRET_KEY=你的密鑰
```

### 步驟2：部署並訪問調試頁面
1. 部署修改後的代碼
2. 訪問 `https://你的域名/admin/cloud-debug`
3. 檢查環境變數是否正確載入

### 步驟3：測試管理員功能
1. 以管理員身份登入 (`2025dify@gmail.com`)
2. 訪問 `https://你的域名/admin/test-redirect`
3. 檢查權限檢查是否通過

### 步驟4：訪問舉報管理
如果前面的測試都通過，嘗試訪問：
`https://你的域名/admin/report`

## 常見雲端平台設定方法

### Heroku
```bash
heroku config:set ADMIN_EMAILS=2025dify@gmail.com
heroku config:set SECRET_KEY=your_secret_key
```

### Railway
在 Railway 儀表板中的 Variables 頁面設定：
- `ADMIN_EMAILS` = `2025dify@gmail.com`
- `SECRET_KEY` = `your_secret_key`

### Vercel
在 `vercel.json` 中或儀表板設定：
```json
{
  "env": {
    "ADMIN_EMAILS": "2025dify@gmail.com",
    "SECRET_KEY": "your_secret_key"
  }
}
```

### Render
在環境變數部分設定：
- `ADMIN_EMAILS` = `2025dify@gmail.com`
- `SECRET_KEY` = `your_secret_key`

## 如果問題持續存在

1. **檢查日誌**：查看雲端平台的應用程式日誌
2. **使用調試路由**：訪問 `/admin/cloud-debug` 獲取詳細資訊
3. **驗證數據庫**：確保管理員用戶存在於數據庫中
4. **聯繫支援**：將調試頁面的資訊提供給技術支援

## 緊急備用方案

如果環境變數完全無法載入，可以暫時修改 `is_admin()` 函數：

```python
# 在 services/admin/admin.py 的 is_admin() 函數中
# 添加硬編碼檢查（僅緊急使用）
if current_user.is_authenticated and current_user.id == "2025dify@gmail.com":
    return True
```

注意：這只是緊急解決方案，應該盡快修復環境變數問題。
