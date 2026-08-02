/**
 * Shared domain model for the browser-independent cache simulator.
 * Keeping these types free of React makes the engine reusable and directly testable.
 */
export const MAIN_MEMORY_BLOCK_COUNT = 1_024;

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

export type OccupiedCacheLine = {
  readonly slotIndex: number;
  readonly valid: true;
  readonly blockAddress: number;
  readonly insertedAt: number;
  readonly lastAccessAt: number;
};

export type CacheLine = EmptyCacheLine | OccupiedCacheLine;
export type CacheSnapshot = readonly CacheLine[];

export type RecencyEntry = {
  readonly slotIndex: number;
  readonly blockAddress: number;
  readonly lastAccessAt: number;
};

export type ReplacementContext = {
  readonly cache: CacheSnapshot;
  readonly requestedBlock: number;
  readonly accessNumber: number;
};

export type ReplacementDecision = {
  readonly slotIndex: number;
  readonly explanation: string;
};

export interface ReplacementPolicy {
  readonly name: string;
  selectVictim(context: ReplacementContext): ReplacementDecision;
}

export type AccessResult = "hit" | "miss";
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

export type SimulationResult = {
  readonly policyName: string;
  readonly configuration: CacheConfiguration;
  readonly inputSequence: readonly number[];
  readonly trace: readonly TraceEntry[];
  readonly finalCache: CacheSnapshot;
};

export type PolicyComparisonResult = {
  readonly inputSequence: readonly number[];
  readonly lru: SimulationResult;
  readonly mru: SimulationResult;
};
