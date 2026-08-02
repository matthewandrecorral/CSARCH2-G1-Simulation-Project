import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { compareReplacementPolicies } from "../simulator/comparison";
import type { TimingConfiguration } from "../simulator/timing";
import { SimulationTelemetry } from "./SimulationTelemetry";

const timing: TimingConfiguration = {
  readPolicy: "load-through",
  cacheAccessTimeNs: 1,
  mainMemoryBlockFetchTimeNs: 100,
};

describe("simulation telemetry", () => {
  it("renders the idle architecture state before playback", () => {
    const markup = renderToStaticMarkup(
      <SimulationTelemetry
        currentStep={0}
        isPlaying={false}
        lruEntry={null}
        mruEntry={null}
        speedMs={600}
        timing={null}
        totalSteps={0}
      />,
    );

    expect(markup).toContain("Memory data path");
    expect(markup).toContain("AWAIT_RUN");
    expect(markup).toContain("Bus idle");
  });

  it("shows independent policy outcomes and their real access latencies", () => {
    const comparison = compareReplacementPolicies(
      { blockSizeWords: 4, cacheBlockCount: 4 },
      [0, 1, 2, 3, 0, 4, 1],
    );
    const lruEntry = comparison.lru.trace[6];
    const mruEntry = comparison.mru.trace[6];
    const markup = renderToStaticMarkup(
      <SimulationTelemetry
        currentStep={7}
        isPlaying={false}
        lruEntry={lruEntry}
        mruEntry={mruEntry}
        speedMs={600}
        timing={timing}
        totalSteps={7}
      />,
    );

    expect(lruEntry.result).toBe("miss");
    expect(mruEntry.result).toBe("hit");
    expect(markup).toContain("LRU reports miss; MRU reports hit");
    expect(markup).toContain("101 ns");
    expect(markup).toContain("1 ns");
  });
});
