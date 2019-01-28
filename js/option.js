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

    const mc = svg.find("rect:eq(0)").attr("fill");
    const fc = svg.find("rect:eq(1)").attr("fill");
    
    await setStorageValue("markerColor", mc);
    await setStorageValue("focusedMarkerColor", fc);

    chrome.runtime.sendMessage({
      mc: mc,
      fc: fc,
    }, () => {});
  });
});
