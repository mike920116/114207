document.addEventListener('DOMContentLoaded', function () {
    // === 表單欄位聚焦互動 ===
    document.querySelectorAll('input.form-control').forEach(inputElement => {
        inputElement.addEventListener('focus', () => {
            inputElement.style.borderColor = '#66bb6a';
            inputElement.style.boxShadow = '0 0 0 4px rgba(102, 187, 106, 0.2)';
        });

        inputElement.addEventListener('blur', () => {
            inputElement.style.borderColor = '#ccc';
            inputElement.style.boxShadow = 'none';
        });
    });

    // === 按鈕點擊動畫 ===
    document.querySelectorAll('button.btn, .btn').forEach(buttonElement => {
        buttonElement.addEventListener('mousedown', () => {
            buttonElement.style.transform = 'scale(0.97)';
        });

        buttonElement.addEventListener('mouseup', () => {
            buttonElement.style.transform = 'scale(1)';
        });

        buttonElement.addEventListener('mouseleave', () => {
            buttonElement.style.transform = 'scale(1)';
        });
    });

    // === 成功或錯誤訊息進場淡入 ===
    ['.success-message', '.error-message'].forEach(selector => {
        const messageBox = document.querySelector(selector);
        if (messageBox) {
            messageBox.style.opacity = 0;
            messageBox.style.transition = 'opacity 0.8s ease';
            setTimeout(() => {
                messageBox.style.opacity = 1;
            }, 100);
        }
    });
});
