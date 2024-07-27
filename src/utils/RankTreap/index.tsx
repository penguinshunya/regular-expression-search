export default class RankTreap<T> implements Iterable<T> {
  private _root: Node<T> | null = null;
  private _count(node: Node<T> | null): number {
    return node?.count ?? 0;
  }
  private _update(node: Node<T>): Node<T> {
    node.count = this._count(node.left) + this._count(node.right) + 1;
    return node;
  }
  private _merge(left: Node<T> | null, right: Node<T> | null): Node<T> | null {
    if (left === null || right === null) {
      return left ?? right;
    }
    if (left.priority > right.priority) {
      if (left.rank > right.rank) {
        left.left = this._merge(left.left, right);
      } else {
        left.right = this._merge(left.right, right);
      }
      return this._update(left);
    } else {
      if (left.rank > right.rank) {
        right.right = this._merge(right.right, left);
      } else {
        right.left = this._merge(right.left, left);
      }
      return this._update(right);
    }
  }
  private _split(node: Node<T> | null, index: number): [Node<T> | null, Node<T> | null] {
    if (node === null) {
      return [null, null];
    }
    if (index <= this._count(node.left)) {
      const [left, right] = this._split(node.left, index);
      node.left = right;
      return [left, this._update(node)];
    } else {
      const [left, right] = this._split(node.right, index - this._count(node.left) - 1);
      node.right = left;
      return [this._update(node), right];
    }
  }
  private _searchSplit(node: Node<T> | null, rank: number): number {
    if (node === null) {
      return 0;
    }
    if (node.rank === rank) {
      throw new Error();
    }
    if (node.rank > rank) {
      return this._searchSplit(node.left, rank);
    } else {
      return this._searchSplit(node.right, rank) + this._count(node.left) + 1;
    }
  }
  private _insertRank(node: Node<T> | null, rank: number, value: T): Node<T> | null {
    const k = this._searchSplit(node, rank);
    const [left, right] = this._split(node, k);
    const l = this._merge(left, new Node(value, rank));
    return this._merge(l, right);
  }
  private _searchRank(node: Node<T> | null, rank: number): [T, number] {
    if (node === null) {
      throw new Error();
    }
    if (node.rank === rank) {
      return [node.value, this._count(node.left)];
    } else if (node.rank > rank) {
      return this._searchRank(node.left, rank);
    } else {
      const ret = this._searchRank(node.right, rank);
      return [ret[0], ret[1] + this._count(node.left) + 1];
    }
  }
  private _search(node: Node<T> | null, index: number): T | null {
    if (node === null) {
      return null;
    }
    if (index < 0 || index >= this._count(node)) {
      return null;
    }
    if (this._count(node.left) === index) {
      return node.value;
    } else if (this._count(node.left) > index) {
      return this._search(node.left, index);
    } else {
      return this._search(node.right, index - this._count(node.left) - 1);
    }
  }
  count(): number {
    return this._count(this._root);
  }
  insertRank(rank: number, value: T): void {
    this._root = this._insertRank(this._root, rank, value);
  }
  searchRank(rank: number): [T, number] {
    return this._searchRank(this._root, rank);
  }
  search(index: number): T | null {
    return this._search(this._root, index);
  }
  *[Symbol.iterator](): Iterator<T> {
    const count = this.count();
    for (let i = 0; i < count; i++) {
      const value = this.search(i);
      if (value === null) {
        throw new Error("Invalid index");
      }
      yield value;
    }
  }
}

class Node<T> {
  value: T;
  priority: number;
  count: number;
  rank: number;
  left: Node<T> | null = null;
  right: Node<T> | null = null;
  constructor(value: T, rank: number) {
    this.value = value;
    this.priority = Math.random();
    this.count = 1;
    this.rank = rank;
  }
}
