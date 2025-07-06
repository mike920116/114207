/* === Diary List – Filtering, Sorting, Searching === */
document.addEventListener('DOMContentLoaded', () => {
    const diaryItems      = Array.from(document.querySelectorAll('.diary-item'));
    const diaryList       = document.querySelector('.diary-list');
    const emotionFilter   = document.getElementById('emotion-filter');
    const sortOption      = document.getElementById('sort-option');
    const searchInput     = document.getElementById('search-diary');
  
    /* --- Helpers --- */
    const parseDate = (item) => {
      const text = item.querySelector('.diary-date').textContent.trim().replace('📅', '').trim();
      return new Date(text.replace(/-/g, '/'));      // Safari‑friendly
    };
  
    const applyFilters = () => {
      const emotionVal = emotionFilter.value;
      const keyword    = searchInput.value.trim().toLowerCase();
  
      diaryItems.forEach(item => {
        const itemEmotion = item.dataset.emotion || '';
        const itemContent = item.querySelector('.diary-content').textContent.toLowerCase();
  
        const matchEmotion = emotionVal === 'all' || itemEmotion === emotionVal;
        const matchSearch  = keyword === '' || itemContent.includes(keyword);
  
        item.style.display = (matchEmotion && matchSearch) ? 'block' : 'none';
      });
    };
  
    const applySort = () => {
      const sorted = [...diaryItems].sort((a, b) => {
        const dateA = parseDate(a);
        const dateB = parseDate(b);
        return sortOption.value === 'newest'
          ? dateB - dateA
          : dateA - dateB;
      });
      sorted.forEach(el => diaryList.appendChild(el));
    };
  
    /* --- Event Listeners --- */
    emotionFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);
    sortOption.addEventListener('change', () => {
      applySort();
      applyFilters();          // keep current filter/search after sort
    });
  
    /* --- Init --- */
    applySort();
  });
  