import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("application scaffold", () => {
  it("renders the project title and both cache policy panels", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Fully Associative Cache Policy Lab");
    expect(markup).toContain("LRU cache");
    expect(markup).toContain("MRU cache");
  });
});
