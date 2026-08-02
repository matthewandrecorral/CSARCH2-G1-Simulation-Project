/**
 * Shared domain model for the browser-independent cache simulator.
 * Keeping these types free of React makes the engine reusable and directly testable.
 */
export const MAIN_MEMORY_BLOCK_COUNT = 1_024;

/** Validated geometry shared by every simulator run. */
export type CacheConfiguration = {
  readonly blockSizeWords: number;
  readonly cacheBlockCount: number;
  readonly mainMemoryBlockCount: typeof MAIN_MEMORY_BLOCK_COUNT;
};

// The valid flag forms a discriminated union: empty lines cannot accidentally
// carry stale block addresses or recency timestamps in valid TypeScript state.
export type EmptyCacheLine = {
  readonly slotIndex: number;
  readonly valid: false;
  readonly blockAddress: null;
  readonly insertedAt: null;
  readonly lastAccessAt: null;
};

/** Resident cache line with insertion and most-recent-access ticks. */
export type OccupiedCacheLine = {
  readonly slotIndex: number;
  readonly valid: true;
  readonly blockAddress: number;
  readonly insertedAt: number;
  readonly lastAccessAt: number;
};

export type CacheLine = EmptyCacheLine | OccupiedCacheLine;

/** Read-only point-in-time cache state ordered by physical slot index. */
export type CacheSnapshot = readonly CacheLine[];

/** Compact occupied-line record used to explain replacement order. */
export type RecencyEntry = {
  readonly slotIndex: number;
  readonly blockAddress: number;
  readonly lastAccessAt: number;
};

/** Isolated state supplied to a replacement strategy on a full-cache miss. */
export type ReplacementContext = {
  readonly cache: CacheSnapshot;
  readonly requestedBlock: number;
  readonly accessNumber: number;
};

/** Policy-selected victim and its human-readable justification. */
export type ReplacementDecision = {
  readonly slotIndex: number;
  readonly explanation: string;
};

/** Strategy contract that keeps LRU/MRU logic independent of the cache engine. */
export interface ReplacementPolicy {
  readonly name: string;
  selectVictim(context: ReplacementContext): ReplacementDecision;
}

export type AccessResult = "hit" | "miss";

/** Records whether a slot came from a hit, an empty line, or replacement. */
export type SelectionReason = "hit" | "empty-slot" | "replacement-policy";

/** Complete evidence for one access, including immutable before/after states. */
export type TraceEntry = {
  readonly accessNumber: number;
  readonly requestedBlock: number;
  readonly result: AccessResult;
  readonly selectedSlot: number;
  readonly evictedBlock: number | null;
  readonly selectionReason: SelectionReason;
  readonly replacementExplanation: string | null;
  readonly cacheBefore: CacheSnapshot;
  readonly cacheAfter: CacheSnapshot;
  readonly recencyBefore: readonly RecencyEntry[];
  readonly recencyAfter: readonly RecencyEntry[];
};

/** Complete output of one policy after consuming a validated access sequence. */
export type SimulationResult = {
  readonly policyName: string;
  readonly configuration: CacheConfiguration;
  readonly inputSequence: readonly number[];
  readonly trace: readonly TraceEntry[];
  readonly finalCache: CacheSnapshot;
};

/** Synchronized LRU/MRU results generated from the same immutable input. */
export type PolicyComparisonResult = {
  readonly inputSequence: readonly number[];
  readonly lru: SimulationResult;
  readonly mru: SimulationResult;
};
