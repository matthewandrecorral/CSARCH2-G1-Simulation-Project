/** Calculates and presents the required statistics plus extended analytics for both policies. */
import { useState } from "react";

import type { DisplayMode, RunSequenceSpecification } from "../application";
import { buildCsv, downloadTextFile } from "../download";
import { buildShareSpec, buildShareUrl } from "../share";
import {
  calculateExtendedAnalytics,
  countDivergences,
  type ExtendedRunAnalytics,
} from "../simulator/analysis";
import type { PolicyComparisonResult } from "../simulator/types";
import {
  calculateSimulationStatistics,
  type SimulationStatistics,
  type TimingConfiguration,
} from "../simulator/timing";
import { Panel } from "./Panel";
import { RunSpecification } from "./RunSpecification";

type StatisticsPanelProps = {
  result: PolicyComparisonResult | null;
  sequenceSpecification: RunSequenceSpecification | null;
  timing: TimingConfiguration | null;
  displayMode: DisplayMode;
  currentStep: number;
};

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function formatRate(value: number): string {
  return `${formatNumber(value * 100)}%`;
}

type MetricSource = {
  readonly statistics: SimulationStatistics;
  readonly analytics: ExtendedRunAnalytics;
};

type MetricRow = {
  readonly key: string;
  readonly label: string;
  readonly getValue: (source: MetricSource) => string;
  readonly getComparable: (source: MetricSource) => number;
  readonly betterWhenLower: boolean;
  readonly extended?: boolean;
};

const metricRows: readonly MetricRow[] = [
  {
    key: "accesses",
    label: "Memory accesses",
    getValue: (s) => formatNumber(s.statistics.accessCount),
    getComparable: (s) => s.statistics.accessCount,
    betterWhenLower: false,
  },
  {
    key: "hits",
    label: "Hits",
    getValue: (s) => formatNumber(s.statistics.hitCount),
    getComparable: (s) => s.statistics.hitCount,
    betterWhenLower: false,
  },
  {
    key: "misses",
    label: "Misses",
    getValue: (s) => formatNumber(s.statistics.missCount),
    getComparable: (s) => s.statistics.missCount,
    betterWhenLower: true,
  },
  {
    key: "hitRate",
    label: "Hit rate",
    getValue: (s) => formatRate(s.statistics.hitRate),
    getComparable: (s) => s.statistics.hitRate,
    betterWhenLower: false,
  },
  {
    key: "missRate",
    label: "Miss rate",
    getValue: (s) => formatRate(s.statistics.missRate),
    getComparable: (s) => s.statistics.missRate,
    betterWhenLower: true,
  },
  {
    key: "amat",
    label: "Average access time (AMAT)",
    getValue: (s) => `${formatNumber(s.statistics.averageAccessTimeNs)} ns`,
    getComparable: (s) => s.statistics.averageAccessTimeNs,
    betterWhenLower: true,
  },
  {
    key: "totalTime",
    label: "Total access time",
    getValue: (s) => `${formatNumber(s.statistics.totalAccessTimeNs)} ns`,
    getComparable: (s) => s.statistics.totalAccessTimeNs,
    betterWhenLower: true,
  },
  {
    key: "evictions",
    label: "Evictions",
    getValue: (s) => formatNumber(s.analytics.evictionCount),
    getComparable: (s) => s.analytics.evictionCount,
    betterWhenLower: true,
    extended: true,
  },
  {
    key: "emptyLoads",
    label: "Empty-slot loads",
    getValue: (s) => formatNumber(s.analytics.emptySlotLoadCount),
    getComparable: (s) => s.analytics.emptySlotLoadCount,
    betterWhenLower: false,
    extended: true,
  },
  {
    key: "hitStreak",
    label: "Longest hit streak",
    getValue: (s) => formatNumber(s.analytics.longestHitStreak),
    getComparable: (s) => s.analytics.longestHitStreak,
    betterWhenLower: false,
    extended: true,
  },
  {
    key: "missStreak",
    label: "Longest miss streak",
    getValue: (s) => formatNumber(s.analytics.longestMissStreak),
    getComparable: (s) => s.analytics.longestMissStreak,
    betterWhenLower: true,
    extended: true,
  },
  {
    key: "uniqueBlocks",
    label: "Unique blocks touched",
    getValue: (s) => formatNumber(s.analytics.uniqueBlocksAccessed),
    getComparable: (s) => s.analytics.uniqueBlocksAccessed,
    betterWhenLower: false,
    extended: true,
  },
];

function winnerClass(row: MetricRow, lru: MetricSource, mru: MetricSource): {
  lru: string;
  mru: string;
} {
  const lruValue = row.getComparable(lru);
  const mruValue = row.getComparable(mru);

  if (lruValue === mruValue) {
    return { lru: "", mru: "" };
  }

  const lruWins = row.betterWhenLower ? lruValue < mruValue : lruValue > mruValue;
  return {
    lru: lruWins ? "metric-cell--winner" : "",
    mru: lruWins ? "" : "metric-cell--winner",
  };
}

/** Compare all required LRU/MRU metrics plus extended analytics under the active timing configuration. */
export function StatisticsPanel({
  result,
  sequenceSpecification,
  timing,
  displayMode,
  currentStep,
}: StatisticsPanelProps) {
  const [shareStatus, setShareStatus] = useState("");
  const [exportStatus, setExportStatus] = useState("");

  const lru: MetricSource | null = result && timing
    ? {
        statistics: calculateSimulationStatistics(result.lru, timing),
        analytics: calculateExtendedAnalytics(result.lru),
      }
    : null;
  const mru: MetricSource | null = result && timing
    ? {
        statistics: calculateSimulationStatistics(result.mru, timing),
        analytics: calculateExtendedAnalytics(result.mru),
      }
    : null;
  const divergenceCount = result ? countDivergences(result.lru.trace, result.mru.trace) : 0;
  const performanceLabel = lru && mru
    ? lru.statistics.averageAccessTimeNs < mru.statistics.averageAccessTimeNs
      ? "LRU leads this workload"
      : mru.statistics.averageAccessTimeNs < lru.statistics.averageAccessTimeNs
        ? "MRU leads this workload"
        : "Policies are evenly matched"
    : "Awaiting simulation data";

  async function handleShare() {
    if (!result || !timing || !sequenceSpecification) {
      return;
    }

    const spec = buildShareSpec({
      configuration: result.lru.configuration,
      timing,
      sequence: result.inputSequence,
      sequenceSpecification,
      displayMode,
      step: currentStep,
    });
    const url = buildShareUrl(spec);

    if (!navigator.clipboard) {
      setShareStatus("Copy unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied");
    } catch {
      setShareStatus("Copy failed");
    }
  }

  function handleExport(format: "csv" | "json") {
    if (!result || !lru || !mru) {
      return;
    }

    if (format === "json") {
      const payload = {
        inputSequence: result.inputSequence,
        lru: { statistics: lru.statistics, analytics: lru.analytics },
        mru: { statistics: mru.statistics, analytics: mru.analytics },
        divergenceCount,
      };
      downloadTextFile("cache-statistics.json", JSON.stringify(payload, null, 2), "application/json");
    } else {
      const csv = buildCsv(
        ["Metric", "LRU", "MRU"],
        metricRows.map((row) => [row.label, row.getComparable(lru), row.getComparable(mru)]),
      );
      downloadTextFile("cache-statistics.csv", csv, "text/csv");
    }

    setExportStatus(format === "csv" ? "CSV downloaded" : "JSON downloaded");
    window.setTimeout(() => setExportStatus(""), 2000);
  }

  const requiredRows = metricRows.filter((row) => !row.extended);
  const extendedRows = metricRows.filter((row) => row.extended);

  return (
    <Panel
      id="statistics"
      eyebrow="04 / Results"
      title="Statistics"
      aside={(
        <div className="panel-actions">
          <span className={`status-badge ${result ? "status-badge--live" : "status-badge--ready"}`}>
            {result ? "Calculated" : "Awaiting run"}
          </span>
          <button
            className="secondary-button"
            disabled={!result}
            onClick={handleShare}
            type="button"
          >
            {shareStatus || "Share this result"}
          </button>
        </div>
      )}
    >
      {result && sequenceSpecification && timing && (
        <RunSpecification
          result={result}
          sequenceSpecification={sequenceSpecification}
          timing={timing}
        />
      )}

      {lru && mru && (
        <div className="results-overview">
          <div className="performance-callout">
            <span className="performance-kicker">Performance readout</span>
            <strong>{performanceLabel}</strong>
            <p>
              Lower average memory access time determines the lead.
              {" "}
              {divergenceCount === 0
                ? "LRU and MRU made identical decisions on every access."
                : `LRU and MRU diverged on ${formatNumber(divergenceCount)} of ${formatNumber(result?.inputSequence.length ?? 0)} accesses.`}
            </p>
          </div>

          <div className="rate-card rate-card--lru">
            <div><span>LRU hit rate</span><strong>{formatRate(lru.statistics.hitRate)}</strong></div>
            <progress aria-label={`LRU hit rate ${formatRate(lru.statistics.hitRate)}`} max="1" value={lru.statistics.hitRate} />
            <small>{formatNumber(lru.statistics.hitCount)} hits / {formatNumber(lru.statistics.accessCount)} accesses</small>
          </div>

          <div className="rate-card rate-card--mru">
            <div><span>MRU hit rate</span><strong>{formatRate(mru.statistics.hitRate)}</strong></div>
            <progress aria-label={`MRU hit rate ${formatRate(mru.statistics.hitRate)}`} max="1" value={mru.statistics.hitRate} />
            <small>{formatNumber(mru.statistics.hitCount)} hits / {formatNumber(mru.statistics.accessCount)} accesses</small>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">LRU</th>
              <th scope="col">MRU</th>
            </tr>
          </thead>
          <tbody>
            {requiredRows.map((row) => {
              const winners = lru && mru ? winnerClass(row, lru, mru) : { lru: "", mru: "" };
              return (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className={winners.lru}>{lru ? row.getValue(lru) : "—"}</td>
                  <td className={winners.mru}>{mru ? row.getValue(mru) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="scope-note formula-note">
        Hit = C. Load-through miss = C + M. Non-load-through miss = M + 2C.
        Total = hits × hit latency + misses × miss latency; AMAT = total ÷ accesses.
      </p>

      <div className="table-wrap">
        <table>
          <caption className="metric-table-caption">Additional analytics</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">LRU</th>
              <th scope="col">MRU</th>
            </tr>
          </thead>
          <tbody>
            {extendedRows.map((row) => {
              const winners = lru && mru ? winnerClass(row, lru, mru) : { lru: "", mru: "" };
              return (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className={winners.lru}>{lru ? row.getValue(lru) : "—"}</td>
                  <td className={winners.mru}>{mru ? row.getValue(mru) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="export-controls">
        <span>Export this run</span>
        <button className="text-button" disabled={!result} onClick={() => handleExport("csv")} type="button">
          Download CSV
        </button>
        <button className="text-button" disabled={!result} onClick={() => handleExport("json")} type="button">
          Download JSON
        </button>
        {exportStatus && <small role="status">{exportStatus}</small>}
      </div>
    </Panel>
  );
}
