# Fully Associative Cache Policy Lab

**CSARCH2 Group 1 · Machine 6 · Fully Associative LRU vs. MRU Cache Simulator**

A browser-based simulator that runs Least Recently Used (LRU) and Most Recently Used (MRU) fully associative caches side by side. Both caches start empty, receive the same validated sequence of read accesses, and expose every hit, miss, load, eviction, recency update, latency, and aggregate statistic.

The simulator implements the assigned Machine 6 cache-memory requirements. The cache engine is independent of React so its behavior can be tested without the interface.

## Features

- Configurable power-of-two block size and cache-line count.
- Fixed 1,024-block main memory with addresses from 0 through 1,023.
- Required sequential, mid-repeat/reverse, and 64-access random workloads, plus custom input.
- Reproducible random sequences using an optional seed, regeneration, and sequence copying.
- Side-by-side LRU/MRU states driven by the same access sequence.
- Step forward/back, seek, play, pause, reset, speed selection, and final-snapshot mode.
- Synchronized trace entries explaining hits, empty-slot loads, evictions, recency, and latency.
- Load-through and non-load-through timing with editable cache and block-fetch times.
- Accesses, hits, misses, rates, total time, and Average Memory Access Time (AMAT) for both policies.
- Animated memory data path and live simulation telemetry.
- Responsive layouts, keyboard focus states, and reduced-motion support.

## Run locally

Prerequisite: a current Node.js release compatible with Vite 8.

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite. On shells where `npm` is directly executable, the `.cmd` suffix is optional.

Quality checks:

```powershell
npm.cmd test
npm.cmd run build
```

The production build is written to the ignored `dist/` directory. It can be previewed locally with `npm.cmd run preview`.

## Using the simulator

1. Choose the block size and number of cache lines. Both must be powers of two; the minima are 2 words and 4 lines.
2. Select load-through or non-load-through and enter positive timing values in nanoseconds.
3. Choose a required sequence or enter custom comma/whitespace-separated block addresses.
4. Select **Run LRU / MRU comparison**.
5. Inspect the statistics, cache panels, animated data path, and synchronized trace.
6. Use the playback controls to identify the accesses where LRU and MRU diverge.

Changing configuration, sequence, read-policy, or timing values clears the previous result so stale output is never shown with new inputs.

## Simulation specification

### Configuration and validation

| Input | Rule |
|---|---|
| Block size | Safe integer, at least 2 words, and a power of two. Values of 16 and larger are supported. |
| Cache lines (`n`) | Safe integer, at least 4, and a power of two. Values of 16 and larger are supported. |
| Main memory | Fixed at 1,024 blocks. |
| Block address | Base-10 integer from 0 through 1,023 inclusive. |
| Custom sequence | Non-empty; commas and/or whitespace are accepted; duplicates and order are preserved. |
| Cache time (`C`) | Positive finite number in nanoseconds. |
| Memory time (`M`) | Positive finite number in nanoseconds for one complete block fetch. |

Validation occurs before a run starts and reports field-specific or token-specific messages. Decimals, malformed tokens, invalid powers of two, out-of-range addresses, empty sequences, and non-positive timing values are rejected without partially changing simulator state.

The assignment defines no strict maximum cache size. The interface applies transparent browser-resource safeguards of 4,096 cache lines and 250,000 recorded cache-line snapshots per policy. These limits protect rendering and do not change the browser-independent engine's cache rules.

### Fully associative mapping

Every main-memory block can occupy any cache slot; there is no set index. For each request, the simulator:

1. Searches all valid cache lines for the requested block.
2. Records a hit and updates recency if the block is resident.
3. On a miss, fills the lowest-numbered empty slot if one exists.
4. If the cache is full, asks the active replacement policy for a victim, records the eviction, and loads the requested block.
5. Records an immutable after-access snapshot, explanation, and latency.

Hits preserve a line's insertion tick and update its last-access tick. New loads set both ticks to the current one-based access number. The lowest slot index is the deterministic fallback for an artificial recency tie.

### Replacement policies

- **LRU:** on a full-cache miss, evict the block with the smallest last-access tick—the block accessed furthest in the past.
- **MRU:** on a full-cache miss, evict the block with the largest last-access tick—the block accessed most recently.

Empty slots always take priority over replacement. Both policies update recency on hits and loads.

### Required test sequences

Let `n` be the selected number of cache lines.

#### Test 1: Sequential

`[0..2n-1] + [0..2n-1]`, with length `4n`. “Repeat the sequence two times” is interpreted as two total passes, matching the assignment example.

For `n = 4`:

```text
0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7
```

#### Test 2: Mid-repeat and reverse

Concatenate these six segments exactly:

1. Ascending `0..n-1`.
2. Ascending `0..2n-1`.
3. Repeat ascending `0..2n-1`.
4. Descending `n-1..0`.
5. Descending `2n-1..0`.
6. Repeat descending `2n-1..0`.

The resulting length is `10n`. For `n = 4`:

```text
0,1,2,3,0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,3,2,1,0,7,6,5,4,3,2,1,0,7,6,5,4,3,2,1,0
```

The two predefined `0..2n-1` generators are available through `n = 512`; larger values would exceed address 1,023. Larger valid caches can still use compatible custom or random sequences.

#### Test 3: Random

The generator produces exactly 64 integer addresses in `[0, 1023]`. A supplied seed is trimmed, hashed with 32-bit FNV-1a, and used as the Mulberry32 state, making the sequence repeatable within this application version. A blank seed intentionally uses `Math.random`.

### Read policy and timing model

Both read policies allocate a missed block and produce the same hit/miss and replacement behavior. They differ only in CPU-visible miss latency:

- **Load-through:** the requested word is forwarded while the cache line is filled; no second cache read is needed.
- **Non-load-through:** the complete block is loaded before the requested word is read from cache and sent to the CPU.

With `C` as cache lookup/access time and `M` as the time to fetch one complete block:

- Hit latency: `C`.
- Load-through miss latency: `C + M`.
- Non-load-through miss latency: `M + 2C`.
- Total time: `(hits × hit latency) + (misses × miss latency)`.
- AMAT: `total time / total accesses`.

The editable defaults, `C = 1 ns` and `M = 100 ns`, are teaching values rather than hardware measurements. Inputs are block addresses, not word addresses, so block size does not change the address sequence, hit/miss pattern, or formula for `M`.

The assignment names the read policies without defining exact timing equations. This interpretation follows the [USC EE 457 cache hierarchy slides](https://ee.usc.edu/~redekopp/ee457/slides/EE457Unit7a_Cache.pdf) and [NPTEL/IIT Guwahati's cache operation notes](https://archive.nptel.ac.in/content/storage2/courses/106103068/module03_memory/lecture_02/slides/slide3.htm). An instructor-provided course formula should override this documented interpretation.

## Required output coverage

For each access and policy, the synchronized trace provides:

- One-based access number and requested memory block.
- Hit or miss result and selected cache slot.
- Evicted block, or no eviction.
- Hit, empty-slot, LRU-victim, or MRU-victim selection reason.
- Cache state after the access and the recency data used to justify replacement.
- Access latency under the active read policy.

The visual comparison provides labeled LRU and MRU panels, every visible slot's index/state/resident block/recency data, the current access, distinct hit/miss/load/eviction styling, responsive side-by-side or stacked layouts, playback controls, final-state mode, and a text trace in both modes.

Each policy reports all seven required statistics:

1. Total memory accesses.
2. Cache hits.
3. Cache misses.
4. Hit rate.
5. Miss rate.
6. Total memory access time.
7. Average Memory Access Time (AMAT).

Active timing inputs, formulas, and units are displayed with the results.

## Reproducible required-sequence results

These values use 4-word blocks, 4 cache lines, load-through, `C = 1 ns`, and `M = 100 ns`. The random case uses seed `group-1`. Automated regression tests lock the values to the simulator implementation.

| Sequence | Policy | Accesses | Hits | Misses | Hit rate | Total time | AMAT |
|---|---:|---:|---:|---:|---:|---:|---:|
| Sequential | LRU | 16 | 0 | 16 | 0% | 1,616 ns | 101 ns |
| Sequential | MRU | 16 | 4 | 12 | 25% | 1,216 ns | 76 ns |
| Mid-repeat/reverse | LRU | 40 | 4 | 36 | 10% | 3,640 ns | 91 ns |
| Mid-repeat/reverse | MRU | 40 | 17 | 23 | 42.5% | 2,340 ns | 58.5 ns |
| Random (`group-1`) | LRU | 64 | 0 | 64 | 0% | 6,464 ns | 101 ns |
| Random (`group-1`) | MRU | 64 | 1 | 63 | 1.5625% | 6,364 ns | 99.4375 ns |

### Result analysis

In the sequential workload, each pass spans twice the cache capacity. LRU continuously replaces the oldest line, so the blocks needed at the beginning of the second pass have already been removed. MRU repeatedly removes the newest line instead, preserving four older blocks long enough to be revisited and producing four hits.

The mid-repeat/reverse workload deliberately changes direction and revisits older regions. At `n = 4`, those revisits favor MRU's tendency to preserve older lines: MRU records 17 hits versus LRU's 4. This is a property of this workload, not a general claim that MRU is always better.

The seeded random workload has almost no locality relative to a four-line cache. Consequently, both policies are dominated by misses: LRU has no hits and MRU has one. With load-through, every hit saves exactly `M = 100 ns` compared with a miss, which explains the differences in total time and AMAT.

## Test-case screenshots

The screenshots below were captured from the deployed simulator. Each result image includes the active cache geometry, timing inputs, workload source, access count, and exact sequence, so the displayed cache state and statistics can be checked against the same run. The expected arithmetic uses `C = 1 ns` and `M = 100 ns` unless stated otherwise.

### Required workloads

#### Sequential

- [Sequential cache and final state](docs/screenshots/01-sequential-cache.png)
- [Sequential statistics](docs/screenshots/02-sequential-statistics.png)

With four cache lines, the required sequential generator produces two passes over blocks `0..7`, or 16 accesses. LRU misses on all 16 accesses because loading the second half of each pass removes the oldest blocks needed at the start of the next pass. MRU preserves enough older blocks to produce four hits. The screenshot totals are therefore correct: LRU uses `16 × 101 ns = 1,616 ns`, while MRU uses `(4 × 1 ns) + (12 × 101 ns) = 1,216 ns`. Dividing by 16 gives AMAT values of `101 ns` and `76 ns`.

#### Mid-repeat and reverse

- [Mid-repeat/reverse cache](docs/screenshots/03-mid-repeat-cache.png)
- [Mid-repeat/reverse statistics](docs/screenshots/04-mid-repeat-statistics.png)

For four lines, the six required ascending, repeated, and descending segments contain 40 accesses. Reversing direction revisits older blocks, which favors MRU for this particular sequence. The recorded 4 LRU hits and 17 MRU hits match the regression-tested results. Their totals also follow the load-through formula: LRU is `(4 × 1) + (36 × 101) = 3,640 ns`, and MRU is `(17 × 1) + (23 × 101) = 2,340 ns`, producing AMAT values of `91 ns` and `58.5 ns`.

#### Seeded random

- [Seeded random cache](docs/screenshots/05-random-cache.png)
- [Seeded random statistics](docs/screenshots/06-random-statistics.png)

The screenshot identifies seed `group-1` and shows all 64 generated addresses, making the workload reproducible. A four-line cache has very little opportunity to retain useful blocks in this sequence: LRU records no hits and MRU records one. Thus LRU takes `64 × 101 ns = 6,464 ns`; MRU takes `(1 × 1 ns) + (63 × 101 ns) = 6,364 ns`. The corresponding AMAT values, `101 ns` and `99.4375 ns`, agree with the documented automated regression.

### Special and edge cases

- [Policy divergence at access 9](docs/screenshots/07-step-09-policy-divergence.png) — The ninth sequential access requests block `0`. LRU has already evicted it while admitting blocks `4..7`, so LRU misses and replaces block `4`. MRU repeatedly evicted the newest resident during those admissions and preserved block `0`, so MRU hits. The shared step counter, requested block, and different cache outcomes demonstrate that both policies receive the same input but apply different victim rules.

- [Synchronized trace](docs/screenshots/08-synchronized-trace.png) — The trace shows both policies filling empty slots for accesses 1–4, then selecting different victims on full-cache misses. At access 9, the LRU row reports a miss and `101 ns`, while the MRU row reports a hit and `1 ns`. This agrees with the cache-state screenshot and verifies that decisions and timing remain aligned by access number.

- [Non-load-through timing](docs/screenshots/09-non-load-through-timing.png) — The custom sequence `0, 1, 2, 3, 0` produces four compulsory misses followed by one hit for both policies. Under non-load-through, a miss costs `M + 2C = 102 ns` and a hit costs `C = 1 ns`. Therefore the correct total is `(4 × 102) + 1 = 409 ns`, and `409 / 5 = 81.8 ns` AMAT, exactly as shown.

- [Minimum and boundary values](docs/screenshots/10a-minimum-and-boundary-values.png)
- [Minimum and boundary statistics](docs/screenshots/10b-minimum-and-boundary-statistics.png)

  This case uses the minimum valid 2-word block size and the inclusive address boundaries `0` and `1,023` in the sequence `0, 1023, 0, 1023`. The first reference to each block misses, the repeated references hit, and no replacement is needed because only two of four lines are occupied. Both policies consequently produce two hits and two misses. The captured run uses non-load-through timing, so the total is `(2 × 102) + (2 × 1) = 206 ns`, with `51.5 ns` AMAT.

- [Repeated block hits](docs/screenshots/11a-repeated-block-hits.png)
- [Repeated block hits statistics](docs/screenshots/11b-repeated-block-hits-statistics.png)

  Repeating block `7` four times must cause one initial miss followed by three hits; replacement policy cannot affect the result because the block remains in the first occupied line. Both policies correctly report a 75% hit rate. With the captured non-load-through timing, `(1 × 102) + (3 × 1) = 105 ns`, and `105 / 4 = 26.25 ns` AMAT.

- [Sixteen-line cache values](docs/screenshots/12a-sixteen-line-cache-values.png)
- [Sixteen-line cache statistics](docs/screenshots/12b-sixteen-line-cache-statistics.png)

  This run uses 16-word blocks and 16 cache lines, demonstrating that the simulator accepts the assignment's larger recommended powers of two. The sequential generator expands to 64 accesses over two passes of blocks `0..31`. LRU records 64 misses, while MRU preserves 16 blocks for the second pass and records 16 hits. The displayed load-through totals, `6,464 ns` for LRU and `4,864 ns` for MRU, follow directly from those counts.

- [Invalid-input validation](docs/screenshots/13-invalid-input-validation.png) — A 3-word block is rejected because it is not a power of two, and three cache lines are rejected because the minimum is four. The custom parser separately identifies `-1`, `1024`, `1.5`, and `abc` as negative, above the maximum, decimal, and malformed addresses. The preview remains invalid and no comparison result is produced, demonstrating that validation is specific and atomic rather than starting a partial simulation.

## Edge cases and automated verification

The test suite covers:

- Minimum geometry, 16-line and larger caches, and invalid geometry.
- Addresses 0 and 1,023, malformed/decimal/out-of-range tokens, empty sequences, and duplicates.
- Empty and partially filled caches, lowest-slot filling, repeated hits, and immutable snapshots.
- LRU/MRU victim selection, deterministic ties, hit-before-full-miss behavior, and policy divergence.
- Sequences shorter than, equal to, and longer than cache capacity; identical-address runs; and required generators.
- Seeded repeatability, unseeded bounds, zero-hit and hit-after-first-access cases.
- Both read-policy formulas, invalid timing values, totals, rates, AMAT, and documented result regressions.
- Forward/back navigation, reset behavior, final-snapshot mode, and stale-result invalidation.
- Rendered application controls, statistics, trace latency, and simulation telemetry.

`npm.cmd test` runs the complete Vitest suite. `npm.cmd run build` performs TypeScript checking before creating the Vite production bundle.

## Architecture and project layout

The project uses React 19, TypeScript 7, Vite 8, Vitest 4, and plain CSS.

- `src/simulator/`: framework-independent types, validation, cache operations, LRU/MRU policies, comparison engine, generators, timing, and unit tests.
- `src/application.ts`: browser-facing custom-sequence parsing and immutable playback helpers.
- `src/components/`: configuration, workload, playback, cache, telemetry, statistics, and trace views.
- `src/App.tsx`: top-level application state and simulator/UI integration.
- `src/styles/global.css`: responsive visual system, states, animation, focus, and reduced-motion behavior.

The shared comparison runner validates and clones one sequence, creates two empty caches, and advances them together. Recorded snapshots power backward navigation; the UI never mutates or attempts to reverse live engine state.

## Scope and assumptions

- The simulation is read-only. Writes, write policies, dirty bits, and stored word values are out of scope.
- Direct-mapped and set-associative caches are out of scope.
- Multilevel caches, instruction/data separation, prefetching, coherence, virtual memory, bus contention, and cycle-accurate hardware timing are out of scope.
- Both read policies allocate on a miss; “non-load-through” does not mean “do not load the cache.”
- `M` represents a complete-block fetch because the required inputs contain no word offset.
- New loads are most-recently used, and every access advances the recency tick.
