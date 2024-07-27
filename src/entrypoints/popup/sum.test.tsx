import React from "react";
import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";

describe("sum module", () => {
  test("adds 1 + 2 to equal 3", () => {
    expect(1 + 2).toBe(3);
  });

  test("react test", async () => {
    render(
      <div
        id="hello"
        onClick={() =>
          (document.getElementById("hello")!.textContent = "anaconda")
        }
      >
        hello
      </div>
    );
    const hello = screen.getByText("hello");
    hello.click();
    expect(hello.textContent).toBe("anaconda");
  });
});
