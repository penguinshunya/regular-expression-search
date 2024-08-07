import * as storage from ".";
import { jest } from "@jest/globals";

export default function mockStorage() {
  const memo: Record<string, unknown> = {};
  jest.spyOn(storage, "get").mockImplementation(async (key, initialValue) => {
    if (memo[key] == null) {
      memo[key] = initialValue;
    }
    return memo[key];
  });
  jest.spyOn(storage, "set").mockImplementation(async (key, value) => {
    memo[key] = value;
  });
}
