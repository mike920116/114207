// FAQ 手風琴展開／收合
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    answer.style.display =
      answer.style.display === 'block' ? 'none' : 'block';
  });
});
