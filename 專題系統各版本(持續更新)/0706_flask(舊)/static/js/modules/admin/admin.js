/* static/js/modules/admin/admin.js
   --------------------------------------------------
   – 後台客服面板
   – 2025-05-18 fix:
     1. user_left 後立即刪除列表項，並記到 localStorage
     2. 重新整理時排除已關閉會話、自動選第一個
   – 2025-05-25 fix:
     - 公告刪除 selector 調整，行 / 卡片即時移除
   -------------------------------------------------- */

(() => {
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

  const sidebar = document.getElementById('sidebar');
  const handle  = document.getElementById('sidebar-handle');
  const toggle  = () => {
    sidebar.classList.toggle('collapsed');
    handle.textContent = sidebar.classList.contains('collapsed') ? '⟩' : '⟨';
  };
  handle.onclick = toggle;
  document.addEventListener('keydown', eventData => {
    if (eventData.key === 'Escape' && !sidebar.classList.contains('collapsed')) toggle();
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("session-list")) return;

  const toStr = v => (v != null ? String(v) : null);

  const socket = io("/chat");

  const listEls      = document.querySelectorAll(".session-item");
  const logBox       = document.getElementById("log-box");
  const replyButton  = document.getElementById("reply-btn");
  const replyText    = document.getElementById("reply-input");
  const noSessionMsg = document.querySelector('.no-session');

  listEls.forEach(element => {
    const sid = toStr(element.dataset.sid);
    if (localStorage.getItem(`closed_${sid}`) === '1') element.remove();
  });

  updateSessionVisibility();

  let currentId = null;
  localStorage.removeItem("adminCurrentId");  // 不預先選擇任何會話

  const subscribe = () => {
    if (socket.connected && currentId) {
      socket.emit("subscribe_to_session", { session_id: currentId, role: "admin" });
    }
  };

  // socket.on('connect', subscribe); ← 已移除

  socket.on("user_left", ({ session_id, email, message }) => {
    session_id = toStr(session_id);
    localStorage.setItem(`closed_${session_id}`, '1');
    const item = document.querySelector(`.session-item[data-sid='${session_id}']`);
    if (item) item.remove();
    updateSessionVisibility();

    if (currentId === session_id) {
      logBox.innerHTML = "";
      const note = document.createElement("div");
      note.className = "system-notification";
      note.innerText = message || `使用者 ${email} 已離開聊天`;
      logBox.appendChild(note);
      currentId = null;
      localStorage.removeItem("adminCurrentId");
    }
  });

  socket.on("msg_added", ({ session_id, role, message, email }) => {
    session_id = toStr(session_id);
    if (session_id !== currentId) {
      const item = document.querySelector(`.session-item[data-sid='${session_id}']`);
      if (item) {
        let badge = item.querySelector(".badge");
        if (!badge) {
          badge = document.createElement('span');
          badge.className = "badge bg-danger rounded-pill";
          item.appendChild(badge);
        }
        badge.innerText = parseInt(badge.innerText || '0') + 1;
      }
      return;
    }
    appendLog(role, message, email);
    logBox.scrollTop = logBox.scrollHeight;
  });

  socket.on("need_human", messageData => {
    localStorage.removeItem(`closed_${messageData.session_id}`);
    prependSessionItem(toStr(messageData.session_id), messageData.email, messageData.message_count || 1);
    if (noSessionMsg) noSessionMsg.style.display = 'none';
  });

  document.addEventListener("click", async eventData => {
    const element = eventData.target.closest(".session-item");
    if (!element) return;
    document.querySelectorAll(".session-item").forEach(sessionElement => sessionElement.classList.remove("active"));
    element.classList.add("active");
    currentId = toStr(element.dataset.sid);
    localStorage.setItem("adminCurrentId", currentId);
    await loadLogs(currentId);
    const badge = element.querySelector(".badge");
    if (badge) badge.innerText = "0";
    subscribe();
  });

  async function loadLogs(sid) {
    sid = toStr(sid);
    if (!sid) return;
    logBox.innerHTML = "<p>載入中…</p>";
    try {
      const fetchResponse = await fetch(`/admin/chat/logs/${sid}`);
      if (!fetchResponse.ok) throw new Error("HTTP " + fetchResponse.status);
      const responseData = await fetchResponse.json();
      const messagesArray = Array.isArray(responseData) ? responseData : (responseData.messages || []);
      logBox.innerHTML = "";
      messagesArray.forEach(row =>
        appendLog(
          row.role,
          row.message,
          row.email || (row.role === 'user' ? '使用者' : 'AI/管理員')
        )
      );
      logBox.scrollTop = logBox.scrollHeight;
    } catch (err) {
      logBox.innerHTML = "<p class='error'>❌ 無法載入訊息紀錄</p>";
      console.error("loadLogs failed:", err);
    }
  }

  function appendLog(role, msg, senderName) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    const who = role === 'user' ? (senderName || '使用者') :
               role === 'admin' ? '管理員' : 'AI';
    div.innerHTML = `<div class="role">${who}</div>${msg}`;
    logBox.appendChild(div);
  }

  function prependSessionItem(id, email, count = 1) {
    id = toStr(id);
    if (localStorage.getItem(`closed_${id}`) === '1') {
      localStorage.removeItem(`closed_${id}`);
    }
    const container = document.getElementById("session-container");
    let item = document.querySelector(`.session-item[data-sid='${id}']`);
    if (item) {
      const badge = item.querySelector(".badge");
      if (badge) badge.innerText = parseInt(badge.innerText || "0") + count;
      container.prepend(item);
      return;
    }
    item = document.createElement("div");
    item.className = "session-item";
    item.dataset.sid = id;
    item.innerHTML = `<span class="user-mail">${email}</span><span class="badge">${count}</span>`;
    container.prepend(item);
    updateSessionVisibility();
  }

  function updateSessionVisibility() {
    const has = document.querySelectorAll('.session-item').length > 0;
    if (noSessionMsg) noSessionMsg.style.display = has ? 'none' : 'block';
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
  }

  replyButton.addEventListener("click", send);
  replyText.addEventListener("keydown", eventData => {
    if (eventData.key === "Enter" && !eventData.shiftKey) {
      eventData.preventDefault();    send();
    }
  });
});

/* ===== 公告管理：刪除後立即更新畫面 ===== */
document.addEventListener('DOMContentLoaded', () => {

  // 僅在公告管理頁面執行
  if (!document.querySelector('.table') &&
      !document.querySelector('.announcement-mobile-cards')) return;

  /* 一律抓路徑中同時含有 announce | announcement 與 delete 的表單 */
  const deleteForms = document.querySelectorAll(
    'form[action*="announce"][action*="delete"]'
  );

  deleteForms.forEach(form => {
    form.addEventListener('submit', async eventData => {
      eventData.preventDefault();
      if (!confirm('確定刪除此公告？')) return;

      /* 帶 CSRF、帶 cookie */
      const response = await fetch(form.action, {
        method : 'POST',
        body   : new FormData(form),
        credentials: 'same-origin'
      });

      if (response.ok || response.redirected || response.status === 204) {
        /* ➜ 直接重新整理，百分百保證畫面同步 */
        location.reload();
      } else {
        alert('刪除失敗，請再試一次');
      }
    });
  });
});




/* ========== 通知訊息系統 ========== */
function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.admin-notification');
  if (existingNotification) existingNotification.remove();

  const notification = document.createElement('div');
  notification.className = `admin-notification admin-notification-${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;margin-left:10px;cursor:pointer;">×</button>
  `;

  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 16px',
    borderRadius: '6px',
    color: '#fff',
    backgroundColor: type === 'success' ? '#28a745' :
                     type === 'error'   ? '#dc3545' : '#007bff',
    zIndex: '9999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    transform: 'translateX(100%)',
    opacity: '0'
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity   = '1';
  }, 10);

  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity   = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
