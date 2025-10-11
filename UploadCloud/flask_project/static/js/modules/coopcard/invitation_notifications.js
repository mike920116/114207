/**
 * 卡片邀請即時通知系統
 * 負責WebSocket連接和邀請通知的實時處理
 */

class InvitationNotifications {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1秒
        
        this.init();
    }
    
    init() {
        this.initSocket();
        this.setupEventListeners();
    }
    
    initSocket() {
        try {
            // 連接到邀請通知命名空間
            this.socket = io('/invitations', {
                transports: ['websocket'],
                timeout: 5000
            });
            
            this.setupSocketEvents();
            
        } catch (error) {
            console.error('[邀請通知] Socket初始化失敗:', error);
        }
    }
    
    setupSocketEvents() {
        if (!this.socket) return;
        
        // 連接成功
        this.socket.on('connect', () => {
            console.log('[邀請通知] WebSocket連接成功');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // 訂閱當前用戶的邀請通知
            const userEmail = this.getCurrentUserEmail();
            if (userEmail) {
                this.socket.emit('subscribe_to_invitations', {
                    user_email: userEmail
                });
            }
        });
        
        // 斷開連接
        this.socket.on('disconnect', (reason) => {
            console.log('[邀請通知] WebSocket斷開連接:', reason);
            this.isConnected = false;
            
            if (reason === 'io server disconnect') {
                // 服務器主動斷開，需要手動重連
                this.reconnect();
            }
        });
        
        // 連接錯誤
        this.socket.on('connect_error', (error) => {
            console.error('[邀請通知] 連接錯誤:', error);
            this.isConnected = false;
            this.reconnect();
        });
        
        // 收到新邀請
        this.socket.on('invitation_received', (data) => {
            console.log('[邀請通知] 收到新邀請:', data);
            this.handleNewInvitation(data);
        });
        
        // 收到邀請回應
        this.socket.on('invitation_response', (data) => {
            console.log('[邀請通知] 收到邀請回應:', data);
            this.handleInvitationResponse(data);
        });
        
        // 邀請狀態更新
        this.socket.on('invitation_updated', (data) => {
            console.log('[邀請通知] 邀請狀態更新:', data);
            this.handleInvitationUpdate(data);
        });
    }
    
    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[邀請通知] 達到最大重連次數，停止重連');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`[邀請通知] 準備重連 (${this.reconnectAttempts}/${this.maxReconnectAttempts})，延遲 ${delay}ms`);
        
        setTimeout(() => {
            this.initSocket();
        }, delay);
    }
    
    getCurrentUserEmail() {
        // 從全局變量或DOM中獲取當前用戶email
        if (window.userEmail) {
            return window.userEmail;
        }
        
        // 嘗試從meta標籤獲取
        const metaTag = document.querySelector('meta[name="user-email"]');
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        // 其他獲取方式...
        console.warn('[邀請通知] 無法獲取當前用戶email');
        return null;
    }
    
    handleNewInvitation(data) {
        try {
            const invitationData = data.data;
            
            // 顯示桌面通知
            this.showDesktopNotification({
                title: '收到新的任務邀請',
                body: `${invitationData.sender_name} 邀請您參與任務：${invitationData.card_title}`,
                icon: '/static/icons/avatars/default.png'
            });
            
            // 顯示網頁內通知
            this.showWebNotification({
                type: 'invitation',
                title: '新邀請',
                message: `${invitationData.sender_name} 邀請您參與任務「${invitationData.card_title}」`,
                data: invitationData
            });
            
            // 更新UI（如果在邀請頁面）
            this.updateInvitationUI('new', invitationData);
            
            // 更新邀請計數器
            this.updateInvitationCounter('+');
            
        } catch (error) {
            console.error('[邀請通知] 處理新邀請時發生錯誤:', error);
        }
    }
    
    handleInvitationResponse(data) {
        try {
            const responseData = data.data;
            const action = responseData.action === 'accept' ? '接受' : '拒絕';
            
            // 顯示桌面通知
            this.showDesktopNotification({
                title: '邀請回應',
                body: `${responseData.responder_name} ${action}了您的任務邀請`,
                icon: '/static/icons/avatars/default.png'
            });
            
            // 顯示網頁內通知
            this.showWebNotification({
                type: 'response',
                title: '邀請回應',
                message: `${responseData.responder_name} ${action}了您的任務邀請`,
                data: responseData,
                variant: responseData.action === 'accept' ? 'success' : 'info'
            });
            
            // 更新UI（如果在相關頁面）
            this.updateInvitationUI('response', responseData);
            
        } catch (error) {
            console.error('[邀請通知] 處理邀請回應時發生錯誤:', error);
        }
    }
    
    handleInvitationUpdate(data) {
        try {
            // 更新相關UI元素的狀態
            this.updateInvitationUI('update', data);
            
        } catch (error) {
            console.error('[邀請通知] 處理邀請更新時發生錯誤:', error);
        }
    }
    
    showDesktopNotification(options) {
        // 檢查瀏覽器是否支持通知
        if (!('Notification' in window)) {
            console.log('[邀請通知] 瀏覽器不支持桌面通知');
            return;
        }
        
        // 檢查通知權限
        if (Notification.permission === 'granted') {
            this.createDesktopNotification(options);
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.createDesktopNotification(options);
                }
            });
        }
    }
    
    createDesktopNotification(options) {
        const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon,
            badge: options.icon,
            tag: 'invitation-notification',
            requireInteraction: false,
            silent: false
        });
        
        notification.onclick = function() {
            window.focus();
            // 可以跳轉到邀請頁面
            if (window.location.pathname !== '/coopcard/') {
                window.location.href = '/coopcard/';
            }
            notification.close();
        };
        
        // 5秒後自動關閉
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
    
    showWebNotification(options) {
        // 創建並顯示網頁內通知元素
        const notificationElement = this.createNotificationElement(options);
        
        // 添加到通知容器
        let container = document.getElementById('notification-container');
        if (!container) {
            container = this.createNotificationContainer();
        }
        
        container.appendChild(notificationElement);
        
        // 動畫顯示
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);
        
        // 自動隱藏（除非需要用戶交互）
        if (!options.requireInteraction) {
            setTimeout(() => {
                this.hideNotification(notificationElement);
            }, 5000);
        }
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'invitation-notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    createNotificationElement(options) {
        const element = document.createElement('div');
        element.className = `invitation-notification ${options.type} ${options.variant || 'info'}`;
        element.style.cssText = `
            background: white;
            border-left: 4px solid ${options.variant === 'success' ? '#28a745' : '#17a2b8'};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            margin-bottom: 10px;
            padding: 16px;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            cursor: pointer;
        `;
        
        element.innerHTML = `
            <div class="notification-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h6 style="margin: 0; color: #333; font-weight: 600;">${options.title}</h6>
                <button class="close-btn" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #999;">&times;</button>
            </div>
            <div class="notification-body" style="color: #666; font-size: 14px;">
                ${options.message}
            </div>
        `;
        
        // 關閉按鈕事件
        const closeBtn = element.querySelector('.close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideNotification(element);
        });
        
        // 點擊通知事件
        element.addEventListener('click', () => {
            this.handleNotificationClick(options);
            this.hideNotification(element);
        });
        
        return element;
    }
    
    hideNotification(element) {
        element.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }
    
    handleNotificationClick(options) {
        // 根據通知類型處理點擊事件
        if (options.type === 'invitation') {
            // 跳轉到邀請頁面或直接處理
            if (window.location.pathname !== '/coopcard/') {
                window.location.href = '/coopcard/';
            }
        } else if (options.type === 'response') {
            // 可能跳轉到任務詳情頁
        }
    }
    
    updateInvitationUI(type, data) {
        // 根據當前頁面更新相關UI
        switch (type) {
            case 'new':
                this.updateNewInvitationUI(data);
                break;
            case 'response':
                this.updateResponseUI(data);
                break;
            case 'update':
                this.updateStatusUI(data);
                break;
        }
    }
    
    updateNewInvitationUI(data) {
        // 如果當前在邀請頁面，動態添加新邀請
        const invitationsList = document.querySelector('#invitations-list');
        if (invitationsList) {
            // 重新加載邀請列表或動態添加
            if (typeof window.refreshInvitations === 'function') {
                window.refreshInvitations();
            }
        }
    }
    
    updateResponseUI(data) {
        // 更新發送的邀請狀態顯示
        // 這裡可以更新邀請管理頁面的狀態
    }
    
    updateStatusUI(data) {
        // 更新邀請狀態指示器
        const statusElements = document.querySelectorAll(`[data-invitation-id="${data.invitation_id}"]`);
        statusElements.forEach(element => {
            element.dataset.status = data.status;
            // 更新視覺狀態
        });
    }
    
    updateInvitationCounter(operation) {
        const counter = document.querySelector('#invitation-counter, .invitation-badge');
        if (counter) {
            let currentCount = parseInt(counter.textContent) || 0;
            
            if (operation === '+') {
                currentCount++;
            } else if (operation === '-') {
                currentCount = Math.max(0, currentCount - 1);
            }
            
            counter.textContent = currentCount;
            counter.style.display = currentCount > 0 ? 'inline' : 'none';
        }
    }
    
    setupEventListeners() {
        // 請求桌面通知權限（如果尚未請求）
        document.addEventListener('DOMContentLoaded', () => {
            this.requestNotificationPermission();
        });
        
        // 頁面可見性變化處理
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !this.isConnected) {
                this.reconnect();
            }
        });
    }
    
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            // 可以顯示一個友好的提示框
            setTimeout(() => {
                Notification.requestPermission().then(permission => {
                    console.log('[邀請通知] 通知權限:', permission);
                });
            }, 2000); // 延遲2秒請求，避免打擾用戶
        }
    }
    
    // 公共方法
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }
    
    reconnectManually() {
        this.reconnectAttempts = 0;
        this.reconnect();
    }
    
    isSocketConnected() {
        return this.isConnected;
    }
}

// 全局實例
window.InvitationNotifications = InvitationNotifications;

// 自動初始化（如果在CoopCard相關頁面）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('/coopcard')) {
            window.invitationNotifications = new InvitationNotifications();
        }
    });
} else {
    if (window.location.pathname.includes('/coopcard')) {
        window.invitationNotifications = new InvitationNotifications();
    }
}