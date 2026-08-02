/**
 * State machine for one fully associative cache and one replacement policy.
 * Timing is intentionally separate because it never changes cache residency.
 */
import {
  cloneCache,
  createEmptyCache,
  findBlockSlot,
  findFirstEmptySlot,
  getRecencyOrder,
  loadBlockIntoSlot,
  touchCacheLine,
} from "./cache";
import type {
  CacheConfiguration,
  CacheSnapshot,
  RecencyEntry,
  ReplacementDecision,
  ReplacementPolicy,
  TraceEntry,
} from "./types";
import {
  CacheConfigurationError,
  assertValidMemoryBlockAddress,
  validateCacheConfiguration,
  type CacheConfigurationInput,
} from "./validation";

export class ReplacementPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplacementPolicyError";
  }
}

function cloneRecency(entries: readonly RecencyEntry[]): readonly RecencyEntry[] {
  return entries.map((entry) => ({ ...entry }));
}

function cloneTraceEntry(entry: TraceEntry): TraceEntry {
  return {
    ...entry,
    cacheBefore: cloneCache(entry.cacheBefore),
    cacheAfter: cloneCache(entry.cacheAfter),
    recencyBefore: cloneRecency(entry.recencyBefore),
    recencyAfter: cloneRecency(entry.recencyAfter),
  };
}

function validateReplacementDecision(
  decision: ReplacementDecision,
  cache: CacheSnapshot,
  policyName: string,
): void {
  // A policy is an injected strategy, so validate its result before committing
  // any state change. This protects trace integrity from faulty policies.
  if (!Number.isSafeInteger(decision.slotIndex)) {
    throw new ReplacementPolicyError(
      `${policyName} returned a non-integer cache slot.`,
    );
  }

  const selectedLine = cache.find(
    (line) => line.slotIndex === decision.slotIndex,
  );

  if (!selectedLine || !selectedLine.valid) {
    throw new ReplacementPolicyError(
      `${policyName} must select an occupied cache slot.`,
    );
  }

  if (decision.explanation.trim().length === 0) {
    throw new ReplacementPolicyError(
      `${policyName} must explain its replacement decision.`,
    );
  }
}

export class FullyAssociativeCacheSimulator {
  readonly configuration: CacheConfiguration;
  readonly replacementPolicyName: string;

  private cache: CacheSnapshot;
  private readonly replacementPolicy: ReplacementPolicy;
  private readonly trace: TraceEntry[] = [];
  private readonly accessHistory: number[] = [];

  constructor(
    configuration: CacheConfigurationInput,
    replacementPolicy: ReplacementPolicy,
  ) {
    const validation = validateCacheConfiguration(configuration);

    if (!validation.valid) {
      throw new CacheConfigurationError(validation.issues);
    }

    if (replacementPolicy.name.trim().length === 0) {
      throw new ReplacementPolicyError("Replacement policy must have a name.");
    }

    this.configuration = { ...validation.value };
    this.replacementPolicy = replacementPolicy;
    this.replacementPolicyName = replacementPolicy.name;
    this.cache = createEmptyCache(this.configuration.cacheBlockCount);
  }

  getCacheState(): CacheSnapshot {
    // Public getters never expose the engine's live mutable references.
    return cloneCache(this.cache);
  }

  getAccessHistory(): readonly number[] {
    return [...this.accessHistory];
  }

  getTrace(): readonly TraceEntry[] {
    return this.trace.map(cloneTraceEntry);
  }

  access(blockAddressInput: unknown): TraceEntry {
    const requestedBlock = assertValidMemoryBlockAddress(blockAddressInput);
    const accessNumber = this.accessHistory.length + 1;
    const cacheBefore = cloneCache(this.cache);
    const recencyBefore = getRecencyOrder(cacheBefore);
    const hitSlot = findBlockSlot(cacheBefore, requestedBlock);

    let selectedSlot: number;
    let evictedBlock: number | null = null;
    let selectionReason: TraceEntry["selectionReason"];
    let replacementExplanation: string | null = null;

    // Fully associative lookup has three mutually exclusive outcomes: hit,
    // miss with an empty slot, or miss requiring policy-selected replacement.
    if (hitSlot !== null) {
      selectedSlot = hitSlot;
      selectionReason = "hit";
      this.cache = touchCacheLine(cacheBefore, selectedSlot, accessNumber);
    } else {
      const emptySlot = findFirstEmptySlot(cacheBefore);

      if (emptySlot !== null) {
        selectedSlot = emptySlot;
        selectionReason = "empty-slot";
      } else {
        const decision = this.replacementPolicy.selectVictim({
          // Give policies an isolated view so they cannot mutate engine state.
          cache: cloneCache(cacheBefore),
          requestedBlock,
          accessNumber,
        });

        validateReplacementDecision(
          decision,
          cacheBefore,
          this.replacementPolicy.name,
        );

        selectedSlot = decision.slotIndex;
        selectionReason = "replacement-policy";
        replacementExplanation = decision.explanation;
        evictedBlock = cacheBefore[selectedSlot].blockAddress;
      }

      this.cache = loadBlockIntoSlot(
        cacheBefore,
        selectedSlot,
        requestedBlock,
        accessNumber,
      );
    }

    // Store enough evidence to replay backward by selecting snapshots rather
    // than attempting to reverse cache operations.
    const entry: TraceEntry = {
      accessNumber,
      requestedBlock,
      result: hitSlot === null ? "miss" : "hit",
      selectedSlot,
      evictedBlock,
      selectionReason,
      replacementExplanation,
      cacheBefore,
      cacheAfter: cloneCache(this.cache),
      recencyBefore,
      recencyAfter: getRecencyOrder(this.cache),
    };

    this.accessHistory.push(requestedBlock);
    this.trace.push(entry);

    return cloneTraceEntry(entry);
  }
}
