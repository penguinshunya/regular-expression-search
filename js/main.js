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

  // ストレージ上のフラグの状態をUIに反映
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
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
              kind: "prev",
              text: "dummy",
            }, (response) => {
              $("#count").text(response.index + " / " + response.count);
            });
          });
          break;
        }
        
        let text = $("#search").text();
        if (text === "") {
          clearSearchResult(() => {});
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

        // 検索履歴の保存
        // 前回検索した正規表現と同じであれば保存しない
        if (TEXTS[TEXTS.length - 1] !== text) {
          TEXTS.push(text);
          if (TEXTS.length > 1000) {
            while (TEXTS.length > 1000) TEXTS.shift();
          }
          chrome.storage.local.set({texts: TEXTS}, () => {});
        }
        INDEX = TEXTS.length - 1;

        $("#count").text("");
        $("#count").addClass("lds-dual-ring");
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            kind: "new",
            text: text,
            flag_i: flag_i,
          }, (response) => {
            PREV_TEXT = text;
            PREV_FLAGI = flag_i;
            $("#count").removeClass("lds-dual-ring");
            $("#count").text(response.index + " / " + response.count);
          });
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

  // 前の検索結果に移動
  let movePrevSearchResult = () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        kind: "prev",
        text: "dummy",
      }, (response) => {
        if (response.count > 0) {
          $("#count").text(response.index + " / " + response.count);
        }
      });
    });
  };

  // 次の検索結果に移動
  let moveNextSearchResult = () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        kind: "next",
        text: "dummy",
      }, (response) => {
        if (response.count > 0) {
          $("#count").text(response.index + " / " + response.count);
        }
      });
    });
  };

  // 検索結果の削除
  let clearSearchResult = (callback) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        kind: "close",
        text: "dummy",
      }, () => {
        $("#count").text("");
        $("#search").text("");
        INDEX = TEXTS.length;
        callback();
      });
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

let selectElementContents = (el) => {
  let range = document.createRange();
  range.selectNodeContents(el);
  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};
