import { blackOrWhite } from "./js/function";
import { RankTreap } from "./js/rank-treap";

export class Mark {
  texts: Text[];
  nodes: JQuery<Element>[] = [];
  top: number;
  height: number;
  rtop: number;
  rheight: number;
  index: number;

  constructor(i: number, t: Text[]) {
    this.texts = t;
    this.index = i;
  }
}

const canvases: HTMLCanvasElement[] = [];

const canvas = $("<canvas>").css({
  zIndex: 65536,
  position: "fixed",
  margin: 0,
  padding: 0,
  top: 0,
  right: 0,
}) as JQuery<HTMLCanvasElement>;

export class Marker {
  private _marks = new RankTreap<Mark, number>();
  private _dispCount: number = 0;
  private _curr: Mark = null;
  private _prev: Mark = null;
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _mc: string;
  private _fc: string;
  private _destroyed = 0;

  private wrapWithMark = (() => {
    const org = $("<mark>").attr("tabindex", "-1").css({
      margin: 0,
      border: "none",
      padding: 0,
      font: "inherit",
    });
  
    const clickMark = function (m: Marker) {
      return function () {
        m._prev = m._curr;
        m._curr = $(this).data("mark");
        m._focus();
      };
    };
  
    return (m: Marker, node: Text, mrk: Mark) => {
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
  
  private getMarkFromY(m: Marker, y: number) {
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

  private _focus() {
    this.focusMark();
    this.redraw();
  };

  private _select(y: number) {
    const mark = this.getMarkFromY(this, y);
    if (mark !== null) {
      this._prev = this._curr;
      this._curr = mark;
      this._focus();
    }
  };

  private _changeCursor(y: number) {
    if (this.getMarkFromY(this, y) !== null) {
      $(this._canvas).css("cursor", "pointer");
    } else {
      $(this._canvas).css("cursor", "default");
    }
  };

  index() {
    return this._curr == null ? -1 : this._curr.index;
  };

  count() {
    return this._marks.count();
  };

  init(mc: string, fc: string) {
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

  focusMark() {
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

  redraw() {
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

  focusPrev() {
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

  focusNext() {
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

  add(m: Mark) {
    this._marks.insertRank(m.index, m);
  };

  calc = function* (): IterableIterator<void> {
    const that = this as Marker;
    const r = document.createRange();
    for (const m of that._marks) {
      r.selectNodeContents(m.texts[0]);
      const rect = r.getBoundingClientRect();
      m.top = rect.top;
      m.height = rect.height;
      yield;
    }
  };

  wrap = function* (): IterableIterator<void> {
    const that = this as Marker;
    const btop = document.body.getBoundingClientRect().top;
    const docHeight = $(document).height();
    const winHeight = window.innerHeight;

    for (const m of that._marks) {
      const t = (m.top - btop) / (docHeight - m.height);
      const h = m.height / docHeight * winHeight;

      m.nodes = m.texts.map(n => this.wrapWithMark(that, n, m));
      m.rtop = t;
      m.rheight = h < 3 ? 3 : h;
      that._dispCount++;
      yield;
    }
  };

  clear = function* (): IterableIterator<void> {
    const that = this as Marker;
    for (const m of that._marks) {
      m.nodes.forEach(n => n.contents().unwrap());
      yield;
    }
    that._canvas.width = 0;
    that._canvas.height = 0;
  };

  private exclusions = [
    "pre",
  ];

  // It takes a long time to normalize an element with huge text.
  // Don't normalize elements which are possibilities of having a huge text.
  // Why not judge by the number of characters of text,
  // textContent (or jQueryObject.text()) is a time-consuming process.
  private normalize = (text: Text) => {
    const parent = $(text).parent()[0] as Node as Element;
    if (parent == null) return;
    if (this.exclusions.indexOf(parent.tagName.toLowerCase()) >= 0) return;
    parent.normalize();
  };

  destroy = function* (): IterableIterator<void> {
    const that = this as Marker;
    for (let i = that._destroyed; i < that.count(); i++) {
      that._marks.search(i).texts.forEach(t => that.normalize(t));
      that._destroyed++;
      yield;
    }
    $(that._canvas).remove();
    const i = canvases.indexOf(that._canvas);
    canvases.splice(i, 1);
  };
}
