/**
 * Khora Engine - Planet Generator
 *
 * Procedurally generates planets with realistic orbital mechanics and properties.
 * Uses Titius-Bode law for orbital spacing and physics-based temperature calculations.
 */

import { SeededRandom } from '../utils/random';
import {
  MIN_PLANETS,
  MAX_PLANETS,
  TYPICAL_PLANETS,
  TITIUS_BODE_A,
  TITIUS_BODE_B,
  FROST_LINE_BASE,
  PLANET_TYPE_BY_DISTANCE,
  MIN_MASS_FOR_ATMOSPHERE,
  ROCKY_ATMOSPHERE_PROBABILITY,
  WATER_THRESHOLD
} from '../utils/constants';
import {
  calculateOrbitalPeriod,
  calculateEquilibriumTemperature,
  applyGreenhouseEffect
} from '../utils/physics';
import { generatePlanetName, generateId } from './name-generator';
import { isInHabitableZone } from '../utils/physics';
import type {
  Star,
  Planet,
  PlanetType,
  Atmosphere,
  HabitableZone
} from '../types/celestial-bodies';
import { PlanetType as PlanetTypeEnum } from '../types/celestial-bodies';

// ============================================================================
// Planet Count Determination
// ============================================================================

/**
 * Calculate number of planets for a star system
 *
 * Larger, more luminous stars tend to have more planets.
 * Distribution weighted toward typical count (6).
 *
 * @param star - Parent star
 * @param rng - Seeded random number generator
 * @returns Number of planets (2-12)
 */
function calculatePlanetCount(star: Star, rng: SeededRandom): number {
  // Base count weighted toward typical
  let count = Math.round(rng.randomFloat(MIN_PLANETS, MAX_PLANETS));

  // Adjust based on stellar mass (larger stars = more material in disk)
  if (star.mass > 1.5) {
    count += rng.randomInt(0, 2);
  } else if (star.mass < 0.5) {
    count -= rng.randomInt(0, 2);
  }

  // Weight toward typical count
  if (Math.abs(count - TYPICAL_PLANETS) > 3) {
    count = count + Math.sign(TYPICAL_PLANETS - count) * rng.randomInt(0, 2);
  }

  // Clamp to valid range
  return Math.max(MIN_PLANETS, Math.min(MAX_PLANETS, count));
}

// ============================================================================
// Orbital Distance Generation
// ============================================================================

/**
 * Generate orbital distances using modified Titius-Bode law
 *
 * Formula: d = a + b * 2^n
 * Where: a = 0.4 AU, b = 0.3 AU, n = 0, 1, 2, 3...
 *
 * Scaled by stellar luminosity (brighter stars = wider orbits).
 *
 * @param count - Number of planets
 * @param star - Parent star
 * @param rng - Seeded random number generator
 * @returns Array of orbital distances in AU
 */
function generateOrbitalDistances(
  count: number,
  star: Star,
  rng: SeededRandom
): number[] {
  const distances: number[] = [];

  // Scale factor based on stellar luminosity
  const luminosityScale = Math.sqrt(star.luminosity);

  for (let n = 0; n < count; n++) {
    // Titius-Bode law
    let distance = (TITIUS_BODE_A + TITIUS_BODE_B * Math.pow(2, n)) * luminosityScale;

    // Add small random variation (±15%)
    distance *= rng.randomFloat(0.85, 1.15);

    // Ensure no planet orbits inside star
    const minOrbit = star.radius * 0.01 * 1.5; // Star radius in AU * safety margin
    if (distance < minOrbit) {
      distance = minOrbit + rng.randomFloat(0.1, 0.5);
    }

    distances.push(distance);
  }

  return distances.sort((a, b) => a - b); // Sort by distance
}

// ============================================================================
// Planet Type Determination
// ============================================================================

/**
 * Calculate frost line distance where volatiles can condense
 *
 * Beyond this line, ice and gas can accumulate to form gas/ice giants.
 *
 * @param star - Parent star
 * @returns Frost line distance in AU
 */
function calculateFrostLine(star: Star): number {
  // Frost line scales with square root of luminosity
  return FROST_LINE_BASE * Math.sqrt(star.luminosity);
}

/**
 * Determine planet type based on orbital distance
 *
 * Uses zones:
 * - Inner (< 0.8 AU): Rocky or Barren (too hot)
 * - Habitable (0.8-2.0 AU): Mostly Rocky
 * - Middle (2.0-5.0 AU): Gas Giants form
 * - Outer (> 5.0 AU): Ice Giants dominate
 *
 * @param orbitDistance - Distance from star in AU
 * @param frostLine - Frost line distance in AU
 * @param habitableZone - Star's habitable zone
 * @param rng - Seeded random number generator
 * @returns Planet type
 */
function determinePlanetType(
  orbitDistance: number,
  frostLine: number,
  habitableZone: HabitableZone,
  rng: SeededRandom
): PlanetType {
  let probabilities: readonly number[];

  // Determine zone
  if (orbitDistance < habitableZone.inner * 0.8) {
    // Inner zone - too hot for atmosphere
    probabilities = PLANET_TYPE_BY_DISTANCE.inner;
  } else if (isInHabitableZone(orbitDistance, habitableZone)) {
    // Habitable zone - ideal for rocky planets
    probabilities = PLANET_TYPE_BY_DISTANCE.habitable;
  } else if (orbitDistance < frostLine * 1.5) {
    // Middle zone - gas giants form here
    probabilities = PLANET_TYPE_BY_DISTANCE.middle;
  } else {
    // Outer zone - ice giants and frozen worlds
    probabilities = PLANET_TYPE_BY_DISTANCE.outer;
  }

  // Weighted selection
  const types: [PlanetType, number][] = [
    [PlanetTypeEnum.Rocky, probabilities[0]],
    [PlanetTypeEnum.GasGiant, probabilities[1]],
    [PlanetTypeEnum.IceGiant, probabilities[2]],
    [PlanetTypeEnum.Barren, probabilities[3]]
  ];

  return rng.weightedChoice(types);
}

// ============================================================================
// Planet Physical Properties
// ============================================================================

/**
 * Generate mass and radius based on planet type
 *
 * @param type - Planet type
 * @param rng - Seeded random number generator
 * @returns Mass (Earth masses) and radius (Earth radii)
 */
function generatePlanetPhysics(
  type: PlanetType,
  rng: SeededRandom
): { mass: number; radius: number } {
  switch (type) {
    case PlanetTypeEnum.Rocky:
      return {
        mass: rng.randomFloat(0.1, 3.0), // Mercury to Super-Earth
        radius: rng.randomFloat(0.4, 1.5)
      };

    case PlanetTypeEnum.GasGiant:
      return {
        mass: rng.randomFloat(50, 1000), // Saturn to multi-Jupiter
        radius: rng.randomFloat(8, 12) // Jupiter-like
      };

    case PlanetTypeEnum.IceGiant:
      return {
        mass: rng.randomFloat(10, 30), // Neptune to large ice giant
        radius: rng.randomFloat(3, 5) // Neptune-like
      };

    case PlanetTypeEnum.Barren:
      return {
        mass: rng.randomFloat(0.02, 0.2), // Mars to small rocky
        radius: rng.randomFloat(0.2, 0.6)
      };

    default:
      return { mass: 1.0, radius: 1.0 };
  }
}

// ============================================================================
// Atmosphere Generation
// ============================================================================

/**
 * Generate atmosphere for a planet
 *
 * Rules:
 * - Gas/Ice giants always have thick atmospheres
 * - Rocky planets need sufficient mass (> 0.1 Earth masses)
 * - Rocky planets have 30% base chance, higher in habitable zone
 * - Barren planets rarely have atmospheres
 *
 * @param planet - Planet being generated (partial)
 * @param star - Parent star
 * @param isInHZ - Whether planet is in habitable zone
 * @param rng - Seeded random number generator
 * @returns Atmosphere object
 */
function generateAtmosphere(
  planet: Partial<Planet>,
  isInHZ: boolean,
  rng: SeededRandom
): Atmosphere {
  const type = planet.type!;
  const mass = planet.mass!;

  // Gas/Ice giants always have atmospheres
  if (type === PlanetTypeEnum.GasGiant || type === PlanetTypeEnum.IceGiant) {
    const composition = type === PlanetTypeEnum.GasGiant
      ? {
          hydrogen: 0.75,
          helium: 0.24,
          methane: 0.01
        }
      : {
          hydrogen: 0.20,
          helium: 0.10,
          methane: 0.35,
          ammonia: 0.20,
          water: 0.15
        };

    return {
      present: true,
      density: rng.randomFloat(0.8, 1.0),
      breathable: false,
      composition
    };
  }

  // Rocky/Barren planets need sufficient mass
  if (mass < MIN_MASS_FOR_ATMOSPHERE) {
    return {
      present: false,
      density: 0,
      breathable: false,
      composition: {}
    };
  }

  // Rocky planets have chance of atmosphere
  let atmosphereChance = ROCKY_ATMOSPHERE_PROBABILITY;
  if (isInHZ) {
    atmosphereChance *= 2; // Double chance in habitable zone
  }

  if (!rng.boolean(atmosphereChance)) {
    return {
      present: false,
      density: 0,
      breathable: false,
      composition: {}
    };
  }

  // Generate rocky planet atmosphere
  const hasOxygen = isInHZ && rng.boolean(0.3); // 30% chance if in HZ
  const composition: Atmosphere['composition'] = {};

  if (hasOxygen) {
    composition.nitrogen = rng.randomFloat(0.6, 0.8);
    composition.oxygen = rng.randomFloat(0.15, 0.25);
    composition.carbonDioxide = rng.randomFloat(0.01, 0.05);
    composition.other = 1 - (composition.nitrogen + composition.oxygen + composition.carbonDioxide);
  } else {
    composition.carbonDioxide = rng.randomFloat(0.8, 0.95);
    composition.nitrogen = rng.randomFloat(0.02, 0.1);
    composition.other = 1 - (composition.carbonDioxide + composition.nitrogen);
  }

  return {
    present: true,
    density: rng.randomFloat(0.3, 0.9),
    breathable: hasOxygen,
    composition
  };
}

// ============================================================================
// Planet Generation
// ============================================================================

/**
 * Generate all planets for a star system
 *
 * This is the main entry point for planet generation. Creates a complete
 * set of planets with realistic orbital mechanics, types, and atmospheres.
 *
 * @param star - Parent star
 * @param rng - Seeded random number generator (pass unique seed for each system)
 * @returns Array of Planet objects (moons will be added later)
 */
export function generatePlanets(star: Star, rng: SeededRandom): Planet[] {
  const planets: Planet[] = [];

  // Determine number of planets
  const count = calculatePlanetCount(star, rng);

  // Generate orbital distances
  const distances = generateOrbitalDistances(count, star, rng);

  // Calculate frost line
  const frostLine = calculateFrostLine(star);

  // Generate each planet
  for (let i = 0; i < count; i++) {
    const orbitDistance = distances[i];
    const isInHZ = isInHabitableZone(orbitDistance, star.habitableZone);

    // Determine planet type
    const type = determinePlanetType(orbitDistance, frostLine, star.habitableZone, rng);

    // Generate physical properties
    const { mass, radius } = generatePlanetPhysics(type, rng);

    // Calculate orbital period (Kepler's 3rd law)
    const orbitalPeriod = calculateOrbitalPeriod(orbitDistance, star.mass);

    // Calculate rotation period
    // Close planets often tidally locked, distant planets rotate faster
    let rotationPeriod: number;
    if (orbitDistance < 0.1) {
      // Tidally locked
      rotationPeriod = orbitalPeriod;
    } else if (type === PlanetTypeEnum.GasGiant || type === PlanetTypeEnum.IceGiant) {
      // Gas giants rotate fast (10-20 hours)
      rotationPeriod = rng.randomFloat(0.4, 0.8); // In Earth days
    } else {
      // Rocky planets (0.5-5 Earth days)
      rotationPeriod = rng.randomFloat(0.5, 5);
    }

    // Calculate surface temperature
    const equilibriumTemp = calculateEquilibriumTemperature(
      star.temperature,
      star.radius,
      orbitDistance
    );

    // Partial planet object for atmosphere generation
    const partialPlanet: Partial<Planet> = { type, mass, radius };

    // Generate atmosphere
    const atmosphere = generateAtmosphere(partialPlanet, isInHZ, rng);

    // Apply greenhouse effect if atmosphere present
    const surfaceTemperature = atmosphere.present
      ? applyGreenhouseEffect(equilibriumTemp, atmosphere.density)
      : equilibriumTemp;

    // Determine water coverage (only for rocky planets in habitable zone)
    let waterCoverage = 0;
    if (type === PlanetTypeEnum.Rocky && isInHZ && atmosphere.present) {
      // Check if temperature allows liquid water (273K-373K)
      if (surfaceTemperature > 273 && surfaceTemperature < 373) {
        waterCoverage = rng.randomFloat(0.3, 0.8);
      }
    }

    // Generate name
    const name = generatePlanetName(star.name, i, isInHZ, rng);

    // Create planet object
    const planet: Planet = {
      id: generateId('planet', parseInt(star.id.split('-')[1]), i),
      name,
      type,
      orbitDistance,
      orbitalPeriod,
      rotationPeriod,
      radius,
      mass,
      atmosphere,
      surfaceTemperature,
      waterCoverage,
      resources: {}, // Will be populated by resource distributor
      moons: [] // Will be populated by moon generator
    };

    planets.push(planet);
  }

  return planets;
}

/**
 * Get a human-readable description of a planet
 *
 * @param planet - Planet to describe
 * @returns Description string
 */
export function describePlanet(planet: Planet): string {
  const typeDesc = getPlanetTypeDescription(planet.type);
  const tempC = (planet.surfaceTemperature - 273.15).toFixed(0);
  const hasWater = planet.waterCoverage > WATER_THRESHOLD;

  let desc = `${planet.name}: ${typeDesc} at ${planet.orbitDistance.toFixed(2)} AU (${tempC}°C)`;

  if (hasWater) {
    desc += ` [${(planet.waterCoverage * 100).toFixed(0)}% water]`;
  }

  if (planet.atmosphere.breathable) {
    desc += ' [breathable]';
  }

  return desc;
}

/**
 * Get human-readable description of planet type
 */
function getPlanetTypeDescription(type: PlanetType): string {
  const descriptions: Record<PlanetType, string> = {
    [PlanetTypeEnum.Rocky]: 'Rocky planet',
    [PlanetTypeEnum.GasGiant]: 'Gas giant',
    [PlanetTypeEnum.IceGiant]: 'Ice giant',
    [PlanetTypeEnum.Barren]: 'Barren world'
  };
  return descriptions[type] || type;
}
