let Treap = function() {
  let Node = function(v) {
    this.val = v;
    this.lch = null;
    this.rch = null;
    this.pri = Math.random();
    this.cnt = 1;
  };

  let count = (t) => !t ? 0 : t.cnt;

  let update = (t) => {
    t.cnt = count(t.lch) + count(t.rch) + 1;
    return t;
  };

  let merge = (l, r) => {
    if (!l || !r) return !l ? r : l;

    if (l.pri > r.pri) {
      l.rch = merge(l.rch, r);
      return update(l);
    } else {
      r.lch = merge(l, r.lch);
      return update(r);
    }
  };

  let split = (t, k) => {
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

  let insert = (t, k, v) => {
    let s = split(t, k);
    let l = merge(s[0], new Node(v));
    return merge(l, s[1]);
  };

  let erase = (t, k) => {
    let r = split(t, k + 1);
    let l = split(t, k);
    return merge(l[0], r[1]);
  };

  let search = (t, k) => {
    if (k < 0 || k >= count(t)) return null;

    if (count(t.lch) === k) {
      return t.val; 
    } else if (count(t.lch) > k) {
      return search(t.lch, k);
    } else {
      return search(t.rch, k - count(t.lch) - 1);
    }
  };

  let root = null;

  this.count = () => count(root);
  this.insert = (k, v) => root = insert(root, k, v);
  this.push = (v) => root = insert(root, count(root), v);
  this.erase = (k) => root = erase(root, k);
  this.search = (k) => search(root, k);
};
