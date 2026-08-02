/** Covers custom-input parsing and immutable playback boundary behavior. */
import { describe, expect, it } from "vitest";

import {
  clampPlaybackStep,
  getCacheSnapshotAtStep,
  getTraceEntryAtStep,
  parseCustomSequence,
} from "./application";
import { compareReplacementPolicies } from "./simulator/comparison";

describe("custom sequence parsing", () => {
  it("accepts comma and whitespace separators while preserving duplicates", () => {
    expect(parseCustomSequence("0, 1  1\n1023")).toEqual({
      valid: true,
      sequence: [0, 1, 1, 1023],
    });
  });

  it("reports empty, malformed, decimal, and out-of-range tokens", () => {
    expect(parseCustomSequence("   ")).toEqual({
      valid: false,
      errors: ["Enter at least one memory block address."],
    });
    expect(parseCustomSequence("0,,1")).toEqual({
      valid: false,
      errors: ["The custom sequence contains an empty comma-separated token."],
    });

    const result = parseCustomSequence("2.5 word -1 1024");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toHaveLength(4);
      expect(result.errors[0]).toContain("Token 1");
      expect(result.errors[1]).toContain("Token 2");
      expect(result.errors[2]).toContain("between 0 and 1023");
      expect(result.errors[3]).toContain("between 0 and 1023");
    }
  });
});

describe("playback snapshot selection", () => {
  const comparison = compareReplacementPolicies(
    { blockSizeWords: 4, cacheBlockCount: 4 },
    [0, 1, 2, 3, 0, 4],
  );

  it("clamps navigation to the recorded timeline", () => {
    expect(clampPlaybackStep(-2, 6)).toBe(0);
    expect(clampPlaybackStep(3.8, 6)).toBe(3);
    expect(clampPlaybackStep(99, 6)).toBe(6);
    expect(clampPlaybackStep(Number.NaN, 6)).toBe(0);
  });

  it("restores the exact initial, intermediate, and final snapshots", () => {
    const initial = getCacheSnapshotAtStep(comparison.lru, 0, 4);
    const intermediate = getCacheSnapshotAtStep(comparison.lru, 2, 4);
    const final = getCacheSnapshotAtStep(comparison.lru, 6, 4);

    expect(initial.every((line) => !line.valid)).toBe(true);
    expect(intermediate).toEqual(comparison.lru.trace[1].cacheAfter);
    expect(final).toEqual(comparison.lru.finalCache);
    expect(getTraceEntryAtStep(comparison.lru, 2)).toEqual(
      comparison.lru.trace[1],
    );
  });

  it("keeps LRU and MRU snapshots independently selectable when victims diverge", () => {
    const lruFinal = getCacheSnapshotAtStep(comparison.lru, 6, 4);
    const mruFinal = getCacheSnapshotAtStep(comparison.mru, 6, 4);

    expect(lruFinal).not.toEqual(mruFinal);
    expect(comparison.lru.trace[5].evictedBlock).toBe(1);
    expect(comparison.mru.trace[5].evictedBlock).toBe(0);
  });
});
