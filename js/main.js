$(() => {
  // 変なバグをなくすために、完全に正しいコードを書く。
  // 例えば今のコードでは、接続が確立される前にportオブジェクトを使えることがある。
  // それは物理的にはほぼありえないとしても、論理的にはありえる。
  // そういった不安を解消するために、コードを安全なものに書き換える。
  // 具体的には、接続が確立し、検索履歴と大文字小文字の区別フラグを取得した後に
  // 各要素にイベントを付加する。
  // そうすることで、準備前にイベントが発生して思わぬことになってしまう事態を防ぐことができる。
  // というわけで、port, texts, cainの3つを引数に取るmain関数を作成する。

  // TODO: use async function. return value is promise.
  // it may make strange movements.
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    let port  = chrome.tabs.connect(tabs[0].id);
    let texts = await getStorageValue("texts", []);
    let cain  = await getStorageValue("cain", false);
    
    main(port, texts, cain);

    // If have searched in this page, display count.
    port.postMessage({kind: "prepare"});
  });
});

let main = (port, texts, cain) => {
  let index = texts.length;
  let prevText = "", prevCain = null;

  let movePrevSearchResult = () => {
    port.postMessage({kind: "prev"});
  };

  let moveNextSearchResult = () => {
    port.postMessage({kind: "next"});
  };

  let clearSearchResult = () => {
    port.postMessage({kind: "close"});
    prevText = "";
    index = texts.length;
  };

  let getCain = () => {
    return $("#cain")[0].dataset.select === "true";
  };
  
  let setCain = (ci) => {
    $("#cain")[0].dataset.select = ci ? "true" : "false";
  };
  
  let saveCain = (ci) => {
    chrome.storage.local.set({cain: ci}, () => {});
  };

  let backPrevHistory = () => {
    if (index > 0) {
      $("#search").val(texts[--index]);
      $("#search").select();
    }
  };

  let forwardNextHistory = () => {
    if (index < texts.length - 1) {
      $("#search").val(texts[++index]);
      $("#search").select();
    } else {
      index = texts.length;
      $("#search").val("");
    }
  };

  let saveHistory = (text) => {
    if (texts[texts.length - 1] !== text) {
      texts.push(text);
      while (texts.length > 1000) texts.shift();
      chrome.storage.local.set({texts: texts}, () => {});
    }
  };
  
  port.onDisconnect.addListener(window.close);
  
  port.onMessage.addListener((()=> {
    // Only here can change the state of COUNT, PREV, NEXT element.
    // Trigger for change should not be a popup script.
    let modifyCount = (index, count) => {
      if (index === 0) {
        $("#count").text(count);
      } else {
        $("#count").text(index + " / " + count);
      }
    };
    let changeButtonStatus = (enabled) => {
      $("#prev").prop("disabled", !enabled);
      $("#next").prop("disabled", !enabled);
    };

    return response => {
      if (!response.search) {
        if (response.process) {
          // Searching in progress, but stop searching.
          modifyCount(response.index, response.count);
          changeButtonStatus(true);
        } else {
          // Do nothing.
          $("#count").text("");
          changeButtonStatus(false);
        }
      } else {
        if (response.process) {
          // Searching in progress.
          modifyCount(response.index, response.count);
          changeButtonStatus(true);
        } else {
          // Finish searching.
          modifyCount(response.index, response.count);
          prevText = response.text;
          prevCain = response.cain;
        }
      }
    };
  })());

  $("#search").focus(function() {
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
      case "Enter":
        e.preventDefault();

        let text = $("#search").val();
        if (text === "") {
          clearSearchResult();
          return;
        }

        let cain = getCain();

        if (e.shiftKey && text === prevText && cain === prevCain) {
          movePrevSearchResult();
          break;
        }
        
        if (!e.ctrlKey && text === prevText && cain === prevCain) {
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
        saveHistory(text);
        index = texts.length - 1;

        prevText = text;
        prevCain = cain;

        port.postMessage({
          kind: "new",
          text: text,
          cain: cain,
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

  $("#cain").on("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    let ci = !getCain();
    setCain(ci);
    saveCain(ci);
  });

  $("#cain").on("click", (e) => {
    e.preventDefault();
    let ci = !getCain();
    setCain(ci);
    saveCain(ci);
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

  backPrevHistory();
  setCain(cain);

  $("#search").focus();
};

let getStorageValue = async (key, defaultValue) => {
  let promise = new Promise(resolve => {
    let param = {};
    param[key] = defaultValue;
    chrome.storage.local.get(param, (response) => {
      resolve(response[key]);
    });
  });
  return promise;
};
