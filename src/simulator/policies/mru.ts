/** Most Recently Used replacement: evict the largest last-access tick. */
import type { ReplacementPolicy } from "../types";
import { selectByRecency } from "./shared";

export const mruPolicy: ReplacementPolicy = {
  name: "MRU",
  selectVictim(context) {
    return selectByRecency(context, "most", this.name);
  },
};
