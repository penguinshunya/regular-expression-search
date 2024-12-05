export default class RankTreap<T, S> implements Iterable<T> {
  private _root: Node<T, S> | null;

  constructor() {
    this._root = null; // Initially, the tree is empty
  }

  // Count the number of nodes in the treap
  private _count(t: Node<T, S> | null): number {
    return t === null ? 0 : t.cnt;
  }

  // Update the count of nodes in the subtree
  private _update(t: Node<T, S> | null): Node<T, S> | null {
    if (!t) return null;
    t.cnt = this._count(t.lch) + this._count(t.rch) + 1;
    return t;
  }

  // Merge two treaps
  private _merge(
    l: Node<T, S> | null,
    r: Node<T, S> | null,
  ): Node<T, S> | null {
    if (!l || !r) return l ?? r;
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
  }

  // Split the treap at the given rank
  private _split(
    t: Node<T, S> | null,
    k: number,
  ): [Node<T, S> | null, Node<T, S> | null] {
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

  // Find the rank of a given element
  private _searchSplit(t: Node<T, S> | null, r: S): number {
    if (!t) return 0;
    if (t.rnk === r) throw new Error("Rank already exists");
    if (t.rnk > r) {
      return this._searchSplit(t.lch, r);
    } else {
      return this._searchSplit(t.rch, r) + this._count(t.lch) + 1;
    }
  }

  // Insert an element at the given rank
  private _insertRank(t: Node<T, S> | null, r: S, v: T): Node<T, S> | null {
    const k = this._searchSplit(t, r);
    const [left, right] = this._split(t, k);
    const newNode = new Node(v, r);
    const mergedLeft = this._merge(left, newNode);
    return this._merge(mergedLeft, right);
  }

  // Search for an element at the given rank
  private _searchRank(t: Node<T, S> | null, r: S): [T, number] | null {
    if (!t) return null;
    if (t.rnk === r) {
      return [t.val, this._count(t.lch)];
    } else if (t.rnk > r) {
      return this._searchRank(t.lch, r);
    } else {
      const result = this._searchRank(t.rch, r);
      return result ? [result[0], result[1] + this._count(t.lch) + 1] : null;
    }
  }

  // Search for the element at the given index (k)
  private _search(t: Node<T, S> | null, k: number): T | null {
    if (k < 0 || k >= this._count(t)) return null;
    if (this._count(t!.lch) === k) return t!.val;
    if (this._count(t!.lch) > k) return this._search(t!.lch, k);
    return this._search(t!.rch, k - this._count(t!.lch) - 1);
  }

  // Public method to count the number of elements in the treap
  count(): number {
    return this._count(this._root);
  }

  // Insert an element with a specific rank
  insertRank(r: S, v: T): void {
    this._root = this._insertRank(this._root, r, v);
  }

  // Search for an element by its rank
  searchRank(r: S): [T, number] | null {
    return this._searchRank(this._root, r);
  }

  // Search for an element by its index
  search(k: number): T | null {
    return this._search(this._root, k);
  }

  // Implement the iterable interface
  *[Symbol.iterator](): Iterator<T> {
    const count = this.count();
    for (let i = 0; i < count; i++) {
      const val = this.search(i);
      if (val) yield val;
    }
  }
}

class Node<T, S> {
  pri: number;
  cnt: number;
  val: T;
  rnk: S;
  lch: Node<T, S> | null;
  rch: Node<T, S> | null;

  constructor(v: T, r: S) {
    this.pri = Math.random(); // Priority is randomly assigned
    this.cnt = 1; // Initial count is 1
    this.val = v;
    this.rnk = r;
    this.lch = null; // Left child
    this.rch = null; // Right child
  }
}
