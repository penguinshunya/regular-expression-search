$(() => {
  // use async function. return value is promise.
  // it may make strange movements.
  chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
    const port  = chrome.tabs.connect(tabs[0].id);
    port.onDisconnect.addListener(window.close);

    const texts = await getStorageValue("texts", []);
    const cain  = await getStorageValue("cain", false);

    const page = (await sendMessage({kind: "page"}));
  
    main(port, texts, cain, page.text, page.text, page.cain);

    // If have searched in this page, display count.
    port.postMessage({kind: "prepare"});
  });
});

const main = (port, texts, cain, input, prevText, prevCain) => {
  let index = texts.length;

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
      switch (response.process) {
        case Process.DoNothing:
          $("#count").text("");
          changeButtonStatus(false);
          break;
        case Process.Searching:
          modifyCount(response.index, response.count);
          changeButtonStatus(true);
          break;
        case Process.Finish:
          modifyCount(response.index, response.count);
          prevText = response.text;
          prevCain = response.cain;
          break;
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
        index = texts.length;
      })();
      return;
    }

    (async () => {
      await saveHistory(r.text);
      index = texts.length;
  
      prevText = r.text;
      prevCain = r.cain;
  
      port.postMessage({
        kind: "new",
        text: r.text,
        cain: r.cain,
      });
    })();
  });

  $("#search").on("keyup", _ => {
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

  $("#cain").on("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const ci = !getCain();
    setCain(ci);
    saveCain(ci);
  });

  $("#cain").on("click", e => {
    e.preventDefault();
    const ci = !getCain();
    setCain(ci);
    saveCain(ci);
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

  setCain(cain);

  if (input === "" || input === texts[texts.length - 1]) {
    input = texts[--index];
    $("#search").val(input);
  } else {
    $("#search").val(input);
  }
  $("#search").focus();
};

const sendMessage = async params => {
  const promise = new Promise(resolve => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, params, (response) => {
        resolve(response);
      });
    });
  });
  return promise;
};
