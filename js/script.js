// search information
let text = "";
let cain = false;

chrome.runtime.onMessage.addListener((() => {
  let input = "";

  return (request, _, sendResponse) => {
    switch (request.kind) {
      case "page":
        sendResponse({
          text: text,
          cain: cain,
          input: input,
        });
        break;
      case "change":
        input = request.input;
        break;
    }
  };
})());

chrome.runtime.onConnect.addListener((() => {
  // The smaller the FPS, the quicker the search ends.
  const FPS = 30;

  let marker = new Marker();

  // search process information
  let search = false;
  let process = false;
  let regex;
  let texts;
  let content;
  let index = 0;
  let length = 0;

  let port = null;
  let current = "";

  let clearSearchResult = () => {
    marker.clear();
    text = "";
    cain = false;
    search = false;
    process = false;
    index = 0;
    length = 0;
  };

  let sliceMatchedElems = () => {
    let result = regex.exec(content);
    if (result == null) {
      return null;
    }

    let elems = [];
    let range = document.createRange();

    while (result.index >= length + texts.search(index).data.length) {
      length += texts.search(index++).data.length;
    }
    range.setStart(texts.search(index), result.index - length);
    {
      let latter = range.startContainer.splitText(range.startOffset);
      texts.insert(index + 1, latter);
      length += texts.search(index++).data.length;
    }
    
    while (result.index + result[0].length > length + texts.search(index).data.length) {
      elems.push(texts.search(index));
      length += texts.search(index++).data.length;
    }
    elems.push(texts.search(index));
    range.setEnd(texts.search(index), result.index + result[0].length - length);
    {
      let latter = range.endContainer.splitText(range.endOffset);
      texts.insert(index + 1, latter);
      length += texts.search(index++).data.length;
    }

    return elems;
  };

  let postSearchProcess = () => {
    port.postMessage({
      search: search,
      process: process,
      text: text,
      cain: cain,
      index: marker.index(),
      count: marker.count(),
    });
  };

  let searchNext = (e) => {
    if (e.source !== window || !e.data.startsWith("res")) {
      return;
    }
    if (current > e.data) {
      return;
    }
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
        marker.add(elems);
      }
    } while (new Date().getTime() - start < 1000 / FPS);
    if (process) {
      window.postMessage(e.data);
    }
    if (port !== null) {
      postSearchProcess();
    }
  };

  window.addEventListener("message", searchNext, false);

  return p => {
    p.onDisconnect.addListener(() => {
      port = null;
    });

    p.onMessage.addListener(request => {
      let kind = request.kind;
    
      if (kind === "new" && request.text === text && request.cain === cain) {
        if (process) {
          kind = "process";
        } else {
          kind = "next";
        }
      }
    
      switch (kind) {
        case "prepare":
          port = p;
          break;
        case "new":
          clearSearchResult();

          text = request.text;
          cain = request.cain;

          regex = new RegExp(text, cain ? "gi" : "g");
          texts = collectTextElement(document.body);
          content = collectTextContent(texts);
          search = true;
          process = true;
        case "process":
          current = "res" + new Date().getTime();
          window.postMessage(current);
          break;
        case "prev":
          marker.focusPrev();
          break;
        case "next":
          marker.focusNext();
          break;
        case "close":
          clearSearchResult();
          break;
      }
      if (port !== null) {
        postSearchProcess();
      }
    });
  };
})());
