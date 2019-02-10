chrome.storage.onChanged.addListener((changes, _) => {
  for (const key in changes) {
    sendToAllTab({ key: key, value: changes[key].newValue });
  }
});

// from content page
chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(request => {
    if (request.sleep == null) return;
    port.postMessage({ sleep: true });
  });
});
