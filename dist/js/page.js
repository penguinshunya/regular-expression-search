chrome.runtime.onConnect.addListener((() => {
  // The smaller the FPS, the quicker the search ends but the page gets stiff.
  let FPS = 60;
  let port = null;

  let mc = MARKER_COLOR;
  let fc = FOCUSED_MARKER_COLOR;
  let nmc = mc;
  let nfc = fc;
  let ignoreBlank = IGNORE_BLANK;
  let background = BACKGROUND;

  const idle = 0;
  const procs = {
    [idle]: {
      status: Process.DoNothing,
      marker: new Marker(),
      text: null,
      cain: null,
    }
  };
  let maxpid = 1;
  let current = idle;

  // popup information
  let input = null;

  // If return value is true, there is a possibility that
  // another process may have intervened in the middle.
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

  const postProcessStatus = (pid = idle) => {
    const p = procs[pid];
    postMessage(port, {
      process: p.status,
      text: p.text,
      cain: p.cain,
      index: p.marker.index() + 1,
      count: p.marker.count(),
    });
  };

  // It is possible to stop search by updating current variable.
  const search = async pid => {
    const proc = procs[pid];
    const marker = proc.marker;

    marker.init(mc, fc);

    proc.status = Process.Searching;
    postProcessStatus(pid);
    for (const [i, t] of SearchAndSplit(proc.text, proc.cain, ignoreBlank)) {
      marker.add(new Mark(i, t));
      if (await wait()) {
        if (proc.status !== Process.Searching) return;
      }
    }

    proc.status = Process.Calculating;
    postProcessStatus(pid);
    for (var _ of marker.calc()) {
      if (await wait()) {
        if (proc.status !== Process.Calculating) return;
      }
    }

    proc.status = Process.Marking;
    postProcessStatus(pid);
    let cnt = 0;
    for (var _ of marker.wrap()) {
      if (await wait()) {
        if (proc.status !== Process.Marking) return;
        if ((cnt = ++cnt % 15) === 0) marker.redraw();
      }
    }
    marker.redraw();

    proc.status = Process.Finish;
    postProcessStatus(pid);
  };

  // from background page
  chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    switch (request.key) {
      case "markerColor":
        nmc = request.value;
        break;
      case "focusedMarkerColor":
        nfc = request.value;
        break;
      case "instant":
        postMessage(port, { instant: request.value });
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
    procs[idle].marker.init(mc, fc);

    nmc = await getStorageValue("markerColor", MARKER_COLOR);
    nfc = await getStorageValue("focusedMarkerColor", FOCUSED_MARKER_COLOR);
    ignoreBlank = await getStorageValue("ignoreBlank", IGNORE_BLANK);
    background = await getStorageValue("background", BACKGROUND);

    while (true) {
      await sleep(1000 / 30);

      // Clear mark elements.
      if (current === idle) {
        procs[idle].status = Process.Clearing;
        postProcessStatus();
      }
      for (const pid in procs) {
        if (pid == idle) continue;
        if (procs[pid].status !== Process.Clearing) {
          continue;
        }
        for (var _ of procs[pid].marker.clear()) {
          await wait();
        }
        procs[pid].status = Process.Zombie;
      }
      if (current === idle) {
        procs[idle].status = Process.DoNothing;
        postProcessStatus();
      }

      // Normalize text and destroy zombie process.
      for (const pid in procs) {
        if (pid == idle) continue;
        if (procs[pid].status !== Process.Zombie) {
          continue;
        }
        const s = procs[current].status;
        if (s !== Process.DoNothing && s !== Process.Finish) {
          continue;
        }
        let destroy = true;
        for (var _ of procs[pid].marker.destroy()) {
          if (!await wait()) continue;
          const s = procs[current].status;
          if (s !== Process.DoNothing && s !== Process.Finish) {
            destroy = false;
            break;
          }
        }
        if (destroy) {
          delete procs[pid];
        }
      }
    }
  })();

  return p => {
    p.onDisconnect.addListener(() => {
      saveHistory(procs[current].text);
    });

    p.onMessage.addListener(request => {
      if (request.kind !== "input") return;
      input = request.input;
    });

    p.onMessage.addListener(request => {
      if (request.kind !== "init") return;

      port = p;
      postMessage(port, {
        init: true,
        text: procs[current].text,
        cain: procs[current].cain,
        input: input,
      });
    });

    p.onMessage.addListener(async request => {
      if (request.kind !== "new") return;

      mc = nmc;
      fc = nfc;

      procs[current].status = Process.Clearing;

      current = maxpid++;

      procs[current] = {
        status: Process.DoNothing,
        marker: new Marker(),
        text: request.text,
        cain: request.cain,
      };

      await search(current);
    });

    p.onMessage.addListener(request => {
      if (request.kind !== "close") return;

      procs[current].status = Process.Clearing;
      current = idle;
    });

    p.onMessage.addListener(request => {
      switch (request.kind) {
        case "updatePopup":
          break;
        case "prev":
          procs[current].marker.focusPrev();
          break;
        case "next":
          procs[current].marker.focusNext();
          break;
        default:
          return;
      }
      postProcessStatus(current);
    });
  };
})());
