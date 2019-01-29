// search information
let text = "";
let cain = false;

chrome.runtime.onMessage.addListener((() => {
  return (_request, _sender, sendResponse) => {
    sendResponse({
      text: text,
      cain: cain,
    });
  };
})());

chrome.runtime.onConnect.addListener((() => {
  // The smaller the FPS, the quicker the search ends but the page gets stiff.
  let FPS = 60;
  let marker = new Marker();
  let current;

  // search process information
  let search = false;
  let process = false;

  let port = null;

  const clearSearchResult = () => {
    marker.clear();
    text = "";
    cain = false;
    search = false;
    process = false;
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

  const searching = async date => {
    const texts = [];
    const rects = [];

    let now = performance.now();

    for (let t of Search(text, cain)) {
      texts.push(t);

      if (performance.now() - now > 1000 / FPS) {
        await sleep(0);
        if (current !== date) return;
        now = performance.now();
      }
    }
    for (let r of Rect(texts)) {
      rects.push({top: r.top, height: r.height});

      if (performance.now() - now > 1000 / FPS) {
        await sleep(0);
        if (current !== date) return;
        now = performance.now();
      }
    }
    for (let _ of marker.generate(texts, rects)) {
      if (performance.now() - now > 1000 / FPS) {
        marker.redraw();
        if (port !== null) {
          postSearchProcess();
        }
        await sleep(0);
        if (current !== date) return;
        now = performance.now();
      }
    }
    process = false;
    marker.redraw();
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

      search = true;
      process = true;
      current = performance.now();

      searching(current);
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
