/** Synchronized, latency-aware LRU/MRU access history with filtering, search, and export. */
import { useMemo, useState } from "react";

import type { RunSequenceSpecification } from "../application";
import { buildCsv, downloadTextFile } from "../download";
import { sameOutcome } from "../simulator/analysis";
import { getAccessLatencyNs, type TimingConfiguration } from "../simulator/timing";
import type { PolicyComparisonResult, TraceEntry } from "../simulator/types";
import { Panel } from "./Panel";
import { RunSpecification } from "./RunSpecification";

type TraceFilter = "all" | "divergent" | "lru-miss" | "mru-miss";

const filterOptions: ReadonlyArray<{ value: TraceFilter; label: string }> = [
  { value: "all", label: "All accesses" },
  { value: "divergent", label: "Divergent only (LRU ≠ MRU)" },
  { value: "lru-miss", label: "LRU misses" },
  { value: "mru-miss", label: "MRU misses" },
];

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
  sequenceSpecification: RunSequenceSpecification | null;
  timing: TimingConfiguration | null;
  visibleSteps: number;
  totalSteps: number;
  onSeek: (step: number) => void;
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
export function TraceLog({
  result,
  sequenceSpecification,
  timing,
  visibleSteps,
  totalSteps,
  onSeek,
}: TraceLogProps) {
  const [filter, setFilter] = useState<TraceFilter>("all");
  const [blockSearch, setBlockSearch] = useState("");

  const revealedRows = result?.inputSequence.slice(0, visibleSteps) ?? [];

  const divergenceSteps = useMemo(() => {
    if (!result) {
      return [] as number[];
    }

    const steps: number[] = [];
    result.inputSequence.forEach((_, index) => {
      const lruEntry = result.lru.trace[index];
      const mruEntry = result.mru.trace[index];
      if (lruEntry && mruEntry && !sameOutcome(lruEntry, mruEntry)) {
        steps.push(index + 1);
      }
    });
    return steps;
  }, [result]);

  const nextDivergence = divergenceSteps.find((step) => step > visibleSteps) ?? null;
  const previousDivergence = [...divergenceSteps].reverse().find((step) => step < visibleSteps) ?? null;

  const searchBlock = blockSearch.trim().length > 0 && /^\d+$/.test(blockSearch.trim())
    ? Number(blockSearch.trim())
    : null;

  const rows = revealedRows
    .map((blockAddress, index) => ({
      index,
      blockAddress,
      lruEntry: result?.lru.trace[index],
      mruEntry: result?.mru.trace[index],
    }))
    .filter((row): row is { index: number; blockAddress: number; lruEntry: TraceEntry; mruEntry: TraceEntry } =>
      Boolean(row.lruEntry && row.mruEntry))
    .filter((row) => (searchBlock === null ? true : row.blockAddress === searchBlock))
    .filter((row) => {
      switch (filter) {
        case "divergent":
          return !sameOutcome(row.lruEntry, row.mruEntry);
        case "lru-miss":
          return row.lruEntry.result === "miss";
        case "mru-miss":
          return row.mruEntry.result === "miss";
        default:
          return true;
      }
    });

  function handleExportCsv() {
    if (!result) {
      return;
    }

    const csv = buildCsv(
      ["Access", "Block", "LRU decision", "LRU latency (ns)", "MRU decision", "MRU latency (ns)", "Diverges"],
      revealedRows.map((blockAddress, index) => {
        const lruEntry = result.lru.trace[index];
        const mruEntry = result.mru.trace[index];
        return [
          index + 1,
          blockAddress,
          describeDecision(lruEntry),
          timing ? getAccessLatencyNs(lruEntry.result, timing) : "",
          describeDecision(mruEntry),
          timing ? getAccessLatencyNs(mruEntry.result, timing) : "",
          sameOutcome(lruEntry, mruEntry) ? "No" : "Yes",
        ];
      }),
    );

    downloadTextFile("cache-trace-log.csv", csv, "text/csv");
  }

  return (
    <Panel
      id="trace"
      eyebrow="05 / Access history"
      title="Trace log"
      aside={<span className="placeholder-label">{rows.length} of {revealedRows.length} visible entries</span>}
    >
      {result && sequenceSpecification && timing && (
        <RunSpecification
          result={result}
          sequenceSpecification={sequenceSpecification}
          timing={timing}
        />
      )}

      {revealedRows.length === 0 ? (
        <div className="empty-state" role="status">
          <strong>No visible accesses yet.</strong>
          <span>Run a comparison, then step forward or choose final-snapshot mode.</span>
        </div>
      ) : (
        <>
          <div className="trace-toolbar">
            <label className="form-field trace-toolbar__filter">
              <span>Filter</span>
              <select onChange={(event) => setFilter(event.target.value as TraceFilter)} value={filter}>
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="form-field trace-toolbar__search">
              <span>Find block address</span>
              <input
                inputMode="numeric"
                onChange={(event) => setBlockSearch(event.target.value)}
                placeholder="e.g. 12"
                type="text"
                value={blockSearch}
              />
            </label>

            <div className="trace-toolbar__divergence">
              <button
                className="text-button"
                disabled={previousDivergence === null}
                onClick={() => previousDivergence !== null && onSeek(previousDivergence)}
                type="button"
              >
                ← Previous divergence
              </button>
              <button
                className="text-button"
                disabled={nextDivergence === null}
                onClick={() => nextDivergence !== null && onSeek(Math.min(nextDivergence, totalSteps))}
                type="button"
              >
                Next divergence →
              </button>
            </div>

            <button className="text-button" onClick={handleExportCsv} type="button">
              Download CSV
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="empty-state" role="status">
              <strong>No accesses match this filter.</strong>
              <span>Clear the block search or choose a different filter.</span>
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
                    <th scope="col">Diverges</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ index, blockAddress, lruEntry, mruEntry }) => {
                    const diverges = !sameOutcome(lruEntry, mruEntry);
                    return (
                      <tr className={index === visibleSteps - 1 ? "trace-row--current" : ""} key={index}>
                        <td>{index + 1}</td>
                        <td><strong>{blockAddress}</strong></td>
                        <td><span className={`trace-result trace-result--${lruEntry.result}`}>{describeDecision(lruEntry)}</span></td>
                        <td>{formatLatency(lruEntry, timing)}</td>
                        <td><span className={`trace-result trace-result--${mruEntry.result}`}>{describeDecision(mruEntry)}</span></td>
                        <td>{formatLatency(mruEntry, timing)}</td>
                        <td>{diverges && <span className="divergence-badge">Diverges</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
