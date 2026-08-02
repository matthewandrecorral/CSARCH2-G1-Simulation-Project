import type { AccessResult, SimulationResult } from "./types";

export type ReadPolicy = "load-through" | "non-load-through";

export type TimingConfiguration = {
  readonly readPolicy: ReadPolicy;
  readonly cacheAccessTimeNs: number;
  readonly mainMemoryBlockFetchTimeNs: number;
};

export type TimingConfigurationInput = {
  readonly readPolicy: unknown;
  readonly cacheAccessTimeNs: unknown;
  readonly mainMemoryBlockFetchTimeNs: unknown;
};

export type TimingValidationIssue = {
  readonly field: keyof TimingConfiguration;
  readonly message: string;
};

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

export function getAccessLatencyNs(
  result: AccessResult,
  timing: TimingConfiguration,
): number {
  if (result === "hit") {
    return timing.cacheAccessTimeNs;
  }

  const secondCacheAccess = timing.readPolicy === "non-load-through"
    ? timing.cacheAccessTimeNs
    : 0;

  return timing.cacheAccessTimeNs
    + timing.mainMemoryBlockFetchTimeNs
    + secondCacheAccess;
}

export function calculateSimulationStatistics(
  simulation: Pick<SimulationResult, "trace">,
  timing: TimingConfiguration,
): SimulationStatistics {
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
