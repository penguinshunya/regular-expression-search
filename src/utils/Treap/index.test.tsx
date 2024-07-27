import { describe, expect, it } from "@jest/globals";
import Treap from ".";

describe("basic operations", () => {
  const treap = new Treap<string>();

  it("push", () => {
    treap.push("a");
    treap.push("b");
    treap.push("c");
    const result: string[] = [];
    for (const value of treap) {
      result.push(value);
    }
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("search", () => {
    const value = treap.search(1);
    expect(value).toBe("b");
  });

  it("count", () => {
    const count = treap.count();
    expect(count).toBe(3);
  });

  it("insert", () => {
    treap.insert(1, "d");
    const result: string[] = [];
    for (const value of treap) {
      result.push(value);
    }
    expect(result).toEqual(["a", "d", "b", "c"]);
  });
});
