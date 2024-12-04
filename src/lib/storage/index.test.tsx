import * as storage from ".";
import { expect, test } from "@jest/globals";
import { mockStorage } from "./mock";

test("initial value if key does not exist", async () => {
  mockStorage();
  const value = await storage.get<string>("key", "initialValue");
  expect(value).toBe("initialValue");
});

test("set value for existing key", async () => {
  mockStorage();
  storage.set("key", "value");
  const value = await storage.get<string>("key", "initialValue");
  expect(value).toBe("value");
});
