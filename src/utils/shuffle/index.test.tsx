import { expect, test } from "@jest/globals";
import shuffle from ".";

test("shuffle", () => {
  const array = [1, 2, 3, 4, 5];
  const result = shuffle(array);
  expect(result).toHaveLength(5);
  expect(result).toContain(1);
  expect(result).toContain(2);
  expect(result).toContain(3);
  expect(result).toContain(4);
  expect(result).toContain(5);
});
