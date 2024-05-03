import Treap from "@penguinshunya/treap/dist/treap";
import { collectTextNode } from "./browser";
import { reduce } from "./functions";

export const SearchAndSplit = function* (text: string, cain: boolean, ignoreBlank: boolean): IterableIterator<[number, Text[]]> {
  const r = new RegExp(text, cain ? "gi" : "g");
  const t = reduce(collectTextNode(document.body), (t, n) => t.push(n), new Treap<Text>());
  const c = reduce(t, (c, e) => c + e.textContent, "");
  let a: RegExpExecArray | null;
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

    const texts: Text[] = [];

    while (a.index >= l + t.search(i).data.length) {
      l += t.search(i++).data.length;
    }
    if (a.index > l) {
      t.insert(i + 1, t.search(i).splitText(a.index - l));
      l += t.search(i++).data.length;
    }

    while (r.lastIndex > l + t.search(i).data.length) {
      texts.push(t.search(i));
      l += t.search(i++).data.length;
    }
    texts.push(t.search(i));
    if (r.lastIndex < l + t.search(i).data.length) {
      t.insert(i + 1, t.search(i).splitText(r.lastIndex - l));
      l += t.search(i++).data.length;
    }

    yield [index++, texts];
  }
};
