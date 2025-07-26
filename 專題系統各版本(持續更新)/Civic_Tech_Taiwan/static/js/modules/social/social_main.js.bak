document.addEventListener('DOMContentLoaded', () => {

  /* --- 按讚與檢舉 (示範) --- */
  document.querySelectorAll('.like-btn').forEach(likeButton => {
    likeButton.addEventListener('click', () => {
      const currentLikes = parseInt(likeButton.textContent.replace(/\D/g,'')) + 1;
      likeButton.textContent = `👍 ${currentLikes}`;
    });
  });

  document.querySelectorAll('.report-btn').forEach(reportButton => {
    reportButton.addEventListener('click', () => alert('已送出檢舉 (demo)'));
  });

  /* --- 心情分類 --- */
  const filterTags = document.querySelectorAll('.tag');
  const postCards = document.querySelectorAll('.post-card');
  filterTags.forEach(tag => tag.addEventListener('click', () => {
    filterTags.forEach(otherTag => otherTag.classList.remove('active'));
    tag.classList.add('active');
    const filterType = tag.dataset.filter;
    postCards.forEach(card => card.style.display =
      (filterType === 'all' || filterType === card.dataset.mood) ? 'block' : 'none');
  }));

  /* --- 更多下拉 / 深色模式 --- */
  const moreToggle = document.querySelector('.more-toggle');
  const moreMenu   = document.querySelector('.more-menu');
  moreToggle.addEventListener('click', event => {
    event.stopPropagation();
    moreMenu.style.display = moreMenu.style.display === 'flex' ? 'none' : 'flex';
  });
  document.addEventListener('click', () => (moreMenu.style.display = 'none'));
  document.getElementById('toggle-dark').addEventListener('click', () => {
    if (typeof toggleDarkMode === 'function') toggleDarkMode();
  });
});

// = 功能尚未開通模組 =
document.querySelectorAll('a[href="#"]').forEach(featureLink => {
  featureLink.addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('feature-modal')?.classList.add('active');
  });
});

function closeFeatureModal() {
  document.getElementById('feature-modal')?.classList.remove('active');
}
