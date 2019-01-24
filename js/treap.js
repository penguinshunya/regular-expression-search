const Treap = function() {
  this._root = null;
};

{
  const Node = function(v) {
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
      let s = split(t.lch, k);
      t.lch = s[1];
      return [s[0], update(t)];
    } else {
      let s = split(t.rch, k - count(t.lch) - 1);
      t.rch = s[0];
      return [update(t), s[1]];
    }
  };

  const insert = (t, k, v) => {
    let s = split(t, k);
    let l = merge(s[0], new Node(v));
    return merge(l, s[1]);
  };

  const erase = (t, k) => {
    let r = split(t, k + 1);
    let l = split(t, k);
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

  Treap.prototype.count = function() {
    return count(this._root);
  };

  Treap.prototype.insert = function(k, v) {
    this._root = insert(this._root, k, v);
  };

  Treap.prototype.push = function(v) {
    this._root = insert(this._root, count(this._root), v);
  };

  Treap.prototype.erase = function(k) {
    this._root = erase(this._root, k);
  };

  Treap.prototype.search = function(k) {
    return search(this._root, k);
  };
}
