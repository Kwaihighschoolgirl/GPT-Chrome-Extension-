// DeepL 스타일 플로팅 버튼 구현
let floatingButtons = null;
let resultPopup = null;
let currentSelection = '';
let selectionRect = null;

// 텍스트 선택 감지
document.addEventListener('mouseup', (e) => {
  // *** 수정된 부분 시작 ***
  // 이벤트가 결과 팝업(모달창) 내부에서 발생했다면, 아무 작업도 하지 않고 즉시 종료합니다.
  if (resultPopup && resultPopup.contains(e.target)) {
    return;
  }
  // *** 수정된 부분 끝 ***

  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText.length > 5) {
      currentSelection = selectedText;
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        selectionRect = selection.getRangeAt(0).getBoundingClientRect();
        showFloatingButtons(selectionRect.x + (selectionRect.width / 2), selectionRect.y);
      }
    }
  }, 10);
});

// 다른 곳 클릭 시 플로팅 버튼 숨기기
document.addEventListener('click', (e) => {
  if (floatingButtons && !floatingButtons.contains(e.target)) {
    hideFloatingButtons();
  }
});

// 스크롤 시 버튼과 팝업 모두 숨기기
document.addEventListener('scroll', () => {
  hideFloatingButtons();
  hideResultPopup();
});

// 플로팅 버튼 생성
function showFloatingButtons(x, y) {
  hideFloatingButtons();
  hideResultPopup();

  floatingButtons = document.createElement('div');
  floatingButtons.className = 'gpt-floating-buttons';

  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  
  const finalX = scrollX + x - 75;
  const finalY = scrollY + y - 60;

  floatingButtons.style.cssText = `
    position: absolute;
    left: ${finalX}px;
    top: ${finalY}px;
    z-index: 999999;
    display: flex;
    gap: 8px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: fadeIn 0.2s ease-out;
  `;

  if (!document.querySelector('#gpt-floating-styles')) {
    const style = document.createElement('style');
    style.id = 'gpt-floating-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .gpt-floating-buttons button {
        border: 1px solid #ddd;
        background: white;
        color: #333;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .gpt-floating-buttons button:hover {
        background: #f5f5f5;
        border-color: #007bff;
        transform: translateY(-1px);
      }
      .gpt-floating-buttons button:active {
        transform: translateY(0);
      }
      .gpt-floating-buttons button.loading {
        opacity: 0.7;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  const translateBtn = createButton('🌐', '번역', () => {
    processText('translate');
  });

  const summarizeBtn = createButton('📝', '요약', () => {
    processText('summarize');
  });

  floatingButtons.appendChild(translateBtn);
  floatingButtons.appendChild(summarizeBtn);
  document.body.appendChild(floatingButtons);
}

function createButton(icon, text, onClick) {
  const button = document.createElement('button');
  button.innerHTML = `${icon} ${text}`;
  button.onclick = onClick;
  return button;
}

function hideFloatingButtons() {
  if (floatingButtons) {
    floatingButtons.remove();
    floatingButtons = null;
  }
}

function hideResultPopup() {
  if (resultPopup) {
    resultPopup.remove();
    resultPopup = null;
  }
}

function processText(type) {
  if (!currentSelection) return;

  if (floatingButtons) {
    const buttons = floatingButtons.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.classList.add('loading');
      btn.disabled = true;
    });
  }

  showResultPopup('GPT가 열심히 작업 중입니다...', type, true);

  chrome.runtime.sendMessage({
    action: type,
    text: currentSelection
  }, (response) => {
    if (floatingButtons) {
      const buttons = floatingButtons.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.classList.remove('loading');
        btn.disabled = false;
      });
    }

    if (response && response.result) {
      showResultPopup(response.result, type, false);
    } else if (response && response.error) {
      showResultPopup(`오류: ${response.error}`, type, false);
    }
    
    hideFloatingButtons();
  });
}

function showResultPopup(result, type, isLoading = false) {
  hideResultPopup();

  if (!selectionRect) return;

  resultPopup = document.createElement('div');
  resultPopup.className = 'gpt-result-popup';
  
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  
  const popupWidth = 400;
  let popupMaxHeight = 300;
  const margin = 10;
  
  if (isLoading) {
      popupMaxHeight = 80;
  }
  
  let left = selectionRect.left + scrollX;
  let top = selectionRect.top + scrollY - popupMaxHeight - margin;
  
  if (left + popupWidth > window.innerWidth + scrollX) {
    left = window.innerWidth + scrollX - popupWidth - margin;
  }
  if (left < scrollX) {
    left = scrollX + margin;
  }
  if (top < scrollY) {
    top = selectionRect.bottom + scrollY + margin;
  }

  resultPopup.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    width: ${popupWidth}px;
    max-height: ${popupMaxHeight}px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    z-index: 1000000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: fadeIn 0.3s ease-out;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    cursor: move;
  `;

  const title = document.createElement('div');
  title.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  const icon = type === 'translate' ? '🌐' : (type === 'summarize' ? '📝' : '⏳');
  const typeText = type === 'translate' ? '번역' : (type === 'summarize' ? '요약' : '작업 중');
  title.innerHTML = `${icon} GPT ${typeText}`;

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    border: none;
    background: none;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    color: #666;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = '#e9ecef';
  closeBtn.onmouseout = () => closeBtn.style.background = 'none';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    hideResultPopup();
  };

  header.appendChild(title);
  header.appendChild(closeBtn);

  const content = document.createElement('div');
  content.style.cssText = `
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    overflow-y: auto;
    max-height: 200px;
    white-space: pre-wrap;
    word-wrap: break-word;
  `;

  if (isLoading) {
    content.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #666; padding: 10px 0;">
        <div style="
          width: 18px; 
          height: 18px; 
          border: 2px solid #e9ecef; 
          border-top: 2px solid #007bff; 
          border-radius: 50%; 
          animation: spin 1s linear infinite;
        "></div>
        ${result}
      </div>
    `;
    
    if (!document.querySelector('#gpt-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'gpt-spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    content.textContent = result;
  }

  if (!isLoading) {
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    `;

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '복사';
    copyBtn.style.cssText = `
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.2s;
    `;
    copyBtn.onmouseover = () => copyBtn.style.background = '#0056b3';
    copyBtn.onmouseout = () => {
        if (copyBtn.textContent !== '복사완료!') {
            copyBtn.style.background = '#007bff';
        }
    };
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(result).then(() => {
        copyBtn.textContent = '복사완료!';
        copyBtn.style.background = '#28a745';
        copyBtn.disabled = true;
        setTimeout(() => {
          copyBtn.textContent = '복사';
          copyBtn.style.background = '#007bff';
          copyBtn.disabled = false;
        }, 2000);
      });
    };

    footer.appendChild(copyBtn);
    resultPopup.appendChild(footer);
  }

  resultPopup.appendChild(header);
  resultPopup.appendChild(content);
  
  document.body.appendChild(resultPopup);

  let isDragging = false;
  let offsetX, offsetY;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - resultPopup.offsetLeft;
    offsetY = e.clientY - resultPopup.offsetTop;
    resultPopup.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      resultPopup.style.left = `${e.clientX - offsetX}px`;
      resultPopup.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    resultPopup.style.transition = '';
  });
}

console.log("GPT Helper content script loaded and updated.");
