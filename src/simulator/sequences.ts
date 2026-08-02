/** Required assignment workloads plus deterministic seeded random generation. */
import { MAIN_MEMORY_BLOCK_COUNT } from "./types";
import { validateCacheConfiguration } from "./validation";

export const RANDOM_SEQUENCE_LENGTH = 64;

export class SequenceGenerationError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = "SequenceGenerationError";
  }
}

function assertValidPatternCacheBlockCount(cacheBlockCount: unknown): number {
  const validation = validateCacheConfiguration({
    blockSizeWords: 2,
    cacheBlockCount,
  });

  if (!validation.valid) {
    const cacheIssue = validation.issues.find(
      (issue) => issue.field === "cacheBlockCount",
    );
    throw new SequenceGenerationError(
      cacheIssue?.message ?? "Cache block count is invalid.",
    );
  }

  const count = validation.value.cacheBlockCount;

  // Both prescribed patterns reference 2n - 1, so n above 512 would address
  // beyond the fixed 1,024-block main memory.
  if (count * 2 > MAIN_MEMORY_BLOCK_COUNT) {
    throw new SequenceGenerationError(
      `The required 0 through 2n - 1 pattern exceeds the ${MAIN_MEMORY_BLOCK_COUNT}-block main memory when n is greater than ${MAIN_MEMORY_BLOCK_COUNT / 2}.`,
    );
  }

  return count;
}

function ascendingRange(lastValue: number): number[] {
  return Array.from({ length: lastValue + 1 }, (_, value) => value);
}

function descendingRange(firstValue: number): number[] {
  return Array.from({ length: firstValue + 1 }, (_, offset) => firstValue - offset);
}

export function generateSequentialSequence(
  cacheBlockCount: unknown,
): readonly number[] {
  const count = assertValidPatternCacheBlockCount(cacheBlockCount);
  const pass = ascendingRange(2 * count - 1);

  return [...pass, ...pass];
}

export function generateMidRepeatReverseSequence(
  cacheBlockCount: unknown,
): readonly number[] {
  const count = assertValidPatternCacheBlockCount(cacheBlockCount);
  const firstHalfAscending = ascendingRange(count - 1);
  const fullAscending = ascendingRange(2 * count - 1);
  const firstHalfDescending = descendingRange(count - 1);
  const fullDescending = descendingRange(2 * count - 1);

  // Assignment order: half ascending, full ascending twice, half descending,
  // then full descending twice. The resulting sequence has length 10n.
  return [
    ...firstHalfAscending,
    ...fullAscending,
    ...fullAscending,
    ...firstHalfDescending,
    ...fullDescending,
    ...fullDescending,
  ];
}

function hashSeed(seed: string): number {
  // FNV-1a converts an arbitrary text seed into a stable unsigned 32-bit state.
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function createMulberry32(seed: number): () => number {
  // Mulberry32 is small and deterministic; output is normalized to [0, 1).
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function generateRandomSequence(
  seedInput?: string | null,
): readonly number[] {
  const normalizedSeed = seedInput?.trim() ?? "";
  const random =
    normalizedSeed.length > 0
      ? createMulberry32(hashSeed(normalizedSeed))
      : Math.random;

  return Array.from({ length: RANDOM_SEQUENCE_LENGTH }, () =>
    Math.floor(random() * MAIN_MEMORY_BLOCK_COUNT),
  );
}
