let Marker = (() => {
  let MARKER_COLOR = "yellow";
  let FOCUSED_MARKER_COLOR = "orange";

  let wrapper = $("<div>").css({
    zIndex: 65536,
    position: "fixed",
    margin: 0,
    padding: 0,
    top: 0,
    right: 0,
    width: 16,
    height: "calc(100% - 5px)",
  }).appendTo("body");

  return function() {
    let obj = {};

    let marks = [];
    let markers = [];
    let count = 0;
    let currIndex = -1;
  
    let $mark = $("<mark>").attr("tabindex", "-1").css({
      margin: 0,
      padding: 0,
      backgroundColor: MARKER_COLOR,
    });
  
    let $marker = $("<div>").css({
      position: "absolute",
      margin: 0,
      padding: 0,
      left: 0,
      width: "100%",
      backgroundColor: MARKER_COLOR,
      cursor: "pointer",
    });

    let makeMark = (node, index) => {
      let mark = $mark.clone(true);
      mark.data("index", index);
      return $(node).wrap(mark).parent();
    };

    let makeMarker = (elem, index) => {
      let marker = $marker.clone(true);
      let height = elem.height() / $(document).height() * window.innerHeight;
      if (height < 5) height = 5;
  
      let top = elem.offset().top / ($(document).height() - elem.height());
      marker.css("top", top * 100 + "%");
      marker.height(height);
      marker.data("index", index);
      marker.appendTo(wrapper);
  
      return marker;
    };
  
    let focus = (prevIndex, currIndex) => {
      if (count === 0) {
        return;
      }
      if (prevIndex < 0) {
        prevIndex = currIndex;
      }

      marks[prevIndex].forEach(mark => {
        mark.css("background-color", MARKER_COLOR);
      });
      marks[currIndex].forEach(mark => {
        mark.css("background-color", FOCUSED_MARKER_COLOR);
      });
    
      marks[currIndex][0].focus();
    
      markers[prevIndex].css({
        backgroundColor: MARKER_COLOR,
        zIndex: 0,
      });
      markers[currIndex].css({
        backgroundColor: FOCUSED_MARKER_COLOR,
        zIndex: 1,
      });
    };

    $mark.on("click", function() {
      let index = currIndex;
      currIndex = $(this).data("index");
      focus(index, currIndex);
    });

    $marker.on("click", function() {
      let index = currIndex;
      currIndex = $(this).data("index");
      focus(index, currIndex);
    });
    
    obj.index = () => currIndex + 1;
    obj.count = () => count;
  
    obj.add = textNodes => {
      marks.push(textNodes.map(node => makeMark(node, count)));
      markers.push(makeMarker(marks[count][0], count));
      count++;
    };

    obj.focusPrev = () => {
      if (count === 0) {
        return;
      }
      if (currIndex === -1) {
        currIndex = count - 1;
        focus(currIndex, currIndex);
        return;
      }
      let prevIndex = currIndex--;
      if (currIndex < 0) {
        currIndex = count - 1;
      }
      focus(prevIndex, currIndex);
    };

    obj.focusNext = () => {
      if (count === 0) {
        return;
      }
      if (currIndex === -1) {
        currIndex = 0;
        focus(currIndex, currIndex);
        return;
      }
      let prevIndex = currIndex++;
      if (currIndex >= count) {
        currIndex = 0;
      }
      focus(prevIndex, currIndex);
    };

    obj.clear = () => {
      marks.forEach(mark => {
        mark.forEach(m => m.contents().unwrap().parent()[0].normalize());
      });
      wrapper.empty();
      marks = [];
      markers = [];
      count = 0;
      currIndex = -1;
    };

    return obj;
  };
})();
