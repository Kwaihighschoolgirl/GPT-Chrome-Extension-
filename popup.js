document.addEventListener('DOMContentLoaded', () => {
  const optionsLink = document.getElementById('options-link');
  const historyList = document.getElementById('history-list');

  // 설정 페이지 링크
  optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // 히스토리 불러오기
  loadHistory();

  // 히스토리 불러오기 함수
  function loadHistory() {
    chrome.storage.local.get('history', (data) => {
      const history = data.history || [];
      displayHistory(history);
    });
  }

  // 히스토리 표시 함수
  function displayHistory(history) {
    historyList.innerHTML = '';
    
    if (history.length === 0) {
      historyList.innerHTML = '<p class="no-history">기록이 없습니다.</p>';
      return;
    }

    history.forEach((entry, index) => {
      const historyEntry = document.createElement('div');
      historyEntry.className = 'history-entry';
      
      const typeDiv = document.createElement('div');
      typeDiv.className = 'history-type';
      typeDiv.textContent = entry.type;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'history-content';
      // 원본 텍스트와 결과를 구분해서 표시
      const originalText = entry.originalText.length > 50 
        ? entry.originalText.substring(0, 50) + '...'
        : entry.originalText;
      const resultText = entry.resultText.length > 100
        ? entry.resultText.substring(0, 100) + '...'
        : entry.resultText;
      
      contentDiv.innerHTML = `
        <div style="font-size: 12px; color: #666; margin-bottom: 6px;">원본:</div>
        <div style="margin-bottom: 8px;">${originalText}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 6px;">결과:</div>
        <div>${resultText}</div>
      `;
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = '복사';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(entry.resultText).then(() => {
          copyBtn.textContent = '복사됨!';
          setTimeout(() => {
            copyBtn.textContent = '복사';
          }, 2000);
        });
      };
      
      historyEntry.appendChild(typeDiv);
      historyEntry.appendChild(contentDiv);
      historyEntry.appendChild(copyBtn);
      historyList.appendChild(historyEntry);
    });
  }
});
