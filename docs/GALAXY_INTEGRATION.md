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

### Phase 0: Setup ✅
- [x] Create branch `feature/galaxy-visual-integration`
- [x] Create this documentation
- [ ] Update TASKS.md with integration checklist

### Phase 1: Core Integration (Sessions 1-2)
- [ ] Port `galaxy-particle-system.js` → `src/rendering/GalaxyParticleSystem.ts`
- [ ] Convert to TypeScript with proper types
- [ ] Update `GalaxyRenderer.ts` to use particle system
- [ ] Add `setSystemMarkers(systems)` method
- [ ] Connect to `ThreeSceneManager.renderGalaxy()`
- [ ] Test marker click → system view workflow

### Phase 2: UI Integration (Session 3)
- [ ] Add galaxy generation controls to UI
- [ ] Add view mode toggle (Galaxy ↔ System)
- [ ] Show galaxy metadata in IDE panel
- [ ] Add "Return to Galaxy" navigation
- [ ] Preserve panel hide/show functionality

### Phase 3: Visual Polish (Session 4)
- [ ] Color-code markers by star spectral type
- [ ] Size markers by star mass
- [ ] Map galaxy types to particle configs
- [ ] Add multi-layer controls
- [ ] Polish camera transitions

### Phase 4: Documentation & Testing (Session 5)
- [ ] Add code documentation
- [ ] Test all galaxy types
- [ ] Test different system counts
- [ ] Performance testing (60fps target)
- [ ] Update TASKS.md completion status

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
- **Session 1:** Port particle system (2-3 hrs)
- **Session 2:** Connect markers (2 hrs)
- **Session 3:** UI integration (2 hrs)
- **Session 4:** Visual polish (2-3 hrs)
- **Session 5:** Testing & docs (1-2 hrs)

**Total: 10-12 hours over 5 sessions**

---

## Notes

- Based on galactic-assets repo created 2025-01-15
- Particle system includes multi-layer support
- Independent marker visibility already implemented
- -36° rotation fix required for alignment
- Priority: Beautiful and polished (user preference)
- Navigation: Click markers in 3D space (user preference)

---

*Created: 2025-01-15*
*Last Updated: 2025-01-15*
