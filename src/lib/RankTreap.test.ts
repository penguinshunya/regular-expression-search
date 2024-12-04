import RankTreap from "./RankTreap"

describe("basic operation", () => {
  const t = new RankTreap<string, number>();

  it("insertRank", () => {
    t.insertRank(5, "a");
    t.insertRank(7, "b");
    t.insertRank(3, "c");
  });

  it("count", () => {
    expect(t.count()).toBe(3);
  });

  it("search", () => {
    expect(t.search(0)).toBe("c");
    expect(t.search(1)).toBe("a");
    expect(t.search(2)).toBe("b");
  });

  it("searchRank", () => {
    expect(t.searchRank(5)).toEqual(["a", 1]);
  });
});
