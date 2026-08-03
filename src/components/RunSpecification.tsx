/** Reproducible geometry and workload summary shared by result panels. */
import type { RunSequenceSpecification } from "../application";
import type { TimingConfiguration } from "../simulator/timing";
import type { PolicyComparisonResult } from "../simulator/types";

type RunSpecificationProps = {
  result: PolicyComparisonResult;
  sequenceSpecification: RunSequenceSpecification;
  timing: TimingConfiguration;
};

const sequenceLabels: Record<RunSequenceSpecification["choice"], string> = {
  sequential: "Sequential",
  "mid-repeat": "Mid-repeat + reverse",
  random: "Random (64)",
  custom: "Custom",
};

/** Display the exact inputs used to produce a completed comparison. */
export function RunSpecification({
  result,
  sequenceSpecification,
  timing,
}: RunSpecificationProps) {
  const configuration = result.lru.configuration;
  const sequenceLabel = sequenceLabels[sequenceSpecification.choice];
  const seedLabel = sequenceSpecification.randomSeed ?? "Unseeded";
  const readPolicyLabel = timing.readPolicy === "non-load-through"
    ? "Non-load-through"
    : "Load-through";

  return (
    <section className="run-specification" aria-label="Run specification">
      <div className="run-specification__heading">
        <div>
          <h3>Configuration &amp; workload</h3>
        </div>
        <div className="run-specification__badges">
          <span>{sequenceLabel}</span>
          <small>{result.inputSequence.length.toLocaleString()} accesses</small>
        </div>
      </div>

      <dl className="run-specification__grid">
        <div>
          <dt>Cache</dt>
          <dd>
            <strong>{configuration.cacheBlockCount.toLocaleString()} cache lines</strong>
            <strong>{configuration.blockSizeWords.toLocaleString()} words/block</strong>
          </dd>
        </div>
        <div>
          <dt>Main memory</dt>
          <dd>
            <strong>{configuration.mainMemoryBlockCount.toLocaleString()} blocks</strong>
            <span>Block addresses 0–{(configuration.mainMemoryBlockCount - 1).toLocaleString()}</span>
          </dd>
        </div>
        <div>
          <dt>Timing</dt>
          <dd>
            <strong>Read policy · {readPolicyLabel}</strong>
            <span>Cache lookup (C): {timing.cacheAccessTimeNs.toLocaleString()} ns</span>
            <span>Block fetch (M): {timing.mainMemoryBlockFetchTimeNs.toLocaleString()} ns</span>
          </dd>
        </div>
        {sequenceSpecification.choice === "random" && (
          <div>
            <dt>Random seed</dt>
            <dd><strong>{seedLabel}</strong></dd>
          </div>
        )}
      </dl>

      <div className="run-specification__sequence">
        <span>Exact test sequence · preserved order</span>
        <code>{result.inputSequence.join(", ")}</code>
      </div>
    </section>
  );
}
