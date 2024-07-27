import * as searchHistory from ".";
import { expect, test } from "@jest/globals";
import { mockStorage } from "../storage/mock";

test("initial", async () => {
  mockStorage();
  expect(await searchHistory.get()).toEqual([]);
});

test("ignore empty", async () => {
  mockStorage();
  searchHistory.save("");
  expect(await searchHistory.get()).toEqual([]);
});

test("simple", async () => {
  mockStorage();
  searchHistory.save("1");
  expect(await searchHistory.get()).toEqual(["1"]);
});

test("over 1000", async () => {
  mockStorage();
  for (let i = 0; i < 1001; i++) {
    searchHistory.save(i.toString());
  }
  const expectArray: string[] = [];
  for (let i = 1; i < 1001; i++) {
    expectArray.push(i.toString());
  }
  expect(await searchHistory.get()).toEqual(expectArray);
});

test("complex", async () => {
  mockStorage();
  searchHistory.save("1");
  searchHistory.save("");
  searchHistory.save("2");
  searchHistory.save("2");
  searchHistory.save("3");
  expect(await searchHistory.get()).toEqual(["1", "2", "3"]);
});
