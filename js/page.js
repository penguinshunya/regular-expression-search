chrome.runtime.onConnect.addListener((() => {
  // The smaller the FPS, the quicker the search ends but the page gets stiff.
  let FPS = 60;
  let port = null;

  // search information
  let text = null;
  let cain = null;
  let marker = new Marker();

  // search process information
  let current;
  let process = Process.DoNothing;
  let count = 0;

  let shuffle = SHUFFLE;
  let ignoreBlank = IGNORE_BLANK;
  let background = BACKGROUND;

  // popup information
  let input = null;

  const clearSearchResult = () => {
    marker.clear();
    text = "";
    cain = null;
    count = 0;
    process = Process.DoNothing;
  };

  const postSearchProcess = () => {
    if (port === null) return;
    port.postMessage({
      process: process,
      text: text,
      cain: cain,
      index: marker.index() + 1,
      count: count,
    });
  };

  const search = async date => {
    const marks = [];

    let now = new Date().getTime();

    process = Process.Searching;
    postSearchProcess();
    for (const t of Search(text, cain, ignoreBlank)) {
      const mark = new Mark();
      mark.texts = t;
      marks.push(mark);

      if (new Date().getTime() - now > 1000 / FPS) {
        await sleeping(background);
        if (current !== date) return;
        if (process !== Process.Searching) return;
        now = new Date().getTime();
      }
    }

    process = Process.Calculating;
    postSearchProcess();
    for (const _ of CalcLayout(marks)) {
      if (new Date().getTime() - now > 1000 / FPS) {
        await sleeping(background);
        if (current !== date) return;
        if (process !== Process.Calculating) return;
        now = new Date().getTime();
      }
    }
    count = marks.length;
    for (const [i, m] of marks.entries()) {
      m.index = i;
    }
    if (shuffle) {
      marks.shuffle();
    }

    process = Process.Marking;
    postSearchProcess();
    for (const _ of marker.generate(marks)) {
      if (new Date().getTime() - now > 1000 / FPS) {
        marker.redraw();
        await sleeping(background);
        if (current !== date) return;
        if (process !== Process.Marking) return;
        now = new Date().getTime();
      }
    }
    marker.redraw();
    process = Process.Finish;
    postSearchProcess();
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
    switch (request.key) {
      case "markerColor":
        Marker.setMarkerColor(request.value);
        break;
      case "focusedMarkerColor":
        Marker.setFocusedMarkerColor(request.value);
        break;
      case "instant":
        instant = request.value;
        if (port !== null) port.postMessage({ instant: instant });
        break;
      case "shuffle":
        shuffle = request.value;
        break;
      case "ignoreBlank":
        ignoreBlank = request.value;
        break;
      case "background":
        background = request.value;
        break;
    }
    sendResponse();
  });

  // initialize
  (async () => {
    const mc = await getStorageValue("markerColor", MARKER_COLOR);
    const fc = await getStorageValue("focusedMarkerColor", FOCUSED_MARKER_COLOR);
    Marker.setMarkerColor(mc, true);
    Marker.setFocusedMarkerColor(fc, true);
    shuffle = await getStorageValue("shuffle", SHUFFLE);
    ignoreBlank = await getStorageValue("ignoreBlank", IGNORE_BLANK);
    background = await getStorageValue("background", BACKGROUND);
  })();

  return p => {
    p.onDisconnect.addListener(() => {
      saveHistory(text);
      port = null;
    });

    p.onMessage.addListener(request => {
      if (request.kind !== "input") return;
      input = request.input;
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
        init: true,
        text: text,
        cain: cain,
        input: input,
      });
    });

    p.onMessage.addListener(request => {
      switch (request.kind) {
        case "updatePopup":
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
        default:
          return;
      }
      postSearchProcess();
    });
  };
})());

const sleeping = (() => {
  return async work => {
    if (work) {
      const port = chrome.runtime.connect();
      return new Promise(resolve => {
        port.onMessage.addListener(response => {
          if (response.sleep == null) return;
          resolve();
        });
        port.postMessage({ sleep: true });
      });
    } else {
      await sleep(0);
    }
  };
})();
