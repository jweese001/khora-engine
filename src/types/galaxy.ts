/**
 * Khora Engine - Galaxy Type Definitions
 *
 * Phase 2: Multi-system galaxy generation
 * Defines galaxy structure, types, and system positioning
 */

import type { StarSystem } from './celestial-bodies';

// ============================================================================
// Galaxy Type Constants
// ============================================================================

/**
 * Galaxy morphological classification
 * Based on Hubble sequence
 */
export const GalaxyType = {
  Spiral: 'Spiral',           // Disk with spiral arms (60% of galaxies)
  Elliptical: 'Elliptical',   // Ellipsoidal shape, older stars (30%)
  Irregular: 'Irregular',     // Chaotic structure (10%)
} as const;

export type GalaxyType = typeof GalaxyType[keyof typeof GalaxyType];

/**
 * Spiral galaxy arm structure
 * Determines number and tightness of spiral arms
 */
export const SpiralArmCount = {
  Two: 2,     // Like NGC 1300
  Three: 3,   // Like M51 Whirlpool
  Four: 4,    // Like M83
  Five: 5,    // Rare, like NGC 1232
} as const;

export type SpiralArmCount = typeof SpiralArmCount[keyof typeof SpiralArmCount];

// ============================================================================
// Galaxy Interfaces
// ============================================================================

/**
 * 3D position in galaxy coordinate system
 * Origin at galactic center, distances in light-years
 */
export interface GalacticPosition {
  x: number;  // light-years
  y: number;  // light-years (vertical, galaxy disk thickness)
  z: number;  // light-years
}

/**
 * Spiral galaxy parameters
 */
export interface SpiralGalaxyParams {
  armCount: SpiralArmCount;
  armTightness: number;    // 0.0-1.0, how wound the arms are
  armWidth: number;        // Light-years, thickness of spiral arms
  diskRadius: number;      // Light-years, outer edge of disk
  diskThickness: number;   // Light-years, vertical extent
  bulgeRadius: number;     // Light-years, central bulge size
  rotationSpeed: number;   // Radians per year (visual rotation for rendering)
}

/**
 * Elliptical galaxy parameters
 */
export interface EllipticalGalaxyParams {
  majorAxis: number;       // Light-years, longest diameter
  minorAxis: number;       // Light-years, shortest diameter
  eccentricity: number;    // 0.0-1.0, how elongated (0=sphere, 1=flat)
  coreRadius: number;      // Light-years, dense core size
}

/**
 * Irregular galaxy parameters
 */
export interface IrregularGalaxyParams {
  boundingRadius: number;  // Light-years, rough outer boundary
  clusterCount: number;    // Number of dense star clusters
  dispersalFactor: number; // 0.0-1.0, how scattered (0=tight, 1=very scattered)
}

/**
 * System placement within galaxy
 * Each star system has a position and optional metadata
 */
export interface GalaxySystemPlacement {
  system: StarSystem;
  position: GalacticPosition;
  region?: string;         // Optional: "core", "arm", "halo", etc.
}

/**
 * Complete galaxy structure
 * Top-level container for multi-system galaxies
 */
export interface Galaxy {
  id: string;
  name: string;
  seed: number;            // For deterministic regeneration
  type: GalaxyType;

  // Type-specific parameters (only one will be defined based on type)
  spiralParams?: SpiralGalaxyParams;
  ellipticalParams?: EllipticalGalaxyParams;
  irregularParams?: IrregularGalaxyParams;

  // System placements
  systems: GalaxySystemPlacement[];
  systemCount: number;     // Total number of star systems

  // Metadata
  generatedAt: Date;
  age: number;             // Billion years (affects star population)
}

/**
 * Galaxy generation parameters
 * Passed to galaxy generator to control output
 */
export interface GalaxyGenerationParams {
  seed: number;
  systemCount?: number;    // Default: 8-16 systems
  preferredType?: GalaxyType; // If undefined, random distribution
  minSystemDistance?: number; // Light-years, minimum spacing between systems
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard for spiral galaxy
 */
export function isSpiralGalaxy(galaxy: Galaxy): galaxy is Galaxy & { spiralParams: SpiralGalaxyParams } {
  return galaxy.type === GalaxyType.Spiral && !!galaxy.spiralParams;
}

/**
 * Type guard for elliptical galaxy
 */
export function isEllipticalGalaxy(galaxy: Galaxy): galaxy is Galaxy & { ellipticalParams: EllipticalGalaxyParams } {
  return galaxy.type === GalaxyType.Elliptical && !!galaxy.ellipticalParams;
}

/**
 * Type guard for irregular galaxy
 */
export function isIrregularGalaxy(galaxy: Galaxy): galaxy is Galaxy & { irregularParams: IrregularGalaxyParams } {
  return galaxy.type === GalaxyType.Irregular && !!galaxy.irregularParams;
}

/**
 * Calculate distance between two galactic positions
 */
export function distanceBetweenPositions(a: GalacticPosition, b: GalacticPosition): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Convert galactic position to spherical coordinates
 * Returns: { radius, theta (azimuthal), phi (polar) }
 */
export function positionToSpherical(pos: GalacticPosition): { radius: number; theta: number; phi: number } {
  const radius = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  const theta = Math.atan2(pos.z, pos.x);
  const phi = Math.acos(pos.y / radius);

  return { radius, theta, phi };
}
