export default class Treap<T> implements Iterable<T> {
  private _root: Node<T> | null = null;

  private _count(t: Node<T> | null): number {
    return t == null ? 0 : t.cnt;
  }

  private _update(t: Node<T>): Node<T> {
    t.cnt = this._count(t.lch) + this._count(t.rch) + 1;
    return t;
  }

  private _merge(l: Node<T> | null, r: Node<T> | null): Node<T> | null {
    if (!l || !r) return l ?? r;
    if (l.pri > r.pri) {
      l.rch = this._merge(l.rch, r);
      return this._update(l);
    } else {
      r.lch = this._merge(l, r.lch);
      return this._update(r);
    }
  }

  private _split(
    t: Node<T> | null,
    k: number,
  ): [Node<T> | null, Node<T> | null] {
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
  }

  private _insert(t: Node<T> | null, k: number, v: T): Node<T> | null {
    const s = this._split(t, k);
    const l = this._merge(s[0], new Node<T>(v));
    return this._merge(l, s[1]);
  }

  private _search(t: Node<T> | null, k: number): T | null {
    if (k < 0 || k >= this._count(t)) return null;
    if (this._count(t.lch) === k) {
      return t.val;
    } else if (this._count(t.lch) > k) {
      return this._search(t.lch, k);
    } else {
      return this._search(t.rch, k - this._count(t.lch) - 1);
    }
  }

  count(): number {
    return this._count(this._root);
  }

  insert(k: number, v: T): void {
    this._root = this._insert(this._root, k, v);
  }

  push(v: T): this {
    this._root = this._insert(this._root, this._count(this._root), v);
    return this;
  }

  search(k: number): T {
    const result = this._search(this._root, k);
    if (result === null) {
      throw new Error("Index out of bounds");
    }
    return result;
  }

  *[Symbol.iterator](): Iterator<T> {
    const count = this.count();
    for (let i = 0; i < count; i++) {
      yield this.search(i);
    }
  }
}

class Node<T> {
  pri: number;
  cnt: number;
  val: T;
  lch: Node<T> | null = null;
  rch: Node<T> | null = null;

  constructor(v: T) {
    this.pri = Math.random();
    this.cnt = 1;
    this.val = v;
  }
}
