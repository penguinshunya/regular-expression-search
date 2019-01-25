const getStorageValue = async (key, defaultValue) => {
  const promise = new Promise(resolve => {
    const param = {};
    param[key] = defaultValue;
    chrome.storage.local.get(param, (response) => {
      resolve(response[key]);
    });
  });
  return promise;
};

const setStorageValue = async (key, value, callback = () => {}) => {
  const promise = new Promise(resolve => {
    const param = {};
    param[key] = value;
    chrome.storage.local.set(param, (response) => {
      callback(response);
      resolve();
    });
  });
  return promise;
};

const collectTextElement = (() => {
  const exclusions = [
    "script",
    "noscript",
    "style",
    "textarea",
    "svg",
  ];

  return (parent, elems = new Treap()) => {
    parent.childNodes.forEach((elem) => {
      if (elem.nodeType === Node.TEXT_NODE) {
        elems.push(elem);
        return;
      }
      if (elem.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      const tagName = elem.tagName.toLowerCase();
      if (exclusions.indexOf(tagName) >= 0) {
        return;
      }
      if ($(elem).css("display") === "none") {
        return;
      }
      if (tagName === "iframe") {
        try {
          // Error occurs in this line when cross domain.
          const body = elem.contentWindow.document.body;
          
          collectTextElement(body, elems);
        } catch (e) {
        }
        return;
      }
      collectTextElement(elem, elems);
    });
    return elems;
  };
})();

const collectTextContent = (elems) => {
  let text = "";
  for (let i = 0; i < elems.count(); i++) {
    text += elems.search(i).textContent;
  }
  return text;
};
