export function* collectTextNode(parent: Node): Generator<Text, void, void> {
  const EXCEPT_TAGS = new Set([
    "script",
    "style",
  ]);
  for (const node of parent.childNodes) {
    if (node instanceof Text) {
      yield node;
    }
    // MEMO: <svg> is not a HTMLElement.
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (node.style.display === "none") {
      continue;
    }
    const tagName = node.tagName.toLowerCase();
    if (EXCEPT_TAGS.has(tagName)) {
      continue;
    }
    if (tagName === "details" && !node.hasAttribute("open")) {
      continue
    }
    yield* collectTextNode(node);
  }
}
