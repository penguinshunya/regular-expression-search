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
  let texts = [];
  let rects = [];
  let srch = (function*(){})();
  let rect = (function*(){})();
  let mark = (function*(){})();

  // search process information
  let search = false;
  let process = false;

  let port = null;
  let current = 0;

  const clearSearchResult = () => {
    marker.clear();
    text = "";
    cain = false;
    search = false;
    process = false;
    texts = [];
    rects = [];
    srch = (function*(){})();
    rect = (function*(){})();
    mark = (function*(){})();
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

  const searchNext = date => {
    if (current !== date) return;
    
    const start = performance.now();
    let finished = false;
    do {
      const result = srch.next();
      if (result.done) {
        finished = true;
        break;
      } else {
        texts.push(result.value);
      }
    } while (performance.now() - start < 1000 / FPS);
    if (finished) {
      rect = Rect(texts);
      window.setTimeout(layoutNext, 0, date);
    } else {
      window.setTimeout(searchNext, 0, date);
    }
  };

  const layoutNext = date => {
    if (current !== date) return;

    const start = performance.now();
    let finished = false;
    do {
      const result = rect.next();
      if (result.done) {
        finished = true;
        break;
      } else {
        const r = result.value;
        rects.push({top: r.top, height: r.height});
      }
    } while (performance.now() - start < 1000 / FPS);
    if (finished) {
      mark = marker.generate(texts, rects);
      window.setTimeout(markerNext, 0, date);
    } else {
      window.setTimeout(layoutNext, 0, date);
    }
  };

  const markerNext = date => {
    if (current !== date) return;

    const start = performance.now();
    do {
      const result = mark.next();
      if (result.done) {
        process = false;
        break;
      }
    } while (performance.now() - start < 1000 / FPS);
    marker.redraw();
    if (process) {
      window.setTimeout(markerNext, 0, date);
    }
    if (port !== null) {
      postSearchProcess();
    }
  };

  $(window).resize(() => {
    marker.redraw();
  });

  $(Marker.canvas).on("mousemove", e => {
    marker.changeCursor(e.offsetY);
  });

  $(Marker.canvas).click(e => {
    marker.select(e.offsetY);
  });

  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.fps == null) return;
    FPS = request.fps;
    sendResponse();
  });

  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.mc == null || request.fc == null) return;
    Marker.setMarkerColor(request.mc);
    Marker.setFocusedMarkerColor(request.fc);
    sendResponse();
  });

  (async () => {
    FPS = await getStorageValue("fps", 60);
    const mc = await getStorageValue("markerColor", "yellow");
    const fc = await getStorageValue("focusedMarkerColor", "orange");
    Marker.setMarkerColor(mc, true);
    Marker.setFocusedMarkerColor(fc, true);
  })();

  return p => {
    p.onDisconnect.addListener(() => {
      port = null;
    });

    p.onMessage.addListener(request => {
      if (request.kind !== "new") return;

      clearSearchResult();

      text = request.text;
      cain = request.cain;

      srch = Search(text, cain);
      search = true;
      process = true;
      current = performance.now();
      window.setTimeout(searchNext, 0, current);
    });

    p.onMessage.addListener(request => {
      if (request.kind === "new") return;

      switch (request.kind) {
        case "prepare":
          port = p;
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
