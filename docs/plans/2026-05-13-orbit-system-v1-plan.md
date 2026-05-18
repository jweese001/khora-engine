# Orbit System V1 Implementation Plan

**Date:** 2026-05-13  
**Status:** In Progress  
**Priority:** B1  
**Related spec:** `docs/specs/2026-05-13-orbit-systems-design-spec.md`

## Goal

Implement a deterministic, visually convincing orbit system for star systems that supports:

- stable planetary and moon orbital motion
- global simulation time control
- system-view controls for play, pause, reset, and time speed
- future reuse by broader motion systems, including spacecraft approximation

This plan intentionally avoids force-based simulation. Orbit motion should be computed from explicit orbit data and global simulation time, not from accumulated physics integration.

---

## Product/Architecture Summary

Orbit V1 should be built from three separate layers:

1. **Orbit data**
   - canonical generated orbital elements for planets and moons
   - compatible with future sparse overrides

2. **Global simulation time**
   - one shared time source for the whole game
   - supports pause/resume/reset and time scaling

3. **Deterministic orbit solver**
   - computes current local position from orbit data + simulation time
   - parent-relative for moons
   - stable under time scaling and reset

This keeps the runtime simple and deterministic while preserving a clean path toward future spacecraft-relative motion.

---

## Design Constraints

- Preserve current procedural generation as the canonical source of baseline systems.
- Avoid broad refactors of unrelated rendering/UI systems.
- Keep existing `orbitDistance` / `orbitalPeriod` fields temporarily for compatibility during migration.
- Use absolute simulation time to compute positions; do not incrementally integrate orbit transforms frame-to-frame.
- Treat time manipulation as global game state, even if controls first appear in system view.
- Favor readable orbital motion over astrophysical completeness.

---

## Target V1 Scope

### In scope
- explicit generated orbit data for planets and moons
- deterministic runtime orbit motion
- global simulation time state/actions
- system-view orbit controls: start, stop, reset, speed up / slow down
- parent-relative moon motion
- orbit ring rendering based on explicit orbit data
- minimal inspector exposure for orbit state

### Out of scope for this pass
- orbit editing UI
- force simulation / n-body interactions
- long-term stability simulation
- spacecraft physics implementation
- full save/load behavior for simulation time state
- advanced orbit trails/history rendering
- moon spin / tilt runtime
- broader multi-body motion authoring beyond current planet controls

---

## Planned Implementation Phases

## Phase 1 — Orbit data model and compatibility layer

### Objective
Introduce explicit orbit types without breaking current generation or rendering.

### Files
- **Modify:** `src/types/celestial-bodies.ts`
- **Possibly create:** `src/types/orbits.ts` if orbit types grow too large for the existing file

### Changes
Add orbit-specific types such as:

```ts
export type OrbitParentType = 'star' | 'planet';
export type OrbitDirection = 'prograde' | 'retrograde';

export interface OrbitalElements {
  parentId: string;
  parentType: OrbitParentType;
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  longitudeOfAscendingNode: number;
  argumentOfPeriapsis: number;
  meanAnomalyAtEpoch: number;
  orbitalPeriod: number;
  epoch: number;
  rotationDirection: OrbitDirection;
  distanceUnit: 'AU' | 'km';
}

export interface OrbitStateSample {
  localPosition: { x: number; y: number; z: number };
  trueAnomaly: number;
  meanAnomaly: number;
  radius: number;
}
```

Add explicit orbit data to bodies while preserving compatibility fields:

- `Planet.generatedOrbit: OrbitalElements`
- `Moon.generatedOrbit: OrbitalElements`

Retain existing:
- `orbitDistance`
- `orbitalPeriod`

for now, so existing systems continue to compile during migration.

### Verification
- TypeScript builds after introducing types.
- No existing generator/render code breaks solely due to type additions.

---

## Phase 2 — Generator population of canonical orbit elements

### Objective
Have generated systems emit explicit orbit data for every planet and moon.

### Files
- **Modify:** `src/generation/planet-generator.ts`
- **Modify:** `src/generation/moon-generator.ts`
- **Modify:** `src/generation/system-generator.ts`
- **Modify:** `src/store/system-store.ts` if it still performs inline generation assembly paths
- **Review:** `src/utils/physics.ts`

### Changes
Populate deterministic orbital elements from existing generated values.

For planets:
- `semiMajorAxis` from current AU orbit distance
- `orbitalPeriod` from current generated value
- `parentType = 'star'`
- low-to-moderate seeded eccentricity/inclination values
- seeded orbital angles/anomaly values
- seeded prograde/retrograde direction with strong bias toward prograde

For moons:
- `semiMajorAxis` from current moon orbit distance convention
- `orbitalPeriod` from current generated value
- `parentType = 'planet'`
- similarly seeded orbital angles

### Notes
- Start with conservative eccentricity ranges so motion stays readable.
- Keep generated values plausible and visually legible.
- Use existing seeded RNG flow so orbit data remains deterministic.

### Verification
- `npm run check:determinism`
- `npm run build`
- inspect generated system JSON to confirm every planet and moon now has `generatedOrbit`

---

## Phase 3 — Global simulation time state

### Objective
Create one shared simulation time model that future systems can consume.

### Files
- **Modify:** `src/store/system-store.ts`
- **Possibly create:** `src/store/simulation-time.ts` if separation feels cleaner without raising blast radius too much

### Changes
Add global simulation time state, likely in `system-store.ts` for the first pass:

```ts
simulationTimeDays: number;
timeScale: number;
isTimePaused: boolean;
initialSystemTimeDays: number;
```

Add actions:
- `setTimeScale(scale: number)`
- `pauseTime()`
- `resumeTime()`
- `toggleTimePaused()`
- `resetSimulationTime()`
- `advanceSimulationTime(deltaSeconds: number)`

### Recommended semantics
- canonical simulation time unit: **days**
- `advanceSimulationTime(deltaSeconds)` converts real seconds into simulated days using `timeScale`
- paused state prevents progression
- reset returns to initial/epoch-aligned sim time

### Time scale recommendation for V1
Prefer a discrete ladder instead of arbitrary freeform values, e.g.:
- `0x` (pause)
- `0.25x`
- `0.5x`
- `1x`
- `2x`
- `5x`
- `10x`

Exact ladder can be tuned at UI time, but the store should support numeric scaling cleanly.

### Verification
- unit-level/manual check that advancing time changes `simulationTimeDays` deterministically
- pause prevents advancement
- reset restores baseline value
- `npm run build`

---

## Phase 4 — Deterministic orbit solver module

### Objective
Create a reusable orbit math module that converts orbit elements + simulation time into body position.

### Files
- **Create:** `src/orbits/orbit-solver.ts`
- **Possibly create:** `src/orbits/orbit-math.ts`
- **Possibly create tests:** `src/orbits/__tests__/orbit-solver.test.ts` or equivalent if test harness exists for this area

### Changes
Implement pure functions such as:

```ts
resolveMeanAnomaly(elements, simulationTimeDays): number
solveEccentricAnomaly(meanAnomaly, eccentricity): number
sampleOrbitPosition(elements, simulationTimeDays): OrbitStateSample
```

### Solver requirements
- deterministic and side-effect free
- support elliptical orbits from day one
- support inclination and major orientation angles
- support retrograde by reversing anomaly progression
- return local position relative to parent

### Important rule
The solver must compute from **absolute simulation time**, not incremental transform stepping.

### Verification
- same orbit + same time always returns same position
- advancing time changes position smoothly
- reset returns the exact same sampled positions
- basic sanity checks for circular and low-eccentricity cases

---

## Phase 5 — Scene integration for live orbit motion

### Objective
Move rendered planet/moon positions to the new orbit solver with minimal disruption.

### Files
- **Modify:** `src/components/Canvas/ThreeSceneManager.tsx`
- **Review:** `src/rendering/CelestialBodyLOD.ts`
- **Review:** any existing scene graph userData structures used for selection

### Changes
Replace current static placement assumptions with per-frame orbit sampling.

Recommended scene structure:
- star remains root-centered
- each planet gets a stable parent group anchored at star origin
- each moon gets a stable parent group anchored to its planet group
- each frame, set local positions from sampled orbit state

Store enough references for update-time traversal, for example:
- planet body ID -> group/object reference
- moon body ID -> group/object reference
- associated orbit metadata/userData

### Notes
- Do not recalculate generation data every frame.
- Do not rebuild meshes every frame.
- Only update transforms from solver output.
- Preserve current selection/userData wiring.

### Verification
- generated system appears as before at baseline time
- when time advances, planets orbit the star
- moons orbit their planets while planets orbit the star
- pause stops motion cleanly
- reset returns bodies to baseline positions
- `npm run build`

---

## Phase 6 — Orbit ring rendering upgrade

### Objective
Align orbit visuals with explicit orbit definitions.

### Files
- **Modify:** `src/rendering/OrbitRenderer.ts`
- **Modify:** `src/components/Canvas/ThreeSceneManager.tsx`

### Changes
Upgrade orbit rendering so rings/paths are generated from orbit elements rather than only circular scalar distance.

V1 can start with sampled line loops from orbital elements.

Support:
- planet orbit rings around star
- moon orbit rings around parent planet
- basic inclination/eccentricity visibility

### Notes
- keep visuals readable over physically dense precision
- likely limit line segment count for performance
- do not add trail-history yet unless it is trivial and isolated

### Verification
- orbit rings align with motion paths
- eccentric/inclined orbits display credibly
- visual clutter remains acceptable in systems with multiple moons

---

## Phase 7 — System-view orbit controls UI

### Objective
Expose orbit/time controls in the UI for V1.

### Files
- **Modify:** `src/components/App.tsx`
- **Possibly create:** `src/components/IDE/OrbitControlsPanel.tsx`
- **Possibly create:** `src/components/UI/TimeControls.tsx`
- **Modify:** any current system-view HUD/control container

### Changes
Add controls for the active system view:
- Start / Resume
- Stop / Pause
- Reset
- Time speed display/control

Recommended presentation:
- compact, persistent control strip in system view
- clear current speed indicator
- disabled or contextual behavior when no system is active

### Notes
The control surface may be system-view scoped, but it should still manipulate global simulation time state.

### Verification
- start resumes motion
- stop pauses motion
- reset returns to epoch pose
- changing time speed affects all active orbital motion consistently
- UI state matches actual sim state

---

## Phase 8 — Inspector and data visibility

### Objective
Make orbit data inspectable so the system is debuggable and ready for later customization.

### Files
- **Modify:** IDE-related inspector components as needed
  - likely `src/components/IDE/DataInspector.tsx`
  - possibly `src/components/IDE/SceneTree.tsx`
- **Review:** object selection payloads in `ThreeSceneManager.tsx`

### Changes
Expose generated orbit data and current effective state in the inspection flow.

At minimum show:
- generated orbital elements
- current orbital period
- parent relationship
- current simulation time

Optional if low effort:
- current sampled anomaly/radius

### Verification
- selecting a planet/moon exposes explicit orbit data
- orbit values are understandable and stable during playback

---

## Phase 9 — Documentation and verification updates

### Objective
Document the new orbit/time system clearly and keep verification honest.

### Files
- **Modify:** `README.md`
- **Modify:** `TASKS.md`
- **Modify:** `docs/verification.md`
- **Possibly create:** `docs/specs/` follow-up implementation notes if design deltas emerge

### Changes
Document:
- orbit system scope and non-goals
- time controls behavior
- deterministic nature of orbit motion
- any current limitations of V1

Update verification guidance with a small orbit smoke checklist.

### Verification
- docs reflect runtime reality
- verification steps can be executed manually without hidden knowledge

---

## Suggested Execution Order

1. Phase 1 — orbit types
2. Phase 2 — generator population
3. Phase 3 — global simulation time
4. Phase 4 — orbit solver
5. Phase 5 — scene integration
6. Phase 6 — orbit visuals
7. Phase 7 — controls UI
8. Phase 8 — inspector exposure
9. Phase 9 — docs/verification cleanup

This order front-loads contracts and deterministic math before touching the live scene.

---

## Verification Strategy

## Small proof checks first
After each major phase:
- `npm run build`
- verify existing system generation still loads
- inspect one generated system for explicit orbit fields

## Functional verification for orbit motion
Minimum smoke checklist:
- generate system
- confirm bodies appear at baseline positions
- press Start/Resume and confirm orbital motion begins
- press Pause and confirm positions stop changing
- change time speed and confirm motion rate visibly changes
- press Reset and confirm bodies return to baseline positions
- verify moons remain parent-relative while planet is in motion

## Determinism checks
- same seed + same simulation time => same orbit positions
- reset + resume from same conditions => same motion path
- changing color/UI controls must not alter orbit state/layout

## Optional targeted test additions
If lightweight tests are practical, add focused tests for:
- mean anomaly progression
- eccentric anomaly solver convergence
- circular orbit baseline sampling
- retrograde direction reversal

---

## Risks and Watchouts

### 1. Compatibility drift
Current rendering and generation still rely heavily on `orbitDistance` and static placement assumptions. Keep the compatibility layer until orbit-driven rendering is fully switched over.

### 2. Scene complexity in `ThreeSceneManager.tsx`
Orbit integration touches a hotspot file. Keep the first pass bounded; if needed, extract orbit-update responsibilities into a small helper rather than mixing more logic directly into render setup.

### 3. Mixed units for planets vs moons
Planets use AU, moons use km. This is acceptable for V1, but the solver and renderer must be explicit about unit conversion boundaries.

### 4. Overdesign risk
Do not implement full override editing, persistence, or spacecraft dynamics in the first pass. The immediate goal is deterministic, controllable orbital motion.

### 5. Visual clutter
Orbit lines plus moons plus shaders can become noisy. Favor readable defaults and hideable/tunable orbit overlays if necessary.

---

## Open Questions for Implementation Start

1. Should reset return to `simulationTimeDays = 0`, or to a stored per-system epoch baseline?
2. Should time speed be exposed as a slider, stepped buttons, or a preset ladder control in V1?
3. Should orbit rings be always visible in system view, or toggleable?
4. Should moons begin with full elliptical support immediately, or start circular with seeded orientation and upgrade in place after planets are working?
5. Should orbit controls live in the main HUD or inside the IDE/system inspector region?

---

## Recommended First Ticket Slice

If implementation starts immediately, the safest first execution slice is:

1. add explicit orbit types
2. populate `generatedOrbit` for planets and moons
3. add global simulation time store state/actions
4. implement pure orbit solver module
5. verify determinism/build before touching live scene animation

This creates a stable foundation before any user-visible motion changes.

---

## Deferred Follow-Up After Orbit V1

After orbit features are complete, queue next celestial motion pass for:
- moon spin / tilt runtime
- richer inspector exposure for orbit and rotation state
- broader per-body motion authoring beyond current planet controls

This stays separate from orbit V1 so orbital behavior can be stabilized first.

---

## Current Implementation Status

Implemented on `feature/orbit-system-v1` worktree so far:
- explicit generated orbit data for planets and moons
- pure orbit solver and global simulation time store/actions
- live orbital motion in system view
- orbit trail generation from orbital elements
- orbit trail visibility toggle
- wider simulation-speed controls via presets + logarithmic slider
- drawer-based UI split with left-side controls and right-side inspector
- single-scroll accordion behavior for left drawer after layout repair
- deterministic planet spin + axial tilt runtime driven from absolute simulation time
- planet motion controls in left drawer Controls stack
- motion controls repositioned near Orbit controls for better workflow
- rotation-period input simplified to whole hours with 1-9999 range

Still queued before calling Orbit V1 wrapped:
- expose orbit data/state more clearly in inspector surfaces
- run a fresh manual browser pass focused on planet motion feel and control clarity

---

## Outcome

Completing this plan will give Khora a deterministic orbit foundation that is:
- visually convincing
- controllable through global time
- suitable for future customization
- usable later as scaffolding for spacecraft-relative motion

The next step after this plan is to finish the remaining verification/polish slice, then decide whether to continue with inspector orbit visibility or move into the deferred post-orbit celestial-motion pass.
