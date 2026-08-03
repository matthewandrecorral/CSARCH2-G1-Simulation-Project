/** Snapshot playback controls shared by both policy views. */
import type { CSSProperties } from "react";

import type { DisplayMode } from "../application";

type PlaybackControlsProps = {
  mode: DisplayMode;
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speedMs: number;
  hasResult: boolean;
  onModeChange: (mode: DisplayMode) => void;
  onPrevious: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReset: () => void;
  onSpeedChange: (speedMs: number) => void;
  onSeek: (step: number) => void;
};

/** Navigate the shared LRU/MRU timeline without mutating recorded results. */
export function PlaybackControls({
  mode,
  currentStep,
  totalSteps,
  isPlaying,
  speedMs,
  hasResult,
  onModeChange,
  onPrevious,
  onNext,
  onPlayPause,
  onReset,
  onSpeedChange,
  onSeek,
}: PlaybackControlsProps) {
  const stepControlsDisabled = !hasResult || mode === "final";
  const timelineProgress = totalSteps > 0
    ? (currentStep / totalSteps) * 100
    : 0;

  return (
    <div className="playback-panel" aria-label="Simulation playback">
      <div className="mode-control" aria-label="Display mode">
        <button
          aria-pressed={mode === "step"}
          className={mode === "step" ? "is-active" : ""}
          onClick={() => onModeChange("step")}
          type="button"
        >
          Step-by-step
        </button>
        <button
          aria-pressed={mode === "final"}
          className={mode === "final" ? "is-active" : ""}
          onClick={() => onModeChange("final")}
          type="button"
        >
          Final snapshot
        </button>
      </div>

      <div className="transport-controls">
        <button disabled={stepControlsDisabled || currentStep === 0} onClick={onReset} type="button">
          <span aria-hidden="true">↺</span> Reset
        </button>
        <button disabled={stepControlsDisabled || currentStep === 0} onClick={onPrevious} type="button">
          <span aria-hidden="true">←</span> Previous
        </button>
        <button className="play-button" disabled={stepControlsDisabled || totalSteps === 0} onClick={onPlayPause} type="button">
          <span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span> {isPlaying ? "Pause" : "Play"}
        </button>
        <button disabled={stepControlsDisabled || currentStep >= totalSteps} onClick={onNext} type="button">
          Next <span aria-hidden="true">→</span>
        </button>
      </div>

      <label className="timeline-control">
        <span>Step {currentStep} of {totalSteps}</span>
        <input
          disabled={stepControlsDisabled}
          max={Math.max(totalSteps, 1)}
          min="0"
          onChange={(event) => onSeek(Number(event.target.value))}
          style={{ "--timeline-progress": `${timelineProgress}%` } as CSSProperties}
          type="range"
          value={currentStep}
        />
      </label>

      <label className="speed-control">
        <span>Playback speed</span>
        <select
          disabled={stepControlsDisabled}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          value={speedMs}
        >
          <option value="1000">Slow · 1.0 s</option>
          <option value="600">Normal · 0.6 s</option>
          <option value="250">Fast · 0.25 s</option>
        </select>
      </label>
    </div>
  );
}
