/**
 * User ID 管理器 - 處理用戶 ID 的創建和驗證
 * 
 * 功能特性：
 * - 自動檢查用戶是否已設定 user_id
 * - 提供覆蓋層 UI 來引導用戶創建 user_id
 * - 即時驗證 user_id 的格式和唯一性
 * - 與後端 API 整合進行資料操作
 * - 提供流暢的用戶體驗和錯誤處理
 */

class UserIdManager {
    constructor() {
        // 移除對overlay的依賴，直接獲取embedded模式下的元素
        this.overlay = null; // 不再使用overlay
        this.input = document.getElementById('userIdInput');
        this.feedback = document.getElementById('userIdFeedback');
        this.createBtn = document.getElementById('createUserIdBtn');
        this.skipBtn = document.getElementById('skipUserIdBtn');
        
        // 狀態管理
        this.isChecking = false;
        this.isCreating = false;
        this.debounceTimer = null;
        this.currentUserId = null;
        
        // API 端點
        this.endpoints = {
            check: '/coopcard/api/check-user-id',
            validate: '/coopcard/api/validate-user-id',
            create: '/coopcard/api/create-user-id'
        };
        
        this.init();
    }
    
    /**
     * 初始化管理器
     */
    init() {
        if (!this.input || !this.feedback || !this.createBtn || !this.skipBtn) {
            console.error('[UserIdManager] 必要的 DOM 元素未找到');
            return;
        }
        
        // 綁定事件
        this.bindEvents();
        
        // 檢查用戶 ID 狀態
        this.checkUserIdStatus();
        
        console.log('[UserIdManager] 初始化完成');
    }
    
    /**
     * 綁定事件監聽器
     */
    bindEvents() {
        // 輸入框事件
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('blur', () => this.handleBlur());
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 按鈕事件
        this.createBtn.addEventListener('click', () => this.createUserId());
        this.skipBtn.addEventListener('click', () => this.skipCreation());
        
        // 移除覆蓋層相關事件，因為現在是embedded模式
    }
    
    /**
     * 檢查用戶 ID 狀態
     */
    async checkUserIdStatus() {
        try {
            console.log('[UserIdManager] 檢查用戶 ID 狀態...');
            
            const response = await fetch(this.endpoints.check, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.has_user_id) {
                    console.log(`[UserIdManager] 用戶已有 user_id: ${data.user_id}`);
                    this.currentUserId = data.user_id;
                    this.updateUIForExistingUserId(data.user_id);
                } else {
                    console.log('[UserIdManager] 用戶尚未設定 user_id，顯示創建介面');
                    this.updateUIForNewUserId();
                }
            } else {
                console.error('[UserIdManager] 檢查用戶 ID 狀態失敗:', data.message);
                this.setFeedback('檢查用戶狀態失敗，請重新整理頁面', 'error');
            }
        } catch (error) {
            console.error('[UserIdManager] 檢查用戶 ID 狀態時發生錯誤:', error);
            this.setFeedback('網路連線問題，請檢查網路後重新整理頁面', 'error');
        }
    }
    
    /**
     * 更新UI - 用戶已有user_id
     */
    updateUIForExistingUserId(userId) {
        this.input.value = userId;
        this.input.disabled = true;
        this.setFeedback(`✓ 您的 User ID: ${userId}`, 'success');
        this.createBtn.textContent = '已設定完成';
        this.createBtn.disabled = true;
        this.skipBtn.style.display = 'none';
    }
    
    /**
     * 更新UI - 用戶需要創建user_id
     */
    updateUIForNewUserId() {
        this.input.value = '';
        this.input.disabled = false;
        this.input.placeholder = '請輸入3-30個字元的ID';
        this.setFeedback('', '');
        this.updateCreateButton(false);
    }
    
    /**
     * 顯示覆蓋層
     */
    showOverlay() {
        if (this.overlay) {
            this.overlay.style.display = 'flex';
            this.overlay.classList.remove('closing');
            
            // 延遲聚焦，確保動畫完成
            setTimeout(() => {
                if (this.input) {
                    this.input.focus();
                }
            }, 300);
            
            console.log('[UserIdManager] 覆蓋層已顯示');
        }
    }
    
    /**
     * 隱藏覆蓋層
     */
    hideOverlay() {
        if (this.overlay) {
            this.overlay.classList.add('closing');
            
            setTimeout(() => {
                this.overlay.style.display = 'none';
                this.overlay.classList.remove('closing');
                
                // 觸發好友功能載入
                this.triggerFriendsLoad();
            }, 300);
            
            console.log('[UserIdManager] 覆蓋層已隱藏');
        }
    }
    
    /**
     * 處理輸入事件
     */
    handleInput() {
        const value = this.input.value.trim();
        
        // 清除之前的定時器
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // 重置按鈕狀態
        this.updateCreateButton(false);
        
        if (value.length === 0) {
            this.setFeedback('', '');
            return;
        }
        
        // 即時格式驗證
        const formatResult = this.validateFormat(value);
        if (!formatResult.valid) {
            this.setFeedback(formatResult.message, 'error');
            this.input.classList.add('error');
            return;
        }
        
        // 移除錯誤樣式
        this.input.classList.remove('error');
        
        // 延遲檢查唯一性
        this.debounceTimer = setTimeout(() => {
            this.validateUserId(value);
        }, 500);
        
        // 顯示檢查中狀態
        this.setFeedback('檢查中...', 'checking');
    }
    
    /**
     * 處理輸入框失焦事件
     */
    handleBlur() {
        const value = this.input.value.trim();
        if (value.length > 0) {
            const formatResult = this.validateFormat(value);
            if (formatResult.valid) {
                this.validateUserId(value);
            }
        }
    }
    
    /**
     * 處理鍵盤事件
     */
    handleKeydown(event) {
        if (event.key === 'Enter' && !this.createBtn.disabled) {
            event.preventDefault();
            this.createUserId();
        }
    }
    
    /**
     * 格式驗證
     */
    validateFormat(userId) {
        if (!userId) {
            return { valid: false, message: 'User ID 不能為空' };
        }
        
        if (userId.length < 3) {
            return { valid: false, message: 'User ID 長度至少需要 3 個字元' };
        }
        
        if (userId.length > 30) {
            return { valid: false, message: 'User ID 長度不能超過 30 個字元' };
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
            return { valid: false, message: 'User ID 只能包含英文字母、數字、底線(_)和連字號(-)' };
        }
        
        return { valid: true, message: 'User ID 格式正確' };
    }
    
    /**
     * 驗證 User ID（格式 + 唯一性）
     */
    async validateUserId(userId) {
        if (this.isChecking) {
            return;
        }
        
        this.isChecking = true;
        
        try {
            const response = await fetch(this.endpoints.validate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ user_id: userId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.available) {
                    this.setFeedback(data.message, 'success');
                    this.updateCreateButton(true);
                } else {
                    this.setFeedback(data.message, 'error');
                    this.input.classList.add('error');
                    this.updateCreateButton(false);
                }
            } else {
                this.setFeedback(data.message || '驗證失敗', 'error');
                this.updateCreateButton(false);
            }
        } catch (error) {
            console.error('[UserIdManager] 驗證 User ID 時發生錯誤:', error);
            this.setFeedback('網路連線問題，請檢查網路', 'error');
            this.updateCreateButton(false);
        } finally {
            this.isChecking = false;
        }
    }
    
    /**
     * 創建 User ID
     */
    async createUserId() {
        if (this.isCreating || this.createBtn.disabled) {
            return;
        }
        
        const userId = this.input.value.trim();
        
        // 最終格式檢查
        const formatResult = this.validateFormat(userId);
        if (!formatResult.valid) {
            this.setFeedback(formatResult.message, 'error');
            return;
        }
        
        this.isCreating = true;
        this.setButtonLoading(true);
        
        try {
            const response = await fetch(this.endpoints.create, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ user_id: userId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.setFeedback(data.message, 'success');
                this.currentUserId = data.user_id;
                
                // 更新UI顯示成功狀態
                this.updateUIForExistingUserId(data.user_id);
                
                // 觸發用戶ID準備就緒事件
                document.dispatchEvent(new CustomEvent('userIdReady', {
                    detail: { userId: data.user_id }
                }));
                
                console.log(`[UserIdManager] User ID 創建成功: ${data.user_id}`);
            } else {
                this.setFeedback(data.message, 'error');
                console.error('[UserIdManager] 創建 User ID 失敗:', data.message);
            }
        } catch (error) {
            console.error('[UserIdManager] 創建 User ID 時發生錯誤:', error);
            this.setFeedback('創建失敗，請稍後再試', 'error');
        } finally {
            this.isCreating = false;
            this.setButtonLoading(false);
        }
    }
    
    /**
     * 跳過創建
     */
    skipCreation() {
        console.log('[UserIdManager] 用戶選擇跳過創建 User ID');
        
        // 在embedded模式下，用戶可以直接使用其他功能，不需要特殊處理
        this.setFeedback('您可以稍後再創建個人ID，或直接使用其他功能', 'info');
        
        // 切換到好友列表標籤
        if (window.switchWidgetTab && typeof window.switchWidgetTab === 'function') {
            window.switchWidgetTab('friends');
        }
    }
    
    /**
     * 設定反饋訊息
     */
    setFeedback(message, type) {
        if (!this.feedback) return;
        
        this.feedback.textContent = message;
        this.feedback.className = `input-feedback ${type}`;
        
        // 如果是空訊息，清除樣式
        if (!message) {
            this.feedback.className = 'input-feedback';
        }
    }
    
    /**
     * 更新創建按鈕狀態
     */
    updateCreateButton(enabled) {
        if (!this.createBtn) return;
        
        this.createBtn.disabled = !enabled;
    }
    
    /**
     * 設定按鈕載入狀態
     */
    setButtonLoading(loading) {
        if (!this.createBtn) return;
        
        const btnText = this.createBtn.querySelector('.btn-text');
        const btnLoading = this.createBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
            this.createBtn.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }
    
    /**
     * 顯示成功動畫
     */
    showSuccessAnimation() {
        const overlayContent = this.overlay.querySelector('.overlay-content');
        if (overlayContent) {
            overlayContent.classList.add('success');
            setTimeout(() => {
                overlayContent.classList.remove('success');
            }, 600);
        }
    }
    
    /**
     * 顯示搖晃動畫（提示用戶必須創建）
     */
    showShakeAnimation() {
        const overlayContent = this.overlay.querySelector('.overlay-content');
        if (overlayContent) {
            overlayContent.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                overlayContent.style.animation = '';
            }, 500);
        }
    }
    
    /**
     * 顯示跳過訊息
     */
    showSkipMessage() {
        // 可以在這裡添加一個小提示，告知用戶如何在設定中創建 User ID
        console.log('[UserIdManager] 顯示跳過後的提示訊息');
    }
    
    /**
     * 觸發好友功能載入
     */
    triggerFriendsLoad() {
        // 通知其他模組用戶已經準備就緒
        if (window.loadFriendsPanel && typeof window.loadFriendsPanel === 'function') {
            window.loadFriendsPanel();
        }
        
        // 觸發自定義事件
        const event = new CustomEvent('userIdReady', {
            detail: { userId: this.currentUserId }
        });
        document.dispatchEvent(event);
        
        console.log('[UserIdManager] 已觸發好友功能載入');
    }
    
    /**
     * 顯示錯誤訊息
     */
    showError(message) {
        console.error('[UserIdManager]', message);
        
        // 可以在這裡添加全局錯誤提示
        if (this.feedback) {
            this.setFeedback(message, 'error');
        }
    }
    
    /**
     * 獲取當前用戶 ID
     */
    getCurrentUserId() {
        return this.currentUserId;
    }
    
    /**
     * 檢查是否已設定 User ID
     */
    hasUserId() {
        return this.currentUserId !== null;
    }
}

// 添加搖晃動畫的 CSS
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeStyle);

// 導出類以供其他模組使用
window.UserIdManager = UserIdManager;

// 確保在DOM載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    // 創建全域實例
    window.userIdManager = new UserIdManager();
    console.log('[UserIdManager] 全域實例已創建');
});