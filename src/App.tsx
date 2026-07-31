import { CachePanelPlaceholder } from "./components/CachePanelPlaceholder";
import { ConfigurationPlaceholder } from "./components/ConfigurationPlaceholder";
import { SequencePlaceholder } from "./components/SequencePlaceholder";
import { StatisticsPlaceholder } from "./components/StatisticsPlaceholder";
import { TraceLogPlaceholder } from "./components/TraceLogPlaceholder";

export default function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">CSARCH2 · Group 1 · Machine 6</p>
          <h1>Fully Associative Cache Policy Lab</h1>
          <p className="intro">
            A side-by-side simulator for Least Recently Used and Most Recently
            Used cache replacement.
          </p>
        </div>
        <span className="status-badge">Interface scaffold</span>
      </header>

      <nav className="section-nav" aria-label="Page sections">
        <a href="#configuration">Configuration</a>
        <a href="#sequence">Test sequence</a>
        <a href="#comparison">Comparison</a>
        <a href="#statistics">Statistics</a>
        <a href="#trace">Trace log</a>
      </nav>

      <main>
        <div className="setup-grid">
          <ConfigurationPlaceholder />
          <SequencePlaceholder />
        </div>

        <section id="comparison" className="page-section" aria-labelledby="comparison-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Policy comparison</p>
              <h2 id="comparison-title">Cache memory state</h2>
            </div>
            <p>Both policies will use the same access sequence.</p>
          </div>

          <div className="comparison-grid">
            <CachePanelPlaceholder policy="LRU" expandedName="Least Recently Used" />
            <CachePanelPlaceholder policy="MRU" expandedName="Most Recently Used" />
          </div>
        </section>

        <StatisticsPlaceholder />
        <TraceLogPlaceholder />
      </main>

      <footer>
        Group 1 · Fully Associative LRU versus Fully Associative MRU
      </footer>
    </div>
  );
}
