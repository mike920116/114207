/**
 * 邀請卡片管理系統
 * 負責邀請卡片的顯示、交互和狀態管理
 */

class InvitationCardManager {
    constructor() {
        this.container = null;
        this.invitations = [];
        this.isLoading = false;
        this.lastRefreshTime = 0;
        // 已刪除定期刷新功能 - 根據用戶要求暫時移除
        // this.refreshInterval = 30000;
        // this.autoRefreshTimer = null;
        
        this.init();
    }
    
    init() {
        this.findContainer();
        this.setupEventListeners();
        this.loadInvitations();
        // 已刪除自動刷新啟動 - 根據用戶要求暫時移除
        // this.startAutoRefresh();
    }
    
    findContainer() {
        this.container = document.querySelector('.cards-inbox-content');
        if (!this.container) {
            console.error('[邀請卡片] 找不到邀請卡片容器');
            return false;
        }
        return true;
    }
    
    setupEventListeners() {
        // 監聽WebSocket邀請通知
        if (window.invitationNotifications) {
            document.addEventListener('invitation_received', (e) => {
                this.handleNewInvitation(e.detail);
            });
            
            document.addEventListener('invitation_response', (e) => {
                this.handleInvitationResponse(e.detail);
            });
        }
        
        // 監聽頁面可見性變化
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.refreshInvitations();
            }
        });
        
        // 全局刷新函數
        window.refreshInvitations = () => this.refreshInvitations();
    }
    
    async loadInvitations() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const response = await fetch('/coopcard/api/card-invitations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.invitations = data.invitations || [];
                this.renderInvitations();
                this.lastRefreshTime = Date.now();
            } else {
                throw new Error(data.message || '載入邀請失敗');
            }
            
        } catch (error) {
            console.error('[邀請卡片] 載入邀請失敗:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
        }
    }
    
    async refreshInvitations() {
        // 防止頻繁刷新
        const now = Date.now();
        if (now - this.lastRefreshTime < 5000) {
            return;
        }
        
        await this.loadInvitations();
    }
    
    renderInvitations() {
        if (!this.container) return;
        
        // 渲染前：保存滾動位置 - 階段二優化
        this.preserveScrollPosition();
        
        if (this.invitations.length === 0) {
            this.showEmpty();
            return;
        }
        
        const invitationsHtml = this.invitations.map(invitation => 
            this.renderInvitationCard(invitation)
        ).join('');
        
        this.container.innerHTML = invitationsHtml;
        
        // 添加事件監聽器
        this.attachCardEventListeners();
        
        // 添加動畫效果
        this.animateCards();
        
        // 渲染後：恢復滾動位置 - 階段二優化
        this.restoreScrollPosition();
    }
    
    renderInvitationCard(invitation) {
        // 判斷卡片類型（綠色 vs 藍色主題）
        const cardData = invitation.card_data || invitation.card_snapshot || {};
        const currentUserEmail = window.currentUserEmail || window.userEmail || '';
        const isOwnCard = cardData.user_id === currentUserEmail;
        const cardTheme = isOwnCard ? 'own-card' : 'friend-card';
        
        const timeAgo = this.formatTimeAgo(invitation.created_at);
        const senderInfo = invitation.sender_info || {};
        const senderName = senderInfo.name || invitation.sender_name || '未知用戶';
        const senderAvatar = senderInfo.avatar || '/static/icons/avatars/default.png';
        
        // 解析卡片快照
        const taskTitle = cardData.title || '未知任務';
        const taskContent = cardData.content || '';
        const taskStamp = cardData.stamp_icon || '📝';
        const dailyExecutions = cardData.daily_executions || 1;
        const durationDays = cardData.duration_days || 1;
        const maxParticipants = cardData.max_participants || 1;
        
        const invitationMessage = invitation.message || invitation.invitation_message || '';
        const status = invitation.status || 'pending';
        
        return `
            <div class="invitation-message-bubble ${cardTheme}" 
                 data-invitation-id="${invitation.id}"
                 data-status="${status}">
                
                <!-- 發送者資訊區域（聊天泡泡風格） -->
                <div class="invitation-sender-header">
                    <div class="sender-avatar">
                        <img src="${senderAvatar}" alt="${this.escapeHtml(senderName)}" 
                             onerror="this.src='/static/icons/avatars/default.png'">
                    </div>
                    <div class="sender-info">
                        <div class="sender-name">${this.escapeHtml(senderName)}</div>
                        ${senderInfo.user_id ? `<div class="sender-userid">用戶ID: ${this.escapeHtml(senderInfo.user_id)}</div>` : '<div class="sender-no-userid">尚未設定用戶ID</div>'}
                        <div class="invitation-time">${timeAgo}</div>
                    </div>
                </div>
                
                <!-- 邀請訊息區域 -->
                ${invitationMessage ? `
                    <div class="invitation-message-content">
                        <div class="message-bubble">
                            <i class="fas fa-envelope" style="margin-right: 8px; opacity: 0.7;"></i>
                            ${this.escapeHtml(invitationMessage)}
                        </div>
                    </div>
                ` : ''}
                
                <!-- 任務卡片內容區域（與任務清單一致的樣式） -->
                <div class="invitation-card-content">
                    <div class="task-card-preview-inline ${cardTheme}">
                        <div class="card-stamp-mini">
                            <i class="${taskStamp}"></i>
                        </div>
                        <div class="card-header-mini">
                            <div class="card-icon-mini">
                                <i class="${taskStamp}"></i>
                            </div>
                            <div class="card-details-mini">
                                <h5>${this.escapeHtml(taskTitle)}</h5>
                                ${taskContent ? `<p>${this.escapeHtml(taskContent)}</p>` : ''}
                            </div>
                        </div>
                        <div class="card-meta-mini">
                            <span class="meta-badge">執行 ${dailyExecutions}次/天</span>
                            <span class="meta-badge">持續 ${durationDays}天</span>
                            <span class="meta-badge">上限 ${maxParticipants}人</span>
                        </div>
                    </div>
                </div>
                
                <!-- 操作按鈕區域（外置） -->
                ${this.renderExternalActionButtons(invitation)}
            </div>
        `;
    }
    
    renderExternalActionButtons(invitation) {
        const status = invitation.status || 'pending';
        
        switch (status) {
            case 'pending':
                return `
                    <div class="invitation-actions-external">
                        <button class="invitation-btn-external btn-accept" 
                                data-action="accept" 
                                data-invitation-id="${invitation.id}"
                                title="接受邀請">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="invitation-btn-external btn-reject" 
                                data-action="reject" 
                                data-invitation-id="${invitation.id}"
                                title="拒絕邀請">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                
            case 'accepted':
                return `
                    <div class="invitation-actions-external">
                        <button class="invitation-btn-external btn-view" 
                                data-action="view" 
                                data-card-id="${invitation.card_id}"
                                title="查看任務">
                            <i class="fas fa-eye"></i>
                        </button>
                        <div class="status-indicator accepted">
                            <i class="fas fa-check-circle"></i>
                            <span>已接受</span>
                        </div>
                    </div>
                `;
                
            case 'rejected':
                return `
                    <div class="invitation-actions-external">
                        <div class="status-indicator rejected">
                            <i class="fas fa-times-circle"></i>
                            <span>已拒絕</span>
                        </div>
                    </div>
                `;
                
            default:
                return '';
        }
    }
    
    attachCardEventListeners() {
        if (!this.container) return;
        
        // 邀請回應按鈕（更新為新的類名）
        this.container.addEventListener('click', async (e) => {
            const button = e.target.closest('.invitation-btn-external');
            if (!button) return;
            
            const action = button.dataset.action;
            const invitationId = button.dataset.invitationId;
            const cardId = button.dataset.cardId;
            
            if (action === 'view' && cardId) {
                this.viewTaskCard(cardId);
                return;
            }
            
            if ((action === 'accept' || action === 'reject') && invitationId) {
                await this.respondToInvitation(invitationId, action, button);
            }
        });
    }
    
    async respondToInvitation(invitationId, action, button) {
        // 防止重複點擊
        if (button.disabled) return;
        
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 處理中...';
        
        try {
            const response = await fetch('/coopcard/api/respond-card-invitation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    invitation_id: invitationId,
                    action: action
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 顯示成功訊息
                this.showSuccessMessage(data.message);
                
                // 更新UI
                this.updateInvitationStatus(invitationId, action === 'accept' ? 'accepted' : 'rejected');
                
                // 刷新邀請列表
                setTimeout(() => {
                    this.refreshInvitations();
                }, 1000);
                
                // 如果接受邀請，也刷新任務卡片列表
                if (action === 'accept' && typeof loadTaskCards === 'function') {
                    setTimeout(() => {
                        loadTaskCards();
                    }, 1500);
                }
                
            } else {
                throw new Error(data.message || '操作失敗');
            }
            
        } catch (error) {
            console.error(`[邀請卡片] ${action}邀請失敗:`, error);
            this.showErrorMessage(`${action === 'accept' ? '接受' : '拒絕'}邀請失敗: ${error.message}`);
            
            // 復原按鈕
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
    
    updateInvitationStatus(invitationId, newStatus) {
        const card = document.querySelector(`[data-invitation-id="${invitationId}"]`);
        if (card) {
            card.dataset.status = newStatus;
            
            // 更新狀態徽章
            const statusBadge = card.querySelector('.invitation-status-badge');
            if (statusBadge) {
                statusBadge.className = `invitation-status-badge status-${newStatus}`;
                statusBadge.textContent = this.getStatusText(newStatus);
            }
            
            // 更新操作按鈕
            const actionsContainer = card.querySelector('.invitation-actions');
            if (actionsContainer) {
                const invitation = this.invitations.find(inv => inv.id.toString() === invitationId);
                if (invitation) {
                    invitation.status = newStatus;
                    actionsContainer.outerHTML = this.renderExternalActionButtons(invitation);
                }
            }
        }
    }
    
    viewTaskCard(cardId) {
        // 跳轉到任務卡片詳情頁或打開模態框
        console.log('[邀請卡片] 查看任務卡片:', cardId);
        // 這裡可以實現跳轉邏輯或打開任務詳情模態框
    }
    
    handleNewInvitation(invitationData) {
        // 添加到列表頂部
        this.invitations.unshift(invitationData);
        
        // 重新渲染
        this.renderInvitations();
        
        // 高亮新邀請
        setTimeout(() => {
            const newCard = document.querySelector(`[data-invitation-id="${invitationData.id}"]`);
            if (newCard) {
                newCard.classList.add('new-invitation');
                
                // 5秒後移除高亮
                setTimeout(() => {
                    newCard.classList.remove('new-invitation');
                }, 5000);
            }
        }, 100);
    }
    
    handleInvitationResponse(responseData) {
        // 更新相應的邀請狀態
        const invitation = this.invitations.find(inv => 
            inv.id.toString() === responseData.invitation_id.toString()
        );
        
        if (invitation) {
            invitation.status = responseData.status;
            this.updateInvitationStatus(responseData.invitation_id.toString(), responseData.status);
        }
    }
    
    animateCards() {
        const cards = this.container.querySelectorAll('.invitation-card-enter');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animationDelay = `${index * 0.1}s`;
            }, 50);
        });
    }
    
    showLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="invitation-loading">
                <div class="spinner"></div>
                <span>載入邀請中...</span>
            </div>
        `;
    }
    
    showEmpty() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="invitations-empty">
                <div class="empty-icon">📮</div>
                <h6>沒有邀請</h6>
                <p>目前沒有收到任何任務卡片邀請<br>當好友邀請您協作時，邀請將會顯示在這裡</p>
            </div>
        `;
    }
    
    showError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="invitations-error">
                <div class="error-icon">⚠️</div>
                <div>載入邀請失敗</div>
                <div style="font-size: 12px; margin-top: 5px;">${this.escapeHtml(message)}</div>
                <button onclick="window.invitationCardManager.loadInvitations()">
                    重新載入
                </button>
            </div>
        `;
    }
    
    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }
    
    showErrorMessage(message) {
        this.showToast(message, 'error');
    }
    
    showToast(message, type = 'info') {
        // 創建Toast通知
        const toast = document.createElement('div');
        toast.className = `invitation-toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-size: 14px;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 動畫顯示
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // 3秒後隱藏
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // 滾動位置管理方法 - 階段二優化
    preserveScrollPosition() {
        // 找到實際的滾動容器（.widget-content）
        const scrollContainer = this.container.closest('.widget-content');
        if (scrollContainer) {
            this.savedScrollTop = scrollContainer.scrollTop;
            console.log('[滾動保存] 保存位置:', this.savedScrollTop);
        }
    }

    restoreScrollPosition() {
        // 延遲恢復，確保DOM已更新
        setTimeout(() => {
            const scrollContainer = this.container.closest('.widget-content');
            if (scrollContainer && this.savedScrollTop !== undefined) {
                scrollContainer.scrollTop = this.savedScrollTop;
                console.log('[滾動恢復] 恢復位置:', this.savedScrollTop);
            }
        }, 50);
    }
    
    // 已暫時刪除自動刷新功能 - 根據用戶要求
    /*
    startAutoRefresh() {
        this.stopAutoRefresh();
        
        this.autoRefreshTimer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.refreshInvitations();
            }
        }, this.refreshInterval);
    }
    
    stopAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
    }
    */
    
    // 輔助函數
    formatTimeAgo(timestamp) {
        try {
            const now = new Date();
            const time = new Date(timestamp);
            const diffInSeconds = Math.floor((now - time) / 1000);
            
            if (diffInSeconds < 60) {
                return '剛剛';
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                return `${minutes}分鐘前`;
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                return `${hours}小時前`;
            } else {
                const days = Math.floor(diffInSeconds / 86400);
                return `${days}天前`;
            }
        } catch (error) {
            return '未知時間';
        }
    }
    
    getSenderInitial(senderName) {
        if (!senderName) return '?';
        return senderName.charAt(0).toUpperCase();
    }
    
    getStatusText(status) {
        switch (status) {
            case 'pending': return '待處理';
            case 'accepted': return '已接受';
            case 'rejected': return '已拒絕';
            default: return '未知';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 公共方法
    destroy() {
        // 已刪除自動刷新功能，無需停止定時器
        // this.stopAutoRefresh();
        
        if (this.container) {
            this.container.removeEventListener('click', this.handleCardClick);
        }
        
        // 清理全局引用
        if (window.invitationCardManager === this) {
            delete window.invitationCardManager;
        }
    }
    
    getInvitationsCount() {
        return this.invitations.filter(inv => inv.status === 'pending').length;
    }
    
    getInvitations() {
        return [...this.invitations];
    }
}

// 全局引用
window.InvitationCardManager = InvitationCardManager;

// 自動初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.cards-inbox-content')) {
            window.invitationCardManager = new InvitationCardManager();
        }
    });
} else {
    if (document.querySelector('.cards-inbox-content')) {
        window.invitationCardManager = new InvitationCardManager();
    }
}