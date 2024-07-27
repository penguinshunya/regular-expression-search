import { expect, test } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import useCaseSensitive from ".";
import mockStorage from "../../externals/storage/mock";

test("simple", async () => {
  mockStorage();
  const { result } = renderHook(() => useCaseSensitive());
  expect(result.current[0]).toBe(false);
  act(() => {
    result.current[1]();
  });
  await waitFor(() => {
    expect(result.current[0]).toBe(true);
  });
});
