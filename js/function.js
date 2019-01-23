let collectTextElement = (() => {
  let exclusions = [
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

let collectTextContent = (elems) => {
  let text = "";
  for (let i = 0; i < elems.count(); i++) {
    text += elems.search(i).textContent;
  }
  return text;
};
