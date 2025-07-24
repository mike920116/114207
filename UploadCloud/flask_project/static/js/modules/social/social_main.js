document.addEventListener('DOMContentLoaded', () => {

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

  /* --- 按讚與檢舉 (示範) --- */
  document.querySelectorAll('.like-btn').forEach(likeButton => {
    likeButton.addEventListener('click', () => {
      const currentText = likeButton.textContent;
      const currentLikes = parseInt(currentText.replace(/\D/g,'')) + 1;
      const emojiOrText = currentText.includes('👍') ? '👍' : '[讚]';
      likeButton.innerHTML = `<span class="btn-emoji">${emojiOrText}</span> ${currentLikes}`;
    });
  });

  document.querySelectorAll('.report-btn').forEach(reportButton => {
    reportButton.addEventListener('click', () => alert('已送出檢舉 (demo)'));
  });

  /* --- 心情分類和我的貢獻篩選 --- */
  const filterTags = document.querySelectorAll('.tag');
  const postCards = document.querySelectorAll('.post-card');
  
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
      statItems[0].textContent = stats.posts_count;     // 發文
      statItems[1].textContent = stats.likes_received;  // 獲讚
      statItems[2].textContent = stats.comments_made;   // 評論
      statItems[3].textContent = stats.login_days;      // 天數
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
    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-my-posts').textContent = counts['my-posts'];
    document.getElementById('count-happy').textContent = counts.happy;
    document.getElementById('count-sad').textContent = counts.sad;
    document.getElementById('count-angry').textContent = counts.angry;
    document.getElementById('count-surprised').textContent = counts.surprised;
    document.getElementById('count-relaxed').textContent = counts.relaxed;
  }
  updateTagCounts(); // 2025-07-07 by 朱羿安: 頁面載入時自動統計
  // 若有動態增減貼文，請在相應處再呼叫 updateTagCounts(); // 2025-07-07 by 朱羿安
