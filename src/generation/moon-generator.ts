/**
 * Khora Engine - Moon Generator
 *
 * Procedurally generates moons (natural satellites) for planets.
 * Only large planets have moons, with count and properties scaled by planet mass.
 */

import { SeededRandom } from '../utils/random';
import {
  MIN_PLANET_RADIUS_FOR_MOONS,
  MOON_PROBABILITY,
  MAX_MOONS_PER_PLANET,
  MIN_MOON_ORBIT_KM,
  MAX_MOON_ORBIT_KM
} from '../utils/constants';
import { calculateHillSphere } from '../utils/physics';
import { generateMoonName, generateId } from './name-generator';
import { generateMoonColor } from '../utils/color-palette';
import type { Planet, Moon, MoonVisualProperties } from '../types/celestial-bodies';

// ============================================================================
// Moon Count Determination
// ============================================================================

/**
 * Check if a planet should have moons
 *
 * Criteria:
 * - Planet radius > 0.3 Earth radii (too small = no gravity to capture)
 * - Random 60% chance (even if large enough)
 *
 * @param planet - Parent planet
 * @param rng - Seeded random number generator
 * @returns True if planet should have moons
 */
function shouldHaveMoons(planet: Planet, rng: SeededRandom): boolean {
  // Check minimum size
  if (planet.radius < MIN_PLANET_RADIUS_FOR_MOONS) {
    return false;
  }

  // Gas giants and ice giants ALWAYS have moons (for visibility/gameplay)
  if (planet.type === 'GasGiant' || planet.type === 'IceGiant') {
    return true;
  }

  // Other planets have random chance
  return rng.boolean(MOON_PROBABILITY);
}

/**
 * Calculate number of moons for a planet
 *
 * Larger planets have more moons.
 * Scales by planet mass and radius.
 *
 * @param planet - Parent planet
 * @param rng - Seeded random number generator
 * @returns Number of moons (1-8)
 */
function calculateMoonCount(planet: Planet, rng: SeededRandom): number {
  // Base count scales with planet mass
  let count = 0;

  if (planet.mass > 100) {
    // Gas giants: 4-8 moons
    count = rng.randomInt(4, 8);
  } else if (planet.mass > 10) {
    // Ice giants: 2-6 moons
    count = rng.randomInt(2, 6);
  } else if (planet.mass > 1) {
    // Large rocky planets: 1-3 moons
    count = rng.randomInt(1, 3);
  } else {
    // Small rocky planets: 1-2 moons
    count = rng.randomInt(1, 2);
  }

  // Clamp to maximum
  return Math.min(count, MAX_MOONS_PER_PLANET);
}

// ============================================================================
// Moon Physical Properties
// ============================================================================

/**
 * Generate moon mass and radius based on parent planet
 *
 * Moons are typically 0.1-5% of parent planet mass.
 *
 * @param planet - Parent planet
 * @param rng - Seeded random number generator
 * @returns Mass (in 10^22 kg) and radius (in km)
 */
function generateMoonPhysics(
  planet: Planet,
  rng: SeededRandom
): { mass: number; radius: number } {
  // Generate moon radius directly as percentage of parent planet radius
  // Scale percentage ranges based on planet size (larger planets → smaller percentages)
  const planetRadiusKm = planet.radius * 6371;

  // Determine percentage ranges based on planet size
  // Small planets can have large moons (like Earth's Moon at 27%)
  // Gas giants have proportionally smaller moons (like Jupiter's at 2-4%)
  let tinyRange: [number, number];
  let smallRange: [number, number];
  let largeRange: [number, number];

  if (planetRadiusKm < 19000) {
    // Small planets (<3 Earth radii): Can have large moons like Earth's Moon
    tinyRange = [0.02, 0.08];   // 2-8%
    smallRange = [0.08, 0.18];   // 8-18%
    largeRange = [0.18, 0.30];   // 18-30% (Earth's Moon is 27%)
  } else if (planetRadiusKm < 64000) {
    // Medium planets (3-10 Earth radii): Moderate moon sizes
    tinyRange = [0.01, 0.05];   // 1-5%
    smallRange = [0.05, 0.10];   // 5-10%
    largeRange = [0.10, 0.15];   // 10-15%
  } else {
    // Large gas giants (>10 Earth radii): Small percentage like Jupiter's moons
    tinyRange = [0.005, 0.015]; // 0.5-1.5%
    smallRange = [0.015, 0.03]; // 1.5-3%
    largeRange = [0.03, 0.05];  // 3-5% (like Jupiter's Ganymede at 3.8%)
  }

  // Use power distribution to favor smaller moons with occasional large ones
  const roll = rng.random();
  let radiusPercent: number;

  if (roll < 0.3) {
    // 30% chance: tiny moons
    radiusPercent = rng.randomFloat(tinyRange[0], tinyRange[1]);
  } else if (roll < 0.7) {
    // 40% chance: small moons
    radiusPercent = rng.randomFloat(smallRange[0], smallRange[1]);
  } else {
    // 30% chance: large moons
    radiusPercent = rng.randomFloat(largeRange[0], largeRange[1]);
  }

  // Calculate moon radius from percentage
  let moonRadius = planetRadiusKm * radiusPercent;

  // Minimum moon size (smaller moons are too small to be spherical)
  moonRadius = Math.max(moonRadius, 100);

  // Calculate mass from radius (assuming Earth-like density: 5.51 g/cm³)
  // Volume scales with r³, so mass scales with r³
  const volumeRatio = Math.pow(moonRadius / 1737.4, 3); // Relative to Earth's Moon
  const moonMass = 0.073 * volumeRatio; // Earth's Moon is 0.073 × 10^24 kg
  const moonMassIn1022kg = moonMass * 100; // Convert to 10^22 kg units

  console.log(`[MoonGen] Planet ${planet.name} (${planetRadiusKm.toFixed(0)}km): radiusPercent=${(radiusPercent*100).toFixed(1)}%, moonRadius=${moonRadius.toFixed(0)}km (${((moonRadius/planetRadiusKm)*100).toFixed(1)}% of planet)`);

  return {
    mass: moonMassIn1022kg,
    radius: moonRadius
  };
}

/**
 * Calculate orbital period of moon around planet
 *
 * Uses simplified Kepler's 3rd law for planetary satellites.
 *
 * @param orbitDistance - Distance from planet in km
 * @param planetMass - Planet mass in Earth masses
 * @returns Orbital period in Earth days
 */
function calculateMoonOrbitalPeriod(
  orbitDistance: number,
  planetMass: number
): number {
  // Convert planet mass to kg
  const planetMassKg = planetMass * 5.972e24;

  // Kepler's 3rd law: T^2 = (4π^2 / GM) * a^3
  const G = 6.67430e-11; // Gravitational constant
  const orbitMeters = orbitDistance * 1000;

  const periodSquared = (4 * Math.PI * Math.PI * orbitMeters * orbitMeters * orbitMeters) / (G * planetMassKg);
  const periodSeconds = Math.sqrt(periodSquared);

  // Convert to Earth days
  return periodSeconds / (24 * 60 * 60);
}

// ============================================================================
// Moon Generation
// ============================================================================

/**
 * Generate moons for a planet
 *
 * Creates natural satellites with realistic orbital mechanics.
 * Moons orbit within the planet's Hill sphere (gravitational influence).
 *
 * @param planet - Parent planet
 * @param stellarMass - Mass of parent star (for Hill sphere calculation)
 * @param rng - Seeded random number generator
 * @returns Array of Moon objects
 */
export function generateMoons(
  planet: Planet,
  stellarMass: number,
  rng: SeededRandom
): Moon[] {
  // Check if planet should have moons
  if (!shouldHaveMoons(planet, rng)) {
    return [];
  }

  const moons: Moon[] = [];
  const count = calculateMoonCount(planet, rng);

  // Calculate Hill sphere (maximum stable orbit distance)
  const hillSphere = calculateHillSphere(planet.mass, stellarMass, planet.orbitDistance);
  const hillSphereKm = hillSphere * 149597870.7; // AU to km

  // Scale moon orbits based on PLANET RADIUS for visual coherence
  // Moons should orbit 3-8× planet radius (tight clustering for visibility)
  const planetRadiusKm = planet.radius * 6371; // Earth radii to km

  // Generate each moon
  for (let i = 0; i < count; i++) {
    // Generate physical properties FIRST (we need moon radius for orbit calculation)
    const { mass, radius } = generateMoonPhysics(planet, rng);

    // Calculate Roche limit (minimum safe orbit to avoid tidal destruction)
    // Roche limit ≈ 2.46 × planet_radius × (planet_density / moon_density)^(1/3)
    // Assuming similar densities, simplified to ~2.5× planet radius
    const rocheLimit = planetRadiusKm * 2.5;

    // CRITICAL: Minimum orbit must clear both planet surface AND moon radius
    // Distance from planet CENTER = planet radius + gap + moon radius
    const minGap = planetRadiusKm * 0.5; // Safety gap (50% of planet radius)
    const minOrbitFromCenter = planetRadiusKm + minGap + radius;

    // Use the larger of Roche limit or surface clearance
    const minOrbitKm = Math.max(rocheLimit, minOrbitFromCenter);
    const maxOrbitKm = Math.min(planetRadiusKm * 8, hillSphereKm / 3, MAX_MOON_ORBIT_KM);

    // Orbital distance from planet CENTER (this is key!)
    let orbitDistance: number;

    if (i === 0) {
      // First moon: close but safe orbit
      orbitDistance = rng.randomFloat(minOrbitKm, minOrbitKm * 1.3);
    } else {
      // Subsequent moons: spaced out with collision prevention
      const prevMoon = moons[i - 1];
      const prevMoonRadius = prevMoon.radius;

      // Minimum spacing: previous moon orbit + prev moon radius + gap + current moon radius
      const minSpacing = prevMoon.orbitDistance + prevMoonRadius + minGap + radius;

      // Add extra spacing for visual clarity
      orbitDistance = minSpacing * rng.randomFloat(1.1, 1.3);
    }

    // Ensure within safe limits
    orbitDistance = Math.min(orbitDistance, maxOrbitKm);
    orbitDistance = Math.max(orbitDistance, minOrbitKm);

    // Calculate orbital period
    const orbitalPeriod = calculateMoonOrbitalPeriod(orbitDistance, planet.mass);

    // Rotation period (most moons are tidally locked)
    const tidallyLocked = rng.boolean(0.8); // 80% chance
    const rotationPeriod = tidallyLocked
      ? orbitalPeriod
      : rng.randomFloat(orbitalPeriod * 0.1, orbitalPeriod * 0.5);

    // Surface temperature (similar to planet, slightly affected by tidal heating)
    const tidalHeating = (orbitDistance < MIN_MOON_ORBIT_KM * 5) ? rng.randomFloat(10, 50) : 0;
    const surfaceTemperature = planet.surfaceTemperature + tidalHeating;

    // Generate name
    const name = generateMoonName(planet.name, i, rng);

    // Generate visual properties
    const baseColor = generateMoonColor(rng, surfaceTemperature);
    const visualProperties: MoonVisualProperties = {
      baseColor: [baseColor.r, baseColor.g, baseColor.b],
      terrainRoughness: rng.randomFloat(0.7, 1.4), // Crater patterns variation
    };

    // Icy moons (very cold, <150K) have ice
    if (surfaceTemperature < 150) {
      visualProperties.hasIce = true;
      // Ice is slightly lighter than base color
      visualProperties.iceColor = [
        Math.min(baseColor.r + 0.1, 0.65),
        Math.min(baseColor.g + 0.1, 0.65),
        Math.min(baseColor.b + 0.1, 0.65)
      ];
    }

    // Create moon object
    const moon: Moon = {
      id: generateId('moon', parseInt(planet.id.split('-')[1]), parseInt(planet.id.split('-')[2]) * 100 + i),
      name,
      orbitDistance,
      orbitalPeriod,
      rotationPeriod,
      radius,
      mass,
      surfaceTemperature,
      visualProperties,
      resources: {} // Will be populated by resource distributor
    };

    moons.push(moon);
  }

  return moons;
}

/**
 * Get a human-readable description of a moon
 *
 * @param moon - Moon to describe
 * @param planet - Parent planet
 * @returns Description string
 */
export function describeMoon(moon: Moon, planet: Planet): string {
  const orbitDays = moon.orbitalPeriod.toFixed(1);
  const radiusKm = moon.radius.toFixed(0);
  const tidallyLocked = Math.abs(moon.orbitalPeriod - moon.rotationPeriod) < 0.1;

  let desc = `${moon.name}: ${radiusKm} km radius, orbits ${planet.name} in ${orbitDays} days`;

  if (tidallyLocked) {
    desc += ' [tidally locked]';
  }

  return desc;
}
