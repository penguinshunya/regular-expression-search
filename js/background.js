chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.mc == null || request.fc == null) return;

  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        mc: request.mc,
        fc: request.fc,
      }, () => {});
    });
  });
  sendResponse();
});

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(date => {
    port.postMessage(date);
  });
});
