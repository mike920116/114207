document.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG] DOM 載入完成，開始初始化社群功能');

  /* --- 初始化用戶數據 --- */
  function initializeUserData() {
    // 獲取用戶等級信息
    fetch('/social/user_level_info')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          updateUserLevelCard(data);
        }
      })
      .catch(error => {
        console.error('[ERROR] 獲取用戶等級信息失敗:', error);
      });

    // 獲取社交統計數據
    fetch('/social/get_social_stats')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          updateSocialStats(data);
        }
      })
      .catch(error => {
        console.error('[ERROR] 獲取社交統計失敗:', error);
      });
  }

  /* --- 更新用戶等級卡片 --- */
  function updateUserLevelCard(levelInfo) {
    try {
      // 更新等級標題和描述
      const levelTitle = document.querySelector('.level-title');
      const levelDescription = document.querySelector('.level-description');
      const levelEmoji = document.querySelector('.level-emoji');
      const pointsValue = document.querySelector('.points-value');
      const progressFill = document.querySelector('.progress-fill');
      const currentProgress = document.querySelector('.current-progress');
      const nextLevel = document.querySelector('.next-level');

      if (levelInfo.current_level) {
        if (levelEmoji) levelEmoji.textContent = levelInfo.current_level.emoji;
        if (levelDescription) levelDescription.textContent = levelInfo.current_level.description;
      }

      if (pointsValue) pointsValue.textContent = levelInfo.points || 0;
      
      if (progressFill) {
        const progress = levelInfo.progress_to_next || 0;
        progressFill.style.width = `${progress}%`;
      }
      
      if (currentProgress) {
        currentProgress.textContent = `${levelInfo.progress_to_next || 0}%`;
      }

      if (nextLevel && levelInfo.next_level) {
        nextLevel.textContent = `下一級：${levelInfo.next_level.title}`;
      }

      // 更新統計數據
      if (levelInfo.stats) {
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach(item => {
          const statValue = item.querySelector('.stat-value');
          const statLabel = item.querySelector('.stat-label');
          
          if (statLabel && statValue) {
            const label = statLabel.textContent;
            switch (label) {
              case '發文':
                statValue.textContent = levelInfo.stats.posts_count || 0;
                break;
              case '獲讚':
                statValue.textContent = levelInfo.stats.likes_received || 0;
                break;
              case '留言':
                statValue.textContent = levelInfo.stats.comments_received || 0;
                break;
              case '天數':
                statValue.textContent = levelInfo.stats.login_days || 1;
                break;
            }
          }
        });
      }
    } catch (error) {
      console.error('[ERROR] 更新用戶等級卡片失敗:', error);
    }
  }

  // 初始化用戶數據
  initializeUserData();

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
      notification.style.animation = 'notificationSlideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    });

    // 自動關閉
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'notificationSlideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }

  /* --- 追蹤功能 --- */
  function handleFollowAction(userEmail, action) {
    // 找到所有該用戶的追蹤按鈕
    const buttons = document.querySelectorAll(`[data-user-email="${userEmail}"]`);
    if (buttons.length === 0) return;

    // 禁用所有按鈕防止重複點擊
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-emoji">⏳</span> 處理中...';
    });

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
        // 更新所有該用戶的追蹤按鈕
        buttons.forEach(btn => {
          if (action === 'follow') {
            btn.innerHTML = '<span class="btn-emoji">✓</span> 已追蹤';
            btn.setAttribute('data-action', 'unfollow');
            btn.classList.add('following');
            btn.setAttribute('title', btn.getAttribute('title').replace('追蹤', '取消追蹤'));
          } else {
            btn.innerHTML = '<span class="btn-emoji">➕</span> 追蹤';
            btn.setAttribute('data-action', 'follow');
            btn.classList.remove('following');
            btn.setAttribute('title', btn.getAttribute('title').replace('取消追蹤', '追蹤'));
          }
        });
        
        // 更新社交統計 - 追蹤/取消追蹤只影響自己的追蹤數
        updateSocialStats({
          following_count: data.following_count
        });
        
        const actionText = action === 'follow' ? '追蹤' : '取消追蹤';
        showNotification(`${actionText}成功！`, 'success');
      } else {
        // 恢復按鈕原狀
        buttons.forEach(btn => {
          if (action === 'follow') {
            btn.innerHTML = '<span class="btn-emoji">➕</span> 追蹤';
            btn.classList.remove('following');
          } else {
            btn.innerHTML = '<span class="btn-emoji">✓</span> 已追蹤';
            btn.classList.add('following');
          }
        });
        showNotification(data.message || '操作失敗', 'error');
      }
    })
    .catch(error => {
      console.error('追蹤操作失敗:', error);
      // 恢復按鈕原狀
      buttons.forEach(btn => {
        if (action === 'follow') {
          btn.innerHTML = '<span class="btn-emoji">➕</span> 追蹤';
          btn.classList.remove('following');
        } else {
          btn.innerHTML = '<span class="btn-emoji">✓</span> 已追蹤';
          btn.classList.add('following');
        }
      });
      showNotification('網路錯誤，請稍後再試', 'error');
    })
    .finally(() => {
      // 重新啟用所有按鈕
      buttons.forEach(btn => {
        btn.disabled = false;
      });
    });
  }

  /* --- 社交統計更新 --- */
  function updateSocialStats(stats) {
    const followersCount = document.querySelector('[data-stat="followers"] .social-stat-number');
    const followingCount = document.querySelector('[data-stat="following"] .social-stat-number');
    
    // 只更新提供的統計數據
    if (followersCount && stats.followers_count !== undefined) {
      followersCount.textContent = stats.followers_count;
    }
    
    if (followingCount && stats.following_count !== undefined) {
      followingCount.textContent = stats.following_count;
    }
  }

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
  });

  // 使追蹤/粉絲功能在全域可用
  window.handleFollowAction = handleFollowAction;
  window.showNotification = showNotification;

  /* --- 按讚與留言功能 --- */
  document.querySelectorAll('.like-btn').forEach(likeButton => {
    likeButton.addEventListener('click', function() {
      const postId = this.getAttribute('data-post-id');
      const isLiked = this.getAttribute('data-liked') === 'true';
      
      // 禁用按鈕防止重複點擊
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
          const emoji = this.querySelector('.btn-emoji');
          // 修復：使用 API 返回的 is_liked 而不是 liked
          const newIsLiked = data.is_liked;
          emoji.textContent = newIsLiked ? '👍' : '🤍';
          this.setAttribute('data-liked', newIsLiked);
          
          // 查找並更新數字部分（跳過表情符號）
          const textNodes = Array.from(this.childNodes).filter(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
          );
          if (textNodes.length > 0) {
            textNodes[0].textContent = ` ${data.likes_count}`;
          } else {
            // 如果沒有文字節點，在表情符號後面添加
            this.appendChild(document.createTextNode(` ${data.likes_count}`));
          }
          
          // 如果有等級提升通知
          if (data.level_up) {
            showNotification(data.level_up.message, 'success');
          }
        } else {
          showNotification(data.message || '按讚操作失敗', 'error');
        }
      })
      .catch(error => {
        console.error('按讚操作失敗:', error);
        showNotification('網路錯誤，請稍後再試', 'error');
      })
      .finally(() => {
        // 重新啟用按鈕
        this.disabled = false;
      });
    });
  });

  // 留言按鈕功能
  document.querySelectorAll('.comment-btn').forEach(commentButton => {
    commentButton.addEventListener('click', function() {
      const postId = this.getAttribute('data-post-id');
      const commentsSection = document.getElementById(`comments-${postId}`);
      
      console.log(`[DEBUG] 點擊留言按鈕，PostID: ${postId}`);
      console.log(`[DEBUG] 留言區元素:`, commentsSection);
      
      if (commentsSection) {
        if (commentsSection.style.display === 'none' || !commentsSection.style.display) {
          commentsSection.style.display = 'block';
          loadComments(postId);
          console.log(`[DEBUG] 顯示留言區並載入留言`);
        } else {
          commentsSection.style.display = 'none';
          console.log(`[DEBUG] 隱藏留言區`);
        }
      } else {
        console.error(`[ERROR] 找不到留言區元素: comments-${postId}`);
      }
    });
  });

  // 載入留言
  function loadComments(postId) {
    console.log(`[DEBUG] 開始載入留言，PostID: ${postId}`);
    
    fetch(`/social/get_comments/${postId}`)
      .then(response => {
        console.log(`[DEBUG] 留言請求響應狀態:`, response.status);
        return response.json();
      })
      .then(data => {
        console.log(`[DEBUG] 留言數據:`, data);
        if (data.success) {
          const commentsList = document.getElementById(`comments-list-${postId}`);
          if (!commentsList) {
            console.error(`[ERROR] 找不到留言列表元素: comments-list-${postId}`);
            return;
          }
          
          commentsList.innerHTML = '';
          
          if (data.comments.length > 0) {
            data.comments.forEach(comment => {
              const commentHTML = createCommentHTML(comment);
              commentsList.innerHTML += commentHTML;
            });
            console.log(`[DEBUG] 成功載入 ${data.comments.length} 條留言`);
          } else {
            commentsList.innerHTML = '<div class="no-comments"><p>目前還沒有留言，成為第一個留言的人吧！</p></div>';
            console.log(`[DEBUG] 沒有留言，顯示空狀態`);
          }
        } else {
          console.error(`[ERROR] 載入留言失敗:`, data.message);
          showNotification(data.message || '載入留言失敗', 'error');
        }
      })
      .catch(error => {
        console.error('[ERROR] 載入留言失敗:', error);
        showNotification('載入留言失敗，請稍後再試', 'error');
      });
  }

  // 創建留言 HTML
  function createCommentHTML(comment) {
    return `
      <div class="comment-item" data-comment-id="${comment.comment_id}">
        <div class="comment-header">
          <strong class="comment-author">${comment.username}</strong>
          <span class="comment-time">${comment.created_at}</span>
        </div>
        <div class="comment-content">${comment.content}</div>
      </div>
    `;
  }

  /* --- 留言表單提交處理 --- */
  document.addEventListener('submit', function(e) {
    if (e.target.classList.contains('comment-form')) {
      e.preventDefault();
      const form = e.target;
      const postId = form.getAttribute('data-post-id');
      const formData = new FormData(form);
      
      console.log(`[DEBUG] 提交留言表單，PostID: ${postId}`);
      
      const submitBtn = form.querySelector('.submit-comment-btn');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '發送中...';
      
      fetch(`/social/add_comment/${postId}`, {
        method: 'POST',
        body: formData
      })
      .then(response => {
        console.log(`[DEBUG] 留言提交響應狀態:`, response.status);
        return response.json();
      })
      .then(data => {
        console.log(`[DEBUG] 留言提交響應:`, data);
        if (data.success) {
          // 清空表單
          form.reset();
          const charCount = form.querySelector('.char-count');
          if (charCount) {
            charCount.textContent = '0';
          }
          
          // 重新載入留言
          loadComments(postId);
          
          // 更新留言數量
          const commentBtn = document.querySelector(`[data-post-id="${postId}"].comment-btn`);
          if (commentBtn && data.comments_count !== undefined) {
            // 找到按鈕中的文字節點並更新
            const textNodes = Array.from(commentBtn.childNodes).filter(node => 
              node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
            );
            if (textNodes.length > 0) {
              textNodes[0].textContent = ` ${data.comments_count}`;
            } else {
              commentBtn.appendChild(document.createTextNode(` ${data.comments_count}`));
            }
          }
          
          showNotification('留言發布成功！', 'success');
          
          // 如果有等級提升通知
          if (data.level_up) {
            setTimeout(() => {
              showNotification(data.level_up.message, 'success');
            }, 1000);
          }
        } else {
          showNotification(data.message || '留言發布失敗', 'error');
        }
      })
      .catch(error => {
        console.error('[ERROR] 留言發布失敗:', error);
        showNotification('網路錯誤，請稍後再試', 'error');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
    }
  });

  /* --- 字數統計 --- */
  document.addEventListener('input', function(e) {
    if (e.target.matches('.comment-form textarea[name="content"]')) {
      const textarea = e.target;
      const charCount = textarea.closest('.comment-form').querySelector('.char-count');
      if (charCount) {
        charCount.textContent = textarea.value.length;
      }
    }
  });

  /* --- 關閉留言區 --- */
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('close-comments')) {
      const postId = e.target.getAttribute('data-post-id');
      const commentsSection = document.getElementById(`comments-${postId}`);
      if (commentsSection) {
        commentsSection.style.display = 'none';
      }
    }
  });

  /* --- 更多下拉功能 --- */
  const moreToggle = document.querySelector('.more-toggle');
  const moreMenu = document.querySelector('.more-menu');
  
  if (moreToggle && moreMenu) {
    moreToggle.addEventListener('click', function(event) {
      event.stopPropagation();
      const isVisible = moreMenu.style.display === 'flex';
      moreMenu.style.display = isVisible ? 'none' : 'flex';
    });
    
    // 點擊其他地方關閉選單
    document.addEventListener('click', function() {
      if (moreMenu) {
        moreMenu.style.display = 'none';
      }
    });
    
    // 防止點擊選單內容時關閉選單
    moreMenu.addEventListener('click', function(event) {
      event.stopPropagation();
    });
  }
  
  /* --- 深色模式切換 --- */
  const darkToggle = document.getElementById('toggle-dark');
  if (darkToggle) {
    darkToggle.addEventListener('click', function() {
      // 切換深色模式
      const body = document.body;
      const isDarkMode = body.classList.contains('dark-mode');
      
      if (isDarkMode) {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
        darkToggle.innerHTML = '🌗 深色模式';
        showNotification('已切換到淺色模式', 'info');
      } else {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
        darkToggle.innerHTML = '☀️ 淺色模式';
        showNotification('已切換到深色模式', 'info');
      }
    });
  }

  // 頁面載入時檢查並應用深色模式設定
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
    if (darkToggle) {
      darkToggle.innerHTML = '☀️ 淺色模式';
    }
  }

});

/* --- 追蹤列表和粉絲列表功能 --- */

// 顯示追蹤列表
window.showFollowingList = function() {
  console.log('[DEBUG] 開始載入追蹤列表');
  
  fetch('/social/get_following')
    .then(response => {
      console.log('[DEBUG] 追蹤列表請求響應:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('[DEBUG] 追蹤列表數據:', data);
      if (data.success) {
        showFollowModal('following', '我的追蹤', data.following);
      } else {
        showFollowModal('following', '我的追蹤', []);
      }
    })
    .catch(error => {
      console.error('[ERROR] 獲取追蹤列表失敗:', error);
      showFollowModal('following', '我的追蹤', []);
    });
};

// 顯示粉絲列表
window.showFollowersList = function() {
  console.log('[DEBUG] 開始載入粉絲列表');
  
  fetch('/social/get_followers')
    .then(response => {
      console.log('[DEBUG] 粉絲列表請求響應:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('[DEBUG] 粉絲列表數據:', data);
      if (data.success) {
        showFollowModal('followers', '我的粉絲', data.followers);
      } else {
        showFollowModal('followers', '我的粉絲', []);
      }
    })
    .catch(error => {
      console.error('[ERROR] 獲取粉絲列表失敗:', error);
      showFollowModal('followers', '我的粉絲', []);
    });
};

// 創建追蹤/粉絲模態框
function showFollowModal(type, title, users) {
  console.log('[DEBUG] 顯示模態框:', type, title, users);
  
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
            <button class="btn btn-primary empty-follow-action-btn" data-type="${type}">
              <span class="btn-emoji">${type === 'following' ? '🔍' : '✏️'}</span> 
              ${type === 'following' ? '探索用戶' : '發布貼文'}
            </button>
          </div>
        ` : users.map(user => `
          <div class="follow-user-item" data-user-email="${user.user_email || user.email}">
            <div class="follow-user-info">
              <div class="follow-user-avatar">${(user.username || user.User_Name || 'U').charAt(0)}</div>
              <div class="follow-user-details">
                <h4>${user.username || user.User_Name || '匿名用戶'}</h4>
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
  } else {
    // 綁定空狀態的按鈕
    const emptyActionBtn = modal.querySelector('.empty-follow-action-btn');
    if (emptyActionBtn) {
      emptyActionBtn.addEventListener('click', function() {
        const actionType = this.dataset.type;
        if (actionType === 'following') {
          // 探索用戶功能暫時關閉模態框
          closeFollowModal();
        } else {
          // 發布貼文 - 跳轉到新增貼文頁面
          window.location.href = '/social/create_post';
        }
      });
    }
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

// 關閉模態框
window.closeFollowModal = function() {
  const modal = document.querySelector('.follow-modal-overlay');
  if (modal) {
    modal.remove();
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
  
  fetch(`/social/unfollow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_email: userEmail })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // 從列表中移除該用戶
      const userItem = btnElement.closest('.follow-user-item');
      if (userItem) {
        userItem.remove();
      }
      
      // 更新社交統計
      window.showNotification(`已取消追蹤 ${username}`, 'success');
      
      // 檢查列表是否為空，如果為空則顯示空狀態
      const modalBody = document.querySelector('.follow-modal-body');
      const remainingItems = modalBody.querySelectorAll('.follow-user-item');
      if (remainingItems.length === 0) {
        modalBody.innerHTML = `
          <div class="empty-follow-list">
            <div class="empty-icon">👥</div>
            <h4>還沒有追蹤任何人</h4>
            <p>開始追蹤其他用戶，在這裡查看他們的最新動態</p>
            <button class="btn btn-primary empty-follow-action-btn" data-type="following">
              <span class="btn-emoji">🔍</span> 探索用戶
            </button>
          </div>
        `;
        // 為新添加的按鈕綁定事件
        bindEmptyActionButton();
      }
    } else {
      btnElement.disabled = false;
      btnElement.innerHTML = '<span class="btn-emoji">✕</span> 取消追蹤';
      window.showNotification(data.message || '取消追蹤失敗', 'error');
    }
  })
  .catch(error => {
    console.error('[ERROR] 取消追蹤失敗:', error);
    btnElement.disabled = false;
    btnElement.innerHTML = '<span class="btn-emoji">✕</span> 取消追蹤';
    window.showNotification('網路錯誤，請稍後再試', 'error');
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
      // 從列表中移除該用戶
      const userItem = btnElement.closest('.follow-user-item');
      if (userItem) {
        userItem.remove();
      }
      
      window.showNotification(`已移除粉絲 ${username}`, 'success');
      
      // 檢查列表是否為空，如果為空則顯示空狀態
      const modalBody = document.querySelector('.follow-modal-body');
      const remainingItems = modalBody.querySelectorAll('.follow-user-item');
      if (remainingItems.length === 0) {
        modalBody.innerHTML = `
          <div class="empty-follow-list">
            <div class="empty-icon">🙋‍♂️</div>
            <h4>還沒有粉絲</h4>
            <p>分享更多精彩內容，吸引更多粉絲關注您</p>
            <button class="btn btn-primary empty-follow-action-btn" data-type="followers">
              <span class="btn-emoji">✏️</span> 發布貼文
            </button>
          </div>
        `;
        // 為新添加的按鈕綁定事件
        bindEmptyActionButton();
      }
    } else {
      btnElement.disabled = false;
      btnElement.innerHTML = '<span class="btn-emoji">🗑️</span> 移除粉絲';
      window.showNotification(data.message || '移除粉絲失敗', 'error');
    }
  })
  .catch(error => {
    console.error('[ERROR] 移除粉絲失敗:', error);
    btnElement.disabled = false;
    btnElement.innerHTML = '<span class="btn-emoji">🗑️</span> 移除粉絲';
    window.showNotification('移除粉絲失敗，請稍後再試', 'error');
  });
}
