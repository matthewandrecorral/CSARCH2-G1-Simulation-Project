/** Read-policy latency formulas and aggregate simulation statistics. */
import type { AccessResult, SimulationResult } from "./types";

/** Supported CPU-visible cache-read timing interpretations. */
export type ReadPolicy = "load-through" | "non-load-through";

/** Validated latency inputs in nanoseconds. */
export type TimingConfiguration = {
  readonly readPolicy: ReadPolicy;
  readonly cacheAccessTimeNs: number;
  readonly mainMemoryBlockFetchTimeNs: number;
};

/** Untrusted form values accepted by the timing validator. */
export type TimingConfigurationInput = {
  readonly readPolicy: unknown;
  readonly cacheAccessTimeNs: unknown;
  readonly mainMemoryBlockFetchTimeNs: unknown;
};

/** Field-specific timing error displayed beside the corresponding control. */
export type TimingValidationIssue = {
  readonly field: keyof TimingConfiguration;
  readonly message: string;
};

/** Discriminated success/failure result for timing validation. */
export type TimingValidationResult =
  | {
      readonly valid: true;
      readonly value: TimingConfiguration;
      readonly issues: readonly TimingValidationIssue[];
    }
  | {
      readonly valid: false;
      readonly issues: readonly TimingValidationIssue[];
    };

/** Seven required statistics plus reusable per-access latency details. */
export type SimulationStatistics = {
  readonly accessCount: number;
  readonly hitCount: number;
  readonly missCount: number;
  readonly hitRate: number;
  readonly missRate: number;
  readonly hitTimeNs: number;
  readonly missTimeNs: number;
  readonly totalAccessTimeNs: number;
  readonly averageAccessTimeNs: number;
  readonly accessLatenciesNs: readonly number[];
};

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/** Validate read policy and positive finite timing inputs without coercion. */
export function validateTimingConfiguration(
  input: TimingConfigurationInput,
): TimingValidationResult {
  const issues: TimingValidationIssue[] = [];

  if (input.readPolicy !== "load-through" && input.readPolicy !== "non-load-through") {
    issues.push({
      field: "readPolicy",
      message: "Choose load-through or non-load-through.",
    });
  }

  if (!isPositiveFiniteNumber(input.cacheAccessTimeNs)) {
    issues.push({
      field: "cacheAccessTimeNs",
      message: "Cache access time must be a positive finite number.",
    });
  }

  if (!isPositiveFiniteNumber(input.mainMemoryBlockFetchTimeNs)) {
    issues.push({
      field: "mainMemoryBlockFetchTimeNs",
      message: "Memory block fetch time must be a positive finite number.",
    });
  }

  if (issues.length > 0) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    value: {
      readPolicy: input.readPolicy as ReadPolicy,
      cacheAccessTimeNs: input.cacheAccessTimeNs as number,
      mainMemoryBlockFetchTimeNs: input.mainMemoryBlockFetchTimeNs as number,
    },
    issues: [],
  };
}

/** Apply the documented hit or selected read-policy miss formula. */
export function getAccessLatencyNs(
  result: AccessResult,
  timing: TimingConfiguration,
): number {
  if (result === "hit") {
    return timing.cacheAccessTimeNs;
  }

  // Non-load-through waits for the fill and then performs one additional cache
  // access; load-through forwards the requested word during the fill.
  const secondCacheAccess = timing.readPolicy === "non-load-through"
    ? timing.cacheAccessTimeNs
    : 0;

  return timing.cacheAccessTimeNs
    + timing.mainMemoryBlockFetchTimeNs
    + secondCacheAccess;
}

/** Derive counts, rates, total time, and AMAT from a recorded simulation trace. */
export function calculateSimulationStatistics(
  simulation: Pick<SimulationResult, "trace">,
  timing: TimingConfiguration,
): SimulationStatistics {
  // Calculate from the recorded trace so displayed totals cannot drift from
  // the hit/miss decisions made by the cache engine.
  const accessLatenciesNs = simulation.trace.map((entry) =>
    getAccessLatencyNs(entry.result, timing),
  );
  const accessCount = simulation.trace.length;
  const hitCount = simulation.trace.reduce(
    (count, entry) => count + Number(entry.result === "hit"),
    0,
  );
  const missCount = accessCount - hitCount;
  const totalAccessTimeNs = accessLatenciesNs.reduce(
    (total, latency) => total + latency,
    0,
  );

  return {
    accessCount,
    hitCount,
    missCount,
    hitRate: accessCount === 0 ? 0 : hitCount / accessCount,
    missRate: accessCount === 0 ? 0 : missCount / accessCount,
    hitTimeNs: timing.cacheAccessTimeNs,
    missTimeNs: getAccessLatencyNs("miss", timing),
    totalAccessTimeNs,
    averageAccessTimeNs: accessCount === 0 ? 0 : totalAccessTimeNs / accessCount,
    accessLatenciesNs,
  };
}
