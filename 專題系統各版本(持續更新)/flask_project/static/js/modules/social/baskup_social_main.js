document.addEventListener('DOMContentLoaded', () => {

  /* --- 通知系統 --- */
  function showNotification(message, type = 'info') {
    // 移除現有的通知
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 創建新的通知
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close">×</button>
      </div>
    `;

    // 添加樣式
    const style = `
      .custom-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        min-width: 320px;
        max-width: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        border-left: 4px solid #667eea;
        animation: notificationSlideIn 0.3s ease-out;
        overflow: hidden;
      }
      
      .custom-notification.success {
        border-left-color: #4CAF50;
      }
      
      .custom-notification.error {
        border-left-color: #f44336;
      }
      
      .custom-notification.warning {
        border-left-color: #ff9800;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        gap: 12px;
      }
      
      .notification-icon {
        font-size: 1.5em;
        flex-shrink: 0;
      }
      
      .notification-message {
        flex: 1;
        font-size: 0.95em;
        line-height: 1.4;
        color: #333;
      }
      
      .notification-close {
        background: none;
        border: none;
        font-size: 1.5em;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .notification-close:hover {
        background: #f0f0f0;
        color: #666;
      }
      
      @keyframes notificationSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes notificationSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      body.dark-mode .custom-notification {
        background: #2d2d2d;
        color: #e0e0e0;
        box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      }
      
      body.dark-mode .notification-message {
        color: #e0e0e0;
      }
      
      body.dark-mode .notification-close:hover {
        background: #444;
        color: #ccc;
      }
    `;

    // 添加樣式到頁面（如果還沒有）
    if (!document.querySelector('#notification-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'notification-styles';
      styleElement.textContent = style;
      document.head.appendChild(styleElement);
    }

    // 添加到頁面
    document.body.appendChild(notification);

    // 關閉按鈕事件
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.style.animation = 'notificationSlideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    });

    // 自動關閉
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'notificationSlideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }

  /* --- 追蹤功能 --- */
  function handleFollowAction(userEmail, action) {
    const btn = document.querySelector(`[data-user-email="${userEmail}"]`);
    if (!btn) return;

    // 禁用按鈕防止重複點擊
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="btn-emoji">⏳</span> 處理中...';

    const url = action === 'follow' ? '/social/follow' : '/social/unfollow';
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_email: userEmail })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showNotification(data.message, 'success');
        
        // 更新按鈕狀態
        if (action === 'follow') {
          btn.className = 'follow-btn following';
          btn.innerHTML = '<span class="btn-emoji">✅</span> 已追蹤';
          btn.setAttribute('data-action', 'unfollow');
        } else {
          btn.className = 'follow-btn';
          btn.innerHTML = '<span class="btn-emoji">➕</span> 追蹤';
          btn.setAttribute('data-action', 'follow');
        }
        
        // 更新統計數據（如果在社交統計頁面）
        if (data.stats) {
          updateSocialStats(data.stats);
        }
      } else {
        showNotification(data.message || '操作失敗', 'error');
        btn.textContent = originalText;
      }
    })
    .catch(error => {
      console.error('追蹤操作失敗:', error);
      // 已移除使用者提示: '網路錯誤，請稍後再試'
      // 改為僅在 console 記錄錯誤以免打擾使用者
      btn.textContent = originalText;
    })
    .finally(() => {
      btn.disabled = false;
    });
  }

  function createFollowModal(type, users) {
    // 移除現有模態框
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="follow-modal">
        <div class="follow-modal-header">
          <h3>
            <span class="modal-icon">${type === 'followers' ? '👥' : '🔔'}</span>
            ${type === 'followers' ? '粉絲列表' : '追蹤列表'}
          </h3>
          <button class="close-btn">×</button>
        </div>
        <div class="follow-modal-body">
          ${users.length > 0 ? users.map(user => `
            <div class="follow-user-item">
              <div class="follow-user-info">
                <div class="follow-user-avatar">
                  ${user.User_Name ? user.User_Name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div class="follow-user-details">
                  <h4>${user.User_Name || '匿名用戶'}</h4>
                  <p>
                    <span class="follow-user-level">Lv.${user.level || 1}</span>
                    ${user.email_verified ? '✅ 已驗證' : '⚠️ 未驗證'}
                  </p>
                </div>
              </div>
              <div class="follow-user-actions">
                ${type === 'followers' ? `
                  <button class="btn btn-remove" onclick="removeFollower('${user.User_Email}')">
                    <span class="btn-emoji">🗑️</span> 移除
                  </button>
                ` : `
                  <button class="btn btn-unfollow" onclick="handleFollowAction('${user.User_Email}', 'unfollow')">
                    <span class="btn-emoji">❌</span> 取消追蹤
                  </button>
                `}
              </div>
            </div>
          `).join('') : `
            <div class="empty-follow-list">
              <div class="empty-icon">${type === 'followers' ? '👥' : '🔔'}</div>
              <h4>${type === 'followers' ? '還沒有粉絲' : '還沒有追蹤任何人'}</h4>
              <p>${type === 'followers' ? 
                '當其他用戶追蹤您時，他們會出現在這裡。' : 
                '開始追蹤其他用戶，就能在這裡看到他們的最新動態。'
              }</p>
              <button class="btn" onclick="closeFollowModal()">
                <span class="btn-emoji">🔍</span> 發現用戶
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    // 添加到頁面
    document.body.appendChild(modalOverlay);

    // 事件監聽
    const closeBtn = modalOverlay.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      modalOverlay.remove();
    });

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });

    // ESC 鍵關閉
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        modalOverlay.remove();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  function closeFollowModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
    }
  }

  function removeFollower(userEmail) {
    if (!confirm('確定要移除這個粉絲嗎？')) {
      return;
    }

    fetch('/social/remove_follower', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_email: userEmail })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showNotification(data.message, 'success');
        // 重新載入粉絲列表
        showFollowModal('followers');
      } else {
        showNotification(data.message || '移除失敗', 'error');
      }
    })
    .catch(error => {
      console.error('移除粉絲失敗:', error);
      // 已移除使用者提示: '網路錯誤，請稍後再試'
      // 保留錯誤日誌供開發除錯
    });
  }

  /* --- 社交統計更新 --- */
  function updateSocialStats(stats) {
    const followersCount = document.querySelector('[data-stat="followers"] .social-stat-number');
    const followingCount = document.querySelector('[data-stat="following"] .social-stat-number');
    
    if (followersCount && stats.followers_count !== undefined) {
      followersCount.textContent = stats.followers_count;
      followersCount.classList.add('updated');
      setTimeout(() => followersCount.classList.remove('updated'), 600);
    }
    
    if (followingCount && stats.following_count !== undefined) {
      followingCount.textContent = stats.following_count;
      followingCount.classList.add('updated');
      setTimeout(() => followingCount.classList.remove('updated'), 600);
    }
  }

  /* --- 事件監聽器設置 --- */
  // 追蹤按鈕事件
  document.addEventListener('click', (e) => {
    if (e.target.closest('.follow-btn')) {
      e.preventDefault();
      const btn = e.target.closest('.follow-btn');
      const userEmail = btn.getAttribute('data-user-email');
      const action = btn.getAttribute('data-action') || 'follow';
      
      if (userEmail) {
        handleFollowAction(userEmail, action);
      }
    }
    
    // 社交統計點擊事件
    if (e.target.closest('.social-stat-item')) {
      console.log('[DEBUG] 點擊了社交統計項目');
      const statItem = e.target.closest('.social-stat-item');
      const statType = statItem.getAttribute('data-stat');
      console.log('[DEBUG] 統計類型:', statType);
      
      if (statType === 'followers') {
        console.log('[DEBUG] 顯示粉絲列表');
        window.showFollowersList();
      } else if (statType === 'following') {
        console.log('[DEBUG] 顯示追蹤列表');
        window.showFollowingList();
      }
    }
  });

  // 使追蹤/粉絲功能在全域可用
  window.handleFollowAction = handleFollowAction;
  window.showFollowModal = showFollowModal;
  window.closeFollowModal = closeFollowModal;
  window.removeFollower = removeFollower;
  window.showNotification = showNotification;

  /* --- 搜尋功能處理 --- */
  const searchForm = document.querySelector('.search-bar');
  const searchInput = document.querySelector('.search-input');
  
  if (searchForm && searchInput) {
    // 處理表單提交
    searchForm.addEventListener('submit', function(e) {
      const query = searchInput.value.trim();
      if (!query) {
        e.preventDefault();
        alert('請輸入搜尋關鍵字');
        searchInput.focus();
        return false;
      }
      // 表單會自動提交到 /social/search
    });
    
    // 處理 Enter 鍵
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault(); // 防止重複提交
        const query = this.value.trim();
        if (!query) {
          alert('請輸入搜尋關鍵字');
          this.focus();
          return false;
        }
        // 手動觸發表單提交
        searchForm.submit();
      }
    });
    
    // 搜尋按鈕點擊處理
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function(e) {
        e.preventDefault(); // 防止重複提交
        const query = searchInput.value.trim();
        if (!query) {
          alert('請輸入搜尋關鍵字');
          searchInput.focus();
          return false;
        }
        // 手動觸發表單提交
        searchForm.submit();
      });
    }
    
    // 搜尋框聚焦時的視覺效果
    searchInput.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    searchInput.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });
    
    // 搜尋建議（可選功能）
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      const query = this.value.trim();
      
      // 清除之前的定時器
      clearTimeout(searchTimeout);
      
      // 如果查詢長度大於2，500ms後顯示搜尋建議
      if (query.length >= 2) {
        searchTimeout = setTimeout(() => {
          // 這裡可以實現搜尋建議功能
          console.log('[DEBUG] 搜尋建議:', query);
        }, 500);
      }
    });
  }

  /* --- 全局搜尋快捷鍵 --- */
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K 快速搜尋
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

  /* --- 時間格式化函數 --- */
  function formatRelativeTime(dateString) {
    try {
      // 處理不同的日期格式
      let date;
      if (dateString.includes('T')) {
        // ISO 格式: 2025-08-30T14:30:00
        date = new Date(dateString);
      } else if (dateString.includes('-') && dateString.includes(':')) {
        // 標準格式: 2025-08-30 14:30:00
        date = new Date(dateString.replace(' ', 'T'));
      } else {
        // 其他格式嘗試直接解析
        date = new Date(dateString);
      }
      
      // 檢查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('[WARNING] 無效的日期格式:', dateString);
        return dateString; // 返回原始字符串
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
      
      // 處理未來時間（可能因為時區差異）
      if (diffMs < 0) {
        return '剛剛';
      }
      
      // 根據時間差返回相對時間
      if (diffSeconds < 30) {
        return '剛剛';
      } else if (diffSeconds < 60) {
        return `${diffSeconds}秒前`;
      } else if (diffMinutes < 60) {
        return `${diffMinutes}分鐘前`;
      } else if (diffHours < 24) {
        return `${diffHours}小時前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else if (diffWeeks < 4) {
        return `${diffWeeks}週前`;
      } else if (diffMonths < 12) {
        return `${diffMonths}個月前`;
      } else {
        return `${diffYears}年前`;
      }
    } catch (error) {
      console.error('[ERROR] 時間格式化錯誤:', error, '原始時間:', dateString);
      return dateString; // 返回原始字符串作為備用
    }
  }

  /* --- 更新所有時間顯示 --- */
  function updateAllTimeDisplays() {
    // 更新留言時間
    document.querySelectorAll('.comment-time').forEach(timeElement => {
      const originalTime = timeElement.getAttribute('data-original-time') || timeElement.textContent;
      if (!timeElement.getAttribute('data-original-time')) {
        timeElement.setAttribute('data-original-time', originalTime);
      }
      const formattedTime = formatRelativeTime(originalTime);
      timeElement.textContent = formattedTime;
      timeElement.title = `發布於: ${originalTime}`; // 添加工具提示顯示完整時間
    });
    
    // 更新貼文時間（如果需要的話）
    document.querySelectorAll('.post-card header span').forEach(timeElement => {
      if (timeElement.textContent.match(/\d{4}-\d{2}-\d{2}/)) {
        const originalTime = timeElement.getAttribute('data-original-time') || timeElement.textContent;
        if (!timeElement.getAttribute('data-original-time')) {
          timeElement.setAttribute('data-original-time', originalTime);
        }
        const formattedTime = formatRelativeTime(originalTime);
        timeElement.textContent = formattedTime;
        timeElement.title = `發布於: ${originalTime}`;
      }
    });
  }

  // 頁面載入時立即更新時間
  updateAllTimeDisplays();
  
  // 每分鐘更新一次時間顯示
  setInterval(updateAllTimeDisplays, 60000);

  /* --- 社交統計點擊事件 --- */
  // 為社交統計項目添加直接的點擊事件監聽器
  const followersStatItem = document.querySelector('[data-stat="followers"]');
  const followingStatItem = document.querySelector('[data-stat="following"]');
  
  if (followersStatItem) {
    followersStatItem.addEventListener('click', function() {
      console.log('[DEBUG] 點擊了粉絲統計');
      window.showFollowersList();
    });
  }
  
  if (followingStatItem) {
    followingStatItem.addEventListener('click', function() {
      console.log('[DEBUG] 點擊了追蹤統計');
      window.showFollowingList();
    });
  }

  /* --- 表情符號備用方案檢測 --- */
  function checkEmojiSupport() {
    // 檢測瀏覽器是否支援表情符號
    const testEmoji = document.createElement('span');
    testEmoji.style.fontSize = '20px';
    testEmoji.innerHTML = '😄';
    document.body.appendChild(testEmoji);
    
    const emojiWidth = testEmoji.offsetWidth;
    document.body.removeChild(testEmoji);
    
    // 如果表情符號寬度太小或為0，表示不支援
    if (emojiWidth < 15) {
      // 啟用文字備用方案
      document.body.classList.add('emoji-fallback');
      replaceMoodEmojis();
    }
  }

  function replaceMoodEmojis() {
    // 表情符號與文字對應表
    const emojiMap = {
      '😄': '[開心]',
      '😢': '[難過]',
      '😡': '[生氣]',
      '😱': '[驚訝]',
      '😌': '[放鬆]',
      '😐': '[平常]',
      '👍': '[讚]',
      '💬': '[留言]',
      '🔗': '[分享]',
      '🔁': '[轉發]',
      '🚩': '[檢舉]',
      '👤': '[匿名]',
      '➕': '[新增]',
      '📝': '[貼文]'
    };

    // 替換所有表情符號
    document.querySelectorAll('.mood-emoji, .btn-emoji, .anonymous-icon, .no-posts-icon').forEach(element => {
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

  /* --- 按讚與留言功能 --- */
  document.querySelectorAll('.like-btn').forEach(likeButton => {
    likeButton.addEventListener('click', function() {
      const postId = this.dataset.postId;
      const isLiked = this.dataset.liked === 'true';
      
      // 防止重複點擊
      this.disabled = true;
      
      fetch(`/social/toggle_like/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // 更新按讚狀態
          this.dataset.liked = data.is_liked;
          const emoji = this.querySelector('.btn-emoji');
          emoji.textContent = data.is_liked ? '👍' : '🤍';
          
          // 更新按讚數量
          this.innerHTML = `<span class="btn-emoji">${data.is_liked ? '👍' : '🤍'}</span> ${data.likes_count}`;
          
          // 檢查是否有等級升級
          if (data.level_up) {
            showLevelUpNotification(data.level_up);
          }
          
          // 更新等級統計
          updateUserStats();
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        console.error('[ERROR] 按讚操作失敗:', error);
        alert('操作失敗，請稍後再試');
      })
      .finally(() => {
        this.disabled = false;
      });
    });
  });

  // 留言按鈕功能
  document.querySelectorAll('.comment-btn').forEach(commentButton => {
    commentButton.addEventListener('click', function() {
      const postId = this.dataset.postId;
      const commentsSection = document.getElementById(`comments-${postId}`);
      
      if (commentsSection.style.display === 'none' || !commentsSection.style.display) {
        // 顯示留言區
        commentsSection.style.display = 'block';
        loadComments(postId);
      } else {
        // 隱藏留言區
        commentsSection.style.display = 'none';
      }
    });
  });

  // 關閉留言區按鈕
  document.querySelectorAll('.close-comments').forEach(closeButton => {
    closeButton.addEventListener('click', function() {
      const postId = this.dataset.postId;
      const commentsSection = document.getElementById(`comments-${postId}`);
      commentsSection.style.display = 'none';
    });
  });

  // 留言表單提交
  document.querySelectorAll('.comment-form').forEach(commentForm => {
    const textarea = commentForm.querySelector('textarea[name="content"]');
    const charCount = commentForm.querySelector('.char-count');
    const submitBtn = commentForm.querySelector('.submit-comment-btn');
    const replyIndicator = commentForm.querySelector('.reply-indicator');
    const cancelReplyBtn = commentForm.querySelector('.cancel-reply');
    const replyToIdInput = commentForm.querySelector('input[name="reply_to_id"]');
    const replyToUsernameInput = commentForm.querySelector('input[name="reply_to_username"]');
    
    // 字數統計
    textarea.addEventListener('input', function() {
      const currentLength = this.value.length;
      charCount.textContent = currentLength;
      
      // 字數警告樣式
      charCount.className = 'char-count';
      if (currentLength > 400) {
        charCount.classList.add('danger');
        submitBtn.disabled = true;
      } else if (currentLength > 300) {
        charCount.classList.add('warning');
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = false;
      }
    });
    
    // 取消回覆
    if (cancelReplyBtn) {
      cancelReplyBtn.addEventListener('click', function() {
        replyIndicator.style.display = 'none';
        replyToIdInput.value = '';
        replyToUsernameInput.value = '';
        textarea.placeholder = '寫下您的留言...';
        textarea.focus();
      });
    }
    
    // 表單提交
    commentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const postId = this.dataset.postId;
      const content = textarea.value.trim();
      const replyToId = replyToIdInput.value;
      const replyToUsername = replyToUsernameInput.value;
      
      if (!content) {
        alert('請輸入留言內容');
        return;
      }
      
      if (content.length > 500) {
        alert('留言內容不能超過500字');
        return;
      }
      
      // 禁用提交按鈕
      submitBtn.disabled = true;
      submitBtn.textContent = '發送中...';
      
      const formData = new FormData();
      formData.append('content', content);
      if (replyToId) {
        formData.append('reply_to_id', replyToId);
        formData.append('reply_to_username', replyToUsername);
      }
      
      fetch(`/social/add_comment/${postId}`, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // 清空表單
          textarea.value = '';
          charCount.textContent = '0';
          
          // 隱藏回覆指示器
          if (replyIndicator) {
            replyIndicator.style.display = 'none';
            replyToIdInput.value = '';
            replyToUsernameInput.value = '';
            textarea.placeholder = '寫下您的留言...';
          }
          
          // 添加新留言到列表
          addCommentToList(postId, data.comment);
          
          // 更新留言數量
          updateCommentCount(postId, data.comments_count);
          
          // 檢查是否有等級升級
          if (data.level_up) {
            showLevelUpNotification(data.level_up);
          }
          
          // 更新等級統計
          updateUserStats();
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        console.error('[ERROR] 留言失敗:', error);
        alert('留言失敗，請稍後再試');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = '發送';
      });
    });
  });

  // 載入留言
  function loadComments(postId) {
    fetch(`/social/get_comments/${postId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const commentsList = document.getElementById(`comments-list-${postId}`);
          
          if (data.comments.length === 0) {
            commentsList.innerHTML = `
              <div class="no-comments">
                <p>目前還沒有留言，成為第一個留言的人吧！</p>
              </div>
            `;
          } else {
            commentsList.innerHTML = data.comments.map(comment => 
              createCommentHTML(comment)
            ).join('');
            
            // 重新綁定回覆按鈕事件
            bindReplyButtons(postId);
            
            // 更新時間顯示
            updateAllTimeDisplays();
          }
        }
      })
      .catch(error => {
        console.error('[ERROR] 載入留言失敗:', error);
      });
  }

  // 創建留言 HTML
  function createCommentHTML(comment) {
    const replyInfo = comment.reply_to_username ? 
      `<div class="reply-info">
        <span class="reply-prefix">回覆</span>
        <span class="reply-target">${comment.reply_to_username}</span>：
      </div>` : '';
    
    // 格式化時間顯示
    const formattedTime = formatRelativeTime(comment.created_at);
    
    // 檢查是否為作者留言（需要從貼文卡片獲取作者資訊）
    const postCard = document.querySelector(`[data-post-id="${comment.post_id}"]`);
    const postAuthor = postCard ? postCard.querySelector('header strong').textContent : '';
    const isAuthor = comment.username === postAuthor;
    const authorBadge = isAuthor ? '<span class="author-badge">作者</span>' : '';
    
    // 檢查是否為當前用戶的留言（用於顯示編輯/刪除按鈕）
    const isCurrentUser = comment.user_email === currentUserEmail; // 需要在頁面中定義currentUserEmail
    const commentActions = isCurrentUser ? 
      `<button class="edit-comment-btn" data-comment-id="${comment.comment_id}" title="編輯留言">
        <span class="btn-emoji">✏️</span>
      </button>
      <button class="delete-comment-btn" data-comment-id="${comment.comment_id}" title="刪除留言">
        <span class="btn-emoji">🗑️</span>
      </button>` : '';
    
    return `
      <div class="comment-item" data-comment-id="${comment.comment_id}">
        <div class="comment-header">
          <strong class="comment-author">
            ${comment.username}
            ${authorBadge}
          </strong>
          <span class="comment-time" data-original-time="${comment.created_at}" title="發布於: ${comment.created_at}">${formattedTime}</span>
          <div class="comment-actions">
            <button class="reply-comment-btn" data-comment-id="${comment.comment_id}" data-username="${comment.username}">回覆</button>
            ${commentActions}
          </div>
        </div>
        ${replyInfo}
        <div class="comment-content">${comment.content}</div>
      </div>
    `;
  }

  // 添加留言到列表
  function addCommentToList(postId, comment) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    const noComments = commentsList.querySelector('.no-comments');
    
    if (noComments) {
      noComments.remove();
    }
    
    const newCommentHTML = createCommentHTML(comment);
    commentsList.insertAdjacentHTML('beforeend', newCommentHTML);
    
    // 綁定新留言的按鈕事件
    const newComment = commentsList.lastElementChild;
    const replyBtn = newComment.querySelector('.reply-comment-btn');
    const editBtn = newComment.querySelector('.edit-comment-btn');
    const deleteBtn = newComment.querySelector('.delete-comment-btn');
    
    if (replyBtn) bindSingleReplyButton(replyBtn, postId);
    if (editBtn) bindSingleEditCommentButton(editBtn);
    if (deleteBtn) bindSingleDeleteCommentButton(deleteBtn);
    
    // 滾動到新留言
    newComment.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // 更新時間顯示
    updateAllTimeDisplays();
  }

  // 綁定回覆按鈕事件
  function bindReplyButtons(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    const replyButtons = commentsList.querySelectorAll('.reply-comment-btn');
    const editButtons = commentsList.querySelectorAll('.edit-comment-btn');
    const deleteButtons = commentsList.querySelectorAll('.delete-comment-btn');
    
    replyButtons.forEach(btn => {
      bindSingleReplyButton(btn, postId);
    });
    
    editButtons.forEach(btn => {
      bindSingleEditCommentButton(btn);
    });
    
    deleteButtons.forEach(btn => {
      bindSingleDeleteCommentButton(btn);
    });
  }

  // 綁定單個回覆按鈕事件
  function bindSingleReplyButton(replyBtn, postId) {
    if (!replyBtn || replyBtn.hasAttribute('data-bound')) return;
    
    replyBtn.setAttribute('data-bound', 'true');
    replyBtn.addEventListener('click', function() {
      const commentId = this.dataset.commentId;
      const username = this.dataset.username;
      
      // 找到對應的留言表單
      const commentForm = document.querySelector(`[data-post-id="${postId}"].comment-form`);
      if (!commentForm) return;
      
      const textarea = commentForm.querySelector('textarea[name="content"]');
      const replyIndicator = commentForm.querySelector('.reply-indicator');
      const replyTarget = commentForm.querySelector('.reply-target');
      const replyToIdInput = commentForm.querySelector('input[name="reply_to_id"]');
      const replyToUsernameInput = commentForm.querySelector('input[name="reply_to_username"]');
      
      // 設置回覆信息
      replyToIdInput.value = commentId;
      replyToUsernameInput.value = username;
      replyTarget.textContent = username;
      replyIndicator.style.display = 'flex';
      
      // 更新文本域佔位符
      textarea.placeholder = `回覆 ${username}...`;
      textarea.focus();
      
      // 滾動到表單
      commentForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // 初始化時綁定已存在的按鈕
  document.querySelectorAll('.reply-comment-btn').forEach(btn => {
    const postCard = btn.closest('.post-card');
    if (postCard) {
      const postId = postCard.dataset.postId;
      bindSingleReplyButton(btn, postId);
    }
  });

  // 綁定已存在的編輯和刪除按鈕
  document.querySelectorAll('.edit-comment-btn').forEach(btn => {
    bindSingleEditCommentButton(btn);
  });

  document.querySelectorAll('.delete-comment-btn').forEach(btn => {
    bindSingleDeleteCommentButton(btn);
  });

  /* --- 留言編輯和刪除功能 --- */

  // 綁定單個編輯留言按鈕事件
  function bindSingleEditCommentButton(editBtn) {
    if (!editBtn || editBtn.hasAttribute('data-bound')) return;
    
    editBtn.setAttribute('data-bound', 'true');
    editBtn.addEventListener('click', function() {
      const commentId = this.dataset.commentId;
      console.log('[DEBUG] 編輯留言按鈕被點擊，留言 ID:', commentId);
      
      // 獲取留言資料
      fetch(`/social/edit_comment/${commentId}`, {
        method: 'GET'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showEditCommentModal(commentId, data.comment);
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        console.error('[ERROR] 獲取留言資料錯誤:', error);
        alert('載入留言資料失敗');
      });
    });
  }

  // 綁定單個刪除留言按鈕事件
  function bindSingleDeleteCommentButton(deleteBtn) {
    if (!deleteBtn || deleteBtn.hasAttribute('data-bound')) return;
    
    deleteBtn.setAttribute('data-bound', 'true');
    deleteBtn.addEventListener('click', function() {
      const commentId = this.dataset.commentId;
      console.log('[DEBUG] 刪除留言按鈕被點擊，留言 ID:', commentId);
      
      if (confirm('確定要刪除這則留言嗎？此操作無法復原。')) {
        // 禁用按鈕防止重複點擊
        this.disabled = true;
        this.innerHTML = '<span class="btn-emoji">⏳</span>';
        
        fetch(`/social/delete_comment/${commentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // 移除留言元素
            const commentItem = this.closest('.comment-item');
            commentItem.style.opacity = '0.5';
            commentItem.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
              commentItem.remove();
              
              // 更新留言數量
              updateCommentCount(data.post_id, data.comments_count);
              
              // 檢查是否還有留言，沒有的話顯示空狀態
              const commentsList = document.getElementById(`comments-list-${data.post_id}`);
              const remainingComments = commentsList.querySelectorAll('.comment-item');
              if (remainingComments.length === 0) {
                commentsList.innerHTML = `
                  <div class="no-comments">
                    <p>目前還沒有留言，成為第一個留言的人吧！</p>
                  </div>
                `;
              }
            }, 300);
            
            alert(data.message);
          } else {
            alert(data.message);
            // 重新啟用按鈕
            this.disabled = false;
            this.innerHTML = '<span class="btn-emoji">🗑️</span>';
          }
        })
        .catch(error => {
          console.error('[ERROR] 刪除留言錯誤:', error);
          alert('刪除失敗，請稍後再試');
          // 重新啟用按鈕
          this.disabled = false;
          this.innerHTML = '<span class="btn-emoji">🗑️</span>';
        });
      }
    });
  }

  // 顯示編輯留言模態框
  function showEditCommentModal(commentId, commentData) {
    // 創建編輯模態框
    const modal = document.createElement('div');
    modal.className = 'edit-comment-modal-overlay';
    modal.innerHTML = `
      <div class="edit-comment-modal">
        <div class="edit-comment-modal-header">
          <h3>編輯留言</h3>
          <button class="close-modal-btn" type="button">×</button>
        </div>
        <form id="edit-comment-form" class="edit-comment-modal-body">
          <div class="form-group">
            <label for="edit-comment-content">留言內容</label>
            <textarea id="edit-comment-content" name="content" maxlength="500" class="form-control" required>${commentData.content}</textarea>
            <div class="char-counter">
              <span id="edit-comment-count">${commentData.content.length}</span>/500 字
            </div>
          </div>
          
          <div class="edit-comment-modal-footer">
            <button type="button" class="btn btn-secondary cancel-edit-comment-btn">取消</button>
            <button type="submit" class="btn btn-primary">更新留言</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 設置字數統計
    const contentTextarea = modal.querySelector('#edit-comment-content');
    const contentCount = modal.querySelector('#edit-comment-count');
    const submitBtn = modal.querySelector('button[type="submit"]');
    
    contentTextarea.addEventListener('input', () => {
      const currentLength = contentTextarea.value.length;
      contentCount.textContent = currentLength;
      
      // 字數警告樣式
      contentCount.className = 'char-count';
      if (currentLength > 500) {
        contentCount.classList.add('danger');
        submitBtn.disabled = true;
      } else if (currentLength > 400) {
        contentCount.classList.add('warning');
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = false;
      }
    });
    
    // 關閉模態框
    const closeModal = () => {
      modal.remove();
    };
    
    modal.querySelector('.close-modal-btn').addEventListener('click', closeModal);
    modal.querySelector('.cancel-edit-comment-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
    
    // 提交編輯
    modal.querySelector('#edit-comment-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const submitBtn = this.querySelector('button[type="submit"]');
      
      submitBtn.disabled = true;
      submitBtn.textContent = '更新中...';
      
      fetch(`/social/edit_comment/${commentId}`, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // 更新頁面中的留言內容
          const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
          if (commentItem) {
            const contentElement = commentItem.querySelector('.comment-content');
            contentElement.textContent = data.content;
          }
          
          alert(data.message);
          closeModal();
        } else {
          alert(data.message);
          submitBtn.disabled = false;
          submitBtn.textContent = '更新留言';
        }
      })
      .catch(error => {
        console.error('[ERROR] 更新留言錯誤:', error);
        alert('更新失敗，請稍後再試');
        submitBtn.disabled = false;
        submitBtn.textContent = '更新留言';
      });
    });
    
    // 自動聚焦到文字區域並選中文字
    contentTextarea.focus();
    contentTextarea.select();
  }

  // 更新留言數量
  function updateCommentCount(postId, count) {
    const commentBtn = document.querySelector(`[data-post-id="${postId}"].comment-btn`);
    if (commentBtn) {
      const emoji = commentBtn.querySelector('.btn-emoji');
      commentBtn.innerHTML = `<span class="btn-emoji">${emoji.textContent}</span> ${count}`;
    }
  }

  // 更新用戶統計
  function updateUserStats() {
    // 重新載入等級信息以更新統計數據
    loadUserLevelInfo();
    showMyContributionsStats();
  }

  /* --- 心情分類和我的貢獻篩選 --- */
  const filterTags = document.querySelectorAll('.tag');
  const postCards = document.querySelectorAll('.post-card');
  
  // 初始化版面切換功能
  initTabSwitching();
  
  filterTags.forEach(tag => tag.addEventListener('click', () => {
    filterTags.forEach(otherTag => otherTag.classList.remove('active'));
    tag.classList.add('active');
    const filterType = tag.dataset.filter;
    
    console.log('[DEBUG] 切換篩選器到:', filterType);
    
    if (filterType === 'all') {
      // 顯示所有貼文
      postCards.forEach(card => card.style.display = 'block');
    } else if (filterType === 'my-posts') {
      // 顯示當前用戶的貼文
      postCards.forEach(card => {
        const hasAuthorActions = card.querySelector('.author-actions');
        card.style.display = hasAuthorActions ? 'block' : 'none';
      });
    } else {
      // 按心情篩選
      postCards.forEach(card => {
        card.style.display = (filterType === card.dataset.mood) ? 'block' : 'none';
      });
    }
    
    // 檢查是否有顯示的貼文
    const visiblePosts = Array.from(postCards).filter(card => 
      card.style.display === 'block' || card.style.display === ''
    );
    
    // 處理空狀態顯示
    const noPostsDiv = document.querySelector('.no-posts');
    const postList = document.querySelector('.post-list');
    
    if (visiblePosts.length === 0 && postCards.length > 0) {
      // 有貼文但篩選後沒有符合的
      if (!postList.querySelector('.no-filtered-posts')) {
        const action = getNoPostsAction(filterType);
        const noFilteredPosts = document.createElement('div');
        noFilteredPosts.className = 'no-filtered-posts';
        noFilteredPosts.innerHTML = `
          <div class="no-posts-icon">${filterType === 'my-posts' ? '�' : '�🔍'}</div>
          <p>${getNoPostsMessage(filterType)}</p>
          <button class="btn ${filterType === 'my-posts' ? 'btn-primary' : 'btn-secondary'}" onclick="(${action.action.toString()})()">
            <span class="btn-emoji">${action.emoji}</span> ${action.text}
          </button>
        `;
        postList.appendChild(noFilteredPosts);
      }
    } else {
      // 移除篩選空狀態訊息
      const noFilteredPosts = postList.querySelector('.no-filtered-posts');
      if (noFilteredPosts) {
        noFilteredPosts.remove();
      }
    }
  }));
  
  // 獲取沒有貼文時的訊息
  function getNoPostsMessage(filterType) {
    switch (filterType) {
      case 'my-posts':
        return '您還沒有發布任何貼文，現在就來分享您的想法吧！';
      case 'happy':
        return '目前沒有開心的貼文，要不要分享一些開心的事情？';
      case 'sad':
        return '目前沒有難過的貼文。';
      case 'angry':
        return '目前沒有生氣的貼文。';
      case 'surprised':
        return '目前沒有驚訝的貼文。';
      case 'relaxed':
        return '目前沒有放鬆的貼文。';
      default:
        return '沒有找到符合條件的貼文。';
    }
  }
  
  // 獲取空狀態的按鈕文字和連結
  function getNoPostsAction(filterType) {
    if (filterType === 'my-posts') {
      return {
        text: '立即發文',
        emoji: '✏️',
        action: () => window.location.href = '/social/create_post'
      };
    } else {
      return {
        text: '查看全部貼文',
        emoji: '📋',
        action: () => document.querySelector('[data-filter="all"]').click()
      };
    }
  }

  /* --- 更多下拉 / 深色模式 --- */
  const moreToggle = document.querySelector('.more-toggle');
  const moreMenu   = document.querySelector('.more-menu');
  if (moreToggle && moreMenu) {
    moreToggle.addEventListener('click', event => {
      event.stopPropagation();
      moreMenu.style.display = moreMenu.style.display === 'flex' ? 'none' : 'flex';
    });
    document.addEventListener('click', () => (moreMenu.style.display = 'none'));
  }
  
  const darkToggle = document.getElementById('toggle-dark');
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      if (typeof toggleDarkMode === 'function') toggleDarkMode();
    });
  }

  /* --- 貼文編輯和刪除功能 --- */
  
  console.log('[DEBUG] 開始綁定編輯和刪除按鈕事件');
  
  // 刪除貼文
  const deleteButtons = document.querySelectorAll('.delete-post-btn');
  console.log('[DEBUG] 找到', deleteButtons.length, '個刪除按鈕');
  
  deleteButtons.forEach((deleteBtn, index) => {
    console.log('[DEBUG] 綁定刪除按鈕', index, 'ID:', deleteBtn.dataset.postId);
    deleteBtn.addEventListener('click', function() {
      const postId = this.dataset.postId;
      console.log('[DEBUG] 刪除按鈕被點擊，貼文 ID:', postId);
      
      if (confirm('確定要刪除這篇貼文嗎？此操作無法復原。')) {
        // 禁用按鈕防止重複點擊
        this.disabled = true;
        this.textContent = '刪除中...';
        
        console.log('[DEBUG] 開始發送刪除請求到:', `/social/delete_post/${postId}`);
        
        fetch(`/social/delete_post/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .then(response => {
          console.log('[DEBUG] 刪除請求回應狀態:', response.status);
          return response.json();
        })
        .then(data => {
          console.log('[DEBUG] 刪除請求回應資料:', data);
          if (data.success) {
            // 移除貼文卡片
            const postCard = this.closest('.post-card');
            postCard.style.opacity = '0.5';
            postCard.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
              postCard.remove();
              // 檢查是否還有貼文，沒有的話顯示空狀態
              const remainingPosts = document.querySelectorAll('.post-card');
              if (remainingPosts.length === 0) {
                location.reload(); // 重新載入頁面顯示空狀態
              }
            }, 300);
            
            alert(data.message);
          } else {
            alert(data.message);
            // 重新啟用按鈕
            this.disabled = false;
            this.innerHTML = '<span class="btn-emoji">🗑️</span> 刪除';
          }
        })
        .catch(error => {
          console.error('[ERROR] 刪除錯誤:', error);
          alert('刪除失敗，請稍後再試');
          // 重新啟用按鈕
          this.disabled = false;
          this.innerHTML = '<span class="btn-emoji">🗑️</span> 刪除';
        });
      }
    });
  });

  // 編輯貼文
  const editButtons = document.querySelectorAll('.edit-post-btn');
  console.log('[DEBUG] 找到', editButtons.length, '個編輯按鈕');
  
  editButtons.forEach((editBtn, index) => {
    console.log('[DEBUG] 綁定編輯按鈕', index, 'ID:', editBtn.dataset.postId);
    editBtn.addEventListener('click', function() {
      const postId = this.dataset.postId;
      console.log('[DEBUG] 編輯按鈕被點擊，貼文 ID:', postId);
      
      console.log('[DEBUG] 開始獲取貼文資料:', `/social/edit_post/${postId}`);
      
      // 獲取貼文資料
      fetch(`/social/edit_post/${postId}`, {
        method: 'GET'
      })
      .then(response => {
        console.log('[DEBUG] 編輯資料請求回應狀態:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('[DEBUG] 編輯資料請求回應:', data);
        if (data.success) {
          showEditModal(postId, data.post);
        } else {
          alert(data.message);
        }
      })
      .catch(error => {
        console.error('[ERROR] 獲取貼文資料錯誤:', error);
        alert('載入貼文資料失敗');
      });
    });
  });

  // 顯示編輯模態框
  function showEditModal(postId, postData) {
    // 創建編輯模態框
    const modal = document.createElement('div');
    modal.className = 'edit-modal-overlay';
    modal.innerHTML = `
      <div class="edit-modal">
        <div class="edit-modal-header">
          <h3>編輯貼文</h3>
          <button class="close-modal-btn" type="button">×</button>
        </div>
        <form id="edit-post-form" class="edit-modal-body">
          <div class="form-group">
            <label for="edit-title">標題</label>
            <input type="text" id="edit-title" name="title" value="${postData.title}" maxlength="100" class="form-control">
            <div class="char-counter">
              <span id="edit-title-count">${postData.title.length}</span>/100 字
            </div>
          </div>
          
          <div class="form-group">
            <label for="edit-content">內容</label>
            <textarea id="edit-content" name="content" maxlength="1000" class="form-control" required>${postData.content}</textarea>
            <div class="char-counter">
              <span id="edit-content-count">${postData.content.length}</span>/1000 字
            </div>
          </div>
          
          <div class="form-group">
            <label>心情標籤</label>
            <div class="mood-tags">
              <label class="mood-tag ${postData.mood === 'happy' ? 'selected' : ''}">
                <input type="radio" name="mood" value="happy" ${postData.mood === 'happy' ? 'checked' : ''}>
                😄 開心
              </label>
              <label class="mood-tag ${postData.mood === 'sad' ? 'selected' : ''}">
                <input type="radio" name="mood" value="sad" ${postData.mood === 'sad' ? 'checked' : ''}>
                😢 難過
              </label>
              <label class="mood-tag ${postData.mood === 'angry' ? 'selected' : ''}">
                <input type="radio" name="mood" value="angry" ${postData.mood === 'angry' ? 'checked' : ''}>
                😡 生氣
              </label>
              <label class="mood-tag ${postData.mood === 'surprised' ? 'selected' : ''}">
                <input type="radio" name="mood" value="surprised" ${postData.mood === 'surprised' ? 'checked' : ''}>
                😱 驚訝
              </label>
              <label class="mood-tag ${postData.mood === 'relaxed' ? 'selected' : ''}">
                <input type="radio" name="mood" value="relaxed" ${postData.mood === 'relaxed' ? 'checked' : ''}>
                😌 放鬆
              </label>
              <label class="mood-tag ${postData.mood === 'neutral' ? 'selected' : ''}">
                <input type="radio" name="mood" value="neutral" ${postData.mood === 'neutral' ? 'checked' : ''}>
                😐 平常
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" name="anonymous" value="1" ${postData.is_anonymous ? 'checked' : ''}>
              匿名發文
            </label>
          </div>
          
          <div class="edit-modal-footer">
            <button type="button" class="btn btn-secondary cancel-edit-btn">取消</button>
            <button type="submit" class="btn btn-primary">更新貼文</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 設置字數統計
    const titleInput = modal.querySelector('#edit-title');
    const contentTextarea = modal.querySelector('#edit-content');
    const titleCount = modal.querySelector('#edit-title-count');
    const contentCount = modal.querySelector('#edit-content-count');
    
    titleInput.addEventListener('input', () => {
      titleCount.textContent = titleInput.value.length;
    });
    
    contentTextarea.addEventListener('input', () => {
      contentCount.textContent = contentTextarea.value.length;
    });
    
    // 心情標籤選擇
    modal.querySelectorAll('input[name="mood"]').forEach(radio => {
      radio.addEventListener('change', function() {
        modal.querySelectorAll('.mood-tag').forEach(tag => tag.classList.remove('selected'));
        this.closest('.mood-tag').classList.add('selected');
      });
    });
    
    // 關閉模態框
    const closeModal = () => {
      modal.remove();
    };
    
    modal.querySelector('.close-modal-btn').addEventListener('click', closeModal);
    modal.querySelector('.cancel-edit-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
    
    // 提交編輯
    modal.querySelector('#edit-post-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const submitBtn = this.querySelector('button[type="submit"]');
      
      submitBtn.disabled = true;
      submitBtn.textContent = '更新中...';
      
      fetch(`/social/edit_post/${postId}`, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          closeModal();
          location.reload(); // 重新載入頁面顯示更新後的內容
        } else {
          alert(data.message);
          submitBtn.disabled = false;
          submitBtn.textContent = '更新貼文';
        }
      })
      .catch(error => {
        console.error('更新錯誤:', error);
        alert('更新失敗，請稍後再試');
        submitBtn.disabled = false;
        submitBtn.textContent = '更新貼文';
      });
    });
  }

  /* --- 我的貢獻統計功能 --- */
  
  // 當點擊我的貢獻標籤時，顯示統計信息
  function showMyContributionsStats() {
    const myPostsTag = document.querySelector('[data-filter="my-posts"]');
    if (!myPostsTag) return;
    
    // 添加載入指示器
    const originalText = myPostsTag.innerHTML;
    myPostsTag.innerHTML = '👤 載入中...';
    
    fetch('/social/my_contributions')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const stats = data.data;
          myPostsTag.innerHTML = `👤 我的貢獻 (${stats.total_posts})`;
          myPostsTag.title = `總貼文: ${stats.total_posts}, 總獲讚: ${stats.total_likes}, 總評論: ${stats.total_comments}`;
        } else {
          myPostsTag.innerHTML = originalText;
        }
      })
      .catch(error => {
        console.error('[ERROR] 獲取貢獻統計失敗:', error);
        myPostsTag.innerHTML = originalText;
      });
  }
  
  // 頁面載入後獲取統計資料
  showMyContributionsStats();
  
  // 載入並更新用戶等級信息
  loadUserLevelInfo();

  /* --- 用戶等級系統功能 --- */
  
  // 載入用戶等級信息
  function loadUserLevelInfo() {
    const levelCard = document.getElementById('user-level-card');
    if (!levelCard) return;
    
    fetch('/social/user_level_info')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          updateLevelCard(data);
        } else {
          console.error('[ERROR] 獲取等級信息失敗:', data.message);
        }
      })
      .catch(error => {
        console.error('[ERROR] 載入等級信息時發生錯誤:', error);
      });
  }
  
  // 更新等級卡片
  function updateLevelCard(levelData) {
    const levelCard = document.getElementById('user-level-card');
    if (!levelCard) return;
    
    const currentLevel = levelData.current_level;
    const nextLevel = levelData.next_level;
    const stats = levelData.stats;
    
    // 更新等級圖示和標題
    const levelEmoji = levelCard.querySelector('.level-emoji');
    const levelTitle = levelCard.querySelector('.level-title');
    const levelDescription = levelCard.querySelector('.level-description');
    const pointsValue = levelCard.querySelector('.points-value');
    
    if (levelEmoji) levelEmoji.textContent = currentLevel.emoji;
    if (levelTitle) levelTitle.textContent = currentLevel.title;
    if (levelDescription) levelDescription.textContent = currentLevel.description;
    if (pointsValue) pointsValue.textContent = levelData.points;
    
    // 更新進度條
    const progressFill = levelCard.querySelector('.progress-fill');
    const currentProgress = levelCard.querySelector('.current-progress');
    const nextLevelText = levelCard.querySelector('.next-level');
    
    if (progressFill) {
      progressFill.style.width = `${levelData.progress_to_next}%`;
      progressFill.style.background = `linear-gradient(90deg, ${currentLevel.color}, ${currentLevel.color}99)`;
    }
    
    if (currentProgress) {
      currentProgress.textContent = `${levelData.progress_to_next}%`;
    }
    
    if (nextLevelText) {
      if (nextLevel) {
        nextLevelText.textContent = `下一級：${nextLevel.title}`;
      } else {
        nextLevelText.textContent = '已達最高等級！';
      }
    }
    
    // 更新統計數據
    const statItems = levelCard.querySelectorAll('.stat-item .stat-value');
    if (statItems.length >= 4) {
      statItems[0].textContent = stats.posts_count;        // 發文
      statItems[1].textContent = stats.likes_received;     // 獲讚
      statItems[2].textContent = stats.comments_received;  // 被留言（其他人在我的貼文下留言）
      statItems[3].textContent = stats.login_days;         // 天數
    }
    
    // 更新卡片樣式
    levelCard.style.background = `linear-gradient(135deg, ${currentLevel.bg_color}, ${currentLevel.bg_color}dd)`;
    levelCard.style.borderLeft = `4px solid ${currentLevel.color}`;
    
    // 添加等級提示
    levelCard.title = `當前等級：${currentLevel.title} (${levelData.points} 積分)`;
  }
  
  // 顯示等級升級通知
  function showLevelUpNotification(levelUpData) {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-icon">${levelUpData.new_emoji}</div>
        <div class="level-up-text">
          <h3>🎉 恭喜升級！</h3>
          <p>${levelUpData.message}</p>
        </div>
        <button class="level-up-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // 添加樣式
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #5B7F47, #4A6B38);
      color: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideInRight 0.5s ease;
      max-width: 350px;
    `;
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 3秒後自動消失
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => notification.remove(), 500);
      }
    }, 3000);
    
    // 重新載入等級信息
    setTimeout(() => loadUserLevelInfo(), 1000);
  }
  
  // 檢查發文後的等級升級
  window.checkLevelUpAfterPost = function(responseData) {
    if (responseData && responseData.level_up) {
      showLevelUpNotification(responseData.level_up);
    }
  };

});

// = 功能尚未開通模組 =
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="#"]').forEach(featureLink => {
    featureLink.addEventListener('click', event => {
      event.preventDefault();
      document.getElementById('feature-modal')?.classList.add('active');
    });
  });
});

function closeFeatureModal() {
  document.getElementById('feature-modal')?.classList.remove('active');
}

// --- 左側標籤貼文數量統計 ---
  // 2025-07-07 by 朱羿安: 自動統計所有貼文數量並顯示於標籤
  function updateTagCounts() {
    const postCards = document.querySelectorAll('.post-card');
    const counts = {
      all: 0,
      'my-posts': 0,
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      relaxed: 0
    };
    
    postCards.forEach(card => {
      counts.all++;
      const mood = card.dataset.mood;
      if (mood && counts[mood] !== undefined) counts[mood]++;
      // 我的貢獻（有 author-actions）
      if (card.querySelector('.author-actions')) counts['my-posts']++;
    });
    
    // 更新數字
    const allCount = document.getElementById('count-all');
    const myPostsCount = document.getElementById('count-my-posts');
    const happyCount = document.getElementById('count-happy');
    const sadCount = document.getElementById('count-sad');
    const angryCount = document.getElementById('count-angry');
    const surprisedCount = document.getElementById('count-surprised');
    const relaxedCount = document.getElementById('count-relaxed');
    const allPostsCount = document.getElementById('all-posts-count');
    
    if (allCount) allCount.textContent = counts.all;
    if (myPostsCount) myPostsCount.textContent = counts['my-posts'];
    if (happyCount) happyCount.textContent = counts.happy;
    if (sadCount) sadCount.textContent = counts.sad;
    if (angryCount) angryCount.textContent = counts.angry;
    if (surprisedCount) surprisedCount.textContent = counts.surprised;
    if (relaxedCount) relaxedCount.textContent = counts.relaxed;
    if (allPostsCount) allPostsCount.textContent = counts.all;
  }
  
  // 頁面載入時自動統計
  updateTagCounts();

/* === 版面切換功能 === */

// 初始化版面切換功能
function initTabSwitching() {
  const mainTabs = document.querySelectorAll('.main-tab');
  const subTabs = document.querySelectorAll('.sub-tabs');
  
  mainTabs.forEach(tab => {
    // 檢查是否為鏈接形式的標籤（a 標籤）
    if (tab.tagName === 'A') {
      // 對於鏈接形式的標籤，直接使用正常的導航行為
      return;
    }
    
    // 對於 div 形式的標籤，綁定點擊事件
    tab.addEventListener('click', function() {
      const tabType = this.dataset.tab;
      
      // 切換主要標籤的活動狀態
      mainTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // 顯示/隱藏對應的子標籤
      subTabs.forEach(subTab => {
        subTab.style.display = 'none';
      });
      
      const targetSubTab = document.getElementById(tabType + '-filters');
      if (targetSubTab) {
        targetSubTab.style.display = 'block';
      }
      
      // 處理貼文顯示
      handleTabSwitch(tabType);
      
      // 更新標籤計數
      updateTabCounts(tabType);
    });
  });
  
  // 初始載入社交統計
  loadSocialStats();
}

// 處理版面切換時的貼文顯示
function handleTabSwitch(tabType) {
  const postList = document.querySelector('.post-list');
  const postCards = document.querySelectorAll('.post-card');
  
  // 移除之前的空狀態訊息
  const existingEmpty = postList.querySelector('.no-following-posts');
  if (existingEmpty) {
    existingEmpty.remove();
  }
  
  if (tabType === 'all-posts') {
    // 顯示所有貼文
    postCards.forEach(card => card.style.display = 'block');
    // 重置子標籤為全部
    const allTag = document.querySelector('[data-filter="all"]');
    if (allTag) {
      document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
      allTag.classList.add('active');
    }
  } else if (tabType === 'following') {
    // 隱藏所有貼文，顯示追蹤功能尚未完成的提示
    postCards.forEach(card => card.style.display = 'none');
    
    const noFollowingPosts = document.createElement('div');
    noFollowingPosts.className = 'no-following-posts';
    noFollowingPosts.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; background: var(--card-light); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); margin: 20px 0;">
        <div style="font-size: 3em; margin-bottom: 16px; opacity: 0.6;">👥</div>
        <h3 style="margin: 0 0 16px 0; color: #333;">追蹤功能開發中</h3>
        <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">
          我們正在開發用戶追蹤功能，完成後您就可以追蹤其他用戶並在這裡查看他們的最新動態。
        </p>
        <button class="btn btn-primary" onclick="switchToAllPosts()" style="margin-right: 12px;">
          <span class="btn-emoji">📋</span> 瀏覽所有貼文
        </button>
        <button class="btn btn-secondary" onclick="showComingSoonModal()">
          <span class="btn-emoji">🔔</span> 通知我功能上線
        </button>
      </div>
    `;
    
    // 深色模式樣式調整
    if (document.body.classList.contains('dark-mode')) {
      const container = noFollowingPosts.querySelector('div');
      container.style.background = 'var(--card-dark)';
      container.style.color = '#eee';
      container.style.boxShadow = '0 2px 8px rgba(0,0,0,.2)';
      const h3 = container.querySelector('h3');
      h3.style.color = '#eee';
      const p = container.querySelector('p');
      p.style.color = '#aaa';
    }
    
    postList.appendChild(noFollowingPosts);
  }
}

// 更新標籤計數
function updateTabCounts(activeTab) {
  const postCards = document.querySelectorAll('.post-card');
  
  if (activeTab === 'all-posts') {
    // 更新所有貼文數量
    const allCount = postCards.length;
    const allPostsCount = document.getElementById('all-posts-count');
    if (allPostsCount) {
      allPostsCount.textContent = allCount;
    }
  } else if (activeTab === 'following') {
    // 更新追蹤貼文數量（目前為0）
    const followingCount = document.getElementById('following-posts-count');
    if (followingCount) {
      followingCount.textContent = '0';
    }
  }
}

// 載入社交統計數據
function loadSocialStats() {
  // 獲取當前用戶的社交統計
  fetch('/social/get_social_stats')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateSocialStats(data);
      } else {
        // 如果API還未實現，使用默認值
        updateSocialStats({ followers_count: 0, following_count: 0 });
      }
    })
    .catch(error => {
      console.log('[DEBUG] 社交統計API尚未實現，使用默認值');
      updateSocialStats({ followers_count: 0, following_count: 0 });
    });
}

// 更新社交統計顯示
function updateSocialStats(data) {
  const followersCount = document.getElementById('followers-count');
  const followingCount = document.getElementById('following-count');
  
  if (followersCount) {
    followersCount.textContent = data.followers_count || 0;
  }
  if (followingCount) {
    followingCount.textContent = data.following_count || 0;
  }
}

// 工具函數
window.switchToAllPosts = function() {
  const allPostsTab = document.querySelector('[data-tab="all-posts"]');
  if (allPostsTab) {
    allPostsTab.click();
  }
};

window.showComingSoonModal = function() {
  alert('我們會在功能上線時通知您！請持續關注我們的更新。');
};

function showFollowModal(type, title, users) {
  const modal = document.createElement('div');
  modal.className = 'follow-modal-overlay';
  modal.innerHTML = `
    <div class="follow-modal">
      <div class="follow-modal-header">
        <h3>${title}</h3>
        <button class="close-modal-btn" type="button">×</button>
      </div>
      <div class="follow-modal-body">
        ${users.length === 0 ? `
          <div class="empty-follow-list">
            <div class="empty-icon">${type === 'following' ? '👥' : '🙋‍♂️'}</div>
            <h4>${type === 'following' ? '還沒有追蹤任何人' : '還沒有粉絲'}</h4>
            <p>${type === 'following' ? 
              '開始追蹤其他用戶，在這裡查看他們的最新動態' : 
              '分享更多精彩內容，吸引更多粉絲關注您'}</p>
            <button class="btn btn-primary" onclick="closeFollowModal(); ${type === 'following' ? 'switchToAllPosts()' : 'window.location.href=\'/social/create_post\''}">
              <span class="btn-emoji">${type === 'following' ? '🔍' : '✏️'}</span> 
              ${type === 'following' ? '探索用戶' : '發布貼文'}
            </button>
          </div>
        ` : users.map(user => `
          <div class="follow-user-item" data-user-email="${user.user_email || user.email}">
            <div class="follow-user-info">
              <div class="follow-user-avatar">${user.username.charAt(0)}</div>
              <div class="follow-user-details">
                <h4>${user.username}</h4>
                <p>${user.post_count || 0} 篇貼文${user.followed_at ? ' · 追蹤於 ' + user.followed_at : ''}</p>
              </div>
            </div>
            <div class="follow-user-actions">
              ${type === 'following' ? 
                `<button class="btn btn-danger unfollow-user-btn" data-user-email="${user.user_email}" data-username="${user.username}">
                  <span class="btn-emoji">✕</span> 取消追蹤
                </button>` :
                `<button class="btn btn-warning remove-follower-btn" data-user-email="${user.user_email}" data-username="${user.username}">
                  <span class="btn-emoji">🗑️</span> 移除粉絲
                </button>`
              }
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.classList.add('active');
  
  // 綁定按鈕事件
  if (users.length > 0) {
    // 綁定取消追蹤按鈕
    modal.querySelectorAll('.unfollow-user-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const userEmail = this.dataset.userEmail;
        const username = this.dataset.username;
        handleUnfollowUser(userEmail, username, this);
      });
    });
    
    // 綁定移除粉絲按鈕
    modal.querySelectorAll('.remove-follower-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const userEmail = this.dataset.userEmail;
        const username = this.dataset.username;
        handleRemoveFollower(userEmail, username, this);
      });
    });
  }
  
  // 關閉事件
  modal.querySelector('.close-modal-btn').addEventListener('click', () => {
    closeFollowModal();
  });
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeFollowModal();
    }
  });
}

window.closeFollowModal = function() {
  const modal = document.querySelector('.follow-modal-overlay');
  if (modal) {
    modal.remove();
  }
};

/* === 追蹤功能 === */

// 初始化追蹤功能
function initFollowFunctionality() {
  // 綁定所有追蹤按鈕事件（包括內聯和留言區按鈕）
  document.querySelectorAll('.follow-btn, .follow-btn-inline, .follow-btn-comment').forEach(followBtn => {
    bindFollowButton(followBtn);
  });
  
  // 載入當前用戶的社交統計
  loadCurrentUserSocialStats();
  
  // 檢查現有貼文的追蹤狀態
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
    const endpoint = `/social/${action}/${encodeURIComponent(userEmail)}`;
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
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
        
        // 更新社交統計
        updateSocialStatsDisplay(data.following_count, data.followers_count);
        
        // 顯示操作結果
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

// 載入當前用戶的社交統計
function loadCurrentUserSocialStats() {
  fetch('/social/get_social_stats')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateSocialStatsDisplay(data.following_count, data.followers_count);
      }
    })
    .catch(error => {
      console.log('[DEBUG] 獲取社交統計失敗:', error);
    });
}

// 更新社交統計顯示
function updateSocialStatsDisplay(followingCount, followersCount) {
  const followersCountElement = document.getElementById('followers-count');
  const followingCountElement = document.getElementById('following-count');
  const followingPostsCountElement = document.getElementById('following-posts-count');
  
  if (followersCountElement) {
    followersCountElement.textContent = followersCount || 0;
  }
  if (followingCountElement) {
    followingCountElement.textContent = followingCount || 0;
  }
  if (followingPostsCountElement) {
    followingPostsCountElement.textContent = followingCount || 0;
  }
}

// 檢查現有貼文的追蹤狀態
function checkExistingFollowStatus() {
  const followBtns = document.querySelectorAll('.follow-btn[data-user-email], .follow-btn-inline[data-user-email], .follow-btn-comment[data-user-email]');
  const userEmails = Array.from(followBtns).map(btn => btn.dataset.userEmail);
  
  // 為了性能，我們可以批量檢查追蹤狀態
  // 這裡簡化為逐個檢查，實際可以優化為批量API
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
        updateFollowButtonStatus(userEmail, data.is_following);
      }
    })
    .catch(error => {
      console.log('[DEBUG] 檢查追蹤狀態失敗:', userEmail, error);
    });
}

// 更新追蹤按鈕狀態
function updateFollowButtonStatus(userEmail, isFollowing) {
  const followBtns = document.querySelectorAll(`[data-user-email="${userEmail}"].follow-btn, [data-user-email="${userEmail}"].follow-btn-inline, [data-user-email="${userEmail}"].follow-btn-comment`);
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

// 通用通知函數
function showNotification(message, type = 'info') {
  showFollowNotification(message, type);
}

// 更新追蹤用戶貼文功能
function loadFollowingPosts() {
  fetch('/social/get_following_posts')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        displayFollowingPosts(data.posts);
        updateTabCounts('following');
      } else {
        console.error('[ERROR] 獲取追蹤用戶貼文失敗:', data.message);
      }
    })
    .catch(error => {
      console.error('[ERROR] 載入追蹤用戶貼文時發生錯誤:', error);
    });
}

// 顯示追蹤用戶的貼文
function displayFollowingPosts(posts) {
  const postList = document.querySelector('.post-list');
  const existingPosts = postList.querySelectorAll('.post-card');
  
  // 隱藏所有現有貼文
  existingPosts.forEach(post => post.style.display = 'none');
  
  // 移除之前的追蹤貼文容器
  const existingFollowingContainer = postList.querySelector('.following-posts-container');
  if (existingFollowingContainer) {
    existingFollowingContainer.remove();
  }
  
  if (posts.length === 0) {
    // 顯示沒有追蹤貼文的提示
    const noFollowingPosts = document.createElement('div');
    noFollowingPosts.className = 'following-posts-container';
    noFollowingPosts.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; background: var(--card-light); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.08); margin: 20px 0;">
        <div style="font-size: 3em; margin-bottom: 16px; opacity: 0.6;">👥</div>
        <h3 style="margin: 0 0 16px 0; color: #333;">還沒有追蹤的用戶貼文</h3>
        <p style="margin: 0 0 24px 0; color: #666; line-height: 1.5;">
          開始追蹤其他用戶，在這裡查看他們的最新動態。
        </p>
        <button class="btn btn-primary" onclick="switchToAllPosts()">
          <span class="btn-emoji">🔍</span> 探索用戶
        </button>
      </div>
    `;
    postList.appendChild(noFollowingPosts);
  } else {
    // 顯示追蹤用戶的貼文
    const followingContainer = document.createElement('div');
    followingContainer.className = 'following-posts-container';
    
    posts.forEach(post => {
      const postElement = createPostCard(post);
      followingContainer.appendChild(postElement);
    });
    
    postList.appendChild(followingContainer);
  }
}

// 創建貼文卡片元素（用於追蹤貼文）
function createPostCard(post) {
  const postElement = document.createElement('article');
  postElement.className = 'post-card';
  postElement.setAttribute('data-post-id', post.post_id);
  postElement.setAttribute('data-mood', post.mood || 'neutral');
  
  // 這裡可以根據需要實現完整的貼文卡片HTML
  // 為了簡化，這裡返回一個基本的結構
  postElement.innerHTML = `
    <header>
      <strong>${post.username}</strong>
      <span>${post.created_at}</span>
    </header>
    <div class="mood-indicator">
      <span class="mood-emoji">${getMoodEmoji(post.mood)}</span> ${getMoodText(post.mood)}
    </div>
    ${post.title ? `<div class="post-title"><h3>${post.title}</h3></div>` : ''}
    <p>${post.content}</p>
    ${post.image_url ? `<div class="post-image"><img src="${post.image_url}" alt="貼文圖片"></div>` : ''}
    <footer>
      <button class="like-btn" data-post-id="${post.post_id}" data-liked="${post.user_liked}">
        <span class="btn-emoji">${post.user_liked ? '👍' : '🤍'}</span> ${post.likes_count}
      </button>
      <button class="comment-btn" data-post-id="${post.post_id}">
        <span class="btn-emoji">💬</span> ${post.comments.length}
      </button>
    </footer>
  `;
  
  return postElement;
}

// 獲取心情表情符號
function getMoodEmoji(mood) {
  const moodEmojis = {
    'happy': '😄',
    'sad': '😢',
    'angry': '😡',
    'surprised': '😱',
    'relaxed': '😌',
    'neutral': '😐'
  };
  return moodEmojis[mood] || '😐';
}

// 獲取心情文字
function getMoodText(mood) {
  const moodTexts = {
    'happy': '開心',
    'sad': '難過',
    'angry': '生氣',
    'surprised': '驚訝',
    'relaxed': '放鬆',
    'neutral': '平常'
  };
  return moodTexts[mood] || '平常';
}

// 更新追蹤列表和粉絲列表功能
window.showFollowingList = function() {
  console.log('[DEBUG] 開始載入追蹤列表');
  
  // 先顯示加載中的模態框
  showFollowModal('following', '我的追蹤', []);
  
  fetch('/social/get_following')
    .then(response => {
      console.log('[DEBUG] 追蹤列表請求響應:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('[DEBUG] 追蹤列表數據:', data);
      // 關閉之前的模態框
      const existingModal = document.querySelector('.follow-modal-overlay');
      if (existingModal) {
        existingModal.remove();
      }
      
      if (data.success) {
        showFollowModal('following', '我的追蹤', data.following);
      } else {
        showFollowModal('following', '我的追蹤', []);
      }
    })
    .catch(error => {
      console.error('[ERROR] 獲取追蹤列表失敗:', error);
      // 關閉之前的模態框
      const existingModal = document.querySelector('.follow-modal-overlay');
      if (existingModal) {
        existingModal.remove();
      }
      showFollowModal('following', '我的追蹤', []);
    });
};

window.showFollowersList = function() {
  console.log('[DEBUG] 開始載入粉絲列表');
  
  // 先顯示加載中的模態框
  showFollowModal('followers', '我的粉絲', []);
  
  fetch('/social/get_followers')
    .then(response => {
      console.log('[DEBUG] 粉絲列表請求響應:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('[DEBUG] 粉絲列表數據:', data);
      // 關閉之前的模態框
      const existingModal = document.querySelector('.follow-modal-overlay');
      if (existingModal) {
        existingModal.remove();
      }
      
      if (data.success) {
        showFollowModal('followers', '我的粉絲', data.followers);
      } else {
        showFollowModal('followers', '我的粉絲', []);
      }
    })
    .catch(error => {
      console.error('[ERROR] 獲取粉絲列表失敗:', error);
      // 關閉之前的模態框
      const existingModal = document.querySelector('.follow-modal-overlay');
      if (existingModal) {
        existingModal.remove();
      }
      showFollowModal('followers', '我的粉絲', []);
    });
};

// 修改版面切換功能以支持追蹤貼文
const originalHandleTabSwitch = handleTabSwitch;
window.handleTabSwitch = function(tabType) {
  if (tabType === 'following') {
    // 載入追蹤用戶的貼文
    loadFollowingPosts();
  } else {
    // 使用原來的邏輯
    if (originalHandleTabSwitch) {
      originalHandleTabSwitch(tabType);
    }
  }
};

// 處理取消追蹤用戶
function handleUnfollowUser(userEmail, username, btnElement) {
  if (!userEmail || !username) {
    console.error('[ERROR] 缺少用戶信息');
    return;
  }
  
  // 確認對話框
  if (!confirm(`確定要取消追蹤 ${username} 嗎？`)) {
    return;
  }
  
  // 禁用按鈕防止重複點擊
  btnElement.disabled = true;
  btnElement.innerHTML = '<span class="btn-emoji">⏳</span> 處理中...';
  
  fetch(`/social/unfollow/${encodeURIComponent(userEmail)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // 移除用戶項目
      const userItem = btnElement.closest('.follow-user-item');
      if (userItem) {
        userItem.style.opacity = '0.5';
        userItem.style.transform = 'translateX(-20px)';
        setTimeout(() => {
          userItem.remove();
          
          // 檢查是否還有用戶
          const modalBody = document.querySelector('.follow-modal-body');
          const userItems = modalBody.querySelectorAll('.follow-user-item');
          if (userItems.length === 0) {
            modalBody.innerHTML = `
              <div class="empty-follow-list">
                <div class="empty-icon">👥</div>
                <h4>還沒有追蹤任何人</h4>
                <p>開始追蹤其他用戶，在這裡查看他們的最新動態</p>
                <button class="btn btn-primary" onclick="closeFollowModal(); switchToAllPosts()">
                  <span class="btn-emoji">🔍</span> 探索用戶
                </button>
              </div>
            `;
          }
        }, 300);
      }
      
      // 更新社交統計
      loadCurrentUserSocialStats();
      
      // 顯示成功消息
      showNotification(`已取消追蹤 ${username}`, 'success');
      
      // 如果當前在追蹤頁面，重新載入貼文
      const followingTab = document.querySelector('.main-tab[data-tab="following"]');
      if (followingTab && followingTab.classList.contains('active')) {
        loadFollowingPosts();
      }
      
    } else {
      btnElement.disabled = false;
      btnElement.innerHTML = '<span class="btn-emoji">✕</span> 取消追蹤';
      showNotification(data.message || '取消追蹤失敗', 'error');
    }
  })
  .catch(error => {
    console.error('[ERROR] 取消追蹤失敗:', error);
    btnElement.disabled = false;
    btnElement.innerHTML = '<span class="btn-emoji">✕</span> 取消追蹤';
    showNotification('取消追蹤失敗，請稍後再試', 'error');
  });
}

// 處理移除粉絲
function handleRemoveFollower(userEmail, username, btnElement) {
  if (!userEmail || !username) {
    console.error('[ERROR] 缺少用戶信息');
    return;
  }
  
  // 確認對話框
  if (!confirm(`確定要移除粉絲 ${username} 嗎？此操作將使該用戶不再關注您。`)) {
    return;
  }
  
  // 禁用按鈕防止重複點擊
  btnElement.disabled = true;
  btnElement.innerHTML = '<span class="btn-emoji">⏳</span> 處理中...';
  
  fetch('/social/remove_follower', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      follower_email: userEmail
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // 移除用戶項目
      const userItem = btnElement.closest('.follow-user-item');
      if (userItem) {
        userItem.style.opacity = '0.5';
        userItem.style.transform = 'translateX(-20px)';
        setTimeout(() => {
          userItem.remove();
          
          // 檢查是否還有用戶
          const modalBody = document.querySelector('.follow-modal-body');
          const userItems = modalBody.querySelectorAll('.follow-user-item');
          if (userItems.length === 0) {
            modalBody.innerHTML = `
              <div class="empty-follow-list">
                <div class="empty-icon">🙋‍♂️</div>
                <h4>還沒有粉絲</h4>
                <p>分享更多精彩內容，吸引更多粉絲關注您</p>
                <button class="btn btn-primary" onclick="closeFollowModal(); window.location.href='/social/create_post'">
                  <span class="btn-emoji">✏️</span> 發布貼文
                </button>
              </div>
            `;
          }
        }, 300);
      }
      
      // 更新社交統計
      loadCurrentUserSocialStats();
      
      // 顯示成功消息
      showNotification(`已移除粉絲 ${username}`, 'success');
      
    } else {
      btnElement.disabled = false;
      btnElement.innerHTML = '<span class="btn-emoji">🗑️</span> 移除粉絲';
      showNotification(data.message || '移除粉絲失敗', 'error');
    }
  })
  .catch(error => {
    console.error('[ERROR] 移除粉絲失敗:', error);
    btnElement.disabled = false;
    btnElement.innerHTML = '<span class="btn-emoji">🗑️</span> 移除粉絲';
    showNotification('移除粉絲失敗，請稍後再試', 'error');
  });
}
