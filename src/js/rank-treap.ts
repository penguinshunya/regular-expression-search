export class RankTreap<T, S> implements Iterable<T> {
  private _root: Node<T, S>;

  private _count(t: Node<T, S>) {
    return t == null ? 0 : t.cnt;
  }

  private _update(t: Node<T, S>) {
    t.cnt = this._count(t.lch) + this._count(t.rch) + 1;
    return t;
  }

  private _merge(l: Node<T, S>, r: Node<T, S>) {
    if (!l || !r) return !l ? r : l;

    if (l.pri > r.pri) {
      if (l.rnk > r.rnk) {
        l.lch = this._merge(l.lch, r);
      } else {
        l.rch = this._merge(l.rch, r);
      }
      return this._update(l);
    } else {
      if (l.rnk > r.rnk) {
        r.rch = this._merge(r.rch, l);
      } else {
        r.lch = this._merge(r.lch, l);
      }
      return this._update(r);
    }
  };

  private _split(t: Node<T, S>, k: number): [Node<T, S>, Node<T, S>] {
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

  private _searchSplit(t: Node<T, S>, r: S): number {
    if (!t) return 0;
    if (t.rnk === r) throw new Error();

    if (t.rnk > r) {
      return this._searchSplit(t.lch, r);
    } else {
      return this._searchSplit(t.rch, r) + this._count(t.lch) + 1;
    }
  };

  private _insertRank(t: Node<T, S>, r: S, v: T) {
    const k = this._searchSplit(t, r);
    const s = this._split(t, k);
    const l = this._merge(s[0], new Node(v, r));
    return this._merge(l, s[1]);
  };

  private _searchRank(t: Node<T, S>, r: S): [T, number] {
    if (t.rnk === r) {
      return [t.val, this._count(t.lch)];
    } else if (t.rnk > r) {
      return this._searchRank(t.lch, r);
    } else {
      const ret = this._searchRank(t.rch, r);
      return [ret[0], ret[1] + this._count(t.lch) + 1];
    }
  };

  private _search (t: Node<T, S>, k: number): T {
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
    return this._count(this._root);
  }

  insertRank(r: S, v: T) {
    this._root = this._insertRank(this._root, r, v);
  };

  searchRank(r: S) {
    return this._searchRank(this._root, r);
  };

  search(k: number) {
    return this._search(this._root, k);
  };

  [Symbol.iterator] = function* (): Iterator<T> {
    const count = this.count();
    for (let i = 0; i < count; i++) {
      yield this.search(i);
    }
  };
}

class Node<T, S> {
  val: T;
  rnk: S;
  lch: Node<T, S>;
  rch: Node<T, S>;
  pri: number = Math.random();
  cnt: number = 1;

  constructor(v: T, r: S) {
    this.val = v;
    this.rnk = r;
  }
}
