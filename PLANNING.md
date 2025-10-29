# Khora Engine - Development Planning Guide
*Claude Code Session Reference - Generated from PRD v2.0*

**Working Copy:** This file is synchronized from Obsidian vault
**Source of Truth:** `/Projects/Khora Engine/PLANNING.md` in Obsidian
**Last Synced:** October 29, 2025

---

## Project Overview

**Goal:** Build Phase 1 Genesis Engine - a procedurally generated star system visualization with an integrated development environment.

**Timeline:** 12 weeks
**Current Phase:** Phase 1 - Single Star System MVP
**Tech Stack:** React + TypeScript + Three.js + Zustand + Vite

---

## Quick Reference

### Core Data Types Location
`src/types/celestial-bodies.ts`

Key types: `SpectralType`, `EvolutionaryStage`, `PlanetType` (const objects, not enums)
Key interfaces: `Star`, `Planet`, `Moon`, `StarSystem`, `Atmosphere`, `ResourceMap`

**Note:** Using const objects with `as const` instead of enums for TypeScript `erasableSyntaxOnly` compatibility.

### State Management
**Store:** `src/store/system-store.ts` (Zustand)

Primary state:
- `currentSystem: StarSystem | null`
- `selectedObject: { type, data, material } | null`
- `ideOpen: boolean`
- `scene: THREE.Scene | null`

### Scene Management
**Manager:** `src/components/Canvas/ThreeSceneManager.tsx`

Key responsibilities:
- Scene initialization (camera, renderer, controls)
- Post-processing (bloom for stars)
- System rendering coordination
- Object selection via raycasting

---

## File Structure

```
src/
├── components/
│   ├── App.tsx                      # Root component
│   ├── UI/
│   │   ├── GenerateButton.tsx       # System generation trigger
│   │   ├── DataPanel.tsx            # Selected object properties
│   │   └── UIControls.tsx           # Top-level UI controls
│   ├── Canvas/
│   │   ├── CanvasContainer.tsx      # Three.js mount point
│   │   └── ThreeSceneManager.tsx    # Scene orchestration
│   └── IDE/
│       ├── IDEPanel.tsx             # Main IDE container
│       ├── SceneTree.tsx            # Three.js hierarchy viewer
│       ├── DataInspector.tsx        # JSON data display (Monaco)
│       ├── ShaderViewer.tsx         # GLSL shader display
│       └── MonacoConfig.ts          # Editor configuration
│
├── generation/
│   ├── star-generator.ts            # Star creation logic
│   ├── planet-generator.ts          # Planet creation logic
│   ├── moon-generator.ts            # Moon creation logic
│   ├── resource-distributor.ts      # Resource assignment
│   └── name-generator.ts            # Procedural naming
│
├── rendering/
│   ├── CelestialBodyLOD.ts          # LOD system (3 levels)
│   ├── StarRenderer.ts              # Star mesh + glow sprite
│   ├── PlanetRenderer.ts            # Planet material factory
│   └── OrbitRenderer.ts             # Orbit line generation
│
├── shaders/
│   ├── star/
│   │   ├── star.vert
│   │   └── star.frag
│   ├── rocky-planet/
│   │   ├── rocky-planet.vert
│   │   └── rocky-planet.frag        # Simplex noise terrain
│   └── gas-giant/
│       ├── gas-giant.vert
│       └── gas-giant.frag           # Horizontal band patterns
│
├── store/
│   └── system-store.ts              # Zustand state
│
├── types/
│   └── celestial-bodies.ts          # All TypeScript interfaces
│
└── utils/
    ├── random.ts                    # Seeded RNG (critical for determinism)
    ├── physics.ts                   # Orbital mechanics calculations
    └── constants.ts                 # Physical constants
```

---

*[Rest of PLANNING.md content - see Obsidian for full technical details]*

**For complete implementation details, algorithms, and code patterns, refer to:**
- Obsidian: `Projects/Khora Engine/PLANNING.md` (full version)
- This file contains essential quick reference information

---

*Last Updated: October 29, 2025*
*Based on: PRD - Khora Engine v2.md*
*Phase 1 Target: 12 weeks to MVP*
