document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save');
    const apiKeyInput = document.getElementById('api-key');
    const statusDiv = document.getElementById('status');
  
    // 저장된 API 키 불러오기
    chrome.storage.sync.get('apiKey', (data) => {
      if (data.apiKey) {
        apiKeyInput.value = data.apiKey;
      }
    });
  
    // 저장 버튼 클릭 이벤트
    saveButton.addEventListener('click', () => {
      const apiKey = apiKeyInput.value.trim();
      if (apiKey) {
        chrome.storage.sync.set({ apiKey: apiKey }, () => {
          statusDiv.textContent = 'API 키가 저장되었습니다!';
          setTimeout(() => {
            statusDiv.textContent = '';
          }, 3000);
        });
      } else {
        statusDiv.textContent = 'API 키를 입력해주세요.';
        statusDiv.style.color = 'red';
         setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.style.color = 'green';
          }, 3000);
      }
    });
  });