import "webpack-jquery-ui";
import "webpack-jquery-ui/css";
import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./js/localize";
import { getStorageValue, setStorageValue, makeSVG } from "./js/function";
import {
  MARKER_COLOR,
  FOCUSED_MARKER_COLOR,
  INSTANT,
  IGNORE_BLANK,
  BACKGROUND,
} from "./js/define";
import "./css/option.sass";

$(async () => {
  const colors = [
    [MARKER_COLOR, FOCUSED_MARKER_COLOR],
    ["#eec900", "#534aa0"],
    ["#5bafc4", "#ffa787"],
    ["#85ce9e", "#d98ea5"],
    ["#9091c3", "#f2d96e"],
    ["#b088b5", "#c7d36d"],
    ["#d98ea5", "#85ce9e"],
    ["#53665a", "#ad2e6c"],
  ];

  colors.forEach(([mc, fc]) => {
    $("#color").append(makeColorBox(mc, fc));
  });

  const markerColor = await getStorageValue("markerColor", MARKER_COLOR);
  const focusedMarkerColor = await getStorageValue(
    "focusedMarkerColor",
    FOCUSED_MARKER_COLOR,
  );
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

  $("#instant button").click(function () {
    $(this).addClass("active").siblings().removeClass("active");
    setStorageValue("instant", $(this).text() === "On");
  });

  $("#ignoreBlank button").click(function () {
    $(this).addClass("active").siblings().removeClass("active");
    setStorageValue("ignoreBlank", $(this).text() === "On");
  });

  $("#background button").click(function () {
    $(this).addClass("active").siblings().removeClass("active");
    setStorageValue("background", $(this).text() === "On");
  });

  $("#color svg").click(function () {
    $("#color svg").each((_, e) => {
      $(e).removeClass("selected");
    });
    $(this).addClass("selected");
    const mc = $(this).find("rect:eq(0)").attr("fill");
    const fc = $(this).find("rect:eq(1)").attr("fill");
    setStorageValue("markerColor", mc);
    setStorageValue("focusedMarkerColor", fc);
  });
});

function check(name: string, checked: boolean) {
  if (checked) {
    $(`#${name} button:contains(On)`).addClass("active");
  } else {
    $(`#${name} button:contains(Off)`).addClass("active");
  }
}

function makeColorBox(mc: string, fc: string) {
  const svg = makeSVG("svg", { width: "40", height: "40" });
  const mce = makeSVG("rect", {
    x: "0",
    y: "0",
    rx: "5",
    ry: "5",
    width: "32",
    height: "32",
    fill: mc,
  });
  const fce = makeSVG("rect", {
    x: "8",
    y: "8",
    rx: "5",
    ry: "5",
    width: "32",
    height: "32",
    fill: fc,
  });
  svg.appendChild(mce);
  svg.appendChild(fce);
  return svg;
}
