# Simulator Module

This directory contains the browser-independent cache engine and its shared types and validation helpers.

Step 3 implements fully associative lookup, empty-slot selection, cache loading, hit recency updates, isolated snapshots, access history, and trace generation.

Step 4 adds concrete LRU and MRU policies, a comparison runner that gives both policies the same validated sequence, and all three required sequence generators. Seeded random sequences use a documented local algorithm: the trimmed seed is hashed with 32-bit FNV-1a, then Mulberry32 produces exactly 64 addresses. A blank seed uses `Math.random` so regeneration is non-deterministic.

The sequential and mid-repeat/reverse patterns contain addresses through `2n - 1`. They are therefore available through `n = 512`; above that point the assignment-defined pattern would exceed the fixed valid address range of 0 through 1,023. Larger cache configurations remain valid for compatible custom and random sequences.

Step 5 connects the React interface to the comparison runner and renders the engine's recorded snapshots and trace. Playback state, form parsing, and display-only browser resource safeguards live outside this simulator directory so the core remains browser-independent.

Timing calculations remain intentionally unimplemented until Step 6.
