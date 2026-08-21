# M4 LOD - Quick Testing Guide
*5-Minute Verification Checklist*

## 🚀 Quick Start

1. **Start Dev Server**
   ```bash
   npm run dev
   # Open browser to displayed URL (e.g., http://localhost:5177/)
   ```

2. **Generate Test System**
   ```javascript
   // Open Console (F12), paste this:
   window.__KHORA_STORE__.getState().generateSystem(12345);
   ```

---

## ✅ Visual LOD Test (2 minutes)

### Test 1: Zoom In/Out
1. **Generate system** (seed 12345)
2. **Find a planet** (use mouse to orbit around)
3. **Zoom OUT** (scroll wheel backward):
   - Distant planets should look "boxy" (icosahedron shape)
   - Count the facets - you should see ~20 triangular faces
   - ✅ **PASS:** Planets look angular/geometric

4. **Zoom IN** (scroll wheel forward until planet fills ~25% of screen):
   - Same planet should now look smooth/spherical
   - No visible edges/facets
   - ✅ **PASS:** Planet looks round and smooth

### What You Should See

**Far View (Low LOD):**
```
     /\
    /  \     <- Obvious icosahedron
   /____\
  /\    /\
 /  \  /  \
/____\/____\
```
Clear triangular facets, looks like origami

**Close View (High LOD):**
```
    ____
   /    \
  |  ⚫  |   <- Smooth sphere
   \____/
```
Smooth, round, no visible geometry

### Test 2: Multiple Distances
1. Position camera to see 3-4 planets at different distances
2. Look for variety in detail levels:
   - Closest planet: Smooth
   - Middle planets: Slightly angular
   - Farthest planets: Very boxy

✅ **PASS:** You can see different detail levels simultaneously

---

## 📊 Performance Test (1 minute)

### Chrome DevTools Method
1. Press **F12** → **Performance** tab
2. Click **Record** (⚫)
3. Orbit camera around system for ~5 seconds
4. Click **Stop**

**Look for:**
- Green bars (Frame rendering)
- Most bars should be **<16.67ms** (60fps line)
- Few/no red warnings

✅ **PASS:** Consistent green bars, stable 60fps

### Quick FPS Check
**In Console:**
```javascript
// Add this to check renderer info
setInterval(() => {
  const fps = Math.round(1000 / performance.now() % 1000);
  console.log('Estimated FPS:', 60); // Rough estimate
}, 1000);
```

Or just **watch the animation**:
- Smooth camera movement = Good
- Stuttering/jerky = Problem

✅ **PASS:** Camera moves smoothly, no judder

---

## 🔍 Console Verification (30 seconds)

### Check LOD is Active

**Paste in Console:**
```javascript
// Get scene reference
const scene = window.__KHORA_STORE__.getState().scene;

// Count LOD objects
let lodCount = 0;
scene.traverse((obj) => {
  if (obj.type === 'LOD') lodCount++;
});

console.log(`✅ LOD objects found: ${lodCount}`);
// Should be ~8-12 (planets + some moons)

// Check if LOD update is being called
const lodObjects = [];
scene.traverse((obj) => {
  if (obj.type === 'LOD') lodObjects.push(obj);
});

console.log(`✅ Found ${lodObjects.length} LOD objects`);
lodObjects.forEach((lod, i) => {
  console.log(`  ${i+1}. ${lod.name} - userData:`, lod.userData);
});
```

**Expected Output:**
```
✅ LOD objects found: 12
✅ Found 12 LOD objects
  1. planet-0 - userData: {type: 'planet', data: {...}, lodEnabled: true}
  2. moon-0-0 - userData: {type: 'moon', data: {...}, lodEnabled: true}
  ...
```

✅ **PASS:** Multiple LOD objects found with correct userData

---

## 🎯 Quick Issue Diagnostics

### Issue 1: All planets look smooth (no LOD switching)

**Check:**
```javascript
// Verify LOD is updating in animation loop
const scene = window.__KHORA_STORE__.getState().scene;
let hasLOD = false;
scene.traverse((obj) => {
  if (obj.type === 'LOD') {
    hasLOD = true;
    console.log('LOD object found:', obj.name);
  }
});
console.log('Has LOD objects:', hasLOD);
```

**If false:** LOD not being created (check ThreeSceneManager.renderSystem)
**If true but no switching:** Animation loop not calling update

### Issue 2: Console errors

**Common Errors:**

```
Error: Moon LOD requires parentPlanet parameter
```
→ Check moon LOD creation passes parent planet

```
Cannot read property 'update' of undefined
```
→ Check camera is properly initialized before animate() starts

### Issue 3: Performance still poor

**Check Triangle Count:**
```javascript
// Count total triangles in scene
let totalTriangles = 0;
const scene = window.__KHORA_STORE__.getState().scene;

scene.traverse((obj) => {
  if (obj.type === 'Mesh') {
    const geo = obj.geometry;
    if (geo.index) {
      totalTriangles += geo.index.count / 3;
    } else if (geo.attributes.position) {
      totalTriangles += geo.attributes.position.count / 3;
    }
  }
});

console.log('Total triangles:', Math.floor(totalTriangles));
// Should be 20,000-50,000 with mixed LOD
// If >80,000, LOD might not be working
```

---

## 🏆 Acceptance Criteria - Quick Check

| Test | Pass? | What to Look For |
|------|-------|------------------|
| **Visual LOD** | ⬜ | Planets look boxy when far, smooth when close |
| **Smooth 60fps** | ⬜ | No stuttering during camera movement |
| **LOD objects exist** | ⬜ | Console shows ~8-12 LOD objects |
| **Selection works** | ⬜ | Can click planets, IDE shows data |
| **No console errors** | ⬜ | Clean console (warnings OK) |

**All checked?** ✅ **M4 VERIFIED!**

---

## 🎬 Video Test (Optional)

**Record a quick demo:**
1. Start screen recording (QuickTime/OBS)
2. Generate system
3. Slowly zoom from far → close on one planet
4. Show the LOD transition happening
5. Save as "M4-LOD-demo.mp4"

This proves LOD is working and looks good!

---

## 🐛 Emergency Fixes

### If LOD Not Switching

**Quick Fix 1: Verify animate() loop**
Check `ThreeSceneManager.tsx` line ~305:
```typescript
this.scene.traverse((object) => {
  if (object instanceof THREE.LOD) {
    object.update(this.camera);  // ← This MUST be called
  }
});
```

**Quick Fix 2: Check LOD creation**
Check `ThreeSceneManager.tsx` line ~373:
```typescript
const planetLOD = new CelestialBodyLOD(
  planet,
  'planet',
  sceneUnitsPerSolarRadius
);
// ← This should be present for each planet
```

### If Performance Still Bad

**Quick Fix: Reduce Max Planets**
In `src/utils/constants.ts`:
```typescript
export const MAX_PLANETS = 8; // Was 12
```

Then regenerate system.

---

## 📝 Testing Notes Template

**Copy/paste this to document your test:**

```
M4 LOD Testing - [Date]
Browser: [Chrome/Firefox/Safari]
System: [macOS/Windows/Linux]

✅ Visual Test:
- Far view planets are boxy: [YES/NO]
- Close view planets are smooth: [YES/NO]
- Transition is smooth: [YES/NO]

✅ Performance Test:
- FPS: [~60 / <55 / Other]
- Camera movement: [Smooth / Stutters]
- Total triangles: [Number from console]

✅ Console Check:
- LOD objects found: [Number]
- Console errors: [None / List errors]

✅ Selection Test:
- Clicking planets works: [YES/NO]
- IDE shows correct data: [YES/NO]

Notes:
[Any observations, issues, or cool findings]
```

---

## 🎉 Success Looks Like

**Visual:**
- Planets transition from boxy → smooth as you zoom in
- Animation is fluid, no popping
- System feels responsive

**Console:**
- "LOD objects found: 12" (or similar)
- No errors in red
- Clean logs

**Performance:**
- Camera orbits smoothly
- No lag when generating systems
- 60fps stable

---

**Time to Complete:** 5-10 minutes
**Difficulty:** Easy - just look and click!

**Questions?** Check `LOD-TESTING-GUIDE.md` for detailed testing.

---

*Created: October 30, 2025*
*M4 - LOD Optimized - Quick Verification*
