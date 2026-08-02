import { Panel } from "./Panel";

type ConfigurationPanelProps = {
  blockSizeWords: string;
  cacheBlockCount: string;
  errors: Readonly<Record<string, string>>;
  onBlockSizeChange: (value: string) => void;
  onCacheBlockCountChange: (value: string) => void;
  onRun: () => void;
};

export function ConfigurationPanel({
  blockSizeWords,
  cacheBlockCount,
  errors,
  onBlockSizeChange,
  onCacheBlockCountChange,
  onRun,
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
      </div>

      {errors.run && <p className="form-error" role="alert">{errors.run}</p>}

      <button className="primary-button" onClick={onRun} type="button">
        Run LRU / MRU comparison
      </button>
      <p className="scope-note">
        Read-policy timing and calculated statistics are reserved for the next
        implementation step.
      </p>
    </Panel>
  );
}
