import { Panel } from "./Panel";

const sequenceTypes = ["Sequential", "Mid-repeat + reverse", "Random", "Custom"];

export function SequencePlaceholder() {
  return (
    <Panel
      id="sequence"
      eyebrow="Workload"
      title="Test sequence"
      aside={<span className="placeholder-label">Generator pending</span>}
    >
      <div className="option-row" aria-label="Planned sequence choices">
        {sequenceTypes.map((sequenceType) => (
          <span key={sequenceType}>{sequenceType}</span>
        ))}
      </div>
      <div className="sequence-preview">
        <span>Example for n = 4</span>
        <code>0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7</code>
      </div>
    </Panel>
  );
}
