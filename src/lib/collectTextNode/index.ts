export function* collectTextNode(parent: Node): Generator<Text, void, void> {
  const EXCEPT_TAGS = new Set([
    "script",
    "style",
  ]);
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      // MEMO: This condition should never be met.
      if (!(node instanceof Text)) {
        throw new Error("Unexpected node type");
      }
      yield node;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue;
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
