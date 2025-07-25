/* static/js/modules/admin/admin.js
   --------------------------------------------------
   – 後台管理主檔案
   – 2025-05-18 fix:
     1. user_left 後立即刪除列表項，並記到 localStorage
     2. 重新整理時排除已關閉會話、自動選第一個
   – 2025-05-25 fix:
     - 公告刪除 selector 調整，行 / 卡片即時移除
   – 2025-07-08 整合 report_stats.js 和 report.js
   -------------------------------------------------- */

(() => {
  /* ---------- 主題切換 ---------- */
  const root = document.documentElement;
  const key  = 'admin-theme';

  /* 🆕 ① 開頁立即還原主題（避免閃白） */
  const savedTheme = localStorage.getItem(key);
  if (savedTheme === 'dark') {
    root.classList.add('dark-mode');
    root.classList.remove('light-mode');
  } else if (savedTheme === 'light') {
    root.classList.add('light-mode');
    root.classList.remove('dark-mode');
  }

  /* 建 button 與狀態 icon */
  const themeBtn = document.createElement('button');
  themeBtn.className = 'theme-toggle';
  const icon = () => (root.classList.contains('dark-mode') ? '🌞' : '🌜');
  const renderIcon = () => (themeBtn.innerHTML = `<span>${icon()}</span>`);

  renderIcon();
  document.getElementById('theme-anchor')?.appendChild(themeBtn);

  // 啟用過渡效果（避免頁面載入時的閃爍）
  setTimeout(() => {
    document.documentElement.classList.add('theme-loaded');
  }, 100);

  themeBtn.onclick = () => {
    const isDark = root.classList.contains('dark-mode');
    if (isDark) {
      root.classList.remove('dark-mode');
      root.classList.add('light-mode');
      localStorage.setItem(key, 'light');
    } else {
      root.classList.remove('light-mode');
      root.classList.add('dark-mode');
      localStorage.setItem(key, 'dark');
    }
    renderIcon();
  };

  /* ---------- 側欄收合 ---------- */
  const sidebar = document.getElementById('sidebar');
  const handle  = document.getElementById('sidebar-handle');
  const toggle  = () => {
    sidebar.classList.toggle('collapsed');
    handle.textContent = sidebar.classList.contains('collapsed') ? '⟩' : '⟨';
  };
  handle.onclick = toggle;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !sidebar.classList.contains('collapsed')) toggle();
  });
})();

/* ===========================
   舉報管理 JavaScript 整合
   =========================== */

// 舉報管理全域變數
let currentReportId = null;
let currentAction = null;

// 修正報告詳情頁面導航問題
function fixReportNavigation() {
    // 修正表格行點擊事件
    const reportRows = document.querySelectorAll('.report-row');
    reportRows.forEach(row => {
        row.addEventListener('click', function(e) {
            // 如果點擊的是按鈕或連結，不觸發行點擊事件
            if (e.target.closest('.btn') || e.target.closest('.action-buttons') || e.target.closest('a')) {
                return;
            }
            
            // 獲取報告 ID
            const reportIdElement = row.querySelector('[data-label="ID:"]');
            if (reportIdElement) {
                const reportId = reportIdElement.textContent.replace('#', '');
                if (reportId) {
                    // 雲端環境修復：使用完整的 URL
                    const targetUrl = `${window.location.protocol}//${window.location.host}/admin/report/${reportId}`;
                    console.log('Navigating to report detail:', targetUrl);
                    window.location.href = targetUrl;
                }
            }
        });
    });
    
    // 修正手機卡片點擊事件
    const reportCards = document.querySelectorAll('.report-card');
    reportCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // 如果點擊的是按鈕或連結，不觸發卡片點擊事件
            if (e.target.closest('.btn') || e.target.closest('.card-actions') || e.target.closest('a')) {
                return;
            }
            
            // 查找詳情連結
            const detailLink = card.querySelector('a[href*="/admin/report/"]');
            if (detailLink) {
                console.log('Navigating via card click:', detailLink.href);
                window.location.href = detailLink.href;
            }
        });
    });
    
    // 修正查看按鈕點擊事件 - 移除 preventDefault，讓瀏覽器正常處理連結
    const viewButtons = document.querySelectorAll('.btn[href*="/admin/report/"]');
    viewButtons.forEach(button => {
        // 移除舊的事件監聽器，讓瀏覽器自然處理 href 屬性
        button.removeEventListener('click', preventDefaultHandler);
        
        // 添加調試日誌
        button.addEventListener('click', function(e) {
            console.log('View button clicked:', this.href);
            // 不阻止默認行為，讓瀏覽器正常導航
        });
    });
}

// 防止重複綁定的輔助函數
function preventDefaultHandler(e) {
    e.preventDefault();
    const href = this.getAttribute('href');
    if (href) {
        window.location.href = href;
    }
}

// 統計報表管理器
class ReportStatsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        // 等待 DOM 載入完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeCharts();
                fixReportNavigation();
            });
        } else {
            this.initializeCharts();
            fixReportNavigation();
        }
    }

    initializeCharts() {
        // 創建所有圖表
        this.createDailyTrendChart();
        this.createThemeDistributionChart();
        this.createAIAccuracyChart();
        this.animateStatNumbers();
        
        // 設置響應式重新繪製
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * 創建每日趨勢線圖
     */
    createDailyTrendChart() {
        const trendContainer = document.querySelector('.trend-list');
        const dailyTrendsData = (window.adminStatsData && window.adminStatsData.dailyTrends) || window.dailyTrendsData;
        
        if (!trendContainer || !dailyTrendsData) return;

        // 替換容器內容為圖表畫布
        trendContainer.innerHTML = '<canvas id="trendChart" class="chart-canvas"></canvas>';
        
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        this.charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyTrendsData.map(item => {
                    const date = new Date(item.report_date);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                }),
                datasets: [{
                    label: '舉報數量',
                    data: dailyTrendsData.map(item => item.count),
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0ea5e9',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0ea5e9',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * 創建主題分佈甜甜圈圖
     */
    createThemeDistributionChart() {
        const themeContainer = document.querySelector('.theme-list');
        const themeStatsData = (window.adminStatsData && window.adminStatsData.themeStats) || window.themeStatsData;
        
        if (!themeContainer || !themeStatsData) return;

        // 替換容器內容為圖表畫布
        themeContainer.innerHTML = '<canvas id="themeChart" class="chart-canvas"></canvas>';
        
        const ctx = document.getElementById('themeChart').getContext('2d');
        
        // 生成漸層色彩
        const colors = this.generateGradientColors(themeStatsData.length);
        
        this.charts.themeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: themeStatsData.slice(0, 10).map(item => {
                    return item.Theme.length > 20 ? item.Theme.substring(0, 20) + '...' : item.Theme;
                }),
                datasets: [{
                    data: themeStatsData.slice(0, 10).map(item => item.count),
                    backgroundColor: colors,
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 5,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0ea5e9',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    /**
     * 創建 AI 準確性柱狀圖
     */
    createAIAccuracyChart() {
        const accuracyContainer = document.querySelector('.accuracy-grid');
        const aiAccuracyData = (window.adminStatsData && window.adminStatsData.aiAccuracy) || window.aiAccuracyData;
        
        if (!accuracyContainer || !aiAccuracyData) return;

        // 替換容器內容為圖表畫布
        accuracyContainer.innerHTML = '<canvas id="accuracyChart" class="chart-canvas" style="height: 300px;"></canvas>';
        
        const ctx = document.getElementById('accuracyChart').getContext('2d');
        
        // 計算準確性數據
        const data = this.processAIAccuracyData(aiAccuracyData);
        
        this.charts.accuracyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['AI判有效→已接受', 'AI判有效→已拒絕', 'AI判無效→已接受', 'AI判無效→已拒絕'],
                datasets: [{
                    label: '數量',
                    data: data.values,
                    backgroundColor: data.colors,
                    borderColor: data.borderColors,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0ea5e9',
                        borderWidth: 1,
                        callbacks: {
                            afterLabel: function(context) {
                                const isCorrect = context.dataIndex === 0 || context.dataIndex === 3;
                                return isCorrect ? '✓ 正確判斷' : '✗ 錯誤判斷';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    /**
     * 處理 AI 準確性數據
     */
    processAIAccuracyData(accuracyData) {
        let aiValidAccepted = 0, aiValidRejected = 0, aiInvalidAccepted = 0, aiInvalidRejected = 0;
        
        accuracyData.forEach(item => {
            if (item.AI_Valid === 1 && item.Status === 'accepted') aiValidAccepted = item.count;
            if (item.AI_Valid === 1 && item.Status === 'rejected') aiValidRejected = item.count;
            if (item.AI_Valid === 0 && item.Status === 'accepted') aiInvalidAccepted = item.count;
            if (item.AI_Valid === 0 && item.Status === 'rejected') aiInvalidRejected = item.count;
        });

        return {
            values: [aiValidAccepted, aiValidRejected, aiInvalidAccepted, aiInvalidRejected],
            colors: [
                'rgba(16, 185, 129, 0.8)',  // 綠色 - 正確
                'rgba(239, 68, 68, 0.8)',   // 紅色 - 錯誤
                'rgba(239, 68, 68, 0.8)',   // 紅色 - 錯誤
                'rgba(16, 185, 129, 0.8)'   // 綠色 - 正確
            ],
            borderColors: [
                'rgb(16, 185, 129)',
                'rgb(239, 68, 68)',
                'rgb(239, 68, 68)',
                'rgb(16, 185, 129)'
            ]
        };
    }

    /**
     * 生成漸層色彩
     */
    generateGradientColors(count) {
        const colors = [
            '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
            '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316',
            '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6'
        ];
        
        return colors.slice(0, count);
    }

    /**
     * 數字動畫效果
     */
    animateStatNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(element => {
            const targetText = element.textContent;
            const hasPercent = targetText.includes('%');
            const target = parseInt(targetText.replace('%', '')) || 0;
            
            let current = 0;
            const increment = Math.ceil(target / 30); // 30 frames
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    element.textContent = hasPercent ? target + '%' : target;
                    clearInterval(timer);
                } else {
                    element.textContent = hasPercent ? current + '%' : current;
                }
            }, 50);
            
            // 添加數字變化時的縮放效果
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 300);
        });
    }

    /**
     * 處理窗口大小變化
     */
    handleResize() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    /**
     * 銷毀所有圖表
     */
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

/* ───────── 舉報管理相關函式 ───────── */

// 初始化舉報管理功能
function initReportManagement() {
    console.log('Initializing Report Management...');
    
    if (document.querySelector('.report-row') || document.querySelector('.report-card')) {
        console.log('Report elements found, initializing components...');
        
        try {
            initStatCounters();
            console.log('✓ Stat counters initialized');
            
            initTableInteractions();
            console.log('✓ Table interactions initialized');
            
            initQuickActions();
            console.log('✓ Quick actions initialized');
            
            initReportListHandlers();
            console.log('✓ Report list handlers initialized');
            
            initStatusFilters?.();
            console.log('✓ Status filters initialized');
            
            initPagination?.();
            console.log('✓ Pagination initialized');
            
            console.log('Report Management initialization completed successfully');
        } catch (error) {
            console.error('Error during Report Management initialization:', error);
        }
    } else {
        console.log('No report elements found, skipping Report Management initialization');
    }
}

/* ───────── 統計卡片數字動畫 ───────── */
function initStatCounters() {
    document.querySelectorAll('.stat-number').forEach(el => {
        const target = +el.dataset.count || 0;
        if (target === 0) return;
        const duration = 600;              // ms
        const steps = 30;                  // 動畫幀數
        const inc = Math.ceil(target / steps);
        let current = 0;
        el.textContent = '0';
        const timer = setInterval(() => {
            current += inc;
            if (current >= target) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = current;
            }
        }, duration / steps);
    });
}

/* ───────── 表格 & 卡片點擊 ───────── */
function initTableInteractions() {
    // 桌面表格行
    document.querySelectorAll('.report-row').forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', e => {
            if (e.target.closest('.btn') || e.target.closest('.action-buttons')) return;
            const id = row.querySelector('[data-label="ID:"]')?.textContent?.replace('#', '');
            if (id) window.location.href = `/admin/report/${id}`;
        });
    });
    // 手機卡片
    document.querySelectorAll('.report-card').forEach(card => {
        const detailBtn = card.querySelector('a[href*="/admin/report/"]');
        if (!detailBtn) return;
        card.style.cursor = 'pointer';
        card.addEventListener('click', e => {
            if (e.target.closest('.btn') || e.target.closest('.card-actions')) return;
            detailBtn.click();
        });
    });
}

/* ───────── 快速操作 ───────── */
function initQuickActions() {
    // data-quick-update 按鈕
    document.querySelectorAll('[data-quick-update]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            quickUpdate(btn.dataset.reportId, btn.dataset.action);
        });
    });
}

/* ───────── Report List 專用 ───────── */
function initReportListHandlers() {
    // 狀態篩選 - 移除現有監聽器並重新綁定
    const sel = document.getElementById('status-filter');
    if (sel) {
        // 記錄初始狀態
        const initialStatus = sel.getAttribute('data-current-status') || sel.value;
        console.log('Initializing status filter. Current status:', initialStatus);
        
        // 更新調試信息
        const debugEl = document.getElementById('current-filter-debug');
        if (debugEl) {
            debugEl.textContent = initialStatus;
        }
        
        // 移除可能存在的監聽器
        const newSel = sel.cloneNode(true);
        sel.parentNode.replaceChild(newSel, sel);
        
        // 添加新的監聽器
        newSel.addEventListener('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const selectedValue = this.value;
            const previousValue = this.getAttribute('data-current-status') || '';
            
            console.log('Status filter change detected:');
            console.log('- Previous value:', previousValue);
            console.log('- New value:', selectedValue);
            console.log('- Current URL:', window.location.href);
            
            // 更新調試信息
            const debugEl = document.getElementById('current-filter-debug');
            if (debugEl) {
                debugEl.textContent = selectedValue;
            }
            
            // 設置新的當前狀態
            this.setAttribute('data-current-status', selectedValue);
            
            // 延遲執行以確保事件完全處理
            setTimeout(() => {
                filterByStatus(selectedValue);
            }, 100);
        });
        
        console.log('Status filter initialized successfully');
    } else {
        console.warn('Status filter element not found');
    }
    
    // Modal 關閉 / 送出
    document.querySelector('[data-close-modal]')?.addEventListener('click', closeQuickModal);
    document.querySelector('[data-submit-modal]')?.addEventListener('click', submitQuickUpdate);
    document.getElementById('quickUpdateModal')?.addEventListener('click', e => {
        if (e.target.id === 'quickUpdateModal') closeQuickModal();
    });
}

function filterByStatus(status) {
    console.log('=== filterByStatus called ===');
    console.log('Target status:', status);
    console.log('Current location:', window.location.href);
    
    try {
        // 清除可能的事件處理器，避免重複觸發
        const select = document.getElementById('status-filter');
        if (select) {
            select.disabled = true;
            console.log('Select element disabled temporarily');
            setTimeout(() => {
                if (select) {
                    select.disabled = false;
                    console.log('Select element re-enabled');
                }
            }, 2000);
        }

        // 雲端環境修復：確保使用正確的基礎 URL
        const baseUrl = window.location.protocol + '//' + window.location.host + '/admin/report';
        let newUrl = baseUrl;
        
        if (status !== 'all') {
            newUrl += `?status=${encodeURIComponent(status)}`;
        }
        
        console.log('Constructed URL for cloud deployment:', newUrl);
        
        // 顯示載入提示
        const debugEl = document.getElementById('current-filter-debug');
        if (debugEl) {
            debugEl.textContent = `載入中... (${status})`;
        }
        
        // 雲端環境優化：使用更可靠的跳轉方法
        console.log('Starting navigation...');
        
        // 方法1：直接設定 location.href
        window.location.href = newUrl;
        
        // 備用方法：如果上面的不起作用，延遲執行
        setTimeout(() => {
            if (window.location.href !== newUrl) {
                console.log('Fallback navigation attempt');
                window.location.replace(newUrl);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error in filterByStatus:', error);
        console.error('Error stack:', error.stack);
        
        // 重新啟用選擇器
        const select = document.getElementById('status-filter');
        if (select) {
            select.disabled = false;
        }
        
        // 降級處理 - 強制跳轉
        const baseUrl = '/admin/report';
        let fallbackUrl = baseUrl;
        
        if (status !== 'all') {
            fallbackUrl += `?status=${encodeURIComponent(status)}`;
        }
        
        console.log('Using fallback URL:', fallbackUrl);
        
        // 顯示錯誤提示
        const debugEl = document.getElementById('current-filter-debug');
        if (debugEl) {
            debugEl.textContent = `錯誤重試... (${status})`;
        }
        
        setTimeout(() => {
            window.location.href = fallbackUrl;
        }, 500);
    }
}

function quickUpdate(reportId, action) {
    currentReportId = reportId;
    currentAction = action;
    const modal = document.getElementById('quickUpdateModal');
    document.getElementById('modalTitle').textContent = action === 'accepted' ? '接受舉報' : '拒絕舉報';
    modal.classList.add('show');
    setTimeout(() => document.getElementById('quickReply')?.focus(), 100);
}

function closeQuickModal() {
    const modal = document.getElementById('quickUpdateModal');
    modal.classList.remove('show');
    document.getElementById('quickReply').value = '';
    currentReportId = currentAction = null;
}

function submitQuickUpdate() {
    const reply = document.getElementById('quickReply').value.trim();
    if (!reply) {
        showNotification('請填寫處理結果說明', 'warning');
        return;
    }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/admin/report/${currentReportId}/update`;
    [['status', currentAction], ['staff_reply', reply], ['notify_user', 'on']]
        .forEach(([n, v]) => {
            const i = document.createElement('input');
            i.type = 'hidden';
            i.name = n;
            i.value = v;
            form.appendChild(i);
        });
    document.body.appendChild(form);
    form.submit();
}

/* ───────── 占位空函式避免 console error ───────── */

/* ===========================
   報告列表狀態篩選管理
   =========================== */

// 確保狀態篩選功能正常工作的額外保護
function initReportListStatusFilter() {
    'use strict';
    
    function ensureStatusFilterWorks() {
        const statusFilter = document.getElementById('status-filter');
        if (!statusFilter) {
            console.warn('Status filter element not found');
            return;
        }
        
        console.log('Setting up status filter with current value:', statusFilter.value);
        
        // 移除所有現有的事件監聽器
        const newFilter = statusFilter.cloneNode(true);
        statusFilter.parentNode.replaceChild(newFilter, statusFilter);
        
        // 添加新的事件監聽器
        newFilter.addEventListener('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const selectedStatus = this.value;
            console.log('Status filter changed to:', selectedStatus);
            
            // 確保不會被重複觸發
            this.disabled = true;
            
            try {
                // 構建新的 URL
                const url = new URL(window.location.href);
                
                if (selectedStatus === 'all') {
                    url.searchParams.delete('status');
                } else {
                    url.searchParams.set('status', selectedStatus);
                }
                
                // 重置頁面參數
                url.searchParams.delete('page');
                
                const newUrl = url.toString();
                console.log('Navigating to:', newUrl);
                
                // 立即跳轉
                window.location.href = newUrl;
                
            } catch (error) {
                console.error('Error in status filter:', error);
                
                // 降級處理
                const baseUrl = window.location.pathname;
                let fallbackUrl = baseUrl;
                
                if (selectedStatus !== 'all') {
                    fallbackUrl += '?status=' + encodeURIComponent(selectedStatus);
                }
                
                console.log('Using fallback URL:', fallbackUrl);
                window.location.href = fallbackUrl;
            }
        });
        
        console.log('Status filter setup completed');
    }
    
    // 在多個時機確保初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureStatusFilterWorks);
    } else {
        ensureStatusFilterWorks();
    }
    
    // 額外的延遲初始化，確保在其他腳本執行後
    setTimeout(ensureStatusFilterWorks, 500);
}

// 初始化報告列表狀態篩選（只在相關頁面執行）
if (window.location.pathname.includes('/admin/report') && !window.location.pathname.includes('/admin/report/')) {
    initReportListStatusFilter();
}

/* ───────── 聊天系統初始化 ───────── */
function initChatFunctionality() {
    const toStr = v => (v != null ? String(v) : null);
    const socket = io("/chat");
    const listEls = document.querySelectorAll(".session-item");
    const logBox = document.getElementById("log-box");
    const replyButton = document.getElementById("reply-btn");
    const replyText = document.getElementById("reply-input");
    const noSessionMsg = document.querySelector('.no-session');

    listEls.forEach(element => {
        const sid = toStr(element.dataset.sid);
        if (localStorage.getItem(`closed_${sid}`) === '1') element.remove();
    });

    updateSessionVisibility();

    let currentId = null;
    localStorage.removeItem("adminCurrentId");

    const subscribe = () => {
        if (socket.connected && currentId) {
            socket.emit("subscribe_to_session", { session_id: currentId, role: "admin" });
        }
    };

    socket.on("user_left", ({ session_id, email, message }) => {
        session_id = toStr(session_id);
        localStorage.setItem(`closed_${session_id}`, '1');
        const item = document.querySelector(`.session-item[data-sid='${session_id}']`);
        if (item) item.remove();
        updateSessionVisibility();

        if (currentId === session_id) {
            logBox.innerHTML = "";
            const note = document.createElement("div");
            note.className = "system-notification";
            note.innerText = message || `使用者 ${email} 已離開聊天`;
            logBox.appendChild(note);
            currentId = null;
            localStorage.removeItem("adminCurrentId");
        }
    });

    socket.on("msg_added", ({ session_id, role, message, email }) => {
        session_id = toStr(session_id);
        if (session_id !== currentId) {
            const item = document.querySelector(`.session-item[data-sid='${session_id}']`);
            if (item) {
                let badge = item.querySelector(".badge");
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = "badge bg-danger rounded-pill";
                    item.appendChild(badge);
                }
                badge.innerText = parseInt(badge.innerText || '0') + 1;
            }
            return;
        }
        appendLog(role, message, email);
        logBox.scrollTop = logBox.scrollHeight;
    });

    socket.on("need_human", messageData => {
        localStorage.removeItem(`closed_${messageData.session_id}`);
        prependSessionItem(toStr(messageData.session_id), messageData.email, messageData.message_count || 1);
        if (noSessionMsg) noSessionMsg.style.display = 'none';
    });

    document.addEventListener("click", async eventData => {
        const element = eventData.target.closest(".session-item");
        if (!element) return;
        document.querySelectorAll(".session-item").forEach(sessionElement => sessionElement.classList.remove("active"));
        element.classList.add("active");
        currentId = toStr(element.dataset.sid);
        localStorage.setItem("adminCurrentId", currentId);
        await loadLogs(currentId);
        const badge = element.querySelector(".badge");
        if (badge) badge.innerText = "0";
        subscribe();
    });

    async function loadLogs(sid) {
        sid = toStr(sid);
        if (!sid) return;

        const overlay = document.createElement('div');
        overlay.className = 'log-loading-overlay';
        overlay.innerText = '載入中...';
        logBox.appendChild(overlay);

        try {
            const res = await fetch(`/admin/chat/logs/${sid}`);
            if (!res.ok) throw new Error("HTTP " + res.status);

            const data = await res.json();
            const messages = Array.isArray(data) ? data : (data.messages || []);

            logBox.innerHTML = '';
            messages.forEach(row => appendLog(row.role, row.message, row.email || '使用者'));
            logBox.scrollTop = logBox.scrollHeight;
        } catch (err) {
            logBox.innerHTML = "<p class='error'>❌ 無法載入訊息紀錄</p>";
            console.error(err);
        }
    }

    function appendLog(role, msg, senderName) {
        const div = document.createElement("div");
        div.className = `msg ${role}`;
        const who = role === 'user' ? (senderName || '使用者') :
                   role === 'admin' ? '管理員' : 'AI';
        div.innerHTML = `<div class="role">${who}</div>${msg}`;
        logBox.appendChild(div);
    }

    function prependSessionItem(id, email, count = 1) {
        id = toStr(id);
        if (localStorage.getItem(`closed_${id}`) === '1') {
            localStorage.removeItem(`closed_${id}`);
        }
        const container = document.getElementById("session-container");
        let item = document.querySelector(`.session-item[data-sid='${id}']`);
        if (item) {
            const badge = item.querySelector(".badge");
            if (badge) badge.innerText = parseInt(badge.innerText || "0") + count;
            container.prepend(item);
            return;
        }
        item = document.createElement("div");
        item.className = "session-item";
        item.dataset.sid = id;
        item.innerHTML = `<span class="user-mail">${email}</span><span class="badge">${count}</span>`;
        container.prepend(item);
        updateSessionVisibility();
    }

    function updateSessionVisibility() {
        const has = document.querySelectorAll('.session-item').length > 0;
        if (noSessionMsg) noSessionMsg.style.display = has ? 'none' : 'block';
    }

    async function send() {
        const txt = replyText.value.trim();
        if (!txt || !currentId) return;
        replyText.value = "";
        await fetch("/admin/chat/reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: currentId, message: txt })
        });
    }

    replyButton.addEventListener("click", send);
    replyText.addEventListener("keydown", eventData => {
        if (eventData.key === "Enter" && !eventData.shiftKey) {
            eventData.preventDefault();
            send();
        }
    });
}

/* ===== 公告管理：刪除後立即更新畫面 ===== */
function initAnnouncementManagement() {
    // 僅在公告管理頁面執行
    if (!document.querySelector('.table') &&
        !document.querySelector('.announcement-mobile-cards')) return;

    /* 一律抓路徑中同時含有 announce | announcement 與 delete 的表單 */
    const deleteForms = document.querySelectorAll(
        'form[action*="announce"][action*="delete"]'
    );

    deleteForms.forEach(form => {
        form.addEventListener('submit', async eventData => {
            eventData.preventDefault();
            if (!confirm('確定刪除此公告？')) return;

            /* 帶 CSRF、帶 cookie */
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                credentials: 'same-origin'
            });

            if (response.ok || response.redirected || response.status === 204) {
                /* ➜ 直接重新整理，百分百保證畫面同步 */
                location.reload();
            } else {
                alert('刪除失敗，請再試一次');
            }
        });
    });
}

/* ========== 通知訊息系統 ========== */
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.admin-notification');
    if (existingNotification) existingNotification.remove();

    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;margin-left:10px;cursor:pointer;">×</button>
    `;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 16px',
        borderRadius: '6px',
        color: '#fff',
        backgroundColor: type === 'success' ? '#28a745' :
                         type === 'error' ? '#dc3545' : '#007bff',
        zIndex: '9999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        transform: 'translateX(100%)',
        opacity: '0'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/* ==== Dashboard 數據動畫與更新功能 ==== */
function initDashboardFeatures() {
    const stats = document.querySelectorAll('.dashboard-card .card-value');
    if (!stats.length) return; // 若非 dashboard 頁面則跳過

    const easeOut = t => 1 - Math.pow(1 - t, 3);

    stats.forEach(el => animateValue(el, +el.textContent.replace(/,/g, '')));

    function animateValue(el, target) {
        const start = performance.now();
        const duration = 1200;
        const format = v => v.toLocaleString('en-US');

        const step = now => {
            const p = Math.min((now - start) / duration, 1);
            el.textContent = format(Math.floor(easeOut(p) * target));
            if (p < 1) requestAnimationFrame(step);
        };

        el.textContent = '0';
        requestAnimationFrame(step);
    }

    // Ripple 效果（支援 dashboard 快捷按鈕）
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            const size = Math.max(btn.offsetWidth, btn.offsetHeight);
            ripple.style.width = ripple.style.height = `${size}px`;
            const rect = btn.getBoundingClientRect();
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });

    // Intersection Observer：滑入才動畫
    const observer = new IntersectionObserver(
        entries => entries.forEach(({ isIntersecting, target }) => {
            if (isIntersecting) {
                target.classList.add('in-view');
                observer.unobserve(target);
            }
        }), { threshold: 0.2 }
    );

    document.querySelectorAll('.dashboard-card').forEach(card => observer.observe(card));

    // 定時更新數據（每 5 分鐘自動拉一次）
    setInterval(fetchDashboardStats, 5 * 60 * 1000);
    
    function fetchDashboardStats() {
        fetch('/admin/api/stats')
            .then(r => r.ok ? r.json() : null)
            .then(data => data && updateStats(data))
            .catch(err => console.warn('Dashboard stats update failed:', err));
    }

    function updateStats(data) {
        const map = {
            user_count: data.user_count,
            diary_count: data.diary_count,
            total_reports: data.total_reports,
            pending_reports: data.pending_reports
        };

        for (const [key, value] of Object.entries(map)) {
            const el = document.querySelector(`[data-stat="${key}"] .card-value`);
            if (el && +el.textContent.replace(/,/g, '') !== value) {
                animateValue(el, value);
            }
        }
    }
}

/* =========== 主要初始化函式 =========== */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin page DOMContentLoaded, starting initialization...');
    
    try {
        // 初始化聊天功能
        if (document.getElementById("session-list")) {
            console.log('Initializing chat functionality...');
            initChatFunctionality();
        }

        // 初始化舉報管理功能
        console.log('Initializing report management...');
        initReportManagement();

        // 初始化公告管理功能
        console.log('Initializing announcement management...');
        initAnnouncementManagement();

        // 初始化 Dashboard 功能
        console.log('Initializing dashboard features...');
        initDashboardFeatures();

        // 初始化回饋詳情頁面
        console.log('Initializing report detail handlers...');
        initReportDetailHandlers();

        // 初始化用戶資訊區塊增強功能
        console.log('Initializing user info enhancements...');
        initUserInfoEnhancements();
        formatUserInfo();

        // 初始化統計報表功能
        if (typeof Chart !== 'undefined') {
            console.log('Initializing charts...');
            window.reportStatsManager = new ReportStatsManager();
        }
        
        console.log('All admin page components initialized successfully');
    } catch (error) {
        console.error('Error during admin page initialization:', error);
        console.error('Stack trace:', error.stack);
    }
});

// 頁面卸載時清理資源
window.addEventListener('beforeunload', function() {
    if (window.reportStatsManager) {
        window.reportStatsManager.destroy();
    }
});

// 導出為全局變量（供調試使用）
window.ReportStatsManager = ReportStatsManager;

/* ───────── Report Detail 專用 ───────── */
function initReportDetailHandlers() {
    // 初始化 AI 信心度條動畫
    const confidenceFill = document.querySelector('.confidence-fill');
    if (confidenceFill) {
        const confidence = parseFloat(confidenceFill.dataset.confidence);
        if (!isNaN(confidence)) {
            // 設置寬度百分比
            confidenceFill.style.width = confidence + '%';
            
            // 添加動畫效果
            setTimeout(() => {
                confidenceFill.style.transition = 'width 0.8s ease-out';
                confidenceFill.style.width = confidence + '%';
            }, 100);
        }
    }
}

/* ───────── 用戶資訊區塊增強功能 ───────── */
function initUserInfoEnhancements() {
    const userInfoSection = document.querySelector('.user-info-section');
    if (!userInfoSection) return;

    // 為用戶頭像添加點擊複製郵箱功能
    const userAvatar = userInfoSection.querySelector('.user-avatar');
    const userEmail = userInfoSection.querySelector('.user-email');
    
    if (userAvatar && userEmail) {
        userAvatar.style.cursor = 'pointer';
        userAvatar.title = '點擊複製郵箱地址';
        
        userAvatar.addEventListener('click', async function() {
            const emailText = userEmail.textContent.trim();
            
            try {
                await navigator.clipboard.writeText(emailText);
                
                // 顯示複製成功提示
                showCopySuccess(userAvatar);
                
            } catch (err) {
                console.warn('無法使用 Clipboard API，使用備用方法');
                fallbackCopyEmail(emailText);
            }
        });
    }

    // 為用戶郵箱添加點擊複製功能
    if (userEmail) {
        userEmail.style.cursor = 'pointer';
        userEmail.title = '點擊複製郵箱地址';
        
        userEmail.addEventListener('click', async function() {
            const emailText = userEmail.textContent.trim();
            
            try {
                await navigator.clipboard.writeText(emailText);
                showCopySuccess(userEmail);
            } catch (err) {
                fallbackCopyEmail(emailText);
            }
        });
    }

    // 為用戶資訊區塊添加懸停效果
    addHoverEffects(userInfoSection);
}

// 顯示複製成功提示
function showCopySuccess(element) {
    const originalContent = element.innerHTML;
    const originalTitle = element.title;
    
    // 創建成功提示
    const successIndicator = document.createElement('div');
    successIndicator.innerHTML = '✅';
    successIndicator.style.cssText = `
        position: absolute;
        top: -5px;
        right: -5px;
        background: var(--secondary);
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        animation: copySuccess 0.5s ease-out;
        z-index: 10;
    `;
    
    // 添加動畫樣式
    if (!document.getElementById('copy-success-styles')) {
        const style = document.createElement('style');
        style.id = 'copy-success-styles';
        style.textContent = `
            @keyframes copySuccess {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            .copy-success-shake {
                animation: copyShake 0.3s ease-in-out;
            }
            @keyframes copyShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 為父元素添加相對定位
    element.style.position = 'relative';
    element.appendChild(successIndicator);
    element.title = '已複製到剪貼板！';
    element.classList.add('copy-success-shake');
    
    // 移除提示
    setTimeout(() => {
        if (successIndicator.parentNode) {
            successIndicator.remove();
        }
        element.title = originalTitle;
        element.classList.remove('copy-success-shake');
    }, 2000);
}

// 備用複製方法（針對舊瀏覽器）
function fallbackCopyEmail(emailText) {
    const textArea = document.createElement('textarea');
    textArea.value = emailText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        // 簡單提示
        alert('郵箱地址已複製到剪貼板：' + emailText);
    } catch (err) {
        console.error('複製失敗：', err);
        // 提示手動複製
        prompt('請手動複製郵箱地址：', emailText);
    }
    
    document.body.removeChild(textArea);
}

// 添加懸停效果
function addHoverEffects(userInfoSection) {
    const userDetails = userInfoSection.querySelector('.user-details');
    if (!userDetails) return;
    
    // 添加懸停時的微妙動畫
    userDetails.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
        this.style.transition = 'transform 0.3s ease';
    });
    
    userDetails.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
}

// 格式化用戶資訊顯示
function formatUserInfo() {
    const userEmail = document.querySelector('.user-email');
    const userBadges = document.querySelectorAll('.user-badge');
    
    // 為長郵箱地址添加省略號處理
    if (userEmail && userEmail.textContent.length > 25) {
        userEmail.title = userEmail.textContent;
        const email = userEmail.textContent;
        const atIndex = email.indexOf('@');
        if (atIndex > 10) {
            const username = email.substring(0, 8) + '...';
            const domain = email.substring(atIndex);
            userEmail.innerHTML = `${username}${domain}`;
        }
    }
    
    // 為徽章添加動畫效果
    userBadges.forEach((badge, index) => {
        badge.style.animationDelay = (index * 0.1) + 's';
        badge.classList.add('badge-fade-in');
    });
    
    // 添加徽章動畫樣式
    if (!document.getElementById('badge-animations')) {
        const style = document.createElement('style');
        style.id = 'badge-animations';
        style.textContent = `
            .badge-fade-in {
                animation: badgeFadeIn 0.5s ease-out forwards;
                opacity: 0;
            }
            @keyframes badgeFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}
