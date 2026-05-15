#!/usr/bin/env node
/**
 * Physics Validation Script
 * Validates physics constraints across 100 generated systems
 *
 * Tests:
 * - No planets orbit inside star radius
 * - No moons orbit inside planet radius
 * - All orbital distances are positive
 * - Moon sizes are percentage of parent planet (0.5-30%)
 * - Resource abundances are in valid range (0.0-1.0)
 */

import { generateSystem } from '../src/generation/system-generator.ts';
import { AU_TO_KM, SOLAR_RADIUS_KM, EARTH_RADIUS_KM } from '../src/utils/constants.ts';

console.log('🧪 Physics Validation Test');
console.log('Testing 100 procedurally generated systems...\n');

const violations = [];
let totalSystems = 0;
let totalPlanets = 0;
let totalMoons = 0;

for (let seed = 1; seed <= 100; seed++) {
  try {
    const system = generateSystem(seed);
    totalSystems++;

    const star = system.star;

    // Test each planet
    for (let p = 0; p < star.planets.length; p++) {
      const planet = star.planets[p];
      totalPlanets++;

      // Test 1: Planet must orbit outside star radius
      const starRadiusAU = (star.radius * SOLAR_RADIUS_KM) / AU_TO_KM;
      if (planet.orbitDistance <= starRadiusAU) {
        violations.push({
          seed,
          type: 'PLANET_INSIDE_STAR',
          detail: `Planet ${planet.name} orbits at ${planet.orbitDistance.toFixed(2)} AU, star radius is ${starRadiusAU.toFixed(4)} AU`
        });
      }

      // Test 2: Orbital distance must be positive
      if (planet.orbitDistance <= 0) {
        violations.push({
          seed,
          type: 'INVALID_ORBIT',
          detail: `Planet ${planet.name} has invalid orbit distance: ${planet.orbitDistance}`
        });
      }

      // Test 3: Resource abundances must be 0.0-1.0
      if (planet.resources) {
        for (const [resource, abundance] of Object.entries(planet.resources)) {
          if (abundance < 0 || abundance > 1) {
            violations.push({
              seed,
              type: 'INVALID_RESOURCE',
              detail: `Planet ${planet.name} has invalid ${resource} abundance: ${abundance}`
            });
          }
        }
      }

      // Test each moon
      for (let m = 0; m < planet.moons.length; m++) {
        const moon = planet.moons[m];
        totalMoons++;

        // Test 4: Moon must orbit outside planet radius
        const planetRadiusKM = planet.radius * EARTH_RADIUS_KM; // Earth radii to km
        if (moon.orbitDistanceKM <= planetRadiusKM) {
          violations.push({
            seed,
            type: 'MOON_INSIDE_PLANET',
            detail: `Moon ${moon.name} orbits at ${moon.orbitDistanceKM.toFixed(0)} km, planet radius is ${planetRadiusKM.toFixed(0)} km`
          });
        }

        // Test 5: Moon size must be 0.5-30% of parent planet
        const moonRadiusKM = moon.radius; // Moon radius is already stored in km
        const planetRadiusKM2 = planet.radius * EARTH_RADIUS_KM;
        const percentageOfPlanet = (moonRadiusKM / planetRadiusKM2) * 100;

        if (percentageOfPlanet < 0.5 || percentageOfPlanet > 30) {
          violations.push({
            seed,
            type: 'INVALID_MOON_SIZE',
            detail: `Moon ${moon.name} is ${percentageOfPlanet.toFixed(1)}% of parent planet (expected 0.5-30%)`
          });
        }

        // Test 6: Moon orbital distance must be positive
        if (moon.orbitDistanceKM <= 0) {
          violations.push({
            seed,
            type: 'INVALID_MOON_ORBIT',
            detail: `Moon ${moon.name} has invalid orbit distance: ${moon.orbitDistanceKM}`
          });
        }
      }
    }
  } catch (error) {
    violations.push({
      seed,
      type: 'GENERATION_ERROR',
      detail: error.message
    });
  }
}

// Report results
console.log('📊 Results:');
console.log(`Systems tested: ${totalSystems}`);
console.log(`Planets generated: ${totalPlanets}`);
console.log(`Moons generated: ${totalMoons}`);
console.log(`\nViolations found: ${violations.length}\n`);

if (violations.length > 0) {
  console.log('❌ FAILED - Physics violations detected:\n');

  // Group by type
  const byType = {};
  violations.forEach(v => {
    if (!byType[v.type]) byType[v.type] = [];
    byType[v.type].push(v);
  });

  for (const [type, items] of Object.entries(byType)) {
    console.log(`${type}: ${items.length} violations`);
    items.slice(0, 3).forEach(v => {
      console.log(`  - Seed ${v.seed}: ${v.detail}`);
    });
    if (items.length > 3) {
      console.log(`  ... and ${items.length - 3} more`);
    }
    console.log();
  }

  process.exit(1);
} else {
  console.log('✅ PASSED - All physics constraints satisfied!');
  console.log('\nValidated constraints:');
  console.log('  ✓ No planets orbit inside star');
  console.log('  ✓ No moons orbit inside parent planet');
  console.log('  ✓ All orbital distances are positive');
  console.log('  ✓ Moon sizes are 0.5-30% of parent planet');
  console.log('  ✓ Resource abundances are 0.0-1.0');

  process.exit(0);
}
