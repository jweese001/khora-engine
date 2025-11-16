# Galaxy Visual Integration Plan

**Branch:** `feature/galaxy-visual-integration`
**Base:** `feature/phase-2-galaxy`
**Goal:** Replace galaxy visualization with galactic-assets particle system while keeping procedural generation

---

## Overview

This integration combines the best of both systems:
- **Visual Layer:** Beautiful multi-layer galaxy particle system from galactic-assets
- **Data Layer:** Robust procedural generation from khora-engine
- **Connection:** Visual markers represent real generated star systems

---

## Architecture

### Current State
- Khora Engine has procedural galaxy generation (`galaxy-generator.ts`)
- Basic instanced mesh visualization for system markers
- Click markers → view individual systems (implemented)

### Target State
- Replace visualization with GalaxyParticleSystem (multi-layer, beautiful particles)
- Keep procedural generation unchanged
- Map generated system positions to particle markers
- Preserve click-to-system workflow

---

## Implementation Phases

### Phase 0: Setup ✅ COMPLETE
- [x] Create branch `feature/galaxy-visual-integration`
- [x] Create this documentation
- [x] Update TASKS.md with integration checklist

### Phase 1: Core Integration (Sessions 1-2) ✅ COMPLETE
- [x] Port `galaxy-particle-system.js` → `src/rendering/GalaxyParticleSystem.ts`
- [x] Convert to TypeScript with proper types (5 galaxy types, multi-layer support)
- [x] Update `GalaxyRenderer.ts` to use particle system
- [x] Add `addSystemMarkers(systems)` method
- [x] Connect to `ThreeSceneManager.renderGalaxy()`
- [x] Test marker click → system view workflow
- [x] Apply -36° rotation fix for alignment
- [x] Add raycasting objects for click detection
- [x] Implement spectral type color mapping
- [x] Implement mass-based marker sizing

### Phase 2: UI Integration (Session 3) ✅ COMPLETE
- [x] Add galaxy generation controls to UI (already implemented)
- [x] Add view mode toggle (Galaxy ↔ System) (automatic via store)
- [x] Show galaxy metadata in IDE panel (title + JSON inspector)
- [x] Add "Return to Galaxy" navigation (breadcrumb button)
- [x] Preserve panel hide/show functionality
- [x] Add dynamic IDE panel title (Galaxy Inspector / System Inspector)
- [x] Loading state during generation (already working)

### Phase 3: Visual Polish (Session 4) ✅ COMPLETE
- [x] Color-code markers by star spectral type (O=blue → M=red)
- [x] Size markers by star mass (logarithmic 3.0-8.0 scale)
- [x] Map galaxy types to particle configs (spiral/elliptical/irregular)
- [x] Add marker pulse effect (shader-based, frequency 2.0)
- [x] Polish camera transitions (smooth ease-in-out cubic, 1.2-1.5s)
- [-] Multi-layer controls (deferred to Phase 5 - next session)

### Phase 4: Core Controls (Session 5) ✅ COMPLETE
- [x] Add comprehensive galaxy core brightness controls
- [x] Implement Core Brightness multiplier (0.0-1.0)
- [x] Implement Core Alpha Falloff for graduated transparency (0.0-1.0)
- [x] Implement Core Exclusion Radius for empty center zone (0.0-0.2)
- [x] Update all 5 galaxy type generators with core controls
- [x] Add Core Controls UI section in GalaxyControls
- [x] Update ring galaxy radius sliders to 0.0-1.0 range
- [x] Add code documentation and algorithm comments
- [x] Update TASKS.md with Session 5 completion

### Phase 5: Marker System Completion (Session 6) ✅ COMPLETE
- [x] Fix Add Markers button (scene manager reference)
- [x] Fix type mismatch between config types and GalaxyType enum
- [x] Replace procedural algorithm with visual spiral algorithm
- [x] Fix marker alignment to spiral arms
- [x] Fix Y-axis distribution (variable thickness)
- [x] Implement multi-layer raycasting for marker clicks
- [x] Add system persistence to galaxy.systems array
- [x] Track originalSystemCount for clean clearing
- [x] Implement dual-mode system lookup (auto-generated vs custom)
- [x] Fix view isolation (galaxy hidden in system view)
- [x] Conditional galaxy layer updates based on view mode
- [x] Restore layer visibility when returning to galaxy view
- [x] Change default marker size to 4.0

**Result:** Full marker functionality with persistence and proper view isolation

### Phase 6: Advanced Features (Next Session)
- [ ] UI cleanup and polish (galaxy controls layout)
- [ ] Multi-layer particle systems (layer management UI)
- [ ] Custom marker placement controls (manual positioning)
- [ ] Marker color customization (override procedural colors)
- [ ] Preset configurations (save/load galaxy settings)
- [ ] Performance testing (60fps target with 500+ markers)
- [ ] Full demo feature parity

---

## Key Technical Decisions

### Marker Connection Strategy
```typescript
setSystemMarkers(systems: StarSystem[]) {
  const markers = systems.map((system, index) => ({
    position: new THREE.Vector3(
      system.galacticPosition.x,
      system.galacticPosition.y,
      system.galacticPosition.z
    ),
    color: getStarColor(system.star.spectralType),
    size: getMarkerSize(system.star.mass),
    data: { systemIndex: index, system }
  }));

  this.particleSystem.setMarkers(markers);

  // Apply -36° rotation for alignment (from galactic-assets)
  this.particleSystem.markerPoints.rotation.x = -Math.PI / 5;
}
```

### Galaxy Type Mapping
```typescript
function mapGalaxyTypeToParticleConfig(galaxy: Galaxy) {
  switch(galaxy.type) {
    case 'Spiral':
      return {
        type: 'spiral',
        armCount: galaxy.params.armCount,
        spiralTightness: galaxy.params.armTightness
      };
    case 'Elliptical':
      return {
        type: 'elliptical',
        ellipticalFlatten: 1 - galaxy.params.eccentricity
      };
    case 'Irregular':
      return {
        type: 'irregular',
        irregularChaos: galaxy.params.dispersalFactor
      };
  }
}
```

### Star Type Color Mapping
```typescript
function getStarColor(spectralType: SpectralType): THREE.Color {
  const colors = {
    O: new THREE.Color(0x9bb0ff), // Blue
    B: new THREE.Color(0xaabfff), // Blue-white
    A: new THREE.Color(0xcad7ff), // White
    F: new THREE.Color(0xf8f7ff), // Yellow-white
    G: new THREE.Color(0xfff4ea), // Yellow
    K: new THREE.Color(0xffd2a1), // Orange
    M: new THREE.Color(0xffcc6f)  // Red
  };
  return colors[spectralType];
}
```

---

## File Modifications

### New Files
- `src/rendering/GalaxyParticleSystem.ts` - Ported particle system
- `docs/GALAXY_INTEGRATION.md` - This file
- `src/components/UI/GalaxyControls.tsx` - (Optional) Separate galaxy controls

### Modified Files
- `src/rendering/GalaxyRenderer.ts` - Replace core with particle system
- `src/components/Canvas/ThreeSceneManager.tsx` - Update renderGalaxy()
- `src/components/UI/UIControls.tsx` - Add galaxy UI
- `src/components/IDE/IDEPanel.tsx` - Galaxy metadata display
- `TASKS.md` - Integration progress tracking

### Unchanged Files
- `src/generation/galaxy-generator.ts` - Keep procedural logic
- `src/generation/system-generator.ts` - No changes needed
- `src/store/system-store.ts` - Minimal changes only
- All Phase 1 files - Preserved

---

## Testing Checklist

### Functional Testing
- [ ] Generate spiral galaxy with 12 systems
- [ ] Generate elliptical galaxy with 8 systems
- [ ] Generate irregular galaxy with 20 systems
- [ ] Click marker in galaxy view
- [ ] Verify correct system loads
- [ ] Return to galaxy view
- [ ] Click different marker
- [ ] Toggle view modes multiple times

### Visual Testing
- [ ] Markers align with particle structure
- [ ] Marker colors match star types
- [ ] Marker sizes vary appropriately
- [ ] Galaxy type matches visualization
- [ ] Multi-layer combinations work
- [ ] Camera transitions smooth
- [ ] Panel hide/show works

### Performance Testing
- [ ] 60fps with 4 systems
- [ ] 60fps with 12 systems
- [ ] 60fps with 20 systems
- [ ] Memory usage acceptable (<500MB)
- [ ] No frame drops during transitions
- [ ] Particle count scales appropriately

---

## Risk Mitigation

### Potential Issues
1. **TypeScript conversion errors** - Port incrementally, test each method
2. **Coordinate system mismatch** - Test with single system first
3. **Performance degradation** - Profile before/after
4. **Raycasting conflicts** - Proper marker group setup
5. **Camera positioning** - Test all transitions

### Rollback Strategy
- Keep old GalaxyRenderer as backup
- Commit after each milestone
- Can revert to specific commits if needed

---

## Success Criteria

- ✅ Beautiful multi-layer galaxy visualization
- ✅ Markers = real procedurally generated systems
- ✅ Click marker → zoom to system
- ✅ "Return to Galaxy" works
- ✅ Galaxy type matches visuals
- ✅ Marker colors = star types
- ✅ Smooth transitions
- ✅ Phase 1 features preserved
- ✅ 60fps with 20 systems
- ✅ Full documentation

---

## Timeline

- **Session 0:** Setup ✅ (30 min)
- **Session 1:** Port particle system ✅ (2-3 hrs) - TypeScript conversion, 5 galaxy types
- **Session 2:** Connect markers ✅ (2 hrs) - Raycasting, spectral colors, mass sizing
- **Session 3:** UI integration ✅ (2 hrs) - Galaxy controls, IDE panel updates
- **Session 4:** Visual polish ✅ (2-3 hrs) - Camera animations, marker effects
- **Session 5:** Core controls ✅ (2 hrs) - Advanced brightness controls
- **Session 6:** Advanced features (planned) - Multi-layer, markers, presets

**Total Completed: 10-12 hours over 5 sessions**
**Remaining: 3-4 hours (Session 6)**

---

## Session 5 Summary (November 15, 2025)

### Problem Solved
User reported persistent "solid cube or sphere" appearance at galaxy center despite previous optimizations. User wanted bright core but with better control to eliminate artifacts.

### Solution Implemented
**Advanced Core Control System** with 3 independent parameters:

1. **Core Brightness** (0.0-1.0, default 0.5)
   - Multiplier specifically for core region particles
   - Independent from overall particle brightness
   - Allows bright aesthetic without overwhelming center

2. **Core Alpha Falloff** (0.0-1.0, default 0.6)
   - Graduated transparency reduction approaching center
   - Prevents solid appearance via alpha gradient
   - Quadratic falloff based on distance from center

3. **Core Exclusion Radius** (0.0-0.2, default 0.0)
   - Optional empty zone at absolute center
   - Helps eliminate super-bright center point
   - Adjustable for different aesthetic preferences

### Algorithm
```typescript
private calculateCoreAlpha(normalizedRadius: number, baseAlpha: number): number {
  const { coreSize, coreBrightness, coreAlphaFalloff } = this.config;

  if (normalizedRadius >= coreSize) {
    return baseAlpha; // Outside core - normal brightness
  }

  // Inside core - apply graduated controls
  const coreT = normalizedRadius / coreSize; // 0.0 at center, 1.0 at edge
  const falloffReduction = (1.0 - coreT) * coreAlphaFalloff;
  const falloffMultiplier = 1.0 - falloffReduction;

  return baseAlpha * coreBrightness * falloffMultiplier;
}
```

### Files Modified
- `src/rendering/GalaxyParticleSystem.ts` - Core algorithm and config
- `src/rendering/GalaxyRenderer.ts` - Default values
- `src/components/IDE/GalaxyControls.tsx` - UI controls

### Bonus Features
- Ring galaxy inner/outer radius sliders now 0.0-1.0 (full flexibility)

### Commit
- **fa816fb** - "✨ GALAXY: Add advanced core brightness controls"
- 10 files changed, 2251 insertions(+), 186 deletions(-)

---

## Notes

- Based on galactic-assets repo created 2025-01-15
- Particle system includes multi-layer support (to be exposed in Phase 5)
- Independent marker visibility already implemented
- -36° rotation fix applied for alignment
- Priority: Beautiful and polished (user preference)
- Navigation: Click markers in 3D space (user preference)
- Core controls solve bright center artifact while preserving aesthetics

### Next Session Priorities
1. Multi-layer particle system UI
2. Custom marker placement and editing
3. Marker color customization
4. Preset save/load system
5. Full feature parity with standalone demo

---

*Created: 2025-01-15*
*Last Updated: 2025-11-15 (Session 5)*
