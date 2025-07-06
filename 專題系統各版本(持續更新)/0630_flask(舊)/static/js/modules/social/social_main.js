document.addEventListener('DOMContentLoaded', () => {

  /* --- 按讚與檢舉 (示範) --- */
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.textContent.replace(/\D/g,'')) + 1;
      btn.textContent = `👍 ${num}`;
    });
  });

  document.querySelectorAll('.report-btn').forEach(btn => {
    btn.addEventListener('click', () => alert('已送出檢舉 (demo)'));
  });

  /* --- 心情分類 --- */
  const tags  = document.querySelectorAll('.tag');
  const cards = document.querySelectorAll('.post-card');
  tags.forEach(t => t.addEventListener('click', () => {
    tags.forEach(o => o.classList.remove('active'));
    t.classList.add('active');
    const f = t.dataset.filter;
    cards.forEach(c => c.style.display =
      (f === 'all' || f === c.dataset.mood) ? 'block' : 'none');
  }));

  /* --- 更多下拉 / 深色模式 --- */
  const moreToggle = document.querySelector('.more-toggle');
  const moreMenu   = document.querySelector('.more-menu');
  moreToggle.addEventListener('click', e => {
    e.stopPropagation();
    moreMenu.style.display = moreMenu.style.display === 'flex' ? 'none' : 'flex';
  });
  document.addEventListener('click', () => (moreMenu.style.display = 'none'));
  document.getElementById('toggle-dark').addEventListener('click', () => {
    if (typeof toggleDarkMode === 'function') toggleDarkMode();
  });
});

// = 功能尚未開通模組 =
document.querySelectorAll('a[href="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('feature-modal')?.classList.add('active');
  });
});

function closeFeatureModal() {
  document.getElementById('feature-modal')?.classList.remove('active');
}
