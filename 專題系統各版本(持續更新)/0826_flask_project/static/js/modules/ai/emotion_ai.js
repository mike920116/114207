/**
 * 情緒AI聊天助手 JavaScript - 簡化版本
 * 移除WebSocket依賴，改用同步HTTP通訊
 * 基於backup_chatbot的簡潔設計
 */

// ===== 系統主題自動切換功能 =====

/**
 * 強制切換系統主題到深藍色模式（僅在emotion AI中生效）
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
    
    console.log('✅ 情緒AI聊天系統初始化完成（時間管理版本）');
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
            
            // 處理側邊欄推薦（新功能）
            if (sidebarReco) {
                updateInsightPanel(sidebarReco);
            }
            
            console.log('✅ 訊息處理完成');
        } else {
            hideTypingIndicator();
            console.error('❌ 錯誤:', data.error);
            addErrorMessage(data.error || '發生未知錯誤');
        }
        
    } catch (error) {
        hideTypingIndicator();
        console.error('❌ 網路錯誤:', error);
        addErrorMessage('連接伺服器時發生錯誤，請稍後再試。');
    } finally {
        hideLoadingButton();
    }
}

// 顯示打字指示器
function showTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'block';
        scrollToBottom();
    }
}

// 隱藏打字指示器
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
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

// 更新情緒分析面板
function updateEmotionPanel(userAnalysis, aiAnalysis) {
    const emotionSummary = document.getElementById('emotion-summary');
    if (!emotionSummary) return;
    
    let summaryHTML = '<div class="emotion-panel-section">';
    
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
    }
    
    summaryHTML += '</div>';
    emotionSummary.innerHTML = summaryHTML;
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
 * 更新洞察補充面板
 * @param {Object} sidebarReco - 側邊欄推薦數據
 */
function updateInsightPanel(sidebarReco) {
    const insightContent = document.getElementById('insightContent');
    if (!insightContent || !sidebarReco) {
        console.warn('⚠️ 洞察面板元素未找到或數據為空');
        return;
    }
    
    // 生成洞察訊息泡泡 - 新的標籤式設計
    const insightHTML = `
        <div class="insight-message-bubble">
            <div class="insight-avatar">🧠</div>
            <div class="insight-message-content">
                <div class="insight-name">洞察AI助手</div>
                <div class="insight-bubble">
                    <div class="insight-summary">
                        ${sidebarReco.summary}
                    </div>
                    <div class="insight-time">${new Date().toLocaleTimeString('zh-TW', {hour: '2-digit', minute: '2-digit'})}</div>
                    <div class="recommendation-analysis">
                        <div class="reco-tags-container">
                            ${sidebarReco.items.map(item => `
                                <div class="reco-item ${getItemClass(item.type)}" data-id="${item.id}" title="${item.desc}">
                                    <div class="reco-content">
                                        <span class="reco-type">${getTypeIcon(item.type)}</span>
                                        <div class="reco-details">
                                            <div class="reco-title">${item.title}</div>
                                            <div class="reco-desc">${item.desc}</div>
                                        </div>
                                    </div>
                                    ${item.addable ? `
                                        <button class="add-to-favorites" onclick="addToFavorites('${item.id}', '${item.type}', '${escapeQuotes(item.title)}', '${escapeQuotes(item.desc)}')" title="加入收藏">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 更新面板內容並添加動畫
    insightContent.innerHTML = insightHTML;
    insightContent.classList.add('updated');
    
    // 移除動畫類別
    setTimeout(() => {
        insightContent.classList.remove('updated');
    }, 600);
    
    console.log('💡 洞察補充面板已更新，包含 ' + sidebarReco.items.length + ' 個推薦項目（標籤式布局）');
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
 * 根據類型返回對應圖標
 * @param {string} type - 項目類型
 * @returns {string} - 對應的圖標
 */
function getTypeIcon(type) {
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
        'recipe': '🍳'
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

// ===== 收藏功能 =====

/**
 * 初始化收藏系統
 */
function initFavoritesSystem() {
    // 載入並顯示已存儲的收藏項目
    updateFavoritesDrawer();
    console.log('❤️ 收藏系統初始化完成');
}

/**
 * 添加項目到收藏
 * @param {string} id - 項目ID
 * @param {string} type - 項目類型
 * @param {string} title - 項目標題
 * @param {string} desc - 項目描述
 */
function addToFavorites(id, type, title, desc) {
    const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
    
    // 檢查是否已收藏
    if (favorites.find(item => item.id === id)) {
        showNotification('此項目已在收藏中！', 'warning');
        return;
    }
    
    // 添加新收藏
    const newFavorite = {
        id: id,
        type: type,
        title: title,
        desc: desc,
        addedAt: new Date().toISOString()
    };
    
    favorites.push(newFavorite);
    localStorage.setItem('emotionAI_favorites', JSON.stringify(favorites));
    
    // 更新收藏抽屜顯示
    updateFavoritesDrawer();
    
    // 視覺反饋
    const addBtn = document.querySelector(`[data-id="${id}"] .add-to-favorites`);
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
    
    showNotification(`已將「${title}」加入收藏！`, 'success');
    console.log('❤️ 新增收藏:', newFavorite);
}

/**
 * 從收藏中移除項目
 * @param {string} id - 項目ID
 */
function removeFromFavorites(id) {
    const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
    const updatedFavorites = favorites.filter(item => item.id !== id);
    
    localStorage.setItem('emotionAI_favorites', JSON.stringify(updatedFavorites));
    updateFavoritesDrawer();
    
    showNotification('已從收藏中移除！', 'info');
    console.log('🗑️ 移除收藏 ID:', id);
}

/**
 * 更新收藏小抽屜顯示
 */
function updateFavoritesDrawer() {
    const favoritesContent = document.getElementById('favoritesContent');
    if (!favoritesContent) {
        console.warn('⚠️ 收藏內容元素未找到');
        return;
    }
    
    const favorites = JSON.parse(localStorage.getItem('emotionAI_favorites') || '[]');
    
    if (favorites.length === 0) {
        favoritesContent.innerHTML = '<div class="favorites-placeholder">暫無收藏項目...</div>';
        return;
    }
    
    // 按類型分組顯示收藏項目
    const groupedFavorites = groupFavoritesByType(favorites);
    
    const favoritesHTML = Object.entries(groupedFavorites).map(([type, items]) => `
        <div class="favorite-type-group">
            <div class="favorite-type-header">
                <span class="favorite-type-icon">${getTypeIcon(type)}</span>
                <span class="favorite-type-name">${getTypeName(type)}</span>
                <span class="favorite-count">${items.length}</span>
            </div>
            <div class="favorite-items-list">
                ${items.map(item => `
                    <div class="favorite-item" data-id="${item.id}">
                        <div class="fav-content">
                            <div class="fav-details">
                                <div class="fav-title">${item.title}</div>
                                <div class="fav-desc">${item.desc}</div>
                                <div class="fav-date">收藏於 ${new Date(item.addedAt).toLocaleDateString('zh-TW')}</div>
                            </div>
                        </div>
                        <button class="remove-favorite" onclick="removeFromFavorites('${item.id}')" title="移除收藏">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    favoritesContent.innerHTML = favoritesHTML;
    console.log('❤️ 收藏抽屜已更新，共 ' + favorites.length + ' 個項目，' + Object.keys(groupedFavorites).length + ' 個類型');
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
 * 根據類型返回中文名稱
 * @param {string} type - 項目類型
 * @returns {string} - 中文名稱
 */
function getTypeName(type) {
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
        'recipe': '食譜'
    };
    return names[type] || '其他';
}

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

// 將函數綁定到全局作用域，以便HTML中的onclick可以調用
window.editGoal = editGoal;
window.addGoalToSequence = addGoalToSequence;
