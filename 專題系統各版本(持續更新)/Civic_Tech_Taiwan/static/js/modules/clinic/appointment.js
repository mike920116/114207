// 門診預約頁面 JavaScript

// DOM 元素
let hospitalSelect, doctorSelect, appointmentForm, successMessage, overlay;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    hospitalSelect = document.getElementById('hospital-select');
    doctorSelect = document.getElementById('doctor-select');
    appointmentForm = document.getElementById('appointment-form');
    successMessage = document.getElementById('success-message');
    overlay = document.getElementById('overlay');

    // 設定最小日期為今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').min = today;

    // 綁定事件監聽器
    bindEventListeners();
});

// 綁定事件監聽器
function bindEventListeners() {
    // 醫院選擇變更
    hospitalSelect.addEventListener('change', handleHospitalChange);
    
    // 表單提交
    appointmentForm.addEventListener('submit', handleFormSubmit);
    
    // 遮罩層點擊
    overlay.addEventListener('click', closeSuccessMessage);
    
    // ESC 鍵關閉彈窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSuccessMessage();
        }
    });

    // 動作按鈕事件
    bindActionButtons();
}

// 處理醫院選擇變更
function handleHospitalChange() {
    const selectedHospital = hospitalSelect.value;
    
    // 清空醫師選項
    doctorSelect.innerHTML = '<option value="">請選擇醫師</option>';
    
    if (selectedHospital) {
        // 啟用醫師選擇器
        doctorSelect.disabled = false;
        
        // 從後端獲取醫師列表
        fetch(`/clinic/api/doctors/${selectedHospital}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    data.doctors.forEach(doctor => {
                        const option = document.createElement('option');
                        option.value = doctor.value;
                        option.textContent = doctor.name;
                        doctorSelect.appendChild(option);
                    });
                } else {
                    showNotification(data.message || '獲取醫師列表失敗', 'error');
                }
            })
            .catch(error => {
                console.error('獲取醫師列表錯誤:', error);
                showNotification('獲取醫師列表失敗，請稍後再試', 'error');
            });
    } else {
        doctorSelect.disabled = true;
    }
}

// 處理表單提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    // 表單驗證
    if (!validateForm()) {
        return;
    }
    
    // 收集表單資料
    const formData = collectFormData();
    
    // 模擬提交（實際應該發送到後端）
    submitAppointment(formData);
}

// 表單驗證
function validateForm() {
    const requiredFields = [
        'hospital-select',
        'doctor-select', 
        'appointment-date',
        'time-slot',
        'parent-name',
        'contact-phone',
        'child-name',
        'child-age'
    ];

    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        
        // 移除舊的錯誤樣式
        field.classList.remove('error');
        
        if (!value) {
            field.classList.add('error');
            isValid = false;
            
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        }
    });

    // 電話號碼格式驗證
    const phoneField = document.getElementById('contact-phone');
    const phoneValue = phoneField.value.trim();
    const phoneRegex = /^09\d{8}$|^0\d{1,2}-?\d{6,8}$/;
    
    if (phoneValue && !phoneRegex.test(phoneValue)) {
        phoneField.classList.add('error');
        isValid = false;
        if (!firstInvalidField) {
            firstInvalidField = phoneField;
        }
        showNotification('請輸入正確的電話號碼格式', 'error');
    }

    if (!isValid) {
        if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showNotification('請填寫所有必填欄位', 'error');
    }

    return isValid;
}

// 收集表單資料
function collectFormData() {
    return {
        hospital: document.getElementById('hospital-select').value,
        doctor: document.getElementById('doctor-select').value,
        date: document.getElementById('appointment-date').value,
        time: document.getElementById('time-slot').value,
        parent_name: document.getElementById('parent-name').value,
        contact_phone: document.getElementById('contact-phone').value,
        child_name: document.getElementById('child-name').value,
        child_age: document.getElementById('child-age').value,
        symptoms: document.getElementById('symptoms').value,
        diary_permission: document.getElementById('diary-permission').checked
    };
}

// 提交預約
function submitAppointment(formData) {
    // 顯示載入狀態
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;

    // 發送到後端 API
    fetch('/clinic/api/appointment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 顯示成功訊息
            showSuccessMessage(data.appointment);
            
            // 重置表單
            appointmentForm.reset();
            doctorSelect.disabled = true;
            doctorSelect.innerHTML = '<option value="">請先選擇醫院</option>';
            
            // 顯示成功通知
            showNotification('預約提交成功！', 'success');
        } else {
            showNotification(data.message || '預約提交失敗', 'error');
        }
    })
    .catch(error => {
        console.error('提交預約錯誤:', error);
        showNotification('預約提交失敗，請稍後再試', 'error');
    })
    .finally(() => {
        // 恢復提交按鈕
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// 生成預約編號
function generateAppointmentId() {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `#APT${timestamp}`;
}

// 格式化日期時間
function formatDateTime(date, time) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    const timeEnd = getTimeSlotEnd(time);
    
    return `${year}-${month}-${day} ${time}-${timeEnd}`;
}

// 獲取時段結束時間
function getTimeSlotEnd(startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + 30;
    const endHours = hours + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    
    return `${String(endHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
}

// 顯示成功訊息
function showSuccessMessage(data) {
    document.getElementById('appointment-id').textContent = data.id;
    document.getElementById('confirm-hospital').textContent = data.hospital;
    document.getElementById('confirm-doctor').textContent = data.doctor;
    document.getElementById('confirm-datetime').textContent = data.datetime;
    
    successMessage.classList.add('show');
    overlay.classList.add('show');
    
    // 禁用頁面滾動
    document.body.style.overflow = 'hidden';
}

// 關閉成功訊息
function closeSuccessMessage() {
    successMessage.classList.remove('show');
    overlay.classList.remove('show');
    
    // 恢復頁面滾動
    document.body.style.overflow = '';
}

// 全局函數供 HTML 調用
window.closeSuccessMessage = closeSuccessMessage;

// 顯示通知訊息
function showNotification(message, type = 'info') {
    // 移除已存在的通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加樣式
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // 設定背景顏色
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28A745';
            break;
        case 'error':
            notification.style.backgroundColor = '#DC3545';
            break;
        default:
            notification.style.backgroundColor = '#17A2B8';
    }
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 動畫顯示
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自動移除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 綁定動作按鈕事件
function bindActionButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-btn')) {
            handleViewAppointment(e.target);
        } else if (e.target.classList.contains('cancel-btn')) {
            handleCancelAppointment(e.target);
        } else if (e.target.classList.contains('review-btn')) {
            handleReviewAppointment(e.target);
        }
    });
}

// 處理查看預約詳情
function handleViewAppointment(button) {
    const row = button.closest('tr');
    const appointmentId = row.cells[0].textContent;
    showNotification(`查看預約 ${appointmentId} 的詳細資訊`, 'info');
    // 這裡可以實現查看詳情的邏輯
}

// 處理取消預約
function handleCancelAppointment(button) {
    const row = button.closest('tr');
    const appointmentId = row.cells[0].textContent;
    
    if (confirm(`確定要取消預約 ${appointmentId} 嗎？`)) {
        // 發送取消請求到後端
        fetch(`/clinic/api/appointment/${appointmentId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 更新表格顯示
                const statusCell = row.querySelector('.status');
                statusCell.textContent = '已取消';
                statusCell.className = 'status cancelled';
                
                // 隱藏取消按鈕
                button.style.display = 'none';
                
                showNotification(data.message || `預約 ${appointmentId} 已成功取消`, 'success');
            } else {
                showNotification(data.message || '取消預約失敗', 'error');
            }
        })
        .catch(error => {
            console.error('取消預約錯誤:', error);
            showNotification('取消預約失敗，請稍後再試', 'error');
        });
    }
}

// 處理寫評價
function handleReviewAppointment(button) {
    const row = button.closest('tr');
    const appointmentId = row.cells[0].textContent;
    showNotification(`開啟預約 ${appointmentId} 的評價頁面`, 'info');
    // 這裡可以實現評價功能
}

// CSS 錯誤樣式
const style = document.createElement('style');
style.textContent = `
    .form-control.error {
        border-color: #DC3545 !important;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
    }
    
    .status.cancelled {
        background: #F8D7DA !important;
        color: #842029 !important;
    }
    
    body.dark-mode .status.cancelled {
        background: #4B2A2A !important;
        color: #D68A8A !important;
    }
`;
document.head.appendChild(style);
