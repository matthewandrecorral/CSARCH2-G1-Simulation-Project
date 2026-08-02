/** Least Recently Used replacement: evict the smallest last-access tick. */
import type { ReplacementPolicy } from "../types";
import { selectByRecency } from "./shared";

/** Replacement strategy that selects the smallest last-access tick. */
export const lruPolicy: ReplacementPolicy = {
  name: "LRU",
  selectVictim(context) {
    return selectByRecency(context, "least", this.name);
  },
};
