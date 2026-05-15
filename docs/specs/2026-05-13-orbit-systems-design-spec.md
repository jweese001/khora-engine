# Orbit Systems Design Spec

**Date:** 2026-05-13  
**Priority:** B1 / After Phase A stabilization  
**Status:** Proposed  
**Purpose:** Define how Khora should represent, simulate, validate, customize, and render planetary orbits without compromising the existing procedural generation foundation.

---

## 1. Problem Statement

Khora already has a fairly advanced procedural generation pipeline, but orbital behavior is currently strongest as **generated spacing plus visual placement**. To support meaningful star system customization and deeper system engagement, Khora needs a formal orbit systems architecture.

This architecture must let the project evolve from:
- generated orbit placement

to:
- explicit orbit data
- derived orbital properties
- deterministic orbital motion
- editable orbit parameters
- validation/stability feedback
- orbit-aware shader and presentation rules

The goal is **not** to become a high-fidelity astrophysics simulator. The goal is to become a **credible, customizable, visually rich star system design environment**.

---

## 2. Design Principles

### 2.1 Preserve the canonical generator
The procedural generator remains the source of truth for seeded baseline systems.

### 2.2 Separate generation from customization
Generated orbit values should not be overwritten blindly. Customization must be layered on top.

### 2.3 Favor deterministic behavior
Any runtime orbit motion should be deterministic from:
- canonical orbit data
- customization overrides
- simulation time

### 2.4 Prefer constrained editing over free chaos
Orbit customization should be powerful, but not trivialize stability. The app should help users maintain plausible systems.

### 2.5 Keep rendering policy separate
Orbit data should drive presentation, but rendering/shader decisions should live in a policy layer rather than inside raw data generation.

---

## 3. Product Intent

After stabilization, Khora’s flagship system experience should become:

> **Generate, inspect, animate, and customize a living procedural star system.**

Orbit systems are central to that. They provide:
- visible structure
- meaningful variation
- a pathway into customization
- a foundation for future architect workflows

---

## 4. Scope

## In Scope
- orbit data model for planets and moons
- generated vs derived vs overridden orbit values
- deterministic orbital motion
- validation and safety rules
- orbit visualization upgrades
- inspector/customization hooks
- orbit-aware presentation and shader policy inputs

## Out of Scope for initial implementation
- full n-body simulation
- real gravitational perturbation simulation
- advanced long-term orbital instability modeling
- galaxy-level orbital mechanics
- arbitrary spline or hand-drawn orbit editing

---

## 5. Domain Model

Orbit systems should be split into **three layers of meaning**.

### 5.1 Canonical Generated Orbit
This is the orbit produced by seeded generation.

Suggested shape:

```ts
interface GeneratedOrbit {
  parentId: string;
  parentType: 'star' | 'planet';
  semiMajorAxis: number;      // AU for planets, km or parent-relative units for moons
  eccentricity: number;       // 0.0 - <1.0
  inclination: number;        // degrees relative to parent plane
  longitudeOfAscendingNode: number;
  argumentOfPeriapsis: number;
  meanAnomalyAtEpoch: number;
  orbitalPeriod: number;      // derived at generation time or stored after derivation
  rotationDirection: 'prograde' | 'retrograde';
  epoch: number;              // simulation reference point
}
```

This should be deterministic by seed.

---

### 5.2 Orbit Overrides
These are user or mode-level customizations layered over the generated orbit.

```ts
interface OrbitOverride {
  semiMajorAxis?: number;
  eccentricity?: number;
  inclination?: number;
  longitudeOfAscendingNode?: number;
  argumentOfPeriapsis?: number;
  meanAnomalyAtEpoch?: number;
  orbitalPeriod?: number;
  rotationDirection?: 'prograde' | 'retrograde';
}
```

Overrides should be sparse. If no override exists, generated values remain authoritative.

---

### 5.3 Effective Orbit
This is what rendering, simulation, and validation actually use.

```ts
interface EffectiveOrbit {
  generated: GeneratedOrbit;
  override?: OrbitOverride;
  resolved: ResolvedOrbit;
  validation: OrbitValidationResult;
}
```

Where `ResolvedOrbit` is the merged, final orbit state.

---

## 6. Unit Strategy

A clean unit strategy matters early.

### Planets
Use **AU** for orbital distances in canonical system data.

### Moons
Prefer one of two choices:

#### Option A — km in canonical data
Pros:
- straightforward with current moon generation
- easier continuity with existing code

Cons:
- mixed units across orbit layers

#### Option B — normalized parent-relative orbital units plus derived km
Pros:
- visually and structurally elegant
- easier customization UX later

Cons:
- more migration effort now

### Recommendation
For now:
- keep **planets in AU**
- keep **moons in km** canonically if that matches current generation
- provide normalized derived values for rendering/customization UI

This minimizes migration risk while still enabling a coherent orbit layer.

---

## 7. Suggested Type Additions

Khora likely needs an explicit orbit type in `src/types/celestial-bodies.ts` or a closely related file.

Suggested additions:

```ts
interface OrbitalElements {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  longitudeOfAscendingNode: number;
  argumentOfPeriapsis: number;
  meanAnomalyAtEpoch: number;
  orbitalPeriod: number;
  epoch: number;
  rotationDirection: 'prograde' | 'retrograde';
}

interface OrbitOverrideMap {
  [bodyId: string]: OrbitOverride;
}

interface OrbitValidationResult {
  valid: boolean;
  severity: 'info' | 'warning' | 'error';
  issues: OrbitIssue[];
}

interface OrbitIssue {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

Planets and moons should then reference orbit data explicitly instead of relying primarily on ad hoc fields.

---

## 8. Data Flow

### 8.1 Generation Flow
1. generator creates base body data
2. generator assigns canonical orbital elements
3. derived values are computed
4. system is stored as canonical generated state

### 8.2 Customization Flow
1. user selects body
2. user modifies orbit parameters
3. overrides are stored separately
4. effective orbit is recomputed
5. validation runs
6. renderer updates positions/orbit visuals
7. inspector shows changed state and any warnings

### 8.3 Simulation Flow
1. simulation time advances
2. each body resolves current anomaly/position from effective orbit
3. world/local transforms update deterministically
4. orbit-aware visual policies can respond if needed

---

## 9. Simulation Levels

Implementation should be phased.

### Level 1 — Static Orbit Model
Features:
- explicit orbit data
- richer orbit ring rendering
- inspector visibility
- no live orbital motion yet

### Level 2 — Deterministic Orbital Motion
Features:
- planets move around stars
- moons move around parent planets
- consistent time stepping
- pause/resume baseline support

### Level 3 — Editable Orbit Systems
Features:
- user changes orbit parameters
- live revalidation
- constrained update rules
- visual feedback for instability or invalid ranges

### Recommendation
Deliver in this order:
- Level 1 first
- Level 2 second
- Level 3 third

This reduces risk and allows verification at each layer.

---

## 10. Motion Model

Khora does not need full astrophysical simulation to feel deep.

### Recommended initial model
Use analytic orbital motion from orbital elements rather than force-based simulation.

Benefits:
- deterministic
- cheap to compute
- visually convincing
- easy to pause/scrub later
- easier to customize safely

### Suggested inputs
- effective orbital elements
- current simulation time
- parent body transform

### Suggested outputs
- orbital position in local parent space
- optional tangent/velocity vector for later features

---

## 11. Validation Rules

Orbit customization becomes engaging when the app explains constraints instead of merely blocking users.

### Required initial validations

#### V1. Star clearance
Planet periapsis must clear the star by a safety margin.

#### V2. Parent body clearance
Moon periapsis must clear parent radius plus margin.

#### V3. Adjacent orbit overlap risk
Sibling bodies should not share obviously colliding or overlapping orbital envelopes.

#### V4. Eccentricity bounds
Keep eccentricity in a supported range.

#### V5. Moon zone sanity
Moons must remain inside a conservative parent influence zone.

#### V6. Rendering sanity
Orbit values should not create unusable scales or break camera/system readability.

### Severity model
- **info** — interesting but acceptable
- **warning** — probably unstable or visually problematic
- **error** — invalid for current Khora rules

### UX recommendation
Prefer:
- warnings when possible
- hard blocks only for clearly invalid states

---

## 12. Orbit Customization Model

Customization should use the same layered strategy recommended for shaders/uniforms.

### 12.1 Canonical orbit
Seeded generated state.

### 12.2 Override layer
Sparse user edits stored outside canonical generation.

### 12.3 Effective orbit
Merged and validated values used at runtime.

This lets Khora support:
- reset to generated defaults
- compare generated vs edited values
- future save/export of customization state
- future “apply to similar bodies” workflows

---

## 13. Store Architecture Recommendation

Orbit customization should not be embedded ad hoc into unrelated scene state.

### Suggested direction
Add a dedicated orbit customization state area, likely in `system-store.ts` initially, with a path to extraction later.

Suggested responsibilities:
- store orbit overrides by body ID
- expose actions to update/reset overrides
- expose selectors for effective orbit values
- keep simulation time state separate from static system data

Suggested state shape:

```ts
interface OrbitState {
  orbitOverrides: Map<string, OrbitOverride>;
  simulationTime: number;
  simulationRunning: boolean;
  timeScale: number;
}
```

### Recommendation
In first implementation, keep this in the main store if needed for simplicity, but keep actions grouped and documented so extraction later is easy.

---

## 14. Rendering Implications

Orbit systems should drive both body placement and orbit visualization.

### 14.1 Orbit line rendering
Orbit rendering should evolve beyond simple circular rings.

Future orbit renderer should support:
- circular and elliptical paths
- inclination visualization
- parent-relative moon orbits
- selected-body emphasis
- optional periapsis/apoapsis markers later

### 14.2 Body transforms
Runtime body positions should come from effective orbit resolution rather than static placement assumptions.

### 14.3 LOD compatibility
Orbit motion must not break current LOD assumptions.
- LOD should still resolve by camera distance
- parent-child transforms must remain stable

---

## 15. Orbit-Aware Shader and Presentation Policy

Orbit systems should become a meaningful input into visual identity.

### Possible policy inputs
- distance from star
- effective thermal regime
- eccentricity magnitude
- parent body type
- moon orbital environment

### Examples
- hot inner rocky worlds use scorched palette/shader parameters
- cold outer bodies bias toward ice/mineral visual recipes
- high-eccentricity worlds could receive stronger thermal contrast presentation later
- moon visuals can reflect parent type plus orbital environment

### Architectural recommendation
Create a policy layer that maps:
- body data
- orbit context
- environment context

to:
- shader family
- shader uniforms
- orbit line style
- label/icon treatment

This should be separate from both raw generation and low-level renderer code.

---

## 16. Inspector and UX Implications

Orbit work becomes much more valuable if users can actually understand it.

### Initial inspector goals
For selected body, show:
- parent body
- orbital distance / semi-major axis
- orbital period
- eccentricity
- inclination
- whether values are generated or overridden
- validation warnings

### Future customization UX
- sliders/inputs for orbit parameters
- reset-to-generated action
- compare generated vs edited values
- optional “auto-fix invalid orbit” button

### Important note
Orbit editing UX should come after the model and validation layer are stable.

---

## 17. Verification Strategy

Orbit work must be measurable, not just visually plausible.

### Required verification by phase

#### Level 1 verification
- build passes
- orbit data present on planets/moons
- inspector displays expected values
- orbit lines render correctly for sample systems

#### Level 2 verification
- same seed + same simulation time => same positions
- orbital motion updates without breaking selection/LOD
- no obvious parent-child transform errors

#### Level 3 verification
- overrides apply predictably
- invalid values produce correct warnings/errors
- reset restores canonical values
- edited systems remain renderable

### Suggested test/script coverage
- determinism test for orbit resolution
- validation unit tests for common invalid states
- rendering smoke checklist for 3-5 known seeds

---

## 18. Recommended Implementation Sequence

### Orbit Ticket B-01 — Orbit Type Design and Data Audit
- inventory current orbit-related fields
- define canonical orbit type additions
- decide where to place types

### Orbit Ticket B-02 — Canonical Orbit Data Integration
- add explicit orbit data to planet/moon models
- keep generation behavior intact

### Orbit Ticket B-03 — Effective Orbit Resolver
- merge generated orbit + override into resolved orbit
- add normalized derivations where needed

### Orbit Ticket B-04 — Validation Layer
- add initial orbit validation rules
- expose structured warnings/errors

### Orbit Ticket B-05 — Orbit Renderer Upgrade
- support ellipse/inclination-aware orbit visuals
- preserve existing scene readability

### Orbit Ticket B-06 — Deterministic Motion
- add simulation time + analytic orbital motion
- verify determinism

### Orbit Ticket B-07 — Orbit Customization UI
- expose body-level orbit editing controls
- reset + validation feedback

### Orbit Ticket B-08 — Orbit-Aware Shader Policy
- integrate orbit/environment inputs into shader assignment decisions

---

## 19. Risks

### Risk: too much realism hurts usability
**Mitigation:** optimize for credible and legible, not exhaustive astrophysics.

### Risk: orbit customization breaks procedural integrity
**Mitigation:** never overwrite canonical generated state; use override layering.

### Risk: rendering refactor becomes too large
**Mitigation:** introduce effective orbit resolution before major orbit animation changes.

### Risk: moons become the hardest edge case
**Mitigation:** keep moon support conservative at first and validate tightly.

### Risk: shader policy gets entangled with generation
**Mitigation:** keep a separate presentation policy layer.

---

## 20. Open Decisions

These should be settled before implementation begins:

1. Should moon canonical orbit distance remain in km initially, or be normalized now?
2. How much eccentricity/inclination variation is desirable in generated Phase B systems?
3. Should initial motion start paused or running by default?
4. Should invalid orbit edits be blocked immediately or allowed with warnings until apply?
5. Should orbit customization be available only in architect mode, or also in standard system explorer?

### Current recommendation
- keep moon units as-is initially if migration cost is high
- start with modest eccentricity/inclination ranges
- start motion paused or minimal until UX is refined
- block only clearly invalid states
- begin customization in architect mode first, then expose selectively elsewhere

---

## 21. Recommended Next Step

After Phase A stabilization is complete:
1. run an orbit data audit against current generator and renderer
2. write a small implementation plan for Tickets B-01 through B-04
3. do **not** begin orbit UI before the effective orbit + validation model exists

Orbit systems should become the backbone of Khora’s next phase of depth, but only after the repo is trustworthy enough to support measured evolution.
