/**
 * 舉報功能 JavaScript
 * 處理表單驗證、字數統計、動態互動等功能
 */

document.addEventListener('DOMContentLoaded', function() {
    initReportForm();
    initCharacterCount();
    initFormValidation();
    initTooltips();
    initNoticeSection();
    initSupportNavigation(); // 新增
});

/**
 * 初始化舉報表單
 */
function initReportForm() {
    const form = document.querySelector('.report-form');
    if (!form) return;

    // 處理多選框驗證
    const checkboxes = form.querySelectorAll('input[name="options"]');
    const checkboxGroup = form.querySelector('.checkbox-group');
    
    if (checkboxes.length > 0) {
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', validateCheckboxes);
        });
        
        // 初始驗證
        validateCheckboxes();
    }

    // 處理表單提交
    form.addEventListener('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
        }
    });
}

/**
 * 初始化字數統計
 */
function initCharacterCount() {
    const textareas = document.querySelectorAll('textarea[maxlength]');
    
    textareas.forEach(textarea => {
        const maxLength = parseInt(textarea.getAttribute('maxlength'));
        const countElement = document.getElementById('char-count');
        
        if (countElement) {
            // 初始計數
            updateCharacterCount(textarea, countElement, maxLength);
            
            // 監聽輸入事件
            textarea.addEventListener('input', function() {
                updateCharacterCount(this, countElement, maxLength);
            });
        }
    });
}

/**
 * 更新字數統計
 */
function updateCharacterCount(textarea, countElement, maxLength) {
    const currentLength = textarea.value.length;
    countElement.textContent = currentLength;
    
    // 更新樣式
    const characterCountContainer = countElement.closest('.character-count');
    if (characterCountContainer) {
        if (currentLength > maxLength * 0.9) {
            characterCountContainer.classList.add('over-limit');
        } else {
            characterCountContainer.classList.remove('over-limit');
        }
    }
}

/**
 * 驗證多選框
 */
function validateCheckboxes() {
    const checkboxes = document.querySelectorAll('input[name="options"]:checked');
    const checkboxGroup = document.querySelector('.checkbox-group');
    
    if (checkboxes.length === 0) {
        showFieldError(checkboxGroup, '請至少選擇一個問題類型');
        return false;
    } else {
        hideFieldError(checkboxGroup);
        return true;
    }
}

/**
 * 表單驗證
 */
function validateForm() {
    let isValid = true;
    
    // 驗證主題
    const themeInput = document.getElementById('theme');
    if (themeInput) {
        if (themeInput.value.trim().length < 5) {
            showFieldError(themeInput, '舉報主題至少需要 5 個字元');
            isValid = false;
        } else {
            hideFieldError(themeInput);
        }
    }
    
    // 驗證多選框
    if (!validateCheckboxes()) {
        isValid = false;
    }
    
    // 驗證詳細說明
    const contextTextarea = document.getElementById('context');
    if (contextTextarea) {
        const content = contextTextarea.value.trim();
        if (content.length < 10) {
            showFieldError(contextTextarea, '詳細說明至少需要 10 個字元');
            isValid = false;
        } else if (content.length > 2000) {
            showFieldError(contextTextarea, '詳細說明不能超過 2000 個字元');
            isValid = false;
        } else {
            hideFieldError(contextTextarea);
        }
    }
    
    return isValid;
}

/**
 * 顯示欄位錯誤
 */
function showFieldError(field, message) {
    hideFieldError(field); // 先清除現有錯誤
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.style.color = '#e74c3c';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '0.25rem';
    errorElement.textContent = message;
    
    if (field.classList && field.classList.contains('checkbox-group')) {
        field.parentNode.appendChild(errorElement);
    } else {
        field.parentNode.appendChild(errorElement);
    }
    
    // 添加錯誤樣式
    if (field.classList) {
        field.classList.add('error');
    }
}

/**
 * 隱藏欄位錯誤
 */
function hideFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // 移除錯誤樣式
    if (field.classList) {
        field.classList.remove('error');
    }
}

/**
 * 初始化表單驗證
 */
function initFormValidation() {
    const inputs = document.querySelectorAll('.form-control');
    
    inputs.forEach(input => {
        // 失去焦點時驗證
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        // 輸入時清除錯誤
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                hideFieldError(this);
            }
        });
    });
}

/**
 * 驗證單個欄位
 */
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    
    switch (fieldName) {
        case 'theme':
            if (value.length < 5) {
                showFieldError(field, '舉報主題至少需要 5 個字元');
                return false;
            }
            break;
            
        case 'context':
            if (value.length < 10) {
                showFieldError(field, '詳細說明至少需要 10 個字元');
                return false;
            }
            break;
            
        case 'post_id':
            if (value && !/^\d+$/.test(value)) {
                showFieldError(field, '貼文 ID 必須是數字');
                return false;
            }
            break;
    }
    
    hideFieldError(field);
    return true;
}

/**
 * 初始化提示工具
 */
function initTooltips() {
    // 為有 title 屬性的元素添加自定義提示
    const elementsWithTooltips = document.querySelectorAll('[title]');
    
    elementsWithTooltips.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

/**
 * 顯示提示
 */
function showTooltip(event) {
    const element = event.target;
    const title = element.getAttribute('title');
    
    if (!title) return;
    
    // 移除原生 title 避免重複顯示
    element.setAttribute('data-original-title', title);
    element.removeAttribute('title');
    
    // 創建提示元素
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = title;
    tooltip.style.position = 'absolute';
    tooltip.style.background = '#333';
    tooltip.style.color = 'white';
    tooltip.style.padding = '0.5rem';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '0.875rem';
    tooltip.style.zIndex = '1000';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.maxWidth = '200px';
    tooltip.style.wordWrap = 'break-word';
    
    document.body.appendChild(tooltip);
    
    // 定位提示
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 5) + 'px';
    
    // 儲存引用以便後續移除
    element.tooltipElement = tooltip;
}

/**
 * 隱藏提示
 */
function hideTooltip(event) {
    const element = event.target;
    
    // 恢復原始 title
    const originalTitle = element.getAttribute('data-original-title');
    if (originalTitle) {
        element.setAttribute('title', originalTitle);
        element.removeAttribute('data-original-title');
    }
    
    // 移除提示元素
    if (element.tooltipElement) {
        element.tooltipElement.remove();
        delete element.tooltipElement;
    }
}

/**
 * 顯示載入狀態
 */
function showLoading(button) {
    if (!button) return;
    
    button.disabled = true;
    button.innerHTML = '<i class="icon-loading"></i> 處理中...';
    button.classList.add('loading');
}

/**
 * 隱藏載入狀態
 */
function hideLoading(button, originalText) {
    if (!button) return;
    
    button.disabled = false;
    button.innerHTML = originalText || '提交舉報';
    button.classList.remove('loading');
}

/**
 * 顯示通知訊息
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 1.5rem';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.zIndex = '2000';
    notification.style.maxWidth = '400px';
    notification.style.wordWrap = 'break-word';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';
    
    // 設置背景顏色
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 動畫顯示
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自動隱藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

/**
 * 格式化時間
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return `${diffInMinutes} 分鐘前`;
    } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)} 小時前`;
    } else {
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

/**
 * 複製文字到剪貼板
 */
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => {
            showNotification('已複製到剪貼板', 'success');
        });
    } else {
        // 回退方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification('已複製到剪貼板', 'success');
        } catch (err) {
            showNotification('複製失敗', 'error');
        }
        
        textArea.remove();
    }
}

/**
 * 確認對話框
 */
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

/**
 * 防抖函數
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * 節流函數
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 導出函數供其他腳本使用
window.ReportUtils = {
    showLoading,
    hideLoading,
    showNotification,
    formatDateTime,
    copyToClipboard,
    confirmAction,
    debounce,
    throttle
};

/**
 * 初始化注意事項區塊
 */
function initNoticeSection() {
    const noticeSection = document.querySelector('.notice-section');
    if (!noticeSection) return;
    
    // 添加展開/收縮功能
    const title = noticeSection.querySelector('h3');
    const content = noticeSection.querySelector('ul');
    
    if (title && content) {
        // 添加展開/收縮按鈕
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'notice-toggle';
        toggleBtn.innerHTML = '▼';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-label', '展開/收縮注意事項');
        
        title.appendChild(toggleBtn);
        
        // 點擊切換
        toggleBtn.addEventListener('click', function() {
            const isExpanded = content.style.display !== 'none';
            
            if (isExpanded) {
                content.style.display = 'none';
                toggleBtn.innerHTML = '▶';
                toggleBtn.setAttribute('aria-expanded', 'false');
            } else {
                content.style.display = 'block';
                toggleBtn.innerHTML = '▼';
                toggleBtn.setAttribute('aria-expanded', 'true');
            }
        });
        
        // 初始化為展開狀態
        toggleBtn.setAttribute('aria-expanded', 'true');
    }
    
    // 添加懸停效果
    const links = noticeSection.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
}

/**
 * 初始化支援中心導航
 */
function initSupportNavigation() {
    const navLinks = document.querySelectorAll('.support-navigation .nav-link');
    
    navLinks.forEach(link => {
        // 添加點擊音效（如果需要）
        link.addEventListener('click', function() {
            // 添加點擊反饋
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
        
        // 添加鍵盤導航支援
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // 為舉報卡片添加互動效果
    const reportCards = document.querySelectorAll('.report-card');
    reportCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.01)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

/* ===== 撤銷舉報對話框 ===== */
document.addEventListener('DOMContentLoaded', ()=>{

  const modal      = document.getElementById('cancelModal');
  const openBtn    = document.getElementById('cancel-btn');
  const closeBtn   = document.getElementById('cancel-no');
  const confirmBtn = document.getElementById('cancel-yes');

  if (!modal || !openBtn) return;            // 非詳情頁就略過

  openBtn.onclick  = ()=> modal.style.display = 'flex';
  closeBtn.onclick = ()=> modal.style.display = 'none';

  confirmBtn.onclick = ()=>{
    // TODO: call API → /support/report/cancel/<id>
    alert('撤銷功能開發中…');
    modal.style.display = 'none';
  };
});
