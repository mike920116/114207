/**
 * CoopCard 內聯編輯功能專用 JavaScript
 * 用於任務卡片的內聯編輯、提交和列表顯示功能
 * 
 * 依賴：
 * - coopcard_main.js 中的 showNotification 和 escapeHtml 函數
 * - /coopcard/api/save-task-card 和 /coopcard/api/get-task-cards API端點
 */

// ===== 任務卡片拖拽管理器 (模組化) =====

/**
 * 任務卡片拖拽管理器類
 * 負責處理卡片的拖拽刪除功能
 */
class TaskCardDragManager {
    constructor(options = {}) {
        this.container = options.container || '#taskCardsGrid';
        this.draggableSelector = options.draggableSelector || '.task-card-item';
        this.deleteZone = options.deleteZone || '#deleteDropZone';
        this.inviteZone = options.inviteZone || '#inviteDropZone';
        this.storeZone = options.storeZone || '#storeDropZone';
        this.onDelete = options.onDelete || this.defaultDeleteHandler;
        this.onInvite = options.onInvite || this.defaultInviteHandler;
        this.onStore = options.onStore || this.defaultStoreHandler;
        this.showNotification = options.showNotification || window.showNotification;
        
        // 內部狀態
        this.draggedCard = null;
        this.isDragging = false;
        this.dragVisualHelper = null;
        this.rafId = null;
        
        // 綁定方法到正確的this上下文
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleDeleteZoneDragOver = this.handleDeleteZoneDragOver.bind(this);
        this.handleDeleteZoneDragLeave = this.handleDeleteZoneDragLeave.bind(this);
        this.handleDeleteZoneDrop = this.handleDeleteZoneDrop.bind(this);
        this.handleInviteZoneDragOver = this.handleInviteZoneDragOver.bind(this);
        this.handleInviteZoneDragLeave = this.handleInviteZoneDragLeave.bind(this);
        this.handleInviteZoneDrop = this.handleInviteZoneDrop.bind(this);
        this.handleStoreZoneDragOver = this.handleStoreZoneDragOver.bind(this);
        this.handleStoreZoneDragLeave = this.handleStoreZoneDragLeave.bind(this);
        this.handleStoreZoneDrop = this.handleStoreZoneDrop.bind(this);
        this.handleDocumentDragOver = this.handleDocumentDragOver.bind(this);
    }
    
    /**
     * 初始化拖拽管理器
     */
    init() {
        console.log('[DragManager] 初始化任務卡片拖拽管理器...');
        this.initializeDeleteZone();
        this.initializeInviteZone();
        this.initializeStoreZone();
        this.initializeDocumentEvents();
        this.attachEventListenersToExistingCards();
        console.log('[DragManager] 任務卡片拖拽管理器初始化完成');
    }
    
    /**
     * 銷毀拖拽管理器，清理所有事件監聽器
     */
    destroy() {
        this.cleanupDragState();
        this.removeDocumentEvents();
        console.log('[DragManager] 任務卡片拖拽管理器已銷毀');
    }
    
    /**
     * 為新卡片添加拖拽事件監聽器
     */
    attachDragListeners(cardElement) {
        if (!cardElement || !cardElement.classList.contains('task-card-item')) {
            return;
        }
        
        cardElement.draggable = true;
        cardElement.addEventListener('dragstart', this.handleDragStart);
        cardElement.addEventListener('dragend', this.handleDragEnd);
    }
    
    /**
     * 為現有卡片添加拖拽事件監聽器
     */
    attachEventListenersToExistingCards() {
        const container = document.querySelector(this.container);
        if (!container) return;
        
        const cards = container.querySelectorAll(this.draggableSelector);
        cards.forEach(card => this.attachDragListeners(card));
    }
    
    /**
     * 初始化刪除區域事件監聽器
     */
    initializeDeleteZone() {
        const deleteZone = document.querySelector(this.deleteZone);
        if (!deleteZone) return;
        
        deleteZone.addEventListener('dragover', this.handleDeleteZoneDragOver);
        deleteZone.addEventListener('dragleave', this.handleDeleteZoneDragLeave);
        deleteZone.addEventListener('drop', this.handleDeleteZoneDrop);
    }
    
    /**
     * 初始化邀請區域事件監聽器
     */
    initializeInviteZone() {
        const inviteZone = document.querySelector(this.inviteZone);
        if (!inviteZone) return;
        
        inviteZone.addEventListener('dragover', this.handleInviteZoneDragOver);
        inviteZone.addEventListener('dragleave', this.handleInviteZoneDragLeave);
        inviteZone.addEventListener('drop', this.handleInviteZoneDrop);
    }
    
    /**
     * 初始化結算區域事件監聽器
     */
    initializeStoreZone() {
        const storeZone = document.querySelector(this.storeZone);
        if (!storeZone) return;
        
        storeZone.addEventListener('dragover', this.handleStoreZoneDragOver);
        storeZone.addEventListener('dragleave', this.handleStoreZoneDragLeave);
        storeZone.addEventListener('drop', this.handleStoreZoneDrop);
    }
    
    /**
     * 初始化文件級別事件監聽器
     */
    initializeDocumentEvents() {
        document.addEventListener('dragover', this.handleDocumentDragOver);
    }
    
    /**
     * 移除文件級別事件監聽器
     */
    removeDocumentEvents() {
        document.removeEventListener('dragover', this.handleDocumentDragOver);
    }
    
    /**
     * 處理拖拽開始事件
     */
    handleDragStart(e) {
        console.log('[DragManager] 拖拽開始:', e.target);
        
        this.draggedCard = e.target;
        this.isDragging = true;
        
        const cardId = e.target.getAttribute('data-card-id');
        e.dataTransfer.setData('text/plain', cardId);
        e.dataTransfer.effectAllowed = 'move';
        
        // 創建透明的拖拽影像
        const dragImage = this.createDragImage();
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        
        // 創建視覺輔助元素並啟用拖拽區域
        setTimeout(() => {
            this.createVisualHelper(e.target);
            this.applyDragStyles();
            this.activateDragZones();
        }, 0);
    }
    
    /**
     * 處理拖拽結束事件
     */
    handleDragEnd(e) {
        console.log('[DragManager] 拖拽結束:', e.target);
        this.cleanupDragState();
    }
    
    /**
     * 處理刪除區域dragover事件
     */
    handleDeleteZoneDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.target.closest(this.deleteZone).classList.add('drag-over');
    }
    
    /**
     * 處理刪除區域dragleave事件
     */
    handleDeleteZoneDragLeave(e) {
        const deleteZone = e.target.closest(this.deleteZone);
        if (deleteZone && !deleteZone.contains(e.relatedTarget)) {
            deleteZone.classList.remove('drag-over');
        }
    }
    
    /**
     * 處理刪除區域drop事件
     */
    handleDeleteZoneDrop(e) {
        e.preventDefault();
        const deleteZone = e.target.closest(this.deleteZone);
        deleteZone.classList.remove('drag-over', 'drag-ready');
        
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId && this.draggedCard) {
            console.log('[DragManager] 刪除卡片:', cardId);
            this.onDelete(cardId);
        }
    }
    
    /**
     * 處理邀請區域dragover事件
     */
    handleInviteZoneDragOver(e) {
        e.preventDefault();
        const inviteZone = e.target.closest(this.inviteZone);
        if (inviteZone && this.isDragging) {
            inviteZone.classList.add('drag-over');
        }
    }
    
    /**
     * 處理邀請區域dragleave事件
     */
    handleInviteZoneDragLeave(e) {
        const inviteZone = e.target.closest(this.inviteZone);
        if (inviteZone && !inviteZone.contains(e.relatedTarget)) {
            inviteZone.classList.remove('drag-over');
        }
    }
    
    /**
     * 處理邀請區域drop事件
     */
    handleInviteZoneDrop(e) {
        e.preventDefault();
        const inviteZone = e.target.closest(this.inviteZone);
        inviteZone.classList.remove('drag-over');
        
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId && this.draggedCard) {
            console.log('[DragManager] 邀請卡片:', cardId);
            this.onInvite(cardId);
        }
    }
    
    /**
     * 處理結算區域dragover事件
     */
    handleStoreZoneDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const storeZone = e.target.closest(this.storeZone);
        if (storeZone) {
            storeZone.classList.add('drag-over');
        }
    }
    
    /**
     * 處理結算區域dragleave事件
     */
    handleStoreZoneDragLeave(e) {
        const storeZone = e.target.closest(this.storeZone);
        if (storeZone && !storeZone.contains(e.relatedTarget)) {
            storeZone.classList.remove('drag-over');
        }
    }
    
    /**
     * 處理結算區域drop事件
     */
    handleStoreZoneDrop(e) {
        e.preventDefault();
        const storeZone = e.target.closest(this.storeZone);
        storeZone.classList.remove('drag-over');
        
        const cardId = e.dataTransfer.getData('text/plain');
        if (cardId && this.draggedCard) {
            console.log('[DragManager] 結算卡片:', cardId);
            this.onStore(cardId);
        }
    }
    
    /**
     * 處理文件dragover事件（更新視覺輔助元素位置）
     */
    handleDocumentDragOver(e) {
        if (this.isDragging && this.dragVisualHelper) {
            this.updateVisualHelperPosition(e);
        }
    }
    
    /**
     * 創建透明的拖拽影像
     */
    createDragImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.globalAlpha = 0;
        ctx.fillRect(0, 0, 1, 1);
        return canvas;
    }
    
    /**
     * 創建視覺輔助元素
     */
    createVisualHelper(originalCard) {
        this.dragVisualHelper = originalCard.cloneNode(true);
        
        const helper = this.dragVisualHelper;
        helper.style.position = 'fixed';
        helper.style.zIndex = '10000';
        helper.style.pointerEvents = 'none';
        helper.style.transform = 'rotate(3deg) scale(1.08)';
        helper.style.boxShadow = '0 15px 40px rgba(100, 255, 218, 0.4), 0 5px 15px rgba(0,0,0,0.3)';
        helper.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        helper.style.opacity = '0.95';
        helper.style.border = '2px solid rgba(100, 255, 218, 0.6)';
        
        helper.removeAttribute('draggable');
        helper.removeAttribute('data-card-id');
        helper.classList.add('drag-visual-helper');
        
        const rect = originalCard.getBoundingClientRect();
        helper.style.width = rect.width + 'px';
        helper.style.height = rect.height + 'px';
        
        document.body.appendChild(helper);
    }
    
    /**
     * 應用拖拽時的樣式到原卡片
     */
    applyDragStyles() {
        if (this.draggedCard) {
            this.draggedCard.style.opacity = '0.4';
            this.draggedCard.style.transform = 'scale(0.98)';
            this.draggedCard.classList.add('dragging');
        }
    }
    
    /**
     * 啟用拖拽區域
     */
    activateDragZones() {
        const deleteZone = document.querySelector(this.deleteZone);
        if (deleteZone) {
            deleteZone.classList.add('drag-ready');
        }
        
        const inviteZone = document.querySelector(this.inviteZone);
        if (inviteZone) {
            inviteZone.classList.add('drag-ready');
        }
        
        const storeZone = document.querySelector(this.storeZone);
        if (storeZone) {
            storeZone.classList.add('drag-ready');
        }
    }
    
    /**
     * 更新視覺輔助元素位置
     */
    updateVisualHelperPosition(e) {
        if (!this.dragVisualHelper) return;
        
        const x = e.clientX;
        const y = e.clientY;
        
        this.dragVisualHelper.style.left = (x - this.dragVisualHelper.offsetWidth / 2) + 'px';
        this.dragVisualHelper.style.top = (y - this.dragVisualHelper.offsetHeight / 2) + 'px';
    }
    
    /**
     * 清理拖拽狀態
     */
    cleanupDragState() {
        console.log('[DragManager] 清理拖拽狀態');
        
        // 取消RAF更新
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        // 清理視覺輔助元素
        if (this.dragVisualHelper && this.dragVisualHelper.parentNode) {
            this.dragVisualHelper.parentNode.removeChild(this.dragVisualHelper);
            this.dragVisualHelper = null;
        }
        
        // 清理原卡片樣式
        if (this.draggedCard) {
            this.draggedCard.style.opacity = '';
            this.draggedCard.style.transform = '';
            this.draggedCard.style.filter = '';
            this.draggedCard.classList.remove('dragging');
        }
        
        // 停用拖拽區域
        const deleteZone = document.querySelector(this.deleteZone);
        if (deleteZone) {
            deleteZone.classList.remove('drag-ready', 'drag-over');
        }
        
        const inviteZone = document.querySelector(this.inviteZone);
        if (inviteZone) {
            inviteZone.classList.remove('drag-ready', 'drag-over');
        }
        
        const storeZone = document.querySelector(this.storeZone);
        if (storeZone) {
            storeZone.classList.remove('drag-ready', 'drag-over');
        }
        
        // 重置拖拽變數
        this.draggedCard = null;
        this.isDragging = false;
        
        console.log('[DragManager] 拖拽狀態清理完成');
    }
    
    /**
     * 預設刪除處理器（升級版：根據卡片類型執行不同動作）
     */
    defaultDeleteHandler(cardId) {
        console.log('[DragManager] 處理卡片移除:', cardId);
        
        // 取得卡片元素和所有者資訊
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (!cardElement) {
            console.error('[DragManager] 找不到卡片元素');
            return;
        }
        
        // 檢查是否為卡片擁有者
        const isOwnerAttr = cardElement.getAttribute('data-card-owner');
        const userRole = cardElement.getAttribute('data-user-role');
        
        // 優先使用 data-card-owner 判斷（更可靠）
        const isOwner = isOwnerAttr === 'true';
        
        // 取得卡片標題
        let cardTitle = '未命名任務';
        const cardData = cardElement.getAttribute('data-card-data');
        if (cardData) {
            try {
                const card = JSON.parse(cardData);
                cardTitle = card.title || '未命名任務';
            } catch (e) {
                console.error('[DragManager] 解析卡片資料失敗:', e);
            }
        }
        
        console.log('[DragManager] 卡片資訊詳情:');
        console.log('  - cardId:', cardId);
        console.log('  - data-card-owner:', isOwnerAttr);
        console.log('  - data-user-role:', userRole);
        console.log('  - isOwner (判斷結果):', isOwner);
        console.log('  - cardTitle:', cardTitle);
        
        // 根據 is_owner 判斷執行刪除或退出
        if (isOwner) {
            // 綠色卡片 - 刪除
            console.log('[DragManager] ✅ 判斷為擁有者，執行刪除動作');
            if (typeof showDeleteConfirmModal === 'function') {
                showDeleteConfirmModal(cardId, cardTitle);
            } else if (typeof deleteTaskCard === 'function') {
                deleteTaskCard(cardId);
            } else {
                console.warn('[DragManager] showDeleteConfirmModal 和 deleteTaskCard 函數都不存在');
            }
        } else {
            // 藍色卡片 - 退出
            console.log('[DragManager] ✅ 判斷為參與者，執行退出動作');
            if (typeof showLeaveConfirmModal === 'function') {
                showLeaveConfirmModal(cardId, cardTitle);
            } else {
                console.warn('[DragManager] showLeaveConfirmModal 函數不存在');
                alert('退出功能尚未實作');
            }
        }
    }
    
    /**
     * 預設邀請處理器
     */
    defaultInviteHandler(cardId) {
        console.log('[DragManager] 預設邀請處理器:', cardId);
        if (typeof showFriendSelectorModal === 'function') {
            showFriendSelectorModal(cardId);
        } else {
            console.warn('[DragManager] showFriendSelectorModal 函數不存在');
        }
    }
    
    /**
     * 預設結算處理器
     */
    defaultStoreHandler(cardId) {
        console.log('[DragManager] 預設結算處理器:', cardId);
        
        // 取得卡片元素和標題
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        let cardTitle = '未命名任務';
        
        if (cardElement) {
            const cardData = cardElement.getAttribute('data-card-data');
            if (cardData) {
                try {
                    const card = JSON.parse(cardData);
                    cardTitle = card.title || '未命名任務';
                } catch (e) {
                    console.error('[DragManager] 解析卡片資料失敗:', e);
                }
            }
        }
        
        // 顯示自定義確認視窗
        if (typeof showStoreConfirmModal === 'function') {
            showStoreConfirmModal(cardId, cardTitle);
        } else {
            console.warn('[DragManager] showStoreConfirmModal 函數不存在，使用預設 confirm');
            // 備用方案：使用瀏覽器原生 confirm
            if (confirm('確定要結算這個任務卡片嗎？\n\n結算後的卡片將移至「已結算任務」區域，您可以隨時復活它。')) {
                if (typeof executeStoreCard === 'function') {
                    executeStoreCard(cardId);
                }
            }
        }
    }
}


// ===== 全域拖拽管理器實例 =====
let taskCardDragManager = null;

// 任務卡片相關全域變數
let selectedStampIcon = 'fas fa-leaf';
let isSubmitting = false;

// 初始化任務卡片功能
function initializeTaskCardEditor() {
    console.log('[DEBUG] 初始化任務卡片編輯器...');
    
    initializeStampSelector();
    initializeEditableContent();
    initializeSubmitButton();
    
    // 初始化新的設定組件
    initializeNumberInput();
    initializeDatePicker();
    initializeRatingScale();
    
    // 初始化拖拽管理器
    if (!taskCardDragManager) {
        taskCardDragManager = new TaskCardDragManager({
            container: '#taskCardsGrid',
            draggableSelector: '.task-card-item',
            deleteZone: '#deleteDropZone',
            inviteZone: '#inviteDropZone',
            storeZone: '#storeDropZone',
            // 移除 onDelete 參數，使用內建的 defaultDeleteHandler（會自動判斷刪除/退出）
            onInvite: function(cardId) {
                if (typeof showFriendSelectorModal === 'function') {
                    showFriendSelectorModal(cardId);
                } else {
                    console.warn('[拖拽管理器] showFriendSelectorModal 函數不存在');
                }
            },
            showNotification: typeof showNotification === 'function' ? showNotification : console.log
        });
        taskCardDragManager.init();
    }
    
    loadTaskCards();
    
    console.log('[DEBUG] 任務卡片編輯器初始化完成');
}

// 初始化郵戳圖標選擇
function initializeStampSelector() {
    const stampIcons = document.querySelectorAll('.stamp-icon');
    
    stampIcons.forEach(stamp => {
        stamp.addEventListener('click', function() {
            // 移除其他圖標的active狀態
            stampIcons.forEach(s => s.classList.remove('active'));
            
            // 添加當前圖標的active狀態
            this.classList.add('active');
            
            // 更新選中的圖標
            selectedStampIcon = this.getAttribute('data-icon');
            
            console.log('[DEBUG] 選中郵戳圖標:', selectedStampIcon);
        });
    });
}

// 初始化可編輯內容
function initializeEditableContent() {
    const editableTitle = document.getElementById('editableTitle');
    const editableContent = document.getElementById('editableContent');
    
    if (editableTitle) {
        // 標題編輯事件
        editableTitle.addEventListener('focus', function() {
            if (this.textContent === '點擊輸入任務標題...') {
                this.textContent = '';
            }
            this.classList.add('editing');
        });
        
        editableTitle.addEventListener('blur', function() {
            if (this.textContent.trim() === '') {
                this.textContent = '點擊輸入任務標題...';
            }
            this.classList.remove('editing');
        });
        
        editableTitle.addEventListener('input', function() {
            // 限制標題長度
            if (this.textContent.length > 100) {
                this.textContent = this.textContent.substring(0, 100);
                
                // 檢查 showNotification 函數是否存在（來自 coopcard_main.js）
                if (typeof showNotification === 'function') {
                    showNotification('標題長度不能超過100個字符', 'warning');
                } else {
                    console.warn('[WARNING] 標題長度超過限制');
                }
                
                // 將游標移到末尾
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(this);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    }
    
    if (editableContent) {
        // 內容編輯事件
        editableContent.addEventListener('focus', function() {
            if (this.textContent === '點擊輸入任務詳細內容...') {
                this.textContent = '';
            }
            this.classList.add('editing');
        });
        
        editableContent.addEventListener('blur', function() {
            if (this.textContent.trim() === '') {
                this.textContent = '點擊輸入任務詳細內容...';
            }
            this.classList.remove('editing');
        });
        
        editableContent.addEventListener('input', function() {
            // 限制內容長度
            if (this.textContent.length > 500) {
                this.textContent = this.textContent.substring(0, 500);
                
                // 檢查 showNotification 函數是否存在
                if (typeof showNotification === 'function') {
                    showNotification('內容長度不能超過500個字符', 'warning');
                } else {
                    console.warn('[WARNING] 內容長度超過限制');
                }
                
                // 將游標移到末尾
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(this);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
    }
}

// 初始化提交按鈕
function initializeSubmitButton() {
    const submitBtn = document.getElementById('submitCardBtn');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            if (!isSubmitting) {
                submitTaskCard();
            }
        });
    }
}

// 提交任務卡片
function submitTaskCard() {
    if (isSubmitting) return;
    
    const titleElement = document.getElementById('editableTitle');
    const contentElement = document.getElementById('editableContent');
    const dailyExecutionsInput = document.getElementById('dailyExecutions');
    const endDateInput = document.getElementById('endDate');
    const submitBtn = document.getElementById('submitCardBtn');
    
    // 獲取並驗證內容
    const title = titleElement.textContent.trim();
    const content = contentElement.textContent.trim();
    
    // 檢查是否是預設文字
    if (title === '點擊輸入任務標題...' || title === '') {
        if (typeof showNotification === 'function') {
            showNotification('請輸入任務標題', 'error');
        } else {
            alert('請輸入任務標題');
        }
        titleElement.focus();
        return;
    }
    
    if (content === '點擊輸入任務詳細內容...' || content === '') {
        if (typeof showNotification === 'function') {
            showNotification('請輸入任務內容', 'error');
        } else {
            alert('請輸入任務內容');
        }
        contentElement.focus();
        return;
    }
    
    // 獲取新的表單數據
    const dailyExecutions = parseInt(dailyExecutionsInput.value) || 2;
    const endDate = endDateInput.value;
    const maxParticipants = getCurrentRatingValue() || 5;
    
    // 驗證數字範圍
    if (dailyExecutions < 1 || dailyExecutions > 20) {
        if (typeof showNotification === 'function') {
            showNotification('每日執行次數必須在1-20之間', 'error');
        } else {
            alert('每日執行次數必須在1-20之間');
        }
        dailyExecutionsInput.focus();
        return;
    }
    
    // 驗證日期
    if (!endDate) {
        if (typeof showNotification === 'function') {
            showNotification('請選擇任務結束日期', 'error');
        } else {
            alert('請選擇任務結束日期');
        }
        endDateInput.focus();
        return;
    }
    
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (endDateObj <= today) {
        if (typeof showNotification === 'function') {
            showNotification('結束日期必須晚於今天', 'error');
        } else {
            alert('結束日期必須晚於今天');
        }
        endDateInput.focus();
        return;
    }
    
    // 設置提交狀態
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
    
    // 準備提交數據
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('stamp_icon', selectedStampIcon);
    formData.append('daily_executions', dailyExecutions);
    formData.append('end_date', endDate);
    formData.append('max_participants', maxParticipants);
    
    console.log('[DEBUG] 提交任務卡片:', {
        title, content, selectedStampIcon, dailyExecutions, endDate, maxParticipants
    });
    
    // 發送請求
    fetch('/coopcard/api/save-task-card', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('[DEBUG] 任務卡片提交結果:', data);
        
        if (data.success) {
            // 提交成功動畫
            submitBtn.classList.add('success');
            submitBtn.innerHTML = '<i class="fas fa-check"></i> 成功掛上！';
            
            // 顯示成功通知
            if (typeof showNotification === 'function') {
                showNotification(data.message, 'success');
            } else {
                console.log('[SUCCESS]', data.message);
            }
            
            // 卡片滑出動畫
            const cardEditor = document.getElementById('taskCardEditor');
            cardEditor.classList.add('slide-out');
            
            setTimeout(() => {
                // 重置表單
                resetCardForm();
                
                // 卡片滑入動畫
                cardEditor.classList.remove('slide-out');
                cardEditor.classList.add('slide-in');
                
                // 重新載入任務卡片列表
                loadTaskCards();
                
                setTimeout(() => {
                    cardEditor.classList.remove('slide-in');
                }, 800);
                
            }, 600);
            
        } else {
            const errorMsg = data.message || '提交失敗，請稍後再試';
            if (typeof showNotification === 'function') {
                showNotification(errorMsg, 'error');
            } else {
                alert(errorMsg);
            }
        }
    })
    .catch(error => {
        console.error('[ERROR] 提交任務卡片失敗:', error);
        const errorMsg = '提交失敗，請檢查網路連接';
        if (typeof showNotification === 'function') {
            showNotification(errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
    })
    .finally(() => {
        // 重置提交狀態
        setTimeout(() => {
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.classList.remove('success');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 掛上任務卡片清單！';
        }, 2000);
    });
}

// 重置卡片表單
function resetCardForm() {
    const titleElement = document.getElementById('editableTitle');
    const contentElement = document.getElementById('editableContent');
    const dailyExecutionsInput = document.getElementById('dailyExecutions');
    const endDateInput = document.getElementById('endDate');
    
    // 重置內容
    if (titleElement) titleElement.textContent = '點擊輸入任務標題...';
    if (contentElement) contentElement.textContent = '點擊輸入任務詳細內容...';
    
    // 重置數字輸入
    if (dailyExecutionsInput) dailyExecutionsInput.value = '2';
    
    // 重置日期選擇器
    if (endDateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        endDateInput.value = tomorrow.toISOString().split('T')[0];
        updateDateHelper();
    }
    
    // 重置Rating Scale
    updateRatingDisplay(5);
    updateSelectedCount(5);
    
    // 重置郵戳選擇
    const stampIcons = document.querySelectorAll('.stamp-icon');
    stampIcons.forEach(stamp => stamp.classList.remove('active'));
    
    const defaultStamp = document.querySelector('.stamp-icon[data-icon="fas fa-leaf"]');
    if (defaultStamp) {
        defaultStamp.classList.add('active');
        selectedStampIcon = 'fas fa-leaf';
    }
}

// 載入任務卡片列表
function loadTaskCards() {
    console.log('[DEBUG] 載入任務卡片列表...');
    
    fetch('/coopcard/api/get-task-cards')
    .then(response => response.json())
    .then(data => {
        console.log('[DEBUG] 任務卡片數據:', data);
        
        if (data.success) {
            displayTaskCards(data.cards);
            updateCardsCount(data.cards.length);
        } else {
            console.error('[ERROR] 載入任務卡片失敗:', data.message);
            if (typeof showNotification === 'function') {
                showNotification('載入任務卡片失敗', 'error');
            }
        }
    })
    .catch(error => {
        console.error('[ERROR] 載入任務卡片請求失敗:', error);
        if (typeof showNotification === 'function') {
            showNotification('載入任務卡片失敗，請檢查網路連接', 'error');
        }
    });
}

// 顯示任務卡片
function displayTaskCards(cards) {
    const cardsGrid = document.getElementById('taskCardsGrid');
    
    if (!cardsGrid) {
        console.error('[ERROR] 找不到任務卡片網格元素');
        return;
    }
    
    if (cards.length === 0) {
        cardsGrid.innerHTML = `
            <div class="empty-cards-state">
                <div class="empty-icon">📝</div>
                <h4>還沒有任務卡片</h4>
                <p>創建你的第一張任務卡片來開始協作吧！</p>
            </div>
        `;
        return;
    }
    
    cardsGrid.innerHTML = '';
    
    cards.forEach(card => {
        const cardElement = createTaskCardElement(card);
        cardsGrid.appendChild(cardElement);
    });
}

// ===== 卡片進度計算和輔助函數 =====

/**
 * 計算任務卡片的進度數據
 * @param {Object} card - 卡片數據對象
 * @returns {Object} 包含各種進度信息的對象
 */
function calculateCardProgress(card) {
    // 如果有progress屬性，直接使用（來自API的完整數據）
    if (card.progress) {
        return card.progress;
    }
    
    // 向後兼容：如果沒有progress屬性，使用舊格式計算
    const dailyCompleted = card.daily_completed_count || 0;
    const dailyTotal = card.daily_executions || 2;
    const maxParticipants = card.max_participants || 5;
    const participantsCount = card.participants_count || 1;
    
    // 計算時間相關進度（如果有end_date）
    let timelineData = {
        elapsed_days: 1,
        total_days: card.duration_days || 3,
        percentage: 33.3
    };
    
    if (card.end_date) {
        const today = new Date();
        const endDate = new Date(card.end_date);
        const createdDate = new Date(card.created_at);
        
        const totalDays = Math.ceil((endDate - createdDate) / (1000 * 60 * 60 * 24)) + 1;
        const elapsedDays = Math.min(
            Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24)) + 1,
            totalDays
        );
        
        timelineData = {
            elapsed_days: elapsedDays,
            total_days: totalDays,
            percentage: totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100 * 10) / 10 : 0
        };
    }
    
    return {
        daily: {
            completed: dailyCompleted,
            total: dailyTotal,
            percentage: dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100 * 10) / 10 : 0
        },
        timeline: timelineData,
        participants: {
            current: participantsCount,
            max: maxParticipants,
            percentage: maxParticipants > 0 ? Math.round((participantsCount / maxParticipants) * 100 * 10) / 10 : 0,
            avatars: [] // 向後兼容：如果沒有 progress 屬性時的預設值
        }
    };
}

/**
 * 生成參與者頭像列表HTML
 * @param {Array} avatars - 頭像數組
 * @returns {String} HTML字符串
 */
function generateAvatarList(avatars) {
    if (!avatars || avatars.length === 0) {
        // 顯示預設的創建者頭像（暫時使用預設頭像）
        return `<div class="mini-avatar" title="創建者">
                    <img src="/static/icons/avatars/default.png" alt="創建者" />
                </div>`;
    }
    
    return avatars.slice(0, 10).map((avatar, index) => `
        <div class="mini-avatar" title="${avatar.name || '參與者'}">
            <img src="${avatar.avatar || '/static/icons/avatars/default.png'}" 
                 alt="${avatar.name || '參與者'}" />
        </div>
    `).join('');
}

/**
 * 為卡片添加打勾功能的事件監聽器
 * @param {HTMLElement} cardElement - 卡片DOM元素
 * @param {Number} cardId - 卡片ID
 */
function addCheckboxListeners(cardElement, cardId) {
    const checkboxArea = cardElement.querySelector('.card-checkbox-area');
    const checkbox = cardElement.querySelector('.task-checkbox');
    
    if (!checkbox) return;
    
    checkbox.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 避免重複點擊
        if (checkbox.classList.contains('processing')) {
            return;
        }
        
        handleCheckboxClick(cardId, cardElement);
    });
}

/**
 * 處理打勾點擊事件
 * @param {Number} cardId - 卡片ID
 * @param {HTMLElement} cardElement - 卡片DOM元素
 */
function handleCheckboxClick(cardId, cardElement) {
    const checkbox = cardElement.querySelector('.task-checkbox');
    const checkboxArea = cardElement.querySelector('.card-checkbox-area');
    
    if (!checkbox) return;
    
    // 標記為處理中
    checkbox.classList.add('processing');
    
    // 呼叫API更新進度
    fetch(`/coopcard/api/update-daily-progress/${cardId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'increment'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 成功：執行打勾動畫
            executeCheckAnimation(checkbox, checkboxArea, cardElement, data);
            
            // 顯示成功通知
            if (typeof showNotification === 'function') {
                showNotification(data.message || '進度已更新！', 'success');
            }
        } else {
            // 失敗：顯示錯誤信息
            if (typeof showNotification === 'function') {
                showNotification(data.message || '更新失敗，請稍後再試', 'error');
            }
            
            // 移除處理中標記
            checkbox.classList.remove('processing');
        }
    })
    .catch(error => {
        console.error('更新進度失敗:', error);
        if (typeof showNotification === 'function') {
            showNotification('網路錯誤，請檢查連線', 'error');
        }
        
        // 移除處理中標記
        checkbox.classList.remove('processing');
    });
}

/**
 * 執行打勾動畫效果
 * @param {HTMLElement} checkbox - 打勾框元素
 * @param {HTMLElement} checkboxArea - 打勾區域元素  
 * @param {HTMLElement} cardElement - 卡片元素
 * @param {Object} progressData - 進度數據
 */
function executeCheckAnimation(checkbox, checkboxArea, cardElement, progressData) {
    // 1. 打勾框淡出動畫
    checkbox.classList.add('checked');
    
    setTimeout(() => {
        // 2. 更新進度條
        updateProgressDisplay(cardElement, progressData);
        
        // 3. 檢查是否需要顯示新的打勾框
        if (progressData.current_count < progressData.daily_limit) {
            // 創建並滑入新的打勾框
            createNewCheckbox(checkboxArea, cardElement.getAttribute('data-card-id'));
        }
        
        // 4. 移除已完成的打勾框
        setTimeout(() => {
            checkbox.remove();
        }, 300);
        
    }, 500); // 等待淡出動畫完成
}

/**
 * 更新卡片的進度顯示
 * @param {HTMLElement} cardElement - 卡片元素
 * @param {Object} progressData - 進度數據
 */
function updateProgressDisplay(cardElement, progressData) {
    // 更新數字顯示
    const statNumbers = cardElement.querySelector('.stat-numbers');
    if (statNumbers) {
        statNumbers.textContent = `${progressData.current_count}/${progressData.daily_limit}`;
    }
    
    // 更新進度條
    const progressFill = cardElement.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progressData.progress_percentage}%`;
    }
}

/**
 * 創建新的打勾框
 * @param {HTMLElement} checkboxArea - 打勾區域元素
 * @param {String} cardId - 卡片ID
 */
function createNewCheckbox(checkboxArea, cardId) {
    const newCheckbox = document.createElement('div');
    newCheckbox.className = 'task-checkbox new-checkbox';
    newCheckbox.setAttribute('data-card-id', cardId);
    newCheckbox.innerHTML = '<i class="fas fa-check"></i>';
    
    // 添加事件監聽器
    newCheckbox.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (newCheckbox.classList.contains('processing')) {
            return;
        }
        
        handleCheckboxClick(cardId, checkboxArea.closest('.task-card-item'));
    });
    
    // 滑入動畫
    newCheckbox.style.transform = 'translateY(20px)';
    newCheckbox.style.opacity = '0';
    
    checkboxArea.appendChild(newCheckbox);
    
    // 觸發滑入動畫
    setTimeout(() => {
        newCheckbox.style.transform = 'translateY(0)';
        newCheckbox.style.opacity = '1';
        newCheckbox.classList.remove('new-checkbox');
    }, 50);
}

// 創建任務卡片元素
function createTaskCardElement(card) {
    const cardDiv = document.createElement('div');
    
    // 根據卡片類型設定CSS類名（支援顏色主題區分）
    let cardClasses = 'task-card-item';
    if (card.card_theme) {
        cardClasses += ` ${card.card_theme}-card`;
    } else if (card.is_owner !== undefined) {
        // 向後兼容：如果沒有card_theme但有is_owner資訊
        cardClasses += card.is_owner ? ' own-card' : ' friend-card';
    }
    
    cardDiv.className = cardClasses;
    cardDiv.setAttribute('data-card-id', card.id);
    cardDiv.setAttribute('data-card-owner', card.is_owner ? 'true' : 'false');
    cardDiv.setAttribute('data-user-role', card.user_role || 'participant');
    cardDiv.draggable = true;
    
    // 使用本地的HTML轉義函數，如果全域的不存在的話
    const escapeHtmlLocal = typeof escapeHtml === 'function' ? escapeHtml : function(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    };
    
    // 計算進度數據
    const progressData = calculateCardProgress(card);
    
    cardDiv.innerHTML = `
        <div class="card-stamp">
            <i class="${escapeHtmlLocal(card.stamp_icon)}"></i>
        </div>
        <div class="card-header">
            <div class="card-icon-container">
                <div class="card-icon">
                    <i class="${escapeHtmlLocal(card.stamp_icon)}"></i>
                </div>
                <!-- 打勾功能區域 - 移到icon下方 -->
                <div class="card-checkbox-area" id="checkboxArea-${card.id}">
                    <div class="task-checkbox" data-card-id="${card.id}">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            </div>
            <div class="card-details">
                <h4>${escapeHtmlLocal(card.title)}</h4>
                <p>${escapeHtmlLocal(card.content)}</p>
            </div>
            <!-- 詳情按鈕 -->
            <button class="card-detail-btn" title="查看詳情" data-card-id="${card.id}">
                <i class="fas fa-info-circle"></i>
            </button>
        </div>
        <div class="card-meta">
            <div class="meta-item">
                <span class="meta-text">執行 <span class="stat-numbers">${progressData.daily.completed}/${progressData.daily.total}</span>次</span>
                <div class="mini-progress-bar">
                    <div class="progress-fill" style="width: ${progressData.daily.percentage}%"></div>
                </div>
            </div>
            <div class="meta-item">
                <span class="meta-text">持續 <span class="stat-numbers">${progressData.timeline.elapsed_days}/${progressData.timeline.total_days}</span>天</span>
                <div class="mini-timeline-bar">
                    <div class="timeline-fill" style="width: ${progressData.timeline.percentage}%"></div>
                </div>
            </div>
            <div class="meta-item">
                <span class="meta-text">參與 <span class="stat-numbers">${progressData.participants.current}/${progressData.participants.max}</span>人</span>
                <div class="mini-avatars">
                    ${generateAvatarList(progressData.participants.avatars || [])}
                </div>
            </div>
        </div>
    `;
    
    // 將完整卡片數據存入 data 屬性（供詳情視窗使用）
    cardDiv.setAttribute('data-card-data', JSON.stringify(card));
    
    // 使用拖拽管理器添加拖拽事件監聽器
    if (taskCardDragManager) {
        taskCardDragManager.attachDragListeners(cardDiv);
    }
    
    // 添加打勾功能事件監聽器
    addCheckboxListeners(cardDiv, card.id);
    
    // 添加詳情按鈕點擊事件
    const detailBtn = cardDiv.querySelector('.card-detail-btn');
    if (detailBtn) {
        detailBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止觸發其他事件（如拖拽）
            e.preventDefault();
            console.log('[卡片詳情] 點擊詳情按鈕，卡片ID:', card.id);
            if (window.taskDetailModal) {
                window.taskDetailModal.show(card.id);
            } else {
                console.warn('[卡片詳情] TaskDetailModal 尚未初始化');
            }
        });
    }
    
    // 添加雙擊事件（輔助打開詳情）
    cardDiv.addEventListener('dblclick', function(e) {
        // 排除 checkbox 區域的雙擊
        if (!e.target.closest('.task-checkbox') && 
            !e.target.closest('.card-checkbox-area') &&
            !e.target.closest('.card-detail-btn')) {
            console.log('[卡片詳情] 雙擊卡片，卡片ID:', card.id);
            if (window.taskDetailModal) {
                window.taskDetailModal.show(card.id);
            }
        }
    });
    
    return cardDiv;
}

// 更新卡片數量顯示
function updateCardsCount(count) {
    const cardsCount = document.getElementById('cardsCount');
    if (cardsCount) {
        cardsCount.textContent = `${count} 張卡片`;
    }
}

// 自動初始化（如果頁面已經載入完成）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTaskCardEditor);
} else {
    // DOM已經載入完成，直接初始化
    initializeTaskCardEditor();
}

// 暴露給全域作用域的函數（供外部調用）
window.initializeTaskCardEditor = initializeTaskCardEditor;
window.loadTaskCards = loadTaskCards;
window.resetCardForm = resetCardForm;

// 刪除任務卡片（已改用確認視窗，保留供向後兼容）
function deleteTaskCard(cardId) {
    if (!cardId) {
        console.error('[ERROR] 無效的卡片ID');
        return;
    }
    
    console.log('[DEBUG] 呼叫刪除任務卡片:', cardId);
    
    // 取得卡片資訊
    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    let cardTitle = '未命名任務';
    
    if (cardElement) {
        const cardData = cardElement.getAttribute('data-card-data');
        if (cardData) {
            try {
                const card = JSON.parse(cardData);
                cardTitle = card.title || '未命名任務';
            } catch (e) {
                console.error('[ERROR] 解析卡片資料失敗:', e);
            }
        }
    }
    
    // 使用新的確認視窗
    showDeleteConfirmModal(cardId, cardTitle);
}

// ===== 新的設定組件初始化函數 =====

// 初始化數字輸入框
function initializeNumberInput() {
    const dailyExecutionsInput = document.getElementById('dailyExecutions');
    
    if (!dailyExecutionsInput) return;
    
    // 數字輸入驗證
    dailyExecutionsInput.addEventListener('input', function() {
        let value = parseInt(this.value);
        
        if (isNaN(value) || value < 1) {
            this.value = 1;
        } else if (value > 20) {
            this.value = 20;
            if (typeof showNotification === 'function') {
                showNotification('每日執行次數上限為20次', 'warning');
            }
        }
    });
    
    dailyExecutionsInput.addEventListener('blur', function() {
        if (!this.value || this.value === '') {
            this.value = 2; // 預設值
        }
    });
}

// 初始化日期選擇器
function initializeDatePicker() {
    const endDateInput = document.getElementById('endDate');
    
    if (!endDateInput) return;
    
    // 設置最小日期為明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    endDateInput.min = minDate;
    endDateInput.value = minDate;
    
    // 初始化顯示天數
    updateDateHelper();
    
    // 監聽日期變化
    endDateInput.addEventListener('change', updateDateHelper);
}

// 更新日期輔助文字
function updateDateHelper() {
    const endDateInput = document.getElementById('endDate');
    const dateHelper = document.getElementById('dateHelper');
    
    if (!endDateInput || !dateHelper) return;
    
    if (endDateInput.value) {
        const endDate = new Date(endDateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            dateHelper.textContent = `任務持續 ${diffDays} 天`;
            dateHelper.style.color = 'rgba(100, 255, 218, 0.8)';
        } else {
            dateHelper.textContent = '請選擇未來的日期';
            dateHelper.style.color = 'rgba(255, 100, 100, 0.8)';
        }
    } else {
        dateHelper.textContent = '選擇任務結束日期';
        dateHelper.style.color = 'rgba(255, 255, 255, 0.6)';
    }
}

// 初始化Rating Scale
function initializeRatingScale() {
    const container = document.getElementById('maxParticipantsRating');
    const selectedDisplay = document.getElementById('selectedParticipants');
    
    if (!container) return;
    
    let selectedValue = 5; // 預設值
    
    // 清空容器並生成10個圓圈
    container.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const circle = document.createElement('div');
        circle.className = 'rating-circle';
        circle.textContent = i;
        circle.dataset.value = i;
        
        if (i <= selectedValue) {
            circle.classList.add('active');
        }
        
        circle.addEventListener('click', function() {
            selectedValue = parseInt(this.dataset.value);
            updateRatingDisplay(selectedValue);
            updateSelectedCount(selectedValue);
        });
        
        container.appendChild(circle);
    }
    
    // 初始顯示
    updateSelectedCount(selectedValue);
}

// 更新Rating顯示
function updateRatingDisplay(value) {
    const circles = document.querySelectorAll('.rating-circle');
    circles.forEach((circle, index) => {
        if (index < value) {
            circle.classList.add('active');
        } else {
            circle.classList.remove('active');
        }
    });
}

// 更新選中數量顯示
function updateSelectedCount(value) {
    const selectedDisplay = document.getElementById('selectedParticipants');
    if (selectedDisplay) {
        selectedDisplay.textContent = value;
    }
}

// 獲取當前Rating值
function getCurrentRatingValue() {
    const activeCircles = document.querySelectorAll('.rating-circle.active');
    return activeCircles.length;
}

// ==================== 任務卡片確認視窗功能 ====================

/**
 * 顯示刪除確認視窗
 * @param {string} cardId - 卡片ID
 * @param {string} cardTitle - 卡片標題
 */
function showDeleteConfirmModal(cardId, cardTitle) {
    const modal = document.getElementById('cardDeleteConfirmModal');
    const titleElement = document.getElementById('deleteCardTitle');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    if (!modal || !titleElement || !confirmBtn) {
        console.error('[DeleteModal] 找不到刪除確認視窗元素');
        return;
    }
    
    // 設置卡片標題
    titleElement.textContent = cardTitle || '未命名任務';
    
    // 移除舊的事件監聽器（透過克隆節點）
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // 添加新的確認事件
    newConfirmBtn.addEventListener('click', function() {
        executeDeleteCard(cardId);
    });
    
    // 顯示視窗
    modal.classList.add('active');
    
    // ESC 鍵關閉
    document.addEventListener('keydown', handleDeleteModalEsc);
    
    console.log('[DeleteModal] 顯示刪除確認視窗:', cardId, cardTitle);
}

/**
 * 關閉刪除確認視窗
 */
function closeDeleteConfirmModal() {
    const modal = document.getElementById('cardDeleteConfirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.removeEventListener('keydown', handleDeleteModalEsc);
    console.log('[DeleteModal] 關閉刪除確認視窗');
}

/**
 * 處理刪除視窗的 ESC 鍵
 */
function handleDeleteModalEsc(e) {
    if (e.key === 'Escape') {
        closeDeleteConfirmModal();
    }
}

/**
 * 執行刪除卡片
 * @param {string} cardId - 卡片ID
 */
function executeDeleteCard(cardId) {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    // 禁用按鈕並顯示載入狀態
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刪除中...';
    }
    
    // 發送刪除請求
    fetch(`/coopcard/api/delete-task-card/${cardId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 顯示成功通知
            if (typeof showNotification === 'function') {
                showNotification(data.message || '任務卡片已刪除', 'success');
            }
            
            // 關閉視窗
            closeDeleteConfirmModal();
            
            // 重新載入卡片列表
            setTimeout(() => {
                loadTaskCards();
            }, 300);
            
        } else {
            const errorMsg = data.message || '刪除失敗，請稍後再試';
            if (typeof showNotification === 'function') {
                showNotification(errorMsg, 'error');
            } else {
                alert(errorMsg);
            }
            
            // 恢復按鈕狀態
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-trash-alt"></i> 確定刪除';
            }
        }
    })
    .catch(error => {
        console.error('[ERROR] 刪除任務卡片請求失敗:', error);
        const errorMsg = '刪除失敗，請檢查網路連接';
        if (typeof showNotification === 'function') {
            showNotification(errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
        
        // 恢復按鈕狀態
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-trash-alt"></i> 確定刪除';
        }
    });
}

/**
 * 顯示退出確認視窗
 * @param {string} cardId - 卡片ID
 * @param {string} cardTitle - 卡片標題
 */
function showLeaveConfirmModal(cardId, cardTitle) {
    const modal = document.getElementById('cardLeaveConfirmModal');
    const titleElement = document.getElementById('leaveCardTitle');
    const confirmBtn = document.getElementById('confirmLeaveBtn');
    
    if (!modal || !titleElement || !confirmBtn) {
        console.error('[LeaveModal] 找不到退出確認視窗元素');
        return;
    }
    
    // 設置卡片標題
    titleElement.textContent = cardTitle || '未命名任務';
    
    // 移除舊的事件監聽器（透過克隆節點）
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // 添加新的確認事件
    newConfirmBtn.addEventListener('click', function() {
        executeLeaveCard(cardId);
    });
    
    // 顯示視窗
    modal.classList.add('active');
    
    // ESC 鍵關閉
    document.addEventListener('keydown', handleLeaveModalEsc);
    
    console.log('[LeaveModal] 顯示退出確認視窗:', cardId, cardTitle);
}

/**
 * 關閉退出確認視窗
 */
function closeLeaveConfirmModal() {
    const modal = document.getElementById('cardLeaveConfirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.removeEventListener('keydown', handleLeaveModalEsc);
    console.log('[LeaveModal] 關閉退出確認視窗');
}

/**
 * 處理退出視窗的 ESC 鍵
 */
function handleLeaveModalEsc(e) {
    if (e.key === 'Escape') {
        closeLeaveConfirmModal();
    }
}

/**
 * 執行退出卡片
 * @param {string} cardId - 卡片ID
 */
function executeLeaveCard(cardId) {
    const confirmBtn = document.getElementById('confirmLeaveBtn');
    
    // 禁用按鈕並顯示載入狀態
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 退出中...';
    }
    
    // 發送退出請求
    fetch(`/coopcard/api/leave-task-card/${cardId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 顯示成功通知
            if (typeof showNotification === 'function') {
                showNotification(data.message || '已成功退出任務', 'success');
            }
            
            // 關閉視窗
            closeLeaveConfirmModal();
            
            // 重新載入卡片列表
            setTimeout(() => {
                loadTaskCards();
            }, 300);
            
        } else {
            const errorMsg = data.message || '退出失敗，請稍後再試';
            if (typeof showNotification === 'function') {
                showNotification(errorMsg, 'error');
            } else {
                alert(errorMsg);
            }
            
            // 恢復按鈕狀態
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> 確定退出';
            }
        }
    })
    .catch(error => {
        console.error('[ERROR] 退出任務卡片請求失敗:', error);
        const errorMsg = '退出失敗，請檢查網路連接';
        if (typeof showNotification === 'function') {
            showNotification(errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
        
        // 恢復按鈕狀態
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> 確定退出';
        }
    });
}

// 點擊視窗外部關閉（為所有確認視窗添加事件監聽器）
document.addEventListener('DOMContentLoaded', function() {
    const deleteModal = document.getElementById('cardDeleteConfirmModal');
    const leaveModal = document.getElementById('cardLeaveConfirmModal');
    const storeModal = document.getElementById('cardStoreConfirmModal');
    
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === deleteModal) {
                closeDeleteConfirmModal();
            }
        });
    }
    
    if (leaveModal) {
        leaveModal.addEventListener('click', function(e) {
            if (e.target === leaveModal) {
                closeLeaveConfirmModal();
            }
        });
    }
    
    if (storeModal) {
        storeModal.addEventListener('click', function(e) {
            if (e.target === storeModal) {
                closeStoreConfirmModal();
            }
        });
    }
    
    // 初始化已結算任務功能
    initializeStoredCards();
});

// ===== 已結算任務功能 =====

/**
 * 初始化已結算任務功能
 */
function initializeStoredCards() {
    console.log('[StoredCards] 初始化已結算任務功能...');
    
    // 綁定刷新按鈕
    const refreshBtn = document.getElementById('refreshStoredBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadStoredCards);
    }
    
    // 初始載入
    loadStoredCards();
    
    console.log('[StoredCards] 已結算任務功能初始化完成');
}

/**
 * 載入已結算任務列表
 */
function loadStoredCards() {
    console.log('[StoredCards] 開始載入已結算任務...');
    
    const container = document.getElementById('storedCardsList');
    const countElement = document.getElementById('storedCardsCount');
    
    if (!container) {
        console.error('[StoredCards] 找不到容器元素');
        return;
    }
    
    // 顯示載入狀態
    container.innerHTML = `
        <div class="stored-cards-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>載入已結算任務中...</span>
        </div>
    `;
    
    // 調用 API
    fetch('/coopcard/api/get-stored-cards')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayStoredCards(data.cards || []);
                
                // 更新計數
                if (countElement) {
                    countElement.textContent = (data.cards || []).length;
                }
            } else {
                throw new Error(data.message || '載入失敗');
            }
        })
        .catch(error => {
            console.error('[StoredCards] 載入失敗:', error);
            container.innerHTML = `
                <div class="stored-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>載入失敗</p>
                    <p style="font-size: 0.85rem;">${escapeHtml(error.message)}</p>
                </div>
            `;
        });
}

/**
 * 顯示已結算任務列表
 */
function displayStoredCards(cards) {
    const container = document.getElementById('storedCardsList');
    
    if (!container) return;
    
    if (!cards || cards.length === 0) {
        container.innerHTML = `
            <div class="stored-empty">
                <i class="fas fa-archive"></i>
                <p>目前沒有已結算的任務</p>
                <p style="font-size: 0.85rem; color: rgba(255,255,255,0.5);">
                    將完成的任務拖拽至「結算卡片」區域
                </p>
            </div>
        `;
        return;
    }
    
    // 渲染卡片列表
    let html = '';
    cards.forEach(card => {
        const storedDate = card.updated_at || card.created_at || '';
        const formattedDate = storedDate ? new Date(storedDate).toLocaleDateString('zh-TW') : '';
        
        html += `
            <div class="stored-card-item" data-card-id="${card.id}" onclick="reviveStoredCard(${card.id})">
                <div class="stored-card-header">
                    <i class="${escapeHtml(card.stamp_icon || 'fas fa-leaf')} stored-card-icon"></i>
                    <div class="stored-card-title">${escapeHtml(card.title)}</div>
                </div>
                <div class="stored-card-content">${escapeHtml(card.content)}</div>
                <div class="stored-card-footer">
                    <div class="stored-date">
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="revive-hint">
                        <i class="fas fa-redo"></i> 點擊復活
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    console.log('[StoredCards] 已顯示', cards.length, '個已結算任務');
}

/**
 * 復活已結算任務
 */
function reviveStoredCard(cardId) {
    console.log('[StoredCards] 嘗試復活任務:', cardId);
    
    if (!confirm('確定要復活這個任務嗎？\n\n復活後的任務將重新出現在卡片清單中。')) {
        return;
    }
    
    // 調用復活 API
    fetch(`/coopcard/api/revive-task-card/${cardId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (typeof showNotification === 'function') {
                showNotification('任務已復活！🌟', 'success');
            }
            // 重新載入卡片列表
            if (typeof loadTaskCards === 'function') {
                loadTaskCards();
            }
            // 重新載入已結算卡片
            loadStoredCards();
        } else {
            if (typeof showNotification === 'function') {
                showNotification(data.message || '復活失敗', 'error');
            } else {
                alert(data.message || '復活失敗');
            }
        }
    })
    .catch(error => {
        console.error('[StoredCards] 復活任務失敗:', error);
        if (typeof showNotification === 'function') {
            showNotification('復活失敗，請稍後再試', 'error');
        } else {
            alert('復活失敗，請稍後再試');
        }
    });
}

// ===== 結算確認視窗功能 =====

/**
 * 顯示結算確認視窗
 * @param {string} cardId - 卡片ID
 * @param {string} cardTitle - 卡片標題
 */
function showStoreConfirmModal(cardId, cardTitle) {
    const modal = document.getElementById('cardStoreConfirmModal');
    const titleElement = document.getElementById('storeCardTitle');
    const confirmBtn = document.getElementById('confirmStoreBtn');
    
    if (!modal || !titleElement || !confirmBtn) {
        console.error('[StoreModal] 找不到結算確認視窗元素');
        return;
    }
    
    // 設置卡片標題
    titleElement.textContent = cardTitle || '未命名任務';
    
    // 移除舊的事件監聽器（透過克隆節點）
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // 添加新的確認事件
    newConfirmBtn.addEventListener('click', function() {
        executeStoreCard(cardId);
    });
    
    // 顯示視窗
    modal.classList.add('active');
    
    // ESC 鍵關閉
    document.addEventListener('keydown', handleStoreModalEsc);
    
    console.log('[StoreModal] 顯示結算確認視窗:', cardId, cardTitle);
}

/**
 * 關閉結算確認視窗
 */
function closeStoreConfirmModal() {
    const modal = document.getElementById('cardStoreConfirmModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.removeEventListener('keydown', handleStoreModalEsc);
    console.log('[StoreModal] 關閉結算確認視窗');
}

/**
 * 處理結算視窗的 ESC 鍵
 */
function handleStoreModalEsc(e) {
    if (e.key === 'Escape') {
        closeStoreConfirmModal();
    }
}

/**
 * 執行結算卡片
 * @param {string} cardId - 卡片ID
 */
function executeStoreCard(cardId) {
    const confirmBtn = document.getElementById('confirmStoreBtn');
    
    // 禁用按鈕並顯示載入狀態
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 結算中...';
    }
    
    // 發送結算請求
    fetch(`/coopcard/api/store-task-card/${cardId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 顯示成功通知
            if (typeof showNotification === 'function') {
                showNotification(data.message || '任務已結算！🎉', 'success');
            }
            
            // 關閉視窗
            closeStoreConfirmModal();
            
            // 重新載入卡片列表
            setTimeout(() => {
                if (typeof loadTaskCards === 'function') {
                    loadTaskCards();
                }
                // 重新載入已結算卡片
                if (typeof loadStoredCards === 'function') {
                    loadStoredCards();
                }
            }, 300);
            
        } else {
            const errorMsg = data.message || '結算失敗，請稍後再試';
            if (typeof showNotification === 'function') {
                showNotification(errorMsg, 'error');
            } else {
                alert(errorMsg);
            }
            
            // 恢復按鈕狀態
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-calculator"></i> 確定結算';
            }
        }
    })
    .catch(error => {
        console.error('[ERROR] 結算任務卡片請求失敗:', error);
        const errorMsg = '結算失敗，請檢查網路連接';
        if (typeof showNotification === 'function') {
            showNotification(errorMsg, 'error');
        } else {
            alert(errorMsg);
        }
        
        // 恢復按鈕狀態
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-calculator"></i> 確定結算';
        }
    });
}
