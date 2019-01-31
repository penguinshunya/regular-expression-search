chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.instant == null) return;

  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        instant: request.instant,
      }, () => { });
    });
  });
  sendResponse();
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.shuffle == null) return;

  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        shuffle: request.shuffle,
      }, () => { });
    });
  });
  sendResponse();
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.ignoreBlank == null) return;

  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        ignoreBlank: request.ignoreBlank,
      }, () => { });
    });
  });
  sendResponse();
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.mc == null || request.fc == null) return;

  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        mc: request.mc,
        fc: request.fc,
      }, () => { });
    });
  });
  sendResponse();
});
