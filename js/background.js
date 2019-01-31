// from option page
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  sendToAllTab(request);
  sendResponse();
});

// from content page
chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((request, _, sendResponse) => {
    if (request.sleep == null) return;
    port.postMessage({ sleep: true });
  });
});
