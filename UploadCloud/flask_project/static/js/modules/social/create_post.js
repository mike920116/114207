// 新增貼文頁面的 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 獲取頁面元素
    const form = document.getElementById('create-post-form');
    const titleInput = document.getElementById('title');
    const titleCharCount = document.getElementById('title-char-count');
    const contentTextarea = document.getElementById('content');
    const charCount = document.getElementById('char-count');
    const fileInput = document.getElementById('image');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    const imagePreview = document.getElementById('image-preview');
    const submitBtn = form.querySelector('button[type="submit"]');

    // 標題字數計算
    function updateTitleCharCount() {
        const currentLength = titleInput.value.length;
        titleCharCount.textContent = currentLength;
    }

    // 內容字數計算
    function updateCharCount() {
        const currentLength = contentTextarea.value.length;
        charCount.textContent = currentLength;
    }

    // 監聽標題輸入
    titleInput.addEventListener('input', updateTitleCharCount);

    // 監聽內容輸入
    contentTextarea.addEventListener('input', updateCharCount);

    // 圖片上傳處理
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 檢查檔案大小 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('圖片檔案不能超過 5MB');
                fileInput.value = '';
                return;
            }

            // 檢查檔案類型
            if (!file.type.startsWith('image/')) {
                alert('請選擇圖片檔案');
                fileInput.value = '';
                return;
            }

            // 顯示預覽
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `
                    <img src="${e.target.result}" alt="圖片預覽">
                    <button type="button" class="remove-image" onclick="removeImage()">移除圖片</button>
                `;
                uploadPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // 拖拽上傳
    uploadPlaceholder.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadPlaceholder.style.borderColor = '#667eea';
        uploadPlaceholder.style.backgroundColor = '#f8f9ff';
    });

    uploadPlaceholder.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadPlaceholder.style.borderColor = '#ccc';
        uploadPlaceholder.style.backgroundColor = '#fafafa';
    });

    uploadPlaceholder.addEventListener('drop', function(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
        uploadPlaceholder.style.borderColor = '#ccc';
        uploadPlaceholder.style.backgroundColor = '#fafafa';
    });

    // 表單提交處理
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 禁用提交按鈕，防止重複提交
        submitBtn.disabled = true;
        submitBtn.textContent = '發布中...';

        // 獲取表單資料
        const formData = new FormData(form);

        // 發送 AJAX 請求
        fetch('/social/create_post', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 顯示成功訊息
                document.getElementById('success-message').style.display = 'block';
                
                // 檢查是否有等級升級
                if (data.level_up) {
                    // 顯示升級通知
                    showLevelUpNotification(data.level_up);
                    // 延長跳轉時間讓用戶看到升級通知
                    setTimeout(() => {
                        window.location.href = '/social/main';
                    }, 4000);
                } else {
                    // 正常跳轉
                    setTimeout(() => {
                        window.location.href = '/social/main';
                    }, 2000);
                }
            } else {
                // 顯示錯誤訊息
                const errorMsg = document.getElementById('error-message');
                errorMsg.textContent = data.message || '發布失敗，請稍後再試';
                errorMsg.style.display = 'block';
                
                // 重新啟用按鈕
                submitBtn.disabled = false;
                submitBtn.textContent = '發布貼文';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('error-message').style.display = 'block';
            
            // 重新啟用按鈕
            submitBtn.disabled = false;
            submitBtn.textContent = '發布貼文';
        });
    });

    // 表單驗證
    function validateForm() {
        const content = contentTextarea.value.trim();
        const mood = document.querySelector('input[name="mood"]:checked');
        
        return content.length > 0 && mood !== null;
    }

    // 監聽表單變化，更新提交按鈕狀態
    form.addEventListener('input', function() {
        submitBtn.disabled = !validateForm();
    });

    // 初始化
    updateCharCount();
    submitBtn.disabled = !validateForm();
});

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
        font-family: inherit;
    `;
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 4秒後自動消失
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }
    }, 4000);
}

// 移除圖片的全域函數
function removeImage() {
    document.getElementById('image').value = '';
    document.getElementById('image-preview').innerHTML = '';
    document.querySelector('.upload-placeholder').style.display = 'flex';
}

// 心情標籤選擇動畫
document.addEventListener('DOMContentLoaded', function() {
    const moodLabels = document.querySelectorAll('.mood-tag');
    
    moodLabels.forEach(label => {
        label.addEventListener('click', function() {
            // 移除其他標籤的動畫
            moodLabels.forEach(l => l.classList.remove('pulse'));
            
            // 添加點擊動畫
            this.classList.add('pulse');
            
            // 移除動畫類
            setTimeout(() => {
                this.classList.remove('pulse');
            }, 300);
        });
    });
});

// CSS 動畫類別
const style = document.createElement('style');
style.textContent = `
    .pulse {
        animation: pulse 0.3s ease-in-out;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);
