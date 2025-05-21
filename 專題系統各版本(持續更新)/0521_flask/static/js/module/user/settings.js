document.addEventListener('DOMContentLoaded', function () {
  // === 自我介紹字數倒數提示 ===
  const bioTextarea = document.getElementById('bio');
  const bioCounter = document.getElementById('bio-counter');

  if (bioTextarea && bioCounter) {
      const updateCounter = () => {
          const max = parseInt(bioTextarea.getAttribute('maxlength'), 10);
          const current = bioTextarea.value.length;
          bioCounter.textContent = `剩餘 ${max - current} 字`;
      };

      bioTextarea.addEventListener('input', updateCounter);
      updateCounter(); // 初始載入
  }

  // === 頭像即時預覽 ===
  window.previewAvatar = function (event) {
      const preview = document.getElementById('avatar-preview');
      const file = event.target.files[0];
      if (file && preview) {
          preview.src = URL.createObjectURL(file);
      }
  };

  // === 動畫交互：欄位聚焦 ===
  document.querySelectorAll('input.form-control, textarea.form-control').forEach(input => {
      input.addEventListener('focus', () => {
          input.style.borderColor = '#66bb6a';
          input.style.boxShadow = '0 0 0 4px rgba(102, 187, 106, 0.2)';
      });

      input.addEventListener('blur', () => {
          input.style.borderColor = '#ccc';
          input.style.boxShadow = 'none';
      });
  });

  // === 按鈕點擊動畫 ===
  document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('mousedown', () => {
          btn.style.transform = 'scale(0.97)';
      });

      btn.addEventListener('mouseup', () => {
          btn.style.transform = 'scale(1)';
      });

      btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'scale(1)';
      });
  });
});
