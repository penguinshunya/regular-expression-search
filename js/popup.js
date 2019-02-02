$(() => {
  // use async function. return value is promise.
  // it may make strange movements.
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const port = chrome.tabs.connect(tabs[0].id);
    port.onDisconnect.addListener(location.reload.bind(location));

    (async () => {
      const texts = await getStorageValue("texts", TEXTS);
      const cain = await getStorageValue("cain", CAIN);
      const instant = await getStorageValue("instant", INSTANT);

      main(port, texts, cain, instant);

      // If have searched in this page, display count.
      postMessage(port, { kind: "init" }) || location.reload();
    })();
  });
});

const main = (port, texts, cain, instant) => {
  let history;
  let index;
  let prevText;
  let prevCain;

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
    saveHistory(prevText);
    postMessage(port, { kind: "prev" });
  };

  const moveNextSearchResult = () => {
    saveHistory(prevText);
    postMessage(port, { kind: "next" });
  };

  const clearSearchResult = () => {
    postMessage(port, { kind: "close" });
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
    } else if (history[index] === "" && index < texts.length) {
      history[index] = texts[index];
    }
  };

  const searchWithoutSavingHistory = () => {
    if (!instant) return;

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

    postMessage(port, {
      kind: "new",
      text: r.text,
      cain: r.cain,
    });
  };

  port.onMessage.addListener(response => {
    if (response.init == null) return;

    prevText = response.text == null ? "" : response.text;
    prevCain = response.cain == null ? cain : response.cain;

    initTempHistory(response.input);
    $("#search").val(history[index]);
    $("#search").focus();
    setCain(prevCain);
    searchWithoutSavingHistory();

    postMessage(port, { kind: "updatePopup" });
  });

  port.onMessage.addListener(response => {
    if (response.instant == null) return;
    instant = request.instant;
  });

  port.onMessage.addListener((() => {
    const searching = "spinner-grow spinner-grow-sm";
    const calculating = "spinner-border spinner-border-sm";
    const clearing = calculating;

    // Only here can change the state of COUNT, PREV, NEXT element.
    // Trigger for change should not be a popup script.
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

    const removeSpinner = () => {
      $("#count").removeClass(searching);
      $("#count").removeClass(calculating);
    };

    return response => {
      switch (response.process) {
        case Process.DoNothing:
          $("#count").text("");
          removeSpinner();
          changeButtonStatus(false);
          break;
        case Process.Searching:
          $("#count").text("");
          removeSpinner();
          $("#count").css("color", "#aaaaaa");
          $("#count").addClass(searching);
          break;
        case Process.Calculating:
          $("#count").text("");
          removeSpinner();
          $("#count").css("color", "#aaaaaa");
          $("#count").addClass(calculating);
          break;
        case Process.Marking:
          removeSpinner();
          $("#count").css("color", "#aaaaaa");
          modifyCount(response.index, response.count);
          changeButtonStatus(true);
          break;
        case Process.Finish:
          removeSpinner();
          $("#count").css("color", "black");
          modifyCount(response.index, response.count);
          prevText = response.text;
          prevCain = response.cain;
          break;
        case Process.Clearing:
          $("#count").text("");
          removeSpinner();
          $("#count").css("color", "#aaaaaa");
          $("#count").addClass(clearing);
          break;
      }
    };
  })());

  $("#search").focus(function () {
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

    if (instant && !e.ctrlKey) {
      if (e.shiftKey) {
        movePrevSearchResult();
      } else {
        moveNextSearchResult();
      }
      return;
    }

    if (!instant && r.status === Status.Same) {
      if (e.shiftKey) {
        movePrevSearchResult();
        return;
      } else if (!e.ctrlKey) {
        moveNextSearchResult();
        return;
      }
    }

    // Asyncronous processing.
    saveHistory(r.text);

    prevText = r.text;
    prevCain = r.cain;

    postMessage(port, {
      kind: "new",
      text: r.text,
      cain: r.cain,
    });
  });

  $("#search").on("keyup", e => {
    if (e.key === "Enter") return;
    e.preventDefault();
    saveTempHistory();
    searchWithoutSavingHistory();
    postMessage(port, {
      kind: "input",
      input: $("#search").val(),
    });
  });

  $("#cain").on("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const ci = !getCain();
    setCain(ci);
    saveCain(ci);
    searchWithoutSavingHistory();
  });

  $("#cain").on("click", e => {
    e.preventDefault();
    const ci = !getCain();
    setCain(ci);
    saveCain(ci);
    searchWithoutSavingHistory();
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
