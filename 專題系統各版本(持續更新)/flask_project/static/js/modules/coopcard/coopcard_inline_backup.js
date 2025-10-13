/**
 * CoopCard 內聯編輯功能專用 JavaScript
 * 用於任務卡片的內聯編輯、提交和列表顯示功能
 * 
 * 依賴：
 * - coopcard_main.js 中的 showNotification 和 escapeHtml 函數
 * - /coopcard/api/save-task-card 和 /coopcard/api/get-task-cards API端點
 */

// 任務卡片相關全域變數
let selectedStampIcon = 'fas fa-heart';
let isSubmitting = false;

// 初始化任務卡片功能
function initializeTaskCardEditor() {
    console.log('[DEBUG] 初始化任務卡片編輯器...');
    
    initializeStampSelector();
    initializeEditableContent();
    initializeSubmitButton();
    initializeHybridDragZones(); // 使用混合拖拽區域初始化
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
    const dailyExecutions = document.getElementById('dailyExecutions').value;
    const durationDays = document.getElementById('durationDays').value;
    const maxParticipants = document.getElementById('maxParticipants').value;
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
    formData.append('duration_days', durationDays);
    formData.append('max_participants', maxParticipants);
    
    console.log('[DEBUG] 提交任務卡片:', {
        title, content, selectedStampIcon, dailyExecutions, durationDays, maxParticipants
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
    const dailyExecutions = document.getElementById('dailyExecutions');
    const durationDays = document.getElementById('durationDays');
    const maxParticipants = document.getElementById('maxParticipants');
    
    // 重置內容
    if (titleElement) titleElement.textContent = '點擊輸入任務標題...';
    if (contentElement) contentElement.textContent = '點擊輸入任務詳細內容...';
    
    // 重置選項
    if (dailyExecutions) dailyExecutions.value = '2';
    if (durationDays) durationDays.value = '3';
    if (maxParticipants) maxParticipants.value = '5';
    
    // 重置郵戳選擇
    const stampIcons = document.querySelectorAll('.stamp-icon');
    stampIcons.forEach(stamp => stamp.classList.remove('active'));
    
    const defaultStamp = document.querySelector('.stamp-icon[data-icon="fas fa-heart"]');
    if (defaultStamp) {
        defaultStamp.classList.add('active');
        selectedStampIcon = 'fas fa-heart';
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

// 創建任務卡片元素
function createTaskCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'task-card-item';
    cardDiv.setAttribute('data-card-id', card.id);
    // 使用HTML5 draggable 提供流暢的游標跟隨效果
    cardDiv.setAttribute('draggable', 'true');
    
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
    
    cardDiv.innerHTML = `
        <div class="card-stamp">
            <i class="${escapeHtmlLocal(card.stamp_icon)}"></i>
        </div>
        <div class="card-header">
            <div class="card-icon">
                <i class="${escapeHtmlLocal(card.stamp_icon)}"></i>
            </div>
            <div class="card-details">
                <h4>${escapeHtmlLocal(card.title)}</h4>
                <p>${escapeHtmlLocal(card.content)}</p>
            </div>
        </div>
        <div class="card-meta">
            <span>執行 ${card.daily_executions}次/天</span>
            <span>持續 ${card.duration_days}天</span>
            <span>上限 ${card.max_participants}人</span>
        </div>
        <div class="drag-hint">拖拽到刪除區域可移除</div>
    `;
    
    // 添加混合拖拽事件監聽器
    addHybridDragListeners(cardDiv);
    
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

// ===== 拖拽功能實現 =====

// 拖拽相關全域變數
let draggedCard = null;
let dragClone = null;
let isDragging = false;
let dragPlaceholder = null;
let originalCardIndex = -1;
let cardOrder = []; // 儲存卡片的順序

// 為卡片添加拖拽事件監聽器
function addDragEventListeners(cardElement) {
    // 混合拖拽系統：結合HTML5拖拽的流暢性和自定義邏輯的靈活性
    
    // HTML5 拖拽事件 - 提供流暢的游標跟隨
    cardElement.addEventListener('dragstart', handleDragStart);
    cardElement.addEventListener('dragend', handleDragEnd);
    
    // 自定義滑鼠事件 - 處理重新排序邏輯
    cardElement.addEventListener('mousedown', handleMouseDownForReorder);
}

// HTML5 拖拽開始事件 - 設定拖拽資料和外觀
function handleDragStart(e) {
    const cardId = e.currentTarget.getAttribute('data-card-id');
    console.log('[HYBRID DRAG] HTML5拖拽開始:', cardId);
    
    // 設定拖拽資料
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    
    // 隱藏預設拖拽影像，讓卡片本身跟隨游標
    const emptyImg = new Image();
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(emptyImg, 0, 0);
    
    // 設定全域拖拽狀態
    draggedCard = e.currentTarget;
    draggedCardId = cardId;
    
    // 添加拖拽視覺效果
    e.currentTarget.classList.add('dragging');
    
    // 啟用刪除區域
    const deleteZone = document.getElementById('deleteDropZone');
    if (deleteZone) {
        deleteZone.classList.add('drag-ready');
    }
    
    // 預先計算所有卡片位置，提高性能
    cacheCardPositions();
}

// HTML5 拖拽結束事件
function handleDragEnd(e) {
    console.log('[HYBRID DRAG] HTML5拖拽結束');
    cleanupDragState();
}

// 自定義滑鼠事件處理 - 專門處理重新排序
function handleMouseDownForReorder(e) {
    if (e.button !== 0) return; // 只處理左鍵
    
    // 防止與HTML5拖拽衝突，延遲處理
    setTimeout(() => {
        if (!draggedCard) return; // 如果HTML5拖拽沒有啟動，則不處理
        
        // 添加全域滑鼠移動監聽器
        document.addEventListener('mousemove', handleMouseMoveForReorder);
        document.addEventListener('mouseup', handleMouseUpForReorder);
    }, 50);
}

// 全域變數：快取卡片位置資訊
let cachedCardPositions = [];

// 快取所有卡片的位置資訊
function cacheCardPositions() {
    const taskCardsGrid = document.getElementById('taskCardsGrid');
    if (!taskCardsGrid) return;
    
    const cards = Array.from(taskCardsGrid.children).filter(child => 
        child.classList.contains('task-card-item') && !child.classList.contains('drag-placeholder')
    );
    
    cachedCardPositions = cards.map((card, index) => {
        const rect = card.getBoundingClientRect();
        return {
            element: card,
            index: index,
            id: card.getAttribute('data-card-id'),
            rect: rect,
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2
        };
    });
    
    console.log('[HYBRID DRAG] 快取了', cachedCardPositions.length, '個卡片位置');
}
// 滑鼠移動處理 - 即時重新排序
let reorderAnimationFrame = null;

function handleMouseMoveForReorder(e) {
    if (!draggedCard || cachedCardPositions.length === 0) return;
    
    // 使用 requestAnimationFrame 優化性能
    if (reorderAnimationFrame) {
        cancelAnimationFrame(reorderAnimationFrame);
    }
    
    reorderAnimationFrame = requestAnimationFrame(() => {
        // 檢查是否在刪除區域
        checkDeleteZoneHover(e.clientX, e.clientY);
        
        // 計算最佳插入位置
        const insertPosition = calculateOptimalInsertPosition(e.clientX, e.clientY);
        if (insertPosition !== -1) {
            reorderCardsWithAnimation(insertPosition);
        }
    });
}

// 滑鼠釋放處理
function handleMouseUpForReorder(e) {
    console.log('[HYBRID DRAG] 滑鼠釋放，清理重新排序邏輯');
    
    // 移除全域滑鼠監聽器
    document.removeEventListener('mousemove', handleMouseMoveForReorder);
    document.removeEventListener('mouseup', handleMouseUpForReorder);
    
    // 取消待執行的動畫
    if (reorderAnimationFrame) {
        cancelAnimationFrame(reorderAnimationFrame);
        reorderAnimationFrame = null;
    }
}

// 計算最佳插入位置
function calculateOptimalInsertPosition(mouseX, mouseY) {
    if (cachedCardPositions.length === 0) return -1;
    
    // 找到最接近滑鼠位置的卡片
    let minDistance = Infinity;
    let bestPosition = -1;
    
    cachedCardPositions.forEach((cardPos, index) => {
        // 跳過正在拖拽的卡片
        if (cardPos.element === draggedCard) return;
        
        const distance = Math.sqrt(
            Math.pow(mouseX - cardPos.centerX, 2) + 
            Math.pow(mouseY - cardPos.centerY, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            bestPosition = index;
        }
    });
    
    return bestPosition;
}

// 使用動畫重新排序卡片
function reorderCardsWithAnimation(insertPosition) {
    const taskCardsGrid = document.getElementById('taskCardsGrid');
    if (!taskCardsGrid) return;
    
    const cards = Array.from(taskCardsGrid.children).filter(child => 
        child.classList.contains('task-card-item') && !child.classList.contains('drag-placeholder')
    );
    
    // 使用CSS Grid order屬性來重新排序
    cards.forEach((card, currentIndex) => {
        if (card === draggedCard) return; // 跳過拖拽中的卡片
        
        let newOrder;
        if (currentIndex < insertPosition) {
            newOrder = currentIndex;
        } else if (currentIndex >= insertPosition) {
            newOrder = currentIndex + 1;
        }
        
        card.style.order = newOrder;
        card.style.transition = 'all 0.2s ease-out';
    });
    
    console.log('[HYBRID DRAG] 重新排序到位置:', insertPosition);
}

// 檢查刪除區域懸停
function checkDeleteZoneHover(mouseX, mouseY) {
    const deleteZone = document.getElementById('deleteDropZone');
    if (!deleteZone) return;
    
    const rect = deleteZone.getBoundingClientRect();
    const isOverDeleteZone = (
        mouseX >= rect.left &&
        mouseX <= rect.right &&
        mouseY >= rect.top &&
        mouseY <= rect.bottom
    );
    
    if (isOverDeleteZone) {
        deleteZone.classList.add('drag-over');
    } else {
        deleteZone.classList.remove('drag-over');
    }
}
    
    // 創建拖拽克隆
    createDragClone(card);
    
    // 設置原卡片樣式（完全隱藏）
    card.classList.add('dragging');
    
    // 啟用刪除區域
    const deleteZone = document.getElementById('deleteDropZone');
    if (deleteZone) {
        deleteZone.classList.add('drag-ready');
    }
    
    // 啟用卡片網格拖拽狀態
    if (cardGrid) {
        cardGrid.classList.add('drag-over');
    }
    
    // 初始化克隆位置
    updateClonePosition(event.clientX, event.clientY);
    
    isDragging = true;
}

// 創建拖拽克隆
function createDragClone(originalCard) {
    // 深度克隆原卡片，保持完全相同的樣式
    dragClone = originalCard.cloneNode(true);
    
    // 只添加必要的拖拽樣式，不改變外觀
    dragClone.classList.add('drag-clone');
    
    // 移除可能影響顯示的屬性
    dragClone.removeAttribute('draggable');
    dragClone.removeAttribute('data-card-id');
    
    // 獲取原卡片的計算樣式
    const rect = originalCard.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(originalCard);
    
    // 設置克隆的位置和大小，確保與原卡片完全相同
    dragClone.style.position = 'fixed';
    dragClone.style.width = rect.width + 'px';
    dragClone.style.height = rect.height + 'px';
    dragClone.style.zIndex = '9999';
    dragClone.style.pointerEvents = 'none';
    dragClone.style.margin = '0'; // 重置margin避免位置偏移
    
    // 保持原有的背景和邊框樣式
    dragClone.style.backgroundColor = computedStyle.backgroundColor;
    dragClone.style.border = computedStyle.border;
    dragClone.style.borderRadius = computedStyle.borderRadius;
    
    document.body.appendChild(dragClone);
    
    console.log('[DRAG] 拖拽克隆已創建，樣式已保持一致');
}

// 更新克隆位置
function updateClonePosition(x, y) {
    if (!dragClone) return;
    
    dragClone.style.left = (x - dragClone.offsetWidth / 2) + 'px';
    dragClone.style.top = (y - dragClone.offsetHeight / 2) + 'px';
}

// 檢查是否在刪除區域上方
function checkDropZone(x, y) {
    const deleteZone = document.getElementById('deleteDropZone');
    if (!deleteZone) return;
    
    const rect = deleteZone.getBoundingClientRect();
    const isOverDeleteZone = x >= rect.left && x <= rect.right && 
                            y >= rect.top && y <= rect.bottom;
    
    if (isOverDeleteZone && !deleteZone.classList.contains('drag-over')) {
        deleteZone.classList.add('drag-over');
        console.log('[DRAG] 進入刪除區域');
    } else if (!isOverDeleteZone && deleteZone.classList.contains('drag-over')) {
        deleteZone.classList.remove('drag-over');
        console.log('[DRAG] 離開刪除區域');
    }
}

// 處理自定義拖拽放下
function handleCustomDrop(x, y) {
    console.log('[DRAG] 處理拖拽放下');
    
    const deleteZone = document.getElementById('deleteDropZone');
    const cardGrid = document.getElementById('taskCardsGrid');
    let actionTaken = false;
    
    // 檢查是否在刪除區域
    let shouldDelete = false;
    if (deleteZone) {
        const rect = deleteZone.getBoundingClientRect();
        shouldDelete = x >= rect.left && x <= rect.right && 
                      y >= rect.top && y <= rect.bottom;
    }
    
    if (shouldDelete && draggedCard) {
        console.log('[DRAG] 卡片被拖拽到刪除區域，執行刪除');
        const cardId = draggedCard.getAttribute('data-card-id');
        deleteTaskCard(cardId);
        actionTaken = true;
    } else if (dragPlaceholder) {
        // 檢查是否有佔位符（表示要重新排序）
        console.log('[DRAG] 檢測到重新排序需求');
        actionTaken = reorderCard();
        
        if (actionTaken) {
            // 顯示重新排序成功通知
            if (typeof showNotification === 'function') {
                showNotification('卡片順序已調整', 'success');
            }
        }
    } else {
        console.log('[DRAG] 卡片保持在原位置');
        // 卡片回到原位置，移除拖拽樣式
        if (draggedCard) {
            draggedCard.classList.remove('dragging');
        }
    }
    
    // 清理拖拽狀態
    cleanupDragState();
}

// 清理拖拽狀態
function cleanupDragState() {
    console.log('[DRAG] 清理拖拽狀態');
    
    // 清理拖拽克隆
    if (dragClone) {
        document.body.removeChild(dragClone);
        dragClone = null;
    }
    
    // 移除佔位符
    removePlaceholder();
    
    // 清理原卡片樣式
    if (draggedCard) {
        draggedCard.classList.remove('dragging');
    }
    
    // 停用刪除區域
    const deleteZone = document.getElementById('deleteDropZone');
    if (deleteZone) {
        deleteZone.classList.remove('drag-ready', 'drag-over');
    }
    
    // 停用卡片網格拖拽狀態
    const cardGrid = document.getElementById('taskCardsGrid');
    if (cardGrid) {
        cardGrid.classList.remove('drag-over');
    }
    
    // 重置拖拽變數
    draggedCard = null;
    isDragging = false;
    originalCardIndex = -1;
}

// 刪除任務卡片
function deleteTaskCard(cardId) {
    if (!cardId) {
        console.error('[ERROR] 無效的卡片ID');
        return;
    }
    
    console.log('[DEBUG] 刪除任務卡片:', cardId);
    
    // 顯示確認提示
    if (!confirm('確定要刪除這張任務卡片嗎？此操作無法復原。')) {
        return;
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
        console.log('[DEBUG] 刪除卡片結果:', data);
        
        if (data.success) {
            // 顯示成功通知
            if (typeof showNotification === 'function') {
                showNotification(data.message || '任務卡片已刪除', 'success');
            } else {
                console.log('[SUCCESS] 任務卡片已刪除');
            }
            
            // 重新載入卡片列表
            loadTaskCards();
            
        } else {
            const errorMsg = data.message || '刪除失敗，請稍後再試';
            if (typeof showNotification === 'function') {
                showNotification(errorMsg, 'error');
            } else {
                alert(errorMsg);
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
    });
}

// 初始化拖拽區域事件監聽器
function initializeDragZones() {
    const deleteZone = document.getElementById('deleteDropZone');
    const taskCardsGrid = document.getElementById('taskCardsGrid');
    
    // 只保留自定義拖拽系統，移除HTML5拖拽事件監聽器
    // 刪除區域和卡片網格的交互現在完全由自定義拖拽系統處理
    
    console.log('[DRAG] 拖拽區域初始化完成 - 僅使用自定義拖拽系統');
}

// ===== 卡片重新排序功能 =====

// 檢查卡片重新排序
function checkCardReorder(x, y) {
    const cardGrid = document.getElementById('taskCardsGrid');
    if (!cardGrid || !draggedCard) return;
    
    // 檢查是否在卡片網格區域內
    const gridRect = cardGrid.getBoundingClientRect();
    const isOverGrid = x >= gridRect.left && x <= gridRect.right && 
                      y >= gridRect.top && y <= gridRect.bottom;
    
    if (!isOverGrid) {
        removePlaceholder();
        return;
    }
    
    // 獲取所有卡片（排除正在拖拽的卡片）
    const allCards = Array.from(cardGrid.children).filter(card => 
        card !== draggedCard && !card.classList.contains('drag-placeholder')
    );
    
    let insertAfterCard = null;
    let minDistance = Infinity;
    
    // 找到最接近的卡片
    allCards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(x - cardCenterX, 2) + Math.pow(y - cardCenterY, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            insertAfterCard = card;
        }
    });
    
    // 決定插入位置（在卡片前或後）
    if (insertAfterCard) {
        const cardRect = insertAfterCard.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        
        // 基於網格佈局判斷插入位置
        const isGridLayout = window.getComputedStyle(cardGrid).display.includes('grid');
        
        if (isGridLayout) {
            // 網格佈局：根據位置決定插入點
            const isAfter = (y > cardCenterY) || (y === cardCenterY && x > cardCenterX);
            insertPlaceholder(insertAfterCard, isAfter);
        } else {
            // 其他佈局：簡單的前後判斷
            const isAfter = x > cardCenterX;
            insertPlaceholder(insertAfterCard, isAfter);
        }
    }
}

// 創建拖拽佔位符
function createPlaceholder() {
    if (dragPlaceholder) return dragPlaceholder;
    
    dragPlaceholder = document.createElement('div');
    dragPlaceholder.className = 'drag-placeholder task-card-item';
    
    // 設置佔位符尺寸與原卡片相同
    if (draggedCard) {
        const rect = draggedCard.getBoundingClientRect();
        dragPlaceholder.style.height = rect.height + 'px';
        dragPlaceholder.style.minHeight = rect.height + 'px';
    }
    
    return dragPlaceholder;
}

// 移除拖拽佔位符
function removePlaceholder() {
    if (dragPlaceholder && dragPlaceholder.parentNode) {
        dragPlaceholder.parentNode.removeChild(dragPlaceholder);
    }
    dragPlaceholder = null;
}

// 插入佔位符
function insertPlaceholder(afterCard, isAfter = true) {
    const cardGrid = document.getElementById('taskCardsGrid');
    if (!cardGrid) return;
    
    // 移除現有佔位符
    removePlaceholder();
    
    // 創建新佔位符
    const placeholder = createPlaceholder();
    
    if (isAfter) {
        // 在指定卡片後插入
        if (afterCard.nextSibling) {
            cardGrid.insertBefore(placeholder, afterCard.nextSibling);
        } else {
            cardGrid.appendChild(placeholder);
        }
    } else {
        // 在指定卡片前插入
        cardGrid.insertBefore(placeholder, afterCard);
    }
    
    console.log('[REORDER] 佔位符已插入', isAfter ? '後面' : '前面', afterCard);
}

// 執行卡片重新排序
function reorderCard() {
    if (!dragPlaceholder || !draggedCard) return false;
    
    const cardGrid = document.getElementById('taskCardsGrid');
    if (!cardGrid) return false;
    
    console.log('[REORDER] 開始重新排序卡片');
    
    // 獲取佔位符的位置
    const placeholderIndex = Array.from(cardGrid.children).indexOf(dragPlaceholder);
    
    if (placeholderIndex === -1) return false;
    
    // 移除原卡片的拖拽樣式
    draggedCard.classList.remove('dragging');
    
    // 插入卡片到新位置
    if (placeholderIndex < cardGrid.children.length - 1) {
        cardGrid.insertBefore(draggedCard, cardGrid.children[placeholderIndex]);
    } else {
        cardGrid.appendChild(draggedCard);
    }
    
    // 移除佔位符
    removePlaceholder();
    
    // 添加重新排序動畫
    draggedCard.classList.add('reordering');
    setTimeout(() => {
        draggedCard.classList.remove('reordering');
    }, 400);
    
    console.log('[REORDER] 卡片重新排序完成');
    
    // 這裡可以添加後端API調用來保存新順序
    // saveCardOrder();
    
    return true;
}