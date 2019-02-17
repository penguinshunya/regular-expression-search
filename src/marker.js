import { blackOrWhite } from "./js/function";
import { RankTreap } from "./js/rank-treap";

export const Mark = function (i, t) {
  this.texts = t;
  this.nodes = [];
  this.top;
  this.height;
  this.rtop;
  this.rheight;
  this.index = i;
};

export const Marker = function () {
  this._marks = new RankTreap();
  this._dispCount = 0;
  this._curr = null;
  this._prev = null;
  this._canvas;
  this._context;
  this._mc;
  this._fc;
  this._destroyed = 0;
};

{
  const canvases = [];

  const canvas = $("<canvas>").css({
    zIndex: 65536,
    position: "fixed",
    margin: 0,
    padding: 0,
    top: 0,
    right: 0,
  });

  const wrapWithMark = (() => {
    const org = $("<mark>").attr("tabindex", "-1").css({
      margin: 0,
      border: "none",
      padding: 0,
      font: "inherit",
    });

    const clickMark = function (m) {
      return function () {
        m._prev = m._curr;
        m._curr = $(this).data("mark");
        m._focus();
      };
    };

    return (m, node, mrk) => {
      const mark = org.clone();
      mark.data("mark", mrk);
      mark.on("click", clickMark(m));
      mark.css({
        backgroundColor: m._mc,
        color: blackOrWhite(m._mc),
      });
      return $(node).wrap(mark).parent();
    };
  })();

  const getMarkFromY = (m, y) => {
    const t = y / m._canvas.height;

    for (const mark of m._marks) {
      const top = mark.rtop;
      const height = mark.rheight / m._canvas.height;

      if (t >= top && t <= top + height) {
        return mark;
      }
    }
    return null;
  };

  Marker.prototype._focus = function () {
    this.focusMark();
    this.redraw();
  };

  Marker.prototype._select = function (y) {
    const mark = getMarkFromY(this, y);
    if (mark !== null) {
      this._prev = this._curr;
      this._curr = mark;
      this._focus();
    }
  };

  Marker.prototype._changeCursor = function (y) {
    if (getMarkFromY(this, y) !== null) {
      $(this._canvas).css("cursor", "pointer");
    } else {
      $(this._canvas).css("cursor", "default");
    }
  };

  Marker.prototype.index = function () {
    return this._curr == null ? -1 : this._curr.index;
  };

  Marker.prototype.count = function () {
    return this._marks.count();
  };

  Marker.prototype.init = function (mc, fc) {
    this._mc = mc;
    this._fc = fc;

    this._canvas = canvas.clone().appendTo("body")[0];
    this._context = this._canvas.getContext("2d");

    $(this._canvas).on("click", e => this._select(e.offsetY));
    $(this._canvas).on("mousemove", e => this._changeCursor(e.offsetY));
    $(window).resize(this.redraw.bind(this));

    canvases.push(this._canvas);
    for (const c of canvases) {
      if (c === this._canvas) {
        $(c).css("zIndex", 65537);
      } else {
        $(c).css("zIndex", 65536);
      }
    }
    this.redraw();
  };

  Marker.prototype.focusMark = function () {
    if (this._prev === null) this._prev = this._curr;

    this._prev.nodes.forEach(mark => mark.css({
      backgroundColor: this._mc,
      color: blackOrWhite(this._mc),
    }));
    this._curr.nodes.forEach(mark => mark.css({
      backgroundColor: this._fc,
      color: blackOrWhite(this._fc),
    }));

    this._curr.nodes[0].focus();
  };

  Marker.prototype.redraw = function () {
    if (this._dispCount === 0) {
      this._canvas.width = 0;
      this._canvas.height = 0;
      return;
    }

    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    this._canvas.width = 16;
    this._canvas.height = window.innerHeight;

    for (let i = 0; i < this._dispCount; i++) {
      const m = this._marks.search(i);
      this._context.rect(0, m.rtop * this._canvas.height, 16, m.rheight);
    }
    this._context.fillStyle = this._mc;
    this._context.fill();

    if (this._curr !== null) {
      const m = this._curr;
      this._context.fillStyle = this._fc;
      this._context.fillRect(0, m.rtop * this._canvas.height, 16, m.rheight);
    }
  };

  Marker.prototype.focusPrev = function () {
    if (this._dispCount === 0) return;

    if (this._curr == null) {
      this._curr = this._marks.search(this._dispCount - 1);
    } else {
      this._prev = this._curr;

      const i = this._marks.searchRank(this._curr.index)[1];
      this._curr = this._marks.search(i - 1 < 0 ? this._dispCount - 1 : i - 1);
    }
    this._focus();
  };

  Marker.prototype.focusNext = function () {
    if (this._dispCount === 0) return;

    if (this._curr == null) {
      this._curr = this._marks.search(0);
    } else {
      this._prev = this._curr;

      const i = this._marks.searchRank(this._curr.index)[1];
      this._curr = this._marks.search(i + 1 >= this._dispCount ? 0 : i + 1);
    }
    this._focus();
  };

  Marker.prototype.add = function (m) {
    this._marks.insertRank(m.index, m);
  };

  Marker.prototype.calc = function* () {
    const r = document.createRange();
    for (const m of this._marks) {
      r.selectNodeContents(m.texts[0]);
      const rect = r.getBoundingClientRect();
      m.top = rect.top;
      m.height = rect.height;
      yield;
    }
  };

  Marker.prototype.wrap = function* () {
    const btop = document.body.getBoundingClientRect().top;
    const docHeight = $(document).height();
    const winHeight = window.innerHeight;

    for (const m of this._marks) {
      const t = (m.top - btop) / (docHeight - m.height);
      const h = m.height / docHeight * winHeight;

      m.nodes = m.texts.map(n => wrapWithMark(this, n, m));
      m.rtop = t;
      m.rheight = h < 3 ? 3 : h;
      this._dispCount++;
      yield;
    }
  };

  Marker.prototype.clear = function* () {
    for (const m of this._marks) {
      m.nodes.forEach(n => n.contents().unwrap());
      yield;
    }
    this._canvas.width = 0;
    this._canvas.height = 0;
  };

  Marker.prototype.destroy = (() => {
    const exclusions = [
      "pre",
    ];

    // It takes a long time to normalize an element with huge text.
    // Don't normalize elements which are possibilities of having a huge text.
    // Why not judge by the number of characters of text,
    // textContent (or jQueryObject.text()) is a time-consuming process.
    const normalize = text => {
      const parent = $(text).parent()[0];
      if (parent == null) return;
      if (exclusions.indexOf(parent.tagName.toLowerCase()) >= 0) return;
      parent.normalize();
    };

    return function* () {
      for (let i = this._destroyed; i < this.count(); i++) {
        this._marks.search(i).texts.forEach(normalize);
        this._destroyed++;
        yield;
      }
      $(this._canvas).remove();
      const i = canvases.indexOf(this._canvas);
      canvases.splice(i, 1);
    };
  })();
}
