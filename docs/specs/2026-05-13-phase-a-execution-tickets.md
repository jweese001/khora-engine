# Phase A Execution Tickets

**Date:** 2026-05-13  
**Source Plan:** `docs/specs/2026-05-13-phase-a-stabilization-plan.md`  
**Priority Order:** A → B → C  
**Execution Style:** small, verifiable, low-overlap tickets for `pi-dev-team`

---

## Execution Rules

Each ticket should follow this pipeline:
1. **scout** — inspect exact file scope and current breakpoints
2. **architect** — define minimal fix and verification
3. **impl-worker** — implement within ticket bounds
4. **test-engineer** — run evidence-based verification

### Ticket rules
- do not widen scope without explicit approval
- define verification commands before editing
- prefer minimum-blast-radius changes
- record assumptions and anything not verified
- if a ticket reveals architectural redesign, stop and spin out a follow-up ticket

---

# Ticket Queue

## A-01 — Build Repair: Scene/Store Contract Mismatches

**Priority:** P0  
**Goal:** restore coherence between scene orchestration and store APIs

### Problem
Current scene code references store behavior that does not exist or no longer matches the store contract.

### Known examples
- `ThreeSceneManager.tsx` references `setCurrentSystem`
- related system/galaxy transition logic may be relying on stale assumptions

### Likely files
- `src/components/Canvas/ThreeSceneManager.tsx`
- `src/components/Canvas/CanvasContainer.tsx`
- `src/store/system-store.ts`

### Deliverables
- store and scene APIs agree
- no undefined store methods remain
- system ↔ galaxy transitions still behave coherently

### Verification
- `npm run build`
- targeted manual smoke check:
  - generate a system
  - generate a galaxy
  - enter a system from galaxy view
  - return to galaxy view

### Done when
- compiler errors in this area are resolved
- runtime flow remains coherent

---

## A-02 — Build Repair: Galaxy Type Contract

**Priority:** P0  
**Goal:** make galaxy shape explicit and consistent across types, generation, and scene consumers

### Problem
Scene and integration code reference galaxy fields that are not present in the `Galaxy` type.

### Known examples
- `originalSystemCount` referenced in scene code but missing from `src/types/galaxy.ts`

### Decision to make
Choose one:
1. add missing fields to the `Galaxy` contract if they are product-relevant
2. remove those assumptions and derive behavior another way

### Likely files
- `src/types/galaxy.ts`
- `src/generation/galaxy-generator.ts`
- `src/components/Canvas/ThreeSceneManager.tsx`
- possibly `src/store/system-store.ts`

### Deliverables
- `Galaxy` contract accurately reflects actual runtime usage
- no hidden extra-shape assumptions remain

### Verification
- `npm run build`
- targeted manual smoke check for marker add/remove and galaxy/system transitions

### Done when
- all `Galaxy` consumers compile cleanly
- contract is explicit enough for later architect work

---

## A-03 — Build Repair: Galaxy Rendering Typing and Disposal

**Priority:** P0  
**Goal:** fix strict typing issues in galaxy rendering code without feature expansion

### Problem
Galaxy rendering code currently has TypeScript errors around:
- `Material | Material[]`
- shader material uniform access
- unused declarations under current TS strictness

### Likely files
- `src/rendering/GalaxyParticleSystem.ts`
- `src/rendering/GalaxyRenderer.ts`

### Deliverables
- material disposal is type-safe
- shader material access is narrowed correctly
- dead declarations/imports removed or used intentionally

### Verification
- `npm run build`
- targeted smoke review of galaxy rendering path

### Done when
- these files compile without suppressive hacks

---

## A-04 — Docs/Script Alignment

**Priority:** P1  
**Goal:** make repo guidance truthful and executable

### Problem
Current docs overstate readiness and refer to workflows/scripts that do not fully match the repo.

### Required work
- update `README.md` readiness language
- clarify current branch status
- align referenced scripts with `package.json`
- preserve historical accomplishments in `TASKS.md` without pretending current branch is release-clean

### Likely files
- `README.md`
- `TASKS.md`
- `package.json`

### Deliverables
- honest branch-state messaging
- every README command exists and works, or is removed
- historical milestone notes remain intact but contextualized

### Verification
- manual review of commands in README
- run each referenced core command
- `npm run build`

### Done when
- a new contributor or agent can trust the docs

---

## A-05 — Determinism Contract and Check

**Priority:** P1  
**Goal:** define and verify deterministic output boundaries for system generation

### Problem
The project claims determinism, but canonical output vs metadata/visual randomness is not clearly bounded.

### Required decisions
- what fields count for deterministic equality?
- how should timestamps like `generatedAt` be treated?
- are galaxy marker/particle visuals canonical or presentation-only?

### Likely files
- `src/generation/system-generator.ts`
- `src/store/system-store.ts`
- `scripts/`
- `README.md` or `docs/`

### Deliverables
- normalized determinism check script
- documented equality policy
- clear distinction between canonical generated state and runtime/presentation state

### Verification
- `npm run check:determinism`
- run same seed comparison twice
- confirm normalized equality passes

### Done when
- determinism claims are precise and testable

---

## A-06 — Verification Harness Setup

**Priority:** P1  
**Goal:** create a small repeatable verification surface for humans and agents

### Required checks
- build check
- determinism check
- physics validation check
- minimal manual smoke checklist

### Likely files
- `package.json`
- `scripts/`
- `README.md`
- optional `docs/verification/` or `docs/specs/`

### Deliverables
- standardized commands such as:
  - `npm run build`
  - `npm run validate-physics`
  - `npm run check:determinism`
- short verification checklist documented in repo

### Verification
- execute the commands end-to-end

### Done when
- future tickets can reference a stable verification baseline

---

## A-07 — Scene Containment Pass I

**Priority:** P2  
**Goal:** reduce the blast radius of `ThreeSceneManager.tsx` without a risky rewrite

### Problem
`ThreeSceneManager.tsx` currently owns too many unrelated responsibilities.

### Initial containment targets
Choose 1-2 of these for extraction first:
- camera transition helpers
- marker interaction helpers
- disposal helpers
- galaxy view helpers
- uniform update helpers

### Likely files
- `src/components/Canvas/ThreeSceneManager.tsx`
- new helper files under `src/components/Canvas/` or `src/rendering/`

### Deliverables
- at least one responsibility moved out or isolated cleanly
- file boundaries clearer for future work

### Verification
- `npm run build`
- targeted smoke check for the extracted path

### Done when
- future tickets no longer need to touch all scene responsibilities at once

---

## A-08 — Experimental Boundary Labeling

**Priority:** P2  
**Goal:** clearly distinguish stable/core work from experimental galaxy sandbox work

### Problem
The project currently risks conflating historical success with current branch stability.

### Required work
- label galaxy sandbox/integration surfaces appropriately in docs
- clarify that A stabilization and B orbit/customization are primary
- keep C visible, but non-blocking

### Likely files
- `README.md`
- `TASKS.md`
- optional dedicated docs index note

### Deliverables
- stable vs experimental boundary is understandable
- future feature planning can reference this boundary explicitly

### Verification
- manual doc review

### Done when
- project direction is legible to collaborators and agents

---

# Suggested Execution Order

## Wave 1 — Must-fix build trust
1. **A-01** Scene/Store Contract Mismatches
2. **A-02** Galaxy Type Contract
3. **A-03** Galaxy Rendering Typing and Disposal

## Wave 2 — Trustworthy repo operation
4. **A-04** Docs/Script Alignment
5. **A-05** Determinism Contract and Check
6. **A-06** Verification Harness Setup

## Wave 3 — Containment and future safety
7. **A-07** Scene Containment Pass I
8. **A-08** Experimental Boundary Labeling

---

# Suggested `pi-dev-team` Assignment Pattern

| Ticket | Suggested Chain |
|---|---|
| A-01 | scout → architect → impl-worker → test-engineer |
| A-02 | scout → architect → impl-worker → test-engineer |
| A-03 | scout → architect → impl-worker → test-engineer |
| A-04 | scout → architect → impl-worker |
| A-05 | scout → architect → impl-worker → test-engineer |
| A-06 | scout → architect → impl-worker → test-engineer |
| A-07 | scout → architect → impl-worker → test-engineer |
| A-08 | scout → architect |

---

# Exit Condition for Ticket Queue

The queue has done its job when:
- the repo builds cleanly
- docs and scripts match reality
- determinism is explicit and testable
- a minimal verification harness exists
- the codebase is ready for B-phase orbit/customization work in measured increments
