# Verification Harness

This is the minimal repeatable verification surface for Phase A stabilization work.

## Default baseline

Run this for normal A/B ticket verification:

```bash
npm run verify
```

`npm run verify` executes, in order:
1. `npm run lint`
2. `npm test`
3. `npm run build`
4. `npm run validate-physics`
5. `npm run check:determinism`

Use the individual commands when you need to isolate a failure. `npm run validate-physics:self-test` is an additional validator-integrity check and is intentionally not repeated in every default verification run.

## Expected results

### 1. Lint
```bash
npm run lint
```
Expected:
- exits with code `0`
- reports no ESLint errors or React hook warnings

### 2. Build
```bash
npm run build
```
Expected:
- exits with code `0`
- TypeScript build succeeds
- Vite production build completes

### 3. Physics validation
```bash
npm run validate-physics
```
Expected:
- exits with code `0`
- validates 100 generated systems without per-body debug noise
- rejects non-finite or non-positive planet/moon orbit values
- validates star/planet clearance and moon-size/resource ranges
- confirms `generatedOrbit` parent IDs, parent types, units, distances, periods, numeric fields, and eccentricities agree with body data

To prove the validator can reject malformed data, run:

```bash
npm run validate-physics:self-test
```

The self-test corrupts a generated moon orbit in memory and must report that the malformed value was detected.

### 4. Focused unit tests
```bash
npm test
```
Expected:
- exits with code `0`
- verifies seeded RNG determinism and helper bounds
- verifies circular, periodic, retrograde, inclined, and eccentric orbit-solver behavior
- verifies deterministic system generation and generated orbit contracts for known seeds
- verifies shared Three.js disposal behavior, including shared resources and material arrays
- verifies camera transition interpolation, user interruption, system framing, and galaxy distance limits
- verifies absolute-time planet/moon transforms, rotation overrides, trail visibility, and orbit runtime reset behavior
- verifies celestial raycast selection, galaxy marker selection, disabled-marker behavior, and selection-listener cleanup

### 5. Determinism
```bash
npm run check:determinism
```
Expected:
- exits with code `0`
- normalized `generateSystem(seed)` output matches for the same seed
- top-level `generatedAt` is excluded from equality

## Minimal manual smoke checklist

Only use this when a ticket changes UI, rendering, or scene interaction behavior.

1. Start the app:
   ```bash
   npm run dev
   ```
2. Open the local app in a browser.
3. Generate a system.
4. Confirm a system renders without an obvious blank scene failure.
5. Confirm there are no immediate console errors during generation.

This is intentionally small. Do not expand it into a broader QA matrix from this file.

## What this harness does not cover

- full acceptance testing
- CI/CD setup
- new test frameworks
- broad browser automation
- performance certification
- feature-specific visual validation beyond the minimal smoke checklist above

For historical/manual acceptance flows, see `PHASE-1-ACCEPTANCE-TESTS.md`.
