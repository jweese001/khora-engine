# Star Shader Visual Fixes

**Date:** October 30, 2025
**Issue:** Star shader showing large black/bright spots and floating glow object

---

## Problems Identified

### 1. UV Coordinate Artifacts (Black Spots at Poles)
**Issue:** Using UV coordinates for radial gradient caused dark spots at sphere poles where UV coordinates converge.

**Root Cause:**
```glsl
// ❌ WRONG - UV coordinates have singularities at poles
vec2 center = vec2(0.5);
float distFromCenter = length(vUv - center);
```

**Fix:** Use 3D position vector instead of 2D UV coordinates
```glsl
// ✅ CORRECT - Use normalized 3D position
float distFromCenter = length(vPosition);
```

### 2. Noise Scale Too Large (Large Blotchy Patterns)
**Issue:** Noise multiplier too low (3.0) created large blotches instead of fine surface detail.

**Root Cause:**
```glsl
// ❌ WRONG - Creates large blobs
vec3 noisePos = vPosition * 3.0 + vec3(u_seed);
```

**Fix:** Increase noise frequency for finer detail
```glsl
// ✅ CORRECT - Finer surface texture
vec3 noisePos = normalize(vPosition) * 8.0 + vec3(u_seed * 0.1);
```

### 3. Noise Range Too Extreme (Black and Bright Spots)
**Issue:** Noise variation range 0.8-1.2 (40% variation) created visibly dark and bright regions.

**Root Cause:**
```glsl
// ❌ WRONG - Too much contrast
surfaceNoise = 0.8 + surfaceNoise * 0.4; // 0.8-1.2 range
```

**Fix:** Reduce to subtle variation
```glsl
// ✅ CORRECT - Subtle surface detail
surfaceNoise = 0.9 + surfaceNoise * 0.2; // 0.9-1.1 range (10% variation)
```

### 4. Floating Glow Object Inside Star
**Issue:** Old sprite-based glow still being added to scene, visible when camera inside star radius.

**Root Cause:**
```typescript
// ❌ WRONG - Creates separate glow sprite
const starObject = createStarObject(system.star, 1.0, true, true);
//                                                    ^^^^^ includeGlow=true
```

**Fix:** Use only shader mesh (bloom handles glow)
```typescript
// ✅ CORRECT - Shader handles bloom
const starMesh = createStarMesh(system.star, 1.0);
const starLights = createStarLight(system.star, 3.0);
```

---

## Files Changed

### 1. `src/shaders/star/star.frag`
- Changed radial gradient calculation from UV-based to position-based
- Increased noise frequency: 3.0 → 8.0
- Reduced noise variation range: 0.8-1.2 → 0.9-1.1
- Reduced activity influence: `u_activityLevel` → `u_activityLevel * 0.5`
- Adjusted power curve: 1.2 → 0.6 for smoother gradient
- Increased bloom boost: 1.5x → 2.0x

### 2. `src/components/Canvas/ThreeSceneManager.tsx`
- Changed from `createStarObject()` to `createStarMesh()` + `createStarLight()`
- Removed glow sprite (lines 385-387)
- Added star lights separately (lines 390-392)
- Removed unused `createStarObject` import

### 3. `src/shaders.d.ts` (NEW)
- Created TypeScript declarations for shader imports
- Allows importing .vert, .frag, .glsl files as strings

---

## Technical Details

### Radial Gradient Algorithm (Fixed)
```glsl
// Use 3D position distance from center
float distFromCenter = length(vPosition);

// Normalize to 0-1 (sphere radius = 1.0 in normalized space)
float radialGradient = 1.0 - clamp(distFromCenter, 0.0, 1.0);

// Gentle falloff curve (0.6 is subtle)
radialGradient = pow(radialGradient, 0.6);
```

**Result:** Smooth radial gradient, no pole artifacts

### Surface Noise (Fixed)
```glsl
// Normalize position to unit sphere, scale by 8.0 for fine detail
vec3 noisePos = normalize(vPosition) * 8.0 + vec3(u_seed * 0.1);

// Get 2-octave FBM noise
float surfaceNoise = fbm2(noisePos);

// Normalize to subtle range: 0.9-1.1 (10% variation)
surfaceNoise = surfaceNoise * 0.5 + 0.5;  // -1..1 → 0..1
surfaceNoise = 0.9 + surfaceNoise * 0.2;  // 0..1 → 0.9..1.1
```

**Result:** Fine surface texture, no large blotches

### Activity Level Influence (Fixed)
```glsl
// Reduce activity impact by 50%
float surface = mix(1.0, surfaceNoise, u_activityLevel * 0.5);
```

**Result:** Subtle turbulence, not overwhelming

---

## Expected Visual Results

**Before Fix:**
- Large black spot at pole
- Large bright spot opposite
- Chunky, blotchy surface texture
- Floating glow object inside star
- Doesn't read as "star-like"

**After Fix:**
- Smooth radial gradient (bright center, dim edges)
- Fine surface texture (subtle turbulence)
- No visible artifacts or poles
- Clean bloom glow around star
- Reads as luminous stellar surface

---

## Testing Instructions

1. Start dev server: `npm run dev`
2. Open browser: `http://localhost:5175/`
3. Generate system: `window.__KHORA_STORE__.getState().generateSystem(12345);`
4. **Visual checks:**
   - ✅ Star should have smooth radial gradient
   - ✅ Surface should show subtle texture (not large blobs)
   - ✅ No dark spots or singularities
   - ✅ Bloom glow around star (no floating sprite)
   - ✅ Maintains 60fps
5. **Zoom test:** Move camera inside star radius
   - ✅ Should NOT see floating glow object
   - ✅ Should see shader surface from inside

---

## Build Status

**✅ Build successful:** `npm run build`
- Bundle size: 753.62 KB (gzipped: 203.26 KB)
- No TypeScript errors
- No console warnings

---

## Next Steps

After confirming star shader looks correct:

1. Continue M5 Phase 2: **Rocky Planet Shader**
   - Implement terrain noise with elevation-based coloring
   - Add water at low elevations (if waterCoverage > 0.3)
   - Add atmosphere Fresnel glow

2. Gas Giant Shader
3. Barren Planet Shader
4. Visual testing and polish

---

*Star shader now foundation for all M5 procedural surface work!*
