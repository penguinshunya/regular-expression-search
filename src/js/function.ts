export const reduce = <S, T>(iter: Iterable<T>, func: (a: S, c: T) => S, accu: S) => {
  for (const curr of iter) {
    accu = func(accu, curr);
  }
  return accu;
};

export async function sleep(msec: number) {
  return new Promise(resolve => {
    window.setTimeout(resolve, msec);
  });
};

export const sleeping = async (work: boolean) => {
  if (work) {
    // Creating a connection object once,
    // perhaps may lead to poor performance.
    const port = chrome.runtime.connect();
    return new Promise<void>(resolve => {
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

export const getStorageValue = async <T>(key: string, value: T) => {
  const promise: Promise<T> = new Promise(resolve => {
    const param: { [s: string]: T } = {};
    param[key] = value;
    chrome.storage.local.get(param, response => {
      resolve(response[key]);
    });
  });
  return promise;
};

export const setStorageValue = async (key: string, value: any) => {
  const promise = new Promise<void>(resolve => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
  return promise;
};

const checkLastError = (_: any) => {
  chrome.runtime.lastError;
};

export const sendToAllTab = (params: { [s: string]: any }, callback = checkLastError) => {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, params, callback);
    });
  });
};

export const postMessage = (port: chrome.runtime.Port, message: Object) => {
  try {
    port.postMessage(message);
    return true;
  } catch (_) {
    return false;
  }
};

const exclusions = [
  "script",
  "noscript",
  "style",
  "textarea",
  "svg",
];

export const collectTextNode: (parent: any) => IterableIterator<any> = function* (parent) {
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

export const blackOrWhite = (hexcolor: string) => {
  const r = parseInt(hexcolor.substr(1, 2), 16);
  const g = parseInt(hexcolor.substr(3, 2), 16);
  const b = parseInt(hexcolor.substr(5, 2), 16);

  return ((((r * 299) + (g * 587) + (b * 114)) / 1000) < 128) ? "white" : "black";
};

export const saveHistory = async (text: string) => {
  if (text == null || text === "") return;

  const texts: string[] = await getStorageValue("texts", []);

  // If it is a same as last search keyword, don't save.
  if (texts[texts.length - 1] !== text) {
    texts.push(text);
    while (texts.length > 1000) texts.shift();
    await setStorageValue("texts", texts);
  }
};

export function makeSVG(tag: string, attrs: {[s: string]: string }) {
  const elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const key in attrs) {
    elem.setAttribute(key, attrs[key]);
  }
  return elem;
}
