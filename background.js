// OpenAI API 호출 함수
async function callGPT(prompt, apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o", // gpt-4o 모델 사용
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
      }
  
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("GPT API 호출 중 오류 발생:", error);
      return `오류가 발생했습니다: ${error.message}. API 키를 확인하거나 나중에 다시 시도해주세요.`;
    }
  }
  
  // 히스토리 저장 함수
  async function saveToHistory(type, originalText, resultText) {
    const { history = [] } = await chrome.storage.local.get("history");
    history.unshift({ type, originalText, resultText, date: new Date().toISOString() });
    if (history.length > 5) {
      history.pop();
    }
    await chrome.storage.local.set({ history });
  }
  
  // 컨텍스트 메뉴 생성
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "translate",
      title: "GPT로 번역하기",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "summarize",
      title: "GPT로 요약하기",
      contexts: ["selection"]
    });
  });
  
  // 컨텍스트 메뉴 클릭 리스너
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const { selectionText, menuItemId } = info;
    if (!selectionText) return;
  
    const { apiKey } = await chrome.storage.sync.get("apiKey");
    if (!apiKey) {
      chrome.runtime.openOptionsPage();
      return;
    }
  
    let prompt;
    let taskType = '';
  
    if (menuItemId === "translate") {
      taskType = "번역";
      prompt = `Detect the language of the following text and translate it into natural Korean. If the text is already in Korean, translate it into natural English.\n\nText: "${selectionText}"`;
    } else if (menuItemId === "summarize") {
      taskType = "요약";
      if (selectionText.length < 200) {
        prompt = `Summarize the following sentence into one core message in Korean.\n\nText: "${selectionText}"`;
      } else {
        prompt = `Extract the key takeaways and summarize the following text in Korean bullet points.\n\nText: "${selectionText}"`;
      }
    }
  
    // 로딩 알림 표시 (선택적)
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showLoadingNotification
    });
  
  
    const result = await callGPT(prompt, apiKey);
    await saveToHistory(taskType, selectionText, result);
  
    // 결과 표시
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showResultPopup,
      args: [result, taskType]
    });
  });
  
  // 알림 및 팝업을 표시하는 함수 (Content Script에서 실행됨)
  function showResultPopup(result, type) {
    // 이전 팝업 제거
    const oldPopup = document.getElementById('gpt-result-popup');
    if (oldPopup) {
      oldPopup.remove();
    }
  
    const popup = document.createElement('div');
    popup.id = 'gpt-result-popup';
    popup.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      max-height: 400px;
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
  
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 10px 15px;
      background-color: #f5f5f5;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.textContent = `GPT ${type} 결과`;
  
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      border: none;
      background: none;
      font-size: 20px;
      cursor: pointer;
      color: #888;
    `;
    closeButton.onclick = () => popup.remove();
    header.appendChild(closeButton);
  
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 15px;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      overflow-y: auto;
      white-space: pre-wrap;
    `;
    content.textContent = result;
  
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 10px 15px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: flex-end;
    `;
  
    const copyButton = document.createElement('button');
    copyButton.textContent = '클립보드에 복사';
    copyButton.style.cssText = `
      border: 1px solid #ccc;
      background-color: #fff;
      color: #333;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    copyButton.onclick = () => {
      navigator.clipboard.writeText(result).then(() => {
        copyButton.textContent = '복사 완료!';
        setTimeout(() => { copyButton.textContent = '클립보드에 복사'; }, 2000);
      });
    };
    footer.appendChild(copyButton);
  
    popup.appendChild(header);
    popup.appendChild(content);
    popup.appendChild(footer);
  
    document.body.appendChild(popup);
  }
  
  function showLoadingNotification() {
      showResultPopup('GPT가 열심히 작업 중입니다...', '작업 중');
  }