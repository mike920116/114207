// FAQ 手風琴展開／收合
document.querySelectorAll('.faq-question').forEach(questionButton => {
  questionButton.addEventListener('click', () => {
    const answerElement = questionButton.nextElementSibling;
    answerElement.style.display =
      answerElement.style.display === 'block' ? 'none' : 'block';
  });
});
