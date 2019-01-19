// search information
let text = "";
let flagI = false;

// search process information
let process = false;
let regex;
let list;
let content;
let index = 0;
let length = 0;
let blocks = [];
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
    case "process":
      let finish = false;
      for (let i = 0; i < CHUNK_SIZE; i++) {
        let elems = sliceMatchedElems();
        if (elems === null) {
          finish = true;
          process = false;
          break;
        } else {
          blocks.push(elems.map(elem => marking(elem, blocks.length)));
        }
      }
      if (finish) {
        port.postMessage({status: "finish"});
      } else {
        port.postMessage({status: "process"});
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
      return;
    case "getinfo":
      break;
  }

  if (blocks.length === 0) {
    port.postMessage({
      index: 0,
      count: 0,
    });
    return;
  }

  focusBlock(blocks, prevIndex, currIndex);

  port.postMessage({
    index: currIndex + 1,
    count: blocks.length,
  });
};

let focusBlock = (blocks, prevIndex, currIndex) => {
  // Focus current search result.
  blocks[prevIndex].forEach(($div) => {
    $div.css("background-color", "yellow");
  });
  blocks[currIndex].forEach(($div) => {
    $div.css("background-color", "orange");
  });

  blocks[currIndex][0].focus();
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
      if (exclusionTagNames.some(name => name === elem.tagName.toLowerCase())) {
        return;
      }
      if ($(elem).css("display") === "none") {
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
  $("mark.search-result-marker").contents().unwrap();
  text = "";
  flagI = false;
  process = false;
  blocks = [];
};

let marking = (() => {
  let $mark = $("<mark>");
  $mark.attr("tabindex", "-1").addClass("search-result-marker").css({
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
