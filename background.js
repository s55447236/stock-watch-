// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveData') {
    chrome.storage.local.set(request.data, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError });
      } else {
        sendResponse({ success: true });
      }
    });
    return true; // 保持消息通道打开以进行异步响应
  }
  
  if (request.action === 'getData') {
    chrome.storage.local.get(['watchlist', 'priceAlerts'], (data) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError });
      } else {
        sendResponse({ success: true, data: data });
      }
    });
    return true; // 保持消息通道打开以进行异步响应
  }
}); 