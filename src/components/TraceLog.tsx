/** Synchronized, latency-aware LRU/MRU access history. */
import type { PolicyComparisonResult, TraceEntry } from "../simulator/types";
import { getAccessLatencyNs, type TimingConfiguration } from "../simulator/timing";
import { Panel } from "./Panel";

function describeDecision(entry: TraceEntry): string {
  if (entry.result === "hit") {
    return `Hit in slot ${entry.selectedSlot}`;
  }

  if (entry.evictedBlock === null) {
    return `Miss · loaded in empty slot ${entry.selectedSlot}`;
  }

  return `Miss · evicted block ${entry.evictedBlock} from slot ${entry.selectedSlot}`;
}

type TraceLogProps = {
  result: PolicyComparisonResult | null;
  timing: TimingConfiguration | null;
  visibleSteps: number;
};

function formatLatency(entry: TraceEntry, timing: TimingConfiguration | null): string {
  if (!timing) {
    return "—";
  }

  return `${getAccessLatencyNs(entry.result, timing).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })} ns`;
}

/** Render policy decisions in lockstep through the current playback position. */
export function TraceLog({ result, timing, visibleSteps }: TraceLogProps) {
  const rows = result?.inputSequence.slice(0, visibleSteps) ?? [];

  return (
    <Panel
      id="trace"
      eyebrow="05 / Access history"
      title="Trace log"
      aside={<span className="placeholder-label">{rows.length} visible entries</span>}
    >
      {rows.length === 0 ? (
        <div className="empty-state" role="status">
          <strong>No visible accesses yet.</strong>
          <span>Run a comparison, then step forward or choose final-snapshot mode.</span>
        </div>
      ) : (
        <div className="table-wrap trace-table-wrap">
          <table className="trace-table">
            <thead>
              <tr>
                <th scope="col">Access</th>
                <th scope="col">Block</th>
                <th scope="col">LRU decision</th>
                <th scope="col">LRU latency</th>
                <th scope="col">MRU decision</th>
                <th scope="col">MRU latency</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((blockAddress, index) => {
                const lruEntry = result?.lru.trace[index];
                const mruEntry = result?.mru.trace[index];

                if (!lruEntry || !mruEntry) {
                  return null;
                }

                return (
                  <tr className={index === visibleSteps - 1 ? "trace-row--current" : ""} key={index}>
                    <td>{index + 1}</td>
                    <td><strong>{blockAddress}</strong></td>
                    <td><span className={`trace-result trace-result--${lruEntry.result}`}>{describeDecision(lruEntry)}</span></td>
                    <td>{formatLatency(lruEntry, timing)}</td>
                    <td><span className={`trace-result trace-result--${mruEntry.result}`}>{describeDecision(mruEntry)}</span></td>
                    <td>{formatLatency(mruEntry, timing)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
