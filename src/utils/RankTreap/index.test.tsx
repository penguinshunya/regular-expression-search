import { describe, expect, it } from "@jest/globals";
import RankTreap from ".";

describe("basic operations", () => {
  const treap = new RankTreap<string>();

  it("empty treap", () => {
    expect(treap.count()).toBe(0);
  });

  it("insert rank", () => {
    treap.insertRank(1000, "c");
    treap.insertRank(10, "a");
    treap.insertRank(100, "b");
    expect(treap.count()).toBe(3);
  });

  it("search rank", () => {
    const [value, index] = treap.searchRank(100);
    expect(value).toBe("b");
    expect(index).toBe(1);
  });

  it("search", () => {
    const value = treap.search(1);
    expect(value).toBe("b");
  });

  it("search emtpty", () => {
    const value = treap.search(3);
    expect(value).toBeNull();
  });
});
