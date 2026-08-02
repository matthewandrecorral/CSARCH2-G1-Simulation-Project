/** Workload selector, custom input editor, and generated-sequence preview. */
import type { SequenceChoice } from "../application";
import { Panel } from "./Panel";

const sequenceChoices: ReadonlyArray<{
  value: SequenceChoice;
  label: string;
}> = [
  { value: "sequential", label: "Sequential" },
  { value: "mid-repeat", label: "Mid-repeat + reverse" },
  { value: "random", label: "Random (64)" },
  { value: "custom", label: "Custom" },
];

type SequencePanelProps = {
  choice: SequenceChoice;
  customInput: string;
  seed: string;
  sequence: readonly number[];
  errors: readonly string[];
  copyStatus: string;
  onChoiceChange: (choice: SequenceChoice) => void;
  onCustomInputChange: (value: string) => void;
  onSeedChange: (value: string) => void;
  onRegenerate: () => void;
  onCopy: () => void;
};

export function SequencePanel({
  choice,
  customInput,
  seed,
  sequence,
  errors,
  copyStatus,
  onChoiceChange,
  onCustomInputChange,
  onSeedChange,
  onRegenerate,
  onCopy,
}: SequencePanelProps) {
  const preview = sequence.length > 0 ? sequence.join(", ") : "No valid sequence";

  return (
    <Panel
      id="sequence"
      eyebrow="02 / Workload"
      title="Test sequence"
      aside={<span className="sequence-count">{sequence.length} accesses</span>}
    >
      <fieldset className="choice-fieldset">
        <legend>Sequence source</legend>
        <div className="segmented-control">
          {sequenceChoices.map((option) => (
            <label key={option.value}>
              <input
                checked={choice === option.value}
                name="sequenceChoice"
                onChange={() => onChoiceChange(option.value)}
                type="radio"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {choice === "random" && (
        <div className="inline-fields">
          <label className="form-field form-field--grow">
            <span>Optional repeatable seed</span>
            <input
              onChange={(event) => onSeedChange(event.target.value)}
              placeholder="Blank = non-reproducible"
              type="text"
              value={seed}
            />
          </label>
          <button className="secondary-button" onClick={onRegenerate} type="button">
            Regenerate
          </button>
        </div>
      )}

      {choice === "custom" && (
        <label className="form-field">
          <span>Memory block addresses</span>
          <textarea
            aria-describedby={errors.length > 0 ? "sequence-errors" : "sequence-help"}
            aria-invalid={errors.length > 0}
            onChange={(event) => onCustomInputChange(event.target.value)}
            placeholder="Example: 0, 1, 2 3 2 1"
            rows={4}
            value={customInput}
          />
          <small id="sequence-help">Separate addresses with commas or whitespace.</small>
        </label>
      )}

      {errors.length > 0 && (
        <ul className="error-list" id="sequence-errors" role="alert">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}

      <div className="sequence-preview">
        <div className="sequence-preview__heading">
          <span>Sequence preview</span>
          <button
            className="text-button"
            disabled={sequence.length === 0}
            onClick={onCopy}
            type="button"
          >
            {copyStatus || "Copy"}
          </button>
        </div>
        <code>{preview}</code>
      </div>
    </Panel>
  );
}
