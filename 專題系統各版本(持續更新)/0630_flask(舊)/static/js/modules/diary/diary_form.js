/* === Diary Form – Emotion Picker・AI 回覆・防重複送出 === */
document.addEventListener('DOMContentLoaded', () => {
  /* ---------- DOM ---------- */
  const formContainer   = document.querySelector('.form-container');
  const successAlert    = document.getElementById('success-alert');
  const errorAlert      = document.getElementById('error-alert');
  const aiBox           = document.getElementById('ai-response-box');
  const aiContent       = document.getElementById('ai-response-content');
  const diaryDate       = document.getElementById('diary-date');
  const diaryContent    = document.getElementById('diary-content');
  const btnSubmit       = document.getElementById('submit-diary');
  const emotionBtns     = Array.from(document.querySelectorAll('.emotion-option'));
  const inputs          = Array.from(document.querySelectorAll('.form-control'));

  let selectedEmotion = '';

  /* ---------- Helpers ---------- */
  const showAlert = (el, msg) => {
    el.textContent = msg;
    el.classList.add('show');
    el.style.display = 'block';
    setTimeout(() => {
      el.classList.remove('show');
      el.style.display = 'none';
    }, 3000);
  };

  const animationSuccess = () => {
    formContainer.classList.add('success');
    setTimeout(() => formContainer.classList.remove('success'), 1000);
  };

  const resetForm = () => {
    diaryContent.value = '';
    emotionBtns.forEach(b => b.classList.remove('selected'));
    selectedEmotion = '';
  };

  const toggleSubmit = (isLoading) => {
    btnSubmit.disabled = isLoading;
    btnSubmit.classList.toggle('loading', isLoading);
    btnSubmit.textContent = isLoading ? '小助手正在查看您的訊息…' : '儲存日記';
  };

  /* ---------- Emotion Picker ---------- */
  emotionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      emotionBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedEmotion = btn.dataset.emotion;
    });
  });

  /* ---------- Label Focus Color ---------- */
  inputs.forEach(inp => {
    inp.addEventListener('focus', () => {
      const lbl = inp.parentElement.querySelector('label');
      if (lbl) lbl.style.color = '#17a2b8';
    });
    inp.addEventListener('blur', () => {
      const lbl = inp.parentElement.querySelector('label');
      if (lbl) lbl.style.color = '#e0e0e0';
    });
  });

  /* ---------- Submit Diary ---------- */
  btnSubmit.addEventListener('click', async () => {
    if (btnSubmit.disabled) return;               // 雙重保險

    const payload = {
      date   : diaryDate.value,
      content: diaryContent.value.trim(),
      state  : selectedEmotion
    };

    if (!payload.content && !payload.state) {
      showAlert(errorAlert, '請輸入日記內容或選擇情緒狀態');
      return;
    }

    toggleSubmit(true);                           // ← 立即鎖定按鈕

    try {
      const saveURL = btnSubmit.dataset.saveUrl || '/diary/save';
      const resp = await fetch(saveURL, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(payload)
      });
      const data = await resp.json();

      if (resp.ok && data.success) {
        resetForm();

        /* 顯示 AI 回覆 */
        aiContent.textContent = data.emotion_detail || '無法取得情緒分析';
        aiBox.style.display = 'block';
        aiBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        showAlert(successAlert, data.message || '日記已成功儲存！');
        animationSuccess();
      } else {
        throw new Error(data.message || '發生錯誤，請稍後再試。');
      }
    } catch (err) {
      console.error(err);
      showAlert(errorAlert, err.message || '發生網路錯誤，請檢查連接。');
    } finally {
      toggleSubmit(false);                        // ← 無論成功/失敗都解鎖
    }
  });
});
