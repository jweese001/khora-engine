# Verification Harness

This is the minimal repeatable verification surface for Phase A stabilization work.

## Default baseline

Run this for normal A/B ticket verification:

```bash
npm run verify
```

`npm run verify` executes, in order:
1. `npm run build`
2. `npm run validate-physics`
3. `npm run check:determinism`

Use the individual commands when you need to isolate a failure.

## Expected results

### 1. Build
```bash
npm run build
```
Expected:
- exits with code `0`
- TypeScript build succeeds
- Vite production build completes

### 2. Physics validation
```bash
npm run validate-physics
```
Expected:
- exits with code `0`
- physics validation completes without reporting validation failures

### 3. Determinism
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
