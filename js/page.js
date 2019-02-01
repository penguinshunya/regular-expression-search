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

  let ignoreBlank = IGNORE_BLANK;
  let background = BACKGROUND;

  // popup information
  let input = null;

  const clearSearchResult = () => {
    marker.clean();
    text = "";
    cain = null;
    count = 0;
    process = Process.DoNothing;
  };

  const postSearchProcess = () => {
    postMessage(port, {
      process: process,
      text: text,
      cain: cain,
      index: marker.index() + 1,
      count: count,
    });
  };

  const wait = (() => {
    let now = new Date().getTime();
    return async () => {
      if (new Date().getTime() - now > 1000 / FPS) {
        await sleeping(background);
        now = new Date().getTime();
        return true;
      }
      return false;
    };
  })();

  const search = async sym => {
    process = Process.Searching;
    postSearchProcess();
    for (const [i, t] of Search(text, cain, ignoreBlank)) {
      const mark = new Mark();
      mark.index = i;
      mark.texts = t;
      marker.add(mark);
      if (await wait()) {
        if (current !== sym) return;
        if (process !== Process.Searching) return;
      }
    }

    process = Process.Calculating;
    postSearchProcess();
    for (const _ of marker.calc()) {
      if (await wait()) {
        if (current !== sym) return;
        if (process !== Process.Calculating) return;
      }
    }
    count = marker.count();

    process = Process.Marking;
    postSearchProcess();
    for (const _ of marker.wrap()) {
      if (await wait()) {
        marker.redraw();
        if (current !== sym) return;
        if (process !== Process.Marking) return;
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
        postMessage(port, { instant: instant });
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
    ignoreBlank = await getStorageValue("ignoreBlank", IGNORE_BLANK);
    background = await getStorageValue("background", BACKGROUND);
  })();

  return p => {
    p.onDisconnect.addListener(() => {
      saveHistory(text);
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

      current = Symbol();

      // Asynchronous search.
      search(current);
    });

    p.onMessage.addListener(request => {
      if (request.kind !== "init") return;

      port = p;
      postMessage(port, {
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
        postMessage(port, { sleep: true });
      });
    } else {
      await sleep(0);
    }
  };
})();
