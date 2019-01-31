const RankTreap = function () {
  this._root = null;
};

{
  const Node = function (v, r) {
    this.val = v;
    this.rnk = r;
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
      if (l.rnk > r.rnk) {
        l.lch = merge(l.lch, r);
      } else {
        l.rch = merge(l.rch, r);
      }
      return update(l);
    } else {
      if (l.rnk > r.rnk) {
        r.rch = merge(r.rch, l);
      } else {
        r.lch = merge(r.lch, l);
      }
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

  const searchSplit = (t, r) => {
    if (!t) return 0;
    if (t.rnk === r) throw new Error();

    if (t.rnk > r) {
      return searchSplit(t.lch, r);
    } else {
      return searchSplit(t.rch, r) + count(t.lch) + 1;
    }
  };

  const insertRank = (t, r, v) => {
    const k = searchSplit(t, r);
    const s = split(t, k);
    const l = merge(s[0], new Node(v, r));
    return merge(l, s[1]);
  };

  // return [value, index]
  const searchRank = (t, r) => {
    if (t.rnk === r) {
      return [t.val, count(t.lch)];
    } else if (t.rnk > r) {
      return searchRank(t.lch, r);
    } else {
      const ret = searchRank(t.rch, r);
      return [ret[0], ret[1] + count(t.lch) + 1];
    }
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

  RankTreap.prototype.count = function () {
    return count(this._root);
  };

  RankTreap.prototype.insertRank = function (r, v) {
    this._root = insertRank(this._root, r, v);
  };

  RankTreap.prototype.searchRank = function (r) {
    return searchRank(this._root, r);
  };

  RankTreap.prototype.search = function (k) {
    return search(this._root, k);
  };

  RankTreap.prototype[Symbol.iterator] = function* () {
    const count = this.count();
    for (let i = 0; i < count; i++) {
      yield this.search(i);
    }
  };
}
