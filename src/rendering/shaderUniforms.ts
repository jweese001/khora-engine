/**
 * Khora Engine - Shader Uniforms Helper
 *
 * Converts Planet/Star data to Three.js shader uniforms.
 * Ensures consistent shader inputs across different celestial body types.
 */

import * as THREE from 'three';
import type { Planet, Star, Moon } from '../types/celestial-bodies';
import { PlanetType } from '../types/celestial-bodies';
import { SeededRandom } from '../utils/random';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Unified shader uniforms for all planet types
 * Supports Rocky/Barren (mode 0), Gas Giant (mode 1), Ice Giant (mode 2)
 */
export interface PlanetUniforms {
  // Core
  u_time: { value: number };
  u_lightPosition: { value: THREE.Vector3 };
  u_cameraPosition: { value: THREE.Vector3 };
  u_planetMode: { value: number };  // 0=Rocky, 1=Gas, 2=Ice
  u_debugMode: { value: number };   // 0=normal, 1=diffuse, 2=normals, etc.

  // Terrain (Rocky mode)
  u_terrainScale: { value: number };
  u_terrainRoughness: { value: number };
  u_craterDensity: { value: number };
  u_continentSize: { value: number };
  u_biomeVariation: { value: number };
  u_baseColor: { value: THREE.Vector3 };
  u_mountainColor: { value: THREE.Vector3 };
  u_lowlandColor: { value: THREE.Vector3 };
  u_desertColor: { value: THREE.Vector3 };

  // Water
  u_waterCoverage: { value: number };
  u_waterSpeed: { value: number };
  u_waterColor: { value: THREE.Vector3 };

  // Ice Caps
  u_iceSize: { value: number };
  u_iceRoughness: { value: number };
  u_iceColor: { value: THREE.Vector3 };

  // Atmosphere
  u_atmosphereDensity: { value: number };
  u_atmosphereColor: { value: THREE.Vector3 };

  // Clouds
  u_cloudCoverage: { value: number };
  u_cloudSpeed: { value: number };
  u_cloudNoiseType: { value: number };
  u_cloudDepth: { value: number };
  u_cloudShadow: { value: number };
  u_cloudColor: { value: THREE.Vector3 };

  // Gas Giant (modes 1 and 2)
  u_bandCount: { value: number };
  u_turbulence: { value: number };
  u_bandSpeed: { value: number };
  u_stormIntensity: { value: number };
  u_stormColor: { value: THREE.Vector3 };
}

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use PlanetUniforms instead
 */
export type RockyPlanetUniforms = PlanetUniforms;

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use PlanetUniforms instead
 */
export type GasGiantUniforms = PlanetUniforms;

/**
 * Shader uniforms for temperature-based star rendering
 * Uses blackbody radiation for realistic color calculation
 */
export interface StarUniforms {
  // Temperature-based rendering
  u_highTemp: { value: number };      // High temperature in Kelvin (bright regions)
  u_lowTemp: { value: number };       // Low temperature in Kelvin (dark regions/sunspots)
  u_scale: { value: number };         // Noise scale
  u_time: { value: number };          // Animation time

  // Sunspot parameters
  u_sunspotFreq: { value: number };   // Sunspot frequency (size)
  u_sunspotIntensity: { value: number }; // Sunspot darkness intensity

  // Limb darkening
  u_limbDarkeningPower: { value: number }; // How dark edges get
  u_centerBrightness: { value: number };   // Center brightness multiplier
}

/**
 * Shader uniforms for moons
 * Reuses rocky planet shader but with no water/atmosphere
 */
export interface MoonUniforms {
  u_baseColor: { value: THREE.Vector3 };
  u_waterCoverage: { value: number };       // Always 0.0 for moons
  u_atmosphereDensity: { value: number };   // Always 0.0 for moons
  u_atmosphereColor: { value: THREE.Vector3 };
  u_seed: { value: number };
  u_hasAtmosphere: { value: boolean };      // Always false for moons
  u_cameraPosition: { value: THREE.Vector3 };
}

// ============================================================================
// Color Schemes by Planet Type
// ============================================================================

/**
 * Get base terrain color for rocky/barren planets
 */
function getTerrainColor(planet: Planet, rng: SeededRandom): THREE.Vector3 {
  switch (planet.type) {
    case PlanetType.Rocky:
      // Brownish terrain (Earth-like or Mars-like)
      return new THREE.Vector3(0.545, 0.451, 0.333); // RGB(139, 115, 85) = #8B7355
    case PlanetType.Barren:
      // Gray rocky surface
      return new THREE.Vector3(0.412, 0.412, 0.412); // RGB(105, 105, 105) = #696969
    case PlanetType.GasGiant: {
      // Gas giants: Warm tones (Jupiter, Saturn-like)
      // Varied oranges, browns, creams, tans
      const gasHue = rng.random() * 0.15; // 0.0-0.15 (orange to yellow range)
      const gasSat = 0.4 + rng.random() * 0.4; // 0.4-0.8 saturation
      const gasBright = 0.3 + rng.random() * 0.2; // 0.3-0.5 brightness
      const rgb = hslToRgb(gasHue, gasSat, gasBright);
      // Clamp to 0.69 max per channel to prevent white blowout when shader multiplies by 1.3
      return new THREE.Vector3(
        Math.min(rgb.x, 0.69),
        Math.min(rgb.y, 0.69),
        Math.min(rgb.z, 0.69)
      );
    }
    case PlanetType.IceGiant: {
      // Ice giants: Cool tones (Uranus, Neptune-like)
      // Varied blues, cyans, teals
      const iceHue = 0.5 + rng.random() * 0.15; // 0.5-0.65 (cyan to blue range)
      const iceSat = 0.5 + rng.random() * 0.3; // 0.5-0.8 saturation
      const iceBright = 0.35 + rng.random() * 0.2; // 0.35-0.55 brightness
      const rgb = hslToRgb(iceHue, iceSat, iceBright);
      // Clamp to 0.69 max per channel to prevent white blowout when shader multiplies by 1.3
      return new THREE.Vector3(
        Math.min(rgb.x, 0.69),
        Math.min(rgb.y, 0.69),
        Math.min(rgb.z, 0.69)
      );
    }
    default:
      // Fallback gray
      return new THREE.Vector3(0.5, 0.5, 0.5);
  }
}

/**
 * Convert HSL to RGB (helper for varied color generation)
 */
function hslToRgb(h: number, s: number, l: number): THREE.Vector3 {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return new THREE.Vector3(r, g, b);
}

/**
 * Get atmosphere color based on composition
 */
function getAtmosphereColor(planet: Planet): THREE.Vector3 {
  if (!planet.atmosphere.present) {
    return new THREE.Vector3(0, 0, 0);
  }

  const comp = planet.atmosphere.composition;

  // Breathable (Earth-like): blue
  if (planet.atmosphere.breathable) {
    return new THREE.Vector3(0.529, 0.808, 0.922); // Sky blue #87CEEB
  }

  // Mostly CO2 (Mars/Venus-like): yellowish/tan
  if (comp.carbonDioxide && comp.carbonDioxide > 0.7) {
    return new THREE.Vector3(0.867, 0.753, 0.518); // Tan #DDC084
  }

  // Mostly methane (Titan-like): orange
  if (comp.methane && comp.methane > 0.5) {
    return new THREE.Vector3(1.0, 0.647, 0.0); // Orange #FFA500
  }

  // Default: pale blue
  return new THREE.Vector3(0.7, 0.8, 0.9);
}

/**
 * Get band colors for gas giants
 */
// Not currently used but kept for potential future Phase 3 architect mode presets
// @ts-expect-error - Kept for future use
function _getGasGiantBandColors(planet: Planet): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
  const comp = planet.atmosphere.composition;

  if (planet.type === PlanetType.IceGiant) {
    // Ice giants (Uranus/Neptune): blue/cyan tones
    return [
      new THREE.Vector3(0.4, 0.6, 0.9),   // Light blue
      new THREE.Vector3(0.2, 0.4, 0.7),   // Medium blue
      new THREE.Vector3(0.6, 0.8, 1.0),   // Pale cyan
    ];
  }

  // Gas giants (Jupiter/Saturn): warm tones with strong contrast, darker overall
  if (comp.hydrogen && comp.hydrogen > 0.7) {
    // Jupiter-like: orange/brown/cream - darker for more realistic appearance
    return [
      new THREE.Vector3(0.65, 0.35, 0.12),  // Deep orange (darker)
      new THREE.Vector3(0.40, 0.25, 0.15),  // Dark brown (darker)
      new THREE.Vector3(0.70, 0.55, 0.40),  // Light tan (darker)
    ];
  }

  // Default gas giant: neutral tones with contrast, darker
  return [
    new THREE.Vector3(0.60, 0.48, 0.32),  // Medium tan (darker)
    new THREE.Vector3(0.38, 0.30, 0.22),  // Dark brown (darker)
    new THREE.Vector3(0.68, 0.55, 0.38),  // Light tan (darker)
  ];
}

/**
 * Get base terrain color for moons based on parent planet and temperature
 *
 * @param moon - Moon data
 * @param parentPlanet - Parent planet
 * @returns Base color for moon terrain
 */
function getMoonBaseColor(moon: Moon, parentPlanet: Planet): THREE.Vector3 {
  // Moons of gas/ice giants tend to be icy
  if (parentPlanet.type === PlanetType.GasGiant || parentPlanet.type === PlanetType.IceGiant) {
    if (moon.surfaceTemperature < 150) {
      // Very cold icy moon (Enceladus, Europa-like): lighter blue-gray
      return new THREE.Vector3(0.55, 0.60, 0.65); // Light blue-gray
    } else {
      // Warmer icy moon: darker gray with slight blue tint
      return new THREE.Vector3(0.48, 0.50, 0.53); // Cool gray
    }
  }

  // Moons of rocky planets are rocky/gray
  if (moon.surfaceTemperature > 300) {
    // Warm rocky moon (Io-like): brownish
    return new THREE.Vector3(0.54, 0.45, 0.33); // Brown (like rocky planets)
  } else {
    // Cold rocky moon (Luna-like): dark gray
    return new THREE.Vector3(0.38, 0.38, 0.38); // Dark gray
  }
}

// ============================================================================
// Uniform Generation Functions
// ============================================================================

/**
 * Generate comprehensive shader uniforms for all planet types
 * Intelligently maps planet properties to shader parameters based on:
 * - Planet type (Rocky/Barren/GasGiant/IceGiant)
 * - Habitable zone position
 * - Planet size and mass
 * - Atmosphere composition
 * - Surface temperature
 *
 * @param planet - Planet data
 * @param habitableZone - Star's habitable zone (for determining if planet is in HZ)
 * @param camera - Camera for view-dependent effects
 * @returns Complete uniforms object for unified planet shader
 */
export function derivePlanetUniforms(
  planet: Planet,
  habitableZone: { inner: number; outer: number },
  camera: THREE.Camera,
  starPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): PlanetUniforms {
  // Generate seed from planet ID for deterministic noise
  const seed = hashString(planet.id);
  const rng = new SeededRandom(seed);

  // Determine planet mode based on type
  let planetMode = 0; // Default: Rocky
  if (planet.type === PlanetType.GasGiant) {
    planetMode = 1;
  } else if (planet.type === PlanetType.IceGiant) {
    planetMode = 2;
  }

  // Check if planet is in habitable zone
  const inHabitableZone = planet.orbitDistance >= habitableZone.inner &&
                           planet.orbitDistance <= habitableZone.outer;

  // ========================================================================
  // Terrain Parameters (Rocky/Barren mode)
  // ========================================================================

  let terrainScale = 3.0;
  let terrainRoughness = 0.5;
  let craterDensity = 0.0;
  let continentSize = 0.5;
  let biomeVariation = 0.0;

  if (planetMode === 0) { // Rocky/Barren
    // Barren planets are rougher and more cratered
    if (planet.type === PlanetType.Barren) {
      terrainScale = 4.5;
      terrainRoughness = 0.7;
      craterDensity = 0.6; // Heavy cratering
      continentSize = 0.8;  // Large continuous landmasses
      biomeVariation = 0.1; // Low variation (mostly similar terrain)
    }
    // Rocky planets in habitable zone have diverse biomes
    else if (inHabitableZone) {
      terrainScale = 3.0;
      terrainRoughness = 0.5;
      craterDensity = 0.0; // Little to no cratering (geologically active)
      continentSize = 0.5;  // Balanced land/water
      biomeVariation = 0.7; // High biome variation
    }
    // Rocky planets outside habitable zone
    else {
      terrainScale = 4.0;
      terrainRoughness = 0.6;
      craterDensity = 0.2; // Some cratering
      continentSize = 0.7;  // More land
      biomeVariation = 0.4; // Moderate variation
    }
  }

  // ========================================================================
  // Colors
  // ========================================================================

  const baseColor = getTerrainColor(planet, rng);
  const atmosphereColor = getAtmosphereColor(planet);
  // Band colors not used in unified shader (gas giants use their own color logic)

  // Mountain/lowland/desert colors for biomes
  let mountainColor = new THREE.Vector3(0.55, 0.45, 0.33); // Brown
  let lowlandColor = new THREE.Vector3(0.29, 0.49, 0.35);  // Green
  let desertColor = new THREE.Vector3(0.76, 0.60, 0.42);   // Tan

  if (planet.type === PlanetType.Barren) {
    // All similar gray/brown tones for barren
    mountainColor = new THREE.Vector3(0.60, 0.50, 0.40);
    lowlandColor = new THREE.Vector3(0.55, 0.45, 0.35);
    desertColor = new THREE.Vector3(0.55, 0.45, 0.35);
  }

  // ========================================================================
  // Water Parameters
  // ========================================================================

  let waterCoverage = planet.waterCoverage;
  let waterSpeed = 0.3;
  const waterColor = new THREE.Vector3(0.12, 0.35, 0.52); // Deep blue

  // Adjust water parameters based on zone
  if (inHabitableZone && planet.type === PlanetType.Rocky) {
    // Habitable zone: more water, active hydrological cycle
    waterSpeed = 0.3;
  } else if (planet.type === PlanetType.Barren) {
    // Barren: no water
    waterCoverage = 0.0;
    waterSpeed = 0.0;
  }

  // ========================================================================
  // Ice Caps
  // ========================================================================

  let iceSize = 0.0;
  let iceRoughness = 0.3;
  const iceColor = new THREE.Vector3(0.91, 0.96, 0.97); // White

  if (planet.type === PlanetType.Rocky && waterCoverage > 0.0) {
    // Ice caps based on temperature
    if (planet.surfaceTemperature < 250) {
      iceSize = 0.4; // Large ice caps (cold planet)
    } else if (planet.surfaceTemperature < 273) {
      iceSize = 0.3; // Medium ice caps
    } else if (inHabitableZone) {
      iceSize = 0.25; // Small polar ice caps (Earth-like)
    }
  }

  // ========================================================================
  // Atmosphere Parameters
  // ========================================================================

  let atmosphereDensity = planet.atmosphere.present ? planet.atmosphere.density : 0.0;

  // Gas/ice giants always have thick atmospheres (0.15 for subtle rim light)
  if (planetMode === 1 || planetMode === 2) {
    atmosphereDensity = 0.15;
  }

  // ========================================================================
  // Cloud Parameters
  // ========================================================================

  let cloudCoverage = 0.0;
  let cloudSpeed = 0.15;
  let cloudNoiseType = 1.0; // Fluffy cumulus by default
  let cloudDepth = 0.6;
  let cloudShadow = 0.4;
  const cloudColor = new THREE.Vector3(1.0, 1.0, 1.0); // White

  if (planet.type === PlanetType.Rocky && inHabitableZone && waterCoverage > 0.3) {
    // Habitable planets with water have clouds
    cloudCoverage = 0.55;
    cloudSpeed = 0.15;
    cloudNoiseType = 1.0; // Fluffy cumulus
    cloudDepth = 0.6;
    cloudShadow = 0.4;
  } else if (planet.type === PlanetType.Rocky && atmosphereDensity > 0.3) {
    // Thin atmosphere: some clouds
    cloudCoverage = 0.2;
    cloudSpeed = 0.1;
    cloudNoiseType = 0.0; // Smooth cirrus
    cloudDepth = 0.3;
    cloudShadow = 0.2;
  }
  // Gas/ice giants don't use cloud layer (atmosphere is the visible surface)

  // ========================================================================
  // Gas Giant Band Parameters
  // ========================================================================

  let bandCount = 0.0;
  let turbulence = 0.0;
  let bandSpeed = 0.0;
  let stormIntensity = 0.0;
  let stormColor = new THREE.Vector3(0.5, 0.5, 0.5);

  if (planetMode === 1) {
    // Gas Giant - More varied appearance
    // Band count: 10-18 (visually interesting range, user can override 0-24 in Controls)
    bandCount = 10 + Math.floor(rng.random() * 8);
    // Turbulence: 0.5-0.8 (visible variation, user can override 0-1 in Controls)
    turbulence = 0.5 + rng.random() * 0.3;
    // Band speed: 0.05-0.15 (wider range)
    bandSpeed = 0.05 + rng.random() * 0.1;
    // Storm intensity: 0.3-0.6 (balanced range, user can override 0-1 in Controls)
    stormIntensity = 0.3 + rng.random() * 0.3;

    // Storm color: More varied reddish/orange/yellow for gas giants
    const stormVariation = rng.random();
    if (stormVariation < 0.33) {
      // Red spots (Jupiter-like)
      stormColor = new THREE.Vector3(
        0.7 + rng.random() * 0.25,  // 0.7-0.95 red
        0.25 + rng.random() * 0.25, // 0.25-0.5 green
        0.15 + rng.random() * 0.15  // 0.15-0.3 blue
      );
    } else if (stormVariation < 0.66) {
      // Orange/amber spots
      stormColor = new THREE.Vector3(
        0.8 + rng.random() * 0.15,  // 0.8-0.95 red
        0.5 + rng.random() * 0.2,   // 0.5-0.7 green
        0.2 + rng.random() * 0.2    // 0.2-0.4 blue
      );
    } else {
      // Cream/pale yellow spots
      stormColor = new THREE.Vector3(
        0.85 + rng.random() * 0.1,  // 0.85-0.95 red
        0.7 + rng.random() * 0.15,  // 0.7-0.85 green
        0.4 + rng.random() * 0.2    // 0.4-0.6 blue
      );
    }
  } else if (planetMode === 2) {
    // Ice Giant - More varied appearance
    // Band count: 6-12 (smoother appearance than gas giants, user can override 0-24 in Controls)
    bandCount = 6 + Math.floor(rng.random() * 6);
    // Turbulence: 0.25-0.5 (subtler than gas giants, user can override 0-1 in Controls)
    turbulence = 0.25 + rng.random() * 0.25;
    // Band speed: 0.03-0.08 (slower, smoother motion)
    bandSpeed = 0.03 + rng.random() * 0.05;
    // Storm intensity: 0.2-0.5 (balanced range, user can override 0-1 in Controls)
    stormIntensity = 0.2 + rng.random() * 0.3;

    // Storm color: More varied dark blues/teals for ice giants
    const stormVariation = rng.random();
    if (stormVariation < 0.33) {
      // Very dark blue (Neptune-like Great Dark Spot)
      stormColor = new THREE.Vector3(
        0.05 + rng.random() * 0.1,  // 0.05-0.15 red (very dark)
        0.1 + rng.random() * 0.15,  // 0.1-0.25 green
        0.2 + rng.random() * 0.25   // 0.2-0.45 blue
      );
    } else if (stormVariation < 0.66) {
      // Teal/cyan dark spots
      stormColor = new THREE.Vector3(
        0.1 + rng.random() * 0.15,  // 0.1-0.25 red
        0.25 + rng.random() * 0.2,  // 0.25-0.45 green
        0.35 + rng.random() * 0.25  // 0.35-0.6 blue
      );
    } else {
      // Gray-blue spots
      stormColor = new THREE.Vector3(
        0.15 + rng.random() * 0.15, // 0.15-0.3 red
        0.2 + rng.random() * 0.2,   // 0.2-0.4 green
        0.3 + rng.random() * 0.2    // 0.3-0.5 blue
      );
    }
  }

  // ========================================================================
  // Assemble Final Uniforms
  // ========================================================================

  return {
    // Core
    u_time: { value: 0.0 },
    u_lightPosition: { value: starPosition.clone() },
    u_cameraPosition: { value: camera.position.clone() },
    u_planetMode: { value: planetMode },
    u_debugMode: { value: 0 }, // 0=normal rendering, >0=debug visualizations

    // Terrain
    u_terrainScale: { value: terrainScale },
    u_terrainRoughness: { value: terrainRoughness },
    u_craterDensity: { value: craterDensity },
    u_continentSize: { value: continentSize },
    u_biomeVariation: { value: biomeVariation },
    u_baseColor: { value: baseColor },
    u_mountainColor: { value: mountainColor },
    u_lowlandColor: { value: lowlandColor },
    u_desertColor: { value: desertColor },

    // Water
    u_waterCoverage: { value: waterCoverage },
    u_waterSpeed: { value: waterSpeed },
    u_waterColor: { value: waterColor },

    // Ice Caps
    u_iceSize: { value: iceSize },
    u_iceRoughness: { value: iceRoughness },
    u_iceColor: { value: iceColor },

    // Atmosphere
    u_atmosphereDensity: { value: atmosphereDensity },
    u_atmosphereColor: { value: atmosphereColor },

    // Clouds
    u_cloudCoverage: { value: cloudCoverage },
    u_cloudSpeed: { value: cloudSpeed },
    u_cloudNoiseType: { value: cloudNoiseType },
    u_cloudDepth: { value: cloudDepth },
    u_cloudShadow: { value: cloudShadow },
    u_cloudColor: { value: cloudColor },

    // Gas Giant
    u_bandCount: { value: bandCount },
    u_turbulence: { value: turbulence },
    u_bandSpeed: { value: bandSpeed },
    u_stormIntensity: { value: stormIntensity },
    u_stormColor: { value: stormColor },
  };
}

/**
 * Generate shader uniforms for rocky/barren planets
 * @deprecated Use derivePlanetUniforms instead
 *
 * @param planet - Planet data
 * @param camera - Camera for view-dependent effects
 * @returns Uniforms object for rocky planet shader
 */
export function deriveRockyPlanetUniforms(
  planet: Planet,
  camera: THREE.Camera
): RockyPlanetUniforms {
  // This function is deprecated - use derivePlanetUniforms instead
  return derivePlanetUniforms(planet, { inner: 0, outer: 0 }, camera);
}

/**
 * Generate shader uniforms for gas giants and ice giants
 *
 * @param planet - Planet data
 * @returns Uniforms object for gas giant shader
 */
export function deriveGasGiantUniforms(planet: Planet): GasGiantUniforms {
  // This function is deprecated - use derivePlanetUniforms instead
  return derivePlanetUniforms(planet, { inner: 0, outer: 0 }, new THREE.PerspectiveCamera());
}

/**
 * Generate shader uniforms for moons
 *
 * Moons use the rocky planet shader but with no water or atmosphere.
 * Color is determined by parent planet type and surface temperature.
 *
 * @param moon - Moon data
 * @param parentPlanet - Parent planet
 * @param camera - Camera for view-dependent effects
 * @returns Uniforms object for moon shader (uses rocky planet shader)
 */
export function deriveMoonUniforms(
  moon: Moon,
  parentPlanet: Planet,
  camera: THREE.Camera
): MoonUniforms {
  const baseColor = getMoonBaseColor(moon, parentPlanet);

  // Generate seed from moon ID for deterministic noise
  const seed = hashString(moon.id);

  return {
    u_baseColor: { value: baseColor },
    u_waterCoverage: { value: 0.0 },           // Moons have no water
    u_atmosphereDensity: { value: 0.0 },       // Moons have no atmosphere
    u_atmosphereColor: { value: new THREE.Vector3(0, 0, 0) },
    u_seed: { value: seed },
    u_hasAtmosphere: { value: false },
    u_cameraPosition: { value: camera.position },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate shader uniforms for temperature-based star rendering
 *
 * Maps spectral types to appropriate temperature ranges for blackbody radiation.
 * Based on unified demo preset data.
 *
 * @param star - Star data
 * @param camera - Camera (no longer needed but kept for compatibility)
 * @returns Uniforms object for temperature-based star shader
 */
export function deriveStarUniforms(
  star: Star,
  _camera: THREE.Camera
): StarUniforms {
  // Generate seed from star ID for deterministic variation
  const seed = hashString(star.id);
  const rng = new SeededRandom(seed);

  // Temperature ranges by spectral type (in Kelvin)
  // Based on unified demo presets for Main Sequence stars
  const temperatureRanges = {
    'O': { high: 45000, low: 35000 },      // Blue
    'B': { high: 25000, low: 18000 },      // Blue-White
    'A': { high: 9500, low: 7800 },        // White
    'F': { high: 7200, low: 6200 },        // Yellow-White
    'G': { high: 6000, low: 5200 },        // Yellow (Sun-like)
    'K': { high: 5000, low: 3900 },        // Orange
    'M': { high: 3500, low: 2500 },        // Red
  };

  const temps = temperatureRanges[star.spectralType] || temperatureRanges['G'];

  // Noise scale by spectral type (from unified demo presets)
  const scaleRanges = {
    'O': { min: 0.48, max: 0.52 },   // 0.5
    'B': { min: 0.43, max: 0.47 },   // 0.45
    'A': { min: 0.40, max: 0.44 },   // 0.42
    'F': { min: 0.38, max: 0.42 },   // 0.40
    'G': { min: 0.38, max: 0.42 },   // 0.40
    'K': { min: 0.36, max: 0.40 },   // 0.38
    'M': { min: 0.33, max: 0.37 },   // 0.35
  };

  const scaleRange = scaleRanges[star.spectralType] || scaleRanges['G'];
  const scale = rng.randomFloat(scaleRange.min, scaleRange.max);

  // Sunspot frequency by spectral type (from unified demo presets)
  const sunspotFreqRanges = {
    'O': { min: 5.5, max: 6.5 },     // 6.0
    'B': { min: 5.0, max: 6.0 },     // 5.5
    'A': { min: 4.5, max: 5.5 },     // 5.0
    'F': { min: 4.0, max: 5.0 },     // 4.5
    'G': { min: 3.5, max: 4.5 },     // 4.0
    'K': { min: 3.0, max: 4.0 },     // 3.5
    'M': { min: 2.5, max: 3.5 },     // 3.0
  };

  const sunspotFreqRange = sunspotFreqRanges[star.spectralType] || sunspotFreqRanges['G'];
  const sunspotFreq = rng.randomFloat(sunspotFreqRange.min, sunspotFreqRange.max);

  // Sunspot intensity by spectral type (M-type stars have high activity)
  const sunspotIntensityRanges = {
    'O': { min: 1.7, max: 1.9 },     // 1.8
    'B': { min: 1.6, max: 1.8 },     // 1.7
    'A': { min: 1.5, max: 1.7 },     // 1.6
    'F': { min: 1.4, max: 1.6 },     // 1.5
    'G': { min: 1.4, max: 1.6 },     // 1.5
    'K': { min: 2.0, max: 2.6 },     // 2.3 (higher activity)
    'M': { min: 2.5, max: 3.1 },     // 2.8 (very high activity - flare stars)
  };

  const sunspotIntensityRange = sunspotIntensityRanges[star.spectralType] || sunspotIntensityRanges['G'];
  const sunspotIntensity = rng.randomFloat(sunspotIntensityRange.min, sunspotIntensityRange.max);

  // Limb darkening power by spectral type (hot stars = darker edges)
  const limbPowerRanges = {
    'O': { min: 3.3, max: 3.7 },     // 3.5
    'B': { min: 3.0, max: 3.4 },     // 3.2
    'A': { min: 2.6, max: 3.0 },     // 2.8
    'F': { min: 2.4, max: 2.8 },     // 2.6
    'G': { min: 2.3, max: 2.7 },     // 2.5
    'K': { min: 2.1, max: 2.5 },     // 2.3
    'M': { min: 1.8, max: 2.2 },     // 2.0
  };

  const limbPowerRange = limbPowerRanges[star.spectralType] || limbPowerRanges['G'];
  const limbPower = rng.randomFloat(limbPowerRange.min, limbPowerRange.max);

  // Center brightness by spectral type (hot stars = brighter centers)
  const centerBrightRanges = {
    'O': { min: 2.0, max: 2.4 },     // 2.2
    'B': { min: 1.8, max: 2.2 },     // 2.0
    'A': { min: 1.5, max: 1.9 },     // 1.7
    'F': { min: 1.4, max: 1.8 },     // 1.6
    'G': { min: 1.3, max: 1.7 },     // 1.5
    'K': { min: 1.2, max: 1.6 },     // 1.4
    'M': { min: 1.0, max: 1.4 },     // 1.2
  };

  const centerBrightRange = centerBrightRanges[star.spectralType] || centerBrightRanges['G'];
  const centerBrightness = rng.randomFloat(centerBrightRange.min, centerBrightRange.max);

  return {
    u_highTemp: { value: temps.high },
    u_lowTemp: { value: temps.low },
    u_scale: { value: scale },
    u_time: { value: 0.0 }, // Will be updated in animation loop
    u_sunspotFreq: { value: sunspotFreq },
    u_sunspotIntensity: { value: sunspotIntensity },
    u_limbDarkeningPower: { value: limbPower },
    u_centerBrightness: { value: centerBrightness },
  };
}

/**
 * Simple string hash function for deterministic seeds
 *
 * @param str - Input string (e.g., planet ID)
 * @returns Positive integer hash
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
