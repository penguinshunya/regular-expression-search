$(() => {
  let port;
  let PREV_TEXT = "";
  let PREV_FLAGI = null;
  let TEXTS;
  let INDEX;

  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    port = chrome.tabs.connect(tabs[0].id);
    
    port.onMessage.addListener(response => {
      if (!response.search) {
        if (response.process) {
          // Searching in progress, but stop searching.
          modifyCount(response.index, response.count);
          $("#prev").prop("disabled", false);
          $("#next").prop("disabled", false);
        } else {
          // Do nothing.
          $("#count").text("");
          $("#prev").prop("disabled", true);
          $("#next").prop("disabled", true);
        }
      } else {
        if (response.process) {
          // Searching in progress.
          modifyCount(response.index, response.count);
          $("#prev").prop("disabled", false);
          $("#next").prop("disabled", false);
          port.postMessage({kind: "process"});
        } else {
          // Finish searching.
          modifyCount(response.index, response.count);
          PREV_TEXT = response.text;
          PREV_FLAGI = response.flagI;
        }
      }
    });

    // When the page is changes, don't use old port object.
    port.onDisconnect.addListener(event => {
      window.close();
    });

    // If have searched in this page, display count.
    port.postMessage({kind: "prepare"});
  });

  chrome.storage.local.get({texts: []}, (result) => {
    TEXTS = result.texts;
    INDEX = result.texts.length - 1;
    if (INDEX >= 0) {
      $("#search").val(TEXTS[INDEX]);
    }
    $("#search").focus();
  });

  chrome.storage.local.get({flagI: false}, (result) => {
    setFlagI(result.flagI);
  });

  $("#search").focus(function() {
    $(this).select();
  });

  $("#search").on("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (INDEX > 0) {
          $("#search").val(TEXTS[--INDEX]);
          $("#search").select();
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (INDEX < TEXTS.length - 1) {
          $("#search").val(TEXTS[++INDEX]);
          $("#search").select();
        } else {
          INDEX = TEXTS.length;
          $("#search").val("");
        }
        break;

      case "Enter":
        e.preventDefault();

        let text = $("#search").val();
        if (text === "") {
          clearSearchResult();
          return;
        }

        let flagI = getFlagI();

        if (e.shiftKey && text === PREV_TEXT && flagI === PREV_FLAGI) {
          movePrevSearchResult();
          break;
        }
        
        if (!e.ctrlKey && text === PREV_TEXT && flagI === PREV_FLAGI) {
          moveNextSearchResult();
          return;
        }

        try {
          new RegExp(text);
        } catch (e) {
          $("#search").select();
          return;
        }

        if (e.ctrlKey) {
          clearSearchResult();
        }

        // Save a search text.
        // If it is a same as last search text, don't save.
        if (TEXTS[TEXTS.length - 1] !== text) {
          TEXTS.push(text);
          while (TEXTS.length > 1000) TEXTS.shift();
          chrome.storage.local.set({texts: TEXTS}, () => {});
        }
        INDEX = TEXTS.length - 1;

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
    clearSearchResult();
    window.close();
  });

  $("#close").on("click", (e) => {
    e.preventDefault();
    clearSearchResult();
    window.close();
  });

  let movePrevSearchResult = () => {
    port.postMessage({kind: "prev"});
  };

  let moveNextSearchResult = () => {
    port.postMessage({kind: "next"});
  };

  let clearSearchResult = () => {
    port.postMessage({kind: "close"});
    PREV_TEXT = "";
    INDEX = TEXTS.length;
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

  let modifyCount = (index, count) => {
    if (count === 0) {
      $("#count").text(0);
    } else {
      $("#count").text(index + " / " + count);
    }
  };
});
