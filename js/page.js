chrome.runtime.onConnect.addListener((() => {
  // The smaller the FPS, the quicker the search ends but the page gets stiff.
  let FPS = 60;
  let port = null;

  // search information
  let text = null;
  let cain = null;
  let marker = new Marker();

  // delete marker list
  let queue = [];

  // search process information
  let current;
  let process = Process.DoNothing;

  let ignoreBlank = IGNORE_BLANK;
  let background = BACKGROUND;

  // popup information
  let input = null;

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

  const postSearchProcess = () => {
    postMessage(port, {
      process: process,
      text: text,
      cain: cain,
      index: marker.index() + 1,
      count: marker.count(),
    });
  };

  const search = async curr => {
    process = Process.Searching;
    postSearchProcess();
    for (const [i, t] of Search(text, cain, ignoreBlank)) {
      marker.add(new Mark(i, t));
      if (await wait() && current !== curr) return;
    }

    process = Process.Calculating;
    postSearchProcess();
    for (var _ of marker.calc()) {
      if (await wait() && current !== curr) return;
    }

    process = Process.Marking;
    postSearchProcess();
    for (var _ of marker.wrap()) {
      if (await wait()) {
        marker.redraw();
        if (current !== curr) return;
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

  // from background page
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

  // Initialize and start event loop.
  (async () => {
    const mc = await getStorageValue("markerColor", MARKER_COLOR);
    const fc = await getStorageValue("focusedMarkerColor", FOCUSED_MARKER_COLOR);
    Marker.setMarkerColor(mc, true);
    Marker.setFocusedMarkerColor(fc, true);
    ignoreBlank = await getStorageValue("ignoreBlank", IGNORE_BLANK);
    background = await getStorageValue("background", BACKGROUND);

    // When deleting the search result,
    // add it to the queue without calling directly Marker.prototype.clear().
    // Leave deleting processing to this event loop.
    while (true) {
      let deleted = false;
      while (queue.length) {
        if (!deleted) {
          process = Process.Clearing;
          postSearchProcess();
          deleted = true;
        }
        for (var _ of queue[0].clear()) {
          await wait();
        }
        queue.shift();
      }
      if (deleted) {
        marker = new Marker();
        text = "";
        cain = null;
        process = Process.DoNothing;
        postSearchProcess();
      }
      await sleep(1000 / 30);
    }
  })();

  return p => {
    p.onDisconnect.addListener(() => {
      saveHistory(text);
    });

    p.onMessage.addListener(request => {
      if (request.kind !== "input") return;
      input = request.input;
    });

    p.onMessage.addListener(async request => {
      if (request.kind !== "new") return;

      // Update current variable and stop search currently being done.
      const curr = Symbol();
      current = curr;

      queue.push(marker);
      while (queue.length) {
        await wait();
        if (current !== curr) return;
      }

      text = request.text;
      cain = request.cain;

      await search(curr);
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
          // Update current variable and stop search currently being done.
          current = Symbol();
          queue.push(marker);
          return;
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
      // Creating a connection object once,
      // perhaps may lead to poor performance.
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
