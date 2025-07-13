# 雲端部署 302 重定向問題解決指南

## 問題分析

根據服務器日誌：
```
GET /admin/report HTTP/1.1" 302 919
GET /admin/dashboard HTTP/1.1" 200 4623
```

這表明 `/admin/report` 路由返回 302 重定向到 `/admin/dashboard`，原因是權限檢查失敗。

## 立即診斷步驟

### 1. 檢查環境變數（在服務器上執行）
```bash
cd /path/to/your/flask_project
python3 check_env.py
```

### 2. 訪問診斷頁面
- 在瀏覽器中訪問：`https://your-domain/admin/debug-permission`
- 這會顯示詳細的權限檢查過程

### 3. 檢查服務器日誌
```bash
sudo journalctl -u flask_project -f --lines=50
```

## 可能的解決方案

### 方案 1: 檢查 .env 檔案
```bash
# 確認 .env 檔案存在且內容正確
cat .env | grep ADMIN_EMAILS

# 如果沒有，創建或修改 .env 檔案
echo "ADMIN_EMAILS=2025dify@gmail.com" >> .env
```

### 方案 2: 設定系統環境變數
```bash
# 方法 A: 在 systemd 服務中設定
sudo systemctl edit flask_project

# 添加以下內容到 [Service] 部分：
[Service]
Environment="ADMIN_EMAILS=2025dify@gmail.com"

# 重新載入並重啟服務
sudo systemctl daemon-reload
sudo systemctl restart flask_project
```

```bash
# 方法 B: 在 shell 中導出（臨時）
export ADMIN_EMAILS="2025dify@gmail.com"
```

### 方案 3: 檢查檔案權限
```bash
# 確認 .env 檔案可讀
ls -la .env
chmod 644 .env

# 確認應用程式目錄權限
ls -la /path/to/flask_project/
```

### 方案 4: 強制重新載入（代碼層面）
如果環境變數設定正確但仍有問題，可以在 `is_admin()` 函數中添加強制檢查：

```python
# 在 services/admin/admin.py 的 is_admin() 函數中添加
def is_admin():
    # 現有代碼...
    
    # 緊急修復：硬編碼檢查
    if current_user.is_authenticated and current_user.id == "2025dify@gmail.com":
        logging.warning(f"緊急修復：允許已知管理員 {current_user.id}")
        return True
    
    # 其他檢查邏輯...
```

## 驗證修復

### 1. 檢查診斷頁面
訪問 `https://your-domain/admin/debug-permission` 確認：
- ✅ 用戶已驗證
- ✅ 環境變數正確載入
- ✅ 權限檢查通過

### 2. 測試舉報管理
訪問 `https://your-domain/admin/report` 應該：
- 不再出現 302 重定向
- 正常顯示舉報列表頁面

### 3. 檢查日誌
```bash
sudo journalctl -u flask_project -f
```
應該看到：
```
GET /admin/report HTTP/1.1" 200 [size]
```
而不是 302。

## 常見問題

### Q: 環境變數設定正確但仍然重定向
A: 檢查：
1. 服務重啟了嗎？
2. 檔案編碼是否正確？
3. 是否有多個 .env 檔案？

### Q: systemd 服務如何設定環境變數？
A: 使用 `sudo systemctl edit flask_project` 添加：
```ini
[Service]
Environment="ADMIN_EMAILS=2025dify@gmail.com"
Environment="SECRET_KEY=your_secret_key"
```

### Q: 如何確認用戶登入狀態？
A: 訪問 `/admin/debug-permission` 查看用戶資訊部分。

## 緊急恢復

如果以上方法都不起作用，可以臨時修改代碼：

1. 編輯 `services/admin/admin.py`
2. 在 `is_admin()` 函數開頭添加：
```python
# 緊急修復 - 請在修復後移除
if current_user.is_authenticated and current_user.id == "2025dify@gmail.com":
    return True
```

3. 重啟服務：
```bash
sudo systemctl restart flask_project
```

**注意**: 這是臨時解決方案，修復環境變數問題後請移除此代碼。
