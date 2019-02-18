import { Treap } from "../src/js/treap";

describe("Treap", () => {
  describe("count()", () => {
    it("standard", () => {
      testCount(3, ["foo", "bar", "baz"]);
      testCount(0, []);
      testCount(1000, new Array(1000).fill(0));
    });
  });

  describe("push()", () => {
    it("standard", () => {
      testPush(
        ["foo", "bar", "baz"],
        ["foo", "bar", "baz"]
      );
    });

    it("null", () => {
      testPush(
        [undefined, "foo", null, "bar", undefined, null],
        [undefined, "foo", null, "bar", undefined, null]
      );
    });
  });

  describe("insert()", () => {
    it("standard", () => {
      testInsert(
        ["baz", "bar", "foo"],
        [[0, "foo"], [0, "bar"], [0, "baz"]]
      );

      testInsert(
        ["foo", "bar", "baz"],
        [[0, "foo"], [1, "bar"], [2, "baz"]]
      );

      testInsert(
        ["foo", "baz", "bar"],
        [[0, "foo"], [1, "bar"], [1, "baz"]]
      );
    });

    it("minus", () => {
      testInsert(
        ["baz", "bar", "foo"],
        [[0, "foo"], [-100, "bar"], [-50, "baz"]]
      );
    });

    it("infinity", () => {
      testInsert(
        ["baz", "foo", "bar"],
        [[0, "foo"], [Infinity, "bar"], [-Infinity, "baz"]]
      );
    });
  });

  describe("search()", () => {
    it("standard", () => {
      testSearch(
        ["foo", "bar", "baz"],
        ["foo", "bar", "baz"]
      );
    });

    it("out of range", () => {
      const t = makeTreap(["foo", "bar", "baz"]);
      expect(t.search(0)).toBe("foo");
      expect(t.search(-1)).toBe(null);
      expect(t.search(3)).toBe(null);
    });
  });
});

const makeTreap = <T>(list: T[]) => {
  const t = new Treap<T>();
  for (const v of list) t.push(v);
  return t;
};

const testCount = <T>(exp: number, list: T[]) => {
  const t = makeTreap(list);
  expect(t.count()).toBe(exp);
};

const testPush = <T>(exps: T[], list: T[]) => {
  const r = [...makeTreap(list)];
  for (let i = 0; i < exps.length; i++) {
    expect(r[i]).toBe(exps[i]);
  }
};

const testInsert = <T>(exps: T[], list: [number, T][]) => {
  const t = new Treap<T>();
  for (const [n, v] of list) t.insert(n, v);
  const r = [...t];
  for (let i = 0; i < exps.length; i++) {
    expect(r[i]).toBe(exps[i]);
  }
};

const testSearch = <T>(exps: T[], list: T[]) => {
  const t = makeTreap(list);
  for (let i = 0; i < exps.length; i++) {
    expect(t.search(i)).toBe(exps[i]);
  }
};
