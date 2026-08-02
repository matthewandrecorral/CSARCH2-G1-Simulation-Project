/** UI-facing parsing and snapshot navigation helpers. */
import { createEmptyCache } from "./simulator/cache";
import type {
  CacheSnapshot,
  SimulationResult,
  TraceEntry,
} from "./simulator/types";
import { validateMemoryBlockAddress } from "./simulator/validation";

export type SequenceChoice = "sequential" | "mid-repeat" | "random" | "custom";
export type DisplayMode = "step" | "final";

export type SequenceParseResult =
  | { readonly valid: true; readonly sequence: readonly number[] }
  | { readonly valid: false; readonly errors: readonly string[] };

export function parseCustomSequence(input: string): SequenceParseResult {
  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    return {
      valid: false,
      errors: ["Enter at least one memory block address."],
    };
  }

  // Check comma groups before whitespace tokenization so inputs such as "1,,2"
  // produce a precise empty-token error instead of being silently normalized.
  const commaGroups = input.split(",");

  if (commaGroups.some((group) => group.trim().length === 0)) {
    return {
      valid: false,
      errors: ["The custom sequence contains an empty comma-separated token."],
    };
  }

  const tokens = commaGroups.flatMap((group) => group.trim().split(/\s+/));
  const errors: string[] = [];
  const sequence: number[] = [];

  tokens.forEach((token, index) => {
    if (!/^-?\d+$/.test(token)) {
      errors.push(
        `Token ${index + 1} ("${token}") must be a base-10 integer.`,
      );
      return;
    }

    const value = Number(token);
    const validation = validateMemoryBlockAddress(value);

    if (!validation.valid) {
      errors.push(`Token ${index + 1} ("${token}"): ${validation.issues[0].message}`);
      return;
    }

    sequence.push(validation.value);
  });

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, sequence };
}

export function clampPlaybackStep(step: number, totalSteps: number): number {
  if (!Number.isFinite(step) || !Number.isSafeInteger(totalSteps) || totalSteps < 0) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(step), 0), totalSteps);
}

export function getTraceEntryAtStep(
  result: SimulationResult | null,
  step: number,
): TraceEntry | null {
  if (!result || step <= 0) {
    return null;
  }

  const safeStep = clampPlaybackStep(step, result.trace.length);
  // Playback step zero is the pre-access state; trace entries are zero-indexed.
  return result.trace[safeStep - 1] ?? null;
}

export function getCacheSnapshotAtStep(
  result: SimulationResult | null,
  step: number,
  emptyCacheBlockCount: number,
): CacheSnapshot {
  if (!result) {
    return createEmptyCache(emptyCacheBlockCount);
  }

  // Backward navigation selects a recorded immutable snapshot. No cache
  // mutation needs to be inverted, which keeps replay deterministic.
  const entry = getTraceEntryAtStep(result, step);
  return entry?.cacheAfter ?? createEmptyCache(result.configuration.cacheBlockCount);
}
