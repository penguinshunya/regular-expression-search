const reduce = (iter, func, accu) => {
  for (const curr of iter) {
    accu = func(accu, curr);
  }
  return accu;
};

const zip = function* (iter1, iter2) {
  iter1 = iter1[Symbol.iterator]();
  iter2 = iter2[Symbol.iterator]();
  while (true) {
    const val1 = iter1.next();
    const val2 = iter2.next();
    if (val1.done || val2.done) return;
    yield [val1.value, val2.value];
  }
};

Array.prototype.shuffle = function () {
  for (let i = this.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    const tmp = this[i];
    this[i] = this[r];
    this[r] = tmp;
  }
};

const sleep = async msec => {
  return new Promise(resolve => {
    window.setTimeout(resolve, msec);
  });
};

const getStorageValue = async (key, defaultValue) => {
  const promise = new Promise(resolve => {
    const param = {};
    param[key] = defaultValue;
    chrome.storage.local.get(param, response => {
      resolve(response[key]);
    });
  });
  return promise;
};

const setStorageValue = async (key, value, callback = () => { }) => {
  const promise = new Promise(resolve => {
    const param = {};
    param[key] = value;
    chrome.storage.local.set(param, response => {
      callback(response);
      resolve();
    });
  });
  return promise;
};

const collectTextNode = (() => {
  const exclusions = [
    "script",
    "noscript",
    "style",
    "textarea",
    "svg",
  ];

  return function* (parent) {
    const nodes = parent.childNodes;
    for (let i = 0; i < nodes.length; i++) {
      const elem = nodes[i];
      if (elem.nodeType === Node.TEXT_NODE) {
        yield elem;
        continue;
      }
      if (elem.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      const tagName = elem.tagName.toLowerCase();
      if (exclusions.indexOf(tagName) >= 0) {
        continue;
      }
      if ($(elem).css("display") === "none") {
        continue;
      }
      if (tagName === "details" && $(elem).attr("open") == null) {
        continue;
      }
      if (tagName === "iframe") {
        try {
          // Error occurs in this line when cross domain.
          const body = elem.contentWindow.document.body;

          yield* collectTextNode(body);
        } catch (e) {
        }
        continue;
      }
      yield* collectTextNode(elem);
    }
  };
})();

const blackOrWhite = hexcolor => {
  const r = parseInt(hexcolor.substr(1, 2), 16);
  const g = parseInt(hexcolor.substr(3, 2), 16);
  const b = parseInt(hexcolor.substr(5, 2), 16);

  return ((((r * 299) + (g * 587) + (b * 114)) / 1000) < 128) ? "white" : "black";
};

const saveHistory = async text => {
  if (text == null || text === "") return;

  const texts = await getStorageValue("texts", []);

  // If it is a same as last search keyword, don't save.
  if (texts[texts.length - 1] !== text) {
    texts.push(text);
    while (texts.length > 1000) texts.shift();
    await setStorageValue("texts", texts);
  }
};
