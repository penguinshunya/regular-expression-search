const Marker = function() {
  this._marks = [];
  this._markers = [];
  this._count = 0;
  this._index = -1;
  this._bottom = 0;
};

{
  const markerColor = "yellow";
  const focusedMarkerColor = "orange";

  const $wrapper = $("<div>").css({
    zIndex: 65536,
    position: "fixed",
    margin: 0,
    padding: 0,
    top: 0,
    right: 0,
    width: 16,
  }).appendTo("body");

  const $mark = $("<mark>").attr("tabindex", "-1").css({
    margin: 0,
    padding: 0,
    backgroundColor: markerColor,
  });

  const $marker = $("<div>").css({
    position: "absolute",
    margin: 0,
    padding: 0,
    left: 0,
    width: "100%",
    backgroundColor: markerColor,
    cursor: "pointer",
  });

  const focus = (m, prevIndex, currIndex) => {
    const marks = m._marks;
    const markers = m._markers;
  
    if (prevIndex < 0) {
      prevIndex = currIndex;
    }

    marks[prevIndex].forEach(mark => {
      mark.css("background-color", markerColor);
    });
    markers[prevIndex].css({
      backgroundColor: markerColor,
      zIndex: 0,
    });

    marks[currIndex].forEach(mark => {
      mark.css("background-color", focusedMarkerColor);
    });
    markers[currIndex].css({
      backgroundColor: focusedMarkerColor,
      zIndex: 1,
    });
    marks[currIndex][0].focus();
  };

  const clickMark = function(m) {
    return function() {
      const i = m._index;
      m._index = $(this).data("index");
      focus(m, i, m._index);
    };
  };

  const makeMark = (m, node, index) => {
    const mark = $mark.clone();
    mark.data("index", index);
    mark.on("click", clickMark(m));
    return $(node).wrap(mark).parent();
  };

  const makeMarker = (m, elem, index) => {
    const marker = $marker.clone();
    const top = elem.offset().top / ($(document).height() - elem.height());
    
    let height = elem.height() / $(document).height() * window.innerHeight;
    if (height < 5) height = 5;

    marker.css("top", `${top * 100}%`);
    marker.height(height);
    marker.data("index", index);
    marker.on("click", clickMark(m));

    const bottom = elem.offset().top + elem.height();
    if (bottom >= m._bottom) {
      m._bottom = bottom;
      $wrapper.css("height", `calc(100% - ${height}px)`);
    }

    return marker.appendTo($wrapper);
  };

  Marker.prototype.index = function() {
    return this._index;
  };

  Marker.prototype.count = function() {
    return this._count;
  };
  
  Marker.prototype.add = function(texts) {
    const count = this._count;
    this._marks.push(texts.map(node => makeMark(this, node, count)));
    this._markers.push(makeMarker(this, this._marks[count][0], count));
    this._count = count + 1;
  };

  Marker.prototype.focusPrev = function() {
    if (this._count === 0) {
      return;
    }
    let prevIndex;
    if (this._index === -1) {
      prevIndex = this._index = this._count - 1;
    } else {
      prevIndex = this._index--;
      if (this._index < 0) {
        this._index = this._count - 1;
      }
    }
    focus(this, prevIndex, this._index);
  };

  Marker.prototype.focusNext = function() {
    if (this._count === 0) {
      return;
    }
    let prevIndex;
    if (this._index === -1) {
      prevIndex = this._index = 0;
    } else {
      prevIndex = this._index++;
      if (this._index >= this._count) {
        this._index = 0;
      }
    }
    focus(this, prevIndex, this._index);
  };

  Marker.prototype.clear = function() {
    $wrapper.empty();
    this._marks.forEach(mark => {
      mark.forEach(m => m.contents().unwrap().parent()[0].normalize());
    });
    this._marks = [];
    this._markers = [];
    this._count = 0;
    this._index = -1;
    this._bottom = 0;
  };
}
