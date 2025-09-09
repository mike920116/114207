// 預約紀錄頁面 JavaScript

// DOM 元素
let appointmentCards, statusFilter, dateFilter, hospitalFilter, modal, modalOverlay;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    appointmentCards = document.querySelectorAll('.appointment-card');
    statusFilter = document.getElementById('status-filter');
    dateFilter = document.getElementById('date-filter');
    hospitalFilter = document.getElementById('hospital-filter');
    modal = document.getElementById('appointment-detail-modal');
    modalOverlay = document.getElementById('modal-overlay');

    // 綁定事件監聽器
    bindEventListeners();
    
    // 初始化統計
    updateStats();
});

// 綁定事件監聽器
function bindEventListeners() {
    // 篩選器事件
    statusFilter.addEventListener('change', applyFilters);
    dateFilter.addEventListener('change', applyFilters);
    hospitalFilter.addEventListener('change', applyFilters);
    
    // 遮罩層點擊
    modalOverlay.addEventListener('click', closeModal);
    
    // ESC 鍵關閉彈窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// 應用篩選器
function applyFilters() {
    const statusValue = statusFilter.value;
    const dateValue = dateFilter.value;
    const hospitalValue = hospitalFilter.value;
    
    let visibleCount = 0;
    
    appointmentCards.forEach(card => {
        const cardStatus = card.dataset.status;
        const cardHospital = card.dataset.hospital;
        const cardDate = card.dataset.date;
        
        let showCard = true;
        
        // 狀態篩選
        if (statusValue && cardStatus !== statusValue) {
            showCard = false;
        }
        
        // 醫院篩選
        if (hospitalValue && cardHospital !== hospitalValue) {
            showCard = false;
        }
        
        // 日期篩選
        if (dateValue && !checkDateFilter(cardDate, dateValue)) {
            showCard = false;
        }
        
        // 顯示/隱藏卡片
        if (showCard) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.3s ease-out';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // 更新分頁資訊
    updatePagination(visibleCount);
    
    // 顯示篩選結果提示
    showFilterNotification(visibleCount);
}

// 檢查日期篩選
function checkDateFilter(cardDate, filterValue) {
    const appointmentDate = new Date(cardDate);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    switch (filterValue) {
        case 'this-month':
            return appointmentDate.getMonth() === currentMonth && 
                   appointmentDate.getFullYear() === currentYear;
        case 'last-month':
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return appointmentDate.getMonth() === lastMonth && 
                   appointmentDate.getFullYear() === lastMonthYear;
        case 'this-year':
            return appointmentDate.getFullYear() === currentYear;
        default:
            return true;
    }
}

// 重置篩選器
function resetFilters() {
    statusFilter.value = '';
    dateFilter.value = '';
    hospitalFilter.value = '';
    
    appointmentCards.forEach(card => {
        card.style.display = 'block';
        card.style.animation = 'fadeInUp 0.3s ease-out';
    });
    
    updatePagination(appointmentCards.length);
    showNotification('篩選器已重置', 'info');
}

// 更新統計數據
function updateStats() {
    const stats = {
        total: 0,
        confirmed: 0,
        pending: 0,
        completed: 0,
        cancelled: 0
    };
    
    appointmentCards.forEach(card => {
        const status = card.dataset.status;
        stats.total++;
        if (stats[status] !== undefined) {
            stats[status]++;
        }
    });
    
    // 更新統計卡片
    document.querySelector('.stat-total .stat-number').textContent = stats.total;
    document.querySelector('.stat-confirmed .stat-number').textContent = stats.confirmed;
    document.querySelector('.stat-pending .stat-number').textContent = stats.pending;
    document.querySelector('.stat-completed .stat-number').textContent = stats.completed;
}

// 更新分頁資訊
function updatePagination(visibleCount) {
    const pageInfo = document.querySelector('.page-info');
    if (visibleCount === 0) {
        pageInfo.textContent = '沒有符合條件的預約紀錄';
    } else {
        pageInfo.textContent = `顯示 ${visibleCount} 筆預約紀錄`;
    }
}

// 查看預約詳情
function viewAppointment(appointmentId) {
    // 模擬獲取預約詳情
    const appointmentData = getAppointmentData(appointmentId);
    
    if (appointmentData) {
        showAppointmentDetail(appointmentData);
    } else {
        showNotification('無法獲取預約詳情', 'error');
    }
}

// 獲取預約資料（模擬）
function getAppointmentData(appointmentId) {
    const mockData = {
        '#APT001': {
            id: '#APT001',
            hospital: '衛生福利部桃園醫院',
            doctor: '王志明醫師 - 兒童發展評估中心',
            datetime: '2025-07-30 09:00-09:30',
            status: '已確認',
            parentName: '張家長',
            childName: '張小明',
            childAge: '8歲',
            phone: '0912345678',
            symptoms: '注意力不集中，學習困難，需要兒童發展聯合評估',
            diaryPermission: '是',
            createdAt: '2025-07-25 14:30',
            notes: '請準時到達，攜帶健保卡和相關病歷資料。地址：桃園市桃園區中山路1492號',
            hospitalAddress: '桃園市桃園區中山路1492號',
            hospitalPhone: '03-3699721 轉 1203'
        },
        '#APT002': {
            id: '#APT002',
            hospital: '敏盛醫院三民院區',
            doctor: '李美華醫師 - 聯合評估科',
            datetime: '2025-08-05 14:30-15:00',
            status: '待確認',
            parentName: '李家長',
            childName: '李小美',
            childAge: '6歲',
            phone: '0987654321',
            symptoms: '社交困難，情緒起伏大，需要心理輔導和聽覺評估',
            diaryPermission: '是',
            createdAt: '2025-07-26 09:15',
            notes: '醫院將在24小時內電話確認預約時間。地址：桃園市桃園區三民路三段106號',
            hospitalAddress: '桃園市桃園區三民路三段106號',
            hospitalPhone: '03-3379340 轉 230'
        },
        '#APT003': {
            id: '#APT003',
            hospital: '立倫診所',
            doctor: '張志強醫師 - 職能治療科',
            datetime: '2025-07-20 10:00-10:30',
            status: '已完成',
            parentName: '陳家長',
            childName: '陳小華',
            childAge: '10歲',
            phone: '0965432187',
            symptoms: '精細動作發展遲緩，需要職能治療評估',
            diaryPermission: '否',
            createdAt: '2025-07-15 16:45',
            notes: '診療已完成，報告將於一週內提供。地址：桃園市中壢區中央西路二段208號',
            completedAt: '2025-07-20 10:30',
            hospitalAddress: '桃園市中壢區中央西路二段208號',
            hospitalPhone: '03-4953287'
        },
        '#APT004': {
            id: '#APT004',
            hospital: '林口長庚紀念醫院',
            doctor: '王小明醫師 - 兒童發展評估中心',
            datetime: '2025-07-28 15:00-15:30（已取消）',
            status: '已取消',
            parentName: '王家長',
            childName: '王小寶',
            childAge: '7歲',
            phone: '0911223344',
            symptoms: '語言發展遲緩，需要語言治療和藝術治療評估',
            diaryPermission: '是',
            createdAt: '2025-07-24 11:20',
            cancelledAt: '2025-07-26 10:30',
            cancelReason: '家庭臨時有事，需要重新安排時間',
            hospitalAddress: '桃園市龜山區復興街5號',
            hospitalPhone: '03-3281200 轉 8147'
        },
        '#APT005': {
            id: '#APT005',
            hospital: '兒童發展復健站（大溪區）',
            doctor: '林惠美醫師 - 語言治療科',
            datetime: '2025-08-02 16:00-16:30',
            status: '待確認',
            parentName: '黃家長',
            childName: '黃小安',
            childAge: '5歲',
            phone: '0923456789',
            symptoms: '構音障礙，口語表達能力不佳，需要語言治療',
            diaryPermission: '是',
            createdAt: '2025-07-26 10:45',
            notes: '請先洽詢單位服務人員確認時間。地址：桃園市大溪區仁愛路1號',
            hospitalAddress: '桃園市大溪區仁愛路1號',
            hospitalPhone: '03-3882401 轉 229'
        }
    };
    
    return mockData[appointmentId];
}

// 顯示預約詳情彈窗
function showAppointmentDetail(data) {
    const content = document.getElementById('appointment-detail-content');
    
    content.innerHTML = `
        <div class="detail-section">
            <h4>基本資訊</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">預約編號：</span>
                    <span class="detail-value">${data.id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">預約狀態：</span>
                    <span class="detail-value status-${data.status.toLowerCase()}">${data.status}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">醫院名稱：</span>
                    <span class="detail-value">${data.hospital}</span>
                </div>
                ${data.hospitalAddress ? `
                <div class="detail-item">
                    <span class="detail-label">醫院地址：</span>
                    <span class="detail-value">${data.hospitalAddress}</span>
                </div>
                ` : ''}
                ${data.hospitalPhone ? `
                <div class="detail-item">
                    <span class="detail-label">醫院電話：</span>
                    <span class="detail-value">${data.hospitalPhone}</span>
                </div>
                ` : ''}
                <div class="detail-item">
                    <span class="detail-label">醫師：</span>
                    <span class="detail-value">${data.doctor}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">預約時間：</span>
                    <span class="detail-value">${data.datetime}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>患者資訊</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">家長姓名：</span>
                    <span class="detail-value">${data.parentName}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">孩子姓名：</span>
                    <span class="detail-value">${data.childName}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">孩子年齡：</span>
                    <span class="detail-value">${data.childAge}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">聯絡電話：</span>
                    <span class="detail-value">${data.phone}</span>
                </div>
                <div class="detail-item diary-permission">
                    <span class="detail-label">日記授權：</span>
                    <span class="detail-value permission-${data.diaryPermission === '是' ? 'yes' : 'no'}">
                        ${data.diaryPermission === '是' ? '✓ 已授權醫師查看孩子的觀察日記' : '✗ 未授權醫師查看孩子的觀察日記'}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>症狀描述</h4>
            <div class="symptoms-content">${data.symptoms}</div>
        </div>
        
        ${data.notes ? `
        <div class="detail-section">
            <h4>備註</h4>
            <div class="notes-content">${data.notes}</div>
        </div>
        ` : ''}
        
        ${data.cancelReason ? `
        <div class="detail-section">
            <h4>取消原因</h4>
            <div class="cancel-reason">${data.cancelReason}</div>
        </div>
        ` : ''}
        
        <div class="detail-section">
            <h4>時間記錄</h4>
            <div class="time-records">
                <div class="time-item">
                    <span class="time-label">建立時間：</span>
                    <span class="time-value">${data.createdAt}</span>
                </div>
                ${data.completedAt ? `
                <div class="time-item">
                    <span class="time-label">完成時間：</span>
                    <span class="time-value">${data.completedAt}</span>
                </div>
                ` : ''}
                ${data.cancelledAt ? `
                <div class="time-item">
                    <span class="time-label">取消時間：</span>
                    <span class="time-value">${data.cancelledAt}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // 添加詳情樣式
    addDetailStyles();
    
    // 顯示彈窗
    modal.classList.add('show');
    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 添加詳情樣式
function addDetailStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .detail-section {
            margin-bottom: 25px;
        }
        .detail-section h4 {
            color: #3A8B55;
            margin-bottom: 15px;
            font-size: 16px;
            border-bottom: 2px solid #E8F4EA;
            padding-bottom: 8px;
        }
        body.dark-mode .detail-section h4 {
            color: #8AB6D6;
            border-bottom-color: #4A7B9D;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
        }
        .detail-item {
            display: flex;
            align-items: center;
        }
        .detail-item.diary-permission {
            background: #F8FCF9;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #E8F4EA;
        }
        body.dark-mode .detail-item.diary-permission {
            background: #1A3C4A;
            border-color: #4A7B9D;
        }
        .detail-label {
            min-width: 100px;
            font-weight: 600;
            color: #5B7F47;
        }
        body.dark-mode .detail-label {
            color: #C8D8E8;
        }
        .detail-value {
            color: #333;
            flex: 1;
        }
        body.dark-mode .detail-value {
            color: #E6F0FA;
        }
        .detail-value.permission-yes {
            color: #28A745;
            font-weight: 600;
        }
        .detail-value.permission-no {
            color: #DC3545;
            font-weight: 600;
        }
        body.dark-mode .detail-value.permission-yes {
            color: #48C964;
        }
        body.dark-mode .detail-value.permission-no {
            color: #FF6B7A;
        }
        .symptoms-content, .notes-content, .cancel-reason {
            background: #F8FCF9;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #3A8B55;
            line-height: 1.6;
        }
        body.dark-mode .symptoms-content, 
        body.dark-mode .notes-content, 
        body.dark-mode .cancel-reason {
            background: #1A3C4A;
            border-left-color: #8AB6D6;
            color: #E6F0FA;
        }
        .time-records {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .time-item {
            display: flex;
            align-items: center;
        }
        .time-label {
            min-width: 100px;
            font-weight: 600;
            color: #5B7F47;
        }
        body.dark-mode .time-label {
            color: #C8D8E8;
        }
        .time-value {
            color: #666;
        }
        body.dark-mode .time-value {
            color: #A8B8C8;
        }
    `;
    
    if (!document.getElementById('detail-styles')) {
        style.id = 'detail-styles';
        document.head.appendChild(style);
    }
}

// 關閉彈窗
function closeModal() {
    modal.classList.remove('show');
    modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

// 取消預約
function cancelAppointment(appointmentId) {
    if (confirm(`確定要取消預約 ${appointmentId} 嗎？`)) {
        showNotification('預約取消功能尚未開放', 'info');
        // 這裡可以實現實際的取消邏輯
    }
}

// 修改預約
function modifyAppointment(appointmentId) {
    showNotification('預約修改功能尚未開放', 'info');
    // 這裡可以實現預約修改邏輯
}

// 寫評價
function reviewAppointment(appointmentId) {
    showNotification('評價功能尚未開放', 'info');
    // 這裡可以實現評價功能
}

// 下載報告
function downloadReport(appointmentId) {
    showNotification('報告下載功能尚未開放', 'info');
    // 這裡可以實現報告下載功能
}

// 重新預約
function rebookAppointment(appointmentId) {
    if (confirm('確定要重新預約嗎？將跳轉到預約頁面。')) {
        window.location.href = '/clinic/appointment';
    }
}

// 匯出資料
function exportData() {
    showNotification('資料匯出功能尚未開放', 'info');
    // 這裡可以實現資料匯出功能
}

// 顯示篩選結果通知
function showFilterNotification(count) {
    const message = count === 0 ? '沒有符合條件的預約紀錄' : `找到 ${count} 筆符合條件的預約紀錄`;
    const type = count === 0 ? 'warning' : 'info';
    showNotification(message, type);
}

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
        case 'warning':
            notification.style.backgroundColor = '#FFC107';
            notification.style.color = '#333';
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

// 全域函數供 HTML 調用
window.resetFilters = resetFilters;
window.viewAppointment = viewAppointment;
window.cancelAppointment = cancelAppointment;
window.modifyAppointment = modifyAppointment;
window.reviewAppointment = reviewAppointment;
window.downloadReport = downloadReport;
window.rebookAppointment = rebookAppointment;
window.exportData = exportData;
window.closeModal = closeModal;
