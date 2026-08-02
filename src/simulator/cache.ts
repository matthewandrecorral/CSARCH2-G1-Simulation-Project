/** Pure cache-state helpers. Every mutating operation returns a fresh snapshot. */
import type {
  CacheLine,
  CacheSnapshot,
  RecencyEntry,
} from "./types";

/** Create an all-invalid snapshot with stable ascending physical slot indexes. */
export function createEmptyCache(cacheBlockCount: number): CacheSnapshot {
  return Array.from(
    { length: cacheBlockCount },
    (_, slotIndex): CacheLine => ({
      slotIndex,
      valid: false,
      blockAddress: null,
      insertedAt: null,
      lastAccessAt: null,
    }),
  );
}

/** Deep-copy cache lines so recorded and returned states remain isolated. */
export function cloneCache(cache: CacheSnapshot): CacheSnapshot {
  // Clone every line so callers cannot mutate a snapshot retained by the trace.
  return cache.map((line): CacheLine => ({ ...line }));
}

/** Find a resident block without computing an index, as required by FA mapping. */
export function findBlockSlot(
  cache: CacheSnapshot,
  blockAddress: number,
): number | null {
  const line = cache.find(
    (candidate) => candidate.valid && candidate.blockAddress === blockAddress,
  );

  return line?.slotIndex ?? null;
}

/** Return the lowest-numbered invalid slot, or null when the cache is full. */
export function findFirstEmptySlot(cache: CacheSnapshot): number | null {
  // Cache construction preserves ascending slot order, satisfying the required
  // lowest-numbered-empty-slot rule without a second sorting pass.
  return cache.find((line) => !line.valid)?.slotIndex ?? null;
}

/** Record a hit by updating only the selected line's last-access tick. */
export function touchCacheLine(
  cache: CacheSnapshot,
  slotIndex: number,
  accessNumber: number,
): CacheSnapshot {
  return cache.map((line): CacheLine => {
    if (line.slotIndex !== slotIndex) {
      return { ...line };
    }

    if (!line.valid) {
      throw new Error(`Cannot record a hit in empty cache slot ${slotIndex}.`);
    }

    return { ...line, lastAccessAt: accessNumber };
  });
}

/** Load or replace a block and mark the access as both insertion and recency. */
export function loadBlockIntoSlot(
  cache: CacheSnapshot,
  slotIndex: number,
  blockAddress: number,
  accessNumber: number,
): CacheSnapshot {
  if (!cache.some((line) => line.slotIndex === slotIndex)) {
    throw new RangeError(`Cache slot ${slotIndex} does not exist.`);
  }

  return cache.map((line): CacheLine =>
    line.slotIndex === slotIndex
      ? {
          slotIndex,
          valid: true,
          blockAddress,
          insertedAt: accessNumber,
          lastAccessAt: accessNumber,
        }
      : { ...line },
  );
}

/** Produce deterministic MRU-to-LRU ordering for trace explanations. */
export function getRecencyOrder(cache: CacheSnapshot): readonly RecencyEntry[] {
  // Most-recent first; slot index makes even malformed tied state deterministic.
  return cache
    .filter((line) => line.valid)
    .map((line) => ({
      slotIndex: line.slotIndex,
      blockAddress: line.blockAddress,
      lastAccessAt: line.lastAccessAt,
    }))
    .sort(
      (left, right) =>
        right.lastAccessAt - left.lastAccessAt || left.slotIndex - right.slotIndex,
    );
}
