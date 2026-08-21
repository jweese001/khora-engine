# Khora Engine Project Cleanup Plan

**Date:** 2026-08-06  
**Status:** In Progress  
**Priority:** Stabilization before additional feature work

## Goal

Restore day-to-day trust in the current `main` branch without pausing the project for a broad rewrite. Cleanup should make the repository:

- honestly verified
- lint-clean and more strongly typed
- clearer about state ownership
- safer to change around Three.js runtime code
- quieter during normal execution
- easier to navigate and load
- accurately documented

The cleanup must preserve deterministic generation, Orbit V1 behavior, galaxy marker workflows, shaders, and current UI modes.

## Current Baseline

Evidence gathered on 2026-08-06:

- `npm run build` passes.
- `npm run check:determinism` passes for seeds `1, 42, 777, 12345, 99999`.
- `npm run validate-physics` exits successfully, but its moon-orbit assertions use stale `moon.orbitDistanceKM` fields instead of current `moon.orbitDistance`; the reported pass is therefore not fully trustworthy.
- `npm run lint` fails with **37 errors and 2 warnings**.
- There are no tracked `*.test.*` or `*.spec.*` files.
- `src/components/Canvas/ThreeSceneManager.tsx` is 1,824 lines and owns scene initialization, camera/input, system and galaxy rendering, orbit updates, markers, selection, debug controls, uniform updates, and disposal.
- `src/store/system-store.ts` and `src/store/galaxy-store.ts` overlap around galaxy behavior; a deprecated no-op `updateGalaxyConfig()` path remains wired through `CanvasContainer`.
- Runtime/source scripts contain roughly 210 console calls and 34 explicit `any` occurrences.
- Production build warns about a JavaScript chunk around 950 KB; Monaco and mode-specific features are eagerly imported.
- README, TASKS, verification guidance, and historical root documents do not consistently describe current runtime behavior.
- The working tree includes untracked project metadata, agent definitions, temporary files, and spacecraft assets whose intended source-control status is not documented.

## Cleanup Principles

1. **Repair proof before refactoring.** A green but ineffective check is worse than a missing check.
2. **Remove dead migration paths before adding abstractions.** Do not preserve no-op compatibility code without a current consumer.
3. **Extract one runtime seam at a time.** Do not rewrite `ThreeSceneManager` wholesale.
4. **Keep one source of truth per state domain.** React/Zustand own application state; scene controllers own ephemeral Three.js objects.
5. **Make every cleanup slice behavior-preserving and independently verifiable.**
6. **Do not mix cleanup with visual redesign or new gameplay features.**

---

## Phase 0 — Establish a Trustworthy Baseline

### 0.1 Capture current behavior and commands

**Modify:**
- `docs/verification.md`
- `TASKS.md` current-priority section only

**Actions:**
- Record current command outcomes and known caveats.
- Add separate system-view and galaxy-view smoke checklists.
- Add Orbit V1 checks: play, pause, speed, reset, trails, selection auto-focus.
- Explicitly state that performance certification remains manual.

**Verification:**
- A contributor can run each documented command without hidden setup.
- Every command named in docs exists in `package.json`.

### 0.2 Decide source-control policy for untracked files

**Review:**
- `.pi/`
- `.obsidian/`
- `.cmux.yaml`
- `.pi-subagents/`
- `tmp/`
- `public/spacecraft/`
- `context.md`
- `progress.md`

**Actions:**
- Commit `.pi/agents/` only if project-local agent definitions are intentional shared tooling.
- Ignore `.pi-subagents/`, `tmp/`, and Obsidian workspace state.
- Decide explicitly whether `.cmux.yaml`, `progress.md`, and spacecraft assets are product inputs or local artifacts.
- Do not delete or ignore `public/spacecraft/` until licensing/provenance and runtime use are confirmed.

**Likely modify:** `.gitignore`

**Verification:** `git status --short` shows only intentional work.

---

## Phase 1 — Repair Verification and Add Focused Tests

### 1.1 Fix the physics validator false-positive path

**Modify:**
- `scripts/validate-physics.js`
- optionally `src/types/celestial-bodies.ts` comments if units need clarification

**Actions:**
- Replace stale `moon.orbitDistanceKM` access with `moon.orbitDistance`.
- Add finite-number checks before comparisons so `undefined`/`NaN` cannot silently pass.
- Validate consistency between compatibility fields and `generatedOrbit`:
  - planet AU distance and period
  - moon km distance and period
  - parent IDs and distance units
- Type script error handling defensively.
- Suppress generator debug output during automated checks rather than accepting thousands of log lines.

**Verification:**
- Deliberately corrupt one generated moon orbit in a temporary local check and confirm validation fails.
- `npm run validate-physics` passes on unmodified generated systems.

### 1.2 Add a minimal unit-test runner

**Modify:** `package.json`, `package-lock.json`  
**Create:** focused tests under `src/**/__tests__/` or `tests/`

**Recommended runner:** Vitest, because the project already uses Vite and TypeScript.

**First tests:**
- `src/utils/random.test.ts`
  - same seed gives the same sequence
  - range helpers stay in bounds
- `src/orbits/orbit-solver.test.ts`
  - circular orbit baseline
  - one-period repeat
  - retrograde reversal
  - inclination/orientation finite output
  - invalid/edge eccentricity policy
- `src/generation/system-generator.test.ts`
  - normalized same-seed equality
  - orbit data exists for planets and moons
  - generated values are finite

**Verification:** `npm test -- --run`

### 1.3 Strengthen the default verification command

**Modify:** `package.json`, `docs/verification.md`

**Target scripts:**
- `test`: focused unit tests
- `check`: lint + tests + build
- `verify`: lint + tests + build + physics + determinism

Initially keep `verify:legacy` or run lint separately if needed while lint debt is being removed. Promote lint into the default gate only after Phase 2 is complete.

**Exit criterion:** checks fail for known bad data and pass for current valid behavior.

---

## Phase 2 — Remove Dead Paths and Restore Type/Lint Health

### 2.1 Remove the obsolete galaxy-config bridge

**Modify:**
- `src/store/system-store.ts`
- `src/components/Canvas/CanvasContainer.tsx`
- `src/components/Canvas/ThreeSceneManager.tsx`

**Actions:**
- Confirm no active UI relies on `systemStore.galaxyConfig`.
- Remove `galaxyConfig`, `updateGalaxyConfig`, and reset behavior from `system-store`.
- Remove the `CanvasContainer` effect that invokes the deprecated no-op method.
- Remove `ThreeSceneManager.updateGalaxyConfig()`.
- Keep visual layer configuration solely in `galaxy-store`.

**Verification:**
- Search returns no obsolete API references.
- Galaxy layer and marker smoke checks pass.

### 2.2 Introduce explicit boundary types

**Create or modify:**
- `src/components/Canvas/scene-types.ts` (new)
- `src/store/system-store.ts`
- `src/store/galaxy-store.ts`
- renderer files currently using `any`

**Types to define:**
- discriminated `SelectedObject` union for star, planet, and moon data
- galaxy-system selection payload
- `SceneSelectionPayload`
- narrow `SceneManagerHandle`/port used by UI or stores
- shader uniform value type instead of arbitrary `any`
- typed procedural `Galaxy` input for `initializeFromProceduralGalaxy`

**Rule:** Do not solve lint by globally disabling `no-explicit-any`. Use `unknown` only at genuine external boundaries and narrow it immediately.

### 2.3 Clear all existing lint findings

**Modify:** files reported by `npm run lint`, especially:
- `src/components/Canvas/MarkerSystemManager.ts`
- `src/components/Canvas/ThreeSceneManager.tsx`
- `src/components/DiceRoller/DiceRollerScene.tsx`
- `src/components/IDE/ShaderControls.tsx`
- `src/components/IDE/ShaderViewer.tsx`
- `src/components/UI/ControlDrawer.tsx`
- `src/generation/*.ts`
- `src/rendering/*.ts`
- `src/store/*.ts`
- `test-generation.ts`

**Actions:**
- Replace `any` with domain types.
- Repair the DiceRoller effect callback/ref cleanup warnings.
- Remove unused deprecated helpers or mark intentional compatibility exports with a documented policy.
- Apply `const` where appropriate.

**Verification:** `npm run lint` exits 0.

**Exit criterion:** lint becomes part of `npm run verify`.

---

## Phase 3 — Contain Runtime Architecture Incrementally

Do not begin this phase until the verification path is credible and lint is green.

### 3.1 Extract shared disposal utilities

**Create:** `src/rendering/dispose.ts`  
**Modify:** scene and rendering classes with duplicate disposal logic.

**Responsibilities:**
- dispose geometry
- dispose single/array materials
- dispose textures referenced by materials where owned
- remove object trees safely

**Verification:** regeneration and galaxy/system switching produce no console errors; targeted disposal unit tests where practical.

### 3.2 Extract camera transitions and focus behavior

**Create:** `src/components/Canvas/CameraController.ts`  
**Modify:** `ThreeSceneManager.tsx`

**Move:**
- camera animation state
- focus-by-ID movement
- galaxy/system framing transitions
- camera debug-position reporting if retained

**Boundary:** controller receives camera + OrbitControls and has no Zustand imports.

### 3.3 Extract orbital runtime bindings

**Create:** `src/components/Canvas/OrbitRuntimeManager.ts`  
**Modify:** `ThreeSceneManager.tsx`

**Move:**
- planet/moon orbit binding types and registries
- per-frame `sampleOrbitPosition` updates
- planet spin and tilt transform updates
- orbit trail visibility synchronization

**Boundary:** pure orbit data and simulation snapshot enter the manager; it updates existing transforms but does not generate systems or own global state.

### 3.4 Separate selection/raycast interpretation

**Create:** `src/components/Canvas/SelectionController.ts`  
**Modify:** `ThreeSceneManager.tsx`, `CanvasContainer.tsx`

**Move:**
- pointer normalization
- raycast filtering
- parent traversal/userData interpretation
- typed selection payload creation

**Keep:** React/store actions in `CanvasContainer`; controller reports typed events.

### 3.5 Reassess before further extraction

After the first three seams, measure `ThreeSceneManager` responsibilities and line count. Only then decide whether system rendering and galaxy rendering deserve separate orchestrators. Avoid introducing managers that merely rename methods without reducing coupling.

**Phase exit criteria:**
- `ThreeSceneManager` remains the lifecycle coordinator but no longer implements camera animation, orbital update mechanics, or selection interpretation directly.
- Extracted controllers do not import Zustand.
- System and galaxy smoke checks pass after each extraction.

---

## Phase 4 — Logging and Debug Hygiene

### 4.1 Remove hot-path and generation noise

**Modify first:**
- `src/generation/moon-generator.ts`
- `src/components/Canvas/CanvasContainer.tsx`
- `src/components/Canvas/ThreeSceneManager.tsx`
- `src/store/*.ts`
- galaxy and marker renderers

**Actions:**
- Remove routine success logs from generation and frame-adjacent paths.
- Preserve actionable warnings/errors.
- Replace ad hoc logs with a small development-only logger only if debug namespaces are genuinely useful.
- Keep keyboard debug tools behind an explicit development/debug setting.

**Target:** normal `npm run verify` output contains summaries, not per-body logs.

### 4.2 Define production debug exposure

**Modify:** `src/main.tsx`

**Decision:** expose `window.__KHORA_STORE__` only in development unless the production console API is an intentional supported feature.

**Verification:** production build has no routine debug output during basic flows.

---

## Phase 5 — Reduce Initial Bundle and UI Coupling

### 5.1 Lazy-load mode-specific application surfaces

**Modify:** `src/components/App.tsx`

**Candidates:**
- `DiceRollerFlow`
- Architect-only canvas/control/IDE surface
- future Explorer surface

Use `React.lazy` and `Suspense` with small branded loading fallbacks.

### 5.2 Lazy-load Monaco-backed inspector tabs

**Modify:**
- `src/components/IDE/IDEPanel.tsx`
- `src/components/IDE/DataInspector.tsx`
- `src/components/IDE/ShaderViewer.tsx`

Do not load Monaco until the Data or Shaders tab is opened. Consider mounting only the active tab, while preserving any state that users actually need.

### 5.3 Review icon-font payload

**Review:** `src/main.tsx`, MDI usage across components.

The full MDI font ships several large font formats. Keep MDI as the project icon system, but configure only required webfont formats or use a supported tree-shakeable MDI package if that preserves the design requirement.

**Verification:**
- Compare `dist/assets` before/after.
- Confirm route/mode transitions and inspector tabs still work.
- Set a measurable initial-JS target after the first split; do not hide warnings by only raising Vite's limit.

---

## Phase 6 — Documentation and Repository Navigation

### 6.1 Rewrite the README around current reality

**Modify:** `README.md`

Include:
- current app modes and which are complete/experimental/placeholders
- current controls and shortcuts sourced from code
- Orbit V1 capabilities and limitations
- truthful verification commands
- current React 19 / Three.js 0.180 stack
- live deployment details

Remove duplicated historical acceptance claims from the primary path; link to historical reports instead.

### 6.2 Repair TASKS as an active tracker

**Modify:** `TASKS.md`

Actions:
- remove literal patch artifacts
- keep a short current queue at the top
- move or link historical milestone detail rather than mixing it into the active sprint
- add cleanup tickets with states and command-based acceptance criteria

### 6.3 Organize historical documents without losing history

**Create:** `docs/archive/README.md`  
**Move later, in a dedicated docs-only commit:** historical `SESSION-*`, milestone reports, debug HTML/JS, and superseded plans.

First create an index classifying documents as:
- current reference
- active plan/spec
- historical milestone
- troubleshooting artifact

Do not combine mass document moves with source-code cleanup.

### 6.4 Refresh technical quick references

**Modify:** `PLANNING.md`, `docs/verification.md`

Update architecture/file maps to include:
- app modes
- two-store ownership decision
- orbit solver/runtime
- galaxy layers/marker system
- extracted scene controllers

---

## Recommended Ticket Order

1. **CLEAN-01 (complete):** Physics validator repair and quiet verification output
2. **CLEAN-02 (complete):** Add Vitest and orbit/RNG/system generation tests
3. **CLEAN-03 (complete):** Remove obsolete galaxy-config bridge
4. **CLEAN-04 (complete):** Type selection, shader overrides, galaxy init, and scene-manager boundaries
5. **CLEAN-05 (complete):** Resolve remaining lint errors and hook warnings
6. **CLEAN-06 (complete):** Add lint/tests to the default verification gate
7. **CLEAN-07 (complete):** Extract disposal utilities
8. **CLEAN-08 (complete):** Extract camera controller
9. **CLEAN-09 (complete):** Extract orbit runtime manager
10. **CLEAN-10 (complete):** Extract selection controller
11. **CLEAN-11:** Logging/debug cleanup
12. **CLEAN-12:** Lazy-load modes and Monaco inspector tabs
13. **CLEAN-13:** README/TASKS/current-doc refresh
14. **CLEAN-14:** Repository hygiene and historical-doc index/move

Tickets 1–6 are the critical trust-restoration path. Tickets 7–10 reduce future regression risk. Tickets 11–14 improve operational quality and navigation.

## Verification Matrix

| Change area | Required automated checks | Required smoke checks |
|---|---|---|
| Generation/physics | unit tests, physics, determinism, build | generate known seeds |
| Store/type contracts | lint, unit tests, build | system/galaxy switching |
| Scene extraction | lint, tests, build | render, select, focus, regenerate, dispose |
| Orbit runtime | orbit solver tests, determinism, build | play/pause/speed/reset/trails |
| Galaxy cleanup | lint, build | layers, markers, click-to-enter, return |
| Bundle splitting | build and artifact comparison | mode transitions, inspector tabs |
| Documentation | command/link review | follow README from clean install |

## Risks and Mitigations

### Risk: Cleanup becomes a rewrite
Keep each ticket behavior-preserving and stop scene extraction after the identified seams until measured again.

### Risk: Store cleanup breaks galaxy UI
Remove only the confirmed deprecated system-store bridge; preserve `galaxy-store` behavior and smoke-test every layer/marker operation.

### Risk: Tests encode current bugs
Start with mathematical invariants, schema/unit contracts, and known deterministic behavior—not snapshots of whole scene implementations.

### Risk: Document reorganization creates noisy history
Perform moves in a docs-only commit after content is classified.

### Risk: Bundle work changes mount/lifecycle behavior
Split one surface at a time and smoke-test React StrictMode mount/unmount behavior.

## Definition of Done

Cleanup is complete enough to resume feature work when:

- `npm run verify` includes lint, focused tests, build, physics validation, and determinism and all pass.
- Physics checks are proven capable of failing on malformed moon data.
- No ESLint errors or hook warnings remain.
- The deprecated galaxy-config bridge is gone and ownership is documented.
- Critical scene boundaries use explicit types rather than `any`.
- `ThreeSceneManager` is a coordinator rather than the direct implementation site for camera animation, orbit updates, and raycast interpretation.
- Normal verification and common runtime flows are not flooded with debug logs.
- Initial bundle composition is improved through real code splitting.
- README, TASKS, and verification docs describe the current branch accurately.
- `git status` is predictable because local artifacts and shared project tooling have an explicit policy.

## Recommended Next Action

Begin with **CLEAN-01** only. It repairs the false confidence in the current verification baseline and is the prerequisite for safely executing every later cleanup ticket.
