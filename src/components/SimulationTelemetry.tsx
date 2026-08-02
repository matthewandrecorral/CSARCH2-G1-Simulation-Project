/** Animated CPU to policy caches to main-memory data-path readout. */
import type { CSSProperties } from "react";

import type { TraceEntry } from "../simulator/types";
import { getAccessLatencyNs, type TimingConfiguration } from "../simulator/timing";

type SimulationTelemetryProps = {
  readonly currentStep: number;
  readonly isPlaying: boolean;
  readonly lruEntry: TraceEntry | null;
  readonly mruEntry: TraceEntry | null;
  readonly speedMs: number;
  readonly timing: TimingConfiguration | null;
  readonly totalSteps: number;
};

function formatBlock(blockAddress: number | null): string {
  return blockAddress === null
    ? "0x---"
    : `0x${blockAddress.toString(16).toUpperCase().padStart(3, "0")}`;
}

function formatLatency(entry: TraceEntry | null, timing: TimingConfiguration | null): string {
  if (!entry || !timing) {
    return "--";
  }

  return `${getAccessLatencyNs(entry.result, timing).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })} ns`;
}

function formatDecision(entry: TraceEntry | null): string {
  if (!entry) {
    return "Waiting for access";
  }

  if (entry.result === "hit") {
    return `Hit / slot ${entry.selectedSlot}`;
  }

  if (entry.evictedBlock === null) {
    return `Miss / load slot ${entry.selectedSlot}`;
  }

  return `Miss / evict B${entry.evictedBlock}`;
}

export function SimulationTelemetry({
  currentStep,
  isPlaying,
  lruEntry,
  mruEntry,
  speedMs,
  timing,
  totalSteps,
}: SimulationTelemetryProps) {
  const requestedBlock = lruEntry?.requestedBlock ?? null;
  const hasAccess = Boolean(lruEntry && mruEntry);
  const lruMiss = lruEntry?.result === "miss";
  const mruMiss = mruEntry?.result === "miss";
  const activityLabel = isPlaying ? "Streaming" : hasAccess ? "Holding step" : "Bus idle";
  const dataPathLabel = hasAccess
    ? `CPU requests block ${requestedBlock}. LRU reports ${lruEntry?.result}; MRU reports ${mruEntry?.result}.`
    : "CPU, policy caches, and main memory are waiting for a simulation access.";
  // Split each packet trip into a shared CPU trunk followed by two branches so
  // both policy packets visibly reach the fork before diverging.
  const signalTotalMs = Math.max(180, Math.round(speedMs * 0.86));
  const signalTrunkMs = Math.round(signalTotalMs * 0.38);
  const signalBranchMs = signalTotalMs - signalTrunkMs;
  const signalTimingStyle = {
    "--bus-trunk-duration": `${signalTrunkMs}ms`,
    "--bus-branch-duration": `${signalBranchMs}ms`,
    "--bus-branch-delay": `${signalTrunkMs}ms`,
  } as CSSProperties;

  return (
    <section
      className={`telemetry-shell ${hasAccess ? "telemetry-shell--active" : ""}`}
      aria-labelledby="telemetry-title"
      style={signalTimingStyle}
    >
      <div className="telemetry-heading">
        <div>
          <p className="telemetry-kicker">Live architecture bus</p>
          <h3 id="telemetry-title">Memory data path</h3>
        </div>
        <span className={`bus-status ${isPlaying ? "bus-status--streaming" : ""}`}>
          <i aria-hidden="true" /> {activityLabel}
        </span>
      </div>

      <div className="telemetry-layout">
        <div className="data-path-diagram" role="img" aria-label={dataPathLabel}>
          <div className="architecture-node architecture-node--cpu" aria-hidden="true">
            <span>Origin</span>
            <strong>CPU</strong>
            <code>{formatBlock(requestedBlock)}</code>
          </div>

          <div className={`bus-line bus-line--request ${hasAccess ? "is-active" : ""}`} aria-hidden="true">
            <span className="bus-line__trunk" />
            <span className="bus-line__spine" />
            <span className="bus-line__outlet bus-line__outlet--lru" />
            <span className="bus-line__outlet bus-line__outlet--mru" />
            <span className="bus-line__label">address bus</span>
            {hasAccess && (
              <>
                <i className="bus-packet bus-packet--trunk" key={`request-trunk-${currentStep}`} />
                <i className="bus-packet bus-packet--lru" key={`request-lru-${currentStep}`} />
                <i className="bus-packet bus-packet--mru" key={`request-mru-${currentStep}`} />
              </>
            )}
          </div>

          <div className="policy-nodes" aria-hidden="true">
            <div className={`architecture-node architecture-node--lru ${lruEntry ? `is-${lruEntry.result}` : ""}`}>
              <span>Policy A</span>
              <strong>LRU cache</strong>
              <small>{lruEntry?.result ?? "idle"}</small>
            </div>
            <div className={`architecture-node architecture-node--mru ${mruEntry ? `is-${mruEntry.result}` : ""}`}>
              <span>Policy B</span>
              <strong>MRU cache</strong>
              <small>{mruEntry?.result ?? "idle"}</small>
            </div>
          </div>

          <div className="memory-routes" aria-hidden="true">
            <span className={lruMiss ? "is-active" : ""}>{lruMiss && <i key={`lru-miss-${currentStep}`} />}</span>
            <span className={mruMiss ? "is-active" : ""}>{mruMiss && <i key={`mru-miss-${currentStep}`} />}</span>
          </div>

          <div className={`architecture-node architecture-node--memory ${lruMiss || mruMiss ? "is-active" : ""}`} aria-hidden="true">
            <span>Backing store</span>
            <strong>Main memory</strong>
            <small>{lruMiss || mruMiss ? `fetch ${formatBlock(requestedBlock)}` : "standby"}</small>
          </div>
        </div>

        <div className="execution-monitor" aria-live="polite">
          <div className="monitor-bar">
            <span>Execution monitor</span>
            <code>{currentStep.toString().padStart(2, "0")} / {totalSteps.toString().padStart(2, "0")}</code>
          </div>

          <div className="monitor-command">
            <span>COMMAND</span>
            <strong>{hasAccess ? "READ_BLOCK" : "AWAIT_RUN"}</strong>
            <code>{formatBlock(requestedBlock)}</code>
          </div>

          <div className={`monitor-policy monitor-policy--lru ${lruEntry ? `is-${lruEntry.result}` : ""}`}>
            <span>LRU</span>
            <strong>{formatDecision(lruEntry)}</strong>
            <code>{formatLatency(lruEntry, timing)}</code>
          </div>
          <div className={`monitor-policy monitor-policy--mru ${mruEntry ? `is-${mruEntry.result}` : ""}`}>
            <span>MRU</span>
            <strong>{formatDecision(mruEntry)}</strong>
            <code>{formatLatency(mruEntry, timing)}</code>
          </div>
        </div>
      </div>
    </section>
  );
}
