export const reduce = (iter, func, accu) => {
  for (const curr of iter) {
    accu = func(accu, curr);
  }
  return accu;
};

export const sleep = async msec => {
  return new Promise(resolve => {
    window.setTimeout(resolve, msec);
  });
};

export const sleeping = async work => {
  if (work) {
    // Creating a connection object once,
    // perhaps may lead to poor performance.
    const port = chrome.runtime.connect();
    return new Promise(resolve => {
      port.onMessage.addListener(response => {
        if (response.sleep == null) return;
        resolve();
      });
      postMessage(port, { sleep: true });
    });
  } else {
    await sleep(0);
  }
};

export const getStorageValue = async (key, defaultValue) => {
  const promise = new Promise(resolve => {
    const param = {};
    param[key] = defaultValue;
    chrome.storage.local.get(param, response => {
      resolve(response[key]);
    });
  });
  return promise;
};

export const setStorageValue = async (key, value, callback = () => { }) => {
  const promise = new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, response => {
      callback(response);
      resolve();
    });
  });
  return promise;
};

const checkLastError = _ => {
  chrome.runtime.lastError;
};

export const sendToAllTab = (params, callback = checkLastError) => {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, params, callback);
    });
  });
};

export const postMessage = (port, message) => {
  try {
    port.postMessage(message);
    return true;
  } catch (_) {
    return false;
  }
};

export const collectTextNode = (() => {
  const exclusions = [
    "script",
    "noscript",
    "style",
    "textarea",
    "svg",
  ];

  return function* (parent) {
    for (const node of parent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        yield node;
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      const tagName = node.tagName.toLowerCase();
      if (exclusions.indexOf(tagName) >= 0) {
        continue;
      }
      if ($(node).css("display") === "none") {
        continue;
      }
      if (tagName === "details" && $(node).attr("open") == null) {
        continue;
      }
      if (tagName === "iframe") {
        try {
          // Error occurs in this line when cross domain.
          const body = node.contentWindow.document.body;

          yield* collectTextNode(body);
        } catch (e) {
        }
        continue;
      }
      yield* collectTextNode(node);
    }
  };
})();

export const blackOrWhite = hexcolor => {
  const r = parseInt(hexcolor.substr(1, 2), 16);
  const g = parseInt(hexcolor.substr(3, 2), 16);
  const b = parseInt(hexcolor.substr(5, 2), 16);

  return ((((r * 299) + (g * 587) + (b * 114)) / 1000) < 128) ? "white" : "black";
};

export const saveHistory = async text => {
  if (text == null || text === "") return;

  const texts = await getStorageValue("texts", []);

  // If it is a same as last search keyword, don't save.
  if (texts[texts.length - 1] !== text) {
    texts.push(text);
    while (texts.length > 1000) texts.shift();
    await setStorageValue("texts", texts);
  }
};
