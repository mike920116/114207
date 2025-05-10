/* static/js/module/ai/ai_chat.js
   --------------------------------------------------
   – 使用者端 AI 聊天前端  
   – ✅ 已修正：求助按鈕事件掛載不到的問題
   -------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    /* －－－ DOM 變數 －－－ */
    const chatBox   = document.getElementById("chat-box");
    const input     = document.getElementById("user-input");
    const sendBtn   = document.getElementById("send-btn");
    const helpBtn   = document.getElementById("call-human-btn");   // ← 求助按鈕
    let   sessionConvId = "";       // 若之後要串 Dify 的 conversation_id
    let   currentSessionId = null; // 新增：用於儲存從後端獲取的 session_id

    // 新增：訂閱到 session 的函數
    const subscribeToCurrentSession = () => {
      if (socket.connected && currentSessionId) {
        console.log(`ai_chat.js: Subscribing to session_id: ${currentSessionId}`);
        socket.emit("subscribe_to_session", { session_id: currentSessionId });
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
    socket.on("msg_added", (data) => {
      const { role, message, session_id } = data;
      // 確保只處理與當前 session_id 相關的訊息
      if (session_id === currentSessionId) {
        if (role === "admin") {
          appendMsg(message, "admin");
        } else if (role === "ai" || role === "system") { // 處理來自後端的 AI 或系統訊息
          // 避免重複顯示由 sendMessage() 中 fetch API 已處理的 AI 回覆
          // 這裡主要接收因 Dify 暫停而由後端直接發送的系統提示，或管理員操作觸發的系統訊息
          // 如果 sendMessage 中的 fetch 也觸發了 msg_added (例如 Dify 正常回覆時)
          // 需要確保不會重複 append。目前 sendMessage 的 fetch 不直接觸發 msg_added 給自己。
          appendMsg(message, "ai"); 
        }
      } else {
        console.log(`ai_chat.js: Received msg_added for a different session_id. Current: ${currentSessionId}, Received: ${session_id}`);
      }
    });

    socket.on("need_human", d=> {
      // USER_EMAIL 應該是從後端模板傳入的變數
      if (typeof USER_EMAIL !== 'undefined' && d.email === USER_EMAIL) {
          appendMsg("客服已收到訊息，請稍候…（服務時段為9:00-21:00，若誤按請幫我重新整理頁面)", "ai"); // 使用修正後的 appendMsg
      }
    });
  
    /* －－－ 傳送訊息給後端 －－－ */
    const sendMessage = async () => {
      const text = input.value.trim();
      if (!text) return;
  
      appendMsg(text, "user");
      input.value       = "";
      input.disabled    = true;
      sendBtn.disabled  = true;
      sendBtn.innerText = "思考中…";
  
      try {
        const r = await fetch("/ai/chat/api", {
          method : "POST",
          headers: {"Content-Type": "application/json"},
          body   : JSON.stringify({
            query          : text,
            // conversation_id: sessionConvId, // Dify conversation_id, 後端目前不直接用
            // user_id        : (typeof USER_EMAIL !== 'undefined' ? USER_EMAIL : "frontend_user"), // 後端從 flask_login 取
          })
        });
  
        const data = await r.json(); // data 應包含 { reply: "...", session_id: "..." }
        
        if (data.session_id && !currentSessionId) {
          currentSessionId = data.session_id;
          console.log(`ai_chat.js: Received session_id for the first time: ${currentSessionId}`);
          subscribeToCurrentSession(); // 獲取到 session_id 後立即訂閱
        }
        // 如果 currentSessionId 已存在但與後端返回的不同，可能需要處理，但正常情況下應該一致
        if (data.session_id && currentSessionId !== data.session_id) {
            console.warn(`ai_chat.js: Mismatch in session_id. Current: ${currentSessionId}, Received: ${data.session_id}. Updating and re-subscribing.`);
            currentSessionId = data.session_id;
            subscribeToCurrentSession();
        }

        // 檢查是否在真人客服模式下（如果是，reply會是空字串）
        if (data.reply === "") {
            console.log("真人客服模式下，不顯示AI回覆");
            // 在客服模式下，不顯示任何自動回覆
        } else {
            // 非客服模式，正常顯示AI回覆
            appendMsg(data.reply || "⚠️ AI 沒有回覆", "ai");
        }
        // sessionConvId = data.conversation_id || sessionConvId; // Dify conversation_id
  
      } catch (err) {
        console.error(err);
        appendMsg("⚠️ 發生錯誤，請稍後重試", "ai");
      } finally {
        input.disabled   = false;
        sendBtn.disabled = false;
        sendBtn.innerText = "送出";
        input.focus();
      }
    };
  
    /* －－－ 求真人客服 －－－ */
    const callHuman = async () => {
      // appendMsg("我需要真人客服協助，謝謝！", "user"); // 由後端 chat_api 處理 user 訊息的儲存和廣播
  
      helpBtn.disabled = true;
      helpBtn.innerText = "已通知…";
  
      try {
        const response = await fetch("/ai/chat/api/call_services", {method:"POST"});
        const data = await response.json(); // 假設後端會回傳 session_id

        if (data.session_id && !currentSessionId) {
            currentSessionId = data.session_id;
            console.log(`ai_chat.js: Received session_id from call_services: ${currentSessionId}`);
            subscribeToCurrentSession();
        } else if (data.session_id && currentSessionId !== data.session_id) {
            console.warn(`ai_chat.js: Mismatch in session_id from call_services. Current: ${currentSessionId}, Received: ${data.session_id}. Updating and re-subscribing.`);
            currentSessionId = data.session_id;
            subscribeToCurrentSession();
        }

        // appendMsg("已為您轉接真人客服，請稍候…", "ai"); // 這條訊息應由後端透過 msg_added 發送
        console.log("ai_chat.js: call_human successful, message: ", data.message);

      } catch (err) {
        console.error("呼叫真人客服失敗:", err);
        appendMsg("通知客服失敗，請稍後再試。", "ai");
        helpBtn.disabled = false;
        helpBtn.innerText = "求助真人客服";
      }
    };
  
    /* －－－ 事件監聽 －－－ */
    sendBtn .addEventListener("click", sendMessage);
    input   .addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { // 避免 Shift+Enter 觸發
        e.preventDefault(); // 防止 Enter 換行
        sendMessage();
      }
    });
    if (helpBtn) { // 確保 helpBtn 存在
        helpBtn .addEventListener("click",  callHuman);
    }
  
    /* －－－ 離開頁面自動關閉會話 －－－ */
    // window.addEventListener("beforeunload", ... ); // 這部分邏輯由後端 SocketIO disconnect 處理，前端無需主動 close_session

    // 新增：嘗試從 HTML 中獲取初始 session_id (如果後端渲染時提供了)
    const initialSessionIdElement = document.getElementById('initial-session-id');
    if (initialSessionIdElement && initialSessionIdElement.value) {
        currentSessionId = initialSessionIdElement.value;
        console.log(`ai_chat.js: Initial session_id from HTML: ${currentSessionId}`);
        // 如果 socket 已連線，則訂閱；否則等待 'connect' 事件
        if (socket.connected) {
            subscribeToCurrentSession();
        }
    } else {
        console.log("ai_chat.js: No initial session_id found in HTML.");
        // 如果沒有初始 session_id，則在第一次 sendMessage 或 callHuman 成功後獲取並訂閱
    }
  });
