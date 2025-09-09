/* static/js/modules/ai/ai_chat.js
   --------------------------------------------------
   – 使用者端 AI 聊天前端
   – ✅ 已修正：求助按鈕事件掛載不到的問題
   – ✅ 新增：session_id 一律字串化，避免型別不一致
   -------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    /* －－－ 工具：把任何值轉成字串或 null －－－ */
    const toStr = v => (v != null ? String(v) : null);

    let isSending = false;
    /* －－－ DOM 變數 －－－ */
    const chatBox   = document.getElementById("chat-box");
    const input     = document.getElementById("user-input");
    const sendButton   = document.getElementById("send-btn");
    const helpButton   = document.getElementById("call-human-btn");   // ← 求助按鈕
    let   sessionConvId = "";       // 若之後要串 Dify 的 conversation_id
    let   currentSessionId = toStr(localStorage.getItem("userCurrentSessionId"));
    

    // 新增：訂閱到 session 的函數
    const subscribeToCurrentSession = () => {
      if (socket.connected && currentSessionId) {
        console.log(`ai_chat.js: Subscribing to session_id: ${currentSessionId}`);
        socket.emit("subscribe_to_session", { session_id: currentSessionId, role: "user" });
      } else {
        console.log("ai_chat.js: Cannot subscribe. Socket connected: " + socket.connected + ", currentSessionId: " + currentSessionId);
      }
    };
  
    /* －－－ 工具 －－－ */
    const appendMsg = (txt, role) => {
      const div = document.createElement("div");
      div.className = `chat-msg ${role === "user" ? "user-msg" : "ai-msg"}`;
      div.innerText = txt;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    };

    /* --- WebSocket 連線和事件處理 --- */
    const socket = io("/chat"); // 將 socket 初始化也移到 DOMContentLoaded 內部

    socket.on('connect', () => {
      console.log('ai_chat.js: Socket connected to /chat namespace.');
      // 當連線或重新連線成功時，如果已經有 currentSessionId，則重新訂閱
      if (currentSessionId) {
        subscribeToCurrentSession();
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`ai_chat.js: Socket disconnected from /chat namespace. Reason: ${reason}`);
    });

    // 只接收「屬於自己 session」且 role === "admin" 的訊息
    socket.on("msg_added", (responseData) => {
      const { role, message, session_id } = responseData;
      // 確保只處理與當前 session_id 相關的訊息
      if (toStr(session_id) === currentSessionId) {
        if (role === "admin") {
          appendMsg(message, "admin");
        } else if (role === "ai" || role === "system") { // 處理來自後端的 AI 或系統訊息
          appendMsg(message, "ai"); 
        }
      } else {
        console.log(`ai_chat.js: Received msg_added for a different session_id. Current: ${currentSessionId}, Received: ${session_id}`);
      }
    });

    socket.on("need_human", responseData=> {
      // USER_EMAIL 應該是從後端模板傳入的變數
      if (typeof USER_EMAIL !== 'undefined' && responseData.email === USER_EMAIL) {
          appendMsg("客服已收到訊息，請稍候…（服務時段為9:00-21:00，若誤按請幫我重新整理頁面)", "ai");
      }
    });
  
    /* －－－ 傳送訊息給後端 －－－ */
    const sendMessage = async () => {
      const text = input.value.trim();
      if (!text || isSending) return;

      isSending = true;  // 🔒 加鎖防重複送出
      appendMsg(text, "user");
      input.value       = "";
      input.disabled    = true;
      sendButton.disabled  = true;
      sendButton.innerText = "思考中…";

      try {
      const apiResponse = await fetch("/ai/chat/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text })
      });

      if (!apiResponse.ok) {
        throw new Error(`伺服器錯誤 (${apiResponse.status})`);
      }

      let responseData;
      try {
        responseData = await apiResponse.json();
      } catch (e) {
        throw new Error("伺服器未回傳有效 JSON，可能是內部錯誤");
      }

      // ✅ 後續照原本邏輯處理即可
      if (responseData.session_id && !currentSessionId) {
        currentSessionId = toStr(responseData.session_id);
        localStorage.setItem("userCurrentSessionId", currentSessionId);
        subscribeToCurrentSession();
      }

      if (responseData.reply === "") {
        console.log("真人客服模式下，不顯示AI回覆");
      } else {
        appendMsg(responseData.reply || "⚠️ AI 沒有回覆", "ai");
      }

    } catch (err) {
      console.error(err);
      appendMsg("⚠️ 發生錯誤，請稍後重試", "ai");
    } finally {
        isSending = false; // 🔓 解鎖
        input.disabled    = false;
        sendButton.disabled  = false;
        sendButton.innerText = "送出";
        input.focus();
      }
    };

  
    /* －－－ 求真人客服 －－－ */
    const callHuman = async () => {
      helpButton.disabled = true;
      helpButton.innerText = "已通知…";
  
      try {
        const humanServiceResponse = await fetch("/ai/chat/api/call_services", {method:"POST"});
        const responseData = await humanServiceResponse.json(); // 假設後端會回傳 session_id

        if (responseData.session_id && !currentSessionId) {
            currentSessionId = toStr(responseData.session_id);
            localStorage.setItem("userCurrentSessionId", currentSessionId);
            console.log(`ai_chat.js: Received session_id from call_services: ${currentSessionId}`);
            subscribeToCurrentSession();
        } else if (responseData.session_id && currentSessionId !== toStr(responseData.session_id)) {
            console.warn(`ai_chat.js: Mismatch in session_id from call_services. Current: ${currentSessionId}, Received: ${responseData.session_id}. Updating and re-subscribing.`);
            currentSessionId = toStr(responseData.session_id);
            localStorage.setItem("userCurrentSessionId", currentSessionId);
            subscribeToCurrentSession();
        }

        console.log("ai_chat.js: call_human successful, message: ", responseData.message);

      } catch (err) {
        console.error("呼叫真人客服失敗:", err);
        appendMsg("通知客服失敗，請稍後再試。", "ai");
        helpButton.disabled = false;
        helpButton.innerText = "求助真人客服";
      }
    };
  
    /* －－－ 事件監聽 －－－ */
    sendButton .addEventListener("click", sendMessage);
    input   .addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { // 避免 Shift+Enter 觸發
        e.preventDefault(); // 防止 Enter 換行
        sendMessage();
      }
    });
    if (helpButton) { // 確保 helpButton 存在
        helpButton .addEventListener("click",  callHuman);
    }
  
    /* －－－ 初始 session_id（若後端渲染）－－－ */
    const initialSessionIdElement = document.getElementById('initial-session-id');
    if (initialSessionIdElement && initialSessionIdElement.value) {
        currentSessionId = toStr(initialSessionIdElement.value);
        localStorage.setItem("userCurrentSessionId", currentSessionId);
        console.log(`ai_chat.js: Initial session_id from HTML: ${currentSessionId}`);
        if (socket.connected) {
            subscribeToCurrentSession();
        }
    } else {
        console.log("ai_chat.js: No initial session_id found in HTML.");
    }
});
