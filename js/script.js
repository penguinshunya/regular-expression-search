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
  // The smaller the FPS, the quicker the search ends but the page gets stiff.
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

  const clearSearchResult = () => {
    marker.clear();
    text = "";
    cain = false;
    search = false;
    process = false;
    index = 0;
    length = 0;
  };

  const sliceMatchedElems = () => {
    const result = regex.exec(content);
    if (result == null) {
      return null;
    }

    const elems = [];
    const range = document.createRange();

    while (result.index >= length + texts.search(index).data.length) {
      length += texts.search(index++).data.length;
    }
    range.setStart(texts.search(index), result.index - length);
    {
      const latter = range.startContainer.splitText(range.startOffset);
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
      const latter = range.endContainer.splitText(range.endOffset);
      texts.insert(index + 1, latter);
      length += texts.search(index++).data.length;
    }

    return elems;
  };

  const postSearchProcess = () => {
    port.postMessage({
      search: search,
      process: process,
      text: text,
      cain: cain,
      index: marker.index() + 1,
      count: marker.count(),
    });
  };

  const searchNext = (e) => {
    if (e.source !== window || !e.data.startsWith("res")) return;
    if (current > e.data) return;
    if (!search) return;
    const start = new Date().getTime();
    do {
      const elems = sliceMatchedElems();
      if (elems === null) {
        process = false;
        break;
      } else {
        marker.addMarks(elems);
      }
    } while (new Date().getTime() - start < 1000 / FPS);
    marker.addMarkers();
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
      switch (request.kind) {
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
