$(() => {
  let PREV_TEXT = "";
  let PREV_FLAGI = null;
  let TEXTS;
  let INDEX;

  chrome.storage.local.get({texts: []}, (result) => {
    TEXTS = result.texts;
    INDEX = result.texts.length - 1;
    if (INDEX >= 0) {
      $("#search").text(TEXTS[INDEX]);
      selectElementContents($("#search")[0]);
    }
    $("#search").focus();
  });

  chrome.storage.local.get({flag_i: false}, (result) => {
    setFlagI(result.flag_i);
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

        let flag_i = getFlagI();

        if (text === PREV_TEXT && flag_i === PREV_FLAGI) {
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
        PREV_FLAGI = flag_i;

        $("#count").text("");
        $("#count").addClass("lds-dual-ring");
        sendMessage({
          kind: "new",
          text: text,
          flag_i: flag_i,
        }, (response) => {
          $("#count").removeClass("lds-dual-ring");
          $("#count").text(response.index + " / " + response.count);
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
    let flag_i = !getFlagI();
    setFlagI(flag_i);
    saveFlagI(flag_i);
  });

  $("#flag_i").on("click", (e) => {
    e.preventDefault();
    let flag_i = !getFlagI();
    setFlagI(flag_i);
    saveFlagI(flag_i);
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
    sendMessage({
      kind: "prev",
    }, (response) => {
      if (response.count > 0) {
        $("#count").text(response.index + " / " + response.count);
      }
    });
  };

  let moveNextSearchResult = () => {
    sendMessage({
      kind: "next",
    }, (response) => {
      if (response.count > 0) {
        $("#count").text(response.index + " / " + response.count);
      }
    });
  };

  let clearSearchResult = (callback = () => {}) => {
    sendMessage({
      kind: "close",
    }, () => {
      $("#count").text("");
      $("#search").text("");
      INDEX = TEXTS.length;
      callback();
    });
  };

  let getFlagI = () => {
    return $("#flag_i")[0].dataset.select === "true";
  };

  let setFlagI = (flag_i) => {
    $("#flag_i")[0].dataset.select = flag_i ? "true" : "false";
  };

  let saveFlagI = (flag_i) => {
    chrome.storage.local.set({flag_i: flag_i}, () => {});
  };
});

let selectElementContents = (elem) => {
  let range = document.createRange();
  range.selectNodeContents(elem);
  let selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};

let sendMessage = (data, callback) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, data, callback);
  });
};
