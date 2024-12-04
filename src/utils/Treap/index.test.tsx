import { describe, expect, it } from "@jest/globals";
import Treap from ".";

describe("basic operations", () => {
  const treap = new Treap<string>();

  it("correct push", () => {
    treap.push("a");
    treap.push("b");
    treap.push("c");
    const result: string[] = [];
    for (const value of treap) {
      result.push(value);
    }
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("correct search", () => {
    const value = treap.search(1);
    expect(value).toBe("b");
  });

  it("correct count", () => {
    const count = treap.count();
    expect(count).toBe(3);
  });

  it("correct insert", () => {
    treap.insert(1, "d");
    const result: string[] = [];
    for (const value of treap) {
      result.push(value);
    }
    expect(result).toEqual(["a", "d", "b", "c"]);
  });
});
