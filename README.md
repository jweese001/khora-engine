# Khora Engine

An interactive procedural star-system and galaxy sandbox built with React, TypeScript, Three.js, Zustand, and Vite.

**Status:** active alpha development
**Live site:** <https://jweese001.github.io/khora-engine/>

Khora currently combines deterministic celestial generation, real-time 3D rendering, controllable orbital motion, layered galaxy composition, and inspector-oriented authoring tools. Explorer gameplay remains a future phase.

## Current product surfaces

| Surface | Status | Description |
|---|---|---|
| Landing and mode selection | Active | Entry point for Create and future Explore modes |
| Cosmic dice flow | Active | Establishes the Architect resource budget |
| Architect system view | Stabilized core | Generate, render, animate, select, and inspect star systems |
| Galaxy sandbox | Experimental | Generate procedural galaxies, edit visual layers, manage markers, and enter systems |
| Inspector | Active | Scene hierarchy, generated data, shader source, and uniform inspection |
| Explorer mode | Placeholder | Navigation and gameplay are deferred |

## Highlights

- Deterministic star, planet, moon, resource, orbit, and rotation generation
- Seven stellar spectral types and multiple planet classes
- Three.js rendering with procedural GLSL shaders and bloom
- Three-level celestial-body LOD
- Absolute-time orbital motion for planets and moons
- Planet spin, axial tilt, time scaling, pause/reset, and orbit-trail controls
- Layered procedural galaxy rendering and explorable system markers
- Read-only Monaco-backed data and shader inspection
- Typed runtime boundaries for selection, camera control, orbit updates, and resource disposal

## Quick start

Requirements:

- Node.js 20 or newer
- npm
- A browser with WebGL support

```bash
git clone https://github.com/jweese001/khora-engine.git
cd khora-engine
npm install
npm run dev
```

Open:

```text
http://localhost:5173/khora-engine/
```

The `/khora-engine/` base path is intentional and matches GitHub Pages deployment.

## Main workflow

1. Choose **Create** on the landing page.
2. Roll or bypass the cosmic dice resource step.
3. Generate a star system or galaxy from the top toolbar.
4. Use the left **Controls** drawer for galaxy, shader, motion, and orbit controls.
5. Use the right **Inspector** for scene, data, and shader views.
6. In galaxy view, select an enabled system marker to enter that system.
7. Use **Back** to return to the galaxy.

### Camera controls

- Left drag: orbit
- Right drag: pan
- Mouse wheel: zoom
- Click a celestial body: select it

### Debug controls

- `D`: cycle planet shader debug modes
- `P`: print the current camera position when diagnostics are enabled
- `L`: toggle the LOD debug overlay

Routine diagnostics are opt-in during development. Enable them with either:

```text
http://localhost:5173/khora-engine/?debug
```

or:

```js
localStorage.setItem('khora:debug', 'true')
```

The Zustand console hook, `window.__KHORA_STORE__`, is exposed only in development builds.

## Verification

Run the complete baseline before merging:

```bash
npm run verify
```

It runs:

1. ESLint
2. 33 focused unit tests
3. TypeScript and Vite production build
4. Physics validation across 100 generated systems
5. Canonical same-seed determinism checks

Additional commands:

```bash
npm test                         # focused tests
npm run test:watch               # watch mode
npm run validate-physics         # 100-system physics validation
npm run validate-physics:self-test # prove malformed moon data is rejected
npm run check:determinism        # canonical same-seed comparison
npm run build                    # production build
```

See [`docs/verification.md`](docs/verification.md) for expectations and manual WebGL smoke checks.

## Determinism contract

Canonical deterministic scope is normalized `generateSystem(seed)` output, including:

- star, planet, and moon properties
- resources
- generated orbit elements
- generated rotation elements

Excluded from canonical equality:

- top-level `generatedAt`
- Zustand and transient UI state
- scene, camera, and selection state
- presentation-only rendering behavior

Use `SeededRandom` in generation code. Do not introduce `Math.random()` into canonical generation paths.

## Architecture

```text
src/
├── components/
│   ├── Canvas/
│   │   ├── ThreeSceneManager.tsx   # scene lifecycle coordinator
│   │   ├── CameraController.ts     # framing and transitions
│   │   ├── OrbitRuntimeManager.ts  # absolute-time transforms
│   │   ├── SelectionController.ts  # raycast interpretation
│   │   └── MarkerSystemManager.ts  # galaxy marker lifecycle
│   ├── DiceRoller/
│   ├── IDE/
│   ├── Landing/
│   └── UI/
├── generation/                     # deterministic generation pipeline
├── orbits/                         # pure orbital solver
├── rendering/                      # meshes, LOD, galaxies, disposal
├── shaders/                        # GLSL source
├── store/
│   ├── system-store.ts             # app, systems, time, selection
│   └── galaxy-store.ts             # visual layers, markers, presets
├── types/
└── utils/
```

### State ownership

- `system-store` owns app mode, generated system/galaxy data, simulation time, selection, and overrides.
- `galaxy-store` owns visual galaxy layers, marker presentation, and presets.
- Three.js controllers own ephemeral renderer objects and do not own canonical generation data.

## Performance and loading

Mode-specific surfaces are loaded on demand. Monaco is not requested until the Data or Shaders inspector tab is opened. The remaining large assets are primarily Three.js, Monaco, and the required Material Design Icons font.

Performance acceptance still requires a real WebGL browser/GPU smoke pass; headless environments may not provide a usable WebGL context.

## Documentation

Current references:

- [`TASKS.md`](TASKS.md) — active priorities and status
- [`PLANNING.md`](PLANNING.md) — technical reference
- [`ROADMAP.md`](ROADMAP.md) — longer-term direction
- [`docs/verification.md`](docs/verification.md) — verification baseline
- [`docs/plans/2026-08-16-project-cleanup-plan.md`](docs/plans/2026-08-16-project-cleanup-plan.md) — current cleanup program
- [`docs/specs/2026-05-13-orbit-systems-design-spec.md`](docs/specs/2026-05-13-orbit-systems-design-spec.md) — Orbit V1 design
- [`docs/archive/README.md`](docs/archive/README.md) — historical milestone and session index

Reference product/design documents also exist in the owner's Obsidian vault and are not edited from this repository. Project-local Pi agent and workflow definitions are versioned under `.pi/agents/`; generated subagent artifacts remain ignored.

## Deployment

GitHub Pages deployment is configured in:

```text
.github/workflows/deploy-pages.yml
```

Production builds use the `/khora-engine/` base configured in `vite.config.ts`.

## Known limitations

- Galaxy composition and marker workflows remain experimental.
- Explorer gameplay is not implemented.
- The inspector is primarily read-only; customization is limited to exposed controls.
- Final frame-rate and visual acceptance require hardware WebGL testing.
- Save/load and multiplayer are not implemented.

## Technology

- React 19
- TypeScript 5.9
- Three.js 0.180
- Zustand 5
- Monaco Editor
- Vite 7
- Vitest 4
- Material Design Icons

## License

No project license has been selected yet.
