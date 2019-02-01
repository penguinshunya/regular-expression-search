const Search = function* (text, cain, ignoreBlank) {
  const r = new RegExp(text, cain ? "gi" : "g");
  const t = reduce(collectTextNode(document.body), (t, n) => t.push(n), new Treap());
  const c = reduce(t, (c, e) => c + e.textContent, "");
  let a;
  let i = 0, l = 0;
  let index = 0;

  while (a = r.exec(c)) {
    // Avoid infinite loop.
    if (a.index === r.lastIndex) {
      return;
    }

    if (ignoreBlank && a[0].trim() === "") {
      continue;
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

    yield [index++, texts];
  }
};
