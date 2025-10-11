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

    // === 密碼強度即時檢查 ===
    // 支援註冊頁面的 password1/password2 和重設密碼頁面的 password/password2
    const password1Input = document.getElementById('password1') || document.getElementById('password');
    const password2Input = document.getElementById('password2');
    const emailInput = document.getElementById('email');
    
    if (password1Input) {
        password1Input.addEventListener('input', function() {
            checkPasswordStrength(this.value, emailInput ? emailInput.value : '');
        });
        
        // 當 email 改變時也重新檢查密碼（針對第4項規則）
        if (emailInput) {
            emailInput.addEventListener('input', function() {
                if (password1Input.value) {
                    checkPasswordStrength(password1Input.value, this.value);
                }
            });
        }
    }
    
    if (password2Input) {
        password2Input.addEventListener('input', function() {
            checkPasswordMatch();
        });
        
        // 當第一個密碼改變時也重新檢查匹配
        if (password1Input) {
            password1Input.addEventListener('input', function() {
                if (password2Input.value) {
                    checkPasswordMatch();
                }
            });
        }
    }

    function checkPasswordStrength(password, email) {
        // 檢查密碼長度（至少8個字元）
        const lengthCheck = document.getElementById('length-check');
        if (password.length >= 8) {
            updateRequirement(lengthCheck, true);
        } else {
            updateRequirement(lengthCheck, false);
        }
        
        // 檢查是否包含英文字母
        const letterCheck = document.getElementById('letter-check');
        if (/[a-zA-Z]/.test(password)) {
            updateRequirement(letterCheck, true);
        } else {
            updateRequirement(letterCheck, false);
        }
        
        // 檢查是否包含數字
        const numberCheck = document.getElementById('number-check');
        if (/[0-9]/.test(password)) {
            updateRequirement(numberCheck, true);
        } else {
            updateRequirement(numberCheck, false);
        }
        
        // 檢查密碼是否與帳號不同
        const accountCheck = document.getElementById('account-check');
        if (email && password) {
            const emailUsername = email.split('@')[0];
            const isValid = password.toLowerCase() !== email.toLowerCase() && 
                           !password.toLowerCase().includes(emailUsername.toLowerCase()) &&
                           !emailUsername.toLowerCase().includes(password.toLowerCase());
            
            if (isValid) {
                updateRequirement(accountCheck, true);
            } else {
                updateRequirement(accountCheck, false);
            }
        } else {
            updateRequirement(accountCheck, false);
        }
    }
    
    function checkPasswordMatch() {
        const password1 = password1Input.value;
        const password2 = password2Input.value;
        const matchIndicator = document.getElementById('password-match');
        const matchCheck = document.getElementById('match-check');
        
        if (password2) {
            matchIndicator.style.display = 'block';
            if (password1 === password2 && password1.length > 0) {
                updateRequirement(matchCheck, true);
            } else {
                updateRequirement(matchCheck, false);
            }
        } else {
            matchIndicator.style.display = 'none';
        }
    }
    
    function updateRequirement(element, isValid) {
        const iconElement = element.querySelector('.check-icon');
        if (iconElement) {
            if (isValid) {
                iconElement.classList.remove('fa-times');
                iconElement.classList.add('fa-check');
            } else {
                iconElement.classList.remove('fa-check');
                iconElement.classList.add('fa-times');
            }
        }
        
        if (isValid) {
            element.classList.add('valid');
        } else {
            element.classList.remove('valid');
        }
    }

    // === 密碼可見性切換 ===
    window.togglePasswordVisibility = function(inputId) {
        const inputElement = document.getElementById(inputId);
        const buttonElement = document.querySelector(`button[onclick="togglePasswordVisibility('${inputId}')"]`);
        const iconElement = buttonElement.querySelector('i');

        if (inputElement.type === 'password') {
            inputElement.type = 'text';
            if (iconElement) {
                iconElement.classList.remove('fa-eye-slash');
                iconElement.classList.add('fa-eye');
            }
        } else {
            inputElement.type = 'password';
            if (iconElement) {
                iconElement.classList.remove('fa-eye');
                iconElement.classList.add('fa-eye-slash');
            }
        }
    }
});
