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


