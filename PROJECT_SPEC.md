# CSARCH2 Cache Memory Simulator - Technical Specification

## Document Status

- Group: Group 1
- Assigned machine: Machine 6
- Project: Web-based cache memory simulator
- Comparison: Fully Associative LRU versus Fully Associative MRU
- Target completion date: August 2, 2026
- Specification status: Implemented; verification and implementation history are tracked in `PROGRESS.md`
- Assignment source inspected: `C:\Users\matth\Downloads\CSARCH2 Simulation Project1 - 3rd Term AY 2025-2026.pdf`

This document converts the assignment and the project's gradual development schedule into an implementation plan. Any behavior that the assignment does not define is marked as an assumption and must remain visible in the final README.

## 1. Scope

The application will simulate and compare two initially empty, fully associative caches using the same sequence of read accesses:

1. Least Recently Used (LRU) replacement.
2. Most Recently Used (MRU) replacement.

The application will be a static web application with a graphical user interface suitable for GitHub Pages. The cache engine will be independent of React and browser rendering so it can be tested directly.

The simulator models cache metadata and block residency, not the contents of individual words. Block size remains a required configuration value and is used by the documented timing model, but input sequences identify main-memory block addresses rather than word addresses.

### Out of scope

- Write operations and write policies.
- Set-associative or direct-mapped caches.
- Dirty bits and write-back traffic.
- Instruction/data cache separation.
- Multi-level caches, prefetching, coherence, and virtual memory.
- Real hardware timing or cycle-accurate bus contention.

## 2. Functional Requirements

The finished application must:

- Accept and validate all cache, sequence, mode, read-policy, and timing inputs before simulation starts.
- Run LRU and MRU from the same initial state and the exact same access sequence.
- Prefer the lowest-numbered empty cache slot before invoking a replacement policy.
- Update recency on every hit and every successful load.
- Record immutable or safely isolated state snapshots so navigation does not mutate earlier steps.
- Provide the three required sequence generators and a custom-sequence option.
- Provide step-by-step animated trace and final-snapshot-only modes.
- provide a text trace in both display modes.
- Show separate, preferably side-by-side, LRU and MRU cache states and statistics.
- Allow step forward, step backward through recorded snapshots, play, pause, reset, and animation-speed control.
- Show all required statistics using one shared timing module.
- Remain usable on desktop and narrow/mobile layouts.

## 3. Configuration and Input Rules

### 3.1 Block size

- Unit: words per main-memory block.
- Must be an integer.
- Minimum: 2 words.
- Must be a power of two.
- No assignment-defined maximum will be imposed.
- The implementation must support at least 16 words.
- Validation rule: `value >= 2 && Number.isSafeInteger(value) && (value is a power of two)`.

For values too large to allocate or render safely in the current browser, the UI may issue a transparent resource warning instead of silently freezing. This is an implementation safeguard, not a claimed assignment maximum.

### 3.2 Number of cache blocks

- Unit: cache lines/slots.
- Must be an integer.
- Minimum: 4.
- Must be a power of two.
- No assignment-defined maximum will be imposed.
- The implementation must support at least 16 blocks.
- A value greater than 1,024 is logically allowed, although at most 1,024 distinct valid main-memory blocks can become resident.
- Validation rule: `value >= 4 && Number.isSafeInteger(value) && (value is a power of two)`.

### 3.3 Main memory

- Fixed size: 1,024 blocks.
- Valid block addresses: integers from 0 through 1,023 inclusive.
- Main-memory size is displayed but is not user-editable.

### 3.4 Access sequence

- Every entry must be a base-10 integer in `[0, 1023]`.
- An empty sequence is invalid.
- Separators accepted by the custom-sequence parser should include commas and whitespace.
- Duplicate and consecutive duplicate accesses are valid and must be preserved.
- LRU and MRU must receive cloned/equivalent copies of the same parsed sequence.
- The random generator must produce exactly 64 valid block addresses and expose copy and regenerate controls.
- A blank random seed means non-reproducible generation; a supplied seed means deterministic generation.

### 3.5 Read policy

The user selects exactly one of:

- Load-through.
- Non-load-through, also called no-load-through in some references.

The policy changes observed miss latency only. It does not change hit detection, allocation, cache contents, recency updates, or which block LRU/MRU evicts.

### 3.6 Timing inputs

- Cache access time `C`: positive finite number, in nanoseconds.
- Main-memory block fetch time `M`: positive finite number, in nanoseconds.
- Proposed defaults: `C = 1 ns` and `M = 100 ns`.
- The UI must label the unit and explain that `M` is the time to fetch the complete selected block from main memory.
- Timing calculations must live in one reusable module.

These defaults are configurable teaching values, not measurements of a particular processor.

## 4. Fully Associative Mapping

Any main-memory block may occupy any cache slot. A lookup therefore compares the requested block address against every valid cache line conceptually. The simulator does not compute a set index.

On a miss:

1. If an invalid/empty line exists, select the lowest-numbered empty slot.
2. Otherwise ask the configured replacement policy for a victim.
3. Record the victim and its recency metadata before overwriting it.
4. Load the requested block into the selected slot.
5. Mark the loaded block as the most recently accessed block.

## 5. Replacement Policy Definitions

### 5.1 LRU

When the cache is full and a miss occurs, LRU evicts the valid block whose most recent successful access occurred furthest in the past.

- A hit makes the hit block most recently used.
- A newly loaded block becomes most recently used.
- Empty slots are used before any LRU eviction.
- The trace will expose `lastAccessAt` and an MRU-to-LRU ordering before and after the access.

### 5.2 MRU

When the cache is full and a miss occurs, MRU evicts the valid block whose most recent successful access occurred most recently.

- A hit makes the hit block most recently used and therefore the next MRU victim if no later block is accessed.
- A newly loaded block becomes most recently used.
- Empty slots are used before any MRU eviction.
- The trace will expose `lastAccessAt` and an MRU-to-LRU ordering before and after the access.

### 5.3 Determinism

Each access receives a strictly increasing integer tick. This prevents meaningful recency ties. The lowest slot index is the deterministic fallback if malformed imported state ever contains a tie; ordinary engine-generated state should not require the fallback.

## 6. Proposed Read-Policy Interpretation

The assignment names the policies but does not define them. The proposed interpretation follows cache-read terminology in which both policies allocate the missed block:

- **Load-through:** after a miss, the requested word is forwarded to the CPU as it becomes available while the cache line is being filled. The CPU does not perform a second cache read for that request.
- **Non-load-through:** after a miss, the complete block is fetched into the cache first; the requested word is then read from the cache and forwarded to the CPU.

Consequences for this simulator:

- Both policies produce identical hits, misses, evictions, final cache contents, and recency order for a given replacement policy and sequence.
- They differ only in miss time and therefore AMAT and total memory access time.
- All misses allocate the requested block. "Non-load-through" must not be interpreted as "do not load the cache."
- Since test inputs are block addresses and contain no word offsets, the simulator treats `M` as the total time to fetch one complete block. It does not guess which word within the block was requested.

This interpretation is consistent with the assignment's read-only cache context and with teaching references that describe load-through as forwarding the requested word during a block fill, while no-load-through forwards it after the entire block is loaded:

- [USC EE 457 Cache and Memory Hierarchy slides](https://ee.usc.edu/~redekopp/ee457/slides/EE457Unit7a_Cache.pdf)
- [NPTEL/IIT Guwahati - Operation of Cache Memory](https://archive.nptel.ac.in/content/storage2/courses/106103068/module03_memory/lecture_02/slides/slide3.htm)

If the instructor provides a different course-specific formula, this section and the timing module must be updated before results are finalized.

## 7. Proposed Timing Model and Formulas

Definitions:

- `A`: total number of block accesses.
- `H`: cache hits.
- `X`: cache misses, where `X = A - H`.
- `C`: cache access/lookup time.
- `M`: complete main-memory block fetch time.

Per-access latency:

- Hit under either read policy: `T_hit = C`.
- Load-through miss: `T_miss_load = C + M`.
- Non-load-through miss: `T_miss_nonload = C + M + C = M + 2C`.

Required statistics:

- Total access count: `A = H + X`.
- Hit rate: `H / A`; displayed as `(H / A) * 100%`.
- Miss rate: `X / A`; displayed as `(X / A) * 100%`.
- Total memory access time: `T_total = (H * T_hit) + (X * T_miss)`.
- Average Memory Access Time: `AMAT = T_total / A`.

Equivalent AMAT form:

`AMAT = (hitRate * C) + (missRate * T_miss)`

`A` must be greater than zero because an empty sequence cannot start. Internal statistics helpers should still handle `A = 0` without returning `NaN`, for safe initial UI display.

## 8. Required Test Sequences

Let `n` be the selected number of cache blocks.

### 8.1 Test Case 1 - Sequential sequence

Generate `0` through `2n - 1`, then repeat that same range once more.

- Formula: `[0..2n-1] + [0..2n-1]`.
- Length: `4n`.
- For `n = 4`: `0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7`.
- Valid-address constraint: this predefined generator is available only when `n <= 512`, because larger values make `2n - 1` exceed block address 1,023. Larger cache configurations remain valid for compatible custom or random sequences.

"Repeat the sequence two times" is interpreted as two total passes, matching the assignment example.

### 8.2 Test Case 2 - Mid-repeat and reverse sequence

Concatenate these six segments exactly:

1. Ascending `0` through `n - 1`.
2. Ascending `0` through `2n - 1`.
3. Repeat ascending `0` through `2n - 1`.
4. Descending `n - 1` through `0`.
5. Descending `2n - 1` through `0`.
6. Repeat descending `2n - 1` through `0`.

- Length: `10n`.
- For `n = 4`: `0,1,2,3,0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,3,2,1,0,7,6,5,4,3,2,1,0,7,6,5,4,3,2,1,0`.
- Valid-address constraint: this predefined generator is available only when `n <= 512`, for the same fixed-main-memory reason as Test Case 1.

### 8.3 Test Case 3 - Random sequence

- Generate exactly 64 accesses.
- Each value is an integer in `[0, 1023]`.
- Allow regeneration.
- Allow copying the displayed sequence.
- Accept an optional seed.
- A supplied seed must produce the same 64-value sequence across repeated runs of this application version.
- The chosen deterministic pseudo-random algorithm must be documented once implemented so results do not depend on browser-specific randomness.
- Implemented algorithm: trim the supplied seed, hash it with 32-bit FNV-1a, and use the hash as the Mulberry32 state. A blank seed uses `Math.random` and is intentionally non-reproducible.

## 9. Required Outputs

### 9.1 Per-step trace entry

Each displayed LRU and MRU trace entry includes:

- Access number, one-based for display.
- Requested memory block.
- Hit or miss.
- Selected cache slot.
- Evicted block, or `none`.
- Reason for slot selection: hit, empty slot, LRU victim, or MRU victim.
- Cache state after the access.
- Recency order before and after the access.
- Relevant timestamps/recency ranks used to justify an eviction.
- Access latency under the selected read policy.

### 9.2 Visual output

- Clearly labeled LRU and MRU panels.
- Slot index, valid/empty state, resident block, and recency information for every visible cache line.
- Current requested block and current access number.
- Distinct visual treatment for hit, miss, loaded line, and evicted line.
- Side-by-side layout when space permits; stacked comparison on narrow screens.
- Step-by-step animated mode and final-snapshot-only mode.
- Text log in both modes.
- Controls for step forward, step backward using recorded snapshots, play, pause, reset, and animation speed.

### 9.3 Statistical output for each policy

- Total memory access count.
- Cache hit count.
- Cache miss count.
- Cache hit rate.
- Cache miss rate.
- Average Memory Access Time.
- Total memory access time.

The UI must show the active formula inputs and units rather than presenting unexplained totals.

## 10. Proposed Typed Data Model

The final TypeScript names may change during implementation, but responsibilities should remain separate.

```text
CacheConfiguration
  blockSizeWords
  cacheBlockCount
  mainMemoryBlockCount = 1024
  readPolicy
  cacheAccessTimeNs
  mainMemoryBlockFetchTimeNs

CacheLine
  slotIndex
  valid
  blockAddress
  insertedAt
  lastAccessAt

TraceEntry
  accessIndex
  requestedBlock
  result
  selectedSlot
  evictedBlock
  selectionReason
  cacheBefore
  cacheAfter
  recencyBefore
  recencyAfter
  accessTimeNs

SimulationResult
  policy
  configuration
  inputSequence
  trace
  finalCache
  statistics
```

Snapshots must not share mutable cache-line objects with later steps.

## 11. Validation and Error Handling

- Validate typed form values before converting them into a simulation configuration.
- Return specific validation messages beside the relevant field.
- Prevent simulation start while any error exists.
- Do not round invalid decimal values into valid integers.
- Do not silently discard out-of-range sequence items.
- Report which token is invalid in a custom sequence.
- Treat whitespace-only seed as no seed.
- Reject non-positive or non-finite timing values.
- Avoid broad exception handling; expected invalid inputs should be represented as validation results.

## 12. Edge Cases to Cover

- Minimum block size of 2 words.
- Block size of 16 words and larger valid powers of two.
- Invalid block sizes: blank, 0, 1, negative, decimal, nonnumeric, and non-power-of-two.
- Minimum cache size of 4 blocks.
- Cache size of 16 and larger valid powers of two.
- Cache larger than the 1,024-block main memory.
- Invalid cache sizes: blank, below 4, decimal, nonnumeric, and non-power-of-two.
- Memory block boundaries 0 and 1023.
- Invalid addresses -1, 1024, decimal, empty token, and nonnumeric token.
- Empty cache and cache not yet full.
- Repeated hit to one block.
- Consecutive duplicate accesses.
- A hit immediately before a full-cache miss, verifying LRU/MRU recency changes.
- LRU and MRU choosing different victims.
- Sequence shorter than, equal to, and longer than cache capacity.
- All accesses identical.
- Empty custom sequence.
- Deterministic seeded random reproduction and unseeded regeneration.
- Zero-hit and all-hit-after-first-load statistics.
- Both read policies producing identical cache behavior but different miss timing.
- Reset and backward navigation restoring exact snapshots.

## 13. Suggested Project Structure

This is a plan only; no scaffold is created in Step 1.

```text
CSARCH2-G1-Simulation-Project/
  public/
    screenshots/
  src/
    components/
      CachePanel.tsx
      ConfigurationPanel.tsx
      PlaybackControls.tsx
      SequencePanel.tsx
      StatisticsPanel.tsx
      TraceLog.tsx
    simulator/
      engine.ts
      policies/
        lru.ts
        mru.ts
      sequences.ts
      timing.ts
      types.ts
      validation.ts
    styles/
      global.css
    App.tsx
    main.tsx
  tests/
    engine.test.ts
    policies.test.ts
    sequences.test.ts
    timing.test.ts
    validation.test.ts
  .gitignore
  index.html
  package.json
  PROJECT_SPEC.md
  PROGRESS.md
  README.md
  tsconfig.json
  vite.config.ts
```

## 14. Proposed Technology Stack

Because the canonical repository contained only its README when inspected, the selected stack for Step 2 is:

- Vite.
- React.
- TypeScript.
- Plain CSS.
- Vitest for unit tests.
- React Testing Library only if component behavior later requires it.

The project should avoid runtime dependencies unless they provide a clear benefit. The engine and sequence/timing modules should remain framework-independent.

## 15. Implementation Milestones

1. Requirements and technical plan: inspect sources and create `PROJECT_SPEC.md` and `PROGRESS.md`.
2. Repository scaffold: create the minimal Vite/React/TypeScript shell, placeholders, global styling, and test configuration; no simulator logic.
3. Shared simulator core: validation, cache types, fully associative lookup/loading, snapshots, trace entries, and focused tests; replacement policies remain behind an interface.
4. LRU/MRU and generators: implement policies, required sequences, seeded random generation, replacement explanations, and policy tests.
5. GUI integration: validated controls, cache visualizations, playback, final mode, responsive comparison, and trace log.
6. Statistics and documentation: complete timing/statistics, quality checks, required results generated by the program, analysis, and README sections/placeholders.
7. Final repository preparation: full tests/build, cleanliness/security/link review, and submission checklist without unauthorized push or deployment.

Implementation status: all seven local milestones are complete. No commit, push, pull request, or deployment was performed as part of final preparation.

Every milestone requires the exact authorization command `NEXT STEP`. Commits, pushes, and deployment require their separately specified commands.

## 16. Decisions and Assumptions Requiring Visibility

- No cache-simulator repository was initially present in the local workspace. The user later identified `https://github.com/matthewandrecorral/CSARCH2-G1-Simulation-Project.git` as the canonical repository; it was cloned to `C:\Users\matth\CSARCH2-G1-Simulation-Project` for Step 2. The unrelated CSARCH2 Virtual Exhibit repository remains untouched.
- All simulated operations are reads because the assignment specifies read policy and block-access sequences but no writes or data values.
- Both read policies use read allocation. Their difference is CPU-visible miss delivery timing, not cache loading behavior.
- `M` is a configurable complete-block fetch time because the input contains block addresses, not word offsets.
- Default times are `C = 1 ns` and `M = 100 ns`; these remain editable and must be identified as teaching defaults.
- Each simulation starts with all cache lines invalid/empty.
- Empty slots are chosen in ascending slot order.
- Recency is updated on both hits and loads, using monotonically increasing access ticks.
- A newly loaded block is the most recently used block for both policies.
- Step backward will use recorded snapshots rather than attempting to invert cache operations.
- A random seed promises repeatability within the application using a documented local PRNG; it does not promise compatibility with unrelated generators.
- Block size does not change the block-address hit/miss pattern. It describes words per transferred block and is shown in configuration/timing explanations.
- "No strict maximum" is treated as no assignment-defined cap, subject to JavaScript safe-integer validation and transparent browser resource constraints.
- The PDF's sequential wording is resolved by its example: two total passes through `0..2n-1`.

## 17. Open Questions for Instructor Confirmation

These do not block the planned implementation, but any instructor answer overrides the corresponding assumption:

- Does the course define load-through/non-load-through with a different latency formula?
- Should main-memory access time mean one word transfer or a complete block transfer?
- Must block size influence miss time by multiplying a per-word memory time?
- Are users expected to enter block addresses only, as the provided sequences imply, or full word addresses that the simulator converts to block addresses?
- Is a particular seeded pseudo-random algorithm required?
- Is there an instructor-required UI theme, hosting provider, or naming convention beyond GitHub and a live deployment link?
