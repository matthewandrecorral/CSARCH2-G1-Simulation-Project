import type { PolicyComparisonResult } from "../simulator/types";
import {
  calculateSimulationStatistics,
  type SimulationStatistics,
  type TimingConfiguration,
} from "../simulator/timing";
import { Panel } from "./Panel";

type StatisticsPanelProps = {
  result: PolicyComparisonResult | null;
  timing: TimingConfiguration | null;
};

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function formatRate(value: number): string {
  return `${formatNumber(value * 100)}%`;
}

type MetricRow = {
  readonly label: string;
  readonly getValue: (statistics: SimulationStatistics) => string;
};

const metricRows: readonly MetricRow[] = [
  { label: "Memory accesses", getValue: (statistics) => formatNumber(statistics.accessCount) },
  { label: "Hits", getValue: (statistics) => formatNumber(statistics.hitCount) },
  { label: "Misses", getValue: (statistics) => formatNumber(statistics.missCount) },
  { label: "Hit rate", getValue: (statistics) => formatRate(statistics.hitRate) },
  { label: "Miss rate", getValue: (statistics) => formatRate(statistics.missRate) },
  { label: "Average access time (AMAT)", getValue: (statistics) => `${formatNumber(statistics.averageAccessTimeNs)} ns` },
  { label: "Total access time", getValue: (statistics) => `${formatNumber(statistics.totalAccessTimeNs)} ns` },
];

export function StatisticsPanel({ result, timing }: StatisticsPanelProps) {
  const lru = result && timing
    ? calculateSimulationStatistics(result.lru, timing)
    : null;
  const mru = result && timing
    ? calculateSimulationStatistics(result.mru, timing)
    : null;
  const readPolicyLabel = timing?.readPolicy === "non-load-through"
    ? "Non-load-through"
    : "Load-through";

  return (
    <Panel
      id="statistics"
      eyebrow="Results"
      title="Statistics"
      aside={(
        <span className={`status-badge ${result ? "status-badge--live" : "status-badge--ready"}`}>
          {result ? "Calculated" : "Awaiting run"}
        </span>
      )}
    >
      {timing && (
        <div className="timing-summary" aria-label="Active timing inputs">
          <span><strong>Read policy</strong>{readPolicyLabel}</span>
          <span><strong>Cache lookup (C)</strong>{formatNumber(timing.cacheAccessTimeNs)} ns</span>
          <span><strong>Block fetch (M)</strong>{formatNumber(timing.mainMemoryBlockFetchTimeNs)} ns</span>
          <span><strong>Hit latency</strong>{formatNumber(lru?.hitTimeNs ?? timing.cacheAccessTimeNs)} ns</span>
          <span><strong>Miss latency</strong>{lru ? formatNumber(lru.missTimeNs) : "—"} ns</span>
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
            {metricRows.map((metric) => (
              <tr key={metric.label}>
                <th scope="row">{metric.label}</th>
                <td>{lru ? metric.getValue(lru) : "—"}</td>
                <td>{mru ? metric.getValue(mru) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="scope-note formula-note">
        Hit = C. Load-through miss = C + M. Non-load-through miss = M + 2C.
        Total = hits × hit latency + misses × miss latency; AMAT = total ÷ accesses.
      </p>
    </Panel>
  );
}
