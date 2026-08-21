# Khora Engine - Session Notes

*Technical decisions, lessons learned, and context for future sessions*

---

## Session 3: Moon Rendering Refinement (October 30, 2025)

**Focus:** Fixing moon visibility, scaling, and orbital positioning issues

### Key Accomplishments

✅ Fixed moon visibility around gas giants
✅ Implemented percentage-based moon sizing
✅ Established planet-size-dependent moon scaling
✅ Refined orbital distances for visual balance
✅ Added IDE close button
✅ Adjusted ambient lighting for star color visibility

### Critical Technical Decisions

#### 1. Moon Size Generation (moon-generator.ts)

**Problem:** All moons were hitting size caps, making them uniform.

**Solution:** Switched from mass-fraction-with-cube-root to direct percentage-based sizing with tiered ranges:

```typescript
// Small planets (<3 Earth radii): Can have large moons like Earth's Moon
tinyRange = [0.02, 0.08];   // 2-8%
smallRange = [0.08, 0.18];   // 8-18%
largeRange = [0.18, 0.30];   // 18-30% (Earth's Moon is 27%)

// Medium planets (3-10 Earth radii): Moderate moon sizes
tinyRange = [0.01, 0.05];   // 1-5%
smallRange = [0.05, 0.10];   // 5-10%
largeRange = [0.10, 0.15];   // 10-15%

// Large gas giants (>10 Earth radii): Small percentage like Jupiter's moons
tinyRange = [0.005, 0.015]; // 0.5-1.5%
smallRange = [0.015, 0.03]; // 1.5-3%
largeRange = [0.03, 0.05];  // 3-5% (like Jupiter's Ganymede at 3.8%)
```

**Rationale:** Real Jupiter has moons at 2-4% of its radius. Our previous approach was generating 60% moons on small planets due to backwards scaling.

#### 2. Moon Orbital Distances (MoonRenderer.ts)

**Problem:** Moons either too close (touching planets) or too scattered (hard to recognize as systems).

**Solution:** Settled on 1.3-2.5× planet visual radius after testing multiple ranges.

**Evolution:**
- Initial: 3-8× (too scattered)
- Attempt 1: 1.5-3.5× (still scattered)
- Attempt 2: 1.2-2.0× (too cramped)
- Attempt 3: 1.5-3.0× (close but scattered)
- Final: **1.3-2.5×** (balanced)

**Key insight:** Planet visual radius already includes 3× visibility scale, so only small multipliers are needed.

#### 3. Moon Rendering Scale Tiers (MoonRenderer.ts)

**Implementation:** Direct tier-based scaling in renderer to ensure visible size variation:

```typescript
if (planetVisualRadius > 5.0) {
  // Large gas giants: Create dramatic size variation
  if (moon.radius < 500) {
    moonScale = 0.01 + moonSizeFraction * 0.01; // 1-2% of planet
  } else if (moon.radius < 1500) {
    moonScale = 0.02 + moonSizeFraction * 0.02; // 2-4% of planet
  } else {
    moonScale = 0.04 + moonSizeFraction * 0.03; // 4-7% of planet
  }
}
```

**Result:** 7× size difference between smallest and largest moons (1% vs 7%).

#### 4. Other Adjustments

**Ambient Light:** Reduced from 0.15 to 0.05
- **Reason:** F-type stars were appearing white due to light washout
- **Note:** F-type stars ARE naturally pale yellow-white (6764K), this is astronomically correct

**MAX_MOON_ORBIT_KM:** Increased from 30,000 to 500,000
- **Reason:** Gas giants with 50,000+ km radii were having moons clamped inside their bodies
- **Context:** Earth's Moon orbits at 384,400 km

### Lessons Learned

1. **Don't use cube root scaling for moons** - It compounds badly with planet size variation
2. **Percentage-based sizing is more intuitive** - Easier to reason about and tune
3. **Visual radius includes scale factors** - Don't double-apply scaling multipliers
4. **Test at multiple scales** - What works for small planets may not work for gas giants
5. **Iteration is normal** - Moon systems required ~5 iterations to get right

### Known Issues / Future Work

**Moon Parameters May Need Adjustment:**
- Orbit distances (1.3-2.5×) are tuned for visual balance, not pure realism
- Size percentages optimized for current camera distances
- May need tweaking based on:
  - Actual gameplay (player ship navigation)
  - Different zoom levels
  - Procedural generation producing edge cases

**Recommendation:** Build debug/settings panel with sliders for:
- Moon orbit distance multiplier (0.5× - 3.0×)
- Moon size scale adjustment (0.5× - 2.0×)
- Visual testing without code edits

### Files Modified This Session

**Generation:**
- `src/generation/moon-generator.ts` - Percentage-based sizing with planet-size tiers
- `src/utils/constants.ts` - MAX_MOON_ORBIT_KM increased

**Rendering:**
- `src/rendering/MoonRenderer.ts` - Orbit distance calculation, tier-based rendering scale
- `src/components/Canvas/ThreeSceneManager.tsx` - Ambient light reduced

**UI:**
- `src/components/IDE/IDEPanel.tsx` - Close button added

### Code Patterns Established

**Moon Size Calculation Pattern:**
```typescript
// 1. Determine planet size tier
const planetRadiusKm = planet.radius * 6371;
let ranges = getTierRanges(planetRadiusKm); // <19000, 19000-64000, >64000

// 2. Roll for size category
const roll = rng.random();
const category = roll < 0.3 ? 'tiny' : roll < 0.7 ? 'small' : 'large';

// 3. Generate percentage in category range
const radiusPercent = rng.randomFloat(ranges[category][0], ranges[category][1]);

// 4. Calculate moon radius
let moonRadius = planetRadiusKm * radiusPercent;
```

**Moon Orbit Calculation Pattern:**
```typescript
// 1. Calculate parent planet's visual radius (match createMoonMesh exactly)
const planetVisualRadius = Math.max(
  (parentPlanet.radius / 109) * sceneUnitsPerSolarRadius * 3.0,
  2.0
);

// 2. Normalize moon's generated orbit distance to 0-1 fraction
const orbitFraction = (moon.orbitDistance - minOrbitKm) / (maxOrbitKm - minOrbitKm);

// 3. Map to visual multiplier range
const moonOrbitRadius = planetVisualRadius * (1.3 + orbitFraction * 1.2); // 1.3-2.5×
```

---

## Session 2: Generation Engine & Basic Rendering

**Focus:** Implementing procedural generation and rendering systems

### Key Accomplishments

✅ Star generation with spectral type distribution
✅ Planet generation with Titius-Bode spacing
✅ Moon generation with orbital mechanics
✅ Resource distribution by planet type
✅ Basic rendering of all celestial bodies
✅ Star-relative scaling system
✅ IDE panel with object inspection

### Critical Decisions

**Scaling System:**
- Star-relative: All sizes relative to star (40 scene units base)
- Planet visibility: 3× scale for visibility
- Orbit distance: AU × 50 for visual separation
- Moon orbits: Planet-relative (initially 3-8× planet radius)

**Generation Patterns:**
- Seeded RNG for determinism
- Probability distributions for realism
- Physics-based calculations (Kepler's laws)
- Resource pools by celestial body type

---

## Session 1: Foundation

**Focus:** Project setup, type system, scene initialization

### Key Accomplishments

✅ Vite + React + TypeScript project
✅ Three.js scene with OrbitControls
✅ Zustand state management
✅ Type definitions for all celestial bodies
✅ SeededRandom class with Mulberry32
✅ Physics constants and calculations
✅ UI shell with IDE panel

### Technical Choices

**Type System:** const objects with `as const` instead of enums
- **Reason:** erasableSyntaxOnly compatibility
- **Pattern:** `const SpectralType = { O: 'O', B: 'B', ... } as const;`

**State Management:** Zustand over Context API
- **Reason:** Simpler, better performance, no provider nesting
- **Pattern:** Single store with slices for system, IDE, scene state

**Scene Architecture:** Class-based ThreeSceneManager
- **Reason:** Encapsulation, lifecycle management, disposal cleanup
- **Pattern:** Constructor initializes, public methods expose API, private cleanup

---

## Next Session (4): LOD Optimization

**Target:** Implement 3-level LOD system for performance

**Key Tasks:**
1. Create `CelestialBodyLOD.ts` class
2. Replace planet/moon mesh creation with LOD instances
3. Add distance thresholds: 0 (high), 50 (medium), 200 (low)
4. Test LOD switching with camera movement
5. Profile with Stats.js

**Performance Targets:**
- 60fps with 8 planets + 20 moons
- <16.67ms frame time (95th percentile)
- <500MB memory usage
- Reduced draw calls at distance

**Reference:** CLAUDE.md Session 6-7 template

---

*For detailed planning and architecture, see PLANNING.md*
*For task tracking and milestones, see TASKS.md*
*For development workflow, see CLAUDE.md*
