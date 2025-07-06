document.addEventListener('DOMContentLoaded', function () {
  // === 自我介紹字數倒數提示 ===
  const bioTextarea = document.getElementById('bio');
  const bioCounter = document.getElementById('bio-counter');

  if (bioTextarea && bioCounter) {
      const updateCounter = () => {
          const maxLength = parseInt(bioTextarea.getAttribute('maxlength'), 10);
          const currentLength = bioTextarea.value.length;
          bioCounter.textContent = `剩餘 ${maxLength - currentLength} 字`;
      };

      bioTextarea.addEventListener('input', updateCounter);
      updateCounter(); // 初始載入
  }

  // === 頭像即時預覽 ===
  window.previewAvatar = function (event) {
      const avatarPreview = document.getElementById('avatar-preview');
      const selectedFile = event.target.files[0];
      if (selectedFile && avatarPreview) {
          avatarPreview.src = URL.createObjectURL(selectedFile);
      }
  };

  // === 動畫交互：欄位聚焦 ===
  document.querySelectorAll('input.form-control, textarea.form-control').forEach(formInput => {
      formInput.addEventListener('focus', () => {
          formInput.style.borderColor = '#66bb6a';
          formInput.style.boxShadow = '0 0 0 4px rgba(102, 187, 106, 0.2)';
      });

      formInput.addEventListener('blur', () => {
          formInput.style.borderColor = '#ccc';
          formInput.style.boxShadow = 'none';
      });
  });

  // === 按鈕點擊動畫 ===
  document.querySelectorAll('.btn').forEach(button => {
      button.addEventListener('mousedown', () => {
          button.style.transform = 'scale(0.97)';
      });

      button.addEventListener('mouseup', () => {
          button.style.transform = 'scale(1)';
      });

      button.addEventListener('mouseleave', () => {
          button.style.transform = 'scale(1)';
      });
  });

  // === 頭像彈出視窗功能 ===
  let selectedAvatar = null;

  // 開啟頭像選擇彈出視窗
  window.openAvatarModal = function() {
    const modal = document.getElementById('avatar-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 防止背景滾動
  };

  // 關閉頭像選擇彈出視窗
  window.closeAvatarModal = function() {
    const modal = document.getElementById('avatar-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // 恢復背景滾動
  };

  // 預覽選中的頭像
  window.previewSelectedAvatar = function(radioElement) {
    selectedAvatar = radioElement.value;
    
    // 移除其他選項的選中狀態視覺效果
    document.querySelectorAll('.avatar-modal .avatar-img').forEach(img => {
      img.style.transform = 'scale(1)';
    });
    
    // 高亮選中的頭像
    const selectedImg = radioElement.nextElementSibling;
    selectedImg.style.transform = 'scale(1.1)';
  };

  // 確認頭像選擇
  window.confirmAvatarSelection = function() {
    if (selectedAvatar) {
      // 更新當前頭像顯示
      const currentAvatarImg = document.getElementById('current-avatar');
      const newAvatarPath = `/static/icons/avatars/${selectedAvatar}`;
      currentAvatarImg.src = newAvatarPath;
      
      // 創建隱藏的 input 來存儲選中的頭像值
      let hiddenInput = document.getElementById('selected-avatar-input');
      if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'avatar';
        hiddenInput.id = 'selected-avatar-input';
        document.querySelector('form').appendChild(hiddenInput);
      }
      hiddenInput.value = selectedAvatar;
      
      // 關閉彈出視窗
      closeAvatarModal();
      
      // 顯示確認訊息
      showMessage('頭像已更新，請點擊「儲存變更」按鈕來保存設定', 'success');
    } else {
      showMessage('請先選擇一個頭像', 'warning');
    }
  };

  // 點擊彈出視窗外部區域關閉視窗
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('avatar-modal');
    if (event.target === modal) {
      closeAvatarModal();
    }
  });

  // ESC 鍵關閉彈出視窗
  window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeAvatarModal();
    }
  });

  // 顯示訊息提示
  function showMessage(message, type = 'info') {
    // 移除舊的訊息提示
    const oldMessage = document.querySelector('.message-toast');
    if (oldMessage) {
      oldMessage.remove();
    }

    // 創建新的訊息提示
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-toast message-${type}`;
    messageDiv.textContent = message;
    
    // 添加到頁面
    document.body.appendChild(messageDiv);
    
    // 3秒後自動消失
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 3000);
  }
});
