let collectTextElement = (() => {
  let exclusions = [
    "script",
    "noscript",
    "style",
    "textarea",
    "svg",
  ];

  return (parent) => {
    let list = [];
    parent.childNodes.forEach((elem) => {
      if (elem.nodeType === Node.TEXT_NODE) {
        list.push(elem);
        return;
      }
      if (elem.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      let tagName = elem.tagName.toLowerCase();
      if (exclusions.indexOf(tagName) >= 0) {
        return;
      }
      if ($(elem).css("display") === "none") {
        return;
      }
      if (tagName === "iframe") {
        try {
          // Error occurs in this line when cross domain.
          let body = elem.contentWindow.document.body;
  
          list = list.concat(collectTextElement(body));
        } catch (e) {
        }
        return;
      }
      list = list.concat(collectTextElement(elem));
    });
    return list;
  };
})();

let collectTextContent = (elems) => {
  return elems.reduce((accm, elem) => accm + elem.textContent, "");
};
