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
 * Shader uniforms for rocky/barren planets
 */
export interface RockyPlanetUniforms {
  u_baseColor: { value: THREE.Vector3 };
  u_waterCoverage: { value: number };
  u_atmosphereDensity: { value: number };
  u_atmosphereColor: { value: THREE.Vector3 };
  u_seed: { value: number };
  u_hasAtmosphere: { value: boolean };
  u_cameraPosition: { value: THREE.Vector3 };
}

/**
 * Shader uniforms for gas giants and ice giants
 */
export interface GasGiantUniforms {
  u_bandColor1: { value: THREE.Vector3 };
  u_bandColor2: { value: THREE.Vector3 };
  u_bandColor3: { value: THREE.Vector3 };
  u_bandCount: { value: number };
  u_turbulence: { value: number };
  u_seed: { value: number };
}

/**
 * Shader uniforms for enhanced star rendering
 */
export interface StarUniforms {
  // Colors
  u_starColor: { value: THREE.Vector3 };
  u_noiseColor: { value: THREE.Vector3 };
  u_centerColor: { value: THREE.Vector3 };
  u_temperature: { value: number };
  u_seed: { value: number };

  // Surface activity
  u_activityLevel: { value: number };
  u_activityScale: { value: number };
  u_activitySpeed: { value: number };

  // Center gradient
  u_gradientStrength: { value: number };
  u_gradientFalloff: { value: number };
  u_gradientOpacity: { value: number };

  // Limb darkening
  u_limbDarkeningPower: { value: number };
  u_centerBrightness: { value: number };

  // View-dependent
  u_cameraPosition: { value: THREE.Vector3 };
  u_time: { value: number };
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
function getTerrainColor(planet: Planet): THREE.Vector3 {
  switch (planet.type) {
    case PlanetType.Rocky:
      // Brownish terrain (Earth-like or Mars-like)
      return new THREE.Vector3(0.545, 0.451, 0.333); // RGB(139, 115, 85) = #8B7355
    case PlanetType.Barren:
      // Gray rocky surface
      return new THREE.Vector3(0.412, 0.412, 0.412); // RGB(105, 105, 105) = #696969
    default:
      // Fallback gray
      return new THREE.Vector3(0.5, 0.5, 0.5);
  }
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
function getGasGiantBandColors(planet: Planet): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
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
 * Generate shader uniforms for rocky/barren planets
 *
 * @param planet - Planet data
 * @param camera - Camera for view-dependent effects
 * @returns Uniforms object for rocky planet shader
 */
export function deriveRockyPlanetUniforms(
  planet: Planet,
  camera: THREE.Camera
): RockyPlanetUniforms {
  const baseColor = getTerrainColor(planet);
  const atmosphereColor = getAtmosphereColor(planet);

  // Generate seed from planet ID for deterministic noise
  const seed = hashString(planet.id);

  return {
    u_baseColor: { value: baseColor },
    u_waterCoverage: { value: planet.waterCoverage },
    u_atmosphereDensity: { value: planet.atmosphere.density },
    u_atmosphereColor: { value: atmosphereColor },
    u_seed: { value: seed },
    u_hasAtmosphere: { value: planet.atmosphere.present },
    u_cameraPosition: { value: camera.position },
  };
}

/**
 * Generate shader uniforms for gas giants and ice giants
 *
 * @param planet - Planet data
 * @returns Uniforms object for gas giant shader
 */
export function deriveGasGiantUniforms(planet: Planet): GasGiantUniforms {
  const [color1, color2, color3] = getGasGiantBandColors(planet);

  // Generate seed from planet ID for deterministic noise
  const seed = hashString(planet.id);

  // Band count varies by planet size (larger = more bands)
  const bandCount = 5 + Math.floor(planet.radius * 2); // 5-12 bands typically

  // Turbulence: Gas giants are always turbulent
  // Use seed to get deterministic but varied turbulence
  const seedVariation = (seed % 100) / 100; // 0.0-1.0 from seed

  let turbulence = 0.7; // Default high turbulence

  if (planet.type === PlanetType.IceGiant) {
    // Ice giants: 0.6-0.75 turbulence (cooler, less turbulent)
    turbulence = 0.6 + seedVariation * 0.15;
  } else {
    // Gas giants: 0.7-0.9 turbulence (hotter, very turbulent)
    turbulence = 0.7 + seedVariation * 0.2;
  }

  return {
    u_bandColor1: { value: color1 },
    u_bandColor2: { value: color2 },
    u_bandColor3: { value: color3 },
    u_bandCount: { value: bandCount },
    u_turbulence: { value: turbulence },
    u_seed: { value: seed },
  };
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
 * Generate shader uniforms for enhanced star rendering
 *
 * Maps spectral types to appropriate color schemes and parameters.
 * Uses seeded randomization for variation within spectral type ranges.
 *
 * @param star - Star data
 * @param camera - Camera for view-dependent effects
 * @returns Uniforms object for enhanced star shader
 */
export function deriveStarUniforms(
  star: Star,
  camera: THREE.Camera
): StarUniforms {
  // Generate seed from star ID for deterministic variation
  const seed = hashString(star.id);
  const rng = new SeededRandom(seed);

  // Spectral type-based color mapping
  // Using ranges from the demo settings as baseline for G-type (Sun-like)
  const spectralColors = {
    'O': {
      // Blue stars - very hot (darkened significantly)
      base: new THREE.Vector3(0.4, 0.5, 0.8),
      noise: new THREE.Vector3(0.2, 0.3, 0.6),
      center: new THREE.Vector3(0.6, 0.7, 0.9),
    },
    'B': {
      // Blue-white stars (darkened significantly)
      base: new THREE.Vector3(0.5, 0.6, 0.8),
      noise: new THREE.Vector3(0.3, 0.4, 0.7),
      center: new THREE.Vector3(0.7, 0.8, 0.9),
    },
    'A': {
      // White stars (darkened significantly)
      base: new THREE.Vector3(0.7, 0.7, 0.8),
      noise: new THREE.Vector3(0.5, 0.5, 0.6),
      center: new THREE.Vector3(0.85, 0.85, 0.9),
    },
    'F': {
      // Yellow-white stars (much darker noise for contrast)
      base: new THREE.Vector3(0.8, 0.75, 0.5),
      noise: new THREE.Vector3(0.3, 0.2, 0.1),  // Much darker brown spots
      center: new THREE.Vector3(0.9, 0.85, 0.6),
    },
    'G': {
      // Yellow stars (Sun-like) - using demo settings as baseline (darkened)
      // Base Color: #ffaa00 -> darker
      base: new THREE.Vector3(0.8, 0.5, 0.0),
      // Noise Color: #cc3300 -> keep dark
      noise: new THREE.Vector3(0.6, 0.15, 0.0),
      // Center Color: #ffff00 -> darker
      center: new THREE.Vector3(0.9, 0.9, 0.0),
    },
    'K': {
      // Orange stars (darkened)
      base: new THREE.Vector3(0.8, 0.5, 0.2),
      noise: new THREE.Vector3(0.6, 0.3, 0.1),
      center: new THREE.Vector3(0.9, 0.65, 0.3),
    },
    'M': {
      // Red stars (darkened slightly)
      base: new THREE.Vector3(0.8, 0.4, 0.2),
      noise: new THREE.Vector3(0.6, 0.2, 0.05),
      center: new THREE.Vector3(0.9, 0.6, 0.3),
    },
  };

  const colors = spectralColors[star.spectralType] || spectralColors['G'];

  // Temperature normalization (0.5-2.0 range for brightness multiplier)
  const tempNormalized = Math.max(0.5, Math.min(2.0, star.temperature / 5778)); // 5778K = Sun

  // Activity level varies by spectral type and seed
  // BOOSTED: Increased all ranges to make surface detail more visible
  let activityLevel: number;
  if (star.spectralType === 'M') {
    // M-type: High activity (flares common)
    activityLevel = rng.randomFloat(0.5, 0.8);
  } else if (star.spectralType === 'G') {
    // G-type (Sun-like): Medium activity - boosted from 0.2-0.4
    activityLevel = rng.randomFloat(0.4, 0.6);
  } else if (star.spectralType === 'O' || star.spectralType === 'B') {
    // Hot stars: Low surface activity (smooth) - boosted from 0.1-0.25
    activityLevel = rng.randomFloat(0.2, 0.4);
  } else {
    // F, A, K: Medium-low activity - boosted from 0.15-0.35
    activityLevel = rng.randomFloat(0.3, 0.5);
  }

  // Activity scale (noise frequency) - demo uses ~2.0-3.0 range
  const activityScale = rng.randomFloat(2.0, 3.5);

  // Activity speed (animation) - demo uses ~0.1-0.2
  const activitySpeed = rng.randomFloat(0.08, 0.15);

  // Gradient parameters - reduced opacity to not wash out surface detail
  // Demo: Gradient Strength: 0.24, Falloff: 1.1, Opacity: 0.60
  const gradientStrength = rng.randomFloat(0.15, 0.25); // Reduced
  const gradientFalloff = rng.randomFloat(1.0, 1.3);  // Same
  const gradientOpacity = rng.randomFloat(0.3, 0.5);  // Reduced from 0.5-0.7

  // Limb darkening - demo uses: Power: 1.9, Center Brightness: 1.15
  const limbDarkeningPower = rng.randomFloat(1.7, 2.1); // Centered on 1.9
  const centerBrightness = rng.randomFloat(1.0, 1.3);   // Centered on 1.15

  return {
    // Colors
    u_starColor: { value: colors.base },
    u_noiseColor: { value: colors.noise },
    u_centerColor: { value: colors.center },
    u_temperature: { value: tempNormalized },
    u_seed: { value: seed },

    // Surface activity
    u_activityLevel: { value: activityLevel },
    u_activityScale: { value: activityScale },
    u_activitySpeed: { value: activitySpeed },

    // Center gradient
    u_gradientStrength: { value: gradientStrength },
    u_gradientFalloff: { value: gradientFalloff },
    u_gradientOpacity: { value: gradientOpacity },

    // Limb darkening
    u_limbDarkeningPower: { value: limbDarkeningPower },
    u_centerBrightness: { value: centerBrightness },

    // View-dependent
    u_cameraPosition: { value: camera.position },
    u_time: { value: 0.0 }, // Will be updated in animation loop
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
