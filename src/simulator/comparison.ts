/** Runs LRU and MRU against the exact same validated workload. */
import { FullyAssociativeCacheSimulator } from "./engine";
import { lruPolicy } from "./policies/lru";
import { mruPolicy } from "./policies/mru";
import type {
  PolicyComparisonResult,
  SimulationResult,
} from "./types";
import {
  assertValidMemoryBlockSequence,
  type CacheConfigurationInput,
} from "./validation";

function createSimulationResult(
  simulator: FullyAssociativeCacheSimulator,
): SimulationResult {
  return {
    policyName: simulator.replacementPolicyName,
    configuration: { ...simulator.configuration },
    inputSequence: simulator.getAccessHistory(),
    trace: simulator.getTrace(),
    finalCache: simulator.getCacheState(),
  };
}

export function compareReplacementPolicies(
  configuration: CacheConfigurationInput,
  sequenceInput: unknown,
): PolicyComparisonResult {
  // Validate and clone once before either policy starts so neither comparison
  // can receive a different or later-mutated sequence.
  const inputSequence = assertValidMemoryBlockSequence(sequenceInput);
  const lruSimulator = new FullyAssociativeCacheSimulator(
    configuration,
    lruPolicy,
  );
  const mruSimulator = new FullyAssociativeCacheSimulator(
    configuration,
    mruPolicy,
  );

  // Advance the two initially empty caches in lockstep.
  inputSequence.forEach((blockAddress) => {
    lruSimulator.access(blockAddress);
    mruSimulator.access(blockAddress);
  });

  return {
    inputSequence: [...inputSequence],
    lru: createSimulationResult(lruSimulator),
    mru: createSimulationResult(mruSimulator),
  };
}
