import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("interactive application shell", () => {
  it("renders configuration, sequence, playback, and both cache policy panels", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("Fully Associative Cache Policy Lab");
    expect(markup).toContain("Run LRU / MRU comparison");
    expect(markup).toContain("Step-by-step");
    expect(markup).toContain("Final snapshot");
    expect(markup).toContain("LRU cache");
    expect(markup).toContain("MRU cache");
    expect(markup).toContain("Trace log");
    expect(markup).toContain("Interactive simulator");
  });
});
