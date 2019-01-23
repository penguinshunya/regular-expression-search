chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(() => {
    port.postMessage();
  });
});
