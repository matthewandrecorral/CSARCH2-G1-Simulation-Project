/** Verifies rendered statistics, formulas, and trace latency presentation. */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { compareReplacementPolicies } from "../simulator/comparison";
import type { TimingConfiguration } from "../simulator/timing";
import { StatisticsPanel } from "./StatisticsPanel";
import { TraceLog } from "./TraceLog";

const timing: TimingConfiguration = {
  readPolicy: "load-through",
  cacheAccessTimeNs: 1,
  mainMemoryBlockFetchTimeNs: 100,
};

const comparison = compareReplacementPolicies(
  { blockSizeWords: 4, cacheBlockCount: 4 },
  [0, 1, 2, 3, 0, 4],
);

describe("timing result presentation", () => {
  it("renders calculated policy statistics and the active inputs", () => {
    const markup = renderToStaticMarkup(
      <StatisticsPanel result={comparison} timing={timing} />,
    );

    expect(markup).toContain("Calculated");
    expect(markup).toContain("Load-through");
    expect(markup).toContain("Average access time (AMAT)");
    expect(markup).toContain("506 ns");
    expect(markup).toContain("83.3333%");
  });

  it("renders a latency for each policy in every visible trace row", () => {
    const markup = renderToStaticMarkup(
      <TraceLog result={comparison} timing={timing} visibleSteps={5} />,
    );

    expect(markup).toContain("LRU latency");
    expect(markup).toContain("MRU latency");
    expect(markup).toContain("101 ns");
    expect(markup).toContain("1 ns");
  });
});
