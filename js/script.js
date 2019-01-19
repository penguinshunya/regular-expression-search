// search information
let text = "";
let flagI = false;

// search process information
let search = false;
let process = false;
let regex;
let list;
let content;
let index = 0;
let length = 0;
let blocks = [];
let markers = [];
const CHUNK_SIZE = 10;

// focus information
let currIndex = 0;

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(request => {
    main(port, request);
  });
});

let main = (port, request) => {
  let kind = request.kind;

  if (kind === "new" && request.text === text && request.flagI === flagI) {
    if (process) {
      search = true;
      kind = "process";
    } else {
      kind = "next";
    }
  }

  let prevIndex = 0;

  switch (kind) {
    case "new":
      clearPrevSearchResult();

      text = request.text;
      flagI = request.flagI;

      currIndex = 0;

      if (flagI) {
        regex = new RegExp(text, "gi");
      } else {
        regex = new RegExp(text, "g");
      }
      list = collectTextElement(document.body);
      content = collectTextContent(list);
      index = 0;
      length = 0;
      blocks = [];
      process = true;
      search = true;
    case "process":
      if (!search) {
        break;
      }
      for (let i = 0; i < CHUNK_SIZE; i++) {
        let elems = sliceMatchedElems();
        if (elems === null) {
          process = false;
          break;
        } else {
          let i = blocks.length;
          blocks.push(elems.map(elem => marking(elem, i)));
          markers.push(addMarker($(elems[0]).parent(), i));
        }
      }
      break;
    case "prev":
      if (blocks.length === 0) {
        break;
      }
      prevIndex = currIndex--;
      if (currIndex < 0) {
        currIndex = blocks.length - 1;
      }
      break;
    case "next":
      if (blocks.length === 0) {
        break;
      }
      prevIndex = currIndex++;
      if (currIndex >= blocks.length) {
        currIndex = 0;
      }
      break;
    case "close":
      clearPrevSearchResult();
      break;
    case "prepare":
      if (process) {
        search = false;
      }
      break;
  }

  focusBlock(blocks, prevIndex, currIndex);

  port.postMessage({
    search: search,
    process: process,
    text: text,
    flagI: flagI,
    index: currIndex + 1,
    count: blocks.length,
  });
};

let focusBlock = (blocks, prevIndex, currIndex) => {
  if (blocks.length === 0) {
    return;
  }
  // Focus current search result.
  blocks[prevIndex].forEach(($div) => {
    $div.css("background-color", "yellow");
  });
  blocks[currIndex].forEach(($div) => {
    $div.css("background-color", "orange");
  });

  blocks[currIndex][0].focus();

  markers[prevIndex].css({
    backgroundColor: "yellow",
    border: "solid 1px yellow",
    zIndex: 0,
  });
  markers[currIndex].css({
    backgroundColor: "orange",
    border: "solid 1px orange",
    zIndex: 1,
  });
};

let sliceMatchedElems = () => {
  let result;

  if ((result = regex.exec(content)) == null) {
    return null;
  }

  let elems = [];
  let range = document.createRange();

  while (result.index >= length + list[index].data.length) {
    length += list[index++].data.length;
  }
  range.setStart(list[index], result.index - length);
  {
    let latter = range.startContainer.splitText(range.startOffset);
    list.splice(index + 1, 0, latter);
    length += list[index++].data.length;
  }
  
  while (result.index + result[0].length > length + list[index].data.length) {
    elems.push(list[index]);
    length += list[index++].data.length;
  }
  elems.push(list[index]);
  range.setEnd(list[index], result.index + result[0].length - length);
  {
    let latter = range.endContainer.splitText(range.endOffset);
    list.splice(index + 1, 0, latter);
    length += list[index++].data.length;
  }

  return elems;
};

let exclusionTagNames = [
  "head",
  "script",
  "noscript",
  "style",
  "textarea",
  "svg",
];

let collectTextElement = (parent) => {
  let list = [];
  parent.childNodes.forEach((elem) => {
    if (elem.nodeType === Node.ELEMENT_NODE) {
      let tagName = elem.tagName.toLowerCase();
      if (exclusionTagNames.some(name => tagName === name)) {
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
    } else if (elem.nodeType === Node.TEXT_NODE) {
      list.push(elem);
    }
  });
  return list;
};

let collectTextContent = (elements) => {
  let text = "";
  elements.forEach(elem => {
    text += elem.textContent;
  });
  return text;
};

let clearPrevSearchResult = () => {
  blocks.forEach(block => {
    block.forEach(mark => mark.contents().unwrap());
  });
  markerWrapper.html("");
  text = "";
  flagI = false;
  process = false;
  search = false;
  blocks = [];
  markers = [];
};

let marking = (() => {
  let $mark = $("<mark>");
  $mark.attr("tabindex", "-1").css({
    margin: 0,
    padding: 0,
    backgroundColor: "yellow",
  });

  // Change focus target.
  // When click outside the popup area, popup close.
  // Therefore, don't need to call port.postMessage() after focusBlock().
  $mark.on("click", function() {
    let index = currIndex;
    currIndex = $(this).data("index");
    focusBlock(blocks, index, currIndex);
  });

  return (node, index) => {
    let mark = $mark.clone(true);
    mark.data("index", index);
    return $(node).wrap(mark).parent();
  };
})();

let markerWrapper = $("<div>");
markerWrapper.css({
  zIndex: 65536,
  position: "fixed",
  margin: 0,
  padding: 0,
  width: 16,
  height: window.innerHeight,
  top: 0,
  right: 0,
});
markerWrapper.appendTo("body");

$(window).resize(() => {
  markers.forEach(marker => {
    let pos = marker.data("position");
    let top = pos * window.innerHeight / $(document).height();
    marker.css("top", top);
  });
});

let addMarker = (() => {
  let $marker = $("<div>");
  $marker.css({
    position: "absolute",
    margin: 0,
    padding: 0,
    border: "solid 1px yellow",
    backgroundColor: "yellow",
    left: 0,
    width: "100%",
    cursor: "pointer",
  });

  $marker.on("click", function() {
    let index = currIndex;
    currIndex = $(this).data("index");
    focusBlock(blocks, index, currIndex);
  });

  return (elem, index) => {
    let marker = $marker.clone(true);
    let pos = elem.offset().top;
    let height = elem.height() * window.innerHeight / $(document).height();
    let top = pos * (window.innerHeight - height) / $(document).height();
    marker.css("top", top);
    marker.height(height);
    marker.data("index", index);
    marker.data("position", pos);
    marker.appendTo(markerWrapper);
    return marker;
  };
})();
