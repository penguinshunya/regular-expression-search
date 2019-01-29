const Marker = function() {
  this._marks = [];
  this._rects = [];
  this._count = 0;
  this._prevx = -1;
  this._index = -1;
};

Marker.canvas = $("<canvas>").css({
  zIndex: 65536,
  position: "fixed",
  margin: 0,
  padding: 0,
  top: 0,
  right: 0,
}).appendTo("body")[0];
Marker.context = Marker.canvas.getContext("2d");

{
  let markerColor = "yellow";
  let focusedMarkerColor = "orange";
  let nextMarkerColor = markerColor;
  let nextFocusedMarkerColor = focusedMarkerColor;

  const makeMark = (() => {
    const origin = $("<mark>").attr("tabindex", "-1").css({
      margin: 0,
      border: "none",
      padding: 0,
    });

    const clickMark = function(m) {
      return function() {
        m._prevx = m._index;
        m._index = $(this).data("index");
        m.focus();
      };
    };
  
    return (m, node, index) => {
      const mark = origin.clone();
      mark.data("index", index);
      mark.on("click", clickMark(m));
      mark.css({
        backgroundColor: markerColor,
        color: blackOrWhite(markerColor),
      });
      return $(node).wrap(mark).parent();
    };
  })();

  const getIndexFromY = (m, y) => {
    const t = y / Marker.canvas.height;

    for (let i = 0; i < m._count; i++) {
      const top = m._rects[i].top;
      const height = m._rects[i].height / Marker.canvas.height;

      if (t >= top && t <= top + height) {
        return i;
      }
    }
    return -1;
  };

  Marker.setMarkerColor = (mc, immediate = false) => {
    if (immediate) {
      markerColor = mc;
      nextMarkerColor = mc;
    } else {
      nextMarkerColor = mc;
    }
  };

  Marker.setFocusedMarkerColor = (fc, immediate = false) => {
    if (immediate) {
      focusedMarkerColor = fc;
      nextFocusedMarkerColor = fc;
    } else {
      nextFocusedMarkerColor = fc;
    }
  };

  Marker.prototype.index = function() {
    return this._index;
  };

  Marker.prototype.count = function() {
    return this._count;
  };

  Marker.prototype.focusMark = function() {
    if (this._prevx < 0) this._prevx = this._index;

    this._marks[this._prevx].forEach(mark => mark.css({
      backgroundColor: markerColor,
      color: blackOrWhite(markerColor),
    }));
    this._marks[this._index].forEach(mark => mark.css({
      backgroundColor: focusedMarkerColor,
      color: blackOrWhite(focusedMarkerColor),
    }));

    this._marks[this._index][0].focus();
  };

  Marker.prototype.redraw = function() {
    Marker.context.clearRect(0, 0, Marker.canvas.width, Marker.canvas.height);

    Marker.canvas.width = 16;
    Marker.canvas.height = window.innerHeight;
    
    for (let i = 0; i < this._count; i++) {
      const top = this._rects[i].top;
      const height = this._rects[i].height;
      Marker.context.rect(0, top * Marker.canvas.height, 16, height);
    }
    Marker.context.fillStyle = markerColor;
    Marker.context.fill();

    if (this._count > 0 && this._index !== -1) {
      const top = this._rects[this._index].top;
      const height = this._rects[this._index].height;

      Marker.context.fillStyle = focusedMarkerColor;
      Marker.context.fillRect(0, top * Marker.canvas.height, 16, height);
    }
  };

  Marker.prototype.focus = function() {
    this.focusMark();
    this.redraw();
  };

  Marker.prototype.focusPrev = function() {
    if (this._count === 0) return;

    this._prevx = this._index;
    this._index = this._index <= 0 ? this._count - 1 : this._index - 1;
    this.focus();
  };

  Marker.prototype.focusNext = function() {
    if (this._count === 0) return;
    
    this._prevx = this._index;
    this._index = this._index < 0 ? 0 : (this._index + 1) % this._count;
    this.focus();
  };

  Marker.prototype.select = function(y) {
    const i = getIndexFromY(this, y);
    if (i >= 0) {
      this._prevx = this._index;
      this._index = i;
      this.focus();
    }
  };

  Marker.prototype.changeCursor = function(y) {
    if (getIndexFromY(this, y) >= 0) {
      $(Marker.canvas).css("cursor", "pointer");
    } else {
      $(Marker.canvas).css("cursor", "default");
    }
  };

  Marker.prototype.generate = function*(texts, rects) {
    const btop = document.body.getBoundingClientRect().top;
    const docHeight = $(document).height();
    const winHeight = window.innerHeight;

    for (let i = 0; i < texts.length; i++) {
      const top = (rects[i].top - btop) / (docHeight - rects[i].height);
      const height = rects[i].height / docHeight * winHeight;

      this._marks.push(texts[i].map(node => makeMark(this, node, i)));
      this._rects.push({top: top, height: height < 3 ? 3 : height});
      this._count++;
      yield;
    }
  };
  
  Marker.prototype.clear = function() {
    this._marks.forEach(mark => {
      mark.forEach(m => {
        const par = m.contents().unwrap().parent()[0];
        // In dynamic page, element may not exist.
        if (par) par.normalize();
      });
    });
    this._marks = [];
    this._rects = [];
    this._count = 0;
    this._prevx = -1;
    this._index = -1;
    markerColor = nextMarkerColor;
    focusedMarkerColor = nextFocusedMarkerColor;
    this.redraw();
  };
}
