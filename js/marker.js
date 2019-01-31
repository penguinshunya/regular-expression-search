const Mark = function () {
  this.nodes;
  this.rect;
  this.top;
  this.height;
  this.rtop;
  this.rheight;
  this.prev;
  this.next;
  this.index;
  this.visible = false;
};

const Marker = function () {
  this._marks = new RankTreap();
  this._curr = null;
  this._prev = null;
};

Marker.canvas = $("<canvas>").css({
  zIndex: 65536,
  position: "fixed",
  margin: 0,
  padding: 0,
  top: 0,
  right: 0,
}).appendTo("body")[0];
Marker.canvas.width = 0;
Marker.canvas.height = 0;
Marker.context = Marker.canvas.getContext("2d");

{
  let markerColor = "yellow";
  let focusedMarkerColor = "orange";
  let nextMarkerColor = markerColor;
  let nextFocusedMarkerColor = focusedMarkerColor;

  const wrapMark = (() => {
    const origin = $("<mark>").attr("tabindex", "-1").css({
      margin: 0,
      border: "none",
      padding: 0,
    });

    const clickMark = function (m) {
      return function () {
        m._prev = m._curr;
        m._curr = $(this).data("mark");
        m.focus();
      };
    };

    return (m, node, mrk) => {
      const mark = origin.clone();
      mark.data("mark", mrk);
      mark.on("click", clickMark(m));
      mark.css({
        backgroundColor: markerColor,
        color: blackOrWhite(markerColor),
      });
      return $(node).wrap(mark).parent();
    };
  })();

  const getMarkFromY = (m, y) => {
    const t = y / Marker.canvas.height;

    for (const mark of m._marks) {
      const top = mark.rtop;
      const height = mark.rheight / Marker.canvas.height;

      if (mark.visible && t >= top && t <= top + height) {
        return mark;
      }
    }
    return null;
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

  Marker.prototype.index = function () {
    return this._curr == null ? -1 : this._curr.index;
  };

  Marker.prototype.focusMark = function () {
    if (this._prev === null) this._prev = this._curr;

    this._prev.nodes.forEach(mark => mark.css({
      backgroundColor: markerColor,
      color: blackOrWhite(markerColor),
    }));
    this._curr.nodes.forEach(mark => mark.css({
      backgroundColor: focusedMarkerColor,
      color: blackOrWhite(focusedMarkerColor),
    }));

    this._curr.nodes[0].focus();
  };

  Marker.prototype.redraw = function () {
    if (this._marks.count() === 0) {
      Marker.canvas.width = 0;
      Marker.canvas.height = 0;
      return;
    }

    Marker.context.clearRect(0, 0, Marker.canvas.width, Marker.canvas.height);

    Marker.canvas.width = 16;
    Marker.canvas.height = window.innerHeight;

    for (const m of this._marks) {
      if (m.visible) {
        Marker.context.rect(0, m.rtop * Marker.canvas.height, 16, m.rheight);
      }
    }
    Marker.context.fillStyle = markerColor;
    Marker.context.fill();

    if (this._curr !== null) {
      const m = this._curr;
      Marker.context.fillStyle = focusedMarkerColor;
      Marker.context.fillRect(0, m.rtop * Marker.canvas.height, 16, m.rheight);
    }
  };

  Marker.prototype.focus = function () {
    this.focusMark();
    this.redraw();
  };

  Marker.prototype.focusPrev = function () {
    if (this._marks.count() === 0) returnn;

    if (this._curr == null) {
      this._curr = this._marks.search(0);
    } else {
      this._prev = this._curr;

      const i = this._marks.searchRank(this._curr.index)[1];
      this._curr = this._marks.search(i - 1 < 0 ? this._marks.count() - 1 : i - 1);
    }
    this.focus();
  };

  Marker.prototype.focusNext = function () {
    if (this._marks.count() === 0) returnn;

    if (this._curr == null) {
      this._curr = this._marks.search(0);
    } else {
      this._prev = this._curr;

      const i = this._marks.searchRank(this._curr.index)[1];
      this._curr = this._marks.search(i + 1 >= this._marks.count() ? 0 : i + 1);
    }
    this.focus();
  };

  Marker.prototype.select = function (y) {
    const mark = getMarkFromY(this, y);
    if (mark !== null) {
      this._prev = this._curr;
      this._curr = mark;
      this.focus();
    }
  };

  Marker.prototype.changeCursor = function (y) {
    if (getMarkFromY(this, y) !== null) {
      $(Marker.canvas).css("cursor", "pointer");
    } else {
      $(Marker.canvas).css("cursor", "default");
    }
  };

  Marker.prototype.generate = function* (marks) {
    const btop = document.body.getBoundingClientRect().top;
    const docHeight = $(document).height();
    const winHeight = window.innerHeight;

    for (const m of marks) {
      const t = (m.top - btop) / (docHeight - m.height);
      const h = m.height / docHeight * winHeight;

      m.nodes = m.nodes.map(n => wrapMark(this, n, m));
      m.visible = true;
      m.rtop = t;
      m.rheight = h < 3 ? 3 : h;

      this._marks.insertRank(m.index, m);
      yield;
    }
  };

  Marker.prototype.clear = function () {
    for (const mark of this._marks) {
      mark.nodes.forEach(m => {
        const par = m.contents().unwrap().parent()[0];
        // In dynamic page, element may not exist.
        if (par) par.normalize();
      });
    }
    this._marks = new RankTreap();
    this._curr = null;
    this._prev = null;
    markerColor = nextMarkerColor;
    focusedMarkerColor = nextFocusedMarkerColor;
    this.redraw();
  };
}
