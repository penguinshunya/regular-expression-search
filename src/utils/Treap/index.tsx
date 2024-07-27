export default class Treap<T> implements Iterable<T> {
  private _root: Node<T> | null = null;
  private _count(node: Node<T> | null): number {
    return node?.count ?? 0;
  }
  private _update(node: Node<T>): Node<T> {
    node.count = this._count(node.left) + this._count(node.right) + 1;
    return node;
  }
  private _merge(left: Node<T> | null, right: Node<T> | null): Node<T> | null {
    if (left == null || right == null) {
      return left ?? right;
    }
    if (left.priority > right.priority) {
      left.right = this._merge(left.right, right);
      return this._update(left);
    } else {
      right.left = this._merge(left, right.left);
      return this._update(right);
    }
  }
  private _split(node: Node<T> | null, index: number): [Node<T> | null, Node<T> | null] {
    if (node == null) {
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
  private _insert(node: Node<T> | null, index: number, value: T): Node<T> | null {
    const [left, right] = this._split(node, index);
    return this._merge(this._merge(left, new Node(value)), right);
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
  insert(index: number, value: T): void {
    this._root = this._insert(this._root, index, value);
  }
  push(value: T): this {
    this._root = this._insert(this._root, this._count(this._root), value);
    return this;
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
  priority = Math.random();
  count = 1;
  value: T;
  left: Node<T> | null = null;
  right: Node<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}
