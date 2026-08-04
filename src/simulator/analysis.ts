/**
 * Derived analytics beyond the seven required statistics, computed directly
 * from a recorded trace so the engine stays the single source of truth.
 */
import type { AccessResult, SimulationResult, TraceEntry } from "./types";

/** Trace-derived counts and streaks for one completed policy run. */
export type ExtendedRunAnalytics = {
  readonly evictionCount: number;
  readonly emptySlotLoadCount: number;
  readonly longestHitStreak: number;
  readonly longestMissStreak: number;
  readonly uniqueBlocksAccessed: number;
};

function longestStreak(trace: readonly TraceEntry[], result: AccessResult): number {
  let longest = 0;
  let current = 0;

  trace.forEach((entry) => {
    if (entry.result === result) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  });

  return longest;
}

/** Summarize evictions, empty-slot loads, streaks, and coverage from a trace. */
export function calculateExtendedAnalytics(
  simulation: Pick<SimulationResult, "trace">,
): ExtendedRunAnalytics {
  const { trace } = simulation;
  const evictionCount = trace.reduce(
    (count, entry) => count + Number(entry.evictedBlock !== null),
    0,
  );
  const emptySlotLoadCount = trace.reduce(
    (count, entry) => count + Number(entry.result === "miss" && entry.evictedBlock === null),
    0,
  );
  const uniqueBlocksAccessed = new Set(trace.map((entry) => entry.requestedBlock)).size;

  return {
    evictionCount,
    emptySlotLoadCount,
    longestHitStreak: longestStreak(trace, "hit"),
    longestMissStreak: longestStreak(trace, "miss"),
    uniqueBlocksAccessed,
  };
}

/** True when two trace entries for the same access represent the same decision. */
export function sameOutcome(a: TraceEntry, b: TraceEntry): boolean {
  return (
    a.result === b.result
    && a.selectedSlot === b.selectedSlot
    && a.evictedBlock === b.evictedBlock
  );
}

/** Zero-based index of the first access where LRU and MRU decisions differ. */
export function findFirstDivergenceIndex(
  lruTrace: readonly TraceEntry[],
  mruTrace: readonly TraceEntry[],
): number | null {
  const length = Math.min(lruTrace.length, mruTrace.length);

  for (let index = 0; index < length; index += 1) {
    if (!sameOutcome(lruTrace[index], mruTrace[index])) {
      return index;
    }
  }

  return null;
}

/** Total number of accesses where LRU and MRU produced different outcomes. */
export function countDivergences(
  lruTrace: readonly TraceEntry[],
  mruTrace: readonly TraceEntry[],
): number {
  const length = Math.min(lruTrace.length, mruTrace.length);
  let count = 0;

  for (let index = 0; index < length; index += 1) {
    if (!sameOutcome(lruTrace[index], mruTrace[index])) {
      count += 1;
    }
  }

  return count;
}
