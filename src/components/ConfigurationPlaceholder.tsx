import { Panel } from "./Panel";

const plannedInputs = [
  ["Block size", "4 words"],
  ["Cache blocks", "4 blocks"],
  ["Main memory", "1,024 blocks"],
  ["Read policy", "Load-through"],
];

export function ConfigurationPlaceholder() {
  return (
    <Panel
      id="configuration"
      eyebrow="Setup"
      title="Cache configuration"
      aside={<span className="placeholder-label">Controls pending</span>}
    >
      <dl className="placeholder-list">
        {plannedInputs.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button className="primary-button" type="button" disabled>
        Run comparison
      </button>
    </Panel>
  );
}
