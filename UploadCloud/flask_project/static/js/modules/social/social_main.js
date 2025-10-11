// 定義全局的確認對話框函數
window.showCustomConfirmDialog = function(title, message, confirmCallback) {
  // 創建對話框元素
  const dialogOverlay = document.createElement('div');
  dialogOverlay.className = 'custom-confirm-overlay';
  
  // 對話框HTML
  dialogOverlay.innerHTML = `
    <div class="custom-confirm-dialog">
      <div class="custom-confirm-header">
        <h3>${title}</h3>
        <button class="custom-confirm-close">&times;</button>
      </div>
      <div class="custom-confirm-body">
        <div class="custom-confirm-icon">
          <i class="warning-icon">⚠️</i>
        </div>
        <div class="custom-confirm-message">${message}</div>
      </div>
      <div class="custom-confirm-footer">
        <button class="btn btn-secondary btn-cancel">取消</button>
        <button class="btn btn-danger btn-confirm">確認刪除</button>
      </div>
    </div>
  `;
  
  // 添加樣式
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .custom-confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }
    
    .custom-confirm-dialog {
      width: 90%;
      max-width: 400px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      overflow: hidden;
      animation: scaleIn 0.3s ease-out;
    }
    
    .custom-confirm-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .custom-confirm-header h3 {
      margin: 0;
      font-size: 18px;
      color: #343a40;
    }
    
    .custom-confirm-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #adb5bd;
      padding: 0 5px;
      transition: color 0.2s;
    }
    
    .custom-confirm-close:hover {
      color: #495057;
    }
    
    .custom-confirm-body {
      padding: 24px 20px;
      display: flex;
      align-items: center;
    }
    
    .custom-confirm-icon {
      margin-right: 15px;
      font-size: 36px;
    }
    
    .warning-icon {
      color: #e74c3c;
    }
    
    .custom-confirm-message {
      flex: 1;
      font-size: 16px;
      line-height: 1.5;
      color: #495057;
    }
    
    .custom-confirm-footer {
      padding: 16px 20px;
      background-color: #f8f9fa;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-secondary {
      background-color: #e9ecef;
      color: #212529;
    }
    
    .btn-secondary:hover {
      background-color: #dee2e6;
    }
    
    .btn-danger {
      background-color: #e74c3c;
      color: white;
    }
    
    .btn-danger:hover {
      background-color: #c0392b;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    /* 深色模式 */
    body.dark-mode .custom-confirm-dialog {
      background-color: #343a40;
    }
    
    body.dark-mode .custom-confirm-header,
    body.dark-mode .custom-confirm-footer {
      background-color: #2d3238;
      border-color: #495057;
    }
    
    body.dark-mode .custom-confirm-header h3 {
      color: #f8f9fa;
    }
    
    body.dark-mode .custom-confirm-message {
      color: #e9ecef;
    }
    
    body.dark-mode .btn-secondary {
      background-color: #495057;
      color: #e9ecef;
    }
    
    body.dark-mode .btn-secondary:hover {
      background-color: #6c757d;
    }
  `;
  
  document.head.appendChild(styleEl);
  document.body.appendChild(dialogOverlay);
  
  // 綁定事件
  const closeBtn = dialogOverlay.querySelector('.custom-confirm-close');
  const cancelBtn = dialogOverlay.querySelector('.btn-cancel');
  const confirmBtn = dialogOverlay.querySelector('.btn-confirm');
  
  // 關閉對話框的函數
  function closeDialog() {
    dialogOverlay.classList.add('closing');
    dialogOverlay.style.animation = 'fadeOut 0.2s forwards';
    setTimeout(() => {
      dialogOverlay.remove();
      styleEl.remove();
    }, 200);
  }
  
  // 綁定關閉按鈕
  closeBtn.addEventListener('click', closeDialog);
  
  // 綁定取消按鈕
  cancelBtn.addEventListener('click', closeDialog);
  
  // 綁定確認按鈕
  confirmBtn.addEventListener('click', () => {
    closeDialog();
    if (typeof confirmCallback === 'function') {
      confirmCallback();
    }
  });
  
  // 點擊背景關閉
  dialogOverlay.addEventListener('click', (e) => {
    if (e.target === dialogOverlay) {
      closeDialog();
    }
  });
  
  // 添加淡出動畫樣式
  const fadeOutStyle = document.createElement('style');
  fadeOutStyle.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(fadeOutStyle);
  
  // 清理淡出樣式
  setTimeout(() => fadeOutStyle.remove(), 300);
};

// 定義留言編輯對話框函數
window.showCommentEditDialog = function(comment, confirmCallback) {
  // 創建對話框元素
  const dialogOverlay = document.createElement('div');
  dialogOverlay.className = 'comment-edit-overlay';
  
  // 對話框HTML
  dialogOverlay.innerHTML = `
    <div class="comment-edit-dialog">
      <div class="comment-edit-header">
        <h3>編輯留言</h3>
        <button class="comment-edit-close">&times;</button>
      </div>
      <div class="comment-edit-body">
        <textarea class="comment-edit-textarea" maxlength="500" placeholder="請輸入您的留言...">${comment.content}</textarea>
        <div class="char-counter"><span class="current-count">${comment.content.length}</span>/<span class="max-count">500</span></div>
      </div>
      <div class="comment-edit-footer">
        <button class="btn btn-secondary btn-cancel">取消</button>
        <button class="btn btn-primary btn-save">儲存變更</button>
      </div>
    </div>
  `;
  
  // 添加樣式
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .comment-edit-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }
    
    .comment-edit-dialog {
      width: 90%;
      max-width: 500px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      overflow: hidden;
      animation: scaleIn 0.3s ease-out;
    }
    
    .comment-edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .comment-edit-header h3 {
      margin: 0;
      font-size: 18px;
      color: #343a40;
    }
    
    .comment-edit-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #adb5bd;
      padding: 0 5px;
      transition: color 0.2s;
    }
    
    .comment-edit-close:hover {
      color: #495057;
    }
    
    .comment-edit-body {
      padding: 20px;
    }
    
    .comment-edit-textarea {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      border: 1px solid #ced4da;
      border-radius: 8px;
      font-size: 16px;
      line-height: 1.5;
      resize: vertical;
      font-family: inherit;
    }
    
    .char-counter {
      margin-top: 8px;
      text-align: right;
      font-size: 14px;
      color: #6c757d;
    }
    
    .comment-edit-footer {
      padding: 16px 20px;
      background-color: #f8f9fa;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .btn-primary {
      background-color: #4caf50;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .btn-primary:hover {
      background-color: #3d8b40;
    }

    .btn-secondary {
      background-color: #e9ecef;
      color: #212529;
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .btn-secondary:hover {
      background-color: #dee2e6;
    }
    
    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .validation-notification {
      position: absolute;
      bottom: -30px;
      left: 20px;
      background-color: #e74c3c;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      animation: fadeIn 0.2s forwards;
    }
    
    /* 深色模式 */
    body.dark-mode .comment-edit-dialog {
      background-color: #343a40;
    }
    
    body.dark-mode .comment-edit-header,
    body.dark-mode .comment-edit-footer {
      background-color: #2d3238;
      border-color: #495057;
    }
    
    body.dark-mode .comment-edit-header h3 {
      color: #f8f9fa;
    }
    
    body.dark-mode .comment-edit-textarea {
      background-color: #454d55;
      border-color: #6c757d;
      color: #f8f9fa;
    }
    
    body.dark-mode .char-counter {
      color: #adb5bd;
    }

    body.dark-mode .btn-secondary {
      background-color: #495057;
      color: #e9ecef;
    }
    
    body.dark-mode .btn-secondary:hover {
      background-color: #6c757d;
    }
  `;
  
  document.head.appendChild(styleEl);
  document.body.appendChild(dialogOverlay);
  
  // 綁定事件
  const closeBtn = dialogOverlay.querySelector('.comment-edit-close');
  const cancelBtn = dialogOverlay.querySelector('.btn-cancel');
  const saveBtn = dialogOverlay.querySelector('.btn-save');
  const textarea = dialogOverlay.querySelector('.comment-edit-textarea');
  const charCounter = dialogOverlay.querySelector('.current-count');
  
  // 字數計數器
  textarea.addEventListener('input', function() {
    charCounter.textContent = this.value.length;
    // 如果接近字數上限，改變計數器顏色提醒用戶
    if (this.value.length > 450) {
      charCounter.style.color = '#e74c3c';
    } else {
      charCounter.style.color = '';
    }
  });
  
  // 自動聚焦文本框，並將游標放在文字末尾
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, 100);
  
  // 關閉對話框函數
  function closeDialog() {
    dialogOverlay.classList.add('closing');
    dialogOverlay.style.animation = 'fadeOut 0.2s forwards';
    setTimeout(() => {
      dialogOverlay.remove();
      styleEl.remove();
    }, 200);
  }
  
  // 綁定關閉按鈕
  closeBtn.addEventListener('click', closeDialog);
  
  // 綁定取消按鈕
  cancelBtn.addEventListener('click', closeDialog);
  
  // 綁定儲存按鈕
  saveBtn.addEventListener('click', () => {
    const newContent = textarea.value.trim();
    if (newContent === '') {
      // 提示用戶不能保存空白留言
      const notification = document.createElement('div');
      notification.className = 'validation-notification';
      notification.textContent = '留言內容不能為空';
      
      const commentEditBody = dialogOverlay.querySelector('.comment-edit-body');
      commentEditBody.appendChild(notification);
      
      setTimeout(() => notification.remove(), 2000);
      return;
    }
    
    closeDialog();
    if (typeof confirmCallback === 'function') {
      confirmCallback(newContent);
    }
  });
  
  // 點擊背景關閉
  dialogOverlay.addEventListener('click', (e) => {
    if (e.target === dialogOverlay) {
      closeDialog();
    }
  });
  
  // 添加淡出動畫樣式
  const fadeOutStyle = document.createElement('style');
  fadeOutStyle.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(fadeOutStyle);
  
  // 清理淡出樣式
  setTimeout(() => fadeOutStyle.remove(), 300);
};

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

    // 獲取喜歡的貼文數量
    fetch('/social/api/get_liked_posts?limit=1')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const likedPostsCount = document.getElementById('liked-posts-count');
          if (likedPostsCount) {
            likedPostsCount.textContent = data.total_count || 0;
            console.log('[DEBUG] 喜歡的貼文數量載入成功:', data.total_count);
          }
        } else {
          console.warn('[WARN] 獲取喜歡的貼文數量 API 回應失敗:', data.message);
        }
      })
      .catch(error => {
        console.error('[ERROR] 獲取喜歡的貼文數量失敗:', error);
        // 如果 API 載入失敗，保持後端渲染的初始值
        const likedPostsCount = document.getElementById('liked-posts-count');
        if (likedPostsCount && likedPostsCount.textContent === '-') {
          likedPostsCount.textContent = '0';
        }
      });
  }

  /* --- 導航到喜歡的貼文頁面 --- */
  window.navigateToLikedPosts = function() {
    try {
      console.log('[DEBUG] 導航到喜歡的貼文頁面');
      window.location.href = '/social/liked_posts';
    } catch (error) {
      console.error('[ERROR] 導航到喜歡的貼文頁面失敗:', error);
      // 備用導航方式
      window.open('/social/liked_posts', '_self');
    }
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
    console.log('[DEBUG] 執行handleFollowAction，參數:', {userEmail, action});
    
    // 找到所有該用戶的追蹤按鈕
    const buttons = document.querySelectorAll(`[data-user-email="${userEmail}"].follow-btn`);
    console.log('[DEBUG] 找到的按鈕數量:', buttons.length);
    
    if (buttons.length === 0) {
      console.error('[ERROR] 找不到匹配的追蹤按鈕');
      return;
    }

    // 禁用所有按鈕防止重複點擊
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-emoji">⏳</span> 處理中...';
      console.log('[DEBUG] 已禁用按鈕:', btn);
    });

    const url = action === 'follow' ? '/social/follow' : '/social/unfollow';
    console.log('[DEBUG] API 請求路徑:', url);
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_email: userEmail })
    })
    .then(response => response.json())
    .then(data => {
      console.log('[DEBUG] API 响應:', data);
      
      if (data.success) {
        console.log('[DEBUG] 操作成功，更新按鈕狀態');
        
        // 更新所有該用戶的追蹤按鈕
        buttons.forEach(btn => {
          console.log('[DEBUG] 更新按鈕:', btn);
          
          if (action === 'follow') {
            btn.innerHTML = '<span class="btn-emoji">✓</span> 已追蹤';
            btn.setAttribute('data-action', 'unfollow');
            btn.classList.add('following');
            const title = btn.getAttribute('title');
            if (title) {
              btn.setAttribute('title', title.replace('追蹤', '取消追蹤'));
            }
          } else {
            btn.innerHTML = '<span class="btn-emoji">➕</span> 追蹤';
            btn.setAttribute('data-action', 'follow');
            btn.classList.remove('following');
            const title = btn.getAttribute('title');
            if (title) {
              btn.setAttribute('title', title.replace('取消追蹤', '追蹤'));
            }
          }
        });
        
        // 更新社交統計 - 追蹤/取消追蹤只影響自己的追蹤數
        console.log('[DEBUG] 更新社交統計數據:', {following_count: data.following_count});
        updateSocialStats({
          following_count: data.following_count
        });
        
        const actionText = action === 'follow' ? '追蹤' : '取消追蹤';
        showNotification(`${actionText}成功！`, 'success');
        
        // 重新綁定事件處理（避免事件丟失）
        console.log('[DEBUG] 按鈕已更新並重新啟用');
      } else {
        // 恢復按鈕原狀
        console.log('[DEBUG] 操作失敗，恢復按鈕原狀');
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
      console.error('[ERROR] 追蹤操作失敗:', error);
      // 恢復按鈕原狀
      console.log('[DEBUG] 網路錯誤，恢復按鈕原狀');
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
      console.log('[DEBUG] 最終步驟：重新啟用按鈕');
      buttons.forEach(btn => {
        btn.disabled = false;
      });
    });
  }

  /* --- 社交統計更新 --- */
  function updateSocialStats(stats) {
    const followersCount = document.querySelector('[data-stat="followers"] .social-stat-number');
    const followingCount = document.querySelector('[data-stat="following"] .social-stat-number');
    const likedPostsCount = document.querySelector('[data-stat="liked-posts"] .social-stat-number');
    
    // 只更新提供的統計數據
    if (followersCount && stats.followers_count !== undefined) {
      followersCount.textContent = stats.followers_count;
    }
    
    if (followingCount && stats.following_count !== undefined) {
      followingCount.textContent = stats.following_count;
    }
    
    // 新增：更新喜歡的貼文數量
    if (likedPostsCount && stats.liked_posts_count !== undefined) {
      likedPostsCount.textContent = stats.liked_posts_count;
      console.log('[DEBUG] 社交統計中的喜歡的貼文數量已更新:', stats.liked_posts_count);
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
  // 只使用全域事件委派處理所有追蹤按鈕點擊
  // 全域事件委派 (針對動態新增的元素，包括追蹤、編輯和刪除按鈕)
  document.addEventListener('click', (e) => {
    // 處理追蹤按鈕點擊
    const followBtn = e.target.closest('.follow-btn');
    if (followBtn) {
      console.log('[DEBUG] 點擊追蹤按鈕', followBtn);
      e.preventDefault();
      e.stopPropagation();
      const userEmail = followBtn.getAttribute('data-user-email');
      const action = followBtn.getAttribute('data-action') || 'follow';
      
      console.log('[DEBUG] 追蹤參數:', {userEmail, action});
      
      if (userEmail) {
        handleFollowAction(userEmail, action);
      }
      return; // 防止後續代碼執行
    }
    
    // 處理編輯貼文按鈕點擊
    const editPostBtn = e.target.closest('.edit-post-btn');
    if (editPostBtn) {
      e.preventDefault();
      const postId = editPostBtn.getAttribute('data-post-id');
      if (postId) {
        handleEditPost(postId);
      }
      return;
    }
    
    // 處理刪除貼文按鈕點擊
    const deletePostBtn = e.target.closest('.delete-post-btn');
    if (deletePostBtn) {
      e.preventDefault();
      const postId = deletePostBtn.getAttribute('data-post-id');
      if (postId) {
        handleDeletePost(postId);
      }
      return;
    }
  });

  // 使追蹤/粉絲功能在全域可用
  window.handleFollowAction = handleFollowAction;
  window.showNotification = showNotification;
  
  /* --- 編輯貼文功能 --- */
  function handleEditPost(postId) {
    console.log(`[DEBUG] 編輯貼文，ID: ${postId}`);
    
    // 獲取貼文數據
    fetch(`/social/edit_post/${postId}`)
      .then(response => {
        console.log(`[DEBUG] 獲取貼文資料響應: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data.success) {
          console.log(`[DEBUG] 取得貼文資料: ${JSON.stringify(data.post)}`);
          
          // 建立編輯表單
          const formHTML = `
            <div class="edit-post-form-container">
              <form id="edit-post-form">
                <h2>編輯貼文</h2>
                <div class="form-group">
                  <label for="edit-post-title">標題 (選填)</label>
                  <input type="text" id="edit-post-title" name="title" value="${data.post.title || ''}" maxlength="100">
                </div>
                <div class="form-group">
                  <label for="edit-post-content">內容 *</label>
                  <textarea id="edit-post-content" name="content" required maxlength="1000">${data.post.content || ''}</textarea>
                </div>
                <div class="form-group">
                  <label>心情</label>
                  <div class="mood-options">
                    <label class="mood-option ${data.post.mood === 'happy' ? 'selected' : ''}">
                      <input type="radio" name="mood" value="happy" ${data.post.mood === 'happy' ? 'checked' : ''}>
                      <span class="mood-emoji">😄</span> 開心
                    </label>
                    <label class="mood-option ${data.post.mood === 'sad' ? 'selected' : ''}">
                      <input type="radio" name="mood" value="sad" ${data.post.mood === 'sad' ? 'checked' : ''}>
                      <span class="mood-emoji">😢</span> 難過
                    </label>
                    <label class="mood-option ${data.post.mood === 'angry' ? 'selected' : ''}">
                      <input type="radio" name="mood" value="angry" ${data.post.mood === 'angry' ? 'checked' : ''}>
                      <span class="mood-emoji">😡</span> 生氣
                    </label>
                    <label class="mood-option ${data.post.mood === 'surprised' ? 'selected' : ''}">
                      <input type="radio" name="mood" value="surprised" ${data.post.mood === 'surprised' ? 'checked' : ''}>
                      <span class="mood-emoji">😱</span> 驚訝
                    </label>
                    <label class="mood-option ${data.post.mood === 'relaxed' ? 'selected' : ''}">
                      <input type="radio" name="mood" value="relaxed" ${data.post.mood === 'relaxed' ? 'checked' : ''}>
                      <span class="mood-emoji">😌</span> 放鬆
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label class="checkbox-container">
                    <input type="checkbox" name="anonymous" value="1" ${data.post.is_anonymous ? 'checked' : ''}>
                    <span>匿名發布</span>
                  </label>
                </div>
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary cancel-edit-btn">取消</button>
                  <button type="submit" class="btn btn-primary submit-edit-btn">更新貼文</button>
                </div>
              </form>
            </div>
          `;
          
          // 創建模態視窗
          const modalOverlay = document.createElement('div');
          modalOverlay.className = 'modal-overlay';
          modalOverlay.innerHTML = formHTML;
          document.body.appendChild(modalOverlay);
          
          // 添加樣式
          const style = document.createElement('style');
          style.textContent = `
            .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.5);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1000;
            }
            
            .edit-post-form-container {
              width: 100%;
              max-width: 600px;
              background-color: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              max-height: 90vh;
              overflow-y: auto;
            }
            
            .form-group {
              margin-bottom: 20px;
            }
            
            .form-group label {
              display: block;
              margin-bottom: 8px;
              font-weight: 500;
            }
            
            .form-group input[type="text"],
            .form-group textarea {
              width: 100%;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-family: inherit;
              font-size: 16px;
            }
            
            .form-group textarea {
              min-height: 150px;
              resize: vertical;
            }
            
            .mood-options {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            
            .mood-option {
              display: flex;
              align-items: center;
              padding: 8px 12px;
              border: 1px solid #ddd;
              border-radius: 20px;
              cursor: pointer;
              transition: all 0.2s;
            }
            
            .mood-option input[type="radio"] {
              display: none;
            }
            
            .mood-option.selected {
              background-color: #e0f7fa;
              border-color: #26c6da;
            }
            
            .mood-option:hover {
              background-color: #f0f0f0;
            }
            
            .mood-emoji {
              margin-right: 6px;
              font-size: 1.2em;
            }
            
            .checkbox-container {
              display: flex;
              align-items: center;
              gap: 8px;
              cursor: pointer;
            }
            
            .form-actions {
              display: flex;
              justify-content: flex-end;
              gap: 12px;
              margin-top: 20px;
            }
            
            .btn {
              padding: 10px 20px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.2s;
            }
            
            .btn-primary {
              background-color: #4caf50;
              color: white;
            }
            
            .btn-primary:hover {
              background-color: #3d8b40;
            }
            
            .btn-secondary {
              background-color: #f5f5f5;
              color: #333;
            }
            
            .btn-secondary:hover {
              background-color: #e0e0e0;
            }
            
            /* 深色模式支援 */
            body.dark-mode .edit-post-form-container {
              background-color: #333;
              color: #eee;
            }
            
            body.dark-mode .form-group input[type="text"],
            body.dark-mode .form-group textarea {
              background-color: #444;
              border-color: #555;
              color: #eee;
            }
            
            body.dark-mode .mood-option {
              border-color: #555;
              color: #eee;
            }
            
            body.dark-mode .mood-option:hover {
              background-color: #444;
            }
            
            body.dark-mode .mood-option.selected {
              background-color: #01579b;
              border-color: #0277bd;
            }
            
            body.dark-mode .btn-secondary {
              background-color: #555;
              color: #eee;
            }
            
            body.dark-mode .btn-secondary:hover {
              background-color: #666;
            }
          `;
          document.head.appendChild(style);
          
          // 綁定表單事件
          const form = document.getElementById('edit-post-form');
          const cancelBtn = document.querySelector('.cancel-edit-btn');
          const moodOptions = document.querySelectorAll('.mood-option');
          
          // 選擇心情
          moodOptions.forEach(option => {
            option.addEventListener('click', function() {
              // 移除所有選中樣式
              moodOptions.forEach(o => o.classList.remove('selected'));
              // 為當前點擊的選項添加選中樣式
              this.classList.add('selected');
              // 選中對應的單選框
              const radio = this.querySelector('input[type="radio"]');
              radio.checked = true;
            });
          });
          
          // 取消按鈕
          cancelBtn.addEventListener('click', function() {
            modalOverlay.remove();
            style.remove();
          });
          
          // 點擊遮罩取消
          modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
              modalOverlay.remove();
              style.remove();
            }
          });
          
          // 提交表單
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const submitBtn = document.querySelector('.submit-edit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = '更新中...';
            
            fetch(`/social/edit_post/${postId}`, {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                // 關閉模態框
                modalOverlay.remove();
                style.remove();
                
                // 顯示成功通知
                showNotification(data.message || '貼文已成功更新！', 'success');
                
                // 頁面重新加載以顯示更新後的貼文
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              } else {
                showNotification(data.message || '更新失敗', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = '更新貼文';
              }
            })
            .catch(error => {
              console.error('[ERROR] 更新貼文失敗:', error);
              showNotification('網路錯誤，請稍後再試', 'error');
              submitBtn.disabled = false;
              submitBtn.textContent = '更新貼文';
            });
          });
          
        } else {
          showNotification(data.message || '無法編輯貼文', 'error');
        }
      })
      .catch(error => {
        console.error('[ERROR] 獲取貼文資料失敗:', error);
        showNotification('網路錯誤，請稍後再試', 'error');
      });
  }
  
  /* --- 自訂確認對話框 --- */
  // 注意：showCustomConfirmDialog 已經移到全局範圍，這裡不再需要重複定義  /* --- 刪除貼文功能 --- */
  function handleDeletePost(postId) {
    console.log(`[DEBUG] 刪除貼文，ID: ${postId}`);
    
    // 使用自訂確認對話框
    showCustomConfirmDialog(
      '刪除貼文', 
      '確定要刪除這篇貼文嗎？<br><strong>此操作無法撤銷，貼文將永久刪除。</strong>', 
      () => {
        fetch(`/social/delete_post/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        console.log(`[DEBUG] 刪除貼文響應: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data.success) {
          console.log(`[DEBUG] 貼文刪除成功`);
          
          // 顯示成功通知
          showNotification(data.message || '貼文已成功刪除！', 'success');
          
          // 移除貼文卡片
          const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
          if (postCard) {
            postCard.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => {
              postCard.remove();
              
              // 如果已經沒有貼文，顯示空狀態
              const postList = document.querySelector('.post-list');
              if (postList && postList.children.length === 0) {
                postList.innerHTML = `
                  <div class="no-posts">
                    <div class="no-posts-icon">📝</div>
                    <p>目前還沒有任何貼文，成為第一個分享心情的人吧！</p>
                    <a href="/social/create_post" class="btn btn-primary">
                      <span class="btn-emoji">➕</span> 立即發文
                    </a>
                  </div>
                `;
              }
            }, 500);
            
            // 添加淡出動畫樣式
            const style = document.createElement('style');
            style.textContent = `
              @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
              }
            `;
            document.head.appendChild(style);
          }
        } else {
          console.error(`[ERROR] 刪除貼文失敗: ${data.message}`);
          showNotification(data.message || '刪除失敗', 'error');
        }
      })
      .catch(error => {
        console.error('[ERROR] 刪除貼文請求失敗:', error);
        showNotification('網路錯誤，請稍後再試', 'error');
      });
    });
  }

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
            const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            const postAuthorUsername = postCard ? postCard.querySelector('header strong a').textContent.trim() : '';
            
            data.comments.forEach(comment => {
              const commentHTML = createCommentHTML(comment, postAuthorUsername);
              commentsList.insertAdjacentHTML('beforeend', commentHTML);
            });
            updateAllTimeDisplays();
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
  function createCommentHTML(comment, postAuthorUsername) {
    const replyInfo = comment.reply_to_username ? 
      `<div class="reply-info">
        <span class="reply-prefix">回覆</span>
        <span class="reply-target">${comment.reply_to_username}</span>：
      </div>` : '';
    
    const formattedTime = formatRelativeTime(comment.created_at);
    
    const isAuthor = comment.username === postAuthorUsername;
    const authorBadge = isAuthor ? '<span class="author-badge">作者</span>' : '';
    
    const isCurrentUser = comment.user_email === currentUserEmail;
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
          <div class="comment-author-section">
            <strong class="comment-author">
              ${comment.username}
              ${authorBadge}
            </strong>
          </div>
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

/* --- 時間格式化函數 --- */
  function formatRelativeTime(dateString) {
    try {
      let date = new Date(dateString.replace(' ', 'T'));
      if (isNaN(date.getTime())) {
        date = new Date(dateString);
      }
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const now = new Date();
      const diffSeconds = Math.floor((now - date) / 1000);
      if (diffSeconds < 60) return '剛剛';
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) return `${diffMinutes}分鐘前`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}小時前`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}天前`;
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  }

  /* --- 更新所有時間顯示 --- */
  function updateAllTimeDisplays() {
    document.querySelectorAll('.comment-time, .post-card header > span').forEach(timeElement => {
      const originalTime = timeElement.dataset.originalTime || timeElement.textContent;
      timeElement.dataset.originalTime = originalTime;
      timeElement.textContent = formatRelativeTime(originalTime);
      timeElement.title = `發布於: ${originalTime}`;
    });
  }
  setInterval(updateAllTimeDisplays, 60000);

  /* --- 心情篩選（左側標籤） --- */
  function updateFilterCounts() {
    try {
      const counts = { all: 0, 'my-posts': 0, happy: 0, sad: 0, angry: 0, surprised: 0, relaxed: 0 };
      const posts = document.querySelectorAll('.post-card');
      posts.forEach(post => {
        const mood = (post.dataset.mood || 'neutral');
        counts.all++;
        if (counts.hasOwnProperty(mood)) counts[mood]++;

        // 嘗試取得作者 email（由 header a 的 href 最後一段推斷）
        const authorLink = post.querySelector('header strong a');
        let authorEmail = '';
        if (authorLink) {
          const href = authorLink.getAttribute('href') || '';
          const parts = href.split('/').filter(Boolean);
          authorEmail = parts.length ? decodeURIComponent(parts[parts.length - 1]) : '';
        }
        if (currentUserEmail && authorEmail && currentUserEmail === authorEmail) {
          counts['my-posts']++;
        }
      });

      ['all', 'my-posts', 'happy', 'sad', 'angry', 'surprised', 'relaxed'].forEach(f => {
        const el = document.getElementById(`count-${f}`);
        if (el) el.textContent = counts[f] || 0;
      });
    } catch (err) {
      console.error('[ERROR] 更新篩選統計失敗:', err);
    }
  }

  function filterPosts(filter) {
    try {
      const posts = document.querySelectorAll('.post-card');
      posts.forEach(post => {
        let show = true;

        if (filter === 'all' || filter === 'following-all') {
          show = true;
        } else if (filter === 'my-posts') {
          const authorLink = post.querySelector('header strong a');
          let authorEmail = '';
          if (authorLink) {
            const href = authorLink.getAttribute('href') || '';
            const parts = href.split('/').filter(Boolean);
            authorEmail = parts.length ? decodeURIComponent(parts[parts.length - 1]) : '';
          }
          show = (currentUserEmail && authorEmail && currentUserEmail === authorEmail);
        } else if (filter === 'following-recent') {
          // server 端應已將 "following" tab 的貼文限制為追蹤清單，這裡視為顯示全部
          show = true;
        } else {
          // 心情對照
          const mood = post.dataset.mood || 'neutral';
          show = (mood === filter);
        }

        post.style.display = show ? '' : 'none';
      });
    } catch (err) {
      console.error('[ERROR] 篩選貼文失敗:', err);
    }
  }

  function initializeFilters() {
    try {
      // 綁定所有標籤（依 sub-tabs 分群）
      document.querySelectorAll('.sub-tabs').forEach(container => {
        container.querySelectorAll('.tag[data-filter]').forEach(tag => {
          tag.addEventListener('click', function() {
            // 只在這個 container 裡切換 active
            container.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            filterPosts(filter);
          });
        });
      });

      // 初始化計數與預設篩選（預設為第一個 active）
      updateFilterCounts();

      // 如果有已標示 active 的標籤，套用它
      const activeTag = document.querySelector('.sub-tabs .tag.active');
      if (activeTag) filterPosts(activeTag.dataset.filter);
    } catch (err) {
      console.error('[ERROR] 初始化篩選失敗:', err);
    }
  }

  // 初始化篩選功能
  initializeFilters();

  /* --- 統一事件委派處理留言區操作 --- */
  document.querySelector('.post-list').addEventListener('click', function(e) {
    // --- 處理留言回覆 ---
    const replyBtn = e.target.closest('.reply-comment-btn');
    if (replyBtn) {
        e.preventDefault();
        const postCard = replyBtn.closest('.post-card');
        if (!postCard) return;

        const postId = postCard.dataset.postId;
        const commentId = replyBtn.dataset.commentId;
        const username = replyBtn.dataset.username;
        const form = document.querySelector(`.comment-form[data-post-id="${postId}"]`);
        
        if (form) {
            form.querySelector('input[name="reply_to_id"]').value = commentId;
            form.querySelector('input[name="reply_to_username"]').value = username;
            const replyTarget = form.querySelector('.reply-target');
            if(replyTarget) replyTarget.textContent = username;
            const replyIndicator = form.querySelector('.reply-indicator');
            if(replyIndicator) replyIndicator.style.display = 'flex';
            form.querySelector('textarea').focus();
        }
        return;
    }

    // --- 處理留言編輯 ---
    const editBtn = e.target.closest('.edit-comment-btn');
    if (editBtn) {
        e.preventDefault();
        const commentId = editBtn.dataset.commentId;
        fetch(`/social/edit_comment/${commentId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // 使用自訂編輯對話框來編輯留言
              window.showCommentEditDialog(data.comment, function(newContent) {
                if (newContent && newContent !== data.comment.content) {
                  const formData = new FormData();
                  formData.append('content', newContent);
                  fetch(`/social/edit_comment/${commentId}`, {
                    method: 'POST',
                    body: formData
                  })
                  .then(res => res.json())
                  .then(updateData => {
                    if (updateData.success) {
                      const commentContent = document.querySelector(`.comment-item[data-comment-id="${commentId}"] .comment-content`);
                      if(commentContent) commentContent.textContent = updateData.content;
                      showNotification('留言更新成功！', 'success');
                    } else {
                      showNotification(updateData.message || '更新失敗', 'error');
                    }
                  });
                }
              });
            } else {
              showNotification(data.message || '無法編輯留言', 'error');
            }
          });
        return;
    }

    // --- 處理留言刪除 ---
    const deleteBtn = e.target.closest('.delete-comment-btn');
    if (deleteBtn) {
        e.preventDefault();
        const commentId = deleteBtn.dataset.commentId;
        console.log(`[DEBUG] 點擊留言刪除按鈕，留言ID: ${commentId}`);
        
        // 使用全局範圍的自訂確認對話框
        window.showCustomConfirmDialog(
          '刪除留言', 
          '確定要刪除這則留言嗎？<br><strong>此操作無法撤銷，留言將永久刪除。</strong>', 
          function() {
            // 顯示刪除中狀態
            const commentItem = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
            if (commentItem) {
              commentItem.classList.add('deleting');
              commentItem.style.opacity = '0.5';
            }
            
            fetch(`/social/delete_comment/${commentId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                // 使用淡出動畫效果
                if (commentItem) {
                  commentItem.style.animation = 'fadeOut 0.3s forwards';
                  setTimeout(() => {
                    commentItem.remove();
                    
                    // 檢查是否還有其他留言，如果沒有則顯示空狀態
                    const postId = data.post_id;
                    const commentsList = document.getElementById(`comments-list-${postId}`);
                    if (commentsList && commentsList.children.length === 0) {
                      commentsList.innerHTML = '<div class="no-comments"><p>目前還沒有留言，成為第一個留言的人吧！</p></div>';
                    }
                  }, 300);
                }
                
                // 更新留言數
                const commentBtn = document.querySelector(`.comment-btn[data-post-id="${data.post_id}"]`);
                if (commentBtn) {
                  const textNodes = Array.from(commentBtn.childNodes).filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
                  if (textNodes.length > 0) {
                    textNodes[0].textContent = ` ${data.comments_count}`;
                  }
                }
                
                showNotification('留言已成功刪除', 'success');
              } else {
                // 還原留言項目的樣式
                if (commentItem) {
                  commentItem.classList.remove('deleting');
                  commentItem.style.opacity = '';
                }
                showNotification(data.message || '刪除失敗，請稍後再試', 'error');
              }
            })
            .catch(error => {
              console.error('[ERROR] 刪除留言失敗:', error);
              
              // 還原留言項目的樣式
              if (commentItem) {
                commentItem.classList.remove('deleting');
                commentItem.style.opacity = '';
              }
              
              showNotification('網路錯誤，請稍後再試', 'error');
            });
          }
        );
        return;
    }
  });

