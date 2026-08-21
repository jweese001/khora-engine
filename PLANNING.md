# Khora Engine Technical Planning Reference

**Updated:** August 2026
**Current program:** post-Orbit-V1 stabilization and cleanup

This file is the compact technical reference for the active repository. Detailed historical notes are indexed in [`docs/archive/README.md`](docs/archive/README.md); active plans and specifications live under `docs/plans/` and `docs/specs/`.

## Product direction

Khora is an interactive procedural universe sandbox. Current development priorities are:

1. Keep the deterministic star-system core trustworthy.
2. Deepen star-system authoring, motion, and inspection.
3. Maintain the galaxy sandbox as an experimental secondary surface.
4. Defer Explorer gameplay until the creation and inspection foundations are stable.

## Stack

- React 19 and TypeScript 5.9
- Three.js 0.180
- Zustand 5
- Vite 7
- Vitest 4
- Monaco Editor
- Material Design Icons

## Application modes

`src/components/App.tsx` selects a surface from `system-store.appMode`:

- `landing` — mode selection
- `diceRoll` — resource-budget flow
- `architect` — Three.js canvas, controls, and inspector
- `explorer` — future-mode placeholder

Dice and Architect surfaces are lazy-loaded. Monaco-backed inspector tabs are loaded only when selected.

## Canonical data flow

```text
seed
  → generateSystem(seed)
  → star
  → planets
  → moons + resources
  → generated orbit/rotation elements
  → Zustand system state
  → ThreeSceneManager scene lifecycle
  → renderers/controllers update Three.js objects
```

Canonical generation must use `SeededRandom`, never `Math.random()`.

## State ownership

### `src/store/system-store.ts`

Owns:

- application and view modes
- current system and procedural galaxy
- focused galaxy system
- global simulation time and speed
- orbit-trail and auto-focus preferences
- selected celestial object
- shader and planet-motion overrides
- scene and camera references exposed to React tools

### `src/store/galaxy-store.ts`

Owns presentation/editor state for:

- exactly three visual galaxy layers
- active layer and layer configuration
- marker configuration and positions
- marker visibility
- local presets
- a narrow marker-control handle to the scene manager

Do not add duplicate galaxy presentation state back to `system-store`.

## Scene architecture

`src/components/Canvas/ThreeSceneManager.tsx` remains the lifecycle coordinator. Extracted boundaries own focused responsibilities:

- `CameraController.ts` — camera interpolation, interruption, object focus, system/galaxy framing
- `OrbitRuntimeManager.ts` — absolute-time orbital transforms, planet spin/tilt, orbit-trail visibility
- `SelectionController.ts` — system and galaxy raycast interpretation
- `MarkerSystemManager.ts` — custom marker creation, visibility, and animation
- `src/rendering/dispose.ts` — shared geometry/material disposal

Controllers should not become alternate stores. They receive state snapshots and update ephemeral Three.js objects.

## Orbit system

Canonical orbit data is stored as `generatedOrbit` on planets and moons.

- Global simulation unit: Earth days
- Planet distance unit: AU
- Moon distance unit: km
- Runtime sampling: pure `sampleOrbitPosition(elements, simulationTimeDays)`
- Position updates derive from absolute time, not accumulated frame integration
- Planet rotation derives from absolute simulation time and generated/overridden rotational elements

Keep compatibility fields `orbitDistance` and `orbitalPeriod` aligned with `generatedOrbit`; physics verification enforces that contract.

## Rendering

- Stars use procedural emissive shaders and post-processing bloom.
- Planets and moons use `CelestialBodyLOD` with shader materials at each level.
- Orbit paths are sampled from explicit orbital elements.
- Galaxy visuals use independent `GalaxyParticleSystem` layers.
- Marker systems are separate from decorative galaxy particles.

Resource-owning rendering code must use shared disposal helpers or equivalent proven cleanup.

## Inspector and controls

- Left drawer: contextual galaxy/shader/motion controls and global orbit controls
- Right inspector: scene tree, JSON data, shaders, and LOD diagnostics
- Selection payloads are discriminated unions from `src/types/scene.ts`
- Shader override values use the explicit `UniformOverrideValue` boundary

The inspector remains primarily read-only; authoring is limited to exposed controls.

## Determinism contract

Canonical deterministic scope:

- normalized `generateSystem(seed)` output
- physical and visual generated body properties
- resources
- orbit and rotation elements

Excluded:

- top-level `generatedAt`
- transient Zustand/UI state
- Three.js scene state
- camera and selection state
- presentation-only particle behavior

`npm run check:determinism` is the executable contract.

## Verification

Default gate:

```bash
npm run verify
```

It runs lint, focused tests, build, 100-system physics validation, and determinism checks.

Feature work that changes rendering or interaction also requires the manual WebGL checklist in [`docs/verification.md`](docs/verification.md).

## Performance rules

- Preserve LOD for planets and moons.
- Do not rebuild meshes in animation loops.
- Update transforms and uniforms only.
- Keep mode and Monaco surfaces lazy-loaded.
- Measure bundle output rather than suppressing Vite warnings.
- Verify on hardware for frame-rate claims.

## Current cleanup sequence

The trust-restoration and scene-containment work is complete through CLEAN-10. Remaining operational work is tracked in:

- [`TASKS.md`](TASKS.md)
- [`docs/plans/2026-08-16-project-cleanup-plan.md`](docs/plans/2026-08-16-project-cleanup-plan.md)

## Design constraints

- Follow the designated Khora style guide for color and typography.
- Use Material Design Icons for UI symbols.
- Preserve horizontal breathing room, clear vertical hierarchy, and flexible Phase-1/2 layouts.
- Do not mix cleanup work with broad visual redesign.

## Deferred scope

- Explorer navigation/gameplay
- mining, colonization, missions, and defense
- multiplayer
- full save/load architecture
- n-body physics
- spacecraft dynamics
- unrestricted live shader editing
