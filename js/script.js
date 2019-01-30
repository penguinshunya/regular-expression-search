chrome.runtime.onConnect.addListener((() => {
  // The smaller the FPS, the quicker the search ends but the page gets stiff.
  let FPS = 60;
  let marker = new Marker();
  let current;

  // search information
  let text = null;
  let cain = null;

  // search process information
  let process = Process.DoNothing;
  let count = 0;

  let port = null;

  const clearSearchResult = () => {
    marker.clear();
    text = "";
    cain = null;
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

    process = Process.Searching;
    if (port !== null) {
      postSearchProcess();
    }

    let now = new Date().getTime();

    for (const t of Search(text, cain)) {
      texts.push(t);

      if (new Date().getTime() - now > 1000 / FPS) {
        await sleep(0);
        if (current !== date) return;
        if (process !== Process.Searching) return;
        now = new Date().getTime();
      }
    }
    for (const r of Layout(texts)) {
      rects.push(r);

      if (new Date().getTime() - now > 1000 / FPS) {
        await sleep(0);
        if (current !== date) return;
        if (process !== Process.Searching) return;
        now = new Date().getTime();
      }
    }
    count = texts.length;
    process = Process.Marking;
    if (port !== null) {
      postSearchProcess();
    }
    for (const _n of marker.generate(_.zip(texts, rects))) {
      if (new Date().getTime() - now > 1000 / FPS) {
        marker.redraw();
        await sleep(0);
        if (current !== date) return;
        if (process !== Process.Marking) return;
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
      (async () => {
        if (text == null || text === "") return;
        const texts = await getStorageValue("texts", []);
        if (texts[texts.length - 1] !== text) {
          texts.push(text);
          while (texts.length > 1000) texts.shift();
          await setStorageValue("texts", texts);
        }
      })();
      port = null;
    });

    p.onMessage.addListener(request => {
      if (request.kind !== "new") return;

      clearSearchResult();

      text = request.text;
      cain = request.cain;

      current = new Date();

      // Asynchronous search.
      search(current);
    });

    p.onMessage.addListener(request => {
      if (request.kind !== "init") return;

      port = p;
      port.postMessage({
        text: text,
        cain: cain,
      });
    });

    p.onMessage.addListener(request => {
      if (request.kind === "new") return;
      if (request.kind === "init") return;

      switch (request.kind) {
        case "prepare":
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
