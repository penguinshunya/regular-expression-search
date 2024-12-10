import { blackOrWhite } from "./function";

test("black", () => {
  expect(blackOrWhite("#000000")).toBe("white");
});

test("white", () => {
  expect(blackOrWhite("#ffffff")).toBe("black");
});
