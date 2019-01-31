$(async () => {
  const markerColor = await getStorageValue("markerColor", "yellow");
  const focusedMarkerColor = await getStorageValue("focusedMarkerColor", "orange");
  const instant = await getStorageValue("instant", true);
  const shuffle = await getStorageValue("shuffle", false);
  const ignoreBlank = await getStorageValue("ignoreBlank", true);
  const background = await getStorageValue("background", true);

  check("instant", instant);
  check("shuffle", shuffle);
  check("ignoreBlank", ignoreBlank);
  check("background", background);

  $("#color svg").each((_, e) => {
    const mc = $(e).find("rect:eq(0)").attr("fill");
    const fc = $(e).find("rect:eq(1)").attr("fill");
    if (mc === markerColor && fc === focusedMarkerColor) {
      $(e).addClass("selected");
    }
  });

  $("input[name=instant]").change(function () {
    const instant = $(this).val() === "on";
    sendToRuntime({ instant: instant });
    setStorageValue("instant", instant);
  });

  $("input[name=shuffle]").change(function () {
    const shuffle = $(this).val() === "on";
    sendToRuntime({ shuffle: shuffle });
    setStorageValue("shuffle", shuffle);
  });

  $("input[name=ignoreBlank]").change(function () {
    const ignoreBlank = $(this).val() === "on";
    sendToRuntime({ ignoreBlank: ignoreBlank });
    setStorageValue("ignoreBlank", ignoreBlank);
  });

  $("input[name=background]").change(function () {
    const background = $(this).val() === "on";
    sendToRuntime({ background: background });
    setStorageValue("background", background);
  });

  $("#color svg").click(function () {
    $("#color svg").each((_, e) => $(e).removeClass("selected"));
    $(this).addClass("selected");
    const mc = $(this).find("rect:eq(0)").attr("fill");
    const fc = $(this).find("rect:eq(1)").attr("fill");
    sendToRuntime({ mc: mc, fc: fc });
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
