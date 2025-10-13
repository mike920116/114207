/**
 * FAQ 手風琴展開／收合功能
 * 支援手風琴模式（一次只展開一個）和多展開模式
 */

// 配置選項
const FAQ_CONFIG = {
  accordionMode: true  // true: 手風琴模式（一次只展開一個）, false: 允許多個同時展開
};

// 初始化 FAQ 功能
document.addEventListener('DOMContentLoaded', () => {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(questionButton => {
    questionButton.addEventListener('click', function() {
      // 獲取對應的答案元素
      const answerElement = this.nextElementSibling;
      
      // 檢查當前項目是否已展開
      const isCurrentlyActive = this.classList.contains('active');
      
      // 如果是手風琴模式，先關閉所有其他項目
      if (FAQ_CONFIG.accordionMode && !isCurrentlyActive) {
        faqQuestions.forEach(otherQuestion => {
          if (otherQuestion !== this) {
            otherQuestion.classList.remove('active');
            const otherAnswer = otherQuestion.nextElementSibling;
            if (otherAnswer && otherAnswer.classList.contains('faq-answer')) {
              otherAnswer.classList.remove('active');
            }
          }
        });
      }
      
      // 切換當前項目的狀態
      this.classList.toggle('active');
      
      // 確保 answerElement 存在且是 faq-answer 類別
      if (answerElement && answerElement.classList.contains('faq-answer')) {
        answerElement.classList.toggle('active');
      }
    });
  });
});

