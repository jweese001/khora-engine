/**
 * Khora Engine - Shader Uniforms Helper
 *
 * Converts Planet/Star data to Three.js shader uniforms.
 * Ensures consistent shader inputs across different celestial body types.
 */

import * as THREE from 'three';
import type { Planet } from '../types/celestial-bodies';
import { PlanetType } from '../types/celestial-bodies';

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

// ============================================================================
// Utility Functions
// ============================================================================

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
