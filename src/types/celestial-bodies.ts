/**
 * Khora Engine - Celestial Bodies Type Definitions
 *
 * Core data structures for procedurally generated star systems.
 * Phase 1: Single star system with planets and moons.
 */

// ============================================================================
// Type Constants (using const objects for erasableSyntaxOnly compatibility)
// ============================================================================

/**
 * Stellar spectral classification (Harvard system)
 * Distribution matches observed universe statistics
 */
export const SpectralType = {
  O: 'O', // Blue, very hot (30k-50k K)
  B: 'B', // Blue-white (10k-30k K)
  A: 'A', // White (7.5k-10k K)
  F: 'F', // Yellow-white (6k-7.5k K)
  G: 'G', // Yellow (5.2k-6k K) - Sun-like
  K: 'K', // Orange (3.7k-5.2k K)
  M: 'M', // Red, cool (2.4k-3.7k K) - Most common
} as const;

export type SpectralType = typeof SpectralType[keyof typeof SpectralType];

/**
 * Stellar evolutionary stage
 * Phase 1 focuses on Main Sequence stars with some giants
 */
export const EvolutionaryStage = {
  MainSequence: 'MainSequence', // 90% - stable hydrogen fusion
  RedGiant: 'RedGiant',          // 8% - expanded, cooler
  WhiteDwarf: 'WhiteDwarf',      // 2% - compact, dim remnant
  // Excluded from Phase 1: Neutron Star, Black Hole
} as const;

export type EvolutionaryStage = typeof EvolutionaryStage[keyof typeof EvolutionaryStage];

/**
 * Planet classification by composition and formation
 */
export const PlanetType = {
  Rocky: 'Rocky',       // Terrestrial, iron-silicate core
  GasGiant: 'GasGiant', // Massive hydrogen-helium atmosphere
  IceGiant: 'IceGiant', // Volatile-rich (water, methane, ammonia)
  Barren: 'Barren',     // Rocky but too small/hot for atmosphere
} as const;

export type PlanetType = typeof PlanetType[keyof typeof PlanetType];

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Habitable zone boundaries
 * Calculated based on stellar luminosity
 */
export interface HabitableZone {
  inner: number; // AU - too hot beyond this
  outer: number; // AU - too cold beyond this
}

/**
 * Planetary atmosphere composition and properties
 */
export interface Atmosphere {
  present: boolean;
  density: number; // 0.0-1.0, affects visual glow strength
  breathable: boolean; // Only relevant if in habitable zone
  composition: {
    // Percentages, should sum to ~1.0
    nitrogen?: number;
    oxygen?: number;
    carbonDioxide?: number;
    methane?: number;
    hydrogen?: number;
    helium?: number;
    other?: number;
  };
}

/**
 * Resource availability on celestial body
 * Phase 1: Display only, no extraction mechanics
 */
export interface ResourceMap {
  [resourceName: string]: number; // Abundance 0.1-1.0
}

/**
 * Star - Central body of the system
 */
export interface Star {
  id: string;
  name: string;
  spectralType: SpectralType;
  evolutionaryStage: EvolutionaryStage;

  // Physical properties
  mass: number; // Solar masses
  radius: number; // Solar radii
  temperature: number; // Kelvin
  luminosity: number; // Solar luminosities

  // Calculated zones
  habitableZone: HabitableZone;

  // System composition
  planets: Planet[];
}

/**
 * Planet - Orbiting body of a star
 */
export interface Planet {
  id: string;
  name: string;
  type: PlanetType;

  // Orbital properties
  orbitDistance: number; // AU from star
  orbitalPeriod: number; // Earth days
  rotationPeriod: number; // Earth days

  // Physical properties
  radius: number; // Earth radii
  mass: number; // Earth masses

  // Surface/atmosphere
  atmosphere: Atmosphere;
  surfaceTemperature: number; // Kelvin
  waterCoverage: number; // 0.0-1.0, for rendering blue oceans

  // Resources
  resources: ResourceMap;

  // Satellites
  moons: Moon[];
}

/**
 * Moon - Satellite of a planet
 */
export interface Moon {
  id: string;
  name: string;

  // Orbital properties (relative to parent planet)
  orbitDistance: number; // Kilometers from planet surface
  orbitalPeriod: number; // Earth days
  rotationPeriod: number; // Earth days (often tidally locked)

  // Physical properties
  radius: number; // Kilometers
  mass: number; // 10^22 kg (Moon = 7.34)

  // Surface properties
  surfaceTemperature: number; // Kelvin
  resources: ResourceMap;
}

/**
 * Complete star system
 * Top-level data structure for a generated system
 */
export interface StarSystem {
  id: string;
  name: string; // Derived from star name
  seed: number; // For deterministic regeneration
  star: Star;
  generatedAt: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard to check if a celestial body is a planet
 */
export function isPlanet(body: Planet | Moon): body is Planet {
  return 'type' in body && 'orbitDistance' in body;
}

/**
 * Type guard to check if a celestial body is a moon
 */
export function isMoon(body: Planet | Moon): body is Moon {
  return !isPlanet(body);
}

/**
 * Union type for any orbiting body
 */
export type CelestialBody = Planet | Moon;

/**
 * Material shader uniforms for planet rendering
 * Used to pass planet properties to GPU shaders
 */
export interface PlanetShaderUniforms {
  u_radius: number;
  u_baseColor: [number, number, number];
  u_waterCoverage: number;
  u_atmosphereDensity: number;
  u_time?: number; // Optional, for animated effects
}

/**
 * Material shader uniforms for gas giant rendering
 */
export interface GasGiantShaderUniforms {
  u_radius: number;
  u_bandColors: [[number, number, number], [number, number, number], [number, number, number]];
  u_bandSpeed: number;
  u_time: number;
}

/**
 * Material shader uniforms for star rendering
 */
export interface StarShaderUniforms {
  u_starColor: [number, number, number];
  u_temperature: number;
  u_time?: number;
}
