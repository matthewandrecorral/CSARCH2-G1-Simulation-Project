/** Covers configuration, boundary-address, and whole-sequence validation rules. */
import { describe, expect, it } from "vitest";

import { MAIN_MEMORY_BLOCK_COUNT } from "./types";
import {
  validateCacheConfiguration,
  validateMemoryBlockAddress,
  validateMemoryBlockSequence,
} from "./validation";

describe("cache configuration validation", () => {
  it("accepts the minimum values and supplies the fixed memory size", () => {
    const result = validateCacheConfiguration({
      blockSizeWords: 2,
      cacheBlockCount: 4,
    });

    expect(result).toEqual({
      valid: true,
      value: {
        blockSizeWords: 2,
        cacheBlockCount: 4,
        mainMemoryBlockCount: MAIN_MEMORY_BLOCK_COUNT,
      },
      issues: [],
    });
  });

  it.each([
    [16, 16],
    [32, 2_048],
  ])(
    "accepts supported and larger powers of two (%i words, %i slots)",
    (blockSizeWords, cacheBlockCount) => {
      expect(
        validateCacheConfiguration({ blockSizeWords, cacheBlockCount }).valid,
      ).toBe(true);
    },
  );

  it.each([
    [1, 4, "blockSizeWords"],
    [3, 4, "blockSizeWords"],
    [2.5, 4, "blockSizeWords"],
    [2, 2, "cacheBlockCount"],
    [2, 6, "cacheBlockCount"],
    [2, 4.5, "cacheBlockCount"],
  ])(
    "rejects invalid geometry (%s words, %s slots)",
    (blockSizeWords, cacheBlockCount, expectedField) => {
      const result = validateCacheConfiguration({
        blockSizeWords,
        cacheBlockCount,
      });

      expect(result.valid).toBe(false);
      expect(result.issues.map((issue) => issue.field)).toContain(expectedField);
    },
  );

  it("rejects attempts to change the fixed main-memory size", () => {
    const result = validateCacheConfiguration({
      blockSizeWords: 2,
      cacheBlockCount: 4,
      mainMemoryBlockCount: 512,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ field: "mainMemoryBlockCount" }),
    );
  });
});

describe("memory block address validation", () => {
  it.each([0, 1, 1_023])("accepts valid address %i", (address) => {
    expect(validateMemoryBlockAddress(address)).toEqual({
      valid: true,
      value: address,
      issues: [],
    });
  });

  it.each([-1, 1_024, 2.5, Number.NaN, "4", null])(
    "rejects invalid address %s",
    (address) => {
      expect(validateMemoryBlockAddress(address).valid).toBe(false);
    },
  );
});

describe("memory block sequence validation", () => {
  it("preserves valid duplicates", () => {
    expect(validateMemoryBlockSequence([0, 1, 1, 1_023])).toEqual({
      valid: true,
      value: [0, 1, 1, 1_023],
      issues: [],
    });
  });

  it("reports every invalid position", () => {
    const result = validateMemoryBlockSequence([0, -1, 2.5, 1_024]);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual([
      "accessSequence[1]",
      "accessSequence[2]",
      "accessSequence[3]",
    ]);
  });
});
