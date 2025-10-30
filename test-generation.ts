/**
 * Khora Engine - Generation Testing
 *
 * Tests deterministic generation with known seeds.
 * Run with: npx tsx test-generation.ts
 */

import { SeededRandom } from './src/utils/random';
import { generateStar } from './src/generation/star-generator';
import { generatePlanets } from './src/generation/planet-generator';
import { generateMoons } from './src/generation/moon-generator';
import { distributePlanetResources, distributeMoonResources } from './src/generation/resource-distributor';
import type { StarSystem } from './src/types/celestial-bodies';

/**
 * Generate a complete star system
 */
function generateSystem(seed: number): StarSystem {
  const rng = new SeededRandom(seed);

  // Generate star
  const star = generateStar(seed);

  // Generate planets
  star.planets = generatePlanets(star, rng);

  // Generate moons and resources for each planet
  star.planets.forEach(planet => {
    planet.moons = generateMoons(planet, star.mass, rng);
    planet.resources = distributePlanetResources(planet, rng);

    planet.moons.forEach(moon => {
      moon.resources = distributeMoonResources(moon, planet, rng);
    });
  });

  return {
    id: `system-${seed}`,
    name: star.name,
    seed,
    star,
    generatedAt: new Date()
  };
}

/**
 * Test determinism: same seed produces identical results
 */
function testDeterminism(seed: number) {
  console.log(`\n=== Testing Determinism (Seed: ${seed}) ===`);

  const system1 = generateSystem(seed);
  const system2 = generateSystem(seed);

  // Compare key properties
  const checks = [
    ['Star name', system1.star.name, system2.star.name],
    ['Star type', system1.star.spectralType, system2.star.spectralType],
    ['Star mass', system1.star.mass, system2.star.mass],
    ['Star radius', system1.star.radius, system2.star.radius],
    ['Planet count', system1.star.planets.length, system2.star.planets.length],
  ];

  let passed = true;
  checks.forEach(([label, val1, val2]) => {
    const match = val1 === val2;
    console.log(`  ${match ? '✓' : '✗'} ${label}: ${val1} ${match ? '=' : '≠'} ${val2}`);
    if (!match) passed = false;
  });

  // Check first planet if exists
  if (system1.star.planets.length > 0) {
    const p1 = system1.star.planets[0];
    const p2 = system2.star.planets[0];

    const planetChecks = [
      ['Planet 1 name', p1.name, p2.name],
      ['Planet 1 type', p1.type, p2.type],
      ['Planet 1 orbit', p1.orbitDistance, p2.orbitDistance],
      ['Planet 1 moon count', p1.moons.length, p2.moons.length],
    ];

    planetChecks.forEach(([label, val1, val2]) => {
      const match = val1 === val2;
      console.log(`  ${match ? '✓' : '✗'} ${label}: ${val1} ${match ? '=' : '≠'} ${val2}`);
      if (!match) passed = false;
    });
  }

  return passed;
}

/**
 * Display system summary
 */
function displaySystem(system: StarSystem) {
  console.log(`\n=== System: ${system.name} (Seed: ${system.seed}) ===`);
  console.log(`Star: ${system.star.name}`);
  console.log(`  Type: ${system.star.spectralType}-type ${system.star.evolutionaryStage}`);
  console.log(`  Mass: ${system.star.mass.toFixed(2)} M☉`);
  console.log(`  Radius: ${system.star.radius.toFixed(2)} R☉`);
  console.log(`  Temperature: ${system.star.temperature.toFixed(0)}K`);
  console.log(`  Luminosity: ${system.star.luminosity.toFixed(3)} L☉`);
  console.log(`  Habitable Zone: ${system.star.habitableZone.inner.toFixed(2)} - ${system.star.habitableZone.outer.toFixed(2)} AU`);

  console.log(`\nPlanets (${system.star.planets.length}):`);
  system.star.planets.forEach((planet, i) => {
    const tempC = (planet.surfaceTemperature - 273.15).toFixed(0);
    const inHZ = planet.orbitDistance >= system.star.habitableZone.inner &&
                 planet.orbitDistance <= system.star.habitableZone.outer;
    const waterStr = planet.waterCoverage > 0 ? ` [${(planet.waterCoverage * 100).toFixed(0)}% water]` : '';
    const atmStr = planet.atmosphere.breathable ? ' [breathable]' : planet.atmosphere.present ? ' [atmosphere]' : '';
    const hzStr = inHZ ? ' 🌍 IN HABITABLE ZONE' : '';

    console.log(`  ${i + 1}. ${planet.name}`);
    console.log(`     Type: ${planet.type} | Orbit: ${planet.orbitDistance.toFixed(2)} AU | Temp: ${tempC}°C${waterStr}${atmStr}${hzStr}`);
    console.log(`     Mass: ${planet.mass.toFixed(2)} M⊕ | Radius: ${planet.radius.toFixed(2)} R⊕`);

    if (planet.moons.length > 0) {
      console.log(`     Moons: ${planet.moons.length}`);
      planet.moons.forEach((moon, j) => {
        console.log(`       - ${moon.name} (${moon.radius.toFixed(0)} km, ${moon.orbitDistance.toFixed(0)} km orbit)`);
      });
    }

    const resourceCount = Object.keys(planet.resources).length;
    if (resourceCount > 0) {
      const top3 = Object.entries(planet.resources)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, abundance]) => `${name} (${(abundance * 100).toFixed(0)}%)`)
        .join(', ');
      console.log(`     Resources (${resourceCount}): ${top3}`);
    }
  });
}

/**
 * Main test runner
 */
function main() {
  console.log('Khora Engine - Generation Testing');
  console.log('==================================\n');

  // Test known seeds
  const seeds = [12345, 99999, 42];

  // Test determinism
  console.log('Testing deterministic generation...');
  const results = seeds.map(seed => testDeterminism(seed));

  const allPassed = results.every(r => r);
  console.log(`\n${allPassed ? '✓ All determinism tests PASSED' : '✗ Some determinism tests FAILED'}`);

  // Generate and display a few example systems
  console.log('\n\n=== Example Systems ===');

  seeds.forEach(seed => {
    const system = generateSystem(seed);
    displaySystem(system);
  });

  // Statistics
  console.log('\n\n=== Generation Statistics (1000 samples) ===');
  const spectralCounts: Record<string, number> = {};
  let habitablePlanetCount = 0;
  let totalPlanets = 0;
  let totalMoons = 0;

  for (let i = 0; i < 1000; i++) {
    const system = generateSystem(i);

    // Count spectral types
    spectralCounts[system.star.spectralType] = (spectralCounts[system.star.spectralType] || 0) + 1;

    // Count planets and moons
    totalPlanets += system.star.planets.length;
    system.star.planets.forEach(planet => {
      totalMoons += planet.moons.length;

      const inHZ = planet.orbitDistance >= system.star.habitableZone.inner &&
                   planet.orbitDistance <= system.star.habitableZone.outer;
      if (inHZ && planet.type === 'Rocky' && planet.atmosphere.present) {
        habitablePlanetCount++;
      }
    });
  }

  console.log('\nSpectral Type Distribution:');
  ['O', 'B', 'A', 'F', 'G', 'K', 'M'].forEach(type => {
    const count = spectralCounts[type] || 0;
    const percent = (count / 1000 * 100).toFixed(2);
    const bar = '█'.repeat(Math.floor(count / 10));
    console.log(`  ${type}: ${percent}% (${count}) ${bar}`);
  });

  console.log(`\nAverage planets per system: ${(totalPlanets / 1000).toFixed(2)}`);
  console.log(`Average moons per system: ${(totalMoons / 1000).toFixed(2)}`);
  console.log(`Potentially habitable planets: ${habitablePlanetCount} (${(habitablePlanetCount / totalPlanets * 100).toFixed(2)}% of all planets)`);

  console.log('\n✓ Generation testing complete!');
}

main();
