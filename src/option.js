import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./option.css";

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

  $("#instant button").click(function() {
    $(this).addClass('active').siblings().removeClass('active');
    setStorageValue("instant", $(this).text() === "On");
  });

  $("#ignoreBlank button").click(function() {
    $(this).addClass('active').siblings().removeClass('active');
    setStorageValue("ignoreBlank", $(this).text() === "On");
  });

  $("#background button").click(function() {
    $(this).addClass('active').siblings().removeClass('active');
    setStorageValue("background", $(this).text() === "On");
  });

  $("#color svg").click(function () {
    $("#color svg").each((_, e) => $(e).removeClass("selected"));
    $(this).addClass("selected");
    const mc = $(this).find("rect:eq(0)").attr("fill");
    const fc = $(this).find("rect:eq(1)").attr("fill");
    setStorageValue("markerColor", mc);
    setStorageValue("focusedMarkerColor", fc);
  });
});

const check = (name, checked) => {
  if (checked) {
    $(`#${name} button:contains(On)`).addClass("active");
  } else {
    $(`#${name} button:contains(Off)`).addClass("active");
  }
};
