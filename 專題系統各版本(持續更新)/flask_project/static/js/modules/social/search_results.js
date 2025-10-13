document.addEventListener('DOMContentLoaded', () => {

  /* --- 時間格式化函數 --- */
  function formatRelativeTime(dateString) {
    try {
      let date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes('-') && dateString.includes(':')) {
        date = new Date(dateString.replace(' ', 'T'));
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);
      
      if (diffMs < 0) return '剛剛';
      
      if (diffSeconds < 30) return '剛剛';
      else if (diffSeconds < 60) return `${diffSeconds}秒前`;
      else if (diffMinutes < 60) return `${diffMinutes}分鐘前`;
      else if (diffHours < 24) return `${diffHours}小時前`;
      else if (diffDays < 7) return `${diffDays}天前`;
      else if (diffWeeks < 4) return `${diffWeeks}週前`;
      else if (diffMonths < 12) return `${diffMonths}個月前`;
      else return `${diffYears}年前`;
      
    } catch (error) {
      console.error('[ERROR] 時間格式化錯誤:', error);
      return dateString;
    }
  }

  /* --- 更新所有時間顯示 --- */
  function updateAllTimeDisplays() {
    document.querySelectorAll('.post-time').forEach(timeElement => {
      const originalTime = timeElement.getAttribute('data-original-time') || timeElement.textContent;
      if (!timeElement.getAttribute('data-original-time')) {
        timeElement.setAttribute('data-original-time', originalTime);
      }
      const formattedTime = formatRelativeTime(originalTime);
      timeElement.textContent = formattedTime;
      timeElement.title = `發布於: ${originalTime}`;
    });
  }

  // 頁面載入時立即更新時間
  updateAllTimeDisplays();
  
  // 每分鐘更新一次時間顯示
  setInterval(updateAllTimeDisplays, 60000);

  /* --- 搜尋表單處理 --- */
  const searchForm = document.querySelector('.search-bar');
  const searchInput = document.querySelector('.search-input');
  
  if (searchForm && searchInput) {
    // 處理表單提交
    searchForm.addEventListener('submit', function(e) {
      const query = searchInput.value.trim();
      if (!query) {
        e.preventDefault();
        alert('請輸入搜尋關鍵字');
        return false;
      }
    });
    
    // 處理 Enter 鍵
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = this.value.trim();
        if (query) {
          // 保持當前的搜尋類型
          const currentType = new URLSearchParams(window.location.search).get('type') || 'all';
          window.location.href = `/social/search?q=${encodeURIComponent(query)}&type=${currentType}`;
        } else {
          alert('請輸入搜尋關鍵字');
        }
      }
    });
    
    // 自動聚焦到搜尋框（如果沒有搜尋內容）
    if (!searchQuery || searchQuery.trim() === '') {
      searchInput.focus();
    }
  }

  /* --- 查看用戶貼文按鈕 --- */
  document.querySelectorAll('.view-user-posts').forEach(button => {
    button.addEventListener('click', function() {
      const username = this.getAttribute('data-username');
      if (username) {
        // 跳轉到社群主頁並顯示該用戶的貼文（通過 URL 參數）
        window.location.href = `/social/search?q=${encodeURIComponent(username)}&type=posts`;
      }
    });
  });

  /* --- 查看完整貼文連結處理 --- */
  document.querySelectorAll('.view-post-btn').forEach(link => {
    link.addEventListener('click', function(e) {
      // 確保連結能正常工作，這裡可以添加額外的處理邏輯
      const postId = this.getAttribute('href').split('#post-')[1];
      if (postId) {
        // 可以在這裡添加追蹤或其他邏輯
        console.log('[INFO] 用戶查看貼文:', postId);
      }
    });
  });

  /* --- 更多下拉功能 --- */
  const moreToggle = document.querySelector('.more-toggle');
  const moreMenu = document.querySelector('.more-menu');
  
  if (moreToggle && moreMenu) {
    moreToggle.addEventListener('click', event => {
      event.stopPropagation();
      moreMenu.style.display = moreMenu.style.display === 'flex' ? 'none' : 'flex';
    });
    
    document.addEventListener('click', () => {
      moreMenu.style.display = 'none';
    });
  }
  
  /* --- 深色模式切換 --- */
  const darkToggle = document.getElementById('toggle-dark');
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      if (typeof toggleDarkMode === 'function') {
        toggleDarkMode();
      }
    });
  }

  /* --- 搜尋建議處理 --- */
  const searchSuggestionLinks = document.querySelectorAll('.no-results-suggestions a');
  searchSuggestionLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // 確保搜尋建議連結正常工作
      console.log('[INFO] 用戶點擊搜尋建議:', this.href);
    });
  });

  /* --- 實時搜尋功能（可選） --- */
  let searchTimeout;
  
  function performLiveSearch(query, type = 'all') {
    if (!query.trim()) return;
    
    // 清除之前的搜尋請求
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // 延遲搜尋，避免頻繁請求
    searchTimeout = setTimeout(() => {
      fetch(`/social/search_api?q=${encodeURIComponent(query)}&type=${type}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            updateSearchResults(data);
          } else {
            console.error('[ERROR] 即時搜尋失敗:', data.message);
          }
        })
        .catch(error => {
          console.error('[ERROR] 即時搜尋請求失敗:', error);
        });
    }, 300); // 300ms 延遲
  }
  
  // 更新搜尋結果（不重新載入頁面）
  function updateSearchResults(data) {
    // 更新搜尋結果計數
    document.querySelectorAll('.filter-count').forEach(count => {
      const filterType = count.closest('.filter-item').href.split('type=')[1];
      if (filterType === 'all') {
        count.textContent = data.total_results;
      } else if (filterType === 'posts') {
        count.textContent = data.posts.length;
      } else if (filterType === 'users') {
        count.textContent = data.users.length;
      }
    });
    
    // 可以在這裡添加更多實時更新邏輯
    console.log('[INFO] 即時搜尋結果:', data);
  }

  /* --- 鍵盤快捷鍵 --- */
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K 聚焦搜尋框
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    
    // ESC 鍵清空搜尋框
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      searchInput.blur();
    }
  });

  /* --- 無限滾動載入更多結果（可選功能） --- */
  let isLoading = false;
  let currentPage = 1;
  
  function loadMoreResults() {
    if (isLoading || !searchQuery) return;
    
    isLoading = true;
    currentPage++;
    
    // 顯示載入指示器
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="loading-spinner">⏳</div>
      <p>載入更多結果中...</p>
    `;
    
    const resultsContent = document.querySelector('.search-results-content');
    if (resultsContent) {
      resultsContent.appendChild(loadingIndicator);
    }
    
    // 模擬載入更多結果的請求
    fetch(`/social/search_api?q=${encodeURIComponent(searchQuery)}&type=${searchType}&page=${currentPage}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && (data.posts.length > 0 || data.users.length > 0)) {
          // 添加新結果到頁面（這裡需要實現具體的添加邏輯）
          console.log('[INFO] 載入更多結果:', data);
          // appendResults(data);
        } else {
          console.log('[INFO] 沒有更多結果');
        }
      })
      .catch(error => {
        console.error('[ERROR] 載入更多結果失敗:', error);
      })
      .finally(() => {
        isLoading = false;
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
      });
  }
  
  // 滾動到底部時載入更多（暫時註解，需要時可啟用）
  /*
  window.addEventListener('scroll', function() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      loadMoreResults();
    }
  });
  */

  /* --- 表情符號備用方案檢測 --- */
  function checkEmojiSupport() {
    const testEmoji = document.createElement('span');
    testEmoji.style.fontSize = '20px';
    testEmoji.innerHTML = '😄';
    document.body.appendChild(testEmoji);
    
    const emojiWidth = testEmoji.offsetWidth;
    document.body.removeChild(testEmoji);
    
    if (emojiWidth < 15) {
      document.body.classList.add('emoji-fallback');
      replaceMoodEmojis();
    }
  }

  function replaceMoodEmojis() {
    const emojiMap = {
      '😄': '[開心]',
      '😢': '[難過]',
      '😡': '[生氣]',
      '😱': '[驚訝]',
      '😌': '[放鬆]',
      '😐': '[平常]',
      '👍': '[讚]',
      '🤍': '[未讚]',
      '💬': '[留言]',
      '👤': '[匿名]',
      '🔍': '[搜尋]',
      '💭': '[思考]'
    };

    document.querySelectorAll('.mood-emoji, .stat-emoji, .avatar-icon, .no-results-icon, .no-query-icon').forEach(element => {
      const originalText = element.textContent;
      if (emojiMap[originalText]) {
        element.textContent = emojiMap[originalText];
        element.style.fontWeight = 'bold';
        element.style.color = 'var(--primary-light)';
      }
    });
  }

  // 執行表情符號檢測
  checkEmojiSupport();

  /* --- 搜尋歷史記錄（localStorage） --- */
  function saveSearchHistory(query) {
    if (!query || query.trim() === '') return;
    
    try {
      let history = JSON.parse(localStorage.getItem('socialSearchHistory') || '[]');
      
      // 移除重複項目
      history = history.filter(item => item !== query);
      
      // 添加到開頭
      history.unshift(query);
      
      // 保持最多 10 個歷史記錄
      history = history.slice(0, 10);
      
      localStorage.setItem('socialSearchHistory', JSON.stringify(history));
    } catch (error) {
      console.error('[ERROR] 儲存搜尋歷史失敗:', error);
    }
  }
  
  // 儲存當前搜尋
  if (searchQuery && searchQuery.trim() !== '') {
    saveSearchHistory(searchQuery);
  }

  /* --- 初始化完成日誌 --- */
  console.log('[INFO] 搜尋結果頁面初始化完成');
  console.log('[INFO] 搜尋關鍵字:', searchQuery);
  console.log('[INFO] 搜尋類型:', searchType);

});

// 功能尚未開通模組
function closeFeatureModal() {
  document.getElementById('feature-modal')?.classList.remove('active');
}

// 處理功能尚未開通的連結
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="#"]').forEach(featureLink => {
    featureLink.addEventListener('click', event => {
      event.preventDefault();
      document.getElementById('feature-modal')?.classList.add('active');
    });
  });
  
  // 初始化追蹤功能
  initSearchFollowFunctionality();
});

/* === 搜尋結果中的追蹤功能 === */

// 初始化追蹤功能
function initSearchFollowFunctionality() {
  // 綁定所有追蹤按鈕事件
  document.querySelectorAll('.follow-btn').forEach(followBtn => {
    bindFollowButton(followBtn);
  });
  
  // 檢查現有用戶的追蹤狀態
  checkExistingFollowStatus();
}

// 綁定追蹤按鈕事件
function bindFollowButton(followBtn) {
  if (followBtn.hasAttribute('data-bound')) return;
  
  followBtn.setAttribute('data-bound', 'true');
  followBtn.addEventListener('click', function() {
    const userEmail = this.dataset.userEmail;
    const username = this.dataset.username;
    const isFollowing = this.classList.contains('following');
    
    if (!userEmail) {
      console.error('[ERROR] 缺少用戶Email');
      return;
    }
    
    // 防止重複點擊
    this.disabled = true;
    const originalText = this.innerHTML;
    this.innerHTML = '<span class="btn-emoji">⏳</span> 處理中...';
    
    const action = isFollowing ? 'unfollow' : 'follow';
    const endpoint = `/social/${action}`;
    
    const requestBody = isFollowing ? 
      { user_email: userEmail } : 
      { user_email: userEmail };
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // 更新按鈕狀態
        if (data.is_following) {
          this.classList.add('following');
          this.innerHTML = '<span class="btn-emoji">✓</span> 已追蹤';
          this.title = '點擊取消追蹤';
        } else {
          this.classList.remove('following');
          this.innerHTML = '<span class="btn-emoji">➕</span> 追蹤';
          this.title = '點擊追蹤用戶';
        }
        
        // 更新該用戶的所有追蹤按鈕狀態
        updateAllFollowButtonsForUser(userEmail, data.is_following);
        
        // 顯示操作結果 - 不再更新社交統計，因為搜尋頁面不顯示統計數據
        showFollowNotification(data.message, data.is_following ? 'success' : 'info');
        
      } else {
        alert(data.message);
        this.innerHTML = originalText;
      }
    })
    .catch(error => {
      console.error(`[ERROR] ${action} 操作失敗:`, error);
      alert('操作失敗，請稍後再試');
      this.innerHTML = originalText;
    })
    .finally(() => {
      this.disabled = false;
    });
  });
}

// 檢查現有用戶的追蹤狀態
function checkExistingFollowStatus() {
  const followBtns = document.querySelectorAll('.follow-btn[data-user-email]');
  const userEmails = Array.from(new Set(Array.from(followBtns).map(btn => btn.dataset.userEmail)));
  
  userEmails.forEach(userEmail => {
    if (userEmail && userEmail !== currentUserEmail) {
      checkFollowStatus(userEmail);
    }
  });
}

// 檢查單個用戶的追蹤狀態
function checkFollowStatus(userEmail) {
  fetch(`/social/check_follow_status/${encodeURIComponent(userEmail)}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateAllFollowButtonsForUser(userEmail, data.is_following);
      }
    })
    .catch(error => {
      console.log('[DEBUG] 檢查追蹤狀態失敗:', userEmail, error);
    });
}

// 更新特定用戶的所有追蹤按鈕狀態
function updateAllFollowButtonsForUser(userEmail, isFollowing) {
  const followBtns = document.querySelectorAll(`[data-user-email="${userEmail}"].follow-btn`);
  followBtns.forEach(btn => {
    if (isFollowing) {
      btn.classList.add('following');
      btn.innerHTML = '<span class="btn-emoji">✓</span> 已追蹤';
      btn.title = '點擊取消追蹤';
    } else {
      btn.classList.remove('following');
      btn.innerHTML = '<span class="btn-emoji">➕</span> 追蹤';
      btn.title = '點擊追蹤用戶';
    }
  });
}

// 顯示追蹤操作通知
function showFollowNotification(message, type = 'info') {
  // 創建通知元素
  const notification = document.createElement('div');
  notification.className = `follow-notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
      <span class="notification-text">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // 添加樣式
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #007bff, #6610f2)'};
    color: white;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 9999;
    animation: slideInRight 0.3s ease;
    max-width: 300px;
  `;
  
  // 添加到頁面
  document.body.appendChild(notification);
  
  // 3秒後自動消失
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
}

/* === 動畫樣式 === */
const followAnimationStyle = document.createElement('style');
followAnimationStyle.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .follow-notification {
    font-family: inherit;
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .notification-icon {
    font-weight: bold;
    font-size: 1.1em;
  }
  
  .notification-text {
    flex: 1;
    font-size: 0.9em;
  }
  
  .notification-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.2em;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s ease;
  }
  
  .notification-close:hover {
    background: rgba(255,255,255,0.2);
  }
`;

document.head.appendChild(followAnimationStyle);
