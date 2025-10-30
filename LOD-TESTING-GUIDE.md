# LOD System - Testing Guide

**Created:** October 30, 2025
**Milestone:** M4 - LOD Optimized
**Status:** Implementation Complete - Manual Testing Required

---

## Overview

The Level-of-Detail (LOD) system has been successfully implemented for all planets and moons. This guide provides instructions for manual testing since automated browser testing isn't available in the Docker environment.

---

## Implementation Summary

### Files Created/Modified

**New File:**
- `src/rendering/CelestialBodyLOD.ts` (345 lines) - Complete LOD management class

**Modified Files:**
- `src/components/Canvas/ThreeSceneManager.tsx` - Refactored to use LOD
- `src/utils/constants.ts` - LOD distance thresholds already present

### LOD Configuration

```typescript
LOD_LEVELS = {
  HIGH:   0,    // 0-50 units: Subdivision 4 (2,562 triangles)
  MEDIUM: 50,   // 50-200 units: Subdivision 2 (642 triangles)
  LOW:    200   // 200+ units: Subdivision 0 (162 triangles)
}
```

**Triangle Reduction:** Up to 94% fewer triangles for distant objects!

---

## Manual Testing Instructions

### 1. Start the Application

```bash
cd /Users/kraken/Documents/khora/khora-engine
npm run dev
```

Open your browser to the displayed URL (e.g., `http://localhost:5177/`)

### 2. Generate a Test System

Click "Generate System" or use console:

```javascript
// Generate a system with multiple planets and moons
window.__KHORA_STORE__.getState().generateSystem(12345);
```

**Good Test Seeds:**
- `12345` - F-type star with 12 planets
- `99999` - F-type with habitable world "Nereid"
- `42` - M-type red dwarf with smaller system

### 3. Visual LOD Testing

**Test Procedure:**
1. **Zoom Out** (mouse wheel or right-drag back)
   - Observe planets becoming less detailed (fewer polygons visible)
   - Distant planets should appear as simple icosahedrons

2. **Zoom In on a Planet**
   - Approach until planet fills ~25% of screen
   - Should switch to high detail (smooth sphere)
   - You may see individual facets at medium/low detail

3. **Orbit Around System**
   - Use left-click drag to rotate view
   - Watch planets transition between LOD levels
   - Transitions should be smooth (no obvious "popping")

**What to Look For:**
- ✅ Close planets are smooth spheres
- ✅ Distant planets have visible facets
- ✅ Smooth transitions (no flickering)
- ✅ Moons also use LOD (tiny spheres at distance)

### 4. Performance Verification

**Method 1: Browser DevTools**

1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Start recording
4. Generate system and orbit camera for 10 seconds
5. Stop recording

**Check:**
- Frame rate: Should maintain 60fps (16.67ms frame time)
- No long frames (>33ms = fps drop)

**Method 2: Stats.js (if integrated)**

Look for FPS counter in top-left corner:
- Should show solid 60fps
- Brief dips to 58-59fps acceptable
- Sustained <55fps = performance issue

**Method 3: Renderer Info**

Open console and run:

```javascript
// Get renderer statistics
const manager = window.__KHORA_STORE__.getState().scene; // This won't work directly
// Or add to ThreeSceneManager:
console.log(renderer.info.render);
```

**Expected Values:**
- Draw calls: 50-100 (with 8 planets + moons)
- Triangles: Should decrease as camera zooms out
- High detail all objects: ~100,000+ triangles
- Mixed LOD: ~30,000-50,000 triangles (50-70% reduction)

### 5. LOD Statistics (Debug Helper)

Add this to browser console:

```javascript
import { logLODStats } from './src/rendering/CelestialBodyLOD';

// In ThreeSceneManager, expose scene and camera
// Then call:
logLODStats(scene, camera);
```

**Expected Output:**
```
[LOD Stats] Analyzing scene...
  planet: Kepler-452 b - Level 0 (high), 2562 triangles, distance: 25.3 units
  planet: Jupiter - Level 1 (medium), 642 triangles, distance: 85.7 units
  moon: Io - Level 2 (low), 162 triangles, distance: 210.4 units
[LOD Stats] Summary:
  Bodies with LOD: 12
  Current triangles: 15840
  High detail triangles: 61488
  Triangle reduction: 74.2%
```

### 6. Object Selection Testing

**Test Procedure:**
1. Generate a system
2. Click on a planet
3. Verify IDE panel shows planet data
4. Click on a moon (may be small - zoom in first)
5. Verify moon data displays

**Expected Behavior:**
- Clicking planet shows planet properties in IDE
- Clicking moon shows moon properties
- LOD objects store userData correctly for raycasting

### 7. Memory Leak Testing

**Test Procedure:**
1. Open DevTools > Performance > Memory tab
2. Take heap snapshot (click camera icon)
3. Generate system (seed 12345)
4. Take second snapshot
5. Generate different system (seed 99999)
6. Take third snapshot
7. Generate original system again (seed 12345)
8. Take fourth snapshot

**Expected Behavior:**
- Memory should stabilize after 2-3 generations
- Heap size shouldn't continuously grow
- Detached DOM nodes should be minimal (<10)

**If Memory Leaks:**
- Check ThreeSceneManager.clearSystemObjects() is being called
- Verify geometry.dispose() and material.dispose() are called
- Ensure no references held in store

### 8. Stress Test

**Maximum System Test:**

```javascript
// Generate large system
window.__KHORA_STORE__.getState().generateSystem(77777);
```

**Should Still Maintain:**
- 60fps when camera is distant (all objects at low/medium LOD)
- Smooth camera controls
- No stuttering during orbit
- Memory <500MB

---

## Expected Results

### Visual Quality
- ✅ Close planets: Smooth, round spheres
- ✅ Medium distance: Slight faceting visible
- ✅ Far distance: Clear icosahedron shape
- ✅ Moons follow same LOD pattern
- ✅ Stars are always smooth (no LOD - always visible)

### Performance
- ✅ 60fps with 8 planets + 40 moons
- ✅ Frame time <16.67ms (95th percentile)
- ✅ Draw calls <100
- ✅ Memory usage <500MB
- ✅ No stuttering during camera movement

### Functionality
- ✅ LOD levels switch automatically based on distance
- ✅ Transitions are smooth (no popping)
- ✅ Object selection works correctly
- ✅ Moon positions relative to planets correct
- ✅ No console errors
- ✅ System regeneration works without memory leaks

---

## Debugging LOD Issues

### Issue: LOD Not Switching

**Symptoms:** All planets stay at same detail level regardless of distance

**Possible Causes:**
1. `lod.update(camera)` not being called in animation loop
2. Check `ThreeSceneManager.animate()` has the traverse loop (lines 305-310)

**Fix:**
```typescript
// In animate() method:
this.scene.traverse((object) => {
  if (object instanceof THREE.LOD) {
    object.update(this.camera);
  }
});
```

### Issue: Visible Popping Between Levels

**Symptoms:** Objects suddenly change shape when zooming

**Possible Causes:**
1. Distance thresholds too close together
2. Subdivision differences too dramatic

**Adjustments in CelestialBodyLOD.ts:**
```typescript
// Try smoother transitions:
const LOD_LEVELS: LODLevel[] = [
  { subdivision: 3, distance: 0, name: 'high' },     // Was 4
  { subdivision: 2, distance: 75, name: 'medium' },  // Was 50
  { subdivision: 1, distance: 250, name: 'low' }     // Was 200, was 0
];
```

### Issue: Performance Still Poor

**Symptoms:** FPS <55 even with LOD enabled

**Diagnostic Steps:**
1. Check LOD is actually active (use logLODStats)
2. Verify triangle counts are actually reducing
3. Check draw calls aren't excessive
4. Profile with Chrome DevTools

**Possible Issues:**
- Too many objects (>15 planets)
- High detail thresholds too high (reduce from 50 to 30)
- Shadows enabled (Phase 1 doesn't use shadows)
- Post-processing effects (not in Phase 1)

### Issue: Selection Not Working

**Symptoms:** Can't click on planets/moons

**Check:**
1. `userData` is set on LOD object (not just the meshes)
2. Raycaster traverses LOD objects correctly
3. Camera and controls are properly initialized

**Verify:**
```typescript
// In CelestialBodyLOD constructor:
this.object.userData = {
  type: bodyType,
  data: bodyData,
  lodEnabled: true
};
```

---

## Performance Benchmarks

### Expected Triangle Counts

**Single Planet (Earth-sized):**
- High LOD (subdivision 4): 2,562 triangles
- Medium LOD (subdivision 2): 642 triangles
- Low LOD (subdivision 0): 162 triangles

**Reduction:** 94% fewer triangles (high → low)

**Full System (8 planets, 20 moons):**
- All high detail: ~102,000 triangles
- Mixed (typical view): ~35,000 triangles (66% reduction)
- All low detail (far zoom): ~6,000 triangles (94% reduction)

### Frame Time Targets

- **60fps:** 16.67ms per frame
- **30fps:** 33.33ms per frame (unacceptable)

**Budget Breakdown:**
- Rendering: <10ms
- JavaScript: <4ms
- Other: <2ms

**If Exceeding Budget:**
1. Reduce max planets from 12 to 8
2. Lower high detail subdivision from 4 to 3
3. Increase LOD distances (50, 75, 300)

---

## Acceptance Criteria

### M4 Milestone Complete When:

- [x] ✅ CelestialBodyLOD class implemented with 3 levels
- [x] ✅ ThreeSceneManager uses LOD for planets and moons
- [x] ✅ LOD updates automatically in animation loop
- [ ] ⏳ Visual testing confirms smooth LOD transitions
- [ ] ⏳ Performance testing shows 60fps maintained
- [ ] ⏳ Draw calls reduced at distance (verified in DevTools)
- [ ] ⏳ Object selection works with LOD objects
- [ ] ⏳ No memory leaks on system regeneration
- [ ] ⏳ No console errors during normal operation

**Manual Testing Required:** Items marked ⏳ require manual browser testing.

---

## Next Steps (After Manual Testing)

1. ✅ Verify all acceptance criteria met
2. ✅ Document any issues found
3. ✅ Update TASKS.md with M4 complete status
4. ✅ Commit LOD implementation
5. 🔜 Begin M5 - Procedural Shaders (Week 8-9)

---

*Created: October 30, 2025*
*LOD Implementation - Session 4*
*Milestone: M4 - LOD Optimized*
