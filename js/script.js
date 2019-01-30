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
  let FPS = 30;
  let marker = new Marker();
  let current;

  // search process information
  let process = Process.DoNothing;
  let count = 0;

  let port = null;

  const clearSearchResult = () => {
    marker.clear();
    text = "";
    cain = false;
    count = 0;
    process = Process.DoNothing;
  };

  const postSearchProcess = () => {
    port.postMessage({
      process: process,
      text: text,
      cain: cain,
      index: marker.index() + 1,
      count: count,
    });
  };

  const search = async date => {
    const texts = [];
    const rects = [];

    let now = new Date().getTime();

    for (let t of Search(text, cain)) {
      texts.push(t);

      if (new Date().getTime() - now > 1000 / FPS) {
        await sleep(0);
        if (current !== date) return;
        if (process !== Process.Prepare) return;
        now = new Date().getTime();
      }
    }
    for (let r of Rect(texts)) {
      rects.push({top: r.top, height: r.height});

      if (new Date().getTime() - now > 1000 / FPS) {
        await sleep(0);
        if (current !== date) return;
        if (process !== Process.Prepare) return;
        now = new Date().getTime();
      }
    }
    count = texts.length;
    process = Process.Searching;
    if (port !== null) {
      postSearchProcess();
    }
    for (let _n of marker.generate(_.zip(texts, rects))) {
      if (new Date().getTime() - now > 1000 / FPS) {
        marker.redraw();
        await sleep(0);
        if (current !== date) return;
        if (process !== Process.Searching) return;
        now = new Date().getTime();
      }
    }
    marker.redraw();
    process = Process.Finish;
  };

  $(window).resize(() => {
    if (process === Process.DoNothing) return;
    marker.redraw();
  });

  $(Marker.canvas).on("mousemove", e => {
    marker.changeCursor(e.offsetY);
  });

  $(Marker.canvas).click(e => {
    marker.select(e.offsetY);
  });

  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    if (request.mc == null || request.fc == null) return;
    Marker.setMarkerColor(request.mc);
    Marker.setFocusedMarkerColor(request.fc);
    sendResponse();
  });

  (async () => {
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

      process = Process.Prepare;
      if (port !== null) {
        postSearchProcess();
      }

      current = new Date();

      // Asynchronous search.
      search(current);
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
