import { collectTextNode } from "./function";

describe("collectTextNode", () => {
  function collect(htmlString: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    return [...collectTextNode(doc.body)].map((e) => e.textContent);
  }

  it("basic operation", () => {
    expect(collect(`<p>hello</p>`)).toEqual(["hello"]);
  });

  it("ignore <script>", () => {
    expect(collect(`<script>console.log(true);</script>`)).toEqual([]);
  });

  it("ignore display:none", () => {
    expect(collect(`<p style="display:none;">hello</p>`)).toEqual([]);
  });

  it("ignore closed <details>", () => {
    expect(collect(`<details>hello</details>`)).toEqual([]);
  });

  it("include opened <details>", () => {
    expect(collect(`<details open>hello</details>`)).toEqual(["hello"]);
  });

  it("recurse", () => {
    expect(collect(`<p><p><p>hello</p></p></p>`)).toEqual(["hello"]);
  });

  it("sequence", () => {
    expect(collect(`<p>foo</p><p>bar</p><p>baz</p>`)).toEqual([
      "foo",
      "bar",
      "baz",
    ]);
  });

  it("complex", () => {
    expect(
      collect(
        `<p>hello, <span style="color:red;">world</span><span style="display:none;">ignore!</span></p>`,
      ),
    ).toEqual(["hello, ", "world"]);
  });
});
