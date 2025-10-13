/**
 * 好友選擇模態框組件
 * 
 * 功能特性：
 * - 支援多選好友
 * - 視覺選中回饋
 * - 實時計數顯示
 * - 好友搜尋功能
 * - 防濫用限制（最多10位）
 * - 優雅的動畫效果
 */

class FriendSelectorModal {
    constructor() {
        this.selectedFriends = new Set();
        this.allFriends = [];
        this.filteredFriends = [];
        this.currentCardId = null;
        this.maxSelections = 10; // 防濫用限制
        this.modal = null;
        this.searchTimeout = null;
        
        this.createModal();
        this.setupEventHandlers();
    }
    
    /**
     * 創建模態框DOM結構
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'friend-selector-modal';
        this.modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h4><i class="fas fa-user-friends"></i> 選擇要邀請的好友</h4>
                    <button class="close-btn">&times;</button>
                </div>
                
                <div class="invitation-counter">
                    <span id="selectedCount">已選擇 0 位好友</span>
                    <span id="willSend">將發送 0 份邀請</span>
                </div>
                
                <div class="friends-search">
                    <input type="text" id="friendSearch" placeholder="搜尋好友姓名..." autocomplete="off">
                    <i class="fas fa-search search-icon"></i>
                </div>
                
                <div class="friends-list" id="friendsList">
                    <!-- 好友列表會動態載入 -->
                    <div class="loading-placeholder">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>載入好友列表中...</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="cancel-btn">取消</button>
                    <button class="send-btn" disabled>發送邀請</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }
    
    /**
     * 設置事件監聽器
     */
    setupEventHandlers() {
        const modal = this.modal;
        
        // 關閉按鈕
        modal.querySelector('.close-btn').addEventListener('click', () => this.hide());
        modal.querySelector('.cancel-btn').addEventListener('click', () => this.hide());
        
        // 點擊模態框外部關閉 - 修復後的邏輯
        modal.addEventListener('click', (e) => {
            // 只有當點擊目標是模態框本身（而不是模態框內容）時才關閉
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                this.hide();
            }
        });
        
        // 防止模態框內容區域的點擊事件冒泡到模態框
        modal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // 搜尋功能
        const searchInput = modal.querySelector('#friendSearch');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // 發送邀請
        modal.querySelector('.send-btn').addEventListener('click', () => this.sendInvitations());
        
        // ESC關閉
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                this.hide();
            }
        });
        
        // 好友列表點擊事件委派
        modal.querySelector('#friendsList').addEventListener('click', (e) => {
            const friendItem = e.target.closest('.friend-item');
            if (friendItem) {
                this.toggleFriend(friendItem.dataset.email);
            }
        });
    }
    
    /**
     * 顯示模態框
     */
    show(cardId) {
        this.currentCardId = cardId;
        this.selectedFriends.clear();
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 載入好友列表
        this.loadFriends();
        
        // 聚焦搜尋框
        setTimeout(() => {
            this.modal.querySelector('#friendSearch').focus();
        }, 100);
    }
    
    /**
     * 隱藏模態框
     */
    hide() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // 重置狀態
        this.selectedFriends.clear();
        this.currentCardId = null;
        this.modal.querySelector('#friendSearch').value = '';
        this.filteredFriends = [];
    }
    
    /**
     * 載入好友列表
     */
    async loadFriends() {
        try {
            const response = await fetch('/coopcard/api/friends_widget');
            const data = await response.json();
            
            if (data.success) {
                this.allFriends = data.friends;
                this.filteredFriends = [...this.allFriends];
                this.renderFriendsList();
            } else {
                this.showError('載入好友列表失敗');
            }
        } catch (error) {
            console.error('載入好友列表失敗:', error);
            this.showError('網路錯誤，請稍後再試');
        }
    }
    
    /**
     * 渲染好友列表
     */
    renderFriendsList() {
        const friendsList = this.modal.querySelector('#friendsList');
        
        if (this.filteredFriends.length === 0) {
            friendsList.innerHTML = `
                <div class="no-friends-placeholder">
                    <i class="fas fa-users"></i>
                    <span>${this.allFriends.length === 0 ? '尚無好友' : '無符合搜尋條件的好友'}</span>
                </div>
            `;
            return;
        }
        
        friendsList.innerHTML = this.filteredFriends.map(friend => `
            <div class="friend-item ${this.selectedFriends.has(friend.email) ? 'selected' : ''}" 
                 data-email="${friend.email}">
                <img src="${friend.avatar || '/static/icons/avatars/default.png'}" 
                     alt="${friend.name}" 
                     class="selector-friend-avatar"
                     onerror="this.src='/static/icons/avatars/default.png'">
                <div class="friend-info">
                    <div class="friend-name">${this.escapeHtml(friend.name)}</div>
                    <div class="friend-level">等級 ${friend.level}</div>
                </div>
                <div class="selection-indicator">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `).join('');
        
        this.updateCounter();
    }
    
    /**
     * 處理搜尋
     */
    handleSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            const searchTerm = query.toLowerCase().trim();
            
            if (searchTerm === '') {
                this.filteredFriends = [...this.allFriends];
            } else {
                this.filteredFriends = this.allFriends.filter(friend => 
                    friend.name.toLowerCase().includes(searchTerm) ||
                    friend.email.toLowerCase().includes(searchTerm)
                );
            }
            
            this.renderFriendsList();
        }, 300);
    }
    
    /**
     * 切換好友選中狀態
     */
    toggleFriend(friendEmail) {
        if (this.selectedFriends.has(friendEmail)) {
            this.selectedFriends.delete(friendEmail);
        } else if (this.selectedFriends.size < this.maxSelections) {
            this.selectedFriends.add(friendEmail);
        } else {
            this.showNotification(`最多只能選擇 ${this.maxSelections} 位好友`, 'warning');
            return;
        }
        
        this.updateFriendVisualState(friendEmail);
        this.updateCounter();
        this.updateSendButton();
    }
    
    /**
     * 更新好友視覺狀態
     */
    updateFriendVisualState(friendEmail) {
        const friendItem = this.modal.querySelector(`[data-email="${friendEmail}"]`);
        if (friendItem) {
            if (this.selectedFriends.has(friendEmail)) {
                friendItem.classList.add('selected');
            } else {
                friendItem.classList.remove('selected');
            }
        }
    }
    
    /**
     * 更新計數器
     */
    updateCounter() {
        const count = this.selectedFriends.size;
        this.modal.querySelector('#selectedCount').textContent = `已選擇 ${count} 位好友`;
        this.modal.querySelector('#willSend').textContent = `將發送 ${count} 份邀請`;
    }
    
    /**
     * 更新發送按鈕狀態
     */
    updateSendButton() {
        const sendBtn = this.modal.querySelector('.send-btn');
        const hasSelection = this.selectedFriends.size > 0;
        
        sendBtn.disabled = !hasSelection;
        sendBtn.textContent = hasSelection ? 
            `發送邀請 (${this.selectedFriends.size})` : '發送邀請';
    }
    
    /**
     * 發送邀請
     */
    async sendInvitations() {
        if (this.selectedFriends.size === 0) return;
        
        const sendBtn = this.modal.querySelector('.send-btn');
        const originalText = sendBtn.textContent;
        
        try {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 發送中...';
            
            const response = await fetch('/coopcard/api/send-card-invitation', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    card_id: this.currentCardId,
                    receiver_emails: Array.from(this.selectedFriends)
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`成功發送 ${this.selectedFriends.size} 份邀請！`, 'success');
                this.hide();
            } else {
                this.showNotification('邀請發送失敗: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('發送邀請失敗:', error);
            this.showNotification('邀請發送失敗，請稍後再試', 'error');
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = originalText;
        }
    }
    
    /**
     * 顯示錯誤信息
     */
    showError(message) {
        const friendsList = this.modal.querySelector('#friendsList');
        friendsList.innerHTML = `
            <div class="error-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
    }
    
    /**
     * 顯示通知
     */
    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    /**
     * HTML轉義
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 全域實例
let friendSelectorModal = null;

/**
 * 顯示好友選擇模態框的全域函數
 * 
 * @param {string} cardId 任務卡片ID
 */
function showFriendSelectorModal(cardId) {
    if (!friendSelectorModal) {
        friendSelectorModal = new FriendSelectorModal();
    }
    friendSelectorModal.show(cardId);
}

// 確保在DOM載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('[FriendSelector] 好友選擇模組已載入');
});