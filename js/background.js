chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.instant == null) return;
  sendToAllTab({ instant: request.instant });
  sendResponse();
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.shuffle == null) return;
  sendToAllTab({ shuffle: request.shuffle });
  sendResponse();
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.ignoreBlank == null) return;
  sendToAllTab({ ignoreBlank: request.ignoreBlank });
  sendResponse();
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.background == null) return;
  sendToAllTab({ background: request.background });
  sendResponse();
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.mc == null || request.fc == null) return;
  sendToAllTab({ mc: request.mc, fc: request.fc });
  sendResponse();
});

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((request, _, sendResponse) => {
    if (request.sleep == null) return;
    port.postMessage({ sleep: true });
  });
});
