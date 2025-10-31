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

## Phase 3 Vision: Architect Mode

**Key Insight from M5 (Procedural Shaders):**

During shader development, we discovered that developing shaders directly in the engine is difficult and slow. The optimal workflow is:

1. **Develop in isolation** - Create standalone HTML demos with live controls
2. **Iterate visually** - Use sliders and color pickers for rapid feedback
3. **Port when perfect** - Only integrate into engine when shader is complete

**Architect Mode Goal:**
Transform the read-only IDE into an interactive shader editor that allows runtime parameter tuning and system customization.

### Workflow Vision

```
Generate System (procedural, deterministic)
    ↓
Select Planet (click in 3D view)
    ↓
Edit Parameters (live shader controls in IDE)
    ↓
Save Customizations (override procedural defaults)
    ↓
Export/Share (JSON export with custom values)
```

### Key Features

**Interactive Shader Controls:**
- Color pickers for all color uniforms (baseColor, rustColor, bandColors, etc.)
- Range sliders for numeric parameters (scale, intensity, turbulence, etc.)
- Real-time preview as parameters change
- Reset to procedural defaults
- Apply changes to all planets of same type

**Shader Development Mode:**
- Integrate standalone shader demos into IDE
- "Shader Lab" tab for experimentation
- Export/import shader presets
- Document parameter ranges and visual quality guidelines

**Data Persistence:**
- Export systems with custom parameters as JSON
- Import customized systems
- Save snapshots for comparison
- Share via URL hash/query params

### Implementation Timeline (8 weeks)

**Weeks 1-2:** IDE enhancement with parameter inspection and controls
**Weeks 3-4:** Live editing system with real-time uniform updates
**Weeks 5-6:** Shader development workflow integration
**Weeks 7-8:** Data persistence and sharing features

### Critical Design Principles (Learned from M5)

**Seed Handling:**
- ❌ DON'T: Add seed offsets to noise positions (`normPos + vec3(u_seed * 0.1)`)
- ✅ DO: Use seed for rotation/transformation (`rotation * normPos`)
- WHY: Offsets can land in uniform regions of noise space, destroying detail

**Shader Development:**
1. Develop in standalone HTML demos first
2. Iterate with live visual feedback
3. Document good parameter ranges
4. Test edge cases and performance
5. Port to engine only when visually perfect

**Visual Quality Checklist:**
- No visible banding or posterization
- Detail visible at all zoom levels
- Each planet looks unique with same shader
- Performance acceptable (60fps)
- Aesthetically pleasing color palette

---

**Status:** Planning phase - Not scheduled for Phase 1
**Dependencies:** M6 (Phase 1 Complete), Phase 2 (Multi-system Galaxy)
**Estimated Effort:** 8 weeks
**Priority:** High - Critical for creative workflow

---

*[Rest of PLANNING.md content - see Obsidian for full technical details]*

**For complete implementation details, algorithms, and code patterns, refer to:**
- Obsidian: `Projects/Khora Engine/PLANNING.md` (full version)
- This file contains essential quick reference information

---

*Last Updated: October 31, 2025*
*Based on: PRD - Khora Engine v2.md*
*Phase 1 Target: 12 weeks to MVP*
