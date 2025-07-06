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
});
