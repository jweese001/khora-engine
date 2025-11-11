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

## UI/UX Design References

**Location:** `/Users/kraken/Documents/khora/`

### Style Guide (Khora-Style-Guide-V01.md)
Complete design system documentation for all future UI development:

**Design System:**
- Color Palette: #000510 (space), #1a1a1a (panels), #00ffff (cyan), #ffd700 (gold), #ff1493 (magenta)
- Typography: Inter (UI), Courier New (code), size scale (11px-18px)
- Spacing: 8px grid system (8px, 16px, 24px multiples)
- WCAG 2.1 Level AA compliance (all contrast ratios tested)

**Component Library:**
- Buttons (primary, secondary, ghost)
- Sliders (range controls with handles)
- Panels (semi-transparent overlays)
- Tabs (navigation, content switching)
- Accordions (collapsible sections)
- Tree views (hierarchical data)
- Dropdowns, color pickers, input fields

**Layout Patterns:**
- Panel widths: Data Panel (400px), IDE Panel (640px), Nav Panel (200px)
- Glow effects: `box-shadow: 0 0 20px rgba(0, 255, 255, 0.4)`
- Animations: `cubic-bezier(0.4, 0.0, 0.2, 1)` for panels

### HTML Mockup (Khora-Mock-V01.html)
Interactive reference implementation of all UI screens:

**Screens Included:**
- 1.1: Main HUD
- 1.2: Data Panel (quick inspector)
- 1.3-1.6: IDE Panel (Scene Tree, Data Inspector, Shader Viewer)
- 3.1-3.3: Architect Mode Workbench (Star Editor, Planet Editor)
- 4.1: System Map (strategic view)
- 4.2: Marketplace (economic interface)

**Features:**
- Material Design Icons: https://pictogrammers.com/library/mdi/
- CSS Custom Properties (full design system)
- Interactive JavaScript (accordions, tabs, tree navigation)
- Responsive layout patterns
- Ready for React component conversion

**Usage:**
- Reference for UI component implementation
- Visual testing of design system
- Pattern library for future development
- Demonstrates complete user experience flow

**When to Use:**
- Phase 2+: Multi-system UI development
- Phase 3: Architect Mode implementation
- Phase 4: System Map and Marketplace features
- Any UI/UX implementation work

---

*[Rest of PLANNING.md content - see Obsidian for full technical details]*

**For complete implementation details, algorithms, and code patterns, refer to:**
- Obsidian: `Projects/Khora Engine/PLANNING.md` (full version)
- This file contains essential quick reference information

---

*Last Updated: October 31, 2025*
*Based on: PRD - Khora Engine v2.md*
*Phase 1 Target: 12 weeks to MVP*
