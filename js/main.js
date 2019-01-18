
$(() => {
  let port;
  let PREV_TEXT = "";
  let PREV_FLAGI = null;
  let TEXTS;
  let INDEX;

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    port = chrome.tabs.connect(tabs[0].id);
    
    port.onMessage.addListener(response => {
      if (response.count > 0) {
        $("#count").text(response.index + " / " + response.count);
      }
      if (response.status === "process") {
        port.postMessage({
          kind: "process",
        });
      }
    });
  });

  chrome.storage.local.get({texts: []}, (result) => {
    TEXTS = result.texts;
    INDEX = result.texts.length - 1;
    if (INDEX >= 0) {
      $("#search").text(TEXTS[INDEX]);
      selectElementContents($("#search")[0]);
    }
    $("#search").focus();
  });

  chrome.storage.local.get({flagI: false}, (result) => {
    setFlagI(result.flagI);
  });

  $("#search").on("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (INDEX > 0) {
          $("#search").text(TEXTS[--INDEX]);
          selectElementContents($("#search")[0]);
        }
        $("#count").text("");
        break;

      case "ArrowDown":
        e.preventDefault();
        if (INDEX < TEXTS.length - 1) {
          $("#search").text(TEXTS[++INDEX]);
          selectElementContents($("#search")[0]);
        } else {
          INDEX = TEXTS.length;
          $("#search").text("");
        }
        $("#count").text("");
        break;

      case "Enter":
        e.preventDefault();

        if (e.shiftKey) {
          movePrevSearchResult();
          break;
        }
        
        let text = $("#search").text();
        if (text === "") {
          clearSearchResult();
          PREV_TEXT = "";
          return;
        }

        let flagI = getFlagI();

        if (text === PREV_TEXT && flagI === PREV_FLAGI) {
          moveNextSearchResult();
          return;
        }

        try {
          new RegExp(text);
        } catch (e) {
          selectElementContents($("#search")[0]);
          return;
        }

        // Save a search text.
        // If it is a same as last search text, don't save.
        if (TEXTS[TEXTS.length - 1] !== text) {
          TEXTS.push(text);
          while (TEXTS.length > 1000) TEXTS.shift();
          chrome.storage.local.set({texts: TEXTS}, () => {});
        }
        INDEX = TEXTS.length - 1;

        PREV_TEXT = text;
        PREV_FLAGI = flagI;

        $("#count").text("");
        port.postMessage({
          kind: "new",
          text: text,
          flagI: flagI,
        });
        break;
    }
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

  $("#flag_i").on("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    let flagI = !getFlagI();
    setFlagI(flagI);
    saveFlagI(flagI);
  });

  $("#flag_i").on("click", (e) => {
    e.preventDefault();
    let flagI = !getFlagI();
    setFlagI(flagI);
    saveFlagI(flagI);
  });

  $("#close").on("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    clearSearchResult(window.close);
  });

  $("#close").on("click", (e) => {
    e.preventDefault();
    clearSearchResult(window.close);
  });

  let movePrevSearchResult = () => {
    port.postMessage({kind: "prev"});
  };

  let moveNextSearchResult = () => {
    port.postMessage({kind: "next"});
  };

  let clearSearchResult = (callback = () => {}) => {
    port.postMessage({kind: "close"});
    $("#count").text("");
    $("#search").text("");
    INDEX = TEXTS.length;
    callback();
  };

  let getFlagI = () => {
    return $("#flag_i")[0].dataset.select === "true";
  };

  let setFlagI = (flagI) => {
    $("#flag_i")[0].dataset.select = flagI ? "true" : "false";
  };

  let saveFlagI = (flagI) => {
    chrome.storage.local.set({flagI: flagI}, () => {});
  };
});

let selectElementContents = (elem) => {
  let range = document.createRange();
  range.selectNodeContents(elem);
  let selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};
