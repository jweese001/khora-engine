# Phase A Stabilization Plan

**Date:** 2026-05-13  
**Priority:** A1 / Highest  
**Status:** Proposed  
**Purpose:** Restore repo trust, build health, and verifiable execution so Khora can support measured feature work with `pi-dev-team`.

---

## 1. Problem Statement

Khora has strong procedural generation and promising system/galaxy experiences, but the current branch is not in a trustworthy state for sustained feature delivery.

Current issues include:
- build-breaking TypeScript errors
- stale or contradictory documentation
- unclear determinism boundaries
- overloaded scene orchestration in `ThreeSceneManager.tsx`
- galaxy integration work bleeding into core stability
- insufficiently formal verification for future team-based delivery

This phase does **not** aim to make the project production-ready. It aims to make the project:
- buildable
- legible
- testable
- honest
- safe for incremental development by `pi-dev-team`

---

## 2. Success Criteria

Phase A is complete when all of the following are true:

### A. Build and Type Health
- `npm run build` passes cleanly
- no known broken API contracts remain between store, scene, and galaxy systems
- dead imports/methods causing TS failures are removed or implemented

### B. Truthful Documentation
- `README.md` accurately reflects actual branch state
- `TASKS.md` distinguishes historical milestones from current branch reality
- major repo scripts referenced in docs actually exist in `package.json`

### C. Determinism Contract
- deterministic scope is documented
- system generation determinism can be verified by script/test
- non-deterministic visual randomness is explicitly separated from canonical generation

### D. Verification Harness
- there is a smallest-meaningful verification path for each critical subsystem
- core checks can be run by both humans and agents
- future feature work can be merged against explicit pass/fail evidence

### E. Architectural Containment
- `ThreeSceneManager.tsx` is no longer the default dumping ground for new responsibilities
- at minimum, scene responsibilities are segmented conceptually or physically
- high-risk integration zones are documented

---

## 3. Non-Goals

Phase A does **not** include:
- broad galaxy feature expansion
- major UI redesign
- orbit customization implementation
- shader system redesign beyond stabilization needs
- save/load architecture
- aggressive refactors with unclear payoff

If a change does not improve trust, verification, or containment, it should be deferred to B or C.

---

## 4. Priority Order

### A1. Restore Build Health
**Goal:** Get the repo compiling again before adding more behavior.

#### Known issues to resolve
- `ThreeSceneManager.tsx` references `setCurrentSystem`, but `SystemStore` does not define it
- `ThreeSceneManager.tsx` references `originalSystemCount`, but `Galaxy` does not define it
- `GalaxyParticleSystem.ts` has `Material | Material[]` typing/disposal issues
- unused declarations/imports are failing current TypeScript settings
- scene/galaxy helper methods contain loose `any` contracts that should be tightened where they affect build safety

#### Deliverables
- build passes
- all current compiler errors resolved
- no hidden “comment this out to build” workarounds

#### Verification
- `npm run build`
- record exact before/after error count in task notes or PR summary

---

### A2. Align Docs With Reality
**Goal:** Make repo state understandable to both humans and agents.

#### Required doc corrections
- `README.md`
  - remove or clarify release/production-readiness claims
  - clarify current active surfaces: system explorer, galaxy sandbox, architect-oriented work
  - clarify what is stable vs experimental
- `TASKS.md`
  - preserve historical progress, but clearly label current branch as active/integration work
  - separate “completed historically” from “current branch health”
- `package.json`
  - add any scripts that are referenced as standard workflows if they are truly supported
  - remove doc references to nonexistent scripts or add the scripts

#### Deliverables
- docs no longer overstate readiness
- branch users can tell what is stable, what is experimental, and what is currently broken/fixed

#### Verification
- manual doc review checklist
- confirm every script mentioned in README exists and runs

---

### A3. Define the Determinism Contract
**Goal:** Separate canonical procedural output from non-canonical metadata and visual randomness.

#### Required decisions
- what is considered canonical deterministic output?
  - likely: star, planets, moons, properties, resources, orbit data
- what is excluded?
  - likely: `generatedAt`, transient UI state, debug settings, visual-only particle randomness
- what must remain seeded in future system customization work?

#### Likely policy
- **System generation** should be deterministic by seed
- **Timestamps** are metadata, not part of deterministic equality
- **Galaxy particle visuals** may remain non-canonical unless promoted into deterministic product behavior later
- **Marker generation** must be explicitly labeled deterministic or non-deterministic depending on chosen implementation

#### Deliverables
- `docs/` reference note or section documenting determinism boundaries
- at least one repeatable verification script/test for same-seed equality after normalization

#### Verification
- run determinism script twice for same seed
- compare normalized output
- document excluded fields

---

### A4. Build a Verification Harness
**Goal:** Let `pi-dev-team` execute work in measured, evidence-based increments.

#### Minimum required checks
1. **Build check**
   - `npm run build`
2. **Determinism check**
   - same seed => same normalized system output
3. **Physics validation check**
   - existing `scripts/validate-physics.js` should be runnable via package script
4. **Targeted visual/manual checklist**
   - minimal smoke checklist for system render and galaxy render

#### Recommended script additions
- `npm run validate-physics`
- `npm run check:determinism`
- optional: `npm run check:smoke` for small non-browser assertions

#### Deliverables
- small, documented verification commands
- future feature tickets can reference exactly which checks must pass

#### Verification
- execute scripts locally
- add command list to README or verification doc

---

### A5. Contain Scene Complexity
**Goal:** Reduce risk in the highest-blast-radius file without doing a risky rewrite.

#### Current hotspot
`src/components/Canvas/ThreeSceneManager.tsx` currently owns too many responsibilities:
- scene init
- renderer/composer setup
- input/raycasting
- system rendering
- galaxy rendering
- marker handling
- camera transitions
- shader uniform updates
- debug controls
- disposal

#### Target for Phase A
Do **not** fully rewrite it. Instead, extract seams.

#### Minimum containment plan
Split responsibility into helper modules/classes or clearly isolated sections for:
- system rendering
- galaxy rendering
- marker interactions
- camera transitions
- uniform update application
- disposal helpers

This can be done incrementally. The Phase A standard is improved containment, not architectural perfection.

#### Deliverables
- either extracted modules or a documented responsibility map with at least 1-2 high-risk areas moved out
- clear comment-level boundaries if file split is deferred

#### Verification
- build still passes
- no behavior regressions in targeted smoke checks
- follow-up tickets become more isolated

---

## 5. Recommended Ticket Breakdown for `pi-dev-team`

Tickets should stay small, verifiable, and low-overlap.

### Ticket A-01 — Build Repair: Store/Scene Contract
**Scope:** fix `setCurrentSystem` mismatch and similar broken contracts  
**Likely files:**
- `src/store/system-store.ts`
- `src/components/Canvas/ThreeSceneManager.tsx`
- `src/components/Canvas/CanvasContainer.tsx`

**Done when:** build passes for this contract area and behavior is coherent.

---

### Ticket A-02 — Build Repair: Galaxy Type Contract
**Scope:** resolve `originalSystemCount` and related galaxy shape mismatches  
**Likely files:**
- `src/types/galaxy.ts`
- `src/generation/galaxy-generator.ts`
- `src/components/Canvas/ThreeSceneManager.tsx`

**Done when:** `Galaxy` contract is explicit and consumers agree on it.

---

### Ticket A-03 — Build Repair: Particle System Typing
**Scope:** fix material typing/disposal and strict TS issues in galaxy rendering  
**Likely files:**
- `src/rendering/GalaxyParticleSystem.ts`
- `src/rendering/GalaxyRenderer.ts`

**Done when:** no TS errors remain in that rendering path.

---

### Ticket A-04 — Docs and Scripts Alignment
**Scope:** reconcile README/TASKS/package scripts  
**Likely files:**
- `README.md`
- `TASKS.md`
- `package.json`

**Done when:** every referenced script exists and readiness language is honest.

---

### Ticket A-05 — Determinism Verification
**Scope:** add normalized determinism check and document policy  
**Likely files:**
- `scripts/`
- `README.md` or `docs/`
- generation utilities if normalization helpers are needed

**Done when:** same-seed output can be verified repeatably.

---

### Ticket A-06 — Scene Containment Pass
**Scope:** extract or isolate one or two high-blast-radius scene responsibilities  
**Likely files:**
- `src/components/Canvas/ThreeSceneManager.tsx`
- new helper modules under `src/components/Canvas/` or `src/rendering/`

**Done when:** the file is smaller in responsibility and future work has cleaner seams.

---

## 6. Workflow for `pi-dev-team`

Recommended default chain for Phase A tickets:

1. **scout**
   - identify exact file scope
   - summarize breakpoints and dependencies
2. **architect**
   - propose minimal repair plan
   - define verification commands
3. **impl-worker**
   - apply bounded fix
4. **test-engineer**
   - run smallest meaningful checks and summarize evidence

### Rules for team execution
- no broad refactor unless ticket explicitly authorizes it
- every ticket must name its verification commands before implementation
- any unresolved assumptions must be written in the completion note
- if a ticket reveals cross-cutting redesign needs, stop and spawn a follow-up design task instead of freelancing scope

---

## 7. Verification Matrix

| Area | Minimum Check | Owner Type |
|---|---|---|
| Build health | `npm run build` | impl-worker / test-engineer |
| Physics validity | `npm run validate-physics` | test-engineer |
| Determinism | `npm run check:determinism` | test-engineer |
| System render smoke | manual browser check | human + agent |
| Galaxy render smoke | manual browser check | human + agent |
| Docs/scripts alignment | manual checklist | architect / reviewer |

---

## 8. Risks

### Risk: stabilization turns into an endless cleanup phase
**Mitigation:** phase ends when trust is restored, not when every imperfection is gone.

### Risk: galaxy work continues destabilizing core work
**Mitigation:** galaxy changes during Phase A must be framed as repair or containment only.

### Risk: team agents widen scope
**Mitigation:** keep tickets small and verification-first.

### Risk: determinism remains ambiguous
**Mitigation:** document normalized equality now, before customization work begins.

---

## 9. Exit Criteria

Phase A can be declared complete when:
- build is green
- core scripts and docs are aligned
- determinism policy is documented and testable
- the repo is safe for measured feature delivery
- the next phase can focus on star-system depth rather than firefighting

At that point, the project should move to:
- **B:** star system customization and orbit systems
- while keeping **C:** galaxy sandbox work clearly secondary and non-blocking

---

## 10. Recommended Next Step After Approval

After this plan is accepted:
1. convert A1–A6 into discrete tickets
2. run them through `pi-dev-team` with explicit verification per ticket
3. start the orbit systems design work only after build/doc/determinism trust is restored
