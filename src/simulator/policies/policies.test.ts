import { describe, expect, it } from "vitest";

import { compareReplacementPolicies } from "../comparison";
import { FullyAssociativeCacheSimulator } from "../engine";
import type { CacheSnapshot, ReplacementPolicy } from "../types";
import { lruPolicy } from "./lru";
import { mruPolicy } from "./mru";

const minimumConfiguration = { blockSizeWords: 2, cacheBlockCount: 4 };

function createSimulator(policy: ReplacementPolicy, cacheBlockCount = 4) {
  return new FullyAssociativeCacheSimulator(
    { blockSizeWords: 2, cacheBlockCount },
    policy,
  );
}

describe.each([
  ["LRU", lruPolicy],
  ["MRU", mruPolicy],
] as const)("%s shared cache behavior", (_, policy) => {
  it("starts empty and fills the lowest available slots before replacement", () => {
    const simulator = createSimulator(policy);

    expect(simulator.getCacheState().every((line) => !line.valid)).toBe(true);

    const first = simulator.access(50);
    const second = simulator.access(60);

    expect(first).toMatchObject({
      result: "miss",
      selectedSlot: 0,
      evictedBlock: null,
      selectionReason: "empty-slot",
    });
    expect(second).toMatchObject({
      selectedSlot: 1,
      evictedBlock: null,
      selectionReason: "empty-slot",
    });
  });

  it("handles consecutive duplicates as repeated hits", () => {
    const simulator = createSimulator(policy);
    const trace = [7, 7, 7].map((address) => simulator.access(address));

    expect(trace.map((entry) => entry.result)).toEqual(["miss", "hit", "hit"]);
    expect(trace.map((entry) => entry.selectedSlot)).toEqual([0, 0, 0]);
    expect(simulator.getCacheState()[0]).toMatchObject({
      blockAddress: 7,
      insertedAt: 1,
      lastAccessAt: 3,
    });
  });
});

describe("LRU replacement", () => {
  it("evicts the least recently accessed block after a repeated hit", () => {
    const simulator = createSimulator(lruPolicy);
    [0, 1, 2, 3, 0].forEach((address) => simulator.access(address));

    const replacement = simulator.access(4);

    expect(replacement).toMatchObject({
      selectedSlot: 1,
      evictedBlock: 1,
      selectionReason: "replacement-policy",
    });
    expect(replacement.recencyBefore.map((entry) => entry.blockAddress)).toEqual([
      0,
      3,
      2,
      1,
    ]);
    expect(replacement.replacementExplanation).toContain("lastAccessAt=2");
    expect(replacement.replacementExplanation).toContain("least recent");
  });
});

describe("MRU replacement", () => {
  it("evicts the most recently accessed block after a repeated hit", () => {
    const simulator = createSimulator(mruPolicy);
    [0, 1, 2, 3, 0].forEach((address) => simulator.access(address));

    const replacement = simulator.access(4);

    expect(replacement).toMatchObject({
      selectedSlot: 0,
      evictedBlock: 0,
      selectionReason: "replacement-policy",
    });
    expect(replacement.recencyBefore[0]).toMatchObject({
      blockAddress: 0,
      lastAccessAt: 5,
    });
    expect(replacement.replacementExplanation).toContain("lastAccessAt=5");
    expect(replacement.replacementExplanation).toContain("most recent");
  });
});

describe("policy determinism and supported sizes", () => {
  it("uses the lowest slot index as the fallback for an artificial recency tie", () => {
    const tiedCache: CacheSnapshot = [0, 1, 2, 3].map((slotIndex) => ({
      slotIndex,
      valid: true,
      blockAddress: slotIndex + 10,
      insertedAt: 1,
      lastAccessAt: 5,
    }));
    const context = { cache: tiedCache, requestedBlock: 99, accessNumber: 6 };

    expect(lruPolicy.selectVictim(context).slotIndex).toBe(0);
    expect(mruPolicy.selectVictim(context).slotIndex).toBe(0);
  });

  it.each([
    ["LRU", lruPolicy, 0],
    ["MRU", mruPolicy, 5],
  ] as const)(
    "%s selects the expected victim in a 16-line cache",
    (_, policy, expectedVictim) => {
      const simulator = createSimulator(policy, 16);
      Array.from({ length: 16 }, (_, address) => address).forEach((address) =>
        simulator.access(address),
      );
      simulator.access(5);

      expect(simulator.access(20).evictedBlock).toBe(expectedVictim);
    },
  );
});

describe("LRU and MRU comparison", () => {
  it("runs both policies from empty caches using the exact same sequence", () => {
    const sourceSequence = [0, 1, 2, 3, 0, 4];
    const comparison = compareReplacementPolicies(
      minimumConfiguration,
      sourceSequence,
    );
    sourceSequence[0] = 99;

    expect(comparison.inputSequence).toEqual([0, 1, 2, 3, 0, 4]);
    expect(comparison.lru.inputSequence).toEqual(comparison.inputSequence);
    expect(comparison.mru.inputSequence).toEqual(comparison.inputSequence);
    expect(comparison.lru.trace).toHaveLength(comparison.inputSequence.length);
    expect(comparison.mru.trace).toHaveLength(comparison.inputSequence.length);
    expect(comparison.lru.trace.at(-1)?.evictedBlock).toBe(1);
    expect(comparison.mru.trace.at(-1)?.evictedBlock).toBe(0);
  });
});
