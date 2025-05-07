/* = XLSX 解析；若沒用到可刪 = */
var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};
function filledCell(cell){return cell!=='' && cell!=null}
function loadFileData(filename){
  if(gk_isXlsx && gk_xlsxFileLookup[filename]){
    try{
      var wb=XLSX.read(gk_fileData[filename],{type:'base64'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var json=XLSX.utils.sheet_to_json(ws,{header:1,blankrows:false,defval:''});
      var filtered=json.filter(r=>r.some(filledCell));
      var hdr=filtered.findIndex((r,i)=>r.filter(filledCell).length>=filtered[i+1]?.filter(filledCell).length);
      if(hdr===-1||hdr>25)hdr=0;
      var csv=XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(filtered.slice(hdr)),{header:1});
      return csv;
    }catch(e){console.error(e);return""}
  }
  return gk_fileData[filename]||"";
}

/* = UI 互動 = */
// 側邊欄開合
const hamburger=document.querySelector('.hamburger');
const sidebar=document.querySelector('.sidebar');
if(hamburger&&sidebar){
  hamburger.addEventListener('click',()=>sidebar.classList.toggle('active'));
}

// 子選單 (sidebar) 展開 / 收起
function toggleSubMenu(el){
  // 關閉其他
  document.querySelectorAll('.menu-item').forEach(item=>{
    if(item!==el){
      item.classList.remove('active');
      const sm=item.nextElementSibling;
      if(sm)sm.classList.remove('active');
    }
  });
  el.classList.toggle('active');
  const sub=el.nextElementSibling;
  if(sub)sub.classList.toggle('active');
}

// 桌機 nav hover dropdown
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('mouseenter',function(){
    document.querySelectorAll('.nav-item').forEach(o=>{
      if(o!==this){
        o.classList.remove('active');
        const d=o.querySelector('.dropdown');
        if(d)d.classList.remove('active');
      }
    });
    this.classList.add('active');
    const dd=this.querySelector('.dropdown');
    if(dd)dd.classList.add('active');
  });
  item.addEventListener('mouseleave',function(){
    this.classList.remove('active');
    const dd=this.querySelector('.dropdown');
    if(dd)dd.classList.remove('active');
  });
});

// 深色模式開關與記憶
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// 頁面載入時自動套用使用者偏好
document.addEventListener("DOMContentLoaded", function () {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  // 原本的登入驗證與彈窗初始化請保留
});

// 頁面轉場效果
document.addEventListener("DOMContentLoaded", function() {
  // 添加一個頁面載入過渡元素
  const transitionElement = document.createElement('div');
  transitionElement.id = 'page-transition';
  transitionElement.style.position = 'fixed';
  transitionElement.style.top = '0';
  transitionElement.style.left = '0';
  transitionElement.style.width = '100%';
  transitionElement.style.height = '100%';
  transitionElement.style.backgroundColor = 'rgba(255, 255, 255, 0)';
  transitionElement.style.zIndex = '9999';
  transitionElement.style.pointerEvents = 'none';
  transitionElement.style.transition = 'opacity 0.3s ease';
  transitionElement.style.opacity = '0';
  document.body.appendChild(transitionElement);

  // 處理所有鏈接的點擊事件
  document.querySelectorAll('a').forEach(link => {
    // 排除外部鏈接、錨點鏈接及開發中功能
    if (
      link.getAttribute('href') && 
      !link.getAttribute('href').startsWith('http') && 
      !link.getAttribute('href').startsWith('#') && 
      !link.classList.contains('auth-required')
    ) {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // 如果是需要登錄才能訪問的頁面，但用戶未登錄，則顯示提示
        if (this.classList.contains('auth-required') && !window.IS_AUTHENTICATED) {
          return; // 讓原始的授權檢查處理
        }
        
        // 觸發頁面過渡動畫
        e.preventDefault();
        
        transitionElement.style.backgroundColor = 
          document.body.classList.contains('dark-mode') ? 
          'rgba(25, 25, 35, 0.6)' : 'rgba(255, 255, 255, 0.6)';
        transitionElement.style.opacity = '1';
        
        // 延遲跳轉，讓動畫有時間顯示
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      });
    }
  });
  
  // 頁面加載完成後的動畫
  window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      document.body.style.opacity = '1';
    }, 50);
  });
});

// 平滑滾動
document.querySelectorAll('a[data-scroll],.home-button,.help-button').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const id=a.getAttribute('data-scroll')||'#home';
    const tgt=document.querySelector(id);
    if(tgt)tgt.scrollIntoView({behavior:'smooth'});
  });
});

// 登入驗證
document.addEventListener("DOMContentLoaded", function () {
  // 假設你的 base.html 有用 Jinja 傳入這個變數
  const isAuthenticated = window.IS_AUTHENTICATED || false;

  if (!isAuthenticated) {
    const links = document.querySelectorAll('.auth-required');
    links.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        alert('請先登入');
        window.location.href = '/user/login/form';
      });
    });
  }
});

// 功能尚未開通彈窗觸發邏輯
document.addEventListener("DOMContentLoaded", function () {
  const featureModal = document.getElementById("feature-modal");
  const unavailableLinks = document.querySelectorAll('a[href="#"]:not([data-scroll])');

  unavailableLinks.forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      featureModal.classList.add("active");
    });
  });
});

function closeFeatureModal() {
  document.getElementById("feature-modal").classList.remove("active");
}

// 波紋點擊效果
document.addEventListener("DOMContentLoaded", function() {
  // 為所有按鈕和連結添加波紋效果
  const buttons = document.querySelectorAll('button, .button, [type="button"], [type="submit"], a.btn, .nav-item > a, .menu-item');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // 檢查按鈕是否已定位 (position)
      const position = getComputedStyle(this).position;
      if (position === 'static') {
        this.style.position = 'relative';
      }
      
      // 創建波紋元素
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      this.appendChild(ripple);
      
      // 計算位置
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = e.clientX - rect.left - (size / 2) + 'px';
      ripple.style.top = e.clientY - rect.top - (size / 2) + 'px';
      
      // 動畫結束後移除元素
      setTimeout(() => {
        ripple.remove();
      }, 600); // 與動畫時間相符
    });
  });
});


