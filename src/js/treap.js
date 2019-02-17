export const Treap = function () {
  this._root = null;
};

{
  const Node = function (v) {
    this.val = v;
    this.lch = null;
    this.rch = null;
    this.pri = Math.random();
    this.cnt = 1;
  };

  const count = t => !t ? 0 : t.cnt;

  const update = t => {
    t.cnt = count(t.lch) + count(t.rch) + 1;
    return t;
  };

  const merge = (l, r) => {
    if (!l || !r) return !l ? r : l;

    if (l.pri > r.pri) {
      l.rch = merge(l.rch, r);
      return update(l);
    } else {
      r.lch = merge(l, r.lch);
      return update(r);
    }
  };

  const split = (t, k) => {
    if (!t) return [null, null];

    if (k <= count(t.lch)) {
      const s = split(t.lch, k);
      t.lch = s[1];
      return [s[0], update(t)];
    } else {
      const s = split(t.rch, k - count(t.lch) - 1);
      t.rch = s[0];
      return [update(t), s[1]];
    }
  };

  const insert = (t, k, v) => {
    const s = split(t, k);
    const l = merge(s[0], new Node(v));
    return merge(l, s[1]);
  };

  const erase = (t, k) => {
    const r = split(t, k + 1);
    const l = split(t, k);
    return merge(l[0], r[1]);
  };

  const search = (t, k) => {
    if (k < 0 || k >= count(t)) return null;

    if (count(t.lch) === k) {
      return t.val;
    } else if (count(t.lch) > k) {
      return search(t.lch, k);
    } else {
      return search(t.rch, k - count(t.lch) - 1);
    }
  };

  Treap.prototype.count = function () {
    return count(this._root);
  };

  Treap.prototype.insert = function (k, v) {
    this._root = insert(this._root, k, v);
  };

  Treap.prototype.push = function (v) {
    this._root = insert(this._root, count(this._root), v);
    return this;
  };

  Treap.prototype.erase = function (k) {
    this._root = erase(this._root, k);
  };

  Treap.prototype.search = function (k) {
    return search(this._root, k);
  };

  Treap.prototype[Symbol.iterator] = function* () {
    const count = this.count();
    for (let i = 0; i < count; i++) {
      yield this.search(i);
    }
  };
}
