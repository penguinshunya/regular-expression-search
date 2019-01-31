$(async () => {
  const markerColor = await getStorageValue("markerColor", "yellow");
  const focusedMarkerColor = await getStorageValue("focusedMarkerColor", "orange");
  const instant = await getStorageValue("instant", true);
  const shuffle = await getStorageValue("shuffle", false);
  const ignoreBlank = await getStorageValue("ignoreBlank", true);

  check("instant", instant);
  check("shuffle", shuffle);
  check("ignoreBlank", ignoreBlank);

  $("#color svg").each((_, e) => {
    const mc = $(e).find("rect:eq(0)").attr("fill");
    const fc = $(e).find("rect:eq(1)").attr("fill");
    if (mc === markerColor && fc === focusedMarkerColor) {
      $(e).addClass("selected");
    }
  });

  $("input[name=instant]").change(async function () {
    const instant = $(this).val() === "on";
    await setStorageValue("instant", instant);
    chrome.runtime.sendMessage({
      instant: instant,
    });
  });

  $("input[name=shuffle]").change(async function () {
    const shuffle = $(this).val() === "on";
    await setStorageValue("shuffle", shuffle);
    chrome.runtime.sendMessage({
      shuffle: shuffle,
    });
  });

  $("input[name=ignoreBlank]").change(async function () {
    const ignoreBlank = $(this).val() === "on";
    await setStorageValue("ignoreBlank", ignoreBlank);
    chrome.runtime.sendMessage({
      ignoreBlank: ignoreBlank,
    });
  });

  $("#color svg").click(async function () {
    const svg = $(this);

    $("#color svg").each((_, e) => $(e).removeClass("selected"));
    svg.addClass("selected");

    const mc = svg.find("rect:eq(0)").attr("fill");
    const fc = svg.find("rect:eq(1)").attr("fill");

    await setStorageValue("markerColor", mc);
    await setStorageValue("focusedMarkerColor", fc);

    chrome.runtime.sendMessage({
      mc: mc,
      fc: fc,
    }, () => { });
  });
});

const check = (name, checked) => {
  const elems = $(`input[name=${name}]`);
  elems.each((_, e) => {
    $(e).parent().removeClass("active");
  });
  let box;
  if (checked) {
    box = $(`input[name=${name}][value=on]`);
  } else {
    box = $(`input[name=${name}][value=off]`);
  }
  box.prop("checked", true);
  box.parent().addClass("active");
};
