import React from "react";
import { expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { collectTextNode } from ".";

test("single", async () => {
  render(
    <div data-testid="root">
      123
    </div>
  );
  const root = await screen.findByTestId("root");
  testNode(root, ["123"]);
});

test("nested", async () => {
  render(
    <div data-testid="root">
      <div>
        <div>123</div>
      </div>
    </div>
  );
  const root = await screen.findByTestId("root");
  testNode(root, ["123"]);
});

test("except <script> and <style>", async () => {
  render(
    <div data-testid="root">
      <script>console.log("Hello, world!")</script>
      <style>.foo {"{"} color: red; {"}"}</style>
    </div>
  );
  const root = await screen.findByTestId("root");
  testNode(root, []);
})

test("except <svg>", async () => {
  render(
    <div data-testid="root">
      <svg>
        <text>123</text>
      </svg>
    </div>
  );
  const root = await screen.findByTestId("root");
  testNode(root, []);
})

test("except when display is set to none", async () => {
  render(
    <div data-testid="root">
      <div style={{ display: "none" }}>123</div>
    </div>
  );
  const root = await screen.findByTestId("root");
  testNode(root, []);
});

test("except when the <details> open attribute is null", async () => {
  render(
    <div data-testid="root">
      <details>
        <summary>Details</summary>
        <div>123</div>
      </details>
    </div>
  );
  const root = await screen.findByTestId("root");
  testNode(root, []);
});

test("complex", async () => {
  render(
    <div data-testid="root">
      123
      <script>console.log("123")</script>
      <div>456</div>
      <div><span>789</span></div>
    </div>
  );
  const root = await screen.findByTestId("root");
  testNode(root, ["123", "456", "789"]);
});

function testNode(node: Node, texts: string[]) {
  const res: string[] = [];
  for (const n of collectTextNode(node)) {
    res.push(n.textContent ?? "");
  }
  expect(res).toEqual(texts);
}
