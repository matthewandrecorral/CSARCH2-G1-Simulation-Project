import { Panel } from "./Panel";

const statisticNames = [
  "Memory accesses",
  "Hits",
  "Misses",
  "Hit rate",
  "Miss rate",
  "Average access time",
  "Total access time",
];

export function StatisticsPlaceholder() {
  return (
    <Panel
      id="statistics"
      eyebrow="Results"
      title="Statistics"
      aside={<span className="placeholder-label">Next step</span>}
    >
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
            {statisticNames.map((statisticName) => (
              <tr key={statisticName}>
                <th scope="row">{statisticName}</th>
                <td>—</td>
                <td>—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="scope-note">
        Timing inputs, formulas, and derived statistics will be implemented as
        one tested module in the next step.
      </p>
    </Panel>
  );
}
