/**
 * 任務卡片詳情模態框
 * V0.1 - 僅查看功能
 * 
 * 功能：
 * - 顯示任務卡片的完整資訊
 * - 展示標題、內容、進度狀態
 * - 支援ESC鍵關閉
 * - 點擊遮罩層關閉
 */

class TaskDetailModal {
    constructor() {
        this.modal = null;
        this.currentCard = null;
        this.createModal();
        this.setupEventListeners();
        console.log('[TaskDetailModal] 已初始化');
    }

    /**
     * 創建模態框DOM結構
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'task-detail-modal';
        this.modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <!-- Header 區域 -->
                <div class="task-detail-header">
                    <div class="header-icon">
                        <i class="fas fa-leaf" id="detailStampIcon"></i>
                    </div>
                    <h3 id="detailTitle">任務標題</h3>
                    <button class="close-btn" title="關閉">&times;</button>
                </div>

                <!-- Meta 元數據區域 -->
                <div class="task-detail-meta">
                    <span class="meta-status" id="detailStatus">
                        <i class="fas fa-circle"></i> 進行中
                    </span>
                    <span class="meta-date">
                        <i class="fas fa-calendar-plus"></i>
                        <span id="detailCreated">2024-10-01</span>
                    </span>
                    <span class="meta-date" id="detailEndContainer">
                        <i class="fas fa-calendar-check"></i>
                        <span id="detailEnd">2024-10-31</span>
                    </span>
                </div>

                <!-- Body 內容區域 -->
                <div class="task-detail-body">
                    <h5><i class="fas fa-align-left"></i> 卡片內容</h5>
                    <div class="content-text" id="detailContent">
                        <!-- 卡片描述內容 -->
                    </div>
                </div>

                <!-- Progress 進度區域 -->
                <div class="task-detail-progress">
                    <!-- 執行進度 -->
                    <div class="progress-item">
                        <div class="progress-label">
                            <span class="progress-label-text">
                                <i class="fas fa-tasks"></i> 執行進度
                            </span>
                            <span class="progress-stats" id="dailyStats">0/0 次</span>
                        </div>
                        <div class="mini-progress-bar">
                            <div class="progress-fill" id="dailyProgressBar" style="width: 0%"></div>
                        </div>
                        <div class="progress-info">
                            <span class="progress-percentage" id="dailyPercentage">0%</span>
                        </div>
                    </div>

                    <!-- 時間進度 -->
                    <div class="progress-item">
                        <div class="progress-label">
                            <span class="progress-label-text">
                                <i class="fas fa-clock"></i> 時間進度
                            </span>
                            <span class="progress-stats" id="timeStats">0/0 天</span>
                        </div>
                        <div class="mini-timeline-bar">
                            <div class="timeline-fill" id="timeProgressBar" style="width: 0%"></div>
                        </div>
                        <div class="progress-info">
                            <span class="progress-percentage" id="timePercentage">0%</span>
                            <span class="remaining-days" id="remainingDays"></span>
                        </div>
                    </div>

                    <!-- 參與人數 -->
                    <div class="progress-item">
                        <div class="progress-label">
                            <span class="progress-label-text">
                                <i class="fas fa-users"></i> 參與人數
                            </span>
                            <span class="progress-stats" id="participantStats">0/0 人</span>
                        </div>
                        <div class="participants-container">
                            <div class="mini-avatars" id="participantAvatars">
                                <!-- 參與者頭像 -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        const closeBtn = this.modal.querySelector('.close-btn');
        const overlay = this.modal.querySelector('.modal-overlay');

        // 關閉按鈕
        closeBtn.addEventListener('click', () => this.hide());

        // 點擊遮罩層關閉（但遮罩層是透明的且 pointer-events: none）
        // 所以實際上點擊背景會穿透到下方
        
        // ESC 鍵關閉
        this.handleEscKey = (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.handleEscKey);

        console.log('[TaskDetailModal] 事件監聽器已設置');
    }

    /**
     * 顯示詳情視窗
     * @param {number} cardId - 卡片ID
     */
    show(cardId) {
        console.log('[TaskDetailModal] 顯示卡片詳情:', cardId);

        // 從DOM中獲取卡片元素
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (!cardElement) {
            console.error('[TaskDetailModal] 找不到卡片元素:', cardId);
            return;
        }

        // 獲取卡片數據
        const cardDataStr = cardElement.dataset.cardData;
        if (!cardDataStr) {
            console.error('[TaskDetailModal] 卡片數據不存在');
            return;
        }

        try {
            this.currentCard = JSON.parse(cardDataStr);
            this.renderCard();
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // 防止背景滾動
            console.log('[TaskDetailModal] 詳情視窗已打開');
        } catch (error) {
            console.error('[TaskDetailModal] 解析卡片數據失敗:', error);
        }
    }

    /**
     * 隱藏詳情視窗
     */
    hide() {
        console.log('[TaskDetailModal] 關閉詳情視窗');
        this.modal.style.display = 'none';
        document.body.style.overflow = ''; // 恢復滾動
        this.currentCard = null;
    }

    /**
     * 渲染卡片數據到視窗
     */
    renderCard() {
        if (!this.currentCard) {
            console.warn('[TaskDetailModal] 沒有卡片數據可渲染');
            return;
        }

        const card = this.currentCard;
        console.log('[TaskDetailModal] 渲染卡片數據:', card);

        // 使用安全的 HTML 轉義函數
        const escapeHtml = window.escapeHtml || this.defaultEscapeHtml;

        // === Header 區域 ===
        // 郵戳圖標
        const stampIcon = this.modal.querySelector('#detailStampIcon');
        stampIcon.className = card.stamp_icon || 'fas fa-leaf';

        // 標題
        const titleEl = this.modal.querySelector('#detailTitle');
        titleEl.textContent = card.title || '未命名任務';

        // === Meta 區域 ===
        // 狀態
        const statusMap = {
            'ongoing': { icon: 'fas fa-play-circle', text: '進行中', className: 'status-ongoing' },
            'paused': { icon: 'fas fa-pause-circle', text: '已暫停', className: 'status-paused' },
            'done': { icon: 'fas fa-check-circle', text: '已完成', className: 'status-done' }
        };
        const status = statusMap[card.status] || statusMap['ongoing'];
        const statusEl = this.modal.querySelector('#detailStatus');
        statusEl.innerHTML = `<i class="${status.icon}"></i> ${status.text}`;
        statusEl.className = `meta-status ${status.className}`;

        // 創建日期
        const createdEl = this.modal.querySelector('#detailCreated');
        const createdDate = card.created_at ? card.created_at.split(' ')[0] : '';
        createdEl.textContent = createdDate;

        // 結束日期
        const endContainer = this.modal.querySelector('#detailEndContainer');
        const endEl = this.modal.querySelector('#detailEnd');
        if (card.end_date) {
            endEl.textContent = card.end_date;
            endContainer.style.display = '';
        } else {
            endContainer.style.display = 'none';
        }

        // === Body 內容區域 ===
        const contentEl = this.modal.querySelector('#detailContent');
        const content = card.content || '（無內容描述）';
        contentEl.textContent = content; // 使用 textContent 自動轉義

        // === Progress 進度區域 ===
        
        // 1. 執行進度
        const dailyCompleted = card.daily_completed_count || 0;
        const dailyTotal = card.daily_executions || 0;
        const dailyPercentage = dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100 * 10) / 10 : 0;

        this.modal.querySelector('#dailyStats').textContent = `${dailyCompleted}/${dailyTotal} 次`;
        this.modal.querySelector('#dailyProgressBar').style.width = `${dailyPercentage}%`;
        this.modal.querySelector('#dailyPercentage').textContent = `${dailyPercentage}%`;

        // 2. 時間進度
        let timeProgress = {
            elapsed_days: 0,
            total_days: 0,
            remaining_days: 0,
            percentage: 0
        };

        // 如果有 progress.timeline 數據，使用它
        if (card.progress && card.progress.timeline) {
            timeProgress = card.progress.timeline;
        } else if (card.end_date) {
            // 否則自己計算
            const today = new Date();
            const endDate = new Date(card.end_date);
            const createdDate = new Date(card.created_at);
            
            const totalDays = Math.ceil((endDate - createdDate) / (1000 * 60 * 60 * 24)) + 1;
            const elapsedDays = Math.min(
                Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24)) + 1,
                totalDays
            );
            const remainingDays = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
            
            timeProgress = {
                elapsed_days: elapsedDays,
                total_days: totalDays,
                remaining_days: remainingDays,
                percentage: totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100 * 10) / 10 : 0
            };
        }

        this.modal.querySelector('#timeStats').textContent = 
            `${timeProgress.elapsed_days}/${timeProgress.total_days} 天`;
        this.modal.querySelector('#timeProgressBar').style.width = `${timeProgress.percentage}%`;
        this.modal.querySelector('#timePercentage').textContent = `${timeProgress.percentage}%`;
        this.modal.querySelector('#remainingDays').textContent = 
            `剩餘 ${timeProgress.remaining_days} 天`;

        // 3. 參與人數
        const participantsCurrent = card.participants_count || 0;
        const participantsMax = card.max_participants || 0;

        this.modal.querySelector('#participantStats').textContent = 
            `${participantsCurrent}/${participantsMax} 人`;

        // 參與者頭像（使用實際頭像資料）
        const avatarsEl = this.modal.querySelector('#participantAvatars');
        
        // 嘗試從 card.progress.participants.avatars 獲取頭像資料
        const avatarsData = card.progress?.participants?.avatars || [];
        
        if (avatarsData.length > 0) {
            // 有頭像資料，顯示實際參與者頭像
            let avatarsHtml = '';
            const displayCount = Math.min(avatarsData.length, 5);
            
            for (let i = 0; i < displayCount; i++) {
                const participant = avatarsData[i];
                const avatarUrl = participant.avatar || '/static/icons/avatars/default.png';
                const userName = escapeHtml(participant.name || '參與者');
                
                avatarsHtml += `
                    <div class="mini-avatar" title="${userName}">
                        <img src="${avatarUrl}" 
                             alt="${userName}"
                             onerror="this.src='/static/icons/avatars/default.png'" />
                    </div>
                `;
            }
            
            // 如果參與者超過5人，顯示"+N"
            if (avatarsData.length > 5) {
                avatarsHtml += `
                    <div class="mini-avatar more" title="還有 ${avatarsData.length - 5} 人">
                        +${avatarsData.length - 5}
                    </div>
                `;
            }
            
            avatarsEl.innerHTML = avatarsHtml;
        } else if (participantsCurrent > 0) {
            // 沒有頭像資料但有參與者（向後兼容：顯示通用圖標）
            const avatarCount = Math.min(participantsCurrent, 5);
            let avatarsHtml = '';
            
            for (let i = 0; i < avatarCount; i++) {
                avatarsHtml += `
                    <div class="mini-avatar" title="參與者 ${i + 1}">
                        <i class="fas fa-user"></i>
                    </div>
                `;
            }
            
            if (participantsCurrent > 5) {
                avatarsHtml += `
                    <div class="mini-avatar more" title="還有 ${participantsCurrent - 5} 人">
                        +${participantsCurrent - 5}
                    </div>
                `;
            }
            
            avatarsEl.innerHTML = avatarsHtml;
        } else {
            // 完全沒有參與者
            avatarsEl.innerHTML = '<span class="no-participants">尚無參與者</span>';
        }

        console.log('[TaskDetailModal] 卡片數據渲染完成');
    }

    /**
     * 預設的 HTML 轉義函數（如果全局函數不存在）
     */
    defaultEscapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * 銷毀模態框（清理資源）
     */
    destroy() {
        document.removeEventListener('keydown', this.handleEscKey);
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        console.log('[TaskDetailModal] 已銷毀');
    }
}

// 當 DOM 載入完成後初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.taskDetailModal = new TaskDetailModal();
    });
} else {
    // DOM 已經載入完成，直接初始化
    window.taskDetailModal = new TaskDetailModal();
}

// 暴露給全域（供其他模組使用）
window.TaskDetailModal = TaskDetailModal;
