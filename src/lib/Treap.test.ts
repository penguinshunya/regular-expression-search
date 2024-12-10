import Treap from "./Treap";

test("basic operation", () => {
  const t = new Treap<number>();

  expect(t.count()).toBe(0);

  t.push(3);
  t.push(5);

  t.insert(0, 1);

  expect(t.count()).toBe(3);

  expect(t.search(0)).toBe(1);
  expect(t.search(1)).toBe(3);
  expect(t.search(2)).toBe(5);

  expect([...t]).toEqual([1, 3, 5]);
});
