import type { ReadPolicy } from "../simulator/timing";
import { Panel } from "./Panel";

type ConfigurationPanelProps = {
  blockSizeWords: string;
  cacheAccessTimeNs: string;
  cacheBlockCount: string;
  errors: Readonly<Record<string, string>>;
  mainMemoryBlockFetchTimeNs: string;
  onBlockSizeChange: (value: string) => void;
  onCacheAccessTimeChange: (value: string) => void;
  onCacheBlockCountChange: (value: string) => void;
  onMainMemoryBlockFetchTimeChange: (value: string) => void;
  onReadPolicyChange: (value: ReadPolicy) => void;
  onRun: () => void;
  readPolicy: ReadPolicy;
};

export function ConfigurationPanel({
  blockSizeWords,
  cacheAccessTimeNs,
  cacheBlockCount,
  errors,
  mainMemoryBlockFetchTimeNs,
  onBlockSizeChange,
  onCacheAccessTimeChange,
  onCacheBlockCountChange,
  onMainMemoryBlockFetchTimeChange,
  onReadPolicyChange,
  onRun,
  readPolicy,
}: ConfigurationPanelProps) {
  return (
    <Panel
      id="configuration"
      eyebrow="Setup"
      title="Cache configuration"
      aside={<span className="status-badge status-badge--ready">Engine connected</span>}
    >
      <div className="field-grid">
        <label className="form-field">
          <span>Block size</span>
          <span className="input-with-unit">
            <input
              aria-describedby={errors.blockSizeWords ? "block-size-error" : undefined}
              aria-invalid={Boolean(errors.blockSizeWords)}
              inputMode="numeric"
              min="2"
              name="blockSizeWords"
              onChange={(event) => onBlockSizeChange(event.target.value)}
              step="1"
              type="number"
              value={blockSizeWords}
            />
            <span>words</span>
          </span>
          {errors.blockSizeWords && (
            <small className="field-error" id="block-size-error">
              {errors.blockSizeWords}
            </small>
          )}
        </label>

        <label className="form-field">
          <span>Cache blocks</span>
          <span className="input-with-unit">
            <input
              aria-describedby={errors.cacheBlockCount ? "cache-blocks-error" : undefined}
              aria-invalid={Boolean(errors.cacheBlockCount)}
              inputMode="numeric"
              min="4"
              name="cacheBlockCount"
              onChange={(event) => onCacheBlockCountChange(event.target.value)}
              step="1"
              type="number"
              value={cacheBlockCount}
            />
            <span>lines</span>
          </span>
          {errors.cacheBlockCount && (
            <small className="field-error" id="cache-blocks-error">
              {errors.cacheBlockCount}
            </small>
          )}
        </label>

        <div className="read-only-field">
          <span>Main memory</span>
          <strong>1,024 blocks</strong>
          <small>Fixed block addresses: 0–1,023</small>
        </div>

        <div className="read-only-field">
          <span>Mapping</span>
          <strong>Fully associative</strong>
          <small>Any block may occupy any cache line.</small>
        </div>

        <label className="form-field">
          <span>Read policy</span>
          <select
            aria-describedby={errors.readPolicy ? "read-policy-error" : "read-policy-note"}
            aria-invalid={Boolean(errors.readPolicy)}
            name="readPolicy"
            onChange={(event) => onReadPolicyChange(event.target.value as ReadPolicy)}
            value={readPolicy}
          >
            <option value="load-through">Load-through</option>
            <option value="non-load-through">Non-load-through</option>
          </select>
          {errors.readPolicy ? (
            <small className="field-error" id="read-policy-error">{errors.readPolicy}</small>
          ) : (
            <small id="read-policy-note">Changes CPU-visible miss latency only.</small>
          )}
        </label>

        <label className="form-field">
          <span>Cache access time (C)</span>
          <span className="input-with-unit">
            <input
              aria-describedby={errors.cacheAccessTimeNs ? "cache-time-error" : "cache-time-note"}
              aria-invalid={Boolean(errors.cacheAccessTimeNs)}
              inputMode="decimal"
              name="cacheAccessTimeNs"
              onChange={(event) => onCacheAccessTimeChange(event.target.value)}
              step="any"
              type="number"
              value={cacheAccessTimeNs}
            />
            <span>ns</span>
          </span>
          {errors.cacheAccessTimeNs ? (
            <small className="field-error" id="cache-time-error">
              {errors.cacheAccessTimeNs}
            </small>
          ) : (
            <small id="cache-time-note">Time required for one cache lookup.</small>
          )}
        </label>

        <label className="form-field">
          <span>Main-memory block fetch time (M)</span>
          <span className="input-with-unit">
            <input
              aria-describedby={errors.mainMemoryBlockFetchTimeNs ? "memory-time-error" : "memory-time-note"}
              aria-invalid={Boolean(errors.mainMemoryBlockFetchTimeNs)}
              inputMode="decimal"
              name="mainMemoryBlockFetchTimeNs"
              onChange={(event) => onMainMemoryBlockFetchTimeChange(event.target.value)}
              step="any"
              type="number"
              value={mainMemoryBlockFetchTimeNs}
            />
            <span>ns</span>
          </span>
          {errors.mainMemoryBlockFetchTimeNs ? (
            <small className="field-error" id="memory-time-error">
              {errors.mainMemoryBlockFetchTimeNs}
            </small>
          ) : (
            <small id="memory-time-note">Time to fetch one complete selected block.</small>
          )}
        </label>
      </div>

      {errors.run && <p className="form-error" role="alert">{errors.run}</p>}

      <button className="primary-button" onClick={onRun} type="button">
        Run LRU / MRU comparison
      </button>
      <p className="scope-note">
        C = 1 ns and M = 100 ns are editable teaching defaults, not hardware measurements.
      </p>
    </Panel>
  );
}
