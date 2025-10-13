// 等級規範頁面的 JavaScript 功能
document.addEventListener('DOMContentLoaded', function() {
    
    // 深色模式切換
    const darkToggle = document.getElementById('toggle-dark');
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            if (typeof toggleDarkMode === 'function') {
                toggleDarkMode();
            }
        });
    }
    
    // 返回頂部按鈕功能
    const backToTopBtn = document.getElementById('back-to-top');
    
    // 監聽滾動事件
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // 平滑滾動到頂部
    window.scrollToTop = function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    // 等級卡片懸停效果增強
    const levelCards = document.querySelectorAll('.level-card');
    levelCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const level = this.dataset.level;
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // 進度條動畫
    const progressBars = document.querySelectorAll('.progress-fill');
    
    // 使用 Intersection Observer 來觸發動畫
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const targetWidth = progressBar.style.width;
                
                // 重置寬度並觸發動畫
                progressBar.style.width = '0%';
                setTimeout(() => {
                    progressBar.style.transition = 'width 1.5s ease-in-out';
                    progressBar.style.width = targetWidth;
                }, 100);
                
                // 移除觀察者，避免重複觸發
                observer.unobserve(progressBar);
            }
        });
    }, {
        threshold: 0.5
    });
    
    // 觀察所有進度條
    progressBars.forEach(bar => {
        observer.observe(bar);
    });
    
    // FAQ 展開/收合功能（使用 .active 與 CSS max-height 進行切換）
    window.toggleFAQ = function(questionElement) {
        const faqItem = questionElement.parentElement;
        const answer = faqItem.querySelector('.faq-answer');
        const toggle = questionElement.querySelector('.faq-toggle');

        // 判斷目前是否已展開
        const wasActive = faqItem.classList.contains('active');

        // 先關閉所有已展開的項目
        document.querySelectorAll('.faq-item.active').forEach(item => {
            item.classList.remove('active');
            const t = item.querySelector('.faq-toggle');
            if (t) t.textContent = '+';
        });

        // 若之前沒有展開，則展開此次點擊的項目
        if (!wasActive) {
            faqItem.classList.add('active');
            if (toggle) toggle.textContent = '−';

            // 平滑滾動到展開的內容（稍微延遲以配合 CSS 過渡）
            setTimeout(() => {
                if (answer) {
                    answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 150);
        }
    };
    
    // 等級卡片點擊效果
    levelCards.forEach(card => {
        card.addEventListener('click', function() {
            const level = this.dataset.level;
            const levelInfo = this.querySelector('.level-title').textContent;
            
            // 顯示等級詳情提示
            showLevelTooltip(this, level, levelInfo);
        });
    });
    
    // 顯示等級詳情提示
    function showLevelTooltip(cardElement, level, levelTitle) {
        // 移除現有的提示
        const existingTooltip = document.querySelector('.level-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // 創建新的提示
        const tooltip = document.createElement('div');
        tooltip.className = 'level-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <h4>等級 ${level}: ${levelTitle}</h4>
                <p>點擊查看此等級的詳細特權和要求</p>
                <small>提示：持續參與社群活動即可升級</small>
            </div>
        `;
        
        // 設置樣式
        tooltip.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, #5B7F47, #4A6B38);
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            max-width: 250px;
            font-size: 0.9rem;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            pointer-events: none;
        `;
        
        // 計算位置
        const rect = cardElement.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
        
        // 添加到頁面
        document.body.appendChild(tooltip);
        
        // 觸發動畫
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateX(-50%) translateY(-100%) translateY(-5px)';
        }, 10);
        
        // 3秒後自動消失
        setTimeout(() => {
            if (tooltip.parentElement) {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateX(-50%) translateY(-100%) translateY(5px)';
                setTimeout(() => tooltip.remove(), 300);
            }
        }, 3000);
    }
    
    // 滾動時的視差效果
    // window.addEventListener('scroll', function() {
    //     const scrolled = window.pageYOffset;
    //     const parallaxElements = document.querySelectorAll('.overview-icon');
        
    //     parallaxElements.forEach(element => {
    //         const speed = 0.5;
    //         element.style.transform = `translateY(${scrolled * speed}px)`;
    //     });
    // });
    
    // 數字計數動畫
    function animateNumbers() {
        const numberElements = document.querySelectorAll('.formula-item, .req-text');
        
        numberElements.forEach(element => {
            const text = element.textContent;
            const numbers = text.match(/\d+/g);
            
            if (numbers) {
                numbers.forEach(num => {
                    const targetNum = parseInt(num);
                    if (targetNum > 1) {
                        animateNumber(element, targetNum, text);
                    }
                });
            }
        });
    }
    
    function animateNumber(element, target, originalText) {
        let current = 0;
        const increment = target / 30; // 30 幀動畫
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            const newText = originalText.replace(/\d+/, Math.floor(current));
            element.textContent = newText;
        }, 50);
    }
    
    // 頁面載入完成後執行數字動畫
    setTimeout(animateNumbers, 500);
    
    // 鍵盤快捷鍵
    document.addEventListener('keydown', function(e) {
        // ESC 鍵關閉所有展開的 FAQ
        if (e.key === 'Escape') {
            document.querySelectorAll('.faq-item').forEach(item => {
                const answer = item.querySelector('.faq-answer');
                const toggle = item.querySelector('.faq-toggle');
                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                    toggle.textContent = '+';
                    item.classList.remove('expanded');
                }
            });
        }
        
        // Home 鍵返回頂部
        if (e.key === 'Home') {
            e.preventDefault();
            window.scrollToTop();
        }
    });
    
    // 添加載入完成的類別，觸發 CSS 動畫
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
    
    console.log('🎯 等級規範頁面載入完成');
});
