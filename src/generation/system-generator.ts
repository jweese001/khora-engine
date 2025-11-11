/**
 * Khora Engine - Star System Generator
 *
 * Wrapper for complete star system generation
 * Used by both Phase 1 (single system) and Phase 2 (galaxy with multiple systems)
 */

import { SeededRandom } from '../utils/random';
import { generateStar } from './star-generator';
import { generatePlanets } from './planet-generator';
import { generateMoons } from './moon-generator';
import { distributePlanetResources, distributeMoonResources } from './resource-distributor';
import type { StarSystem } from '../types/celestial-bodies';

/**
 * Generate a complete star system from seed
 * This is the main entry point for system generation
 *
 * @param seed - Random seed for deterministic generation
 * @returns Complete star system with star, planets, moons, and resources
 */
export function generateSystem(seed: number): StarSystem {
  // Create RNG for this system
  const rng = new SeededRandom(seed);

  // Generate star
  const star = generateStar(seed);

  // Generate planets
  star.planets = generatePlanets(star, rng);

  // Generate moons and resources for each planet
  star.planets.forEach((planet) => {
    // Generate moons
    planet.moons = generateMoons(planet, star.mass, rng);

    // Distribute planet resources
    planet.resources = distributePlanetResources(planet, rng);

    // Distribute moon resources
    planet.moons.forEach(moon => {
      moon.resources = distributeMoonResources(moon, planet, rng);
    });
  });

  // Create complete star system
  const system: StarSystem = {
    id: `system-${seed}`,
    name: star.name,
    seed,
    star,
    generatedAt: new Date()
  };

  return system;
}
