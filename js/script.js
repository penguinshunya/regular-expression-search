// search information
let text = "";
let cain = false;

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

// The smaller the FPS, the quicker the search ends.
const FPS = 30;

let input = "";

// focus information
let currIndex = -1;

let backport = chrome.runtime.connect();

let markerWrapper = $("<div>");
let maxBottom = 0;

let markerColor = "yellow";
let focusedMarkerColor = "orange";

let focusPrevBlock = () => {
  if (blocks.length === 0) {
    return;
  }
  if (currIndex === -1) {
    currIndex = 0;
  }
  let prevIndex = currIndex--;
  if (currIndex < 0) {
    currIndex = blocks.length - 1;
  }
  focusBlock(prevIndex, currIndex);
};

let focusNextBlock = () => {
  if (blocks.length === 0) {
    return;
  }
  if (currIndex === -1) {
    currIndex = blocks.length - 1;
  }
  let prevIndex = currIndex++;
  if (currIndex >= blocks.length) {
    currIndex = 0;
  }
  focusBlock(prevIndex, currIndex);
};

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  switch (request.kind) {
    case "input":
      sendResponse({input: input});
      break;
    case "prevText":
      sendResponse({prevText: text});
      break;
    case "prevCain":
      sendResponse({prevCain: cain});
      break;
    case "change":
      input = request.input;
      break;
  }
});

chrome.runtime.onConnect.addListener(port => {
  let postMessage = () => {
    port.postMessage({
      search: search,
      process: process,
      text: text,
      cain: cain,
      index: currIndex + 1,
      count: blocks.length,
    });
  };

  let searchNext = () => {
    if (!search) {
      return;
    }
    let start = new Date().getTime();
    do {
      let elems = sliceMatchedElems();
      if (elems === null) {
        process = false;
        break;
      } else {
        let i = blocks.length;
        blocks.push(elems.map(elem => marking(elem, i)));
        markers.push(addMarker($(elems[0]).parent(), i));
      }
    } while (new Date().getTime() - start < 1000 / FPS);
    if (process) {
      backport.postMessage();
    }
    if (port !== null) {
      postMessage();
    }
  };

  let resetBackport = () => {
    backport.disconnect();
    backport = chrome.runtime.connect();
    backport.onMessage.addListener(searchNext);
  };

  port.onMessage.addListener(request => {
    let kind = request.kind;
  
    if (kind === "new" && request.text === text && request.cain === cain) {
      if (process) {
        search = true;
        kind = "process";
      } else {
        kind = "next";
      }
    }
  
    switch (kind) {
      case "prepare":
        resetBackport();
        if (process) {
          backport.postMessage();
        }
        break;
      case "new":
        clearSearchResult();
        resetBackport();

        text = request.text;
        cain = request.cain;
  
        currIndex = -1;

        regex = new RegExp(text, cain ? "gim" : "gm");
        list = collectTextElement(document.body);
        content = collectTextContent(list);
        index = 0;
        length = 0;
        blocks = [];
        process = true;
        search = true;
      case "process":
        backport.postMessage();
        break;
      case "prev":
        focusPrevBlock();
        break;
      case "next":
        focusNextBlock();
        break;
      case "close":
        clearSearchResult();
        break;
    }
    if (port !== null) {
      postMessage();
    }
  });

  port.onDisconnect.addListener(_ => {
    port = null;
  });
});

let focusBlock = (prevIndex, currIndex) => {
  if (blocks.length === 0) {
    return;
  }
  if (prevIndex < 0) {
    prevIndex = 0;
  }
  // Focus current search result.
  blocks[prevIndex].forEach(($div) => {
    $div.css("background-color", markerColor);
  });
  blocks[currIndex].forEach(($div) => {
    $div.css("background-color", focusedMarkerColor);
  });

  blocks[currIndex][0].focus();

  markers[prevIndex].css({
    backgroundColor: markerColor,
    zIndex: 0,
  });
  markers[currIndex].css({
    backgroundColor: focusedMarkerColor,
    zIndex: 1,
  });
};

// I want to speed up this function.
let sliceMatchedElems = () => {
  let result = regex.exec(content);
  if (result == null) {
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

let exclTagNames = [
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
    if (elem.nodeType === Node.TEXT_NODE) {
      list.push(elem);
      return;
    }
    if (elem.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    let tagName = elem.tagName.toLowerCase();
    if (exclTagNames.indexOf(tagName) >= 0) {
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
  });
  return list;
};

let collectTextContent = (elems) => {
  return elems.reduce((accm, elem) => accm + elem.textContent, "");
};

let clearSearchResult = () => {
  blocks.forEach(block => {
    block.forEach(mark => mark.contents().unwrap().parent()[0].normalize());
  });
  markerWrapper.empty();
  text = "";
  cain = false;
  process = false;
  search = false;
  blocks = [];
  markers = [];
  maxBottom = 0;
};

let marking = (() => {
  let $mark = $("<mark>");
  $mark.attr("tabindex", "-1").css({
    margin: 0,
    padding: 0,
    backgroundColor: markerColor,
  });

  // Change focus target.
  // When click outside the popup area, popup close.
  // Therefore, don't need to call port.postMessage() after focusBlock().
  $mark.on("click", function() {
    let index = currIndex;
    currIndex = $(this).data("index");
    focusBlock(index, currIndex);
  });

  return (node, index) => {
    let mark = $mark.clone(true);
    mark.data("index", index);
    return $(node).wrap(mark).parent();
  };
})();

markerWrapper.css({
  zIndex: 65536,
  position: "fixed",
  margin: 0,
  padding: 0,
  width: 16,
  top: 0,
  right: 0,
});
markerWrapper.appendTo("body");

let addMarker = (() => {
  let $marker = $("<div>");
  $marker.css({
    position: "absolute",
    margin: 0,
    padding: 0,
    backgroundColor: markerColor,
    left: 0,
    width: "100%",
    cursor: "pointer",
  });

  $marker.on("click", function() {
    let index = currIndex;
    currIndex = $(this).data("index");
    focusBlock(index, currIndex);
  });

  return (elem, index) => {
    let marker = $marker.clone(true);
    let height = elem.height() / $(document).height() * window.innerHeight;
    if (height < 5) height = 5;

    let top = elem.offset().top / ($(document).height() - elem.height());
    marker.css("top", top * 100 + "%");
    marker.height(height);
    marker.data("index", index);
    marker.appendTo(markerWrapper);

    let bottom = elem.offset().top + elem.height();
    if (bottom >= maxBottom) {
      maxBottom = bottom;
      markerWrapper.css("height", "calc(100% - " + height + "px)");
    }

    return marker;
  };
})();
