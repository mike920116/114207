/* ========== 佈局側欄 & 選單 ========== */
const hamburger = document.querySelector('.hamburger');
const sidebar   = document.querySelector('.sidebar');
if (hamburger && sidebar) {
  hamburger.addEventListener('click', () => sidebar.classList.toggle('active'));
}

function toggleSubMenu(el) {
  document.querySelectorAll('.menu-item').forEach(item => {
    if (item !== el) {
      item.classList.remove('active');
      item.nextElementSibling?.classList.remove('active');
    }
  });
  el.classList.toggle('active');
  el.nextElementSibling?.classList.toggle('active');
}

/* 桌面 Nav Hover Dropdown */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('mouseenter', () => {
    document.querySelectorAll('.nav-item').forEach(o => {
      if (o !== item) {
        o.classList.remove('active');
        o.querySelector('.dropdown')?.classList.remove('active');
      }
    });
    item.classList.add('active');
    item.querySelector('.dropdown')?.classList.add('active');
  });
  item.addEventListener('mouseleave', () => {
    item.classList.remove('active');
    item.querySelector('.dropdown')?.classList.remove('active');
  });
});

/* ========== 深色模式 ========== */
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

/* ========== DOMContentLoaded 初始化 ========== */
document.addEventListener('DOMContentLoaded', () => {
  /* 主題記憶 */
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');

  /* 轉場層 */
  const transition = document.createElement('div');
  transition.id = 'page-transition';
  Object.assign(transition.style, {
    position: 'fixed',
    top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0)',
    zIndex: 9999,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease',
    opacity: '0'
  });
  document.body.appendChild(transition);

  /* 內部連結轉場動畫 */
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('#') && !link.classList.contains('auth-required')) {
      link.addEventListener('click', e => {
        e.preventDefault();

        /* 登入檢查 */
        if (link.classList.contains('auth-required') && !window.IS_AUTHENTICATED) return;

        transition.style.backgroundColor = document.body.classList.contains('dark-mode')
          ? 'rgba(25,25,35,0.6)' : 'rgba(255,255,255,0.6)';
        transition.style.opacity = '1';
        setTimeout(() => window.location.href = href, 300);
      });
    }
  });

  /* 頁面淡入 */
  window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    setTimeout(() => (document.body.style.opacity = '1'), 50);
  });

  /* 未登入攔截 */
  if (!window.IS_AUTHENTICATED) {
    document.querySelectorAll('.auth-required').forEach(l => {
      l.addEventListener('click', e => {
        e.preventDefault();
        alert('請先登入');
        window.location.href = '/user/login/form';
      });
    });
  }

  /* 功能尚未開通彈窗 */
  document.querySelectorAll('a[href=\"#\"]:not([data-scroll])').forEach(l => {
    l.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('feature-modal')?.classList.add('active');
    });
  });

  /* 平滑滾動 */
  document.querySelectorAll('a[data-scroll], .home-button, .help-button').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(a.getAttribute('data-scroll') || '#home')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* 波紋效果 */
  const isMobile = window.innerWidth <= 768;
  document.querySelectorAll('button, .button, [type=\"button\"], [type=\"submit\"], a.btn, .nav-item > a, .menu-item')
    .forEach(btn => btn.addEventListener('click', e => {
      const pos = getComputedStyle(btn).position;
      if (pos === 'static') btn.style.position = 'relative';

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      btn.appendChild(ripple);

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * (isMobile ? 0.8 : 1);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top  = `${e.clientY - rect.top  - size / 2}px`;

      setTimeout(() => ripple.remove(), isMobile ? 500 : 600);
    }));
});

/* ========== 功能尚未開通：關閉按鈕 ========== */
function closeFeatureModal() {
  document.getElementById('feature-modal')?.classList.remove('active');
}

/* ========== 修正返回時白霧殘留 ========== */
window.addEventListener('pageshow', () => {
  const transition = document.getElementById('page-transition');
  if (transition) {
    transition.style.transition = 'none';
    transition.style.opacity = '0';
    transition.style.backgroundColor = 'transparent';
    transition.style.pointerEvents = 'none';
    setTimeout(() => transition.remove(), 500);
  }
  document.body.style.opacity = '1';
  document.body.style.transition = 'none';
});

/* = 公告跑馬燈 (首頁) = */
document.addEventListener("DOMContentLoaded", () => {
  const ul = document.getElementById("announce-scroll");
  if (!ul) return;

  function adjustAnnouncementStyles(){
  const board = document.querySelector('.announcement-board-home');
  const title = document.querySelector('.announcement-title');
  if(!board||!title) return;

  const w = window.innerWidth;
  /* 先清掉舊 inline */
  ['padding','margin'].forEach(p=>board.style.removeProperty(p));
  ['fontSize','marginBottom'].forEach(p=>title.style.removeProperty(p));

  /* 手機 & 平板仍用 inline，但也改成 clamp 寫法 */
  if(w<=768){
    board.style.padding = 'clamp(24px,5vw,40px) 20px 40px';
    board.style.margin  = '0 16px';
    title.style.fontSize = '26px';
    title.style.marginBottom = '16px';
  }else if(w<=1024){
    board.style.padding = 'clamp(36px,5vw,60px) clamp(4vw,6vw,40px)';
  }
}

  fetch("/api/announcements")
    .then(r => r.json())
    .then(arr => {
      if (!Array.isArray(arr) || arr.length === 0) {
        ul.innerHTML = '<li><span class="announce-title">暫無公告</span></li>';
        return;
      }      
      
      // 格式化公告項目：標題 - 內容 - 時間
      const items = arr.map(a => {
        const date = a.created_at ? new Date(a.created_at).toLocaleDateString('zh-TW') : '';
        return `<li>
          <span class="announce-title">${a.title || '公告'}</span>
          <span class="announce-content">${a.body || ''}</span>
          <span class="announce-date">${date}</span>
        </li>`;
      }).join("");

      // ✅ 為了實現滾動效果，複製內容以產生無縫循環
      ul.innerHTML = items + items;
      
      // 初始化響應式樣式
      adjustAnnouncementStyles();
    })
    .catch(err => {
      console.error('載入公告失敗:', err);
      ul.innerHTML = '<li><span class="announce-title">載入公告失敗</span></li>';
    });

  // 監聽窗口大小變化
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(adjustAnnouncementStyles, 150);
  });
});




