import type {
  CacheLine,
  CacheSnapshot,
  RecencyEntry,
} from "./types";

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

export function cloneCache(cache: CacheSnapshot): CacheSnapshot {
  return cache.map((line): CacheLine => ({ ...line }));
}

export function findBlockSlot(
  cache: CacheSnapshot,
  blockAddress: number,
): number | null {
  const line = cache.find(
    (candidate) => candidate.valid && candidate.blockAddress === blockAddress,
  );

  return line?.slotIndex ?? null;
}

export function findFirstEmptySlot(cache: CacheSnapshot): number | null {
  return cache.find((line) => !line.valid)?.slotIndex ?? null;
}

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

export function getRecencyOrder(cache: CacheSnapshot): readonly RecencyEntry[] {
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
