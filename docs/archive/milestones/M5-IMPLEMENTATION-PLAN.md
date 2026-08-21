# M5 - Procedural Shaders Implementation Plan

**Milestone:** M5 - Shaders Complete
**Timeline:** Week 8-9 (2 weeks)
**Goal:** Create visually distinct, information-rich procedural shaders for all celestial body types

---

## Executive Summary

**Core Requirement:** Shaders must be efficient (60fps with 28 objects) while providing distinct visual identities that communicate gameplay-relevant information about resources and planet conditions.

**Success Criteria:**
- ✅ 4 visually distinct planet types at a glance
- ✅ Water/resources visually identifiable
- ✅ 60fps maintained with 8 planets + 20 moons
- ✅ Deterministic appearance (same seed = same look)
- ✅ Star bloom effect looks amazing

---

## Architecture Decisions

### 1. Separate Shaders Per Type (✅ APPROVED)
**Decision:** Create individual shaders for each planet type (no GPU conditionals)

**Rationale:**
- GPU branch divergence kills performance with many objects
- Each planet type has fundamentally different rendering logic
- Optimized per-type is better than unified with branches
- Code sharing via utility functions in common/noise.glsl

**Structure:**
```
src/shaders/
  common/
    noise.glsl          # Simplex3D, FBM functions
    planet.vert         # Shared vertex shader
  star/
    star.vert, star.frag
  rocky-planet/
    rocky-planet.frag
  gas-giant/
    gas-giant.frag
  barren/
    barren.frag
```

### 2. Shared Noise Functions via vite-plugin-glsl (✅ APPROVED)
**Decision:** Use `#include <common/noise.glsl>` for code sharing

**Installation:**
```bash
npm install -D vite-plugin-glsl
```

**vite.config.ts:**
```typescript
import glsl from 'vite-plugin-glsl';
export default defineConfig({
  plugins: [react(), glsl()]
});
```

**Usage in shaders:**
```glsl
#include <common/noise.glsl>

void main() {
  float noise = simplex3D(vPosition);
  float terrain = fbm(vPosition, 3); // 3 octaves
}
```

### 3. Manual Lighting in Shaders (✅ APPROVED)
**Decision:** Implement custom lighting, not Three.js built-in

**Rationale:**
- Full control over lighting behavior per planet type
- Rocky/Barren: Full Lambertian diffuse lighting
- GasGiant/IceGiant: Minimal directional, mostly ambient (self-glowing)
- Star: No lighting (emissive only)

**Implementation:**
```glsl
// Uniforms passed from scene
uniform vec3 u_starPosition;
uniform vec3 u_starColor;
uniform float u_starIntensity;

// Lighting calculation
vec3 lightDir = normalize(u_starPosition - vWorldPosition);
float diffuse = max(dot(vNormal, lightDir), 0.0);
vec3 lighting = diffuse * u_starColor * u_starIntensity;
vec3 ambient = vec3(0.05); // Scattered starlight
vec3 finalColor = baseColor * (lighting + ambient);
```

### 4. Post-Processing for Star Bloom (✅ APPROVED)
**Decision:** Use EffectComposer + UnrealBloomPass

**Implementation in ThreeSceneManager:**
```typescript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// After renderer creation:
this.composer = new EffectComposer(this.renderer);
const renderPass = new RenderPass(this.scene, this.camera);
this.composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold - only bright objects (stars) bloom
);
this.composer.addPass(bloomPass);

// In animate():
this.composer.render(); // Instead of this.renderer.render()
```

**Selective Bloom:**
- Stars output colors > 1.0 (emissive)
- Planets output colors < 1.0
- Bloom threshold at 0.85 = only stars bloom

### 5. Determinism via Position + Seed (✅ APPROVED)
**Decision:** Use world position + planet seed for noise determinism

**Implementation:**
```glsl
uniform float u_seed;  // Derived from planet ID/position

void main() {
  // Offset noise sampling by seed to ensure uniqueness
  vec3 noisePos = vWorldPosition + vec3(u_seed);
  float noise = simplex3D(noisePos);
}
```

**Testing:**
- Generate system with seed 12345
- Note all planet appearances
- Regenerate seed 12345 three times
- Verify identical appearance

---

## Shader Designs

### Star Shader

**Visual Goals:**
- Spectral color (O=blue, M=red, G=yellow)
- Surface activity (convection cells, prominences)
- Corona/bloom effect
- Radial gradient (brighter center)

**Uniforms:**
```glsl
uniform vec3 u_starColor;      // Spectral type color
uniform float u_temperature;    // Affects intensity
uniform float u_activityLevel;  // 0.0-1.0, surface turbulence
uniform float u_time;           // For animated surface
uniform float u_seed;           // Deterministic noise
```

**Technique:**
- Emissive material (no lighting)
- Radial gradient: `1.0 - length(uv - 0.5)`
- Simplex noise for surface turbulence
- Output colors > 1.0 for bloom effect
- Optional: Slow time-based animation

**Performance:** Very fast (no lighting, simple calculations)

---

### Rocky Planet Shader

**Visual Goals:**
- Terrain variation (continents, mountains, valleys)
- Water oceans (blue, if waterCoverage > 0.3)
- Atmosphere glow (Fresnel effect, if hasAtmosphere)
- Color variation based on composition
- Optional: Polar ice caps

**Uniforms:**
```glsl
uniform vec3 u_baseColor;         // Base rock/soil color
uniform float u_waterCoverage;    // 0.0-1.0
uniform float u_atmosphereDensity; // 0.0-1.0
uniform bool u_hasAtmosphere;
uniform float u_temperature;      // Affects ice caps, tinting
uniform float u_seed;
uniform vec3 u_starPosition;      // For lighting
uniform vec3 u_starColor;
uniform float u_starIntensity;
```

**Technique:**
```glsl
// Terrain height from 3D noise
float height = fbm(vWorldPosition + vec3(u_seed), 3);

// Height-based color zones
vec3 deepWater = vec3(0.0, 0.1, 0.3);   // Deep blue
vec3 shallowWater = vec3(0.0, 0.3, 0.5); // Lighter blue
vec3 lowland = u_baseColor * 0.8;        // Dark terrain
vec3 midland = u_baseColor;              // Base color
vec3 highland = u_baseColor * 1.2;       // Bright terrain
vec3 mountain = mix(u_baseColor, vec3(0.9), 0.5); // Snow peaks

// Water coverage determines sea level
float seaLevel = -0.5 + u_waterCoverage;
vec3 terrainColor;
if (height < seaLevel && u_waterCoverage > 0.3) {
  // Underwater
  float depth = (seaLevel - height) / 0.5;
  terrainColor = mix(shallowWater, deepWater, depth);
} else {
  // Land
  terrainColor = mix4(lowland, midland, highland, mountain, height);
}

// Atmosphere glow (Fresnel)
if (u_hasAtmosphere) {
  float fresnel = pow(1.0 - dot(vNormal, vViewDir), 3.0);
  vec3 atmosphereColor = vec3(0.5, 0.7, 1.0); // Sky blue
  terrainColor = mix(terrainColor, atmosphereColor,
                     fresnel * u_atmosphereDensity * 0.3);
}

// Apply lighting
vec3 finalColor = applyLighting(terrainColor, ...);
```

**Information Conveyed:**
- Blue oceans → Water resource, habitability
- Green/brown land → Organic materials, life potential
- White peaks → Cold regions, ice resources
- Atmosphere glow → Breathable air indicator
- Terrain roughness → Surface conditions

**Performance:** Moderate (3 octave FBM, one Fresnel calculation)

---

### Gas Giant Shader

**Visual Goals:**
- Horizontal band patterns (latitude-based)
- Turbulence at band boundaries
- Multiple colors per band
- Great Red Spot style storms (optional)
- Atmospheric depth

**Uniforms:**
```glsl
uniform vec3 u_bandColors[3];   // 3 primary band colors
uniform float u_bandCount;       // 4-12 visible bands
uniform float u_turbulence;      // 0.0-1.0, swirl intensity
uniform float u_stormPresence;   // 0.0-1.0
uniform float u_seed;
```

**Technique:**
```glsl
// Latitude-based bands
float latitude = vNormal.y; // -1 to +1
float bandIndex = sin(latitude * u_bandCount * 3.14159) * 0.5 + 0.5;

// Select band color
vec3 bandColor;
if (bandIndex < 0.33) {
  bandColor = mix(u_bandColors[0], u_bandColors[1], bandIndex * 3.0);
} else if (bandIndex < 0.66) {
  bandColor = mix(u_bandColors[1], u_bandColors[2], (bandIndex - 0.33) * 3.0);
} else {
  bandColor = u_bandColors[2];
}

// Add turbulence at band boundaries
float turbNoise = simplex3D(vWorldPosition * 5.0 + vec3(u_seed)) * u_turbulence;
bandColor = mix(bandColor, bandColor * 1.2, turbNoise * 0.5);

// Optional: Add storm system
if (u_stormPresence > 0.5) {
  float stormNoise = simplex3D(vWorldPosition * 2.0);
  if (stormNoise > 0.7) {
    bandColor = mix(bandColor, vec3(1.0, 0.3, 0.3), 0.5); // Red storm
  }
}

// Minimal lighting (self-luminous appearance)
vec3 lightDir = normalize(u_starPosition - vWorldPosition);
float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.3; // Very subtle
vec3 finalColor = bandColor * (0.8 + diffuse);
```

**Information Conveyed:**
- Band colors → Atmospheric composition (orange=methane, white=ammonia)
- Turbulence → Atmospheric activity, extraction challenges
- Storm systems → Dangerous zones
- Color saturation → Pressure, density

**Performance:** Fast (simple noise, no FBM needed)

---

### Barren Planet Shader

**Visual Goals:**
- Heavy cratering (ancient, dead surface)
- No atmosphere, no glow
- Dull, desaturated colors (gray/brown)
- Harsh shadows
- Dusty/regolith surface texture

**Uniforms:**
```glsl
uniform vec3 u_baseColor;      // Desaturated gray/brown
uniform float u_craterDensity; // 0.0-1.0
uniform float u_roughness;     // Surface texture scale
uniform float u_seed;
uniform vec3 u_starPosition;
uniform vec3 u_starColor;
uniform float u_starIntensity;
```

**Technique:**
```glsl
// Voronoi-based craters
vec2 craterPattern = voronoi2D(vWorldPosition.xz * 10.0 + u_seed);
float crater Depth = smoothstep(0.1, 0.3, craterPattern.x) * u_craterDensity;

// Regolith texture (high-frequency noise)
float regolith = simplex3D(vWorldPosition * 50.0 + vec3(u_seed)) * 0.1;

// Combine for final color
vec3 baseColor = u_baseColor * (0.9 - craterDepth * 0.3);
baseColor += regolith;

// Full Lambertian lighting (no atmosphere softening)
vec3 lightDir = normalize(u_starPosition - vWorldPosition);
float diffuse = max(dot(vNormal, lightDir), 0.0);
vec3 finalColor = baseColor * (diffuse * u_starColor * u_starIntensity + vec3(0.05));
```

**Information Conveyed:**
- Gray/brown monotone → Dead, no life
- Craters → Ancient, no geological activity
- No glow → Not breathable
- Rough texture → Surface mining might be easier
- Stark lighting → Harsh conditions

**Performance:** FAST (simplest shader, Barren planets render quickly)

---

## Performance Strategy

**Target:** 60fps with 8 planets + 20 moons = 28 shader instances

**Optimization Techniques:**
1. **LOD Geometry Reduction (ALREADY IMPLEMENTED)**
   - High LOD: 81,920 triangles, full shader complexity OK (few pixels affected at distance)
   - Medium LOD: 5,120 triangles
   - Low LOD: 320 triangles

2. **Noise Octave Limits**
   - Maximum 3 octaves for FBM
   - Most shaders use 2 octaves or simple noise
   - Barren shader uses minimal noise

3. **No Texture Lookups**
   - 100% procedural (no texture fetches)
   - GPU compute only

4. **Fragment Count is Key**
   - LOD already reduces fragments dramatically
   - Distant planets = few pixels = even complex shader is cheap

**Performance Budget Per Shader:**
- Star: 5-10 instructions (emissive only)
- Rocky: 30-50 instructions (FBM + Fresnel + lighting)
- Gas Giant: 15-25 instructions (bands + simple noise)
- Barren: 20-30 instructions (Voronoi + lighting)

**Fallback Plan:** If performance issues arise:
- Reduce LOD HIGH subdivision from 6 to 5
- Reduce noise octaves from 3 to 2
- Add UI toggle for "shader detail level"

---

## Implementation Order

### Week 8: Foundation + Rocky Planet

**Day 1-2: Setup**
1. Install `vite-plugin-glsl`
2. Configure vite.config.ts
3. Create shader directory structure
4. Implement common/noise.glsl (Simplex3D + FBM)
5. Create common/planet.vert

**Day 3-4: Star Shader**
6. Implement star shader (star.vert + star.frag)
7. Integrate EffectComposer + UnrealBloomPass
8. Refactor StarRenderer to use ShaderMaterial
9. Test star bloom effect

**Day 5-7: Rocky Planet**
10. Implement rocky-planet.frag
11. Create deriveShaderUniforms() function
12. Refactor PlanetRenderer for ShaderMaterial + type switching
13. Test rocky planet appearance and variations
14. Test determinism (same seed = same look)

### Week 9: Gas Giant + Barren + Polish

**Day 8-9: Gas Giant**
15. Implement gas-giant.frag
16. Test band patterns and turbulence
17. Tune colors based on composition data

**Day 10-11: Barren**
18. Implement barren.frag
19. Test crater patterns
20. Verify performance (should be fastest shader)

**Day 12-13: Integration & Testing**
21. Update MoonRenderer to reuse planet shaders
22. Performance testing (60fps verification)
23. Visual distinctiveness testing (user feedback)
24. Determinism testing (regenerate same seeds)

**Day 14: Polish & Documentation**
25. Visual tuning based on feedback
26. Document shader uniforms and decisions
27. Update TASKS.md
28. Git commit M5 complete

---

## Testing Checklist

### Visual Distinctiveness Test
- [ ] Generate 10 systems
- [ ] Verify Rocky ≠ GasGiant ≠ IceGiant ≠ Barren at first glance
- [ ] Take screenshots for comparison
- [ ] Get user feedback on clarity

### Information Density Test
- [ ] Can you identify water planets by blue oceans?
- [ ] Can you identify gas giants by band patterns?
- [ ] Can you identify barren worlds by craters?
- [ ] Are resources visually hinted at (water, ice, minerals)?

### Determinism Test
- [ ] Generate system seed 12345, note appearances
- [ ] Regenerate seed 12345 three times
- [ ] Verify planets look identical each time
- [ ] Test with 5 different seeds

### Performance Test
- [ ] Generate system with 8 planets
- [ ] Monitor FPS (target: 60fps constant)
- [ ] Check frame time in Chrome DevTools (<16.67ms)
- [ ] Test zoom in/out (no stuttering)
- [ ] Generate 3 more systems, verify consistent performance

### Bloom Selectivity Test
- [ ] Verify star glows beautifully
- [ ] Verify planets do NOT bloom
- [ ] Check threshold effectiveness (0.85)
- [ ] Test with different star types (O, G, M)

---

## Data Pipeline: Planet to Uniforms

**Challenge:** Convert Planet data to shader-ready uniforms

**Solution:** Create `deriveShaderUniforms()` function in PlanetRenderer:

```typescript
function deriveShaderUniforms(planet: Planet, star: Star): ShaderUniforms {
  const uniforms: ShaderUniforms = {};

  // Common uniforms
  uniforms.u_seed = { value: hashPosition(planet.position) };
  uniforms.u_starPosition = { value: star.position };
  uniforms.u_starColor = { value: new THREE.Color(star.color) };
  uniforms.u_starIntensity = { value: star.luminosity };

  // Type-specific uniforms
  switch (planet.type) {
    case 'Rocky':
      uniforms.u_baseColor = { value: deriveRockyColor(planet.composition) };
      uniforms.u_waterCoverage = { value: planet.waterCoverage || 0.0 };
      uniforms.u_atmosphereDensity = { value: planet.atmosphereDensity || 0.0 };
      uniforms.u_hasAtmosphere = { value: planet.hasAtmosphere };
      uniforms.u_temperature = { value: planet.temperature };
      break;

    case 'GasGiant':
      uniforms.u_bandColors = { value: deriveGasGiantBandColors(planet.composition) };
      uniforms.u_bandCount = { value: randomInt(4, 12, planet.seed) };
      uniforms.u_turbulence = { value: Math.min(planet.mass / 10.0, 1.0) };
      uniforms.u_stormPresence = { value: randomFloat(0, 1, planet.seed) };
      break;

    case 'Barren':
      uniforms.u_baseColor = { value: new THREE.Color(0.4, 0.35, 0.3) }; // Gray-brown
      uniforms.u_craterDensity = { value: 0.7 + randomFloat(0, 0.3, planet.seed) };
      uniforms.u_roughness = { value: 0.9 };
      break;
  }

  return uniforms;
}

function deriveRockyColor(composition: Composition): THREE.Color {
  // Iron-rich → Reddish
  // Silicon-rich → Gray
  // Carbon-rich → Dark brown
  // Mix based on composition percentages
}

function deriveGasGiantBandColors(composition: Composition): THREE.Color[] {
  // Hydrogen-dominant → White, yellow, red (Jupiter-like)
  // Methane-rich → Blue, green (warmer Uranus-like)
  // Ammonia-rich → Pale yellow, white
}
```

---

## Risk Mitigation

### Risk 1: Performance Tank
**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- LOD already implemented (main optimization)
- Keep shaders simple (2-3 octaves max)
- Profile early with Chrome DevTools
- Test with 8+ planets from day 1

**Fallback:**
- Reduce LOD HIGH from subdivision 6 to 5
- Add UI shader complexity toggle

### Risk 2: Poor Visual Quality
**Likelihood:** Low
**Impact:** High
**Mitigation:**
- Reference real astronomical imagery
- Iterative design with user feedback
- Tunable shader parameters (not hardcoded values)

**Fallback:**
- Provide "visual detail" slider in UI
- Keep current MeshStandardMaterial as fallback mode

### Risk 3: Determinism Breaks
**Likelihood:** Low
**Impact:** CRITICAL
**Mitigation:**
- Use world position + seed (no random() in shaders)
- Test thoroughly with repeated generation
- Add determinism validation test suite

**Fallback:**
- This MUST work - no fallback acceptable
- Debug until fixed

### Risk 4: Bloom Affects Wrong Objects
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Careful threshold tuning (0.85)
- Stars output > 1.0, planets < 1.0
- Test selective bloom early

**Fallback:**
- Use Three.js layers for render separation
- Two render passes (one with bloom, one without)

### Risk 5: Shader Compilation Errors
**Likelihood:** Medium
**Impact:** High (blocks implementation)
**Mitigation:**
- Start with minimal shaders
- Add complexity incrementally
- Test each shader in isolation
- Check console for GLSL errors

**Fallback:**
- Keep MeshStandardMaterial working
- Graceful degradation per-shader

---

## Success Metrics

**Quantitative:**
- ✅ 60fps maintained with 8 planets + 20 moons
- ✅ Frame time < 16.67ms (95th percentile)
- ✅ GPU utilization < 80%
- ✅ No shader compilation errors
- ✅ 100% determinism (5/5 tests pass)

**Qualitative:**
- ✅ User can identify planet type at a glance (< 1 second)
- ✅ Water planets are obvious (blue oceans visible)
- ✅ Gas giants look impressive (band patterns clear)
- ✅ Barren planets look dead (no confusion with Rocky)
- ✅ Star bloom effect is beautiful
- ✅ Overall visual quality increase vs current MeshStandardMaterial

---

## Future Enhancements (Post-M5)

**Nice-to-have features deferred to polish phase:**
- Ice giant shader (can use gas giant with cool colors interim)
- Animated star surface (time uniform)
- Dynamic cloud layers on rocky planets
- Storm animations on gas giants
- Polar ice caps on habitable zone planets
- Advanced atmosphere scattering
- Shader LOD complexity adjustment
- Normal mapping for enhanced detail
- Specular highlights on water
- Night-side city lights (far future)

**These are NOT required for M5 completion.**

---

## Resources

**Simplex Noise Implementation:**
- Stefan Gustavson's GLSL implementation (MIT license)
- https://github.com/ashima/webgl-noise

**Three.js Post-Processing:**
- Three.js examples: https://threejs.org/examples/#webgl_postprocessing_unreal_bloom

**Visual References:**
- NASA JPL Solar System images
- Hubble Space Telescope exoplanet observations
- SpaceEngine procedural generation
- Elite Dangerous planet rendering

**Performance Profiling:**
- Chrome DevTools → Performance tab
- Three.js Stats.js for FPS monitoring
- renderer.info.render.calls for draw calls

---

*Generated from ultrathink analysis - October 30, 2025*
*Ready for implementation: M5 - Procedural Shaders*
