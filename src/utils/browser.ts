import $ from "jquery";

const exclusions = [
  "script",
  "noscript",
  "style",
  "textarea",
  "svg",
];

export const collectTextNode: (parent: any) => IterableIterator<any> = function* (parent) {
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      yield node;
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }
    const tagName = node.tagName.toLowerCase();
    if (exclusions.indexOf(tagName) >= 0) {
      continue;
    }
    if ($(node).css("display") === "none") {
      continue;
    }
    if (tagName === "details" && $(node).attr("open") == null) {
      continue;
    }
    if (tagName === "iframe") {
      try {
        // Error occurs in this line when cross domain.
        const body = node.contentWindow.document.body;

        yield* collectTextNode(body);
      } catch (e) {
      }
      continue;
    }
    yield* collectTextNode(node);
  }
};

export function makeSVG(tag: string, attrs: { [s: string]: string }) {
  const elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const key in attrs) {
    elem.setAttribute(key, attrs[key]);
  }
  return elem;
}

// https://stackoverflow.com/questions/25467009/internationalization-of-html-pages-for-my-google-chrome-extension
$(() => {
  //Localize by replacing __MSG_***__ meta tags
  var objects = document.getElementsByTagName('html');
  for (var j = 0; j < objects.length; j++) {
    var obj = objects[j];

    var valStrH = obj.innerHTML.toString();
    var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
      return v1 ? chrome.i18n.getMessage(v1) : "";
    });

    if (valNewH != valStrH) {
      obj.innerHTML = valNewH;
    }
  }
});
