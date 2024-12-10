export const collectTextNode: (parent: Node) => IterableIterator<Text> =
  function* (parent) {
    for (const node of parent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        yield node as Text;
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      const elem = node as Element;
      const tagName = elem.tagName.toLowerCase();
      if (exclusions.includes(tagName)) {
        continue;
      }
      const style = window.getComputedStyle(elem);
      if (style.display === "none") {
        continue;
      }
      if (tagName === "details" && !elem.hasAttribute("open")) {
        continue;
      }
      if (tagName === "iframe") {
        const iframe = elem as HTMLIFrameElement;
        try {
          // Error occurs in this line when cross domain.
          const body = iframe.contentWindow.document.body;

          yield* collectTextNode(body);
        } catch (e) {}
        continue;
      }
      yield* collectTextNode(elem);
    }
  };

const exclusions = ["script", "noscript", "style", "textarea", "svg"];
