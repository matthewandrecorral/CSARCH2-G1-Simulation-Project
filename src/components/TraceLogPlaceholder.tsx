import { Panel } from "./Panel";

export function TraceLogPlaceholder() {
  return (
    <Panel
      id="trace"
      eyebrow="Access history"
      title="Trace log"
      aside={<span className="placeholder-label">Playback pending</span>}
    >
      <div className="trace-placeholder" role="status">
        <span>Access</span>
        <strong>No simulation has been run.</strong>
        <span>Trace entries will appear here in a later step.</span>
      </div>
    </Panel>
  );
}
