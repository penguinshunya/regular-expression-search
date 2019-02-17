export class Treap<T> {
  private root: Node<T>;

  private _count(t: Node<T>) {
    return t == null ? 0 : t.cnt;
  }

  private _update(t: Node<T>) {
    t.cnt = this._count(t.lch) + this._count(t.rch) + 1;
    return t;
  }

  private _merge(l: Node<T>, r: Node<T>) {
    if (!l || !r) return !l ? r : l;

    if (l.pri > r.pri) {
      l.rch = this._merge(l.rch, r);
      return this._update(l);
    } else {
      r.lch = this._merge(l, r.lch);
      return this._update(r);
    }
  };

  private _split(t: Node<T>, k: number): [Node<T>, Node<T>] {
    if (!t) return [null, null];

    if (k <= this._count(t.lch)) {
      const s = this._split(t.lch, k);
      t.lch = s[1];
      return [s[0], this._update(t)];
    } else {
      const s = this._split(t.rch, k - this._count(t.lch) - 1);
      t.rch = s[0];
      return [this._update(t), s[1]];
    }
  };

  private _insert(t: Node<T>, k: number, v: T) {
    const s = this._split(t, k);
    const l = this._merge(s[0], new Node(v));
    return this._merge(l, s[1]);
  };

  private _search (t: Node<T>, k: number): T {
    if (k < 0 || k >= this._count(t)) return null;

    if (this._count(t.lch) === k) {
      return t.val;
    } else if (this._count(t.lch) > k) {
      return this._search(t.lch, k);
    } else {
      return this._search(t.rch, k - this._count(t.lch) - 1);
    }
  };

  count() {
    return this._count(this.root);
  }

  insert(k: number, v: T) {
    this.root = this._insert(this.root, k, v);
  };

  push(v: T) {
    this.root = this._insert(this.root, this._count(this.root), v);
    return this;
  };

  search(k: number) {
    return this._search(this.root, k);
  };

  [Symbol.iterator] = function* (): IterableIterator<T> {
    const count = this.count();
    for (let i = 0; i < count; i++) {
      yield this.search(i);
    }
  };
};

class Node<T> {
  val: T;
  lch: Node<T>;
  rch: Node<T>;
  pri: number = Math.random();
  cnt: number = 1;

  constructor(v: T) {
    this.val = v;
  }
}
