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

// 統計報表管理器
class ReportStatsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        // 等待 DOM 載入完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeCharts());
        } else {
            this.initializeCharts();
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
    if (document.querySelector('.report-row') || document.querySelector('.report-card')) {
        initStatCounters();
        initTableInteractions();
        initQuickActions();
        initReportListHandlers();
        initStatusFilters?.();
        initPagination?.();
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
    // 狀態篩選
    const sel = document.getElementById('status-filter');
    sel?.addEventListener('change', () => filterByStatus(sel.value));
    // Modal 關閉 / 送出
    document.querySelector('[data-close-modal]')?.addEventListener('click', closeQuickModal);
    document.querySelector('[data-submit-modal]')?.addEventListener('click', submitQuickUpdate);
    document.getElementById('quickUpdateModal')?.addEventListener('click', e => {
        if (e.target.id === 'quickUpdateModal') closeQuickModal();
    });
}

function filterByStatus(status) { 
    window.location.href = `?status=${status}`; 
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
function initStatusFilters() { }
function initPagination() { }

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
    // 初始化聊天功能
    if (document.getElementById("session-list")) {
        initChatFunctionality();
    }

    // 初始化舉報管理功能
    initReportManagement();

    // 初始化公告管理功能
    initAnnouncementManagement();

    // 初始化 Dashboard 功能
    initDashboardFeatures();

    // 初始化統計報表功能
    if (typeof Chart !== 'undefined') {
        window.reportStatsManager = new ReportStatsManager();
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
