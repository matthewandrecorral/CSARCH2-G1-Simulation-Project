import { describe, expect, it } from "vitest";

import { compareReplacementPolicies } from "./comparison";
import {
  generateMidRepeatReverseSequence,
  generateRandomSequence,
  generateSequentialSequence,
} from "./sequences";
import { calculateSimulationStatistics, type TimingConfiguration } from "./timing";

const configuration = { blockSizeWords: 4, cacheBlockCount: 4 };
const timing: TimingConfiguration = {
  readPolicy: "load-through",
  cacheAccessTimeNs: 1,
  mainMemoryBlockFetchTimeNs: 100,
};

describe("documented required-sequence results", () => {
  it("keeps the README result table reproducible", () => {
    const cases = [
      ["Sequential", generateSequentialSequence(4)],
      ["Mid-repeat/reverse", generateMidRepeatReverseSequence(4)],
      ["Random (seed: group-1)", generateRandomSequence("group-1")],
    ] as const;

    const results = cases.map(([name, sequence]) => {
      const comparison = compareReplacementPolicies(configuration, sequence);
      const lru = calculateSimulationStatistics(comparison.lru, timing);
      const mru = calculateSimulationStatistics(comparison.mru, timing);

      return {
        name,
        accesses: sequence.length,
        lru: [lru.hitCount, lru.missCount, lru.totalAccessTimeNs, lru.averageAccessTimeNs],
        mru: [mru.hitCount, mru.missCount, mru.totalAccessTimeNs, mru.averageAccessTimeNs],
      };
    });

    expect(results).toEqual([
      {
        name: "Sequential",
        accesses: 16,
        lru: [0, 16, 1_616, 101],
        mru: [4, 12, 1_216, 76],
      },
      {
        name: "Mid-repeat/reverse",
        accesses: 40,
        lru: [4, 36, 3_640, 91],
        mru: [17, 23, 2_340, 58.5],
      },
      {
        name: "Random (seed: group-1)",
        accesses: 64,
        lru: [0, 64, 6_464, 101],
        mru: [1, 63, 6_364, 99.4375],
      },
    ]);
  });
});
