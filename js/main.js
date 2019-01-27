$(() => {
  // use async function. return value is promise.
  // it may make strange movements.
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    const port  = chrome.tabs.connect(tabs[0].id);
    port.onDisconnect.addListener(window.close);

    const texts = await getStorageValue("texts", []);
    const cain  = await getStorageValue("cain", false);

    const page = (await sendMessage({kind: "page"}));
  
    main(port, texts, cain, page.input, page.text, page.cain);

    // If have searched in this page, display count.
    port.postMessage({kind: "prepare"});
  });
});

const main = (port, texts, cain, input, prevText, prevCain) => {
  let index = texts.length;

  const movePrevSearchResult = () => {
    port.postMessage({kind: "prev"});
  };

  const moveNextSearchResult = () => {
    port.postMessage({kind: "next"});
  };

  const clearSearchResult = () => {
    port.postMessage({kind: "close"});
    prevText = "";
    index = texts.length;
  };

  const getCain = () => {
    return $("#cain")[0].dataset.select === "true";
  };
  
  const setCain = (ci) => {
    $("#cain")[0].dataset.select = ci ? "true" : "false";
  };
  
  const saveCain = async (ci) => {
    await setStorageValue("cain", ci);
  };

  const backPrevHistory = () => {
    if (index <= 0) return;

    if (index < texts.length) {
      $("#search").val(texts[--index]);
    } else {
      if ($("#search").val() === "") {
        if (input === texts[index - 1]) {
          $("#search").val(texts[--index]);
        } else {
          $("#search").val(input);
        }
      } else {
        if (input === texts[index - 1]) {
          index--;
        }
        $("#search").val(texts[--index]);
      }
    }
    $("#search").select();
  };

  const forwardNextHistory = () => {
    if (index < texts.length - 1) {
      $("#search").val(texts[++index]);
    } else {
      index = texts.length;
      if ($("#search").val() !== "") {
        if ($("#search").val() === input) {
          $("#search").val("")
        } else {
          $("#search").val(input);
        }
      }
    }
    $("#search").select();
  };

  const saveHistory = async (text) => {
    // If it is a same as last search text, don't save.
    if (texts[texts.length - 1] !== text) {
      texts.push(text);
      while (texts.length > 1000) texts.shift();
      await setStorageValue("texts", texts);
    }
  };
  
  port.onMessage.addListener((()=> {
    // Only here can change the state of COUNT, PREV, NEXT element.
    // Trigger for change should not be a popup script.
    const modifyCount = (index, count) => {
      if (index === 0) {
        $("#count").text(count);
      } else {
        $("#count").text(index + " / " + count);
      }
    };

    const changeButtonStatus = (enabled) => {
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

        const text = $("#search").val();
        if (text === "") {
          clearSearchResult();
          return;
        }

        const cain = getCain();

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

        await saveHistory(text);
        index = texts.length;

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

  $("#search").on("keyup", _ => {
    if (index !== texts.length || $("#search").val() === "") {
      return;
    }
    input = $("#search").val();
    sendMessage({
      kind: "change",
      input: input,
    });
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
    const ci = !getCain();
    setCain(ci);
    await saveCain(ci);
  });

  $("#cain").on("click", async (e) => {
    e.preventDefault();
    const ci = !getCain();
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

  setCain(cain);

  if (input === "" || input === texts[texts.length - 1]) {
    input = texts[--index];
    $("#search").val(input);
  } else {
    $("#search").val(input);
  }
  $("#search").focus();
};

const sendMessage = async (params) => {
  const promise = new Promise(resolve => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, params, (response) => {
        resolve(response);
      });
    });
  });
  return promise;
};
