const Search = function* (text, cain) {
  const r = new RegExp(text, cain ? "gi" : "g");
  const t = collectTextElement(document.body);
  const c = collectTextContent(t);
  let a;
  let i = 0, l = 0;

  while (a = r.exec(c)) {
    // Avoid infinite loop.
    if (a.index === r.lastIndex) {
      return;
    }

    const texts = [];

    while (a.index >= l + t.search(i).data.length) {
      l += t.search(i++).data.length;
    }
    t.insert(i + 1, t.search(i).splitText(a.index - l));
    l += t.search(i++).data.length;
    
    while (a.index + a[0].length > l + t.search(i).data.length) {
      texts.push(t.search(i));
      l += t.search(i++).data.length;
    }
    texts.push(t.search(i));
    t.insert(i + 1, t.search(i).splitText(r.lastIndex - l));
    l += t.search(i++).data.length;

    yield texts;
  }
};

const Layout = function* (texts) {
  const r = document.createRange();
  for (let nodes of texts) {
    r.selectNodeContents(nodes[0]);
    const rect = r.getBoundingClientRect();
    yield {top: rect.top, height: rect.height};
  }
};
