(()=>{

  /* ==== 主題切換 ==== */
  const root=document.documentElement,key='admin-theme';
  const themeBtn=document.createElement('button');
  themeBtn.className='theme-toggle';
  const icon=()=>root.classList.contains('dark-mode')?'🌞':'🌜';
  const render=()=>themeBtn.innerHTML=`<span>${icon()}</span>`;
  render();
  document.getElementById('theme-anchor').appendChild(themeBtn);

  themeBtn.onclick=()=>{
    root.classList.toggle('dark-mode');
    localStorage.setItem(key,root.classList.contains('dark-mode')?'dark':'light');
    render();
  };

  /* ==== 側欄 / 把手 ==== */
  const sidebar=document.getElementById('sidebar');
  const handle =document.getElementById('sidebar-handle');
  const toggle =()=>{
    sidebar.classList.toggle('collapsed');
    handle.textContent=sidebar.classList.contains('collapsed')?'⟩':'⟨';
  };

  handle.onclick=toggle;                 // 只把手可收合

  /* Esc 鍵收合 */
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!sidebar.classList.contains('collapsed'))toggle();
  });
})();
