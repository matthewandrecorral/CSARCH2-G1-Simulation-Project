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
const sequenceSpecification = {
  choice: "custom",
  randomSeed: null,
} as const;

describe("timing result presentation", () => {
  it("renders calculated policy statistics and the active inputs", () => {
    const markup = renderToStaticMarkup(
      <StatisticsPanel
        result={comparison}
        sequenceSpecification={sequenceSpecification}
        timing={timing}
      />,
    );

    expect(markup).toContain("Calculated");
    expect(markup).toContain("Load-through");
    expect(markup).toContain("Average access time (AMAT)");
    expect(markup).toContain("506 ns");
    expect(markup).toContain("83.3333%");
    expect(markup).toContain("Configuration &amp; workload");
    expect(markup).toContain("4 words/block");
    expect(markup).toContain("4 cache lines");
    expect(markup).toContain("Cache lookup (C): 1 ns");
    expect(markup).toContain("Block fetch (M): 100 ns");
    expect(markup).not.toContain("Hit latency");
    expect(markup).not.toContain("Miss latency");
    expect(markup).toContain("Custom");
    expect(markup).toContain("0, 1, 2, 3, 0, 4");
  });

  it("renders a latency for each policy in every visible trace row", () => {
    const markup = renderToStaticMarkup(
      <TraceLog
        result={comparison}
        sequenceSpecification={sequenceSpecification}
        timing={timing}
        visibleSteps={5}
      />,
    );

    expect(markup).toContain("LRU latency");
    expect(markup).toContain("MRU latency");
    expect(markup).toContain("101 ns");
    expect(markup).toContain("1 ns");
    expect(markup).toContain("Configuration &amp; workload");
    expect(markup).toContain("Load-through");
    expect(markup).toContain("100 ns");
    expect(markup).toContain("6 accesses");
    expect(markup).toContain("0, 1, 2, 3, 0, 4");
  });
});
