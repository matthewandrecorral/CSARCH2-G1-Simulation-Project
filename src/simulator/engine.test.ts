import { describe, expect, it, vi } from "vitest";

import { FullyAssociativeCacheSimulator, ReplacementPolicyError } from "./engine";
import type { ReplacementPolicy } from "./types";
import {
  CacheConfigurationError,
  MemoryBlockAddressError,
} from "./validation";

function createNeverUsedPolicy(): ReplacementPolicy {
  return {
    name: "test-never-used",
    selectVictim: vi.fn(() => {
      throw new Error("Policy should not be called while an empty slot exists.");
    }),
  };
}

function createSimulator(policy = createNeverUsedPolicy()) {
  return new FullyAssociativeCacheSimulator(
    { blockSizeWords: 2, cacheBlockCount: 4 },
    policy,
  );
}

describe("fully associative simulator core", () => {
  it("starts with clear, indexed empty cache lines", () => {
    const simulator = createSimulator();

    expect(simulator.getCacheState()).toEqual(
      [0, 1, 2, 3].map((slotIndex) => ({
        slotIndex,
        valid: false,
        blockAddress: null,
        insertedAt: null,
        lastAccessAt: null,
      })),
    );
    expect(simulator.getAccessHistory()).toEqual([]);
    expect(simulator.getTrace()).toEqual([]);
  });

  it("uses the lowest-numbered empty slot and records a miss trace", () => {
    const policy = createNeverUsedPolicy();
    const simulator = createSimulator(policy);

    const first = simulator.access(12);
    const second = simulator.access(99);

    expect(first).toMatchObject({
      accessNumber: 1,
      requestedBlock: 12,
      result: "miss",
      selectedSlot: 0,
      evictedBlock: null,
      selectionReason: "empty-slot",
    });
    expect(second.selectedSlot).toBe(1);
    expect(second.recencyAfter.map((entry) => entry.blockAddress)).toEqual([
      99,
      12,
    ]);
    expect(policy.selectVictim).not.toHaveBeenCalled();
  });

  it("detects repeated hits and updates recency without reloading", () => {
    const simulator = createSimulator();
    simulator.access(8);
    simulator.access(3);

    const hit = simulator.access(8);

    expect(hit).toMatchObject({
      accessNumber: 3,
      requestedBlock: 8,
      result: "hit",
      selectedSlot: 0,
      evictedBlock: null,
      selectionReason: "hit",
    });
    expect(hit.cacheBefore[0]).toMatchObject({
      insertedAt: 1,
      lastAccessAt: 1,
    });
    expect(hit.cacheAfter[0]).toMatchObject({
      insertedAt: 1,
      lastAccessAt: 3,
    });
    expect(hit.recencyAfter.map((entry) => entry.blockAddress)).toEqual([8, 3]);
    expect(simulator.getAccessHistory()).toEqual([8, 3, 8]);
  });

  it("delegates only a full-cache miss through the policy interface", () => {
    const policy: ReplacementPolicy = {
      name: "fixed-slot-test-policy",
      selectVictim: vi.fn(() => ({
        slotIndex: 2,
        explanation: "Test policy selects slot 2.",
      })),
    };
    const simulator = createSimulator(policy);
    [10, 11, 12, 13].forEach((address) => simulator.access(address));

    const replacement = simulator.access(20);

    expect(policy.selectVictim).toHaveBeenCalledOnce();
    expect(replacement).toMatchObject({
      result: "miss",
      selectedSlot: 2,
      evictedBlock: 12,
      selectionReason: "replacement-policy",
      replacementExplanation: "Test policy selects slot 2.",
    });
    expect(replacement.cacheAfter[2]).toMatchObject({
      valid: true,
      blockAddress: 20,
      insertedAt: 5,
      lastAccessAt: 5,
    });
  });

  it("rejects an invalid policy decision without changing simulator state", () => {
    const simulator = createSimulator({
      name: "invalid-test-policy",
      selectVictim: () => ({ slotIndex: 9, explanation: "Out of range." }),
    });
    [0, 1, 2, 3].forEach((address) => simulator.access(address));
    const stateBefore = simulator.getCacheState();

    expect(() => simulator.access(4)).toThrow(ReplacementPolicyError);
    expect(simulator.getCacheState()).toEqual(stateBefore);
    expect(simulator.getAccessHistory()).toEqual([0, 1, 2, 3]);
  });

  it("returns snapshots that cannot mutate recorded internal history", () => {
    const simulator = createSimulator();
    const returnedEntry = simulator.access(7);

    (returnedEntry.cacheAfter[0] as { blockAddress: number | null }).blockAddress =
      500;

    expect(simulator.getCacheState()[0].blockAddress).toBe(7);
    expect(simulator.getTrace()[0].cacheAfter[0].blockAddress).toBe(7);
  });

  it("rejects invalid configuration before creating a simulation", () => {
    expect(
      () =>
        new FullyAssociativeCacheSimulator(
          { blockSizeWords: 3, cacheBlockCount: 4 },
          createNeverUsedPolicy(),
        ),
    ).toThrow(CacheConfigurationError);
  });

  it("rejects invalid accesses without adding partial history", () => {
    const simulator = createSimulator();

    expect(() => simulator.access(1_024)).toThrow(MemoryBlockAddressError);
    expect(simulator.getAccessHistory()).toEqual([]);
    expect(simulator.getTrace()).toEqual([]);
  });
});
