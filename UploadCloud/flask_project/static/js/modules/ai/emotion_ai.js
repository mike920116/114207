/**
 * 情緒AI聊天助手 JavaScript - 簡化版本
 * 移除WebSocket依賴，改用同步HTTP通訊
 * 基於backup_chatbot的簡潔設計
 */
function forceSystemDarkMode() {
    // 檢查當前是否已經是深藍主題
    if (!document.body.classList.contains('dark-mode')) {
        // 切換到深藍主題
        document.body.classList.add('dark-mode');
        // 更新localStorage以保持狀態
        localStorage.setItem('theme', 'dark');
        console.log('🌙 自動切換系統主題到深藍色模式');
    } else {
        console.log('🌙 系統已經是深藍主題');
    }
}

// ===== 原型C背景動畫系統 =====
// 初始化完整的背景動畫系統
function initFullParticleSystem() {
    const particleBackground = document.getElementById('particleBackground');
    if (!particleBackground) return;
    
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
    
    console.log('✨ 背景粒子系統初始化完成：50個浮動粒子 + 150顆星星');
}

// ===== 簡化的聊天功能 =====

// 情緒顏色對應（簡化版）
const emotionColors = {
    '開心': '#FFD700', '快樂': '#FF6B6B', '興奮': '#FF8C00',
    '滿足': '#32CD32', '平靜': '#87CEEB', '放鬆': '#98FB98',
    '焦慮': '#FF6347', '擔心': '#DDA0DD', '悲傷': '#4682B4',
    '沮喪': '#708090', '憤怒': '#DC143C', '挫折': '#B22222',
    '困惑': '#DAA520', '驚訝': '#FF69B4', '好奇': '#20B2AA',
    '友善': '#90EE90', '理解': '#9370DB', '關心': '#FFA07A',
    '支持': '#98FB98', '默認': '#B0C4DE'
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 自動切換系統主題到深藍色（僅在emotion AI模組中生效）
    forceSystemDarkMode();
    
    // 初始化背景粒子系統
    initFullParticleSystem();
    
    // 初始化側邊欄功能
    initSidebarToggle();
    
    // 初始化主題控制（僅視覺主題）
    initThemeControls();
    
    // 初始化主題切換展開/收合功能
    initThemeToggle();
    
    // 初始化時間管理系統（日夜模式）
    initTimeManagement();
    
    // 初始化日期顯示
    initDateDisplay();
    
    // 初始化聊天功能
    bindEvents();
    
    // 初始化收藏功能
    initFavoritesSystem();
    
    // 初始化洞察補充預設訊息切換功能
    initDefaultInsightMessages();
    
    // 初始化目標完成動畫系統
    initGoalCompletionSystem();
    
    // 初始化情緒圖表系統
    initEmotionCharts();
    
    console.log('✅ 情緒AI聊天系統初始化完成（包含圖表功能）');
});

// 綁定事件
function bindEvents() {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const emotionToggleBtn = document.getElementById('emotion-toggle-btn');
    const closeEmotionPanel = document.getElementById('close-emotion-panel');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (userInput) {
        // Enter鍵處理：單獨Enter換行，Shift+Enter送出訊息
        userInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Shift+Enter：送出訊息
                    e.preventDefault();
                    sendMessage();
                }
                // 單獨Enter：允許換行（不需preventDefault）
            }
        });
        
        // 自動調整高度
        userInput.addEventListener('input', autoResizeTextarea);
        
        // 初始化高度
        autoResizeTextarea.call(userInput);
    }
    
    if (emotionToggleBtn) {
        emotionToggleBtn.addEventListener('click', toggleEmotionPanel);
    }
    
    if (closeEmotionPanel) {
        closeEmotionPanel.addEventListener('click', hideEmotionPanel);
    }
}

// 自動調整textarea高度
function autoResizeTextarea() {
    const textarea = this;
    
    // 重置高度到最小值以正確計算scrollHeight
    textarea.style.height = 'auto';
    
    // 計算需要的高度
    const scrollHeight = textarea.scrollHeight;
    const minHeight = window.innerWidth <= 768 ? 40 : 54; // 響應式最小高度，對應CSS設定
    const maxHeight = window.innerWidth <= 768 ? 120 : 200; // 響應式最大高度
    
    // 設定新高度
    if (scrollHeight <= maxHeight) {
        textarea.style.height = Math.max(scrollHeight, minHeight) + 'px';
        textarea.style.overflowY = 'hidden'; // 內容未超過時隱藏滾動條
    } else {
        textarea.style.height = maxHeight + 'px';
        textarea.style.overflowY = 'auto'; // 內容超過時顯示滾動條
    }
    
    console.log(`📏 自動調整高度: ${textarea.style.height} (scrollHeight: ${scrollHeight}px, 滾動條: ${textarea.style.overflowY})`);
}

// 發送訊息 - 增強版本，支援等待動畫
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (!message) {
        alert('請輸入訊息內容');
        return;
    }
    
    console.log('📤 發送訊息:', message);
    
    // 顯示用戶訊息並返回DOM元素
    const userMessageElement = addUserMessage(message);
    userInput.value = '';
    
    // 為用戶訊息添加等待分析動畫
    addWaitingAnalysisToUser(userMessageElement);
    
    // 重置輸入框高度
    autoResizeTextarea.call(userInput);
    
    // 顯示打字指示器
    showTypingIndicator();
    
    // 顯示載入狀態
    showLoadingButton();
    
    try {
        // 發送到後端並等待響應
        const response = await fetch('/ai/emotion/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        console.log('📥 收到回應:', data);
        
        if (data.success) {
            // 隱藏打字指示器
            hideTypingIndicator();
            
            // 解析新的JSON格式
            const mainPayload = data.main_payload || {};
            const sidebarReco = data.sidebar_reco || null;
            
            // 獲取AI回覆內容（適應新格式）
            const aiResponse = mainPayload.response_from_ai || data.ai_response || '抱歉，我無法處理您的請求。';
            
            // 處理用戶情緒分析（適應新格式）
            const userAnalysis = mainPayload.analysis_for_user || data.analysis_for_user;
            if (userAnalysis) {
                setTimeout(() => {
                    updateEmotionAnalysisHTML(userMessageElement, userAnalysis, 'user');
                }, 500); // 延遲讓用戶看到等待動畫
            }
            
            // 創建AI訊息並添加等待分析動畫
            const aiAnalysis = mainPayload.analysis_for_ai || data.analysis_for_ai;
            if (aiAnalysis) {
                // 創建基本的AI訊息
                const aiMessageElement = addAIMessage(aiResponse);
                
                // 為AI訊息添加等待分析動畫
                addWaitingAnalysisToAI(aiMessageElement);
                
                setTimeout(() => {
                    updateEmotionAnalysisHTML(aiMessageElement, aiAnalysis, 'ai');
                    
                    // 更新情緒面板
                    updateEmotionPanel(userAnalysis, aiAnalysis);
                }, 800);
            } else {
                // 沒有AI情緒分析，直接顯示普通AI訊息
                addAIMessage(aiResponse);
                
                // 更新情緒面板（只有用戶分析）
                if (userAnalysis) {
                    updateEmotionPanel(userAnalysis, null);
                }
            }
            
            // 處理側邊欄推薦（新功能）- 總是呼叫，即使sidebarReco為空也會使用回滾訊息
            updateInsightPanel(sidebarReco);
            
            console.log('✅ 訊息處理完成');
        } else {
            hideTypingIndicator();
            console.error('❌ 錯誤:', data.error);
            addErrorMessage(data.error || '發生未知錯誤');
            
            // 即使出錯也要呼叫洞察補充更新，提供回滾訊息
            updateInsightPanel(null);
        }
        
    } catch (error) {
        hideTypingIndicator();
        console.error('❌ 網路錯誤:', error);
        addErrorMessage('連接伺服器時發生錯誤，請稍後再試。');
        
        // 網路錯誤時也提供回滾訊息
        updateInsightPanel(null);
    } finally {
        hideLoadingButton();
    }
}

// 顯示打字指示器 - 修改為在chat-box內部顯示
function showTypingIndicator() {
    // 先移除已存在的思考訊息（避免重複）
    hideTypingIndicator();
    
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    // 創建AI思考訊息元素
    const typingMessage = document.createElement('div');
    typingMessage.className = 'message ai typing-message';
    typingMessage.id = 'dynamic-typing-indicator';
    
    const time = new Date().toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    typingMessage.innerHTML = `
        <img src="/static/icons/avatars/ai_avatar.png" alt="AI頭像" class="avatar" onerror="this.src='https://placehold.co/40x40/4facfe/ffffff?text=AI'">
        <div class="message-content">
            <div class="name">情緒AI助手</div>
            <div class="typing-text">
                AI正在思考中<span class="loading"></span>
            </div>
            <div class="time">${time}</div>
        </div>
    `;
    
    // 添加到聊天記錄中
    chatBox.appendChild(typingMessage);
    scrollToBottom();
}

// 隱藏打字指示器 - 修改為移除動態創建的思考訊息
function hideTypingIndicator() {
    const dynamicTypingIndicator = document.getElementById('dynamic-typing-indicator');
    if (dynamicTypingIndicator) {
        dynamicTypingIndicator.remove();
    }
}

// 滾動到底部
function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// 添加用戶訊息 - 使用動態頭像
function addUserMessage(content) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const time = new Date().toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // 使用動態用戶頭像或預設頭像
    const userAvatarSrc = window.userAvatarUrl || '/static/icons/avatars/user_avatar.png';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <img src="${userAvatarSrc}" alt="用戶頭像" class="avatar" onerror="this.src='https://placehold.co/40x40/ff6b6b/ffffff?text=U'">
        <div class="message-content">
            <div class="name">您</div>
            <p>${content}</p>
            <div class="time">${time}</div>
        </div>
    `;
    
    chatBox.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv; // 返回DOM元素供後續使用
}

// 添加AI訊息 - 只處理AI的情緒分析
// 新增：為AI訊息添加等待中的情緒分析（使用與用戶相同的方法）
function addWaitingAnalysisToAI(messageDiv) {
    const messageContent = messageDiv.querySelector('.message-content p');
    if (messageContent) {
        const waitingHTML = createWaitingEmotionHTML('ai');
        messageContent.insertAdjacentHTML('beforeend', waitingHTML);
        
        // 觸發動畫
        setTimeout(() => {
            const analysisBox = messageContent.querySelector('.analysis-box:last-child');
            if (analysisBox) {
                analysisBox.classList.add('pop-in');
            }
        }, 100);
    }
}

function addAIMessage(content, userAnalysis = null, aiAnalysis = null) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const time = new Date().toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    // 創建基本的AI訊息結構，不包含情緒分析
    let messageHTML = `
        <img src="/static/icons/avatars/ai_avatar.png" alt="AI頭像" class="avatar" onerror="this.src='https://placehold.co/40x40/4facfe/ffffff?text=AI'">
        <div class="message-content">
            <div class="name">情緒AI助手</div>
            <p>${content}</p>
            <div class="time">${time}</div>
        </div>
    `;
    
    messageDiv.innerHTML = messageHTML;
    chatBox.appendChild(messageDiv);
    
    scrollToBottom();
    return messageDiv; // 返回訊息元素以便後續更新
}

// 新增：顯示帶等待動畫的AI訊息（只包含AI情緒分析）
// 新增：更新AI訊息的情緒分析數據
function updateAIMessageEmotion(messageElement, userAnalysis, aiAnalysis) {
    if (userAnalysis && userAnalysis.primary_emotions) {
        updateEmotionAnalysisHTML(messageElement, userAnalysis, 'user');
    }
    
    if (aiAnalysis && aiAnalysis.primary_emotions) {
        updateEmotionAnalysisHTML(messageElement, aiAnalysis, 'ai');
    }
}

// 創建情緒分析HTML - 增強版本，支援等待動畫
function createEmotionAnalysisHTML(analysis, type) {
    if (!analysis || !analysis.primary_emotions) return '';
    
    const emotions = analysis.primary_emotions.slice(0, 3); // 只顯示前3個情緒
    
    let html = `<div class="analysis-box analysis-${type}">`;
    html += '<div class="emotions-container">';
    
    emotions.forEach(emotion => {
        html += `<span class="emotion-badge">${emotion.emotion} ${emotion.percentage}%</span>`;
    });
    
    html += '</div>';
    html += '<div class="emotion-meta">';
    html += `<span>📊 信心: ${analysis.confidence}/10</span>`;
    html += `<span>🎭 基調: ${analysis.overall_tone}</span>`;
    if (type === 'user') {
        html += '<span>👤 您的情緒</span>';
    } else {
        html += '<span>🤖 AI情緒</span>';
    }
    html += '</div>';
    html += '</div>';
    
    return html;
}

// 添加等待情緒分析的HTML - 新增功能
function createWaitingEmotionHTML(type) {
    let html = `<div class="analysis-box analysis-${type} waiting-analysis">`;
    html += '<div class="emotions-container">';
    
    // 添加3個等待中的情緒標籤
    for (let i = 0; i < 3; i++) {
        html += `<span class="emotion-badge waiting">
                    <span class="question-mark">???</span>
                 </span>`;
    }
    
    html += '</div>';
    html += '<div class="emotion-meta">';
    html += `<span>🔄 分析中...</span>`;
    if (type === 'user') {
        html += '<span>👤 分析您的情緒</span>';
    } else {
        html += '<span>🤖 分析AI情緒</span>';
    }
    html += '</div>';
    html += '</div>';
    
    return html;
}

// 新增：為用戶訊息添加等待分析
function addWaitingAnalysisToUser(userMessageElement) {
    if (!userMessageElement) return;
    
    const messageContent = userMessageElement.querySelector('.message-content');
    if (!messageContent) return;
    
    const textP = messageContent.querySelector('p');
    if (!textP) return;
    
    // 檢查是否已經有等待分析框
    const existingWaiting = userMessageElement.querySelector('.analysis-box.waiting-analysis');
    if (existingWaiting) return;
    
    // 創建等待分析HTML
    const waitingHTML = createWaitingEmotionHTML('user');
    textP.insertAdjacentHTML('beforeend', waitingHTML);
    
    // 觸發淡入動畫
    setTimeout(() => {
        const analysisBox = textP.querySelector('.analysis-box.waiting-analysis');
        if (analysisBox) {
            analysisBox.classList.add('pop-in');
        }
    }, 100);
    
    scrollToBottom();
}

// 更新現有的情緒分析HTML - 新增功能  
function updateEmotionAnalysisHTML(messageElement, analysis, type) {
    const waitingBox = messageElement.querySelector(`.analysis-box.analysis-${type}.waiting-analysis`);
    if (!waitingBox) return;
    
    // 移除等待狀態
    waitingBox.classList.remove('waiting-analysis');
    
    // 更新情緒標籤
    const emotionsContainer = waitingBox.querySelector('.emotions-container');
    if (emotionsContainer && analysis && analysis.primary_emotions) {
        const emotions = analysis.primary_emotions.slice(0, 3);
        emotionsContainer.innerHTML = emotions.map(emotion => 
            `<span class="emotion-badge">${emotion.emotion} ${emotion.percentage}%</span>`
        ).join('');
    }
    
    // 更新元數據
    const emotionMeta = waitingBox.querySelector('.emotion-meta');
    if (emotionMeta && analysis) {
        emotionMeta.innerHTML = `
            <span>📊 信心: ${analysis.confidence}/10</span>
            <span>🎭 基調: ${analysis.overall_tone}</span>
            ${type === 'user' ? '<span>👤 您的情緒</span>' : '<span>🤖 AI情緒</span>'}
        `;
    }
    
    // 觸發完成動畫
    setTimeout(() => {
        const badges = waitingBox.querySelectorAll('.emotion-badge');
        badges.forEach(badge => {
            badge.classList.add('animation-complete');
        });
    }, 100);
}

// 添加錯誤訊息
function addErrorMessage(content) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    
    const time = new Date().toLocaleString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <img src="/static/icons/avatars/ai_avatar.png" alt="AI頭像" class="avatar" onerror="this.src='https://placehold.co/40x40/ff6b6b/ffffff?text=❌'">
        <div class="message-content">
            <div class="name">系統</div>
            <p>錯誤：${content}</p>
            <div class="time">${time}</div>
        </div>
    `;
    
    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

// ===== 圖表管理系統 =====

// 全域變數：存儲當前圖表實例和設定
let emotionChart = null;
let currentChartType = localStorage.getItem('emotionAI_chartType') || 'bar';

/**
 * 初始化圖表系統
 */
function initEmotionCharts() {
    // 檢查 Chart.js 是否載入
    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js 未載入，圖表功能將不可用');
        return false;
    }
    
    // 綁定圖表切換按鈕事件
    const barBtn = document.getElementById('chart-type-bar');
    const pieBtn = document.getElementById('chart-type-pie');
    
    if (barBtn) {
        barBtn.addEventListener('click', () => switchChartType('bar'));
    }
    
    if (pieBtn) {
        pieBtn.addEventListener('click', () => switchChartType('pie'));
    }
    
    // 設定初始按鈕狀態
    updateChartTypeButtons();
    
    console.log('📊 圖表系統初始化完成');
    return true;
}

/**
 * 切換圖表類型
 * @param {string} type - 'bar' 或 'pie'
 */
function switchChartType(type) {
    if (currentChartType === type) return;
    
    currentChartType = type;
    localStorage.setItem('emotionAI_chartType', type);
    
    // 更新按鈕狀態
    updateChartTypeButtons();
    
    // 重新渲染圖表（如果有數據）
    const chartContainer = document.getElementById('emotion-chart-container');
    if (chartContainer && chartContainer.style.display !== 'none') {
        // 從當前顯示的資料重新生成圖表
        regenerateCurrentChart();
    }
    
    console.log(`📊 切換圖表類型到: ${type}`);
}

/**
 * 更新圖表切換按鈕狀態
 */
function updateChartTypeButtons() {
    const barBtn = document.getElementById('chart-type-bar');
    const pieBtn = document.getElementById('chart-type-pie');
    
    if (barBtn && pieBtn) {
        barBtn.classList.toggle('active', currentChartType === 'bar');
        pieBtn.classList.toggle('active', currentChartType === 'pie');
    }
}

/**
 * 創建情緒圖表
 * @param {Array} emotionsData - 情緒數據陣列
 * @param {string} type - 圖表類型 ('bar' 或 'pie')
 */
function createEmotionChart(emotionsData, type = 'bar') {
    const canvas = document.getElementById('emotion-chart');
    if (!canvas || !emotionsData || emotionsData.length === 0) {
        console.warn('⚠️ 無法創建圖表：畫布或數據不存在');
        return null;
    }
    
    // 銷毀現有圖表
    if (emotionChart) {
        emotionChart.destroy();
        emotionChart = null;
    }
    
    const ctx = canvas.getContext('2d');
    
    // 準備數據
    const labels = emotionsData.map(e => e.emotion);
    const data = emotionsData.map(e => parseFloat(e.percentage));
    const colors = emotionsData.map(e => getEmotionColor(e.emotion));
    
    const chartConfig = {
        type: type === 'pie' ? 'doughnut' : 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '情緒比例 (%)',
                data: data,
                backgroundColor: colors.map(color => color + '80'), // 80% 透明度
                borderColor: colors,
                borderWidth: 2,
                hoverBackgroundColor: colors.map(color => color + 'CC'), // 更不透明的懸停效果
                hoverBorderWidth: 3
            }]
        },
        options: getChartOptions(type)
    };
    
    try {
        emotionChart = new Chart(ctx, chartConfig);
        console.log(`📊 ${type} 圖表創建成功`);
        return emotionChart;
    } catch (error) {
        console.error('❌ 圖表創建失敗:', error);
        showChartError('圖表渲染失敗');
        return null;
    }
}

/**
 * 獲取圖表配置選項
 * @param {string} type - 圖表類型
 */
function getChartOptions(type) {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: type === 'pie',
                position: 'bottom',
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    padding: 15,
                    usePointStyle: true,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.parsed || context.parsed.y}%`;
                    }
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    };
    
    if (type === 'pie') {
        // 圓餅圖特殊配置
        commonOptions.plugins.tooltip.callbacks.afterLabel = function(context) {
            const emotion = context.label;
            return getEmotionDescription(emotion);
        };
        commonOptions.cutout = '40%'; // 甜甜圈效果
    } else {
        // 直方圖特殊配置
        commonOptions.scales = {
            y: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    callback: function(value) {
                        return value + '%';
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    maxRotation: 45
                }
            }
        };
        commonOptions.plugins.tooltip.callbacks.afterLabel = function(context) {
            return getEmotionDescription(context.label);
        };
    }
    
    return commonOptions;
}

/**
 * 獲取情緒對應顏色
 * @param {string} emotion - 情緒名稱
 */
function getEmotionColor(emotion) {
    // 使用現有的 emotionColors 對照表
    return emotionColors[emotion] || emotionColors['默認'];
}

/**
 * 獲取情緒描述
 * @param {string} emotion - 情緒名稱
 */
function getEmotionDescription(emotion) {
    const descriptions = {
        '開心': '積極正面的情緒狀態',
        '快樂': '愉悅和滿足的感受',
        '興奮': '充滿活力和期待',
        '滿足': '內心平靜和滿意',
        '平靜': '寧靜安詳的狀態',
        '放鬆': '舒緩無壓力的感覺',
        '焦慮': '擔心和不安的情緒',
        '擔心': '對未來的憂慮',
        '悲傷': '低落和失望的心情',
        '沮喪': '挫折和無力感',
        '憤怒': '強烈的不滿情緒',
        '挫折': '遇到阻礙的煩躁',
        '困惑': '不確定和疑惑',
        '驚訝': '意外和驚奇',
        '好奇': '探索和求知的渴望',
        '友善': '溫暖和善意',
        '理解': '同理和領悟',
        '關心': '關愛和照顧',
        '支持': '鼓勵和支撐'
    };
    return descriptions[emotion] || '情緒狀態';
}

/**
 * 顯示圖表載入狀態
 */
function showChartLoading() {
    const container = document.getElementById('emotion-chart-container');
    if (!container) return;
    
    container.innerHTML = '<div class="chart-loading">載入圖表中...</div>';
    container.style.display = 'block';
}

/**
 * 顯示圖表錯誤
 * @param {string} message - 錯誤訊息
 */
function showChartError(message) {
    const container = document.getElementById('emotion-chart-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="chart-error">
            <i class="fas fa-exclamation-triangle"></i>
            <div>${message}</div>
            <button onclick="regenerateCurrentChart()" style="margin-top: 10px; padding: 5px 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 4px; cursor: pointer;">
                重試
            </button>
        </div>
    `;
    container.style.display = 'block';
}

/**
 * 隱藏圖表容器
 */
function hideChart() {
    const container = document.getElementById('emotion-chart-container');
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * 重新生成當前圖表（從最後的數據）
 */
function regenerateCurrentChart() {
    // 這個函式會在需要時從 updateEmotionPanel 中的數據重新生成
    console.log('🔄 嘗試重新生成圖表...');
    // 實際實作將在 updateEmotionPanel 中處理
}

// 更新情緒分析面板
function updateEmotionPanel(userAnalysis, aiAnalysis) {
    const emotionSummary = document.getElementById('emotion-summary');
    if (!emotionSummary) return;
    
    // 儲存最新數據供圖表重新生成使用
    window.lastEmotionData = { userAnalysis, aiAnalysis };
    
    let summaryHTML = '<div class="emotion-panel-section">';
    let chartData = null;
    
    if (userAnalysis) {
        summaryHTML += `
            <h4>您的情緒分析</h4>
            <div class="emotion-details">
                <p><strong>整體基調：</strong>${userAnalysis.overall_tone || '中性'}</p>
                <p><strong>信心度：</strong>${userAnalysis.confidence || '5'}/10</p>
                <div class="emotion-list">
                    ${(userAnalysis.primary_emotions || []).map(e => 
                        `<div class="emotion-item">
                            <span>${e.emotion}</span>
                            <span>${e.percentage}%</span>
                        </div>`
                    ).join('')}
                </div>
            </div>
        `;
        
        // 使用用戶情緒數據作為圖表數據
        if (userAnalysis.primary_emotions && userAnalysis.primary_emotions.length > 0) {
            chartData = userAnalysis.primary_emotions;
        }
    }
    
    if (aiAnalysis) {
        summaryHTML += `
            <h4>AI的情緒回應</h4>
            <div class="emotion-details">
                <p><strong>整體基調：</strong>${aiAnalysis.overall_tone || '中性'}</p>
                <p><strong>信心度：</strong>${aiAnalysis.confidence || '5'}/10</p>
                <div class="emotion-list">
                    ${(aiAnalysis.primary_emotions || []).map(e => 
                        `<div class="emotion-item">
                            <span>${e.emotion}</span>
                            <span>${e.percentage}%</span>
                        </div>`
                    ).join('')}
                </div>
            </div>
        `;
        
        // 如果沒有用戶數據，使用AI情緒數據作為圖表數據
        if (!chartData && aiAnalysis.primary_emotions && aiAnalysis.primary_emotions.length > 0) {
            chartData = aiAnalysis.primary_emotions;
        }
    }
    
    summaryHTML += '</div>';
    emotionSummary.innerHTML = summaryHTML;
    
    // 更新圖表
    updateEmotionChart(chartData);
}

/**
 * 更新情緒圖表
 * @param {Array} emotionsData - 情緒數據
 */
function updateEmotionChart(emotionsData) {
    const container = document.getElementById('emotion-chart-container');
    if (!container) return;
    
    // 如果沒有有效的情緒數據，隱藏圖表
    if (!emotionsData || emotionsData.length === 0) {
        hideChart();
        return;
    }
    
    // 檢查 Chart.js 是否可用
    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js 未載入，無法顯示圖表');
        hideChart();
        return;
    }
    
    // 準備容器
    container.innerHTML = '<canvas id="emotion-chart"></canvas>';
    container.style.display = 'block';
    
    // 短暫延遲確保DOM更新
    setTimeout(() => {
        try {
            createEmotionChart(emotionsData, currentChartType);
        } catch (error) {
            console.error('❌ 圖表更新失敗:', error);
            showChartError('圖表載入失敗，請稍後重試');
        }
    }, 100);
}

/**
 * 重新生成當前圖表（從最後的數據）
 */
function regenerateCurrentChart() {
    if (window.lastEmotionData) {
        updateEmotionPanel(window.lastEmotionData.userAnalysis, window.lastEmotionData.aiAnalysis);
    } else {
        console.warn('⚠️ 沒有可用的情緒數據來重新生成圖表');
    }
}

// 情緒面板顯示/隱藏
function toggleEmotionPanel() {
    const panel = document.getElementById('emotion-analysis-panel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function hideEmotionPanel() {
    const panel = document.getElementById('emotion-analysis-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// 載入狀態管理
function showLoadingButton() {
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        sendBtn.title = '分析中...';
    }
}

function hideLoadingButton() {
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendBtn.title = '發送訊息';
    }
}

// ===== 視覺主題控制系統（與日夜模式分離）=====

/**
 * 套用視覺主題（不影響日夜模式顯示）
 * @param {string} theme 主題名稱
 */
function applyVisualTheme(theme) {
    const body = document.body;
    
    // 移除所有視覺主題類別
    body.classList.remove('day-theme', 'night-theme', 'sunset-theme');
    
    // 添加新視覺主題
    body.classList.add(`${theme}-theme`);
    
    // 更新主題按鈕狀態
    updateThemeButtons(theme);
    
    console.log(`🎨 切換到 ${theme} 視覺主題`);
}

/**
 * 更新主題按鈕狀態
 * @param {string} activeTheme 當前激活的主題
 */
function updateThemeButtons(activeTheme) {
    const buttons = document.querySelectorAll('.theme-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === activeTheme) {
            btn.classList.add('active');
        }
    });
}

/**
 * 初始化視覺主題控制
 */
function initThemeControls() {
    // 設定預設視覺主題為夜晚
    applyVisualTheme('night');
    
    // 綁定主題按鈕事件
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.dataset.theme;
            applyVisualTheme(theme);
        });
    });
    
    console.log('🎨 視覺主題控制系統初始化完成');
}

// ===== 側邊欄收起/展開功能 =====

/**
 * 初始化側邊欄收起/展開功能
 */
function initSidebarToggle() {
    const leftToggle = document.getElementById('leftPanelToggle');
    const rightToggle = document.getElementById('rightPanelToggle');
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    const container = document.querySelector('.emotion-three-column-container');
    
    // 檢查初始螢幕大小並自動收起
    checkAndAutoCollapsePanels();
    
    // 監聽視窗大小變化
    window.addEventListener('resize', checkAndAutoCollapsePanels);
    
    if (leftToggle && leftPanel) {
        leftToggle.addEventListener('click', function() {
            leftPanel.classList.toggle('collapsed');
            updateContainerLayout();
        });
    }
    
    if (rightToggle && rightPanel) {
        rightToggle.addEventListener('click', function() {
            rightPanel.classList.toggle('collapsed');
            updateContainerLayout();
        });
    }
    
    function checkAndAutoCollapsePanels() {
        const windowWidth = window.innerWidth;
        
        // 1100px以下自動收起左側面板
        if (windowWidth <= 1100 && leftPanel && !leftPanel.classList.contains('collapsed')) {
            leftPanel.classList.add('collapsed');
            console.log('📐 自動收起左側面板（螢幕寬度: ' + windowWidth + 'px）');
        }
        
        // 900px以下自動收起右側面板
        if (windowWidth <= 900 && rightPanel && !rightPanel.classList.contains('collapsed')) {
            rightPanel.classList.add('collapsed');
            console.log('📐 自動收起右側面板（螢幕寬度: ' + windowWidth + 'px）');
        }
        
        updateContainerLayout();
    }
    
    function updateContainerLayout() {
        const leftCollapsed = leftPanel?.classList.contains('collapsed') || false;
        const rightCollapsed = rightPanel?.classList.contains('collapsed') || false;
        
        container.classList.remove('left-collapsed', 'right-collapsed', 'both-collapsed');
        
        if (leftCollapsed && rightCollapsed) {
            container.classList.add('both-collapsed');
        } else if (leftCollapsed) {
            container.classList.add('left-collapsed');
        } else if (rightCollapsed) {
            container.classList.add('right-collapsed');
        }
        
        console.log(`📐 側邊欄狀態更新: 左側${leftCollapsed ? '收起' : '展開'}, 右側${rightCollapsed ? '收起' : '展開'}`);
    }
    
    console.log('� 側邊欄收起/展開功能初始化完成');
}

// ===== 時間管理系統（日夜模式）=====

// 預設時間設定
let timeSettings = {
    dayStartHour: 6,
    dayStartMinute: 0,
    nightStartHour: 18,
    nightStartMinute: 0
};

/**
 * 初始化時間管理系統
 */
function initTimeManagement() {
    // 載入儲存的時間設定
    loadTimeSettings();
    
    // 初始化時間設定視窗
    initTimeSettingsModal();
    
    // 立即更新模式顯示
    updateDayNightMode();
    
    // 每分鐘檢查一次時間變化
    setInterval(updateDayNightMode, 60000);
    
    console.log('🕐 時間管理系統初始化完成');
}

/**
 * 載入儲存的時間設定
 */
function loadTimeSettings() {
    const saved = localStorage.getItem('emotionAI_timeSettings');
    if (saved) {
        try {
            timeSettings = { ...timeSettings, ...JSON.parse(saved) };
            console.log('📖 載入時間設定:', timeSettings);
        } catch (e) {
            console.warn('⚠️ 時間設定載入失敗，使用預設值');
        }
    }
}

/**
 * 儲存時間設定
 */
function saveTimeSettings() {
    localStorage.setItem('emotionAI_timeSettings', JSON.stringify(timeSettings));
    console.log('💾 儲存時間設定:', timeSettings);
}

/**
 * 判斷當前是否為日間模式
 * @returns {boolean} true為日間，false為夜間
 */
function isDayTime() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dayStartMinutes = timeSettings.dayStartHour * 60 + timeSettings.dayStartMinute;
    const nightStartMinutes = timeSettings.nightStartHour * 60 + timeSettings.nightStartMinute;
    
    // 如果日間開始時間早於夜間開始時間（正常情況）
    if (dayStartMinutes < nightStartMinutes) {
        return currentMinutes >= dayStartMinutes && currentMinutes < nightStartMinutes;
    } 
    // 如果日間開始時間晚於夜間開始時間（跨午夜情況）
    else {
        return currentMinutes >= dayStartMinutes || currentMinutes < nightStartMinutes;
    }
}

/**
 * 更新日夜模式顯示
 */
function updateDayNightMode() {
    const modeElement = document.getElementById('currentMode');
    if (!modeElement) return;
    
    const isDay = isDayTime();
    const newMode = isDay ? '日間意向' : '夜間反思';
    
    if (modeElement.textContent !== newMode) {
        modeElement.textContent = newMode;
        console.log(`⏰ 時間模式切換: ${newMode}`);
    }
}

/**
 * 初始化時間設定視窗
 */
function initTimeSettingsModal() {
    const settingsBtn = document.getElementById('timeSettingsBtn');
    const modal = document.getElementById('timeSettingsModal');
    const closeBtn = document.getElementById('timeSettingsClose');
    const cancelBtn = document.getElementById('timeSettingsCancel');
    const confirmBtn = document.getElementById('timeSettingsConfirm');
    
    // 開啟設定視窗
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openTimeSettingsModal);
    }
    
    // 關閉設定視窗
    if (closeBtn) {
        closeBtn.addEventListener('click', closeTimeSettingsModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeTimeSettingsModal);
    }
    
    // 確認設定
    if (confirmBtn) {
        confirmBtn.addEventListener('click', saveTimeSettingsFromModal);
    }
    
    // 點擊背景關閉
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-overlay')) {
                closeTimeSettingsModal();
            }
        });
    }
}

/**
 * 開啟時間設定視窗
 */
function openTimeSettingsModal() {
    const modal = document.getElementById('timeSettingsModal');
    
    // 填入當前設定值
    document.getElementById('dayStartHour').value = timeSettings.dayStartHour;
    document.getElementById('dayStartMinute').value = timeSettings.dayStartMinute;
    document.getElementById('nightStartHour').value = timeSettings.nightStartHour;
    document.getElementById('nightStartMinute').value = timeSettings.nightStartMinute;
    
    modal.style.display = 'flex';
    console.log('🔧 開啟時間設定視窗');
}

/**
 * 關閉時間設定視窗
 */
function closeTimeSettingsModal() {
    const modal = document.getElementById('timeSettingsModal');
    modal.style.display = 'none';
    console.log('❌ 關閉時間設定視窗');
}

/**
 * 從視窗儲存時間設定
 */
function saveTimeSettingsFromModal() {
    const dayStartHour = parseInt(document.getElementById('dayStartHour').value);
    const dayStartMinute = parseInt(document.getElementById('dayStartMinute').value);
    const nightStartHour = parseInt(document.getElementById('nightStartHour').value);
    const nightStartMinute = parseInt(document.getElementById('nightStartMinute').value);
    
    // 驗證輸入值
    if (isNaN(dayStartHour) || isNaN(dayStartMinute) || isNaN(nightStartHour) || isNaN(nightStartMinute)) {
        alert('請輸入有效的時間值');
        return;
    }
    
    if (dayStartHour < 0 || dayStartHour > 23 || nightStartHour < 0 || nightStartHour > 23) {
        alert('小時必須在 0-23 之間');
        return;
    }
    
    if (dayStartMinute < 0 || dayStartMinute > 59 || nightStartMinute < 0 || nightStartMinute > 59) {
        alert('分鐘必須在 0-59 之間');
        return;
    }
    
    // 更新設定
    timeSettings = {
        dayStartHour,
        dayStartMinute,
        nightStartHour,
        nightStartMinute
    };
    
    // 儲存設定
    saveTimeSettings();
    
    // 立即更新模式顯示
    updateDayNightMode();
    
    // 關閉視窗
    closeTimeSettingsModal();
    
    console.log('✅ 時間設定已更新:', timeSettings);
}

/**
 * 初始化日期顯示
 */
function initDateDisplay() {
    updateDateDisplay();
    
    // 每天午夜更新日期顯示
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msToMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
        updateDateDisplay();
        // 之後每24小時更新一次
        setInterval(updateDateDisplay, 24 * 60 * 60 * 1000);
    }, msToMidnight);
    
    console.log('📅 日期顯示系統初始化完成');
}

/**
 * 更新日期顯示
 */
function updateDateDisplay() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;
    
    const now = new Date();
    const dateString = now.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    dateElement.textContent = dateString;
    console.log(`📅 日期更新: ${dateString}`);
}

// 全域API暴露（方便開發者在控制台測試）
window.ThemeAPI = {
    switch: applyTheme,
    current: () => {
        if (document.body.classList.contains('day-theme')) return 'day';
        if (document.body.classList.contains('night-theme')) return 'night';
        if (document.body.classList.contains('sunset-theme')) return 'sunset';
        return 'unknown';
    }
};

// ===== 主題切換展開/收合功能 =====
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeControls = document.getElementById('themeControls');
    
    if (!themeToggleBtn || !themeControls) {
        console.warn('⚠️ 主題切換展開/收合元素未找到');
        return;
    }
    
    // 初始狀態為展開
    let isExpanded = true;
    
    themeToggleBtn.addEventListener('click', function() {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            // 展開狀態
            themeControls.classList.remove('collapsed');
            themeToggleBtn.querySelector('i').className = 'fas fa-chevron-up';
            themeToggleBtn.title = '收合主題選項';
        } else {
            // 收合狀態
            themeControls.classList.add('collapsed');
            themeToggleBtn.querySelector('i').className = 'fas fa-chevron-down';
            themeToggleBtn.title = '展開主題選項';
        }
        
        console.log(`🎨 主題切換區域${isExpanded ? '展開' : '收合'}`);
    });
    
    console.log('✅ 主題切換展開/收合功能初始化完成');
}

// ===== 洞察補充功能 =====

/**
 * 初始化洞察補充預設訊息切換功能
 */
function initDefaultInsightMessages() {
    // 清空現有內容
    const insightContent = document.getElementById('insightContent');
    if (!insightContent) {
        console.warn('⚠️ 洞察補充容器未找到');
        return;
    }
    
    // 移除預設的placeholder
    insightContent.innerHTML = '';
    
    // 預設訊息內容
    const defaultMessages = [
        "我會在這統整我們討論的內容，或說一些天馬行空探索的小短話！",
        "你是第一次來嗎？是的話，不妨可以嘗試一下\"開始使用導覽\"！"
    ];
    
    let currentIndex = 0;
    
    // 創建固定的預設訊息泡泡（只創建一次）
    const defaultMessageHTML = `
        <div class="insight-message-bubble default-insight-message" id="defaultInsightMessage">
            <div class="insight-header">
                <div class="insight-avatar">💭</div>
                <div class="insight-name">洞察引導</div>
            </div>
            <div class="insight-bubble">
                <div class="insight-summary default-insight-text" id="defaultInsightText">
                    ${defaultMessages[currentIndex]}
                </div>
                <div class="insight-time">引導訊息</div>
                <div class="recommendation-analysis">
                    <div class="reco-tags-container">
                                    <div class="reco-item" data-id="guide_start" data-unique-code="guide_start" title="了解情緒AI的基本功能和使用方法">
                            <div class="reco-content">
                                <span class="reco-type">📖</span>
                                <div class="reco-details">
                                    <div class="reco-title">開始使用導覽</div>
                                    <div class="reco-desc">了解情緒AI的基本功能和使用方法</div>
                                </div>
                            </div>
                                <button class="add-to-favorites" data-id="guide_start" data-type="guide" data-title="${encodeURIComponent('開始使用導覽')}" data-desc="${encodeURIComponent('了解情緒AI的基本功能和使用方法')}" title="加入收藏">
                                    <i class="fas fa-plus"></i>
                                </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加預設訊息泡泡
    insightContent.innerHTML = defaultMessageHTML;
    
    // 設置5秒自動切換文字內容（不創建新泡泡）
    setInterval(() => {
        currentIndex = (currentIndex + 1) % defaultMessages.length;
        switchDefaultMessageContent(defaultMessages[currentIndex]);
    }, 5000);
    
    console.log('💡 洞察補充預設訊息切換功能已啟動，每5秒在同一泡泡中切換文字');

    // 事件委派：處理動態生成的「加入收藏」按鈕
    insightContent.addEventListener('click', function(e) {
        const btn = e.target.closest('.add-to-favorites');
        if (!btn) return;
        e.stopPropagation();

        try {
            const recoItem = btn.closest('.reco-item');
            if (!recoItem) {
                console.warn('⚠️ 找不到對應的 .reco-item');
                return;
            }

            const uniqueCode = recoItem.getAttribute('data-unique-code');
            const type = btn.getAttribute('data-type') || 'misc';
            const title = btn.getAttribute('data-title') ? decodeURIComponent(btn.getAttribute('data-title')) : '未知標題';
            const desc = btn.getAttribute('data-desc') ? decodeURIComponent(btn.getAttribute('data-desc')) : '';

            if (!uniqueCode) {
                console.warn('⚠️ 加入收藏按鈕缺少 data-unique-code');
                return;
            }

            // 傳遞 uniqueCode 作為主鍵
            addToFavorites(uniqueCode, type, title, desc);
        } catch (err) {
            console.error('❌ 處理加入收藏按鈕時發生錯誤:', err);
        }
    });
}

/**
 * 切換預設訊息的文字內容（淡出淡入動畫）
 * @param {string} newContent - 新的文字內容
 */
function switchDefaultMessageContent(newContent) {
    const textElement = document.getElementById('defaultInsightText');
    if (!textElement) return;
    
    // 添加淡出效果
    textElement.classList.add('fade-out');
    
    // 等待淡出動畫完成後更新文字並淡入
    setTimeout(() => {
        textElement.textContent = newContent;
        textElement.classList.remove('fade-out');
        textElement.classList.add('fade-in');
        
        // 移除淡入class，準備下次動畫
        setTimeout(() => {
            textElement.classList.remove('fade-in');
        }, 500);
    }, 250); // 淡出動畫的一半時間
    
    console.log(`💭 預設訊息文字已切換: ${newContent.substring(0, 20)}...`);
}

/**
 * 添加新的洞察訊息（保留歷史記錄，不影響預設訊息）
 * @param {string} content - 訊息內容
 * @param {string} icon - 頭像圖標
 * @param {string} name - 發送者名稱
 * @param {Array} items - 推薦項目（可選）
 */
function addInsightMessage(content, icon = '🧠', name = '洞察AI助手', items = null) {
    const insightContent = document.getElementById('insightContent');
    if (!insightContent) return;
    
    // 跳過預設引導訊息，避免重複添加
    if (icon === '💭' && name === '洞察引導') {
        console.log('⚠️ 跳過預設引導訊息，避免干擾固定預設訊息泡泡');
        return;
    }
    
    // 創建訊息HTML
    const messageHTML = `
        <div class="insight-message-bubble">
            <div class="insight-header">
                <div class="insight-avatar">${icon}</div>
                <div class="insight-name">${name}</div>
            </div>
            <div class="insight-bubble">
                <div class="insight-summary">
                    ${content}
                </div>
                <div class="insight-time">${new Date().toLocaleTimeString('zh-TW', {hour: '2-digit', minute: '2-digit'})}</div>
                ${items ? `
                    <div class="recommendation-analysis">
                        <div class="reco-tags-container">
                            ${items.map(item => `
                                        <div class="reco-item ${getItemClass(item.type)}" data-unique-code="${item.UniqueCode || ''}" title="${item.desc}">
                                    <div class="reco-content">
                                        <span class="reco-type">${getTypeIcon(item.type)}</span>
                                        <div class="reco-details">
                                            <div class="reco-title">${item.title}</div>
                                            <div class="reco-desc">${item.desc}</div>
                                        </div>
                                    </div>
                                    ${item.addable ? `
                                        <button class="add-to-favorites" data-type="${item.type}" data-title="${encodeURIComponent(item.title)}" data-desc="${encodeURIComponent(item.desc)}" title="加入收藏">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // 添加新訊息到容器中（追加而不是替換）
    insightContent.insertAdjacentHTML('beforeend', messageHTML);
    
    // 觸發動畫效果
    const newMessage = insightContent.lastElementChild;
    if (newMessage) {
        newMessage.style.opacity = '0';
        newMessage.style.transform = 'translateY(15px)';
        
        setTimeout(() => {
            newMessage.style.transition = 'all 0.5s ease';
            newMessage.style.opacity = '1';
            newMessage.style.transform = 'translateY(0)';
        }, 50);
    }
    
    // 自動滾動到最新訊息
    insightContent.scrollTop = insightContent.scrollHeight;
    
    console.log(`💡 新增洞察訊息: ${content.substring(0, 30)}...`);
}

/**
 * 生成一個短暫的唯一識別碼（10 位 base62），用於前端暫存 UniqueCode
 */
function generateUniqueCode(length = 10) {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const array = new Uint32Array(length);
    if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(array);
    } else {
        // fallback（雖然不建議）
        for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 0xffffffff);
    }
    let uniqueCode = '';
    for (let i = 0; i < length; i++) {
        uniqueCode += alphabet[array[i] % alphabet.length];
    }
    return uniqueCode;
}

/**
 * 更新洞察補充面板（修改為添加而非替換）
 * @param {Object} sidebarReco - 側邊欄推薦數據
 */
function updateInsightPanel(sidebarReco) {
    if (!sidebarReco || !sidebarReco.items || sidebarReco.items.length === 0) {
        console.warn('⚠️ 側邊欄推薦數據為空，使用回滾訊息');
        // 提供回滾訊息，如附圖所示
        const fallbackReco = {
            summary: '根據您的情緒狀態，為您推薦以下內容',
            items: [
                {
                    id: 'fallback_emotion_mgmt',
                    UniqueCode: 'fallback_emotion_mgmt',
                    type: 'psychology',
                    title: '情緒管理技巧',
                    desc: '學習基本的情緒調節方法',
                    addable: true
                },
                {
                    id: 'fallback_mindfulness',
                    UniqueCode: 'fallback_mindfulness',
                    type: 'meditation',
                    title: '正念練習',
                    desc: '培養當下意識，提升情緒穩定性',
                    addable: true
                }
            ]
        };
        
        // 使用回滾訊息
        addInsightMessage(
            fallbackReco.summary,
            '🧠',
            '洞察AI助手',
            fallbackReco.items
        );
        
        console.log('💡 洞察補充面板已使用回滾訊息更新');
        return;
    }
    
    // 在渲染之前，為每個 item 補上 UniqueCode（若尚未存在）
    try {
        sidebarReco.items = (sidebarReco.items || []).map(item => {
            // 保留舊的 id 欄位不變，但新增一個不易衝突的 UniqueCode 欄位
            if (!item.UniqueCode) {
                item.UniqueCode = generateUniqueCode();
            }
            return item;
        });
    } catch (e) {
        console.warn('⚠️ 為側邊欄項目補 UniqueCode 時發生錯誤:', e);
    }

    // 使用新的addInsightMessage函數來添加訊息（項目現在會包含 UniqueCode）
    addInsightMessage(
        sidebarReco.summary,
        '🧠',
        '洞察AI助手',
        sidebarReco.items
    );
    
    console.log('💡 洞察補充面板已更新，包含 ' + sidebarReco.items.length + ' 個推薦項目');
}

/**
 * 根據項目類型返回對應的CSS類別
 * @param {string} type - 項目類型
 * @returns {string} - 對應的CSS類別
 */
function getItemClass(type) {
    // AI相關項目使用藍紫色系，其他使用青綠色系
    const aiTypes = ['psychology', 'meditation', 'article'];
    return aiTypes.includes(type) ? 'ai-type' : '';
}

/**
 * 根據類型返回對應圖標 - 增強版本支援自定義主題圖標
 * @param {string} type - 項目類型
 * @returns {string} - 對應的圖標
 */
function getTypeIcon(type) {
    // 先檢查是否有自定義圖標
    const customIcons = JSON.parse(localStorage.getItem('emotionAI_customIcons') || '{}');
    if (customIcons[type]) {
        return customIcons[type];
    }
    
    // 預設圖標
    const icons = {
        'book': '📚',
        'movie': '🎬', 
        'goal': '🎯',
        'psychology': '🧠',
        'music': '🎵',
        'activity': '🏃',
        'meditation': '🧘',
        'article': '📰',
        'game': '🎮',
        'podcast': '🎧',
        'course': '🎓',
        'recipe': '🍳',
        'guide': '📖',
        'health': '🏥',
        'lifestyle': '🌟',
        'productivity': '⚡',
        'creativity': '🎨',
        'relationship': '💞',
        'finance': '💰',
        'travel': '✈️',
        'hobby': '🎪',
        'learning': '🧑‍🎓',
        'spirituality': '🕯️',
        'science': '🔬',
        'technology': '💻',
        'art': '🎭',
        'nature': '🌿',
        'sports': '⚽',
        'food': '🍽️',
        'entertainment': '🎊'
    };
    return icons[type] || '📝';
}

/**
 * 轉義引號以避免HTML屬性錯誤
 * @param {string} str - 需要轉義的字符串
 * @returns {string} - 轉義後的字符串
 */
function escapeQuotes(str) {
    return str.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
}

// ===== 收藏功能 - 增強版本支援無限制主題和項目 =====

/**
 * 初始化收藏系統
 */
function initFavoritesSystem() {
    // 載入並顯示已存儲的收藏項目
    updateFavoritesDrawer();
    
    // 初始化收藏管理工具
    initFavoritesManagement();
    
    // 定期清理和優化localStorage
    optimizeLocalStorage();
    
    console.log('❤️ 收藏系統初始化完成 - 支援無限制主題和項目');
}

/**
 * 初始化收藏管理工具
 */
function initFavoritesManagement() {
    // 創建收藏管理工具欄
    const favoritesContent = document.getElementById('favoritesContent');
    if (!favoritesContent) return;
    
    // 檢查是否已有管理工具欄
    if (document.getElementById('favoritesToolbar')) return;
    
    const toolbar = document.createElement('div');
    toolbar.id = 'favoritesToolbar';
    toolbar.className = 'favorites-toolbar';
    toolbar.innerHTML = `
        <div class="toolbar-row">
            <button class="toolbar-btn" id="addCustomThemeBtn" title="新增自定義主題">
                <i class="fas fa-folder-plus"></i>
            </button>
            <button class="toolbar-btn" id="addManualFavoriteBtn" title="手動新增項目">
                <i class="fas fa-pen-to-square"></i>
            </button>
            <button class="toolbar-btn" id="searchFavoritesBtn" title="搜尋收藏項目">
                <i class="fas fa-search"></i>
            </button>
            <button class="toolbar-btn" id="sortFavoritesBtn" title="排序收藏項目">
                <i class="fas fa-sort"></i>
            </button>
            <button class="toolbar-btn" id="exportFavoritesBtn" title="匯出收藏">
                <i class="fas fa-download"></i>
            </button>
        </div>
        <div class="search-bar" id="favoritesSearchBar" style="display: none;">
            <input type="text" id="favoritesSearchInput" placeholder="搜尋收藏項目..." />
            <button id="clearSearchBtn"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    // 插入到收藏內容之前
    favoritesContent.parentNode.insertBefore(toolbar, favoritesContent);
    
    // 綁定工具欄事件
    bindFavoritesToolbarEvents();
}

/**
 * 綁定收藏工具欄事件
 */
function bindFavoritesToolbarEvents() {
    // 新增自定義主題
    document.getElementById('addCustomThemeBtn')?.addEventListener('click', showCustomThemeDialog);
    
    // 手動新增項目
    document.getElementById('addManualFavoriteBtn')?.addEventListener('click', showAddFavoriteDialog);
    
    // 搜尋功能
    document.getElementById('searchFavoritesBtn')?.addEventListener('click', toggleFavoritesSearch);
    document.getElementById('favoritesSearchInput')?.addEventListener('input', filterFavorites);
    document.getElementById('clearSearchBtn')?.addEventListener('click', clearFavoritesSearch);
    
    // 排序功能
    document.getElementById('sortFavoritesBtn')?.addEventListener('click', showSortOptions);
    
    // 匯出功能
    document.getElementById('exportFavoritesBtn')?.addEventListener('click', exportFavorites);
}

/**
 * 顯示手動添加收藏項目對話框
 */
function showAddFavoriteDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'custom-theme-dialog';
    dialog.innerHTML = `
        <div class="dialog-overlay"></div>
        <div class="dialog-content">
            <div class="dialog-header">
                <h3>➕ 手動新增收藏項目</h3>
                <button class="dialog-close" onclick="closeAddFavoriteDialog()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="dialog-body">
                <div class="form-group">
                    <label for="newFavTitle">項目標題：</label>
                    <input type="text" id="newFavTitle" placeholder="例如: 我的重要資源">
                </div>
                <div class="form-group">
                    <label for="newFavDesc">項目描述：</label>
                    <textarea id="newFavDesc" placeholder="描述這個項目的內容..." rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="newFavType">選擇主題：</label>
                    <select id="newFavType">
                        ${generateAllTypeOptions()}
                    </select>
                </div>
                <div class="form-group">
                    <label for="newFavUrl">相關連結 (可選)：</label>
                    <input type="url" id="newFavUrl" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label for="newFavTags">標籤 (可選)：</label>
                    <input type="text" id="newFavTags" placeholder="用逗號分隔，例如: 重要,學習,工作">
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary" onclick="closeAddFavoriteDialog()">取消</button>
                <button class="btn btn-primary" onclick="createManualFavorite()">添加到收藏</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    setTimeout(() => dialog.classList.add('show'), 10);
    
    // 聚焦到第一個輸入框
    document.getElementById('newFavTitle').focus();
}

/**
 * 產生所有主題選項
 */
function generateAllTypeOptions() {
    const customThemes = JSON.parse(localStorage.getItem('emotionAI_customThemes') || '{}');
    const builtInTypes = [
        'book', 'movie', 'goal', 'psychology', 'music', 'activity', 'meditation', 'article',
        'game', 'podcast', 'course', 'recipe', 'guide', 'health', 'lifestyle', 'productivity',
        'creativity', 'relationship', 'finance', 'travel', 'hobby', 'learning', 'spirituality',
        'science', 'technology', 'art', 'nature', 'sports', 'food', 'entertainment'
    ];
    
    let options = '<optgroup label="內建主題">';
    
    // 內建主題
    builtInTypes.forEach(type => {
        options += `<option value="${type}">${getTypeName(type)}</option>`;
    });
    
    options += '</optgroup>';
    
    // 自定義主題
    if (Object.keys(customThemes).length > 0) {
        options += '<optgroup label="自定義主題">';
        Object.entries(customThemes).forEach(([type, name]) => {
            options += `<option value="${type}">${name}</option>`;
        });
        options += '</optgroup>';
    }
    
    return options;
}

/**
 * 關閉手動添加收藏對話框
 */
function closeAddFavoriteDialog() {
    const dialog = document.querySelector('.custom-theme-dialog');
    if (dialog) {
        dialog.classList.remove('show');
        setTimeout(() => dialog.remove(), 300);
    }
}

/**
 * 建立手動收藏項目
 */
function createManualFavorite() {
    const title = document.getElementById('newFavTitle').value.trim();
    const desc = document.getElementById('newFavDesc').value.trim();
    const type = document.getElementById('newFavType').value;
    const url = document.getElementById('newFavUrl').value.trim();
    const tagsStr = document.getElementById('newFavTags').value.trim();
    
    // 驗證輸入
    if (!title || !desc) {
        showNotification('請填寫項目標題和描述', 'warning');
        return;
    }
    
    // 處理標籤
    const tags = tagsStr ? tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // 生成唯一ID
    const id = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 建立收藏項目
    const favoriteItem = {
        id: id,
        type: type,
        title: title,
        desc: desc,
        addedAt: new Date().toISOString(),
        isManual: true, // 標記為手動添加
        url: url || null,
        tags: tags,
        rating: 0,
        notes: ''
    };
    
    try {
        const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        favorites.push(favoriteItem);
        localStorage.setItem('emotionAI_favorites', JSON.stringify(favorites));
        
        updateFavoritesDrawer();
        updateFavoritesStats();
        closeAddFavoriteDialog();
        
        showNotification(`已手動添加「${title}」到收藏！`, 'success');
        console.log('✋ 手動新增收藏:', favoriteItem);
        
    } catch (error) {
        console.error('❌ 手動添加收藏失敗:', error);
        showNotification('添加收藏時發生錯誤', 'error');
    }
}

/**
 * 優化localStorage性能
 */
function optimizeLocalStorage() {
    try {
        const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        
        // 如果項目數量超過500，提示用戶考慮清理
        if (favorites.length > 500) {
            console.warn(`📚 收藏項目較多(${favorites.length}個)，建議定期整理以保持最佳效能`);
        }
        
        // 檢查並移除重複項目
        const uniqueFavorites = removeDuplicateFavorites(favorites);
        if (uniqueFavorites.length !== favorites.length) {
            localStorage.setItem('emotionAI_favorites', JSON.stringify(uniqueFavorites));
            console.log(`🧹 已清理 ${favorites.length - uniqueFavorites.length} 個重複收藏項目`);
        }
        
    } catch (error) {
        console.error('❌ localStorage優化失敗:', error);
    }
}

/**
 * 移除重複的收藏項目
 */
function removeDuplicateFavorites(favorites) {
    const seen = new Set();
    return favorites.filter(item => {
        const key = `${item.type}-${item.title}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

/**
 * 添加項目到收藏 - 增強版本支援自定義主題
 * @param {string} uniqueCode - 項目唯一識別碼
 * @param {string} type - 項目類型
 * @param {string} title - 項目標題
 * @param {string} desc - 項目描述
 * @param {string} customTheme - 自定義主題名稱（可選）
 */
function addToFavorites(uniqueCode, type, title, desc, customTheme = null) {
    try {
        const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        
    // 檢查是否已收藏：只根據 UniqueCode 比對
    if (favorites.find(item => item.UniqueCode === uniqueCode)) {
            showNotification('此項目已在收藏中！', 'warning');
            return;
        }
        
        // 支援自定義主題
        const finalType = customTheme || type;
        
        // 添加新收藏
        const newFavorite = {
            UniqueCode: uniqueCode, // 新的唯一識別碼，作為去重主鍵
            type: finalType,
            originalType: type, // 保留原始類型
            title: title,
            desc: desc,
            addedAt: new Date().toISOString(),
            customTheme: !!customTheme, // 標記是否為自定義主題
            tags: [], // 支援標籤功能
            rating: 0, // 支援評分功能
            notes: '' // 支援備註功能
        };
        
        favorites.push(newFavorite);
        
        // 檢查localStorage容量
        try {
            localStorage.setItem('emotionAI_favorites', JSON.stringify(favorites));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                showNotification('儲存空間不足，請清理一些收藏項目', 'error');
                return;
            }
            throw error;
        }
        
        // 更新收藏抽屜顯示
        updateFavoritesDrawer();
        
        // 記錄統計資料
        updateFavoritesStats();
        
    // 視覺反饋：根據 data-unique-code 尋找元素
    const addBtn = document.querySelector(`[data-unique-code="${uniqueCode}"] .add-to-favorites`);
        if (addBtn) {
            addBtn.innerHTML = '<i class="fas fa-check"></i>';
            addBtn.disabled = true;
            addBtn.style.background = 'rgba(34, 197, 94, 0.3)';
            addBtn.style.borderColor = '#22c55e';
            addBtn.style.color = '#22c55e';
            
            setTimeout(() => {
                addBtn.innerHTML = '<i class="fas fa-plus"></i>';
                addBtn.disabled = false;
                addBtn.style.background = '';
                addBtn.style.borderColor = '';
                addBtn.style.color = '';
            }, 2000);
        }
        
        const themeInfo = customTheme ? ` (主題: ${customTheme})` : '';
        showNotification(`已將「${title}」加入收藏！${themeInfo}`, 'success');
        console.log('❤️ 新增收藏:', newFavorite);
        
    } catch (error) {
        console.error('❌ 添加收藏失敗:', error);
        showNotification('添加收藏時發生錯誤', 'error');
    }
}

/**
 * 從收藏中移除項目 - 增強版本
 * @param {string} uniqueCode - 項目 UniqueCode
 */
function removeFromFavorites(uniqueCode) {
    try {
        const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        // 只根據 UniqueCode 比對
        const itemToRemove = favorites.find(item => item.UniqueCode === uniqueCode);
        const updatedFavorites = favorites.filter(item => item.UniqueCode !== uniqueCode);

        localStorage.setItem('emotionAI_favorites', JSON.stringify(updatedFavorites));
        updateFavoritesDrawer();
        updateFavoritesStats();

        const itemTitle = itemToRemove ? itemToRemove.title : 'Unknown';
        showNotification(`已從收藏中移除「${itemTitle}」`, 'info');
        console.log('🗑️ 移除收藏:', itemToRemove);

    } catch (error) {
        console.error('❌ 移除收藏失敗:', error);
        showNotification('移除收藏時發生錯誤', 'error');
    }
}

/**
 * 更新收藏統計資料
 */
function updateFavoritesStats() {
    try {
        const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        const stats = {
            totalItems: favorites.length,
            totalThemes: new Set(favorites.map(item => item.type)).size,
            customThemes: favorites.filter(item => item.customTheme).length,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('emotionAI_favoritesStats', JSON.stringify(stats));
        console.log('📊 收藏統計已更新:', stats);
        
    } catch (error) {
        console.error('❌ 更新統計失敗:', error);
    }
}

/**
 * 更新收藏小抽屜顯示 - 增強版本支援無限制項目
 */
function updateFavoritesDrawer() {
    const favoritesContent = document.getElementById('favoritesContent');
    if (!favoritesContent) {
        console.warn('⚠️ 收藏內容元素未找到');
        return;
    }
    
    try {
        const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        
        if (favorites.length === 0) {
            favoritesContent.innerHTML = `
                <div class="favorites-placeholder">
                    <div class="placeholder-content">
                        <i class="fas fa-heart-broken"></i>
                        <span>暫無收藏項目...</span>
                        <small>開始與AI對話來獲得推薦項目吧！</small>
                    </div>
                </div>`;
            return;
        }
        
        // 按類型分組顯示收藏項目，支援無限制主題
        const groupedFavorites = groupFavoritesByType(favorites);
        const totalItems = favorites.length;
        const totalThemes = Object.keys(groupedFavorites).length;
        
        // 添加統計信息
        let favoritesHTML = `
            <div class="favorites-stats">
                <span class="stats-item">
                    <i class="fas fa-heart"></i> ${totalItems} 項目
                </span>
                <span class="stats-item">
                    <i class="fas fa-folder"></i> ${totalThemes} 主題
                </span>
            </div>
        `;
        
        // 生成分組的收藏項目HTML
        favoritesHTML += Object.entries(groupedFavorites).map(([type, items]) => {
            // 檢查主題的收起狀態 - 預設所有主題都是收起的
            const collapsedStates = JSON.parse(localStorage.getItem('emotionAI_collapsedThemes') || '{}');
            const isCollapsed = collapsedStates[type] !== false; // 預設為true（收起）
            const collapsedClass = isCollapsed ? 'collapsed' : '';
            const toggleIconRotation = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
            
            return `
            <div class="favorite-type-group" data-theme="${type}">
                <div class="favorite-type-header" onclick="toggleThemeGroup('${type}')">
                    <span class="favorite-type-icon">${getTypeIcon(type)}</span>
                    <span class="favorite-type-name">${getTypeName(type)}</span>
                    <div class="favorite-type-controls">
                        <span class="favorite-count">${items.length}</span>
                        <button class="theme-management-btn" onclick="manageTheme('${type}', event)" title="管理主題">
                            <i class="fas fa-cog"></i>
                        </button>
                        <i class="fas fa-chevron-down toggle-icon" style="transform: ${toggleIconRotation}; transition: transform 0.3s ease;"></i>
                    </div>
                </div>
                <div class="favorite-items-list ${collapsedClass}" id="theme-${type}">
                    ${items.slice(0, getDisplayLimit(type)).map(item => `
                        <div class="favorite-item" data-unique-code="${item.UniqueCode}" data-type="${item.type}">
                            <div class="fav-content">
                                <div class="fav-details">
                                    <div class="fav-title" title="${item.title}">${item.title}</div>
                                    <div class="fav-desc" title="${item.desc}">${item.desc}</div>
                                    <div class="fav-meta">
                                        <span class="fav-date">收藏於 ${new Date(item.addedAt).toLocaleDateString('zh-TW')}</span>
                                        ${item.customTheme ? '<span class="custom-theme-badge">自定義</span>' : ''}
                                        ${item.rating ? `<span class="rating-display">${'⭐'.repeat(item.rating)}</span>` : ''}
                                    </div>
                                    ${item.notes ? `<div class="fav-notes">${item.notes}</div>` : ''}
                                </div>
                            </div>
                            <div class="fav-actions">
                                <button class="edit-favorite" onclick="editFavoriteItem('${item.UniqueCode}')" title="編輯">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="remove-favorite" onclick="removeFromFavorites('${item.UniqueCode}')" title="移除收藏">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                    ${items.length > getDisplayLimit(type) ? `
                        <div class="load-more-items">
                            <button onclick="loadMoreItems('${type}')" class="load-more-btn">
                                <i class="fas fa-chevron-down"></i>
                                載入更多 (還有 ${items.length - getDisplayLimit(type)} 個項目)
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        }).join('');
        
        favoritesContent.innerHTML = favoritesHTML;
        
               
        // 恢復摺疊狀態
        restoreThemeCollapsedStates();
        
        // 調整收納小冊高度
        setTimeout(() => {
            adjustFavoritesDrawerHeight();
        }, 100);
        
        console.log(`❤️ 收藏抽屜已更新: ${totalItems} 個項目，${totalThemes} 個主題`);
        
    } catch (error) {
        console.error('❌ 更新收藏抽屜失敗:', error);
        favoritesContent.innerHTML = `
            <div class="favorites-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>載入收藏時發生錯誤</span>
                <button onclick="updateFavoritesDrawer()" class="retry-btn">重試</button>
            </div>`;
    }
}

/**
 * 獲取主題的顯示限制（避免一次載入太多項目影響效能）
 */
function getDisplayLimit(themeType) {
    const settings = JSON.parse(localStorage.getItem('emotionAI_displaySettings') || '{}');
    return settings[themeType] || 10; // 預設每個主題顯示10個項目
}

/**
 * 載入更多項目
 */
function loadMoreItems(themeType) {
    try {
        const settings = JSON.parse(localStorage.getItem('emotionAI_displaySettings') || '{}');
        const currentLimit = settings[themeType] || 10;
        const newLimit = currentLimit + 10;
        
        settings[themeType] = newLimit;
        localStorage.setItem('emotionAI_displaySettings', JSON.stringify(settings));
        
        updateFavoritesDrawer();
        
        console.log(`📚 已載入更多項目: ${themeType} (限制: ${newLimit})`);
    } catch (error) {
        console.error('❌ 載入更多項目失敗:', error);
    }
}

/**
 * 切換主題群組的展開/摺疊狀態
 */
function toggleThemeGroup(themeType) {
    const themeGroup = document.querySelector(`[data-theme="${themeType}"]`);
    const itemsList = document.getElementById(`theme-${themeType}`);
    const toggleIcon = themeGroup.querySelector('.toggle-icon');
    
    if (!itemsList || !toggleIcon) return;
    
    const isCollapsed = itemsList.classList.contains('collapsed');
    
    if (isCollapsed) {
        // 展開主題
        itemsList.classList.remove('collapsed');
        toggleIcon.style.transform = 'rotate(0deg)';
        console.log(`📂 展開主題: ${themeType}`);
    } else {
        // 收起主題
        itemsList.classList.add('collapsed');
        toggleIcon.style.transform = 'rotate(-90deg)';
        console.log(`📁 收起主題: ${themeType}`);
    }
    
    // 保存摺疊狀態
    saveThemeCollapsedState(themeType, !isCollapsed);
    
    // 觸發收納小冊高度重新計算
    setTimeout(() => {
        adjustFavoritesDrawerHeight();
    }, 50);
}

/**
 * 保存主題摺動狀態
 */
function saveThemeCollapsedState(themeType, isCollapsed) {
    try {
        const collapsedStates = JSON.parse(localStorage.getItem('emotionAI_collapsedThemes') || '{}');
        collapsedStates[themeType] = isCollapsed;
        localStorage.setItem('emotionAI_collapsedThemes', JSON.stringify(collapsedStates));
    } catch (error) {
        console.error('❌ 保存摺疊狀態失敗:', error);
    }
}

/**
 * 動態調整收納小冊高度
 */
function adjustFavoritesDrawerHeight() {
    const favoritesContent = document.getElementById('favoritesContent');
    if (!favoritesContent) return;
    
    // 重置高度設定讓內容自然擴展
    favoritesContent.style.height = 'auto';
    
    // 計算實際內容高度
    const contentHeight = favoritesContent.scrollHeight;
    
    // 設定最小高度為60px，最大不限制
    const finalHeight = Math.max(60, contentHeight);
    
    console.log(`📏 調整收納小冊高度: ${finalHeight}px`);
}

/**
 * 恢復主題摺動狀態
 */
function restoreThemeCollapsedStates() {
    try {
        const collapsedStates = JSON.parse(localStorage.getItem('emotionAI_collapsedThemes') || '{}');
        
        Object.entries(collapsedStates).forEach(([themeType, isCollapsed]) => {
            if (isCollapsed) {
                const itemsList = document.getElementById(`theme-${themeType}`);
                const toggleIcon = document.querySelector(`[data-theme="${themeType}"] .toggle-icon`);
                
                if (itemsList && toggleIcon) {
                    itemsList.classList.add('collapsed');
                    toggleIcon.style.transform = 'rotate(-90deg)';
                }
            }
        });
    } catch (error) {
        console.error('❌ 恢復摺動狀態失敗:', error);
    }
}

/**
 * 按類型分組收藏項目
 * @param {Array} favorites - 收藏項目數組
 * @returns {Object} - 按類型分組的物件
 */
function groupFavoritesByType(favorites) {
    return favorites.reduce((groups, item) => {
        const type = item.type || 'other';
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(item);
        return groups;
    }, {});
}

/**
 * 根據類型返回中文名稱 - 增強版本支援自定義主題
 * @param {string} type - 項目類型
 * @returns {string} - 中文名稱
 */
function getTypeName(type) {
    // 先檢查是否為自定義主題
    const customThemes = JSON.parse(localStorage.getItem('emotionAI_customThemes') || '{}');
    if (customThemes[type]) {
        return customThemes[type];
    }
    
    // 預設主題名稱
    const names = {
        'book': '書籍',
        'movie': '影視', 
        'goal': '目標',
        'psychology': '心理學',
        'music': '音樂',
        'activity': '活動',
        'meditation': '冥想',
        'article': '文章',
        'game': '遊戲',
        'podcast': '播客',
        'course': '課程',
        'recipe': '食譜',
        'guide': '導覽',
        'health': '健康',
        'lifestyle': '生活風格',
        'productivity': '生產力',
        'creativity': '創意',
        'relationship': '人際關係',
        'finance': '理財',
        'travel': '旅行',
        'hobby': '興趣愛好',
        'learning': '學習',
        'spirituality': '靈性',
        'science': '科學',
        'technology': '科技',
        'art': '藝術',
        'nature': '自然',
        'sports': '運動',
        'food': '美食',
        'entertainment': '娛樂'
    };
    return names[type] || type;
}

// ===== 新增功能：自定義主題管理 =====

/**
 * 顯示自定義主題對話框
 */
function showCustomThemeDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'custom-theme-dialog';
    dialog.innerHTML = `
        <div class="dialog-overlay"></div>
        <div class="dialog-content">
            <div class="dialog-header">
                <h3>🎨 新增自定義主題</h3>
                <button class="dialog-close" onclick="closeCustomThemeDialog()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="dialog-body">
                <div class="form-group">
                    <label for="themeKey">主題識別碼 (英文/數字)：</label>
                    <input type="text" id="themeKey" placeholder="例如: my_theme_01" 
                           pattern="[a-zA-Z0-9_]+" title="只能包含英文字母、數字和底線">
                </div>
                <div class="form-group">
                    <label for="themeName">主題顯示名稱：</label>
                    <input type="text" id="themeName" placeholder="例如: 我的特殊收藏">
                </div>
                <div class="form-group">
                    <label for="themeIcon">主題圖標 (表情符號)：</label>
                    <input type="text" id="themeIcon" placeholder="例如: 🌟" maxlength="2">
                </div>
                <div class="form-group">
                    <label for="themeDesc">主題描述 (可選)：</label>
                    <textarea id="themeDesc" placeholder="描述這個主題的用途..." rows="3"></textarea>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary" onclick="closeCustomThemeDialog()">取消</button>
                <button class="btn btn-primary" onclick="createCustomTheme()">建立主題</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    setTimeout(() => dialog.classList.add('show'), 10);
    
    // 聚焦到第一個輸入框
    document.getElementById('themeKey').focus();
}

/**
 * 關閉自定義主題對話框
 */
function closeCustomThemeDialog() {
    const dialog = document.querySelector('.custom-theme-dialog');
    if (dialog) {
        dialog.classList.remove('show');
        setTimeout(() => dialog.remove(), 300);
    }
}

/**
 * 建立自定義主題
 */
function createCustomTheme() {
    const themeKey = document.getElementById('themeKey').value.trim();
    const themeName = document.getElementById('themeName').value.trim();
    const themeIcon = document.getElementById('themeIcon').value.trim();
    const themeDesc = document.getElementById('themeDesc').value.trim();
    
    // 驗證輸入
    if (!themeKey || !themeName) {
        showNotification('請填寫主題識別碼和顯示名稱', 'warning');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(themeKey)) {
        showNotification('主題識別碼只能包含英文字母、數字和底線', 'warning');
        return;
    }
    
    try {
        // 檢查是否已存在
        const customThemes = JSON.parse(localStorage.getItem('emotionAI_customThemes') || '{}');
        const customIcons = JSON.parse(localStorage.getItem('emotionAI_customIcons') || '{}');
        
        if (customThemes[themeKey]) {
            showNotification('此主題識別碼已存在', 'warning');
            return;
        }
        
        // 儲存新主題
        customThemes[themeKey] = themeName;
        if (themeIcon) {
            customIcons[themeKey] = themeIcon;
        }
        
        localStorage.setItem('emotionAI_customThemes', JSON.stringify(customThemes));
        localStorage.setItem('emotionAI_customIcons', JSON.stringify(customIcons));
        
        // 如果有描述，也儲存起來
        if (themeDesc) {
            const customDescs = JSON.parse(localStorage.getItem('emotionAI_customThemeDescs') || '{}');
            customDescs[themeKey] = themeDesc;
            localStorage.setItem('emotionAI_customThemeDescs', JSON.stringify(customDescs));
        }
        
        showNotification(`主題「${themeName}」建立成功！`, 'success');
        closeCustomThemeDialog();
        
        console.log('🎨 新增自定義主題:', { themeKey, themeName, themeIcon, themeDesc });
        
    } catch (error) {
        console.error('❌ 建立自定義主題失敗:', error);
        showNotification('建立主題時發生錯誤', 'error');
    }
}

// ===== 新增功能：搜尋和篩選 =====

/**
 * 切換搜尋功能
 */
function toggleFavoritesSearch() {
    const searchBar = document.getElementById('favoritesSearchBar');
    const searchInput = document.getElementById('favoritesSearchInput');
    
    if (searchBar.style.display === 'none') {
        searchBar.style.display = 'flex';
        searchInput.focus();
    } else {
        searchBar.style.display = 'none';
        clearFavoritesSearch();
    }
}

/**
 * 篩選收藏項目
 */
function filterFavorites() {
    const searchTerm = document.getElementById('favoritesSearchInput').value.toLowerCase();
    const favoriteItems = document.querySelectorAll('.favorite-item');
    const themeGroups = document.querySelectorAll('.favorite-type-group');
    
    favoriteItems.forEach(item => {
        const title = item.querySelector('.fav-title').textContent.toLowerCase();
        const desc = item.querySelector('.fav-desc').textContent.toLowerCase();
        const isMatch = title.includes(searchTerm) || desc.includes(searchTerm);
        
        item.style.display = isMatch ? 'flex' : 'none';
    });
    
    // 隱藏沒有可見項目的主題群組
    themeGroups.forEach(group => {
        const visibleItems = group.querySelectorAll('.favorite-item[style*="flex"]');
        const hasVisibleItems = Array.from(group.querySelectorAll('.favorite-item')).some(item => 
            item.style.display !== 'none'
        );
        group.style.display = hasVisibleItems || !searchTerm ? 'block' : 'none';
    });
    
    // 如果有搜尋詞但沒有結果，顯示無結果訊息
    if (searchTerm && document.querySelectorAll('.favorite-item[style*="flex"]').length === 0) {
        showSearchNoResults(searchTerm);
    } else {
        removeSearchNoResults();
    }
}

/**
 * 清除搜尋
 */
function clearFavoritesSearch() {
    document.getElementById('favoritesSearchInput').value = '';
    filterFavorites();
}

/**
 * 顯示無搜尋結果訊息
 */
function showSearchNoResults(searchTerm) {
    const favoritesContent = document.getElementById('favoritesContent');
    let noResultsDiv = document.getElementById('searchNoResults');
    
    if (!noResultsDiv) {
        noResultsDiv = document.createElement('div');
        noResultsDiv.id = 'searchNoResults';
        noResultsDiv.className = 'search-no-results';
        favoritesContent.appendChild(noResultsDiv);
    }
    
    noResultsDiv.innerHTML = `
        <div class="no-results-content">
            <i class="fas fa-search"></i>
            <h4>找不到相關項目</h4>
            <p>沒有找到包含「${searchTerm}」的收藏項目</p>
            <button onclick="clearFavoritesSearch()" class="btn btn-secondary">清除搜尋</button>
        </div>
    `;
}

/**
 * 移除無搜尋結果訊息
 */
function removeSearchNoResults() {
    const noResultsDiv = document.getElementById('searchNoResults');
    if (noResultsDiv) {
        noResultsDiv.remove();
    }
}

// ===== 新增功能：排序功能 =====

/**
 * 顯示排序選項
 */
function showSortOptions() {
    const sortMenu = document.createElement('div');
    sortMenu.className = 'sort-menu';
    sortMenu.innerHTML = `
        <div class="sort-menu-content">
            <h4>📊 排序方式</h4>
            <div class="sort-options">
                <button onclick="sortFavorites('date-desc')" class="sort-option">
                    <i class="fas fa-clock"></i> 最新收藏
                </button>
                <button onclick="sortFavorites('date-asc')" class="sort-option">
                    <i class="fas fa-history"></i> 最舊收藏
                </button>
                <button onclick="sortFavorites('title-asc')" class="sort-option">
                    <i class="fas fa-sort-alpha-down"></i> 標題 A-Z
                </button>
                <button onclick="sortFavorites('title-desc')" class="sort-option">
                    <i class="fas fa-sort-alpha-up"></i> 標題 Z-A
                </button>
                <button onclick="sortFavorites('type')" class="sort-option">
                    <i class="fas fa-layer-group"></i> 依主題分組
                </button>
                <button onclick="sortFavorites('rating-desc')" class="sort-option">
                    <i class="fas fa-star"></i> 評分高到低
                </button>
            </div>
            <button onclick="closeSortMenu()" class="sort-close">關閉</button>
        </div>
    `;
    
    document.body.appendChild(sortMenu);
    setTimeout(() => sortMenu.classList.add('show'), 10);
}

/**
 * 關閉排序選單
 */
function closeSortMenu() {
    const sortMenu = document.querySelector('.sort-menu');
    if (sortMenu) {
        sortMenu.classList.remove('show');
        setTimeout(() => sortMenu.remove(), 300);
    }
}

/**
 * 排序收藏項目
 */
function sortFavorites(sortType) {
    try {
        let favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        
        switch (sortType) {
            case 'date-desc':
                favorites.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
                break;
            case 'date-asc':
                favorites.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
                break;
            case 'title-asc':
                favorites.sort((a, b) => a.title.localeCompare(b.title, 'zh-TW'));
                break;
            case 'title-desc':
                favorites.sort((a, b) => b.title.localeCompare(a.title, 'zh-TW'));
                break;
            case 'type':
                favorites.sort((a, b) => {
                    if (a.type === b.type) {
                        return new Date(b.addedAt) - new Date(a.addedAt);
                    }
                    return a.type.localeCompare(b.type, 'zh-TW');
                });
                break;
            case 'rating-desc':
                favorites.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
        }
        
        localStorage.setItem('emotionAI_favorites', JSON.stringify(favorites));
        updateFavoritesDrawer();
        closeSortMenu();
        
        showNotification('收藏項目已重新排序', 'success');
        console.log('📊 收藏項目已排序:', sortType);
        
    } catch (error) {
        console.error('❌ 排序失敗:', error);
        showNotification('排序時發生錯誤', 'error');
    }
}

// ===== 新增功能：匯出和備份 =====

/**
 * 匯出收藏項目
 */
function exportFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        const customThemes = JSON.parse(localStorage.getItem('emotionAI_customThemes') || '{}');
        const stats = JSON.parse(localStorage.getItem('emotionAI_favoritesStats') || '{}');
        
        const exportData = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            favorites: favorites,
            customThemes: customThemes,
            stats: stats,
            totalItems: favorites.length,
            totalThemes: Object.keys(groupFavoritesByType(favorites)).length
        };
        
        // 建立下載連結
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `情緒AI收藏備份_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`已匯出 ${favorites.length} 個收藏項目`, 'success');
        console.log('📤 收藏項目已匯出:', exportData);
        
    } catch (error) {
        console.error('❌ 匯出失敗:', error);
        showNotification('匯出時發生錯誤', 'error');
    }
}

// ===== 新增功能：編輯收藏項目 =====

/**
 * 編輯收藏項目
 */
function editFavoriteItem(uniqueCode) {
    try {
        const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        const item = favorites.find(fav => fav.UniqueCode === uniqueCode);
        
        if (!item) {
            showNotification('找不到要編輯的項目', 'error');
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'edit-favorite-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>✏️ 編輯收藏項目</h3>
                    <button class="dialog-close" onclick="closeEditDialog()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="dialog-body">
                    <div class="form-group">
                        <label for="editTitle">標題：</label>
                        <input type="text" id="editTitle" value="${item.title}">
                    </div>
                    <div class="form-group">
                        <label for="editDesc">描述：</label>
                        <textarea id="editDesc" rows="3">${item.desc}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="editType">主題：</label>
                        <select id="editType">
                            ${generateTypeOptions(item.type)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editRating">評分：</label>
                        <div class="rating-input">
                            ${[1,2,3,4,5].map(i => `
                                <span class="star ${(item.rating || 0) >= i ? 'active' : ''}" 
                                      onclick="setRating(${i})" data-rating="${i}">⭐</span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="editNotes">備註：</label>
                        <textarea id="editNotes" rows="2" placeholder="個人備註...">${item.notes || ''}</textarea>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" onclick="closeEditDialog()">取消</button>
                    <button class="btn btn-primary" onclick="saveEditedItem('${uniqueCode}')">儲存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        setTimeout(() => dialog.classList.add('show'), 10);
        
        // 儲存當前評分到全域變數
        window.currentRating = item.rating || 0;
        
    } catch (error) {
        console.error('❌ 編輯項目失敗:', error);
        showNotification('編輯項目時發生錯誤', 'error');
    }
}

/**
 * 產生主題選項HTML
 */
function generateTypeOptions(currentType) {
    const customThemes = JSON.parse(localStorage.getItem('emotionAI_customThemes') || '{}');
    const builtInTypes = [
        'book', 'movie', 'goal', 'psychology', 'music', 'activity', 'meditation', 'article',
        'game', 'podcast', 'course', 'recipe', 'guide', 'health', 'lifestyle', 'productivity'
    ];
    
    let options = '';
    
    // 內建主題
    builtInTypes.forEach(type => {
        const selected = type === currentType ? 'selected' : '';
        options += `<option value="${type}" ${selected}>${getTypeName(type)}</option>`;
    });
    
    // 自定義主題
    Object.entries(customThemes).forEach(([type, name]) => {
        const selected = type === currentType ? 'selected' : '';
        options += `<option value="${type}" ${selected}>${name} (自定義)</option>`;
    });
    
    return options;
}

/**
 * 設定評分
 */
function setRating(rating) {
    window.currentRating = rating;
    const stars = document.querySelectorAll('.rating-input .star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
}

/**
 * 儲存編輯的項目
 */
function saveEditedItem(uniqueCode) {
    try {
        const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
        const itemIndex = favorites.findIndex(fav => fav.UniqueCode === uniqueCode);
        
        if (itemIndex === -1) {
            showNotification('找不到要儲存的項目', 'error');
            return;
        }
        
        // 更新項目資料
        favorites[itemIndex] = {
            ...favorites[itemIndex],
            title: document.getElementById('editTitle').value.trim(),
            desc: document.getElementById('editDesc').value.trim(),
            type: document.getElementById('editType').value,
            rating: window.currentRating || 0,
            notes: document.getElementById('editNotes').value.trim(),
            lastModified: new Date().toISOString()
        };
        
        localStorage.setItem('emotionAI_favorites', JSON.stringify(favorites));
        updateFavoritesDrawer();
        closeEditDialog();
        
        showNotification('項目已更新', 'success');
        console.log('✏️ 項目已編輯:', favorites[itemIndex]);
        
    } catch (error) {
        console.error('❌ 儲存編輯失敗:', error);
        showNotification('儲存時發生錯誤', 'error');
    }
}

/**
 * 關閉編輯對話框
 */
function closeEditDialog() {
    const dialog = document.querySelector('.edit-favorite-dialog');
    if (dialog) {
        dialog.classList.remove('show');
        setTimeout(() => dialog.remove(), 300);
    }
}

// ===== 新增功能：主題管理 =====

/**
 * 管理主題
 */
function manageTheme(themeType, event) {
    event.stopPropagation(); // 防止觸發toggleThemeGroup
    
    const menu = document.createElement('div');
    menu.className = 'theme-context-menu';
    menu.innerHTML = `
        <div class="context-menu-content">
            <button onclick="renameTheme('${themeType}')">
                <i class="fas fa-edit"></i> 重新命名
            </button>
            <button onclick="exportTheme('${themeType}')">
                <i class="fas fa-download"></i> 匯出此主題
            </button>
            <button onclick="deleteTheme('${themeType}')" class="danger">
                <i class="fas fa-trash"></i> 刪除主題
            </button>
        </div>
    `;
    
    const rect = event.target.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;
    
    document.body.appendChild(menu);
    
    // 點擊其他地方關閉選單
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 100);
}

/**
 * 將函數綁定到全域作用域
 */
window.editFavoriteItem = editFavoriteItem;
window.closeEditDialog = closeEditDialog;
window.saveEditedItem = saveEditedItem;
window.setRating = setRating;
window.manageTheme = manageTheme;
window.toggleThemeGroup = toggleThemeGroup;
window.adjustFavoritesDrawerHeight = adjustFavoritesDrawerHeight;
window.loadMoreItems = loadMoreItems;
window.showCustomThemeDialog = showCustomThemeDialog;
window.closeCustomThemeDialog = closeCustomThemeDialog;
window.createCustomTheme = createCustomTheme;
window.showAddFavoriteDialog = showAddFavoriteDialog;
window.closeAddFavoriteDialog = closeAddFavoriteDialog;
window.createManualFavorite = createManualFavorite;
window.toggleFavoritesSearch = toggleFavoritesSearch;
window.clearFavoritesSearch = clearFavoritesSearch;
window.showSortOptions = showSortOptions;
window.closeSortMenu = closeSortMenu;
window.sortFavorites = sortFavorites;
window.exportFavorites = exportFavorites;

/**
 * 顯示通知消息
 * @param {string} message - 通知消息
 * @param {string} type - 通知類型 (success, warning, info, error)
 */
function showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 0.9em;
        z-index: 1001;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // 根據類型設置背景色
    const colors = {
        success: 'rgba(34, 197, 94, 0.9)',
        warning: 'rgba(251, 191, 36, 0.9)',
        info: 'rgba(59, 130, 246, 0.9)',
        error: 'rgba(239, 68, 68, 0.9)'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 觸發動畫
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自動移除
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== 推薦目標管理功能 =====

/**
 * 編輯目標項目
 * @param {HTMLElement} btn - 修改按鈕元素
 */
function editGoal(btn) {
    const goalItem = btn.closest('.goal-item-recommended');
    const titleElement = goalItem.querySelector('.goal-title');
    const descElement = goalItem.querySelector('.goal-desc');
    const isEditing = goalItem.classList.contains('editing');
    
    if (!isEditing) {
        // 進入編輯模式
        goalItem.classList.add('editing');
        titleElement.contentEditable = 'true';
        descElement.contentEditable = 'true';
        btn.textContent = '完成';
        btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        
        // 聚焦到標題並選中文字
        titleElement.focus();
        document.execCommand('selectAll', false, null);
        
        console.log('📝 進入編輯模式');
    } else {
        // 退出編輯模式
        goalItem.classList.remove('editing');
        titleElement.contentEditable = 'false';
        descElement.contentEditable = 'false';
        btn.textContent = '修改';
        btn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        
        // 保存編輯內容（這裡可以添加保存到後端的邏輯）
        const goalId = goalItem.getAttribute('data-goal-id');
        const newTitle = titleElement.textContent.trim();
        const newDesc = descElement.textContent.trim();
        
        console.log(`✅ 目標編輯完成 - ID: ${goalId}, 標題: ${newTitle}, 描述: ${newDesc}`);
        showNotification('目標內容已更新', 'success');
    }
}

/**
 * 將推薦目標添加到右側目標序列
 * @param {HTMLElement} btn - 添加按鈕元素
 */
function addGoalToSequence(btn) {
    const goalItem = btn.closest('.goal-item-recommended');
    const goalIcon = goalItem.querySelector('.goal-icon').textContent;
    const goalTitle = goalItem.querySelector('.goal-title').textContent;
    const goalDesc = goalItem.querySelector('.goal-desc').textContent;
    const goalId = goalItem.getAttribute('data-goal-id');
    
    // 檢查是否已經添加過
    if (goalItem.classList.contains('added')) {
        showNotification('此目標已經添加到目標序列中', 'warning');
        return;
    }
    
    // 檢查右側目標序列是否已存在相同目標
    const goalSequenceContent = document.getElementById('goalSequenceContent');
    const existingGoals = goalSequenceContent.querySelectorAll('.goal-item');
    
    for (let existingGoal of existingGoals) {
        if (existingGoal.getAttribute('data-source-id') === goalId) {
            showNotification('此目標已經存在於目標序列中', 'warning');
            return;
        }
    }
    
    // 創建新的目標項目元素（模仿右側目標序列的樣式）
    const newGoalElement = document.createElement('div');
    newGoalElement.className = 'goal-item';
    newGoalElement.setAttribute('data-source-id', goalId);
    newGoalElement.innerHTML = `
        <div class="goal-content">
            <div class="goal-icon">${goalIcon}</div>
            <div class="goal-details">
                <div class="goal-title">${goalTitle}</div>
                <div class="goal-desc">${goalDesc}</div>
            </div>
        </div>
        <button class="goal-check-btn" title="完成目標">
            <i class="fas fa-check"></i>
        </button>
    `;
    
    // 添加到右側目標序列
    goalSequenceContent.appendChild(newGoalElement);
    
    // 標記左側推薦目標為已添加
    goalItem.classList.add('added');
    
    // 顯示成功通知
    showNotification(`已將"${goalTitle}"添加到目標序列`, 'success');
    
    console.log(`✅ 目標已添加到序列 - ${goalTitle}`);
}

// ===== 目標完成動畫系統 =====
/**
 * 初始化目標完成動畫系統
 * 為所有勾勾按鈕綁定點擊事件
 */
function initGoalCompletionSystem() {
    // 為現有的勾勾按鈕綁定事件
    bindGoalCheckButtons();
    
    // 監聽新增目標項目的動態綁定
    const goalSequenceContent = document.getElementById('goalSequenceContent');
    if (goalSequenceContent) {
        // 使用事件委託來處理動態添加的目標項目
        goalSequenceContent.addEventListener('click', function(e) {
            if (e.target.closest('.goal-check-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const checkBtn = e.target.closest('.goal-check-btn');
                const goalItem = checkBtn.closest('.goal-item');
                
                if (goalItem && !goalItem.classList.contains('completing')) {
                    handleGoalCompletion(goalItem, checkBtn);
                }
            }
        });
    }
    
    console.log('🎯 目標完成動畫系統初始化完成');
}

/**
 * 為現有的勾勾按鈕綁定點擊事件
 */
function bindGoalCheckButtons() {
    const checkButtons = document.querySelectorAll('.goal-check-btn');
    checkButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const goalItem = this.closest('.goal-item');
            if (goalItem && !goalItem.classList.contains('completing')) {
                handleGoalCompletion(goalItem, this);
            }
        });
    });
    
    console.log(`🔗 已綁定 ${checkButtons.length} 個勾勾按鈕事件`);
}

/**
 * 處理目標完成的完整動畫流程
 * @param {HTMLElement} goalItem - 目標項目元素
 * @param {HTMLElement} checkBtn - 勾勾按鈕元素
 */
function handleGoalCompletion(goalItem, checkBtn) {
    console.log('🎯 開始執行目標完成動畫...');
    
    // 防止重複點擊
    goalItem.classList.add('completing');
    checkBtn.style.pointerEvents = 'none';
    
    // 第一階段：立即變化（項目變白底、內容消失、勾勾變化並移到中間）
    goalItem.classList.add('goal-completed');
    const goalContent = goalItem.querySelector('.goal-content');
    if (goalContent) {
        goalContent.classList.add('goal-content-fade');
    }
    checkBtn.classList.add('goal-check-center');
    
    // 彈出通知
    showGoalCompletionNotification();
    
    // 添加勾勾脈衝效果
    setTimeout(() => {
        checkBtn.classList.add('pulse');
    }, 300);
    
    // 第二階段：2秒後開始消失動畫
    setTimeout(() => {
        goalItem.classList.add('goal-item-disappear');
        
        // 第三階段：動畫完成後移除DOM元素
        setTimeout(() => {
            goalItem.remove();
            console.log('✨ 目標完成動畫執行完畢，元素已移除');
        }, 600); // 等待消失動畫完成
        
    }, 2000); // 2秒延遲
}

/**
 * 顯示目標完成通知
 */
function showGoalCompletionNotification() {
    // 移除現有通知（如果有）
    const existingNotification = document.querySelector('.notification-popup');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = 'notification-popup';
    notification.textContent = '做的好！';
    
    // 添加到頁面
    document.body.appendChild(notification);
    
    // 觸發顯示動畫
    setTimeout(() => {
        notification.classList.add('show');
        notification.classList.add('pulse');
    }, 100);
    
    // 3秒後自動隱藏
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        // 動畫完成後移除元素
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 400);
    }, 3000);
    
    console.log('🎉 目標完成通知已顯示');
}

/**
 * 通用通知顯示函數（用於其他通知需求）
 * @param {string} message - 通知訊息
 * @param {string} type - 通知類型 success/warning/error
 */
// 注意：原本的全域 showNotification 實現在其他檔案（例如 support/report.js），
// 不要在此覆蓋，以免改變全域通知樣式。若需要局部通知請呼叫 showGoalCompletionNotification()。
