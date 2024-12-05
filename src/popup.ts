import "webpack-jquery-ui";
import "webpack-jquery-ui/css";
import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "open-iconic/font/css/open-iconic-bootstrap.css";
import "./js/localize";
import {
  sleep,
  getStorageValue,
  setStorageValue,
  postMessage,
  saveHistory,
} from "./js/function";
import { Process, TEXTS, CAIN, INSTANT } from "./js/define";
import "./css/popup.sass";

$(async () => {
  $("#search").focus();
  while (true) {
    try {
      await preprocess();
      break;
    } catch (_) {}
    await sleep(1000 / 30);
  }
});

const preprocess = async () => {
  return new Promise<void>((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0].status === "loading") {
        reject();
        return;
      }
      const port = chrome.tabs.connect(tabs[0].id);
      port.onDisconnect.addListener(reject);

      const texts = await getStorageValue("texts", TEXTS);
      const cain = await getStorageValue("cain", CAIN);
      const instant = await getStorageValue("instant", INSTANT);

      main(port, texts, cain, instant);

      postMessage(port, { kind: "init" }) ? resolve() : reject();
    });
  });
};

const main = (
  port: chrome.runtime.Port,
  texts: string[],
  cain: boolean,
  instant: boolean,
) => {
  let history: string[];
  let index: number;
  let prevText: string;
  let prevCain: boolean;

  const Status = {
    Empty: 1,
    Invalid: 2,
    Same: 3,
    Valid: 4,
  };

  const verify = () => {
    const text = $("#search").val() as string;
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

  const setCain = (ci: boolean) => {
    $("#cain")[0].dataset.select = ci ? "true" : "false";
  };

  const saveCain = async (ci: boolean) => {
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

  const initTempHistory = (text: string) => {
    history = texts.map((t) => t);
    if (
      text != null &&
      history.length > 0 &&
      history[history.length - 1] !== text
    ) {
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
    history[index] = $("#search").val() as string;
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

  port.onMessage.addListener((response) => {
    if (response.init == null) return;

    prevText = response.text == null ? "" : response.text;
    prevCain = response.cain == null ? cain : response.cain;

    $("#cain").prop("disabled", false);
    $("#close").prop("disabled", false);

    initTempHistory(response.input);
    if ($("#search").val() === "") {
      $("#search").val(history[index]);
      $("#search").focus();
    }
    setCain(prevCain);
    searchWithoutSavingHistory();

    postMessage(port, { kind: "updatePopup" });
  });

  port.onMessage.addListener((response) => {
    if (response.instant == null) return;
    instant = response.instant;
  });

  port.onMessage.addListener(
    (() => {
      const searching = "spinner-grow spinner-grow-sm";
      const calculating = "spinner-border spinner-border-sm";
      const clearing = calculating;

      // Only here can change the state of COUNT, PREV, NEXT element.
      // Trigger for change should not be a popup script.
      const modifyCount = (index: number, count: number) => {
        if (index === 0) {
          $("#count").text(count);
        } else {
          $("#count").text(`${index} / ${count}`);
        }
      };

      const changeButtonStatus = (enabled: boolean) => {
        $("#prev").prop("disabled", !enabled);
        $("#next").prop("disabled", !enabled);
      };

      const removeSpinner = () => {
        $("#count").removeClass(searching);
        $("#count").removeClass(calculating);
      };

      return (response: any) => {
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
            changeButtonStatus(false);
            break;
          case Process.Calculating:
            $("#count").text("");
            removeSpinner();
            $("#count").css("color", "#aaaaaa");
            $("#count").addClass(calculating);
            changeButtonStatus(false);
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
            changeButtonStatus(true);
            break;
          case Process.Clearing:
            $("#count").text("");
            removeSpinner();
            $("#count").css("color", "#aaaaaa");
            $("#count").addClass(clearing);
            changeButtonStatus(false);
            break;
        }
      };
    })(),
  );

  $("#search").focus(function () {
    $(this).select();
  });

  $("#search").on("keydown", (e) => {
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

  $("#search").on("keydown", (e) => {
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

  $("#search").on("keyup", (e) => {
    if (e.key === "Enter") return;
    e.preventDefault();
    saveTempHistory();
    searchWithoutSavingHistory();
    postMessage(port, {
      kind: "input",
      input: $("#search").val(),
    });
  });

  $("#cain").on("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const ci = !getCain();
    setCain(ci);
    saveCain(ci);
    searchWithoutSavingHistory();
  });

  $("#cain").on("click", (e) => {
    e.preventDefault();
    const ci = !getCain();
    setCain(ci);
    saveCain(ci);
    searchWithoutSavingHistory();
  });

  $("#prev").on("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    movePrevSearchResult();
  });

  $("#prev").on("click", (e) => {
    e.preventDefault();
    movePrevSearchResult();
  });

  $("#next").on("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    moveNextSearchResult();
  });

  $("#next").on("click", (e) => {
    e.preventDefault();
    moveNextSearchResult();
  });

  $("#close").on("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    clearSearchResult();
    window.close();
  });

  $("#close").on("click", (e) => {
    e.preventDefault();
    clearSearchResult();
    window.close();
  });
};
