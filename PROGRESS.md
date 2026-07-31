# Development Progress

## Project Status

* Current authorized step: Step 2 - Repository Scaffold
* Current status: Completed; files are frozen pending explicit authorization
* Last completed step: Step 2 - Repository Scaffold
* Next proposed step: Step 3 - Core Fully Associative Simulator
* Last updated: July 31, 2026 (Asia/Singapore)

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

## Tests

* Passing: Application scaffold static-render smoke test (1 of 1); TypeScript type check; Vite production build; local development-server HTTP/title check.
* Failing: None.
* Not yet implemented: Simulator-core tests, input-validation tests, cache-state tests, timing tests, LRU/MRU tests, sequence-generator tests, and GUI interaction tests.

## Decisions and Assumptions

* The canonical local project root is `C:\Users\matth\CSARCH2-G1-Simulation-Project`, cloned from the user-provided GitHub repository.
* The earlier planning-only directory at `C:\Users\matth\CSARCH2-Cache-Simulator-Group-1` remains outside the Git repository and was left untouched after its documents were reconciled.
* Selected stack: Vite 8, React 19, TypeScript 7, plain CSS, and Vitest 4, using the dependency versions recorded in `package-lock.json`.
* React Testing Library and a browser DOM test environment were not installed because the current smoke test can use React's server renderer.
* The application shell is intentionally static. Disabled buttons and placeholder values do not claim working simulator behavior.
* The simulator module remains independent of React and browser rendering; no engine code is present yet.
* The simulator accepts block addresses, not word addresses, because the assignment sequences use block indices.
* Both read policies will allocate missed blocks and differ only in CPU-visible miss timing.
* Proposed timing defaults remain `C = 1 ns` and `M = 100 ns`, with `M` representing a complete block fetch.
* Both caches will start empty, choose the lowest-numbered empty slot first, and update recency on hits and loads.
* No dependency or build output will be committed from `node_modules/` or `dist/`.

## Known Issues

* The assignment does not define exact load-through/non-load-through timing semantics. The documented interpretation must be replaced if the instructor supplies a course-specific definition.
* The assignment PDF could not be visually rendered during Step 1 because no compatible renderer was installed; all three text pages were extracted successfully.
* The initial planning-only directory remains outside the canonical repository. It has not been deleted because deletion was neither requested nor needed.

## Next Step

* Proposed Step 3 is limited to the browser-independent fully associative simulator core: typed cache structures, configuration and address validation, hit detection, lowest-empty-slot selection, loading, access history, trace generation, and focused automated tests.
* Step 3 must not implement LRU/MRU victim-selection details, sequence generators, full GUI integration, or animation.
* Authorization requires the exact command `NEXT STEP`.
