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
  let FPS = 60;
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
  let backport = chrome.runtime.connect();
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

    while (result.index >= length + texts.search(index).data.length) {
      length += texts.search(index++).data.length;
    }
    {
      const latter = texts.search(index).splitText(result.index - length);
      texts.insert(index + 1, latter);
      length += texts.search(index++).data.length;
    }
    
    while (result.index + result[0].length > length + texts.search(index).data.length) {
      elems.push(texts.search(index));
      length += texts.search(index++).data.length;
    }
    elems.push(texts.search(index));
    {
      const latter = texts.search(index).splitText(regex.lastIndex - length);
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

  const searchNext = (() => {
    let count = 0;
    let interval = 1;
    return date => {
      if (current > date) return;
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
      if (++count % interval === 0 || !process) {
        marker.addMarkers();
        count = 0;
      }
      if (process) {
        backport.postMessage(date);
      }
      if (port !== null) {
        postSearchProcess();
      }
    };
  })(); 

  backport.onMessage.addListener(searchNext);

  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.fps == null) return;
    FPS = request.fps;
    sendResponse();
  });

  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.markerColor == null || request.focusedMarkerColor == null) return;
    Marker.setMarkerColor(request.markerColor);
    Marker.setFocusedMarkerColor(request.focusedMarkerColor);
    sendResponse();
  });

  (async () => {
    FPS = await getStorageValue("fps", 60);
    const markerColor = await getStorageValue("markerColor", "yellow");
    const focusedMarkerColor = await getStorageValue("focusedMarkerColor", "orange");
    Marker.setMarkerColor(markerColor, true);
    Marker.setFocusedMarkerColor(focusedMarkerColor, true);
  })();

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
          current = performance.now();
          backport.postMessage(current);
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
