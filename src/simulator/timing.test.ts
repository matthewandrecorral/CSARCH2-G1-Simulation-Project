/** Covers timing validation, both miss formulas, totals, rates, and AMAT. */
import { describe, expect, it } from "vitest";

import { compareReplacementPolicies } from "./comparison";
import {
  calculateSimulationStatistics,
  getAccessLatencyNs,
  validateTimingConfiguration,
  type TimingConfiguration,
} from "./timing";

const loadThrough: TimingConfiguration = {
  readPolicy: "load-through",
  cacheAccessTimeNs: 1,
  mainMemoryBlockFetchTimeNs: 100,
};

describe("timing configuration validation", () => {
  it("accepts positive finite decimal timings", () => {
    expect(validateTimingConfiguration({
      readPolicy: "non-load-through",
      cacheAccessTimeNs: 0.5,
      mainMemoryBlockFetchTimeNs: 80.25,
    })).toEqual({
      valid: true,
      value: {
        readPolicy: "non-load-through",
        cacheAccessTimeNs: 0.5,
        mainMemoryBlockFetchTimeNs: 80.25,
      },
      issues: [],
    });
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, "1", null])(
    "rejects invalid cache timing %s",
    (cacheAccessTimeNs) => {
      const result = validateTimingConfiguration({
        readPolicy: "load-through",
        cacheAccessTimeNs,
        mainMemoryBlockFetchTimeNs: 100,
      });

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.field)).toContain("cacheAccessTimeNs");
    },
  );

  it("reports an invalid policy and memory timing together", () => {
    const result = validateTimingConfiguration({
      readPolicy: "bypass",
      cacheAccessTimeNs: 1,
      mainMemoryBlockFetchTimeNs: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual([
      "readPolicy",
      "mainMemoryBlockFetchTimeNs",
    ]);
  });
});

describe("timing formulas", () => {
  it("uses C for hits, C + M for load-through misses, and M + 2C for non-load-through misses", () => {
    expect(getAccessLatencyNs("hit", loadThrough)).toBe(1);
    expect(getAccessLatencyNs("miss", loadThrough)).toBe(101);
    expect(getAccessLatencyNs("miss", {
      ...loadThrough,
      readPolicy: "non-load-through",
    })).toBe(102);
  });

  it("calculates counts, rates, per-access latency, total time, and AMAT", () => {
    const comparison = compareReplacementPolicies(
      { blockSizeWords: 4, cacheBlockCount: 4 },
      [0, 1, 2, 3, 0, 4],
    );
    const statistics = calculateSimulationStatistics(comparison.lru, loadThrough);

    expect(statistics).toEqual({
      accessCount: 6,
      hitCount: 1,
      missCount: 5,
      hitRate: 1 / 6,
      missRate: 5 / 6,
      hitTimeNs: 1,
      missTimeNs: 101,
      totalAccessTimeNs: 506,
      averageAccessTimeNs: 506 / 6,
      accessLatenciesNs: [101, 101, 101, 101, 1, 101],
    });
  });

  it("returns safe zero rates and averages for an empty internal trace", () => {
    expect(calculateSimulationStatistics({ trace: [] }, loadThrough)).toMatchObject({
      accessCount: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      missRate: 0,
      totalAccessTimeNs: 0,
      averageAccessTimeNs: 0,
      accessLatenciesNs: [],
    });
  });
});
