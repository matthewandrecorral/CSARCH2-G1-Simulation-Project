/**
 * Application coordinator: validates form state, runs both policies, and maps
 * immutable simulator snapshots onto playback and presentation components.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clampPlaybackStep,
  getCacheSnapshotAtStep,
  getTraceEntryAtStep,
  parseCustomSequence,
  type DisplayMode,
  type SequenceChoice,
} from "./application";
import { CachePanel } from "./components/CachePanel";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { PlaybackControls } from "./components/PlaybackControls";
import { SequencePanel } from "./components/SequencePanel";
import { SimulationTelemetry } from "./components/SimulationTelemetry";
import { StatisticsPanel } from "./components/StatisticsPanel";
import { TraceLog } from "./components/TraceLog";
import { compareReplacementPolicies } from "./simulator/comparison";
import {
  generateMidRepeatReverseSequence,
  generateRandomSequence,
  generateSequentialSequence,
} from "./simulator/sequences";
import type { PolicyComparisonResult } from "./simulator/types";
import {
  validateTimingConfiguration,
  type ReadPolicy,
  type TimingConfiguration,
} from "./simulator/timing";
import { validateCacheConfiguration } from "./simulator/validation";

// These are browser-rendering safeguards, not limits imposed by the simulator.
const UI_RESOURCE_CACHE_LIMIT = 4_096;
const UI_SNAPSHOT_LINE_LIMIT = 250_000;

type DerivedSequence = {
  readonly sequence: readonly number[];
  readonly errors: readonly string[];
};

function deriveSequence(
  choice: SequenceChoice,
  cacheBlockCount: string,
  randomSequence: readonly number[],
  customInput: string,
): DerivedSequence {
  // Keep workload derivation pure so previews and completed runs use the same
  // parser/generator rules.
  if (choice === "custom") {
    const parsed = parseCustomSequence(customInput);
    return parsed.valid
      ? { sequence: parsed.sequence, errors: [] }
      : { sequence: [], errors: parsed.errors };
  }

  if (choice === "random") {
    return { sequence: randomSequence, errors: [] };
  }

  try {
    const cacheBlocks = Number(cacheBlockCount);
    const sequence = choice === "sequential"
      ? generateSequentialSequence(cacheBlocks)
      : generateMidRepeatReverseSequence(cacheBlocks);
    return { sequence, errors: [] };
  } catch (error) {
    return {
      sequence: [],
      errors: [error instanceof Error ? error.message : "The sequence could not be generated."],
    };
  }
}

/** Render and coordinate the complete interactive comparison experience. */
export default function App() {
  const [blockSizeWords, setBlockSizeWords] = useState("4");
  const [cacheBlockCount, setCacheBlockCount] = useState("4");
  const [readPolicy, setReadPolicy] = useState<ReadPolicy>("load-through");
  const [cacheAccessTimeNs, setCacheAccessTimeNs] = useState("1");
  const [mainMemoryBlockFetchTimeNs, setMainMemoryBlockFetchTimeNs] = useState("100");
  const [sequenceChoice, setSequenceChoice] = useState<SequenceChoice>("sequential");
  const [customInput, setCustomInput] = useState("0, 1, 2, 3, 0, 1, 4, 5");
  const [seed, setSeed] = useState("");
  const [randomSequence, setRandomSequence] = useState<readonly number[]>(() =>
    generateRandomSequence(),
  );
  const [comparison, setComparison] = useState<PolicyComparisonResult | null>(null);
  const [activeTiming, setActiveTiming] = useState<TimingConfiguration | null>(null);
  const [configurationErrors, setConfigurationErrors] = useState<Record<string, string>>({});
  const [displayMode, setDisplayMode] = useState<DisplayMode>("step");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(600);
  const [copyStatus, setCopyStatus] = useState("");

  const derivedSequence = useMemo(
    () => deriveSequence(sequenceChoice, cacheBlockCount, randomSequence, customInput),
    [cacheBlockCount, customInput, randomSequence, sequenceChoice],
  );
  const totalSteps = comparison?.inputSequence.length ?? 0;
  const lruEntry = getTraceEntryAtStep(comparison?.lru ?? null, currentStep);
  const mruEntry = getTraceEntryAtStep(comparison?.mru ?? null, currentStep);
  const lruSnapshot = getCacheSnapshotAtStep(comparison?.lru ?? null, currentStep, 4);
  const mruSnapshot = getCacheSnapshotAtStep(comparison?.mru ?? null, currentStep, 4);

  const invalidateRun = useCallback(() => {
    // Any edited input invalidates statistics and playback, preventing a stale
    // result from being displayed beside a new configuration.
    setComparison(null);
    setActiveTiming(null);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying || displayMode !== "step" || !comparison) {
      return;
    }

    if (currentStep >= totalSteps) {
      setIsPlaying(false);
      return;
    }

    // Chained timeouts avoid overlapping ticks when speed or state changes.
    const timer = window.setTimeout(() => {
      setCurrentStep((step) => clampPlaybackStep(step + 1, totalSteps));
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [comparison, currentStep, displayMode, isPlaying, speedMs, totalSteps]);

  function handleBlockSizeChange(value: string) {
    setBlockSizeWords(value);
    setConfigurationErrors((errors) => ({ ...errors, blockSizeWords: "", run: "" }));
    invalidateRun();
  }

  function handleCacheBlockCountChange(value: string) {
    setCacheBlockCount(value);
    setConfigurationErrors((errors) => ({ ...errors, cacheBlockCount: "", run: "" }));
    invalidateRun();
  }

  function handleSequenceChoiceChange(choice: SequenceChoice) {
    setSequenceChoice(choice);
    setCopyStatus("");
    if (choice === "random") {
      setRandomSequence(generateRandomSequence(seed));
    }
    invalidateRun();
  }

  function handleRegenerate() {
    setRandomSequence(generateRandomSequence(seed));
    setCopyStatus("");
    invalidateRun();
  }

  async function handleCopy() {
    if (derivedSequence.sequence.length === 0) {
      return;
    }

    if (!navigator.clipboard) {
      setCopyStatus("Copy unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(derivedSequence.sequence.join(", "));
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  function handleRun() {
    const validation = validateCacheConfiguration({
      blockSizeWords: Number(blockSizeWords),
      cacheBlockCount: Number(cacheBlockCount),
    });
    const nextErrors: Record<string, string> = {};
    const timingValidation = validateTimingConfiguration({
      readPolicy,
      cacheAccessTimeNs: Number(cacheAccessTimeNs),
      mainMemoryBlockFetchTimeNs: Number(mainMemoryBlockFetchTimeNs),
    });

    if (!validation.valid) {
      validation.issues.forEach((issue) => {
        nextErrors[issue.field] = issue.message;
      });
    }

    if (!timingValidation.valid) {
      timingValidation.issues.forEach((issue) => {
        nextErrors[issue.field] = issue.message;
      });
    }

    const numericCacheBlockCount = Number(cacheBlockCount);
    if (Number.isSafeInteger(numericCacheBlockCount) && numericCacheBlockCount > UI_RESOURCE_CACHE_LIMIT) {
      nextErrors.cacheBlockCount = `The simulator core accepts this value, but this interface limits visual runs to ${UI_RESOURCE_CACHE_LIMIT.toLocaleString()} cache lines to protect browser resources.`;
    }

    if (derivedSequence.errors.length > 0) {
      nextErrors.run = "Fix the sequence errors before running the comparison.";
    } else if (
      Number.isSafeInteger(numericCacheBlockCount)
      && numericCacheBlockCount * derivedSequence.sequence.length > UI_SNAPSHOT_LINE_LIMIT
    ) {
      nextErrors.run = `This run would record more than ${UI_SNAPSHOT_LINE_LIMIT.toLocaleString()} cache-line snapshots per policy. Choose a shorter sequence or a smaller cache to protect browser resources; the simulator core has no assignment-defined cache maximum.`;
    }

    // Create neither simulator unless geometry, timing, workload, and UI
    // resource checks all pass together.
    if (Object.keys(nextErrors).length > 0 || !validation.valid || !timingValidation.valid) {
      setConfigurationErrors(nextErrors);
      invalidateRun();
      return;
    }

    const result = compareReplacementPolicies(
      validation.value,
      derivedSequence.sequence,
    );
    setConfigurationErrors({});
    setComparison(result);
    setActiveTiming(timingValidation.value);
    setIsPlaying(false);
    setCurrentStep(displayMode === "final" ? result.inputSequence.length : 0);
  }

  function handleModeChange(mode: DisplayMode) {
    setDisplayMode(mode);
    setIsPlaying(false);
    if (comparison) {
      setCurrentStep(mode === "final" ? totalSteps : 0);
    }
  }

  function handlePlayPause() {
    if (!comparison || displayMode === "final") {
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (currentStep >= totalSteps) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-lockup" aria-label="Cache policy lab">
          <span className="brand-mark" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
          <div>
            <span className="brand-course">CSARCH2</span>
            <span className="brand-team">Group 1 / Machine 6</span>
          </div>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">Memory systems / replacement policies</p>
          <h1>Fully Associative Cache Policy Lab</h1>
          <p className="intro">
            Trace every access. Inspect every eviction. Compare how LRU and MRU
            reshape the same cache workload in real time.
          </p>
          <div className="hero-specs" aria-label="Simulator characteristics">
            <span><strong>02</strong> policies</span>
            <span><strong>1,024</strong> memory blocks</span>
            <span><strong>∞</strong> traceable steps</span>
          </div>
        </div>

        <div className="hero-status">
          <span className="status-badge status-badge--live">Interactive simulator</span>
          <span className="system-note">Simulation core online</span>
        </div>
      </header>

      <nav className="section-nav" aria-label="Page sections">
        <a href="#configuration"><span>01</span> Configuration</a>
        <a href="#sequence"><span>02</span> Test sequence</a>
        <a href="#comparison"><span>03</span> Comparison</a>
        <a href="#statistics"><span>04</span> Statistics</a>
        <a href="#trace"><span>05</span> Trace log</a>
      </nav>

      <main>
        <div className="setup-grid">
          <ConfigurationPanel
            blockSizeWords={blockSizeWords}
            cacheAccessTimeNs={cacheAccessTimeNs}
            cacheBlockCount={cacheBlockCount}
            errors={configurationErrors}
            mainMemoryBlockFetchTimeNs={mainMemoryBlockFetchTimeNs}
            onBlockSizeChange={handleBlockSizeChange}
            onCacheAccessTimeChange={(value) => {
              setCacheAccessTimeNs(value);
              setConfigurationErrors((errors) => ({ ...errors, cacheAccessTimeNs: "", run: "" }));
              invalidateRun();
            }}
            onCacheBlockCountChange={handleCacheBlockCountChange}
            onMainMemoryBlockFetchTimeChange={(value) => {
              setMainMemoryBlockFetchTimeNs(value);
              setConfigurationErrors((errors) => ({ ...errors, mainMemoryBlockFetchTimeNs: "", run: "" }));
              invalidateRun();
            }}
            onReadPolicyChange={(value) => {
              setReadPolicy(value);
              setConfigurationErrors((errors) => ({ ...errors, readPolicy: "", run: "" }));
              invalidateRun();
            }}
            onRun={handleRun}
            readPolicy={readPolicy}
          />
          <SequencePanel
            choice={sequenceChoice}
            copyStatus={copyStatus}
            customInput={customInput}
            errors={derivedSequence.errors}
            onChoiceChange={handleSequenceChoiceChange}
            onCopy={handleCopy}
            onCustomInputChange={(value) => {
              setCustomInput(value);
              setCopyStatus("");
              invalidateRun();
            }}
            onRegenerate={handleRegenerate}
            onSeedChange={(value) => {
              setSeed(value);
              setCopyStatus("");
            }}
            seed={seed}
            sequence={derivedSequence.sequence}
          />
        </div>

        <section id="comparison" className="page-section" aria-labelledby="comparison-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">03 / Policy comparison</p>
              <h2 id="comparison-title">Cache memory state</h2>
            </div>
            <p>
              Both policies begin empty and receive the exact same validated
              access sequence.
            </p>
          </div>

          <SimulationTelemetry
            currentStep={currentStep}
            isPlaying={isPlaying}
            lruEntry={lruEntry}
            mruEntry={mruEntry}
            speedMs={speedMs}
            timing={activeTiming}
            totalSteps={totalSteps}
          />

          <PlaybackControls
            currentStep={currentStep}
            hasResult={Boolean(comparison)}
            isPlaying={isPlaying}
            mode={displayMode}
            onModeChange={handleModeChange}
            onNext={() => {
              setIsPlaying(false);
              setCurrentStep((step) => clampPlaybackStep(step + 1, totalSteps));
            }}
            onPlayPause={handlePlayPause}
            onPrevious={() => {
              setIsPlaying(false);
              setCurrentStep((step) => clampPlaybackStep(step - 1, totalSteps));
            }}
            onReset={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
            onSeek={(step) => {
              setIsPlaying(false);
              setCurrentStep(clampPlaybackStep(step, totalSteps));
            }}
            onSpeedChange={setSpeedMs}
            speedMs={speedMs}
            totalSteps={totalSteps}
          />

          <div className="visual-legend" aria-label="Cache state legend">
            <span><i className="legend-dot legend-dot--hit" /> Hit / recency update</span>
            <span><i className="legend-dot legend-dot--loaded" /> Miss / empty-line load</span>
            <span><i className="legend-dot legend-dot--replaced" /> Miss / eviction and load</span>
          </div>

          <div className="comparison-grid">
            <CachePanel
              currentEntry={lruEntry}
              currentStep={currentStep}
              expandedName="Least Recently Used"
              hasResult={Boolean(comparison)}
              policy="LRU"
              snapshot={lruSnapshot}
              totalSteps={totalSteps}
            />
            <CachePanel
              currentEntry={mruEntry}
              currentStep={currentStep}
              expandedName="Most Recently Used"
              hasResult={Boolean(comparison)}
              policy="MRU"
              snapshot={mruSnapshot}
              totalSteps={totalSteps}
            />
          </div>
        </section>

        <StatisticsPanel result={comparison} timing={activeTiming} />
        <TraceLog result={comparison} timing={activeTiming} visibleSteps={currentStep} />
      </main>

      <footer>
        <span>CSARCH2 / GROUP 1</span>
        <p>Fully Associative LRU versus Fully Associative MRU</p>
        <span>Interactive Cache Simulator</span>
      </footer>
    </div>
  );
}
