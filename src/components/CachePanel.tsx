/** Visualizes one policy's cache snapshot and current access decision. */
import type { CacheSnapshot, TraceEntry } from "../simulator/types";

type CachePanelProps = {
  policy: "LRU" | "MRU";
  expandedName: string;
  snapshot: CacheSnapshot;
  currentEntry: TraceEntry | null;
  currentStep: number;
  totalSteps: number;
  hasResult: boolean;
};

function selectedLineClass(entry: TraceEntry | null, slotIndex: number): string {
  // The selected line distinguishes a hit, empty-line fill, and replacement.
  if (!entry || entry.selectedSlot !== slotIndex) {
    return "";
  }

  if (entry.result === "hit") {
    return "cache-line--hit";
  }

  return entry.evictedBlock === null
    ? "cache-line--loaded"
    : "cache-line--replaced";
}

/** Render every line in one policy snapshot and explain its current decision. */
export function CachePanel({
  policy,
  expandedName,
  snapshot,
  currentEntry,
  currentStep,
  totalSteps,
  hasResult,
}: CachePanelProps) {
  const recencyRanks = new Map(
    currentEntry?.recencyAfter.map((entry, index) => [entry.slotIndex, index + 1]) ?? [],
  );
  const status = !hasResult
    ? "Awaiting run"
    : currentStep === 0
      ? "Initial state"
      : currentStep === totalSteps
        ? "Final state"
        : `Step ${currentStep}`;

  return (
    <article className={`cache-panel cache-panel--${policy.toLowerCase()}`} aria-labelledby={`${policy.toLowerCase()}-title`}>
      <div className="cache-heading">
        <div className="policy-heading">
          <span className="policy-index" aria-hidden="true">{policy === "LRU" ? "A" : "B"}</span>
          <div>
          <p className="policy-name">{expandedName}</p>
          <h3 id={`${policy.toLowerCase()}-title`}>{policy} cache</h3>
          </div>
        </div>
        <span className="waiting-indicator">{status}</span>
      </div>

      <div className={`access-callout ${currentEntry ? `access-callout--${currentEntry.result}` : ""}`}>
        {currentEntry ? (
          <>
            <div>
              <span>Access {currentEntry.accessNumber} of {totalSteps}</span>
              <strong>Memory block {currentEntry.requestedBlock}</strong>
            </div>
            <span className={`result-chip result-chip--${currentEntry.result}`}>
              {currentEntry.result}
            </span>
            <p>
              {currentEntry.result === "hit"
                ? `Found in slot ${currentEntry.selectedSlot}; recency updated.`
                : currentEntry.evictedBlock === null
                  ? `Loaded into empty slot ${currentEntry.selectedSlot}.`
                  : `Evicted block ${currentEntry.evictedBlock} from slot ${currentEntry.selectedSlot}, then loaded block ${currentEntry.requestedBlock}.`}
            </p>
          </>
        ) : (
          <p>{hasResult ? "The cache is empty before the first access." : "Run a comparison to create a trace."}</p>
        )}
      </div>

      <div className="cache-table-wrap">
        <div className="cache-column-headings" aria-hidden="true">
          <span>Slot</span>
          <span>State</span>
          <span>Memory block</span>
          <span>Recency</span>
        </div>
        <ol className="cache-lines" aria-label={`${policy} cache slots`}>
          {snapshot.map((line) => {
            const rank = recencyRanks.get(line.slotIndex);

            return (
              <li className={selectedLineClass(currentEntry, line.slotIndex)} key={line.slotIndex}>
                <span className="cache-slot">{line.slotIndex}</span>
                <span className={`line-state line-state--${line.valid ? "valid" : "empty"}`}>
                  {line.valid ? "Valid" : "Empty"}
                </span>
                <strong className="cache-address">{line.valid ? line.blockAddress : "—"}</strong>
                <span className="recency-value">
                  {line.valid
                    ? `${rank ? `#${rank} · ` : ""}last ${line.lastAccessAt}`
                    : "—"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {currentEntry?.replacementExplanation && (
        <p className="decision-note">{currentEntry.replacementExplanation}</p>
      )}
    </article>
  );
}
