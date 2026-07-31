type CachePanelPlaceholderProps = {
  policy: "LRU" | "MRU";
  expandedName: string;
};

export function CachePanelPlaceholder({
  policy,
  expandedName,
}: CachePanelPlaceholderProps) {
  return (
    <article className="cache-panel" aria-labelledby={`${policy.toLowerCase()}-title`}>
      <div className="cache-heading">
        <div>
          <p className="policy-name">{expandedName}</p>
          <h3 id={`${policy.toLowerCase()}-title`}>{policy} cache</h3>
        </div>
        <span className="waiting-indicator">Awaiting run</span>
      </div>

      <div className="cache-column-headings" aria-hidden="true">
        <span>Slot</span>
        <span>Memory block</span>
        <span>Recency</span>
      </div>
      <ol className="cache-lines" aria-label={`${policy} cache slots`}>
        {[0, 1, 2, 3].map((slot) => (
          <li key={slot}>
            <span>{slot}</span>
            <strong>Empty</strong>
            <span>—</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
