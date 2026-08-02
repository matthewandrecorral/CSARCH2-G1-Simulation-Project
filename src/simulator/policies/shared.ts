/** Shared deterministic recency selector used by both replacement policies. */
import type {
  OccupiedCacheLine,
  ReplacementContext,
  ReplacementDecision,
} from "../types";

export class PolicySelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicySelectionError";
  }
}

type RecencyDirection = "least" | "most";

export function selectByRecency(
  context: ReplacementContext,
  direction: RecencyDirection,
  policyName: string,
): ReplacementDecision {
  const occupiedLines = context.cache.filter(
    (line): line is OccupiedCacheLine => line.valid,
  );

  if (occupiedLines.length === 0) {
    throw new PolicySelectionError(
      `${policyName} cannot select a victim from an empty cache.`,
    );
  }

  // Sort a copy because the policy must never mutate the engine's snapshot.
  const orderedCandidates = [...occupiedLines].sort((left, right) => {
    const timestampDifference =
      direction === "least"
        ? left.lastAccessAt - right.lastAccessAt
        : right.lastAccessAt - left.lastAccessAt;

    // Access ticks are normally unique; the slot fallback documents behavior
    // for imported or otherwise malformed state containing a tie.
    return timestampDifference || left.slotIndex - right.slotIndex;
  });
  const victim = orderedCandidates[0];
  const recencyDescription =
    direction === "least" ? "smallest (least recent)" : "largest (most recent)";

  return {
    slotIndex: victim.slotIndex,
    explanation:
      `${policyName} selected slot ${victim.slotIndex}, block ${victim.blockAddress}, ` +
      `because lastAccessAt=${victim.lastAccessAt} is the ${recencyDescription} ` +
      "timestamp; the lowest slot index breaks any tie.",
  };
}
