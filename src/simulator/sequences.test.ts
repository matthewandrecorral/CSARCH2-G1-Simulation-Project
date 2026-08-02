import { afterEach, describe, expect, it, vi } from "vitest";

import { MemoryBlockSequenceError } from "./validation";
import { compareReplacementPolicies } from "./comparison";
import {
  RANDOM_SEQUENCE_LENGTH,
  SequenceGenerationError,
  generateMidRepeatReverseSequence,
  generateRandomSequence,
  generateSequentialSequence,
} from "./sequences";

describe("required deterministic sequences", () => {
  it("generates the exact sequential assignment example for n = 4", () => {
    expect(generateSequentialSequence(4)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it("generates the exact mid-repeat and reverse example for n = 4", () => {
    expect(generateMidRepeatReverseSequence(4)).toEqual([
      0, 1, 2, 3,
      0, 1, 2, 3, 4, 5, 6, 7,
      0, 1, 2, 3, 4, 5, 6, 7,
      3, 2, 1, 0,
      7, 6, 5, 4, 3, 2, 1, 0,
      7, 6, 5, 4, 3, 2, 1, 0,
    ]);
  });

  it("generates the required lengths and valid values for n = 16", () => {
    const sequential = generateSequentialSequence(16);
    const midRepeatReverse = generateMidRepeatReverseSequence(16);

    expect(sequential).toHaveLength(64);
    expect(midRepeatReverse).toHaveLength(160);
    expect([...sequential, ...midRepeatReverse].every(
      (address) => Number.isInteger(address) && address >= 0 && address <= 1_023,
    )).toBe(true);
  });

  it.each([2, 3, 6, 1_024])(
    "rejects cache count %s when the required pattern cannot be valid",
    (cacheBlockCount) => {
      expect(() => generateSequentialSequence(cacheBlockCount)).toThrow(
        SequenceGenerationError,
      );
      expect(() => generateMidRepeatReverseSequence(cacheBlockCount)).toThrow(
        SequenceGenerationError,
      );
    },
  );
});

describe("random sequence", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates exactly 64 valid main-memory block addresses", () => {
    const sequence = generateRandomSequence();

    expect(sequence).toHaveLength(RANDOM_SEQUENCE_LENGTH);
    expect(sequence.every(
      (address) => Number.isInteger(address) && address >= 0 && address <= 1_023,
    )).toBe(true);
  });

  it("reproduces a stable sequence from the same trimmed seed", () => {
    const first = generateRandomSequence(" group-1-machine-6 ");
    const second = generateRandomSequence("group-1-machine-6");

    expect(first).toEqual(second);
    expect(first.slice(0, 8)).toEqual([
      221, 672, 313, 1_009, 797, 607, 228, 979,
    ]);
  });

  it("uses non-seeded randomness for a blank seed", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.25);

    expect(generateRandomSequence("   ")).toEqual(
      Array(RANDOM_SEQUENCE_LENGTH).fill(256),
    );
    expect(randomSpy).toHaveBeenCalledTimes(RANDOM_SEQUENCE_LENGTH);
  });
});

describe("comparison sequence validation", () => {
  it.each([
    [[], "at least one"],
    [[0, 1_024], "Access 2"],
    [[0, 2.5], "Access 2"],
  ])("rejects invalid comparison sequence %j", (sequence, message) => {
    expect(() =>
      compareReplacementPolicies(
        { blockSizeWords: 2, cacheBlockCount: 4 },
        sequence,
      ),
    ).toThrowError(new RegExp(message));
    expect(() =>
      compareReplacementPolicies(
        { blockSizeWords: 2, cacheBlockCount: 4 },
        sequence,
      ),
    ).toThrow(MemoryBlockSequenceError);
  });
});
