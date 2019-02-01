$(async () => {
  const markerColor = await getStorageValue("markerColor", MARKER_COLOR);
  const focusedMarkerColor = await getStorageValue("focusedMarkerColor", FOCUSED_MARKER_COLOR);
  const instant = await getStorageValue("instant", INSTANT);
  const ignoreBlank = await getStorageValue("ignoreBlank", IGNORE_BLANK);
  const background = await getStorageValue("background", BACKGROUND);

  check("instant", instant);
  check("ignoreBlank", ignoreBlank);
  check("background", background);

  $("#color svg").each((_, e) => {
    const mc = $(e).find("rect:eq(0)").attr("fill");
    const fc = $(e).find("rect:eq(1)").attr("fill");
    if (mc === markerColor && fc === focusedMarkerColor) {
      $(e).addClass("selected");
    }
  });

  $("input[type=radio]").change(function () {
    const key = $(this).attr("name");
    const checked = $(this).val() === "on";
    sendToRuntime({ key: key, value: checked });
    setStorageValue(key, checked);
  });

  $("#color svg").click(function () {
    $("#color svg").each((_, e) => $(e).removeClass("selected"));
    $(this).addClass("selected");
    const mc = $(this).find("rect:eq(0)").attr("fill");
    const fc = $(this).find("rect:eq(1)").attr("fill");
    sendToRuntime({ key: "markerColor", value: mc });
    sendToRuntime({ key: "focusedMarkerColor", value: fc });
    setStorageValue("markerColor", mc);
    setStorageValue("focusedMarkerColor", fc);
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
