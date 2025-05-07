document.addEventListener('DOMContentLoaded', function () {
    // === 表單欄位聚焦互動 ===
    document.querySelectorAll('input.form-control').forEach(input => {
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
    document.querySelectorAll('button.btn, .btn').forEach(btn => {
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

    // === 成功或錯誤訊息進場淡入 ===
    ['.success-message', '.error-message'].forEach(selector => {
        const msgBox = document.querySelector(selector);
        if (msgBox) {
            msgBox.style.opacity = 0;
            msgBox.style.transition = 'opacity 0.8s ease';
            setTimeout(() => {
                msgBox.style.opacity = 1;
            }, 100);
        }
    });
});
