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
  const submitButton    = document.getElementById('submit-diary');
  const emotionButtons  = Array.from(document.querySelectorAll('.emotion-option'));
  const formInputs      = Array.from(document.querySelectorAll('.form-control'));

  let selectedEmotion = '';

  /* ---------- Helpers ---------- */
  const showAlert = (element, message) => {
    element.textContent = message;
    element.classList.add('show');
    element.style.display = 'block';
    setTimeout(() => {
      element.classList.remove('show');
      element.style.display = 'none';
    }, 3000);
  };

  const animationSuccess = () => {
    formContainer.classList.add('success');
    setTimeout(() => formContainer.classList.remove('success'), 1000);
  };

  const resetForm = () => {
    diaryContent.value = '';
    emotionButtons.forEach(button => button.classList.remove('selected'));
    selectedEmotion = '';
  };

  const toggleSubmit = (isLoading) => {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle('loading', isLoading);
    submitButton.textContent = isLoading ? '小助手正在查看您的訊息…' : '儲存日記';
  };

  /* ---------- Emotion Picker ---------- */
  emotionButtons.forEach(button => {
    button.addEventListener('click', () => {
      emotionButtons.forEach(otherButton => otherButton.classList.remove('selected'));
      button.classList.add('selected');
      selectedEmotion = button.dataset.emotion;
    });
  });

  /* ---------- Label Focus Color ---------- */
  formInputs.forEach(inputElement => {
    inputElement.addEventListener('focus', () => {
      const label = inputElement.parentElement.querySelector('label');
      if (label) label.style.color = '#17a2b8';
    });
    inputElement.addEventListener('blur', () => {
      const label = inputElement.parentElement.querySelector('label');
      if (label) label.style.color = '#e0e0e0';
    });
  });

  /* ---------- Submit Diary ---------- */
  submitButton.addEventListener('click', async () => {
    if (submitButton.disabled) return;               // 雙重保險

    const diaryData = {
      date   : diaryDate.value,
      content: diaryContent.value.trim(),
      state  : selectedEmotion
    };

    if (!diaryData.content && !diaryData.state) {
      showAlert(errorAlert, '請輸入日記內容或選擇情緒狀態');
      return;
    }

    toggleSubmit(true);                           // ← 立即鎖定按鈕

    try {
      const saveURL = submitButton.dataset.saveUrl || '/diary/save';
      const apiResponse = await fetch(saveURL, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(diaryData)
      });
      const responseData = await apiResponse.json();

      if (apiResponse.ok && responseData.success) {
        resetForm();

        /* 顯示 AI 回覆 */
        aiContent.textContent = responseData.emotion_detail || '無法取得情緒分析';
        aiBox.style.display = 'block';
        aiBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        showAlert(successAlert, responseData.message || '日記已成功儲存！');
        animationSuccess();
      } else {
        throw new Error(responseData.message || '發生錯誤，請稍後再試。');
      }
    } catch (error) {
      console.error(error);
      showAlert(errorAlert, error.message || '發生網路錯誤，請檢查連接。');
    } finally {
      toggleSubmit(false);                        // ← 無論成功/失敗都解鎖
    }
  });
});
