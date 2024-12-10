import { collectTextNode } from ".";

function collect(htmlString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  return [...collectTextNode(doc.body)].map((e) => e.textContent);
}

test("basic operation", () => {
  expect(collect(`<p>hello</p>`)).toEqual(["hello"]);
});

test("ignore <script>", () => {
  expect(collect(`<script>console.log(true);</script>`)).toEqual([]);
});

test("ignore display:none", () => {
  expect(collect(`<p style="display:none;">hello</p>`)).toEqual([]);
});

test("ignore closed <details>", () => {
  expect(collect(`<details>hello</details>`)).toEqual([]);
});

test("include opened <details>", () => {
  expect(collect(`<details open>hello</details>`)).toEqual(["hello"]);
});

test("recurse", () => {
  expect(collect(`<p><p><p>hello</p></p></p>`)).toEqual(["hello"]);
});

test("sequence", () => {
  expect(collect(`<p>foo</p><p>bar</p><p>baz</p>`)).toEqual([
    "foo",
    "bar",
    "baz",
  ]);
});

test("complex", () => {
  expect(
    collect(
      `<p>hello, <span style="color:red;">world</span><span style="display:none;">ignore!</span></p>`,
    ),
  ).toEqual(["hello, ", "world"]);
});
