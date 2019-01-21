// Sandwich the event page to reflect the state of DOM on the screen.
chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(_ => {
    port.postMessage();
  });
});
