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
