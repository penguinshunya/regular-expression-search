chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(_ => {
    port.postMessage({kind: "process"});
  });
});
