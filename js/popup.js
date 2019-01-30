$(() => {
  // use async function. return value is promise.
  // it may make strange movements.
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    const port  = chrome.tabs.connect(tabs[0].id);
    port.onDisconnect.addListener(window.close.bind(window));

    (async () => {
      const texts = await getStorageValue("texts", []);
      const cain  = await getStorageValue("cain", false);

      main(port, texts, cain);

      // If have searched in this page, display count.
      port.postMessage({kind: "init"});
    })();
  });
});

const main = (port, texts, cain) => {
  let history;
  let index;
  let prevText;
  let prevCain;

  const spinner = "spinner-border spinner-border-sm";

  const Status = {
    Empty: 1,
    Invalid: 2,
    Same: 3,
    Valid: 4,
  };

  const verify = () => {
    const text = $("#search").val();
    if (text === "") {
      return { status: Status.Empty };
    }

    const cain = getCain();

    if (text === prevText && cain === prevCain) {
      return { status: Status.Same, text: text, cain: cain };
    }

    try {
      new RegExp(text);
    } catch (e) {
      return { status: Status.Invalid };
    }

    return { status: Status.Valid, text: text, cain: cain };
  };

  const movePrevSearchResult = () => {
    port.postMessage({kind: "prev"});
  };

  const moveNextSearchResult = () => {
    port.postMessage({kind: "next"});
  };

  const clearSearchResult = () => {
    port.postMessage({kind: "close"});
    prevText = "";
  };

  const getCain = () => {
    return $("#cain")[0].dataset.select === "true";
  };

  const setCain = ci => {
    $("#cain")[0].dataset.select = ci ? "true" : "false";
  };

  const saveCain = async ci => {
    await setStorageValue("cain", ci);
  };

  const backPrevHistory = () => {
    if (index > 0) {
      $("#search").val(history[--index]);
    }
    $("#search").select();
  };

  const forwardNextHistory = () => {
    if (index < history.length - 1) {
      $("#search").val(history[++index]);
    }
    $("#search").select();
  };

  const saveHistory = async text => {
    // If it is a same as last search text, don't save.
    if (texts[texts.length - 1] !== text) {
      texts.push(text);
      while (texts.length > 1000) texts.shift();
      await setStorageValue("texts", texts);
    }
  };

  const initTempHistory = text => {
    history = texts.map(t => t);
    if (text != null && history.length > 0 && history[history.length - 1] !== text) {
      history.push(text);
    }
    if (history.length === 0) {
      index = 0;
    } else {
      index = history.length - 1;
    }
    if (text !== "") {
      history.push("");
    }
  };

  const saveTempHistory = () => {
    history[index] = $("#search").val();
    if (history[index] !== "" && index === history.length - 1) {
      history.push("");
    }
  };

  const searchWithoutSaving = () => {
    const r = verify();

    if (r.status === Status.Empty) {
      clearSearchResult();
      return;
    } else if (r.status === Status.Same) {
      return;
    } else if (r.status === Status.Invalid) {
      return;
    }

    prevText = r.text;
    prevCain = r.cain;

    port.postMessage({
      kind: "new",
      text: r.text,
      cain: r.cain,
    });
  };

  port.onMessage.addListener((() => {
    const modifyCount = (index, count) => {
      if (index === 0) {
        $("#count").text(count);
      } else {
        $("#count").text(`${index} / ${count}`);
      }
    };

    const changeButtonStatus = enabled => {
      $("#prev").prop("disabled", !enabled);
      $("#next").prop("disabled", !enabled);
    };

    return response => {
      switch (response.process) {
        case Process.DoNothing:
          $("#count").text("");
          $("#count").removeClass(spinner);
          changeButtonStatus(false);
          break;
        case Process.Searching:
          $("#count").text("");
          $("#count").addClass(spinner);
          break;
        case Process.Marking:
          $("#count").removeClass(spinner);
          modifyCount(response.index, response.count);
          changeButtonStatus(true);
          break;
        case Process.Finish:
          $("#count").removeClass(spinner);
          modifyCount(response.index, response.count);
          prevText = response.text;
          prevCain = response.cain;
          break;
        default:
          prevText = response.text == null ? "" : response.text;
          prevCain = response.cain == null ? cain : response.cain;

          initTempHistory(response.text);
          $("#search").val(history[index]);
          $("#search").focus();
          setCain(prevCain);
          searchWithoutSaving();
          port.postMessage({kind: "prepare"});
      }
    };
  })());

  $("#search").focus(function() {
    $(this).select();
  });

  $("#search").on("keydown", e => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        backPrevHistory();
        break;
      case "ArrowDown":
        e.preventDefault();
        forwardNextHistory();
        break;
    }
  });

  $("#search").on("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const r = verify();

    if (r.status === Status.Empty) {
      clearSearchResult();
      return;
    } else if (r.status === Status.Invalid) {
      $("#search").select();
      return;
    }

    if (!e.ctrlKey) {
      if (e.shiftKey) {
        movePrevSearchResult();
      } else {
        moveNextSearchResult();
      }
      (async () => {
        await saveHistory(r.text);
      })();
      return;
    }

    (async () => {
      await saveHistory(r.text);

      prevText = r.text;
      prevCain = r.cain;

      port.postMessage({
        kind: "new",
        text: r.text,
        cain: r.cain,
      });
    })();
  });

  $("#search").on("keyup", e => {
    if (e.key === "Enter") return;
    e.preventDefault();
    saveTempHistory();
    searchWithoutSaving();
  });

  $("#cain").on("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const ci = !getCain();
    setCain(ci);
    saveCain(ci);
    searchWithoutSaving();
  });

  $("#cain").on("click", e => {
    e.preventDefault();
    const ci = !getCain();
    setCain(ci);
    saveCain(ci);
    searchWithoutSaving();
  });

  $("#prev").on("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    movePrevSearchResult();
  });

  $("#prev").on("click", e => {
    e.preventDefault();
    movePrevSearchResult();
  });

  $("#next").on("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    moveNextSearchResult();
  });

  $("#next").on("click", e => {
    e.preventDefault();
    moveNextSearchResult();
  });

  $("#close").on("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    clearSearchResult();
    window.close();
  });

  $("#close").on("click", e => {
    e.preventDefault();
    clearSearchResult();
    window.close();
  });
};
