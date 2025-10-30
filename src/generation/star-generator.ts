/**
 * Khora Engine - Star Generator
 *
 * Procedurally generates stars with realistic properties.
 * Based on observed stellar populations and astrophysical models.
 */

import { SeededRandom } from '../utils/random';
import {
  SPECTRAL_TYPE_PROBABILITIES,
  EVOLUTIONARY_STAGE_PROBABILITIES,
  SPECTRAL_TYPE_PROPERTIES
} from '../utils/constants';
import { calculateHabitableZone } from '../utils/physics';
import { generateStarName, generateId } from './name-generator';
import type { Star, SpectralType, EvolutionaryStage } from '../types/celestial-bodies';
import { SpectralType as SpectralTypeEnum, EvolutionaryStage as EvolutionaryStageEnum } from '../types/celestial-bodies';

// ============================================================================
// Spectral Type & Stage Selection
// ============================================================================

/**
 * Roll for spectral type based on observed stellar population distribution
 *
 * Distribution (Kroupa 2001 IMF):
 * - M-type: 76.45% (red dwarfs - most common)
 * - K-type: 12.1% (orange dwarfs)
 * - G-type: 7.6% (yellow dwarfs like our Sun)
 * - F-type: 3.0% (yellow-white)
 * - A-type: 0.6% (white)
 * - B-type: 0.13% (blue-white)
 * - O-type: 0.00003% (blue - extremely rare)
 *
 * @param rng - Seeded random number generator
 * @returns Spectral type
 */
function rollSpectralType(rng: SeededRandom): SpectralType {
  return rng.weightedChoice(SPECTRAL_TYPE_PROBABILITIES);
}

/**
 * Roll for evolutionary stage
 *
 * Distribution:
 * - Main Sequence: 90% (stable hydrogen fusion)
 * - Red Giant: 8% (expanded, cooler phase)
 * - White Dwarf: 2% (stellar remnant)
 *
 * @param rng - Seeded random number generator
 * @returns Evolutionary stage
 */
function rollEvolutionaryStage(rng: SeededRandom): EvolutionaryStage {
  return rng.weightedChoice(EVOLUTIONARY_STAGE_PROBABILITIES);
}

// ============================================================================
// Physical Property Derivation
// ============================================================================

/**
 * Derive physical properties from spectral type and evolutionary stage
 *
 * Properties are randomized within observed ranges for each spectral class.
 * Ranges come from comprehensive stellar surveys (Habets & Heintze 1981, Cox 2000).
 *
 * @param spectralType - Spectral classification (O, B, A, F, G, K, M)
 * @param stage - Evolutionary stage
 * @param rng - Seeded random number generator
 * @returns Physical properties (mass, radius, temperature, luminosity)
 */
function deriveStarProperties(
  spectralType: SpectralType,
  stage: EvolutionaryStage,
  rng: SeededRandom
): {
  mass: number;
  radius: number;
  temperature: number;
  luminosity: number;
} {
  // Get property ranges for this spectral type
  const properties = SPECTRAL_TYPE_PROPERTIES[spectralType];

  // Randomize within ranges
  let mass = rng.randomFloat(properties.mass.min, properties.mass.max);
  let radius = rng.randomFloat(properties.radius.min, properties.radius.max);
  let temperature = rng.randomFloat(properties.temperature.min, properties.temperature.max);
  let luminosity = rng.randomFloat(properties.luminosity.min, properties.luminosity.max);

  // Adjust for evolutionary stage
  if (stage === EvolutionaryStageEnum.RedGiant) {
    // Red giants are much larger but cooler
    radius *= rng.randomFloat(10, 100); // Expanded envelope
    temperature *= rng.randomFloat(0.5, 0.7); // Cooler surface
    luminosity *= rng.randomFloat(100, 1000); // Much brighter despite being cooler
  } else if (stage === EvolutionaryStageEnum.WhiteDwarf) {
    // White dwarfs are tiny but hot remnants
    mass *= rng.randomFloat(0.5, 0.7); // Lost outer layers
    radius = rng.randomFloat(0.008, 0.02); // Earth-sized (in solar radii)
    temperature = rng.randomFloat(8000, 40000); // Very hot surface
    luminosity = rng.randomFloat(0.0001, 0.1); // Dim due to small size
  }

  return {
    mass,
    radius,
    temperature,
    luminosity
  };
}

// ============================================================================
// Star Generation
// ============================================================================

/**
 * Generate a complete star with all properties
 *
 * This is the main entry point for star generation. It produces a fully
 * realized star object with:
 * - Realistic spectral classification
 * - Physical properties derived from type
 * - Habitable zone calculated from luminosity
 * - Procedurally generated name
 *
 * The same seed will always produce the same star.
 *
 * @param seed - Random seed for deterministic generation
 * @returns Complete Star object
 */
export function generateStar(seed: number): Star {
  const rng = new SeededRandom(seed);

  // Roll for spectral type and evolutionary stage
  const spectralType = rollSpectralType(rng);
  const evolutionaryStage = rollEvolutionaryStage(rng);

  // Derive physical properties from type and stage
  const { mass, radius, temperature, luminosity } = deriveStarProperties(
    spectralType,
    evolutionaryStage,
    rng
  );

  // Calculate habitable zone based on luminosity
  const habitableZone = calculateHabitableZone(luminosity);

  // Generate name
  const name = generateStarName(rng);

  // Create star object
  const star: Star = {
    id: generateId('star', seed),
    name,
    spectralType,
    evolutionaryStage,
    mass,
    radius,
    temperature,
    luminosity,
    habitableZone,
    planets: [] // Will be populated by planet generator
  };

  return star;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a human-readable description of a star
 *
 * @param star - Star to describe
 * @returns Description string
 */
export function describestar(star: Star): string {
  const typeDesc = getSpectralTypeDescription(star.spectralType);
  const stageDesc = getEvolutionaryStageDescription(star.evolutionaryStage);

  return `${star.name}: ${typeDesc} ${stageDesc} (${star.temperature.toFixed(0)}K, ${star.luminosity.toFixed(2)}L☉)`;
}

/**
 * Get human-readable description of spectral type
 */
function getSpectralTypeDescription(type: SpectralType): string {
  const descriptions: Record<SpectralType, string> = {
    [SpectralTypeEnum.O]: 'Blue supergiant',
    [SpectralTypeEnum.B]: 'Blue-white giant',
    [SpectralTypeEnum.A]: 'White star',
    [SpectralTypeEnum.F]: 'Yellow-white star',
    [SpectralTypeEnum.G]: 'Yellow dwarf',
    [SpectralTypeEnum.K]: 'Orange dwarf',
    [SpectralTypeEnum.M]: 'Red dwarf'
  };
  return descriptions[type] || type;
}

/**
 * Get human-readable description of evolutionary stage
 */
function getEvolutionaryStageDescription(stage: EvolutionaryStage): string {
  const descriptions: Record<EvolutionaryStage, string> = {
    [EvolutionaryStageEnum.MainSequence]: 'main sequence',
    [EvolutionaryStageEnum.RedGiant]: 'red giant',
    [EvolutionaryStageEnum.WhiteDwarf]: 'white dwarf'
  };
  return descriptions[stage] || stage;
}

/**
 * Check if a star is likely to have habitable planets
 *
 * Criteria:
 * - Main sequence (stable fusion)
 * - F, G, or K type (not too hot, not too dim)
 * - Habitable zone exists and is accessible
 *
 * @param star - Star to check
 * @returns True if potentially habitable
 */
export function isHabitableStar(star: Star): boolean {
  // Must be main sequence (stable)
  if (star.evolutionaryStage !== EvolutionaryStageEnum.MainSequence) {
    return false;
  }

  // F, G, K types are best for life (not too hot, not too dim)
  const goodTypes: SpectralType[] = [
    SpectralTypeEnum.F,
    SpectralTypeEnum.G,
    SpectralTypeEnum.K
  ];

  if (!goodTypes.includes(star.spectralType)) {
    return false;
  }

  // Habitable zone must be reasonable (not inside star, not too far out)
  if (star.habitableZone.inner < star.radius * 0.01 || star.habitableZone.outer > 100) {
    return false;
  }

  return true;
}
