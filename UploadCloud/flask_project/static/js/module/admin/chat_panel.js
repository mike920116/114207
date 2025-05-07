document.addEventListener("DOMContentLoaded", () => {
  const socket = io("/chat");

  const listEls   = document.querySelectorAll(".session-item");
  const logBox    = document.getElementById("log-box");
  const replyBtn  = document.getElementById("reply-btn");
  const replyText = document.getElementById("reply-input");
  let   currentId = null; // 代表當前選中的 session_id
  
  // 確保條件顯示正確 - 從 HTML 移到這裡
  const sessionsExist = document.querySelectorAll('.session-item').length > 0;
  const noSessionMsg = document.querySelector('.no-session');
  const sessionItems = document.querySelectorAll('.session-item');
  
  if (sessionsExist && sessionItems.length > 0) {
    // 有會話時確保「無使用者」訊息不顯示
    if (noSessionMsg) {
      noSessionMsg.style.display = 'none';
    }
  } else {
    // 無會話時確保「無使用者」訊息顯示
    if (noSessionMsg) {
      noSessionMsg.style.display = 'block';
    }
  }

  // 新增：訂閱到 session 的函數
  const subscribeToCurrentSession = () => {
    if (socket.connected && currentId) {
      console.log(`chat_panel.js: Subscribing to session_id: ${currentId}`);
      socket.emit("subscribe_to_session", { session_id: currentId });
    } else {
      console.log("chat_panel.js: Cannot subscribe. Socket connected: " + socket.connected + ", currentId: " + currentId);
    }
  };

  /* WebSocket 事件監聽器應在此處定義，以確保能夠存取 DOMContentLoaded 範圍內的函數和變數 */
  socket.on('connect', () => {
    console.log('chat_panel.js: Socket connected to /chat namespace.');
    // 當連線或重新連線成功時，如果已經選中了某個 session (currentId)，則重新訂閱
    if (currentId) {
      subscribeToCurrentSession();
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`chat_panel.js: Socket disconnected from /chat namespace. Reason: ${reason}`);
  });

  /* 使用者離開聊天 */
  socket.on("user_left", (data) => {
    const { session_id, email, message } = data;
    console.log("收到使用者離開事件:", data);
    
    // 若有相應的聊天項，添加離開標記
    const sessionItem = document.querySelector(`.session-item[data-sid='${session_id}']`);
    if (sessionItem) {
      // 添加標記使會話項顯示使用者已離開
      sessionItem.classList.add("user-left");
      
      // 在會話項中添加或更新標記
      let leftMark = sessionItem.querySelector(".left-mark");
      if (!leftMark) {
        leftMark = document.createElement("span");
        leftMark.className = "left-mark badge bg-secondary";
        leftMark.style.marginLeft = "5px";
        sessionItem.appendChild(leftMark);
      }
      leftMark.innerText = "已離開";
      
      // 如果是目前選中的會話，在聊天框中顯示通知
      if (currentId === session_id) {
        const notificationDiv = document.createElement("div");
        notificationDiv.className = "system-notification";
        notificationDiv.style.backgroundColor = "#f8f9fa";
        notificationDiv.style.color = "#6c757d";
        notificationDiv.style.padding = "8px";
        notificationDiv.style.margin = "10px 0";
        notificationDiv.style.borderRadius = "5px";
        notificationDiv.style.textAlign = "center";
        notificationDiv.innerText = message || `使用者 ${email} 已離開聊天`;
        logBox.appendChild(notificationDiv);
        logBox.scrollTop = logBox.scrollHeight;
      }
    }
  });

  /* 有新訊息 (user / ai / admin) */
  socket.on("msg_added", (data) => {
    const { session_id, role, message, email } = data;

    // 只更新當前選中的聊天視窗；若非當前選中，則可能更新列表中的未讀計數 (待實現)
    if (session_id != currentId) {
        // 如果訊息不是來自當前開啟的聊天，可以考慮更新左側列表對應會話的未讀標記
        const sessionItem = document.querySelector(`.session-item[data-sid='${session_id}']`);
        if (sessionItem) {
            let badge = sessionItem.querySelector(".badge");
            if (!badge) {
                badge = document.createElement('span');
                badge.className = "badge bg-danger rounded-pill";
                // 嘗試將徽章放在 email 旁邊或一個固定的位置
                const emailSpan = sessionItem.querySelector('.email');
                if (emailSpan) {
                    emailSpan.parentNode.insertBefore(badge, emailSpan.nextSibling);
                }
            }
            badge.innerText = parseInt(badge.innerText || '0') + 1;
        }
        return;
    }

    appendLog(role, message, email);
    logBox.scrollTop = logBox.scrollHeight;
  });

  /* 接收即時訊息並更新聊天面板 */
  socket.on("receive_message", (data) => {
    const { role, message, email } = data;
    if (!currentId) return;
    
    appendLog(role, message, email);
    logBox.scrollTop = logBox.scrollHeight;
  });

  /* 使用者按了「真人客服」 */
  socket.on("need_human", d => {
    console.log("收到 need_human 事件:", d); 
    prependSessionItem(d.session_id, d.email, d.message_count || 1);
    
    // 當有新使用者呼叫客服時，隱藏「無使用者」提示
    const noSessionMsg = document.querySelector('.no-session');
    if (noSessionMsg) {
      noSessionMsg.style.display = 'none';
    }
  });

  // 修改 prependSessionItem 函數，修正會話項目新增的位置
  function prependSessionItem(sessionId, userEmail, messageCount = 1) {
    console.log("prependSessionItem 被呼叫:", sessionId, userEmail, messageCount); 
    // 找到會話容器而非整個 session-list
    const sessionContainer = document.getElementById("session-container");
    if (!sessionContainer) {
      console.error("找不到 #session-container 元素");
      return;
    }

    let existingItem = document.querySelector(`.session-item[data-sid='${sessionId}']`);
    
    if (existingItem) {
      console.log("會話已存在，移至頂部並更新計數:", sessionId);
      let badge = existingItem.querySelector(".badge");
      if (badge) {
        badge.innerText = parseInt(badge.innerText || '0') + (messageCount > 0 ? messageCount : 1); 
      }
      // 移動到容器的最前面，而非整個 session-list
      sessionContainer.prepend(existingItem); 
      return;
    }

    const newItem = document.createElement("div");
    newItem.className = "session-item";
    newItem.dataset.sid = sessionId;
    newItem.innerHTML = `
      <span class="user-mail">${userEmail}</span>
      <span class="badge">${messageCount}</span>
    `;
    newItem.addEventListener("click", async () => {
      document.querySelectorAll(".session-item").forEach(o => o.classList.remove("active"));
      newItem.classList.add("active");
      currentId = sessionId; // 更新 currentId
      await loadLogs(currentId);
      const badge = newItem.querySelector(".badge");
      if (badge) badge.innerText = "0"; // 點擊後清除未讀
      subscribeToCurrentSession(); // 選中新的 session 後，進行訂閱
    });
    
    // 將新項目添加到容器的最前面，而非整個 session-list
    sessionContainer.prepend(newItem);
    
    // 更新會話顯示狀態
    updateSessionVisibility();
  }

  // 新增函數來更新會話顯示狀態
  function updateSessionVisibility() {
    const hasItems = document.querySelectorAll('.session-item').length > 0;
    const noSessionMsg = document.querySelector('.no-session');
    
    if (hasItems && noSessionMsg) {
      noSessionMsg.style.display = 'none';
    } else if (!hasItems && noSessionMsg) {
      noSessionMsg.style.display = 'block';
    }
  }

  listEls.forEach(el => {
    el.addEventListener("click", async () => {
      listEls.forEach(o => o.classList.remove("active"));
      el.classList.add("active");
      currentId = el.dataset.sid; // 更新 currentId
      await loadLogs(currentId);
      const badge = el.querySelector(".badge");
      if (badge) badge.innerText = "0";
      subscribeToCurrentSession(); // 選中新的 session 後，進行訂閱
    });
  });

  async function loadLogs(sid){
    logBox.innerHTML = "<p>載入中…</p>";
    const r   = await fetch(`/admin/chat/logs/${sid}`);
    const arr = await r.json();
    logBox.innerHTML = "";
    arr.forEach(row => appendLog(row.role, row.message, row.email || (row.role === 'user' ? '使用者' : 'AI/管理員')));
    logBox.scrollTop = logBox.scrollHeight;
  }

  function appendLog(role, msg, senderName) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    
    let senderDisplay = "";
    if (role === 'user') {
        senderDisplay = senderName || '使用者';
    } else if (role === 'admin') {
        senderDisplay = '管理員';
    } else {
        senderDisplay = 'AI';
    }

    div.innerHTML = `<div class="role">${senderDisplay}</div>${msg}`;
    logBox.appendChild(div);
  }

  /* 送出管理員回覆 ------------------------------------*/
  async function send(){
    const txt = replyText.value.trim();
    if(!txt || !currentId) return;

    replyText.value="";

    await fetch("/admin/chat/reply",{
      method :"POST",
      headers:{"Content-Type":"application/json"},
      body   :JSON.stringify({session_id:currentId,message:txt})
    });
    logBox.scrollTop = logBox.scrollHeight;
  }
  replyBtn.addEventListener("click", send);
  replyText.addEventListener("keydown",e=>{
    if(e.key==="Enter" && !e.shiftKey){e.preventDefault();send();}
  });
  
  // 初始檢查並更新會話顯示狀態
  updateSessionVisibility();
});
