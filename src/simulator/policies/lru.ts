import type { ReplacementPolicy } from "../types";
import { selectByRecency } from "./shared";

export const lruPolicy: ReplacementPolicy = {
  name: "LRU",
  selectVictim(context) {
    return selectByRecency(context, "least", this.name);
  },
};
