# Verification Harness

This is the repeatable verification surface for current stabilization and feature work.

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

## Manual WebGL smoke checklist

Use this when a change affects UI, rendering, scene lifecycle, loading boundaries, or interaction behavior.

1. Start the app with `npm run dev` and open `/khora-engine/` in a WebGL-capable browser.
2. Confirm the landing page appears before Architect code is requested.
3. Enter Create mode and complete or bypass the dice flow.
4. Generate a system and verify star, planets, moons, orbit paths, controls, and inspector shell render.
5. Select a planet and moon; verify selection, optional auto-focus, data tab, and shader tab.
6. Resume, pause, change speed, reset time, and toggle orbit trails.
7. Generate a galaxy; verify layers and markers appear and marker controls respond.
8. Select a marker to enter its system, then return to the galaxy.
9. Regenerate once in each view and check for blank scenes, stale objects, or immediate console errors.
10. Confirm Data/Shaders tabs load on first use rather than at landing-page startup.

A headless environment without a WebGL context cannot certify this checklist.

## What this harness does not cover

- full acceptance testing
- deployment-provider correctness beyond a successful production build
- broad browser automation
- performance certification
- feature-specific visual validation beyond the minimal smoke checklist above

For the historical Phase 1 acceptance record, see [`archive/milestones/PHASE-1-ACCEPTANCE-TESTS.md`](archive/milestones/PHASE-1-ACCEPTANCE-TESTS.md).
