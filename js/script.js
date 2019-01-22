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

  let timeoutID = null;
  let marker = new Marker();

  // search process information
  let search = false;
  let process = false;
  let regex;
  let list;
  let content;
  let index = 0;
  let length = 0;

  let clearSearchResult = () => {
    marker.clear();
    text = "";
    cain = false;
    search = false;
    process = false;
    index = 0;
    length = 0;
    window.clearTimeout(timeoutID);
  };

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

  return port => {
    let postMessage = () => {
      port.postMessage({
        search: search,
        process: process,
        text: text,
        cain: cain,
        index: marker.index(),
        count: marker.count(),
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
          marker.add(elems);
        }
      } while (new Date().getTime() - start < 1000 / FPS);
      if (process) {
        timeoutID = window.setTimeout(searchNext, 0);
      }
      if (port !== null) {
        postMessage();
      }
    };

    port.onDisconnect.addListener(() => {
      port = null;
    });

    port.onMessage.addListener(request => {
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
          window.clearTimeout(timeoutID);
          if (process) {
            // Use new port object.
            timeoutID = window.setTimeout(searchNext, 0);
          }
          break;
        case "new":
          clearSearchResult();

          text = request.text;
          cain = request.cain;

          regex = new RegExp(text, cain ? "gmi" : "gm");
          list = collectTextElement(document.body);
          content = collectTextContent(list);
          search = true;
          process = true;
        case "process":
          timeoutID = window.setTimeout(searchNext, 0);
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
        postMessage();
      }
    });
  }
})());
