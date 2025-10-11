// 任務卡片 CoopCard 主頁 JavaScript - 情緒AI風格版本
/* 背景系統已移至 common/starry_background.js */

// 全局變量
let currentSearchModal = null;
let requestDropdownOpen = false;
let searchTimeout = null;
let isSearching = false;

// 面板狀態
let leftPanelCollapsed = false;
let rightPanelCollapsed = false;

// User ID 管理器
let userIdManager = null;

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] CoopCard 頁面開始初始化...');
    
    // 初始化 User ID 管理器 (最優先)
    initializeUserIdManager();
    
    initializeCoopCard();
    initializeSearch();
    initializePanelToggle();
    initializeGuidanceRotation(); // 新增：初始化引導標語切換
    
    // 任務卡片編輯器已移至 coopcard_inline.js 模組
    
    // 初始化簡化的任務卡片請求系統
    setTimeout(() => {
        console.log('[簡化任務卡片] 初始化任務卡片請求系統...');
        initializeFriendRequestPanel();
        // 載入徽章數量 - 使用簡化版本
        loadRequestBadgeCountSimple();
    }, 100);
    
    // 初始化開發測試功能
    setTimeout(() => {
        initializeDevTestFeature();
    }, 200);
    
    console.log('[DEBUG] CoopCard 初始化完成');
});

// 初始化 User ID 管理器
function initializeUserIdManager() {
    try {
        if (typeof UserIdManager !== 'undefined') {
            userIdManager = new UserIdManager();
            console.log('[DEBUG] User ID 管理器初始化成功');
            
            // 監聽用戶 ID 準備就緒事件
            document.addEventListener('userIdReady', function(event) {
                console.log('[DEBUG] 用戶 ID 準備就緒:', event.detail.userId);
                // 可以在這裡觸發其他依賴用戶 ID 的功能
                refreshFriendsList();
            });
        } else {
            console.error('[ERROR] UserIdManager 類未找到');
        }
    } catch (error) {
        console.error('[ERROR] 初始化 User ID 管理器失敗:', error);
    }
}

// 初始化CoopCard功能
function initializeCoopCard() {
    // 監聽點擊事件關閉下拉選單
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.request-dropdown')) {
            closeRequestDropdown();
        }
        
        // 點擊搜尋區域外關閉搜尋結果
        if (!e.target.closest('.friend-search-container')) {
            closeSearchResults();
        }
        
        if (!e.target.closest('.modal-content') && e.target.classList.contains('modal-overlay')) {
            closeSearchModal();
        }
    });
    
    // ESC鍵關閉模態框和搜尋結果
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSearchModal();
            closeSearchResults();
        }
    });
    
    // 模態框關閉按鈕
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeSearchModal);
    }
    
    // 面板關閉按鈕
    const panelCloseBtn = document.getElementById('panel-close-btn');
    if (panelCloseBtn) {
        panelCloseBtn.addEventListener('click', closeFriendRequestPanel);
    }
}

// 初始化面板切換功能
function initializePanelToggle() {
    const leftToggleBtn = document.getElementById('leftPanelToggle');
    const rightToggleBtn = document.getElementById('rightPanelToggle');
    const container = document.querySelector('.coopcard-three-column-container');
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    
    if (leftToggleBtn && container && leftPanel) {
        leftToggleBtn.addEventListener('click', function() {
            leftPanelCollapsed = !leftPanelCollapsed;
            updatePanelLayout();
            
            // 更新按鈕圖標
            const icon = this.querySelector('i');
            if (leftPanelCollapsed) {
                icon.className = 'fas fa-chevron-right';
                leftPanel.classList.add('collapsed');
            } else {
                icon.className = 'fas fa-chevron-left';
                leftPanel.classList.remove('collapsed');
            }
        });
    }
    
    if (rightToggleBtn && container && rightPanel) {
        rightToggleBtn.addEventListener('click', function() {
            rightPanelCollapsed = !rightPanelCollapsed;
            updatePanelLayout();
            
            // 更新按鈕圖標
            const icon = this.querySelector('i');
            if (rightPanelCollapsed) {
                icon.className = 'fas fa-chevron-left';
                rightPanel.classList.add('collapsed');
            } else {
                icon.className = 'fas fa-chevron-right';
                rightPanel.classList.remove('collapsed');
            }
        });
    }
}

// 更新面板佈局
function updatePanelLayout() {
    const container = document.querySelector('.coopcard-three-column-container');
    if (!container) return;
    
    // 移除所有佈局類
    container.classList.remove('left-collapsed', 'right-collapsed', 'both-collapsed');
    
    // 添加對應的佈局類
    if (leftPanelCollapsed && rightPanelCollapsed) {
        container.classList.add('both-collapsed');
    } else if (leftPanelCollapsed) {
        container.classList.add('left-collapsed');
    } else if (rightPanelCollapsed) {
        container.classList.add('right-collapsed');
    }
}

// === 初始化函數 ===
/* 背景動畫初始化已移至 common/starry_background.js */

// 初始化搜尋功能
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    
    if (searchInput) {
        // 即時搜尋
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            // 顯示/隱藏清除按鈕
            if (clearBtn) {
                clearBtn.style.display = query ? 'block' : 'none';
            }
            
            // 清除之前的搜尋計時器
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            if (query.length === 0) {
                closeSearchResults();
                return;
            }
            
            // 設置新的搜尋計時器
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 500);
        });
        
        // Enter鍵搜尋
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    if (searchTimeout) {
                        clearTimeout(searchTimeout);
                    }
                    performSearch(query);
                }
            }
        });
    }
    
    // 清除按鈕
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                this.style.display = 'none';
                closeSearchResults();
            }
        });
    }
}

// 執行搜尋
function performSearch(query) {
    if (isSearching) return;
    
    console.log('[DEBUG] 執行搜尋:', query);
    
    const resultsDropdown = document.getElementById('search-results-dropdown');
    const resultsList = document.getElementById('search-results-list');
    const resultsCount = document.getElementById('results-count');
    
    if (!resultsDropdown || !resultsList || !resultsCount) {
        console.error('[ERROR] 搜尋結果元素未找到');
        return;
    }
    
    // 顯示載入狀態
    resultsDropdown.style.display = 'block';
    resultsCount.textContent = '搜尋中...';
    resultsList.innerHTML = '<div class="search-loading">🔍 正在搜尋...</div>';
    
    isSearching = true;
    
    // 發送搜尋請求 (使用擴展的搜尋 API，支援 user_id)
    fetch(`/coopcard/api/search_users_extended?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            console.log('[DEBUG] 搜尋結果:', data);
            
            if (data.success) {
                displaySearchResults(data.users, query);
            } else {
                console.error('[ERROR] 搜尋失敗:', data.message);
                showSearchError(data.message || '搜尋失敗，請稍後再試');
            }
        })
        .catch(error => {
            console.error('[ERROR] 搜尋請求失敗:', error);
            showSearchError('網路錯誤，請檢查連線後再試');
        })
        .finally(() => {
            isSearching = false;
        });
}

// 根據好友狀態獲取對應圖標
function getFriendButtonIcon(status) {
    switch (status) {
        case 'status-can-send':
            return '<i class="fas fa-plus"></i>'; // 加號 - 可發送請求
        case 'status-pending':
            return '<i class="fas fa-check"></i>'; // 打勾 - 已發送請求
        case 'status-friends':
            return '😊'; // 笑臉 - 已是好友
        case 'status-received':
            return '<i class="fas fa-envelope"></i>'; // 信封 - 已收到請求
        default:
            return '<i class="fas fa-plus"></i>'; // 預設加號
    }
}

// 顯示搜尋結果
function displaySearchResults(users, query) {
    const resultsDropdown = document.getElementById('search-results-dropdown');
    const resultsList = document.getElementById('search-results-list');
    const resultsCount = document.getElementById('results-count');
    
    if (!users || users.length === 0) {
        resultsCount.textContent = '沒有找到匹配的用戶';
        resultsList.innerHTML = '<div class="search-no-results">😔 沒有找到相關用戶<br><small>試試輸入完整的Email或不同的關鍵字</small></div>';
        return;
    }
    
    resultsCount.textContent = `找到 ${users.length} 位用戶`;
    
    let html = '';
    users.forEach(user => {
        const statusClass = user.button_class || 'status-can-send';
        const buttonIcon = getFriendButtonIcon(statusClass);
        const isDisabled = user.button_disabled ? 'disabled' : '';
        
        // 改善姓名顯示邏輯：如果 User_name 是 Email 格式或類似 ID，則優先顯示 user_id 或提供更友好的顯示
        let displayName = user.name;
        let displaySubtitle = user.email;
        
        // 檢查 name 是否是 Email 格式
        const isEmailFormat = user.name && user.name.includes('@');
        // 檢查 name 是否和 email 相同
        const isNameSameAsEmail = user.name === user.email;
        
        if (isEmailFormat || isNameSameAsEmail) {
            // 如果有 user_id，則優先顯示 user_id 作為主要名稱
            if (user.user_id) {
                displayName = user.user_id;
                displaySubtitle = user.email;
            } else {
                // 如果沒有 user_id，從 email 中提取用戶名部分
                const emailUsername = user.email.split('@')[0];
                displayName = emailUsername;
                displaySubtitle = user.email;
            }
        }
        
        html += `
            <div class="search-result-item" data-user-email="${user.email}">
                <div class="search-result-avatar">
                    <img src="${user.avatar}" alt="${displayName}" onerror="this.src='/static/icons/avatars/default.png'">
                </div>
                <div class="search-result-info">
                    <div class="search-result-name">${escapeHtml(displayName)}</div>
                    ${user.user_id ? `<div class="search-result-userid">用戶ID: ${escapeHtml(user.user_id)}</div>` : '<div class="search-result-no-userid">尚未設定用戶ID</div>'}
                </div>
                <div class="search-result-action">
                    <button class="send-request-btn ${statusClass}" 
                            onclick="sendFriendRequest('${user.email}')" 
                            title="${user.status_text || '發送好友請求'}"
                            ${isDisabled}>
                        ${buttonIcon}
                    </button>
                </div>
            </div>
        `;
    });
    
    resultsList.innerHTML = html;
    resultsDropdown.style.display = 'block';
}

// 顯示搜尋錯誤
function showSearchError(message) {
    const resultsDropdown = document.getElementById('search-results-dropdown');
    const resultsList = document.getElementById('search-results-list');
    const resultsCount = document.getElementById('results-count');
    
    resultsCount.textContent = '搜尋失敗';
    resultsList.innerHTML = `<div class="search-error">❌ ${escapeHtml(message)}</div>`;
    resultsDropdown.style.display = 'block';
}

// 關閉搜尋結果
function closeSearchResults() {
    const resultsDropdown = document.getElementById('search-results-dropdown');
    if (resultsDropdown) {
        resultsDropdown.style.display = 'none';
    }
}

// 發送好友請求 - 簡化版本
function sendFriendRequest(targetEmail) {
    if (!targetEmail) {
        console.error('[簡化任務卡片] 缺少目標用戶Email');
        showNotification('❌ 請提供目標用戶Email', 'error');
        return;
    }
    
    console.log('[簡化任務卡片] 發送任務卡片請求到:', targetEmail);
    
    // 禁用對應的按鈕以防止重複發送
    const button = document.querySelector(`[data-user-email="${targetEmail}"] .send-request-btn`); 
    if (button) {
        button.disabled = true;
        button.innerHTML = '⏳';
        button.title = '發送中...';
    }
    
    fetch('/coopcard/api/send_friend_request_simple', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            target_email: targetEmail
        })
    })
    .then(response => {
        console.log('[簡化任務卡片] API回應狀態:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('[簡化任務卡片] 請求回應:', data);
        
        if (data.success) {
            showNotification('✅ ' + data.message, 'success');
            // 更新按鈕狀態為已發送
            updateRequestButtonStatusSimple(targetEmail, 'pending', '請求已發送', '📤');
        } else {
            showNotification('❌ ' + data.message, 'error');
            // 恢復按鈕狀態
            updateRequestButtonStatusSimple(targetEmail, 'can_send', '發送好友請求', '➕');
        }
    })
    .catch(error => {
        console.error('[簡化任務卡片] 發送請求錯誤:', error);
        showNotification('❌ 發送請求失敗，請檢查網路連線', 'error');
        // 恢復按鈕狀態
        updateRequestButtonStatusSimple(targetEmail, 'can_send', '發送好友請求', '➕');
    });
}

// 更新請求按鈕狀態 - 簡化版本
function updateRequestButtonStatusSimple(email, status, text, icon) {
    const button = document.querySelector(`[data-user-email="${email}"] .send-request-btn`);
    if (button) {
        const statusClass = `status-${status.replace('_', '-')}`;
        button.className = `send-request-btn ${statusClass}`;
        button.innerHTML = icon || getFriendButtonIcon(statusClass);
        button.title = text;
        button.disabled = (status !== 'can_send');
        
        console.log('[簡化任務卡片] 按鈕狀態已更新:', email, status, text);
    } else {
        console.error('[簡化任務卡片] 找不到對應的按鈕:', email);
    }
}

// 更新請求按鈕狀態
function updateRequestButtonStatus(email, status, text) {
    const button = document.querySelector(`[data-user-email="${email}"] .send-request-btn`);
    if (button) {
        const statusClass = `status-${status.replace('_', '-')}`;
        button.className = `send-request-btn ${statusClass}`;
        button.innerHTML = getFriendButtonIcon(statusClass);
        button.title = text;
        button.disabled = (status !== 'can_send');
    }
}

// 初始化好友請求浮動面板
function initializeFriendRequestPanel() {
    const toggleBtn = document.getElementById('request-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleFriendRequestPanel);
    }
}

// 切換好友請求面板
function toggleFriendRequestPanel() {
    const panel = document.getElementById('friend-request-panel');
    if (!panel) {
        console.error('[ERROR] 好友請求面板未找到');
        return;
    }
    
    if (panel.style.display === 'none' || !panel.style.display) {
        // 顯示面板
        panel.style.display = 'block';
        loadFriendRequests(); // 使用簡化版本函數
        requestDropdownOpen = true;
    } else {
        // 隱藏面板
        panel.style.display = 'none';
        requestDropdownOpen = false;
    }
}

// 關閉好友請求面板
function closeFriendRequestPanel() {
    const panel = document.getElementById('friend-request-panel');
    if (panel) {
        panel.style.display = 'none';
        requestDropdownOpen = false;
    }
}

// ============================================================================
// 簡化的好友請求功能 - 重新設計以避免複雜邏輯干擾
// ============================================================================

// 載入好友請求 - 簡化版本
function loadFriendRequests() {
    const requestList = document.getElementById('floating-request-list');
    if (!requestList) {
        console.error('[簡化任務卡片] 找不到好友請求列表元素');
        return;
    }
    
    console.log('[簡化任務卡片] 開始載入任務卡片請求...');
    requestList.innerHTML = '<div class="loading-item">載入中...</div>';
    
    fetch('/coopcard/api/friend_requests_simple', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        console.log('[簡化任務卡片] API回應狀態:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('[簡化任務卡片] 收到資料:', data);
        
        if (data.success) {
            displayFriendRequestsSimple(data.requests);
        } else {
            console.error('[簡化任務卡片] 載入失敗:', data.message);
            requestList.innerHTML = '<div class="error-item">❌ 載入失敗<br>' + data.message + '</div>';
        }
    })
    .catch(error => {
        console.error('[簡化任務卡片] 請求錯誤:', error);
        requestList.innerHTML = '<div class="error-item">❌ 網路錯誤<br>請檢查連線後重試</div>';
    });
}

// 顯示好友請求 - 簡化版本
function displayFriendRequestsSimple(requests) {
    const requestList = document.getElementById('floating-request-list');
    if (!requestList) return;
    
    console.log('[簡化任務卡片] 顯示', requests.length, '個任務卡片請求');
    
    if (!requests || requests.length === 0) {
        requestList.innerHTML = '<div class="empty-item">🎉 暫無待處理的任務卡片請求</div>';
        return;
    }
    
    let html = '';
    requests.forEach(request => {
        html += `
            <div class="request-item" data-request-id="${request.id}">
                <div class="request-avatar">
                    <img src="${request.avatar}" alt="${request.name}" onerror="this.src='/static/icons/avatars/default.png'">
                </div>
                <div class="request-info">
                    <div class="request-name">${escapeHtml(request.name)}</div>
                    ${request.user_id ? `<div class="request-userid">用戶ID: ${escapeHtml(request.user_id)}</div>` : '<div class="request-no-userid">尚未設定用戶ID</div>'}
                </div>
                <div class="request-actions">
                    <button class="accept-btn" onclick="respondFriendRequestSimple(${request.id}, 'accept')" title="接受">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="reject-btn" onclick="respondFriendRequestSimple(${request.id}, 'reject')" title="拒絕">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    requestList.innerHTML = html;
}

// 回應好友請求 - 簡化版本
function respondFriendRequestSimple(requestId, action) {
    if (!requestId || !action) {
        console.error('[簡化任務卡片] 缺少請求參數');
        return;
    }
    
    console.log('[簡化任務卡片] 回應請求:', requestId, action);
    
    // 禁用按鈕防止重複點擊
    const requestItem = document.querySelector(`[data-request-id="${requestId}"]`);
    if (requestItem) {
        const buttons = requestItem.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);
    }
    
    fetch('/coopcard/api/respond_friend_request_simple', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            request_id: requestId,
            action: action
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('[簡化任務卡片] 回應結果:', data);
        
        if (data.success) {
            const actionText = action === 'accept' ? '接受' : '拒絕';
            showNotification('✅ ' + data.message, 'success');
            
            // 移除已處理的請求項目
            if (requestItem) {
                requestItem.style.opacity = '0.5';
                requestItem.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    requestItem.remove();
                    
                    // 檢查是否還有其他請求
                    const requestList = document.getElementById('floating-request-list');
                    if (requestList && requestList.children.length === 0) {
                        requestList.innerHTML = '<div class="empty-item">🎉 暫無待處理的任務卡片請求</div>';
                    }
                }, 300);
            }
            
            // 更新徽章計數
            loadRequestBadgeCountSimple();
        } else {
            showNotification('❌ ' + data.message, 'error');
            // 重新啟用按鈕
            if (requestItem) {
                const buttons = requestItem.querySelectorAll('button');
                buttons.forEach(btn => btn.disabled = false);
            }
        }
    })
    .catch(error => {
        console.error('[簡化任務卡片] 回應錯誤:', error);
        showNotification('❌ 操作失敗，請稍後再試', 'error');
        // 重新啟用按鈕
        if (requestItem) {
            const buttons = requestItem.querySelectorAll('button');
            buttons.forEach(btn => btn.disabled = false);
        }
    });
}

// 載入請求徽章數量 - 簡化版本
function loadRequestBadgeCountSimple() {
    fetch('/coopcard/api/friend_requests_simple', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const count = data.count || 0;
            
            // 更新好友請求按鈕徽章
            const badge = document.getElementById('request-badge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
            
            console.log('[簡化任務卡片] 徽章計數已更新:', count);
        }
    })
    .catch(error => {
        console.error('[簡化任務卡片] 載入徽章計數失敗:', error);
    });
}

// 顯示好友請求
function displayFriendRequests(requests) {
    const requestList = document.getElementById('floating-request-list');
    if (!requestList) return;
    
    if (!requests || requests.length === 0) {
        requestList.innerHTML = '<div class="empty-item">暫無待處理的任務卡片請求</div>';
        return;
    }
    
    let html = '';
    requests.forEach(request => {
        html += `
            <div class="request-item" data-request-id="${request.id}">
                <div class="request-avatar">
                    <img src="${request.avatar}" alt="${request.name}" onerror="this.src='/static/icons/avatars/default.png'">
                </div>
                <div class="request-info">
                    <div class="request-name">${escapeHtml(request.name)}</div>
                    ${request.user_id ? `<div class="request-userid">用戶ID: ${escapeHtml(request.user_id)}</div>` : '<div class="request-no-userid">尚未設定用戶ID</div>'}
                </div>
                <div class="request-actions">
                    <button class="accept-btn" onclick="respondRequest(${request.id}, 'accept')" title="接受"><i class="fas fa-check"></i></button>
                    <button class="reject-btn" onclick="respondRequest(${request.id}, 'reject')" title="拒絕"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
    });
    
    requestList.innerHTML = html;
}

// 更新統計數據
function updateStats(action) {
    // 更新好友請求徽章數量 - 使用簡化版本
    loadRequestBadgeCountSimple();
    
    // 如果是接受好友請求，需要更新好友數量
    if (action === 'accept') {
        updateFriendCount();
    }
    
    // 更新好友列表預覽（如果需要）
    // loadFriendsPreview();
}

// 更新好友數量
function updateFriendCount() {
    fetch('/coopcard/api/friends_stats', {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 更新右側面板的好友統計
            const friendsCountElement = document.querySelector('.stat-item:first-child .stat-number');
            if (friendsCountElement) {
                // 添加動畫效果
                friendsCountElement.style.transform = 'scale(1.2)';
                friendsCountElement.style.color = 'rgba(100, 255, 218, 1)';
                
                setTimeout(() => {
                    friendsCountElement.textContent = data.friends_count;
                    setTimeout(() => {
                        friendsCountElement.style.transform = 'scale(1)';
                        friendsCountElement.style.color = 'rgba(100, 255, 218, 0.9)';
                    }, 150);
                }, 150);
            }
        }
    })
    .catch(error => {
        console.error('[ERROR] 更新好友數量失敗:', error);
    });
}

// 回應好友請求
function respondRequest(requestId, action) {
    if (!requestId || !action) {
        console.error('[ERROR] 缺少請求參數');
        return;
    }
    
    console.log('[DEBUG] 回應任務卡片請求:', requestId, action);
    
    const formData = new FormData();
    formData.append('request_id', requestId);
    formData.append('action', action);
    
    fetch('/coopcard/respond_request', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('[DEBUG] 回應結果:', data);
        
        if (data.success) {
            const actionText = action === 'accept' ? '接受' : '拒絕';
            showNotification('✅ ' + data.message, 'success');
            
            // 移除已處理的請求項目（添加動畫效果）
            const requestItem = document.querySelector(`[data-request-id="${requestId}"]`);
            if (requestItem) {
                requestItem.style.transform = 'translateX(-100%)';
                requestItem.style.opacity = '0';
                setTimeout(() => {
                    requestItem.remove();
                    
                    // 檢查是否還有其他請求項目，如果沒有則顯示空狀態
                    const requestList = document.getElementById('floating-request-list');
                    if (requestList && requestList.children.length === 0) {
                        requestList.innerHTML = '<div class="empty-item">暫無待處理的任務卡片請求</div>';
                    }
                }, 300);
            }
            
            // 更新統計數據
            updateStats(action);
        } else {
            showNotification('❌ ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('[ERROR] 回應請求失敗:', error);
        showNotification('❌ 操作失敗，請稍後再試', 'error');
    });
}

// 舊的載入請求徽章數量函數已移除，使用簡化版本 loadRequestBadgeCountSimple

// 關閉請求下拉選單
function closeRequestDropdown() {
    if (requestDropdownOpen) {
        closeFriendRequestPanel();
    }
}

// 關閉搜尋模態框
function closeSearchModal() {
    if (currentSearchModal) {
        currentSearchModal.style.display = 'none';
        currentSearchModal = null;
    }
}

// 顯示通知
function showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 設置樣式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(40, 167, 69, 0.9)' : type === 'error' ? 'rgba(220, 53, 69, 0.9)' : 'rgba(23, 162, 184, 0.9)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // 顯示動畫
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 自動移除
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// HTML轉義函數
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// 任務卡片功能已移至 coopcard_inline.js 模組

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] CoopCard 頁面開始初始化...');
    
    initializeCoopCard();
    initializeSearch();
    initializePanelToggle();
    initializeBackgroundAnimation();
    
    // 初始化任務卡片編輯器
    initializeTaskCardEditor();
    
    // 初始化簡化的任務卡片請求系統
    setTimeout(() => {
        console.log('[簡化任務卡片] 初始化任務卡片請求系統...');
        initializeFriendRequestPanel();
        // 載入徽章數量 - 使用簡化版本
        loadRequestBadgeCountSimple();
    }, 100);
    
    console.log('[DEBUG] CoopCard 初始化完成');
});

// ===== 好友互動小視窗功能 =====
// 初始化好友互動小視窗
function initializeFriendsWidget() {
    console.log('[DEBUG] 初始化任務卡片小視窗...');
    
    // 綁定標籤切換事件
    const tabBtns = document.querySelectorAll('.widget-tabs .tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 移除禁用檢查，讓用戶可以自由切換所有標籤
            const targetTab = btn.dataset.tab;
            switchWidgetTab(targetTab);
        });
    });
    
    // 初始化時檢查用戶ID狀態
    checkUserIdAndInitializeTabs();
    
    // 監聽用戶ID創建完成事件
    document.addEventListener('userIdReady', (event) => {
        console.log('[DEBUG] 用戶ID已準備就緒，啟用其他標籤');
        enableAllTabs();
        loadFriendsWidget();
        loadFriendRequests();
        
        // 切換到好友標籤
        switchWidgetTab('friends');
    });
}

// 檢查用戶ID狀態並初始化標籤
function checkUserIdAndInitializeTabs() {
    // 始終啟用所有標籤，不再限制功能使用
    enableAllTabs();
    loadFriendsWidget();
    loadFriendRequests();
    
    // 記住用戶最後選擇的標籤，預設為friends標籤
    const savedTab = localStorage.getItem('coopcard_widget_tab') || 'friends';
    switchWidgetTab(savedTab);
}

// 啟用所有標籤
function enableAllTabs() {
    const tabBtns = document.querySelectorAll('.widget-tabs .tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.remove('disabled');
        btn.removeAttribute('disabled');
    });
}

// 禁用除了userid之外的所有標籤
function disableTabsExceptUserId() {
    const tabBtns = document.querySelectorAll('.widget-tabs .tab-btn');
    tabBtns.forEach(btn => {
        if (btn.dataset.tab !== 'userid') {
            btn.classList.add('disabled');
            btn.setAttribute('disabled', 'true');
        }
    });
}

// 顯示需要用戶ID的提示
function showUserIdRequiredNotice() {
    // 創建提示框
    const notice = document.createElement('div');
    notice.className = 'user-id-notice';
    notice.innerHTML = `
        <div class="notice-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>請先創建個人ID才能使用任務卡片功能！</span>
        </div>
    `;
    
    document.body.appendChild(notice);
    
    // 3秒後自動消失
    setTimeout(() => {
        notice.classList.add('fadeout');
        setTimeout(() => {
            document.body.removeChild(notice);
        }, 300);
    }, 3000);
}

// 切換標籤
function switchWidgetTab(tabName) {
    console.log('[DEBUG] 切換到標籤:', tabName);
    
    // 更新按鈕狀態
    const tabBtns = document.querySelectorAll('.widget-tabs .tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
        // 移除所有禁用狀態，讓用戶自由使用所有功能
        btn.classList.remove('disabled');
        btn.removeAttribute('disabled');
    });
    
    // 更新面板顯示
    tabPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `${tabName}-panel`) {
            panel.classList.add('active');
        }
    });
    
    // 保存用戶選擇
    localStorage.setItem('coopcard_widget_tab', tabName);
    
    // 根據標籤載入對應內容
    if (tabName === 'friends') {
        loadFriendsWidget();
    }
}

// 載入好友列表到小視窗
function loadFriendsWidget() {
    console.log('[DEBUG] 載入好友列表到小視窗...');
    
    const friendsContent = document.getElementById('friendsContent');
    if (!friendsContent) return;
    
    // 顯示載入狀態
    friendsContent.innerHTML = `
        <div class="friends-placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <span>載入好友列表中...</span>
            <small style="font-size: 0.7em; opacity: 0.7; margin-top: 4px;">使用左側搜尋功能添加好友</small>
        </div>
    `;
    
    // 發送請求獲取好友列表
    fetch('/coopcard/api/friends_widget')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayFriendsWidget(data.friends);
            } else {
                showFriendsWidgetError(data.message || '載入失敗');
            }
        })
        .catch(error => {
            console.error('[ERROR] 載入好友列表失敗:', error);
            showFriendsWidgetError('網路錯誤，請檢查連接');
        });
}

// 顯示好友列表
function displayFriendsWidget(friends) {
    const friendsContent = document.getElementById('friendsContent');
    if (!friendsContent) return;
    
    if (friends.length === 0) {
        friendsContent.innerHTML = `
            <div class="friends-placeholder">
                <i class="fas fa-user-plus"></i>
                <span>還沒有好友</span>
                <small style="font-size: 0.7em; opacity: 0.7; margin-top: 4px;">使用左側搜尋功能添加好友</small>
            </div>
        `;
        return;
    }
    
    // 生成好友列表HTML
    const friendsHtml = friends.map(friend => `
        <div class="friend-item" data-friend-email="${friend.email}">
            <div class="friend-info">
                <div class="widget-friend-avatar">
                    <img src="${friend.avatar || '/static/icons/avatars/default.png'}" 
                         alt="${friend.name}的頭像" 
                         onerror="this.src='/static/icons/avatars/default.png'">
                </div>
                <div class="friend-details">
                    <div class="friend-name">${friend.name}</div>
                    ${friend.user_id ? `<div class="friend-userid">用戶ID: ${friend.user_id}</div>` : '<div class="friend-no-userid">尚未設定用戶ID</div>'}
                </div>
            </div>
            <button class="friend-delete-btn" onclick="deleteFriendWidget('${friend.email}', '${friend.name}')" title="刪除好友">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    friendsContent.innerHTML = friendsHtml;
}

// 顯示錯誤狀態
function showFriendsWidgetError(message) {
    const friendsContent = document.getElementById('friendsContent');
    if (!friendsContent) return;
    
    friendsContent.innerHTML = `
        <div class="friends-placeholder" style="color: rgba(239, 68, 68, 0.8);">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="loadFriendsWidget()" style="
                margin-top: 8px; 
                padding: 4px 8px; 
                background: rgba(100, 255, 218, 0.2); 
                border: 1px solid rgba(100, 255, 218, 0.3); 
                border-radius: 4px; 
                color: #64ffda; 
                cursor: pointer;
                font-size: 0.7em;
            ">重試</button>
        </div>
    `;
}

// 刪除好友
function deleteFriendWidget(friendEmail, friendName) {
    console.log('[DEBUG] 請求刪除好友:', friendEmail, friendName);
    
    // 確認對話框
    if (!confirm(`確定要刪除好友「${friendName}」嗎？此操作無法撤回。`)) {
        return;
    }
    
    // 發送刪除請求
    fetch('/coopcard/remove_friend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            friend_email: friendEmail
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 刪除成功，重新載入好友列表
            loadFriendsWidget();
            
            // 顯示成功提示
            showNotification(`已刪除好友「${friendName}」`, 'success');
            
            // 更新右側統計數據
            updateFriendsStats();
        } else {
            console.error('[ERROR] 刪除好友失敗:', data.message);
            showNotification(data.message || '刪除失敗', 'error');
        }
    })
    .catch(error => {
        console.error('[ERROR] 刪除好友請求失敗:', error);
        showNotification('網路錯誤，請稍後再試', 'error');
    });
}

// 舊的好友請求管理功能已移除，使用簡化版本







// 舊的toggleRequestsSection函數已移除

// 舊的toggleRequestsNotification函數已移除，使用簡化版本

// 更新好友統計數據
function updateFriendsStats() {
    // 這個函數用於更新右側面板的好友統計信息
    fetch('/coopcard/api/friends_stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 更新統計數字
                const friendsCountElement = document.querySelector('.stat-number');
                if (friendsCountElement) {
                    friendsCountElement.textContent = data.friends_count;
                }
            }
        })
        .catch(error => {
            console.error('[ERROR] 更新統計失敗:', error);
        });
}

// 顯示通知
function showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification-popup ${type}`;
    notification.textContent = message;
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 顯示動畫
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // 3秒後隱藏
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        // 動畫完成後移除元素
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, 3000);
}

// 頁面載入時初始化好友小視窗
document.addEventListener('DOMContentLoaded', function() {
    // 延遲初始化，確保其他功能先載入
    setTimeout(() => {
        initializeFriendsWidget();
    }, 500);
});

// 窗口調整大小時重新計算粒子位置
window.addEventListener('resize', function() {
    // 清理現有粒子
    particles.forEach(particle => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    });
    particles = [];
    
    // 重新創建粒子
    setTimeout(() => {
        createParticles();
    }, 100);
});

// 頁面卸載時清理動畫
window.addEventListener('beforeunload', function() {
    if (particleAnimationFrame) {
        cancelAnimationFrame(particleAnimationFrame);
    }
});

// ===== 新增：引導標語切換功能 =====
let guidanceRotationInterval = null;
let currentGuidanceIndex = 0;

// 初始化引導標語切換功能
function initializeGuidanceRotation() {
    const guidanceMessages = document.querySelectorAll('.guidance-message');
    
    if (guidanceMessages.length === 0) {
        console.log('[DEBUG] 沒有找到引導標語元素');
        return;
    }
    
    console.log('[DEBUG] 初始化引導標語切換，共有', guidanceMessages.length, '個標語');
    
    // 確保只有第一個標語顯示
    guidanceMessages.forEach((message, index) => {
        if (index === 0) {
            message.classList.add('active');
        } else {
            message.classList.remove('active');
        }
    });
    
    // 開始輪播
    startGuidanceRotation();
}

// 開始引導標語輪播
function startGuidanceRotation() {
    const guidanceMessages = document.querySelectorAll('.guidance-message');
    
    if (guidanceMessages.length <= 1) {
        return; // 如果只有一個或沒有標語，不需要輪播
    }
    
    // 清除舊的計時器
    if (guidanceRotationInterval) {
        clearInterval(guidanceRotationInterval);
    }
    
    // 每3秒切換一次
    guidanceRotationInterval = setInterval(() => {
        // 隱藏當前標語
        guidanceMessages[currentGuidanceIndex].classList.remove('active');
        
        // 移動到下一個標語
        currentGuidanceIndex = (currentGuidanceIndex + 1) % guidanceMessages.length;
        
        // 顯示新標語
        guidanceMessages[currentGuidanceIndex].classList.add('active');
        
        console.log('[DEBUG] 切換到引導標語:', currentGuidanceIndex + 1);
    }, 3000);
    
    console.log('[DEBUG] 引導標語輪播已開始');
}

// 停止引導標語輪播
function stopGuidanceRotation() {
    if (guidanceRotationInterval) {
        clearInterval(guidanceRotationInterval);
        guidanceRotationInterval = null;
        console.log('[DEBUG] 引導標語輪播已停止');
    }
}

// 手動切換到指定標語
function switchToGuidance(index) {
    const guidanceMessages = document.querySelectorAll('.guidance-message');
    
    if (index < 0 || index >= guidanceMessages.length) {
        console.warn('[WARN] 無效的標語索引:', index);
        return;
    }
    
    // 隱藏當前標語
    guidanceMessages[currentGuidanceIndex].classList.remove('active');
    
    // 更新索引並顯示新標語
    currentGuidanceIndex = index;
    guidanceMessages[currentGuidanceIndex].classList.add('active');
    
    // 重新開始輪播
    startGuidanceRotation();
    
    console.log('[DEBUG] 手動切換到引導標語:', index + 1);
}

// ===== 開發測試功能 =====

// 初始化開發測試功能
function initializeDevTestFeature() {
    console.log('[DEV] 初始化開發測試功能...');
    
    const devToggleBtn = document.getElementById('devToggleBtn');
    const devTestContent = document.getElementById('devTestContent');
    
    if (!devToggleBtn || !devTestContent) {
        console.log('[DEV] 開發測試元素未找到，跳過初始化');
        return;
    }
    
    // 點擊切換按鈕
    devToggleBtn.addEventListener('click', function() {
        const isExpanded = devTestContent.style.display !== 'none';
        
        if (isExpanded) {
            // 收起
            devTestContent.style.display = 'none';
            devToggleBtn.classList.remove('expanded');
            console.log('[DEV] 收起開發測試選單');
        } else {
            // 展開
            devTestContent.style.display = 'block';
            devToggleBtn.classList.add('expanded');
            console.log('[DEV] 展開開發測試選單');
            
            // 首次展開時載入用戶列表
            loadAllUsersForDev();
        }
    });
    
    console.log('[DEV] 開發測試功能初始化完成');
}

// 載入所有用戶列表
function loadAllUsersForDev() {
    console.log('[DEV] 開始載入所有用戶列表...');
    
    const devLoading = document.getElementById('devLoading');
    const devUsersList = document.getElementById('devUsersList');
    
    if (!devLoading || !devUsersList) {
        console.error('[DEV] 找不到載入或列表元素');
        return;
    }
    
    // 顯示載入狀態
    devLoading.style.display = 'flex';
    devUsersList.style.display = 'none';
    
    fetch('/coopcard/api/dev/all_users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('[DEV] 用戶列表載入響應:', data);
        
        if (data.success) {
            displayDevUsersList(data.users);
        } else {
            console.error('[DEV] 載入用戶列表失敗:', data.error);
            showDevError('載入用戶列表失敗: ' + (data.error || '未知錯誤'));
        }
    })
    .catch(error => {
        console.error('[DEV] 載入用戶列表請求失敗:', error);
        showDevError('網路錯誤，請稍後再試');
    })
    .finally(() => {
        // 隱藏載入狀態
        devLoading.style.display = 'none';
    });
}

// 顯示用戶列表
function displayDevUsersList(users) {
    console.log('[DEV] 顯示用戶列表，共', users.length, '個用戶');
    
    const devUsersList = document.getElementById('devUsersList');
    
    if (!devUsersList) {
        console.error('[DEV] 找不到用戶列表容器');
        return;
    }
    
    if (users.length === 0) {
        devUsersList.innerHTML = `
            <div class="dev-user-item">
                <div class="dev-user-info">
                    <div class="dev-user-name">沒有其他用戶</div>
                    <div class="dev-user-email">系統中暫無其他用戶</div>
                </div>
            </div>
        `;
    } else {
        devUsersList.innerHTML = users.map(user => `
            <div class="dev-user-item">
                <img src="${user.avatar}" alt="${user.full_name || user.email}" class="dev-user-avatar" onerror="this.src='/static/icons/avatars/default.png'">
                <div class="dev-user-info">
                    <div class="dev-user-name">
                        <strong>姓名:</strong> ${escapeHtml(user.full_name || '未設置姓名')}
                    </div>
                    <div class="dev-user-email">
                        <strong>Email:</strong> ${escapeHtml(user.email)}
                    </div>
                    <div class="dev-user-id">
                        <strong>User ID:</strong> ${user.user_id ? escapeHtml(user.user_id) : '<span style="color: #999;">null</span>'}
                    </div>
                </div>
                <button class="dev-add-friend-btn ${user.button_class}" 
                        onclick="devAddFriend('${user.email}', this)"
                        ${user.button_disabled ? 'disabled' : ''}>
                    ${user.friend_status === 'friends' ? '<i class="fas fa-check"></i>' : '<i class="fas fa-plus"></i>'}
                </button>
            </div>
        `).join('');
    }
    
    devUsersList.style.display = 'block';
}

// 開發測試 - 直接添加好友
function devAddFriend(targetEmail, buttonElement) {
    console.log('[DEV] 開始添加好友:', targetEmail);
    
    if (!buttonElement) {
        console.error('[DEV] 按鈕元素未找到');
        return;
    }
    
    // 更新按鈕狀態
    const originalContent = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.classList.add('loading');
    buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    fetch('/coopcard/api/dev/direct_add_friend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            target_email: targetEmail
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('[DEV] 添加好友響應:', data);
        
        if (data.success) {
            // 成功添加好友
            buttonElement.innerHTML = '<i class="fas fa-check"></i>';
            buttonElement.classList.remove('loading');
            buttonElement.classList.add('dev-status-friends');
            
            // 顯示成功消息
            showNotification('success', data.message);
            
            // 更新好友統計（如果存在的話）
            updateFriendsStatsAfterAdd();
            
        } else {
            // 添加失敗，恢復按鈕
            buttonElement.innerHTML = originalContent;
            buttonElement.disabled = false;
            buttonElement.classList.remove('loading');
            
            showNotification('error', data.message || '添加好友失敗');
        }
    })
    .catch(error => {
        console.error('[DEV] 添加好友請求失敗:', error);
        
        // 恢復按鈕狀態
        buttonElement.innerHTML = originalContent;
        buttonElement.disabled = false;
        buttonElement.classList.remove('loading');
        
        showNotification('error', '網路錯誤，請稍後再試');
    });
}

// 顯示開發測試錯誤信息
function showDevError(message) {
    const devLoading = document.getElementById('devLoading');
    if (devLoading) {
        devLoading.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: rgba(239, 68, 68, 0.7);"></i>
            <span style="color: rgba(239, 68, 68, 0.8);">${message}</span>
        `;
    }
}

// 更新好友統計（在添加好友後）
function updateFriendsStatsAfterAdd() {
    // 這個函數可以用來更新右側面板的好友統計數字
    // 如果需要的話可以在這裡添加更新邏輯
    console.log('[DEV] 任務卡片統計更新完成');
}

// HTML轉義函數
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}