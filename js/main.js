$(() => {
  // use async function. return value is promise.
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
  
  let saveCain = async (ci) => {
    await setStorageValue("cain", ci);
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

  let saveHistory = async (text) => {
    // If it is a same as last search text, don't save.
    if (texts[texts.length - 1] !== text) {
      texts.push(text);
      while (texts.length > 1000) texts.shift();
      await setStorageValue("texts", texts);
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

  $("#search").on("keydown", async (e) => {
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
          let regex = new RegExp(text);
          if (regex.test("")) {
            throw new Error("Invalid regular expression: Match empty string");
          }
        } catch (e) {
          alert(e.message);
          return;
        }

        if (e.ctrlKey) {
          clearSearchResult();
        }

        await saveHistory(text);
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

  $("#cain").on("keydown", async (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    let ci = !getCain();
    setCain(ci);
    await saveCain(ci);
  });

  $("#cain").on("click", async (e) => {
    e.preventDefault();
    let ci = !getCain();
    setCain(ci);
    await saveCain(ci);
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

let setStorageValue = async (key, value, callback = () => {}) => {
  let promise = new Promise(resolve => {
    let param = {};
    param[key] = value;
    chrome.storage.local.set(param, (response) => {
      callback(response);
      resolve();
    });
  });
  return promise;
};
