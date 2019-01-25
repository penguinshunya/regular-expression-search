$(async () => {
  const fps = await getStorageValue("fps", 60);
  const markerColor = await getStorageValue("markerColor", "yellow");
  const focusedMarkerColor = await getStorageValue("focusedMarkerColor", "orange");

  $("#fps").val(fps);

  $("#color svg").each((_, e) => {
    const mc = $(e).find("rect:eq(0)").attr("fill");
    const fc = $(e).find("rect:eq(1)").attr("fill");
    if (mc === markerColor && fc === focusedMarkerColor) {
      $(e).addClass("selected");
    }
  });

  $("#fps").change(async () => {
    const fps = +$("#fps").val();
    await setStorageValue("fps", fps);
    chrome.runtime.sendMessage({fps: fps}, () => {});
  });

  $("#color svg").on("click", async function() {
    const svg = $(this);

    $("#color svg").each((_, e) => $(e).removeClass("selected"));
    svg.addClass("selected");

    const markerColor = svg.find("rect:eq(0)").attr("fill");
    const focusedMarkerColor = svg.find("rect:eq(1)").attr("fill");
    
    await setStorageValue("markerColor", markerColor);
    await setStorageValue("focusedMarkerColor", focusedMarkerColor);

    chrome.runtime.sendMessage({
      markerColor: markerColor,
      focusedMarkerColor: focusedMarkerColor,
    }, () => {});
  });
});
