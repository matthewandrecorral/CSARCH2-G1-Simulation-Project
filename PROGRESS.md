# Development Progress

## Project Status

* Current authorized step: Step 5 - GUI Integration and Visualization
* Current status: Completed; files are frozen pending explicit authorization
* Last completed step: Step 5 - GUI Integration and Visualization
* Next proposed step: Step 6 - Timing and Statistics
* Last updated: August 2, 2026 (Asia/Singapore)

## Completed Work

* Re-read the Step 1 technical specification and progress record before making changes.
* Cloned the user-provided canonical GitHub repository and inspected its branch, status, remote, history, files, README, and source state.
* Confirmed that the canonical repository contained only a one-line README and no existing application stack or source code.
* Reconciled `PROJECT_SPEC.md` into the canonical repository and corrected the earlier repository-location assumption.
* Configured a minimal Vite, React, and TypeScript application with Vitest.
* Added a basic HTML and React entry point.
* Added a responsive page shell with project identity and navigation links.
* Added static placeholders for cache configuration, test sequences, LRU results, MRU results, statistics, and the trace log.
* Added a small reusable `Panel` component for consistent section structure.
* Added a CSS reset and minimal responsive global styling.
* Reserved the browser-independent simulator directory with documentation stating that no simulation logic exists yet.
* Added one static-render smoke test for the application shell.
* Installed only the dependencies required for the selected stack and test/build workflow.
* Ran the test suite, production build, and local-server HTTP check successfully.
* Did not implement cache validation, cache state transitions, replacement policies, sequence generators, timing calculations, animation, or final styling.
* Did not commit, push, create a pull request, or deploy.
* Re-read the technical specification and progress record, inspected Git status, and reconciled Step 2 with the canonical repository before starting Step 3.
* Added browser-independent, discriminated TypeScript cache-line structures for empty and occupied slots.
* Added validation for block size, cache-block count, the fixed 1,024-block main memory, and valid block addresses from 0 through 1,023.
* Added fully associative hit detection, lowest-numbered empty-slot selection, cache loading, and repeated-hit recency updates.
* Added a controlled simulator class that records access history and detailed before/after trace entries.
* Added safely isolated cache and recency snapshots so callers cannot mutate recorded simulator state.
* Added a shared replacement-policy interface with validated victim decisions and required decision explanations.
* Kept LRU and MRU victim-selection logic completely out of Step 3; tests use only a fixed-slot test double to exercise the shared interface.
* Added focused automated tests for configuration/address validation, initial cache state, misses, empty-slot selection, repeated hits, recency, replacement delegation, invalid policy decisions, invalid accesses, and snapshot isolation.
* Preserved the React scaffold without connecting the engine to the GUI.
* Did not add packages, implement sequence generators, calculate timing/statistics, implement animation, commit, push, create a pull request, or deploy.
* Re-read the specification, progress record, Git status, and every Step 3 simulator file before starting Step 4.
* Added concrete LRU replacement using the smallest `lastAccessAt` and concrete MRU replacement using the largest `lastAccessAt`.
* Added deterministic lowest-slot-index tie handling and replacement explanations containing the victim slot, block, timestamp, and selection reason.
* Added a comparison runner that validates one sequence once, starts both caches empty, and feeds every address to LRU and MRU in the same order.
* Added full simulation results containing policy name, validated configuration, input history, trace, and final cache state.
* Added the exact required sequential and mid-repeat/reverse sequence generators.
* Added the exactly 64-access random generator with optional deterministic seed support using a trimmed seed, 32-bit FNV-1a, and Mulberry32.
* Added sequence-level validation that preserves duplicates, rejects empty input, and reports every invalid address position.
* Added focused tests covering empty and partially filled caches, repeated hits, duplicates, minimum and 16-line caches, LRU/MRU evictions, deterministic ties, identical comparison inputs, exact assignment sequences, random bounds, seeded reproduction, blank seeds, and invalid sequences.
* Documented that the predefined `0..2n-1` patterns are available through `n = 512`; larger valid cache configurations require compatible custom or random sequences because main-memory addresses end at 1,023.
* Did not connect the engine to React, implement playback or animation, add timing/statistics, install packages, commit, push, create a pull request, or deploy.
* Re-read the Step 5 scope, technical specification, progress record, application scaffold, and complete simulator interface before changing the GUI.
* Replaced the static scaffold with controlled block-size and cache-block inputs connected to the shared configuration validator and comparison engine.
* Added sequential, mid-repeat/reverse, seeded or unseeded random, and custom sequence controls with live previews, random regeneration, and clipboard copy feedback.
* Added a strict custom-sequence parser accepting comma and whitespace separators while preserving duplicates and reporting empty, malformed, decimal, and out-of-range tokens.
* Added side-by-side LRU/MRU cache panels backed exclusively by immutable recorded snapshots, including line validity, resident block, recency rank/timestamp, current access, hit/miss state, loads, evictions, and replacement explanations.
* Added step forward, step backward, timeline seek, play, pause, reset, playback-speed selection, and final-snapshot-only mode.
* Added a synchronized text trace showing both policy decisions for every currently visible access in either display mode.
* Added responsive layouts, sticky navigation/table headings, keyboard focus treatment, reduced-motion support, and narrow-screen stacking.
* Added transparent UI resource safeguards without changing the simulator core's assignment-defined validation rules.
* Kept timing inputs, read-policy latency, statistics calculations, screenshots, deployment, and final documentation out of Step 5.
* Did not add packages, commit, push, create a pull request, or deploy.

## Files Changed

* Created `.gitignore`.
* Created `PROJECT_SPEC.md` in the canonical repository.
* Created `PROGRESS.md` in the canonical repository.
* Created `index.html`.
* Created `package.json`.
* Created `package-lock.json` through npm.
* Created `tsconfig.json`.
* Created `vite.config.ts`.
* Created `src/App.tsx`.
* Created `src/App.test.tsx`.
* Created `src/main.tsx`.
* Created `src/vite-env.d.ts`.
* Created `src/components/Panel.tsx`.
* Created `src/components/CachePanelPlaceholder.tsx`.
* Created `src/components/ConfigurationPlaceholder.tsx`.
* Created `src/components/SequencePlaceholder.tsx`.
* Created `src/components/StatisticsPlaceholder.tsx`.
* Created `src/components/TraceLogPlaceholder.tsx`.
* Created `src/simulator/README.md`.
* Created `src/styles/global.css`.
* Preserved the existing `README.md` without modification.
* Generated local `node_modules/` and `dist/` directories; both are ignored and must not be committed.
* Created `src/simulator/types.ts`.
* Created `src/simulator/validation.ts`.
* Created `src/simulator/cache.ts`.
* Created `src/simulator/engine.ts`.
* Created `src/simulator/validation.test.ts`.
* Created `src/simulator/engine.test.ts`.
* Modified `src/simulator/README.md` to describe the implemented Step 3 boundary.
* Modified `PROGRESS.md` with the completed Step 3 record.
* Created `src/simulator/policies/shared.ts`.
* Created `src/simulator/policies/lru.ts`.
* Created `src/simulator/policies/mru.ts`.
* Created `src/simulator/policies/policies.test.ts`.
* Created `src/simulator/comparison.ts`.
* Created `src/simulator/sequences.ts`.
* Created `src/simulator/sequences.test.ts`.
* Modified `src/simulator/types.ts` with simulation and comparison result types.
* Modified `src/simulator/validation.ts` with whole-sequence validation.
* Modified `src/simulator/validation.test.ts` with sequence-validation tests.
* Modified `src/simulator/README.md` with Step 4 behavior, seeded algorithm, and address-range constraint.
* Modified `PROJECT_SPEC.md` with implementation status, generator details, and the `n <= 512` predefined-pattern constraint.
* Modified `PROGRESS.md` with the completed Step 4 record.
* Created `src/application.ts` with custom-sequence parsing and recorded-snapshot playback helpers.
* Created `src/application.test.ts` with parsing, navigation-boundary, snapshot-restoration, and divergent-policy tests.
* Replaced the static `src/App.tsx` scaffold with the interactive Step 5 application.
* Modified `src/App.test.tsx` to verify the interactive shell's key controls and output regions.
* Created `src/components/ConfigurationPanel.tsx`.
* Created `src/components/SequencePanel.tsx`.
* Created `src/components/PlaybackControls.tsx`.
* Created `src/components/CachePanel.tsx`.
* Created `src/components/TraceLog.tsx`.
* Modified `src/components/StatisticsPlaceholder.tsx` to clearly preserve the Step 6 boundary.
* Removed the superseded configuration, sequence, cache, and trace placeholder components.
* Rebuilt `src/styles/global.css` for the functional controls, cache states, trace, responsive layout, focus visibility, and reduced-motion preference.
* Modified `src/simulator/README.md` with the completed GUI-integration boundary.
* Modified `PROGRESS.md` with the completed Step 5 record.

## Commands and Checks

* `Get-Content PROJECT_SPEC.md -Raw` and `Get-Content PROGRESS.md -Raw` in the Step 1 planning directory: passed; both documents were re-read.
* `git status --short --branch` and file listing in the Step 1 directory: confirmed it was not a Git repository and contained only the two planning files.
* Initial `git clone`: failed because the restricted sandbox could not create the worktree directory.
* Approved `git clone https://github.com/matthewandrecorral/CSARCH2-G1-Simulation-Project.git`: passed.
* `git status`, `git remote -v`, `git log -1`, top-level listing, `rg --files`, and README inspection: passed; found a clean `main` branch tracking `origin/main`, one existing README, and no application code.
* `node --version`: passed with Node.js `v24.15.0`.
* Initial `npm` invocation: failed because PowerShell script execution blocked `npm.ps1`.
* Retried with `npm.cmd`: correct Windows executable selected.
* Restricted-sandbox dependency installation did not produce output and was terminated before retrying through the approved network path.
* Approved `npm.cmd install` commands: passed; installed React, React DOM, Vite, TypeScript, Vitest, the React Vite plugin, and type packages. npm audited 63 packages and reported 0 vulnerabilities.
* `npm.cmd test`: passed; 1 test file and 1 test passed.
* `npm.cmd run build`: passed; TypeScript checking and Vite production build completed successfully.
* Local Vite server check on `127.0.0.1:4173`: passed with HTTP 200 and the expected page title; the server was then stopped.
* Initial Step 3 `git status` from `C:\Users\matth`: confirmed that the starting directory was not a Git repository; sandboxed home-directory enumeration was denied.
* Approved read-only home-directory listing: passed; located the planning-only directory and canonical Git repository.
* `git status --short --branch`, `rg --files`, and reads of `PROJECT_SPEC.md`, `PROGRESS.md`, project configuration, application entry points, tests, and components: passed; confirmed a clean canonical repository on `feature/repository-scaffold` before edits.
* Preliminary `npm.cmd run build`: passed after the core implementation; TypeScript checking and Vite production build succeeded.
* `npm.cmd test`: passed after Step 3 tests; 3 test files and 28 tests passed.
* Final `npm.cmd run build`: passed; TypeScript checking and Vite production build succeeded.
* `git diff --check`: passed; no whitespace errors were reported.
* `git diff --stat` and `git status --short --branch`: reviewed the Step 3 modifications and confirmed that no dependency/build output is pending in Git.
* Initial Step 4 `git status --short --branch`, specification/progress reads, simulator file listing, and full Step 3 source/test inspection: passed; Step 3 files matched the recorded state.
* Preliminary `npm.cmd run build`: passed after policy, comparison, and generator implementation; TypeScript checking and Vite production build succeeded.
* `npm.cmd test`: passed after Step 4 tests; 5 test files and 53 tests passed.
* Final `npm.cmd run build`: passed; TypeScript checking and Vite production build succeeded.
* `git diff --check`: passed; no whitespace errors were reported.
* `git diff --stat`, policy/generator file listing, and `git status --short --branch`: reviewed the cumulative uncommitted Step 3 and Step 4 changes; no dependency/build output is pending in Git.
* `npm.cmd test`: passed after Step 5 implementation; 6 test files and 58 tests passed.
* `npm.cmd run build`: passed after Step 5 implementation; TypeScript checking and Vite production bundling succeeded.
* Browser-control setup was attempted for interactive visual verification but no in-app or Chrome browser backend was available in the session; no alternate browser tool or screenshots were used.
* Local Vite server check on `127.0.0.1:4173`: returned HTTP 200; the temporary server process was stopped afterward.
* `git diff --check`: passed after Step 5; no whitespace errors were reported.

## Tests

* Passing: 58 of 58 automated tests across 6 files, including interactive application-shell rendering, custom-sequence parsing, recorded-snapshot navigation/restoration, shared-engine, validation, LRU/MRU policy, comparison, and sequence-generator coverage; TypeScript type check; Vite production build; local development-server HTTP check.
* Failing: None.
* Not yet implemented: Timing/statistics tests. Browser-driven GUI testing was unavailable in the current tool session; pure playback-state tests and server-render checks cover the Step 5 state boundary.

## Decisions and Assumptions

* The canonical local project root is `C:\Users\matth\CSARCH2-G1-Simulation-Project`, cloned from the user-provided GitHub repository.
* The earlier planning-only directory at `C:\Users\matth\CSARCH2-Cache-Simulator-Group-1` remains outside the Git repository and was left untouched after its documents were reconciled.
* Selected stack: Vite 8, React 19, TypeScript 7, plain CSS, and Vitest 4, using the dependency versions recorded in `package-lock.json`.
* React Testing Library and a browser DOM test environment were not installed because the current smoke test can use React's server renderer.
* The application is interactive and imports the comparison engine through a thin application layer; the simulator itself remains independent of React and browser rendering.
* The simulator accepts block addresses, not word addresses, because the assignment sequences use block indices.
* Both read policies will allocate missed blocks and differ only in CPU-visible miss timing.
* Proposed timing defaults remain `C = 1 ns` and `M = 100 ns`, with `M` representing a complete block fetch.
* Both caches will start empty, choose the lowest-numbered empty slot first, and update recency on hits and loads.
* No dependency or build output will be committed from `node_modules/` or `dist/`.
* Cache lines use a discriminated union so an empty line cannot carry a block address or recency timestamp in valid TypeScript state.
* Access numbers are one-based monotonically increasing recency ticks. Hits preserve `insertedAt` and update `lastAccessAt`; loads set both timestamps to the current access number.
* Recency snapshots are ordered from most recently accessed to least recently accessed, with slot index as a deterministic fallback.
* The shared engine knows only the `ReplacementPolicy` interface. A policy supplies an occupied slot and a non-empty explanation; invalid decisions are rejected before simulator state changes.
* Geometry validation imposes no project-specific maximum. Values must be safe-integer powers of two and meet the assignment minimums; UI resource safeguards remain a later concern.
* Read policy and timing are intentionally absent from the Step 3 engine because they do not change cache residency; the documented read-policy interpretation and proposed `C = 1 ns`, `M = 100 ns` defaults remain unchanged for the later timing module.
* LRU chooses the minimum `lastAccessAt`; MRU chooses the maximum. The lowest slot index is the explicit deterministic fallback for artificial ties.
* Replacement traces remain explainable through `replacementExplanation`, `evictedBlock`, the complete pre-access cache snapshot, and the MRU-to-LRU `recencyBefore` list.
* The comparison runner validates and clones one sequence before either simulator starts, then advances both policies together for each address.
* Seeded random generation is stable within this application version through 32-bit FNV-1a followed by Mulberry32. Seed whitespace is trimmed; a blank seed intentionally uses `Math.random`.
* The sequential and mid-repeat/reverse generators reject `n > 512` because their required maximum address `2n - 1` would exceed 1,023. This does not impose a maximum on cache configuration itself.
* Step navigation reads `cacheAfter` from the selected recorded trace entry; step zero creates a fresh empty snapshot, so backward navigation never mutates or attempts to invert engine state.
* Changing a configuration or sequence input invalidates the prior run, stops playback, and returns the display to step zero so previews cannot be confused with stale results.
* Selecting final-snapshot mode jumps a completed run to its last recorded step; selecting step-by-step mode returns it to the initial state.
* The interface caps a single visual run at 4,096 cache lines and 250,000 cache-line snapshots per policy. These are disclosed browser-resource safeguards, not simulator-core or assignment-defined geometry limits.
* The statistics panel remains visibly pending so Step 5 does not present invented timing values or unexplained totals.

## Known Issues

* The assignment does not define exact load-through/non-load-through timing semantics. The documented interpretation must be replaced if the instructor supplies a course-specific definition.
* The assignment PDF could not be visually rendered during Step 1 because no compatible renderer was installed; all three text pages were extracted successfully.
* The initial planning-only directory remains outside the canonical repository. It has not been deleted because deletion was neither requested nor needed.

## Next Step

* Proposed Step 6 is limited to the reusable timing/statistics module, load-through versus non-load-through selection, editable positive timing inputs, per-access latency, aggregate hit/miss/rate/time calculations, GUI integration, and focused tests.
* Step 6 must not create screenshots, deploy, or claim final documentation completion.
* Authorization requires the exact command `NEXT STEP`.
