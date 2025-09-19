/**
 * 情緒洞察統計頁面 JavaScript - emo_stats.js
 * 
 * 功能包括：
 * - 統計數據載入與顯示
 * - Chart.js 圖表渲染
 * - 用戶互動處理
 * - 歷史記錄管理
 * - 星空背景動畫系統
 */

// ===== 全域變數 =====
let emotionTrendChart = null;
let emotionDistributionChart = null;
let currentDateRange = '7'; // 預設為7天

// ===== 原型C背景動畫系統 =====
// 初始化完整的背景動畫系統
function initFullParticleSystem() {
    const particleBackground = document.getElementById('particleBackground');
    if (!particleBackground) return;
    
    // 清除現有粒子
    particleBackground.innerHTML = '';
    
    // 創建浮動粒子（50個）
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle floating';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 12 + 's';
        particle.style.animationDuration = (Math.random() * 8 + 8) + 's';
        particleBackground.appendChild(particle);
    }
    
    // 創建星星（150個）
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'particle star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (Math.random() * 2 + 2) + 's';
        particleBackground.appendChild(star);
    }
    
    console.log('✨ 情緒洞察背景粒子系統初始化完成：50個浮動粒子 + 150顆星星');
}

// ===== 主要模組 =====
const EmotionStats = {
    // 初始化函數
    init() {
        console.log('[EmotionStats] 初始化情緒洞察統計功能');
        
        // 初始化背景粒子系統
        initFullParticleSystem();
        
        this.bindEvents();
        this.loadInitialData();
    },

    // 綁定事件監聽器
    bindEvents() {
        // 日期範圍變更
        const dateRangeSelect = document.getElementById('dateRange');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', (e) => {
                currentDateRange = e.target.value; // 支持字符串值
                this.updateDateRangeInfo();
                this.refreshAllData();
            });
        }

        // 重新整理按鈕
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshAllData();
            });
        }

        // 查看更多歷史記錄
        const showMoreBtn = document.getElementById('showMoreHistory');
        if (showMoreBtn) {
            showMoreBtn.addEventListener('click', () => {
                this.loadHistoryData(50); // 載入更多記錄
            });
        }

        // 匯出數據
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    },

    // 載入初始數據
    loadInitialData() {
        this.showLoading(true);
        this.updateDateRangeInfo(); // 更新日期範圍顯示
        
        Promise.all([
            this.loadSummaryData(),
            this.loadTrendsData(),
            this.loadDistributionData(),
            this.loadHistoryData(10)
        ]).then(() => {
            this.showLoading(false);
            console.log('[EmotionStats] 所有數據載入完成');
        }).catch((error) => {
            console.error('[EmotionStats] 數據載入失敗:', error);
            this.showLoading(false);
            this.showErrorMessage('載入數據時發生錯誤，請稍後重試');
        });
    },

    // 更新日期範圍顯示信息
    updateDateRangeInfo() {
        const dateRangeInfo = document.getElementById('dateRangeInfo');
        if (dateRangeInfo) {
            if (currentDateRange === 'today') {
                dateRangeInfo.textContent = '今日數據';
            } else {
                dateRangeInfo.textContent = `近 ${currentDateRange} 天數據`;
            }
        }
    },

    // 重新載入所有數據
    refreshAllData() {
        const rangeText = currentDateRange === 'today' ? '今天' : `近 ${currentDateRange} 天`;
        console.log(`[EmotionStats] 重新載入數據，時間範圍: ${rangeText}`);
        this.loadInitialData();
    },

    // 載入統計摘要數據
    async loadSummaryData() {
        try {
            const response = await fetch(`/ai/emo_stats/api/summary?days=${currentDateRange}`);
            const data = await response.json();
            
            if (data.success) {
                this.updateSummaryCards(data.summary);
            } else {
                throw new Error(data.error || '獲取摘要數據失敗');
            }
        } catch (error) {
            console.error('[EmotionStats] 載入摘要數據失敗:', error);
            this.updateSummaryCards({
                total_interactions: '錯誤',
                emotion_direction: '無法載入',
                avg_confidence: '錯誤',
                emotion_stability: '錯誤'
            });
        }
    },

    // 更新摘要卡片
    updateSummaryCards(summary) {
        const elements = {
            totalInteractions: document.getElementById('totalInteractions'),
            dominantEmotion: document.getElementById('dominantEmotion'),
            avgConfidence: document.getElementById('avgConfidence'),
            emotionStability: document.getElementById('emotionStability'),
            quickTotalInteractions: document.getElementById('quickTotalInteractions'),
            quickEmotionDirection: document.getElementById('quickEmotionDirection')
        };

        if (elements.totalInteractions) {
            elements.totalInteractions.textContent = summary.total_interactions || '0';
        }
        
        if (elements.dominantEmotion) {
            elements.dominantEmotion.textContent = summary.emotion_direction || '無數據';
        }
        
        if (elements.avgConfidence) {
            elements.avgConfidence.textContent = summary.avg_confidence ? 
                `${summary.avg_confidence}/10` : '0/10';
        }
        
        if (elements.emotionStability) {
            elements.emotionStability.textContent = summary.emotion_stability ? 
                `${summary.emotion_stability}%` : '0%';
        }

        // 更新快速預覽區域
        if (elements.quickTotalInteractions) {
            elements.quickTotalInteractions.textContent = summary.total_interactions || '0';
        }
        
        if (elements.quickEmotionDirection) {
            elements.quickEmotionDirection.textContent = summary.emotion_direction || '無數據';
        }

        console.log('[EmotionStats] 摘要卡片更新完成');
    },

    // 載入趨勢數據
    async loadTrendsData() {
        try {
            const response = await fetch(`/ai/emo_stats/api/trends?days=${currentDateRange}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderTrendChart(data.trends);
            } else {
                throw new Error(data.error || '獲取趨勢數據失敗');
            }
        } catch (error) {
            console.error('[EmotionStats] 載入趨勢數據失敗:', error);
            this.renderTrendChart({
                dates: [],
                positive_counts: [],
                negative_counts: []
            });
        }
    },

    // 渲染趨勢圖表
    renderTrendChart(trendsData) {
        const ctx = document.getElementById('emotionTrendChart');
        if (!ctx) {
            console.error('[EmotionStats] 找不到趨勢圖表容器');
            return;
        }

        // 銷毀現有圖表
        if (emotionTrendChart) {
            emotionTrendChart.destroy();
        }

        // 檢查數據
        if (!trendsData.dates || trendsData.dates.length === 0) {
            this.showNoDataMessage(ctx.parentElement, '趨勢圖表');
            return;
        }

        // 計算Y軸最大值，支援百分比分數
        const maxPositive = Math.max(...(trendsData.positive_scores || trendsData.positive_counts || []));
        const maxNegative = Math.max(...(trendsData.negative_scores || trendsData.negative_counts || []));
        const maxValue = Math.max(maxPositive, maxNegative);
        const yAxisMax = Math.max(10, maxValue * 1.2); // 增加20%緩衝空間

        console.log('[EmotionStats] 圖表數據:', {
            positive_data: trendsData.positive_scores || trendsData.positive_counts,
            negative_data: trendsData.negative_scores || trendsData.negative_counts,
            maxValue: maxValue,
            yAxisMax: yAxisMax
        });

        emotionTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendsData.dates,
                datasets: [
                    {
                        label: '正向情緒分數',
                        data: trendsData.positive_scores || trendsData.positive_counts || [],
                        borderColor: '#32CD32',
                        backgroundColor: 'rgba(50, 205, 50, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#32CD32',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: '負面情緒分數',
                        data: trendsData.negative_scores || trendsData.negative_counts || [],
                        borderColor: '#FF6347',
                        backgroundColor: 'rgba(255, 99, 71, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#FF6347',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: currentDateRange === 'today' ? 
                            '今日情緒分數趨勢' : 
                            `近 ${currentDateRange} 天情緒分數趨勢`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#64ffda'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#64ffda',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const suffix = trendsData.positive_scores ? ' 分' : ' 次';
                                return `${context.dataset.label}: ${value}${suffix}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: currentDateRange === 'today' ? '時間' : '日期',
                            color: '#64ffda'
                        },
                        grid: {
                            color: 'rgba(100, 255, 218, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        title: {
                            display: true,
                            text: trendsData.positive_scores ? '情緒分數' : '情緒次數',
                            color: '#64ffda'
                        },
                        min: 0,
                        max: yAxisMax,
                        grid: {
                            color: 'rgba(100, 255, 218, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            stepSize: trendsData.positive_scores ? 5 : 1 // 分數用5，次數用1
                        }
                    }
                }
            }
        });

        console.log('[EmotionStats] 趨勢圖表渲染完成');
    },

    // 載入分布數據
    async loadDistributionData() {
        try {
            const response = await fetch(`/ai/emo_stats/api/distribution?days=${currentDateRange}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderDistributionChart(data.distribution);
            } else {
                throw new Error(data.error || '獲取分布數據失敗');
            }
        } catch (error) {
            console.error('[EmotionStats] 載入分布數據失敗:', error);
            this.renderDistributionChart({
                labels: [],
                data: [],
                colors: []
            });
        }
    },

    // 渲染分布圖表
    renderDistributionChart(distributionData) {
        const ctx = document.getElementById('emotionDistributionChart');
        if (!ctx) {
            console.error('[EmotionStats] 找不到分布圖表容器');
            return;
        }

        // 銷毀現有圖表
        if (emotionDistributionChart) {
            emotionDistributionChart.destroy();
        }

        // 檢查數據
        if (!distributionData.labels || distributionData.labels.length === 0) {
            this.showNoDataMessage(ctx.parentElement, '分布圖表');
            return;
        }

        emotionDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: distributionData.labels,
                datasets: [{
                    data: distributionData.data,
                    backgroundColor: distributionData.colors.length > 0 ? distributionData.colors : [
                        '#FFD700', '#4169E1', '#FF6347', '#32CD32', '#87CEEB', '#9370DB'
                    ],
                    borderWidth: 3,
                    borderColor: '#fff',
                    hoverBorderWidth: 5,
                    hoverBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: currentDateRange === 'today' ? 
                            '今日情緒分布' : 
                            `近 ${currentDateRange} 天情緒分布`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#64ffda'
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            font: {
                                size: 12
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                },
                cutout: '50%'
            }
        });

        console.log('[EmotionStats] 分布圖表渲染完成');
    },

    // 載入歷史記錄
    async loadHistoryData(limit = 10) {
        try {
            const response = await fetch(`/ai/emo_stats/api/history?days=${currentDateRange}&limit=${limit}`);
            const data = await response.json();
            
            if (data.success) {
                this.updateHistoryTable(data.history);
            } else {
                throw new Error(data.error || '獲取歷史記錄失敗');
            }
        } catch (error) {
            console.error('[EmotionStats] 載入歷史記錄失敗:', error);
            this.updateHistoryTable([]);
        }
    },

    // 更新歷史記錄表格
    updateHistoryTable(historyData) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) {
            console.error('[EmotionStats] 找不到歷史記錄表格');
            return;
        }

        if (!historyData || historyData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">暫無歷史記錄</td></tr>';
            return;
        }

        let html = '';
        historyData.forEach(record => {
            html += `
                <tr>
                    <td>${record.date || '未知'}</td>
                    <td><span style="color: ${this.getEmotionColor(record.dominant_emotion)}">${record.dominant_emotion || '未知'}</span></td>
                    <td>${record.confidence || 'N/A'}/10</td>
                    <td>${record.overall_tone || '未知'}</td>
                    <td class="message-preview">${record.message_preview || '無內容'}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        console.log(`[EmotionStats] 歷史記錄表格更新完成，共 ${historyData.length} 條記錄`);
    },

    // 獲取情緒對應顏色
    getEmotionColor(emotion) {
        const colors = {
            '開心': '#FFD700',
            '快樂': '#FFD700',
            '喜悅': '#FFD700',
            '悲傷': '#4169E1',
            '難過': '#4169E1',
            '焦慮': '#FF6347',
            '緊張': '#FF6347',
            '憤怒': '#DC143C',
            '平靜': '#32CD32',
            '中性': '#87CEEB',
            '理解': '#9370DB',
            '友善': '#20B2AA'
        };
        return colors[emotion] || '#666';
    },

    // 顯示無數據訊息
    showNoDataMessage(container, chartType) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-chart-line"></i>
                <h3>暫無數據</h3>
                <p>${chartType}需要有情緒分析記錄才能顯示</p>
                <p>請先使用<a href="/ai/emotion" style="color: #667eea;">情緒 AI</a>進行對話</p>
            </div>
        `;
    },

    // 顯示/隱藏載入指示器
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    },

    // 顯示錯誤訊息
    showErrorMessage(message) {
        // 可以實作一個通知系統，這裡簡化為console錯誤
        console.error('[EmotionStats] 錯誤:', message);
        alert(`錯誤: ${message}`);
    },

    // 匯出數據功能
    exportData() {
        // 這裡可以實作CSV匯出功能
        console.log('[EmotionStats] 匯出數據功能待實作');
        alert('匯出功能開發中...');
    }
};

// ===== 工具函數 =====

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 防抖函數
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== 頁面載入時自動初始化 =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        EmotionStats.init();
    });
} else {
    // 如果文檔已經載入完成
    EmotionStats.init();
}

// 導出到全域範圍供模板使用
window.EmotionStats = EmotionStats;
