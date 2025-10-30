/**
 * Khora Engine - Resource Distributor
 *
 * Assigns resource abundances to planets and moons.
 * Resource types and amounts depend on celestial body composition and formation.
 */

import { SeededRandom } from '../utils/random';
import {
  RESOURCE_POOLS,
  MIN_RESOURCE_ABUNDANCE,
  MAX_RESOURCE_ABUNDANCE
} from '../utils/constants';
import type { Planet, Moon, PlanetType, ResourceMap } from '../types/celestial-bodies';
import { PlanetType as PlanetTypeEnum } from '../types/celestial-bodies';

// ============================================================================
// Resource Distribution
// ============================================================================

/**
 * Distribute resources for a planet based on type and location
 *
 * Different planet types have different resource pools:
 * - Rocky: Metals and minerals (iron, silicon, titanium)
 * - Gas Giant: Volatile gases (hydrogen, helium, methane)
 * - Ice Giant: Frozen volatiles and gases
 * - Barren: Basic metals and silicates
 *
 * Inner system planets favor metals, outer system favors volatiles.
 *
 * @param planet - Planet to assign resources to
 * @param rng - Seeded random number generator
 * @returns ResourceMap with abundance values
 */
export function distributePlanetResources(
  planet: Planet,
  rng: SeededRandom
): ResourceMap {
  const resources: ResourceMap = {};

  // Get resource pool for planet type
  const pool = getResourcePool(planet.type);

  // Number of resources to assign (not all resources appear on every body)
  const resourceCount = rng.randomInt(
    Math.floor(pool.length * 0.4),
    Math.floor(pool.length * 0.8)
  );

  // Shuffle and select subset
  const selectedResources = rng.shuffle([...pool]).slice(0, resourceCount);

  // Assign abundance to each resource
  for (const resourceName of selectedResources) {
    let abundance = rng.randomFloat(MIN_RESOURCE_ABUNDANCE, MAX_RESOURCE_ABUNDANCE);

    // Modify abundance based on planet properties

    // Inner system planets have higher metal abundance
    if (planet.orbitDistance < 2.0) {
      if (isMetalResource(resourceName)) {
        abundance *= 1.3;
      }
    }

    // Outer system planets have higher volatile abundance
    if (planet.orbitDistance > 5.0) {
      if (isVolatileResource(resourceName)) {
        abundance *= 1.3;
      }
    }

    // Large planets have slightly higher abundance overall
    if (planet.mass > 100) {
      abundance *= 1.1;
    }

    // Clamp to valid range
    abundance = Math.max(MIN_RESOURCE_ABUNDANCE, Math.min(MAX_RESOURCE_ABUNDANCE, abundance));

    resources[resourceName] = Math.round(abundance * 100) / 100; // Round to 2 decimals
  }

  return resources;
}

/**
 * Distribute resources for a moon
 *
 * Moons inherit some characteristics from their parent planet,
 * but generally have fewer and less abundant resources.
 *
 * @param moon - Moon to assign resources to
 * @param parentPlanet - Parent planet
 * @param rng - Seeded random number generator
 * @returns ResourceMap with abundance values
 */
export function distributeMoonResources(
  moon: Moon,
  parentPlanet: Planet,
  rng: SeededRandom
): ResourceMap {
  const resources: ResourceMap = {};

  // Moons are typically rocky/icy regardless of parent type
  const pool = parentPlanet.type === PlanetTypeEnum.Rocky || parentPlanet.type === PlanetTypeEnum.Barren
    ? RESOURCE_POOLS.Rocky
    : RESOURCE_POOLS.IceGiant; // Moons of gas giants are often icy

  // Moons have fewer resources than planets
  const resourceCount = rng.randomInt(
    Math.floor(pool.length * 0.2),
    Math.floor(pool.length * 0.5)
  );

  // Shuffle and select subset
  const selectedResources = rng.shuffle([...pool]).slice(0, resourceCount);

  // Assign abundance (generally lower than planets)
  for (const resourceName of selectedResources) {
    let abundance = rng.randomFloat(MIN_RESOURCE_ABUNDANCE, MAX_RESOURCE_ABUNDANCE);

    // Moons have lower abundance overall
    abundance *= 0.7;

    // Very small moons have even less
    if (moon.radius < 500) { // < 500 km radius
      abundance *= 0.6;
    }

    // Clamp to valid range
    abundance = Math.max(MIN_RESOURCE_ABUNDANCE, Math.min(MAX_RESOURCE_ABUNDANCE, abundance));

    resources[resourceName] = Math.round(abundance * 100) / 100; // Round to 2 decimals
  }

  return resources;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get resource pool for a planet type
 *
 * @param type - Planet type
 * @returns Array of resource names
 */
function getResourcePool(type: PlanetType): readonly string[] {
  switch (type) {
    case PlanetTypeEnum.Rocky:
      return RESOURCE_POOLS.Rocky;
    case PlanetTypeEnum.GasGiant:
      return RESOURCE_POOLS.GasGiant;
    case PlanetTypeEnum.IceGiant:
      return RESOURCE_POOLS.IceGiant;
    case PlanetTypeEnum.Barren:
      return RESOURCE_POOLS.Barren;
    default:
      return RESOURCE_POOLS.Rocky;
  }
}

/**
 * Check if a resource is a metal
 *
 * @param resourceName - Name of resource
 * @returns True if metal
 */
function isMetalResource(resourceName: string): boolean {
  const metals = ['Iron', 'Nickel', 'Aluminum', 'Titanium', 'Rare Earth Metals'];
  return metals.includes(resourceName);
}

/**
 * Check if a resource is a volatile (gas/ice)
 *
 * @param resourceName - Name of resource
 * @returns True if volatile
 */
function isVolatileResource(resourceName: string): boolean {
  const volatiles = [
    'Hydrogen', 'Helium', 'Methane', 'Ammonia', 'Water Ice',
    'Methane Ice', 'Ammonia Ice', 'Nitrogen Ice', 'Water Vapor'
  ];
  return volatiles.includes(resourceName);
}

/**
 * Get total resource richness score for a celestial body
 *
 * Useful for ranking planets/moons by resource value.
 *
 * @param resources - ResourceMap to evaluate
 * @returns Richness score (0.0-10.0)
 */
export function calculateResourceRichness(resources: ResourceMap): number {
  const resourceCount = Object.keys(resources).length;
  const avgAbundance = Object.values(resources).reduce((a, b) => a + b, 0) / (resourceCount || 1);

  // Score combines variety and abundance
  const varietyScore = resourceCount / 10; // Max 10 resources
  const abundanceScore = avgAbundance;

  return Math.min(10, (varietyScore * 5 + abundanceScore * 5));
}

/**
 * Get human-readable description of resources
 *
 * @param resources - ResourceMap to describe
 * @returns Description string
 */
export function describeResources(resources: ResourceMap): string {
  const entries = Object.entries(resources);

  if (entries.length === 0) {
    return 'No significant resources';
  }

  // Sort by abundance
  entries.sort((a, b) => b[1] - a[1]);

  // Take top 3
  const top3 = entries.slice(0, 3);

  const descriptions = top3.map(([name, abundance]) => {
    const level = abundance > 0.7 ? 'Rich' : abundance > 0.4 ? 'Moderate' : 'Trace';
    return `${level} ${name}`;
  });

  return descriptions.join(', ');
}
