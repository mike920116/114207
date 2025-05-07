(() => {
  /* ==== 主題切換 ==== */
  const root = document.documentElement, key = 'admin-theme';
  const themeBtn = document.createElement('button');
  themeBtn.className = 'theme-toggle';
  const icon = () => root.classList.contains('dark-mode') ? '🌞' : '🌜';
  const render = () => themeBtn.innerHTML = `<span>${icon()}</span>`;
  render();
  document.getElementById('theme-anchor')?.appendChild(themeBtn);
  themeBtn.onclick = () => {
    root.classList.toggle('dark-mode');
    localStorage.setItem(key, root.classList.contains('dark-mode') ? 'dark' : 'light');
    render();
  };

  /* ==== 側欄 / 把手 ==== */
  const sidebar = document.getElementById('sidebar');
  const handle = document.getElementById('sidebar-handle');
  const toggle = () => {
    sidebar.classList.toggle('collapsed');
    handle.textContent = sidebar.classList.contains('collapsed') ? '⟩' : '⟨';
  };
  handle.onclick = toggle;
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !sidebar.classList.contains('collapsed')) toggle();
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("session-list")) return;

  const socket = io("/chat");

  const listEls   = document.querySelectorAll(".session-item");
  const logBox    = document.getElementById("log-box");
  const replyBtn  = document.getElementById("reply-btn");
  const replyText = document.getElementById("reply-input");
  let currentId   = null;

  const sessionsExist = document.querySelectorAll('.session-item').length > 0;
  const noSessionMsg  = document.querySelector('.no-session');
  const sessionItems  = document.querySelectorAll('.session-item');

  if (sessionsExist && sessionItems.length > 0) {
    if (noSessionMsg) noSessionMsg.style.display = 'none';
  } else {
    if (noSessionMsg) noSessionMsg.style.display = 'block';
  }

  const subscribeToCurrentSession = () => {
    if (socket.connected && currentId) {
      socket.emit("subscribe_to_session", { session_id: currentId });
    }
  };

  socket.on('connect', () => {
    if (currentId) subscribeToCurrentSession();
  });

  socket.on('disconnect', reason => {
    console.log(`chat_panel.js: Socket disconnected. Reason: ${reason}`);
  });

  socket.on("user_left", ({ session_id, email, message }) => {
    const sessionItem = document.querySelector(`.session-item[data-sid='${session_id}']`);
    if (sessionItem) {
      sessionItem.classList.add("user-left");
      let leftMark = sessionItem.querySelector(".left-mark");
      if (!leftMark) {
        leftMark = document.createElement("span");
        leftMark.className = "left-mark badge bg-secondary";
        leftMark.style.marginLeft = "5px";
        sessionItem.appendChild(leftMark);
      }
      leftMark.innerText = "已離開";

      if (currentId === session_id) {
        const notificationDiv = document.createElement("div");
        notificationDiv.className = "system-notification";
        notificationDiv.innerText = message || `使用者 ${email} 已離開聊天`;
        logBox.appendChild(notificationDiv);
        logBox.scrollTop = logBox.scrollHeight;
      }
    }
  });

  socket.on("msg_added", ({ session_id, role, message, email }) => {
    if (session_id != currentId) {
      const sessionItem = document.querySelector(`.session-item[data-sid='${session_id}']`);
      if (sessionItem) {
        let badge = sessionItem.querySelector(".badge");
        if (!badge) {
          badge = document.createElement('span');
          badge.className = "badge bg-danger rounded-pill";
          sessionItem.appendChild(badge);
        }
        badge.innerText = parseInt(badge.innerText || '0') + 1;
      }
      return;
    }
    appendLog(role, message, email);
    logBox.scrollTop = logBox.scrollHeight;
  });

  socket.on("receive_message", ({ role, message, email }) => {
    if (!currentId) return;
    appendLog(role, message, email);
    logBox.scrollTop = logBox.scrollHeight;
  });

  socket.on("need_human", d => {
    prependSessionItem(d.session_id, d.email, d.message_count || 1);
    if (noSessionMsg) noSessionMsg.style.display = 'none';
  });

  function prependSessionItem(sessionId, userEmail, messageCount = 1) {
    const sessionContainer = document.getElementById("session-container");
    let existingItem = document.querySelector(`.session-item[data-sid='${sessionId}']`);

    if (existingItem) {
      const badge = existingItem.querySelector(".badge");
      if (badge) badge.innerText = parseInt(badge.innerText || '0') + messageCount;
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
      currentId = sessionId;
      await loadLogs(currentId);
      const badge = newItem.querySelector(".badge");
      if (badge) badge.innerText = "0";
      subscribeToCurrentSession();
    });
    sessionContainer.prepend(newItem);
    updateSessionVisibility();
  }

  function updateSessionVisibility() {
    const hasItems = document.querySelectorAll('.session-item').length > 0;
    if (hasItems && noSessionMsg) noSessionMsg.style.display = 'none';
    else if (!hasItems && noSessionMsg) noSessionMsg.style.display = 'block';
  }

  listEls.forEach(el => {
    el.addEventListener("click", async () => {
      listEls.forEach(o => o.classList.remove("active"));
      el.classList.add("active");
      currentId = el.dataset.sid;
      await loadLogs(currentId);
      const badge = el.querySelector(".badge");
      if (badge) badge.innerText = "0";
      subscribeToCurrentSession();
    });
  });

  async function loadLogs(sid) {
    logBox.innerHTML = "<p>載入中…</p>";
    const r = await fetch(`/admin/chat/logs/${sid}`);
    const arr = await r.json();
    logBox.innerHTML = "";
    arr.forEach(row => appendLog(row.role, row.message, row.email || (row.role === 'user' ? '使用者' : 'AI/管理員')));
    logBox.scrollTop = logBox.scrollHeight;
  }

  function appendLog(role, msg, senderName) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    let senderDisplay = role === 'user' ? (senderName || '使用者') :
                        role === 'admin' ? '管理員' : 'AI';
    div.innerHTML = `<div class="role">${senderDisplay}</div>${msg}`;
    logBox.appendChild(div);
  }

  async function send() {
    const txt = replyText.value.trim();
    if (!txt || !currentId) return;
    replyText.value = "";
    await fetch("/admin/chat/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: currentId, message: txt })
    });
    logBox.scrollTop = logBox.scrollHeight;
  }

  replyBtn.addEventListener("click", send);
  replyText.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  updateSessionVisibility();
});
