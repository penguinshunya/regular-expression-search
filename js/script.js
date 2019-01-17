let currIndex = -1;
let prevIndex = -1;
let prevText = "";
let prevFlagI = null;
let matchBlocks = [];

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  let kind = request.kind;

  if (kind === "new" && request.text === prevText && request.flag_i === prevFlagI) {
    kind = "next";
  }

  switch (kind) {
    case "new":
      let text = request.text;
      let flag_i = request.flag_i;

      clearPrevSearchResult();
      prevText = text;
      prevFlagI = flag_i;

      let blocks = [];

      for (let elems of generateMatchedElems(text, flag_i)) {
        blocks.push(elems.map(elem => marking(elem)));
      }

      prevIndex = 0;
      currIndex = 0;
      matchBlocks = blocks;
      break;
    case "prev":
      if (matchBlocks.length === 0) {
        break;
      }
      prevIndex = currIndex--;
      if (currIndex < 0) {
        currIndex = matchBlocks.length - 1;
      }
      break;
    case "next":
      if (matchBlocks.length === 0) {
        break;
      }
      prevIndex = currIndex++;
      if (currIndex >= matchBlocks.length) {
        currIndex = 0;
      }
      break;
    case "close":
      clearPrevSearchResult();
      return;
  }

  if (matchBlocks.length === 0) {
    sendResponse({
      index: 0,
      count: 0,
    });
    return;
  }

  focusBlock(matchBlocks, prevIndex, currIndex);

  sendResponse({
    index: currIndex + 1,
    count: matchBlocks.length,
  });
});

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

let generateMatchedElems = function*(text, flag_i) {
  if (flag_i) {
    var regex = new RegExp(text, "gi");
  } else {
    var regex = new RegExp(text, "g");
  }
  let list = collectTextElement();
  let content = collectTextContent(list);

  let index = 0;
  let length = 0;
  let result;

  while ((result = regex.exec(content)) != null) {
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

    yield elems;
  }
};

let exclusionTagNames = [
  "head",
  "script",
  "noscript",
  "style",
  "textarea",
  "svg",
];

let collectTextElement = (parent = document.body) => {
  let list = [];
  parent.childNodes.forEach((elem) => {
    if (elem.nodeType === Node.ELEMENT_NODE) {
      if (exclusionTagNames.some(name => elem.tagName.toLowerCase() === name)) {
        return;
      }
      let pars = Array.from($(elem).parents());
      if (pars.some(par => $(par).css("display") === "none")) {
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
  $(".search-result-marker").contents().unwrap();
  prevText = "";
  prevFlagI = null;
  matchBlocks = [];
};

let $mark = $("<mark>");
$mark.attr("tabIndex", "-1").addClass("search-result-marker").css({
  margin: 0,
  padding: 0,
  backgroundColor: "yellow",
});

let marking = (node) => {
  return $(node).wrap($mark.clone()).parent();
};
