#!/usr/bin/env node
/**
 * Physics validation for deterministic star-system generation.
 *
 * Validates physical ranges plus compatibility between legacy orbit fields and
 * the canonical generatedOrbit data used by the runtime orbit solver.
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSystem } from '../src/generation/system-generator.ts';
import { AU_TO_KM, SOLAR_RADIUS_KM, EARTH_RADIUS_KM } from '../src/utils/constants.ts';

const SYSTEM_COUNT = 100;
const RELATIVE_TOLERANCE = 1e-9;

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function approximatelyEqual(left, right) {
  if (!isFiniteNumber(left) || !isFiniteNumber(right)) {
    return false;
  }

  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= RELATIVE_TOLERANCE * scale;
}

function addViolation(violations, seed, type, detail) {
  violations.push({ seed, type, detail });
}

function validatePositiveNumber(value, label, seed, violationType, violations) {
  if (!isFiniteNumber(value) || value <= 0) {
    addViolation(violations, seed, violationType, `${label} must be a finite positive number; received ${String(value)}`);
    return false;
  }

  return true;
}

function validateGeneratedOrbit({
  orbit,
  bodyLabel,
  expectedParentId,
  expectedParentType,
  expectedDistanceUnit,
  expectedDistance,
  expectedPeriod,
  seed,
  violations,
}) {
  if (!orbit || typeof orbit !== 'object') {
    addViolation(violations, seed, 'MISSING_GENERATED_ORBIT', `${bodyLabel} has no generatedOrbit data`);
    return;
  }

  if (orbit.parentId !== expectedParentId) {
    addViolation(
      violations,
      seed,
      'ORBIT_PARENT_MISMATCH',
      `${bodyLabel} orbit parent is ${String(orbit.parentId)}; expected ${expectedParentId}`,
    );
  }

  if (orbit.parentType !== expectedParentType) {
    addViolation(
      violations,
      seed,
      'ORBIT_PARENT_TYPE_MISMATCH',
      `${bodyLabel} orbit parent type is ${String(orbit.parentType)}; expected ${expectedParentType}`,
    );
  }

  if (orbit.distanceUnit !== expectedDistanceUnit) {
    addViolation(
      violations,
      seed,
      'ORBIT_UNIT_MISMATCH',
      `${bodyLabel} orbit unit is ${String(orbit.distanceUnit)}; expected ${expectedDistanceUnit}`,
    );
  }

  const finiteOrbitFields = [
    'semiMajorAxis',
    'eccentricity',
    'inclination',
    'longitudeOfAscendingNode',
    'argumentOfPeriapsis',
    'meanAnomalyAtEpoch',
    'orbitalPeriod',
    'epoch',
  ];

  for (const field of finiteOrbitFields) {
    if (!isFiniteNumber(orbit[field])) {
      addViolation(
        violations,
        seed,
        'INVALID_GENERATED_ORBIT',
        `${bodyLabel} generatedOrbit.${field} must be finite; received ${String(orbit[field])}`,
      );
    }
  }

  if (isFiniteNumber(orbit.eccentricity) && (orbit.eccentricity < 0 || orbit.eccentricity >= 1)) {
    addViolation(
      violations,
      seed,
      'INVALID_ECCENTRICITY',
      `${bodyLabel} eccentricity must be in [0, 1); received ${orbit.eccentricity}`,
    );
  }

  if (!approximatelyEqual(orbit.semiMajorAxis, expectedDistance)) {
    addViolation(
      violations,
      seed,
      'ORBIT_DISTANCE_MISMATCH',
      `${bodyLabel} generated semi-major axis ${String(orbit.semiMajorAxis)} does not match compatibility distance ${String(expectedDistance)}`,
    );
  }

  if (!approximatelyEqual(orbit.orbitalPeriod, expectedPeriod)) {
    addViolation(
      violations,
      seed,
      'ORBIT_PERIOD_MISMATCH',
      `${bodyLabel} generated period ${String(orbit.orbitalPeriod)} does not match compatibility period ${String(expectedPeriod)}`,
    );
  }
}

/**
 * Validate one generated system.
 *
 * @param {ReturnType<typeof generateSystem>} system
 * @param {number} seed
 * @returns {{ violations: Array<{seed: number, type: string, detail: string}>, planets: number, moons: number }}
 */
export function validateSystemPhysics(system, seed) {
  const violations = [];
  let planets = 0;
  let moons = 0;

  const star = system.star;
  const starRadiusAU = (star.radius * SOLAR_RADIUS_KM) / AU_TO_KM;

  for (const planet of star.planets) {
    planets++;
    const planetLabel = `Planet ${planet.name}`;
    const hasValidPlanetDistance = validatePositiveNumber(
      planet.orbitDistance,
      `${planetLabel} orbit distance`,
      seed,
      'INVALID_PLANET_ORBIT',
      violations,
    );

    validatePositiveNumber(
      planet.orbitalPeriod,
      `${planetLabel} orbital period`,
      seed,
      'INVALID_PLANET_PERIOD',
      violations,
    );

    if (hasValidPlanetDistance && planet.orbitDistance <= starRadiusAU) {
      addViolation(
        violations,
        seed,
        'PLANET_INSIDE_STAR',
        `${planetLabel} orbits at ${planet.orbitDistance.toFixed(4)} AU; star radius is ${starRadiusAU.toFixed(4)} AU`,
      );
    }

    validateGeneratedOrbit({
      orbit: planet.generatedOrbit,
      bodyLabel: planetLabel,
      expectedParentId: star.id,
      expectedParentType: 'star',
      expectedDistanceUnit: 'AU',
      expectedDistance: planet.orbitDistance,
      expectedPeriod: planet.orbitalPeriod,
      seed,
      violations,
    });

    for (const [resource, abundance] of Object.entries(planet.resources ?? {})) {
      if (!isFiniteNumber(abundance) || abundance < 0 || abundance > 1) {
        addViolation(
          violations,
          seed,
          'INVALID_RESOURCE',
          `${planetLabel} has invalid ${resource} abundance: ${String(abundance)}`,
        );
      }
    }

    const planetRadiusKM = planet.radius * EARTH_RADIUS_KM;

    for (const moon of planet.moons) {
      moons++;
      const moonLabel = `Moon ${moon.name}`;
      const hasValidMoonDistance = validatePositiveNumber(
        moon.orbitDistance,
        `${moonLabel} orbit distance`,
        seed,
        'INVALID_MOON_ORBIT',
        violations,
      );

      validatePositiveNumber(
        moon.orbitalPeriod,
        `${moonLabel} orbital period`,
        seed,
        'INVALID_MOON_PERIOD',
        violations,
      );

      if (hasValidMoonDistance && moon.orbitDistance <= planetRadiusKM) {
        addViolation(
          violations,
          seed,
          'MOON_INSIDE_PLANET',
          `${moonLabel} orbits at ${moon.orbitDistance.toFixed(0)} km; planet radius is ${planetRadiusKM.toFixed(0)} km`,
        );
      }

      const hasValidMoonRadius = validatePositiveNumber(
        moon.radius,
        `${moonLabel} radius`,
        seed,
        'INVALID_MOON_RADIUS',
        violations,
      );

      if (hasValidMoonRadius && isFiniteNumber(planetRadiusKM) && planetRadiusKM > 0) {
        const percentageOfPlanet = (moon.radius / planetRadiusKM) * 100;
        if (percentageOfPlanet < 0.5 || percentageOfPlanet > 30) {
          addViolation(
            violations,
            seed,
            'INVALID_MOON_SIZE',
            `${moonLabel} is ${percentageOfPlanet.toFixed(1)}% of its parent planet; expected 0.5-30%`,
          );
        }
      }

      validateGeneratedOrbit({
        orbit: moon.generatedOrbit,
        bodyLabel: moonLabel,
        expectedParentId: planet.id,
        expectedParentType: 'planet',
        expectedDistanceUnit: 'km',
        expectedDistance: moon.orbitDistance,
        expectedPeriod: moon.orbitalPeriod,
        seed,
        violations,
      });

      for (const [resource, abundance] of Object.entries(moon.resources ?? {})) {
        if (!isFiniteNumber(abundance) || abundance < 0 || abundance > 1) {
          addViolation(
            violations,
            seed,
            'INVALID_RESOURCE',
            `${moonLabel} has invalid ${resource} abundance: ${String(abundance)}`,
          );
        }
      }
    }
  }

  return { violations, planets, moons };
}

function printViolations(violations) {
  const byType = new Map();

  for (const violation of violations) {
    const items = byType.get(violation.type) ?? [];
    items.push(violation);
    byType.set(violation.type, items);
  }

  for (const [type, items] of byType) {
    console.log(`${type}: ${items.length} violations`);
    for (const violation of items.slice(0, 3)) {
      console.log(`  - Seed ${violation.seed}: ${violation.detail}`);
    }
    if (items.length > 3) {
      console.log(`  ... and ${items.length - 3} more`);
    }
    console.log();
  }
}

function runValidatorSelfTest() {
  for (let seed = 1; seed <= SYSTEM_COUNT; seed++) {
    const system = generateSystem(seed);
    const planetWithMoon = system.star.planets.find((planet) => planet.moons.length > 0);

    if (!planetWithMoon) {
      continue;
    }

    const moon = planetWithMoon.moons[0];
    moon.orbitDistance = Number.NaN;

    const { violations } = validateSystemPhysics(system, seed);
    const detectedInvalidDistance = violations.some(
      (violation) => violation.type === 'INVALID_MOON_ORBIT',
    );

    if (!detectedInvalidDistance) {
      console.error('❌ Validator self-test failed: malformed moon orbit was not detected');
      process.exit(1);
    }

    console.log('✅ Validator self-test passed: malformed moon orbit was detected');
    return;
  }

  console.error('❌ Validator self-test could not find a generated moon to corrupt');
  process.exit(1);
}

function runValidation() {
  console.log('🧪 Physics Validation Test');
  console.log(`Testing ${SYSTEM_COUNT} procedurally generated systems...\n`);

  const violations = [];
  let totalSystems = 0;
  let totalPlanets = 0;
  let totalMoons = 0;

  for (let seed = 1; seed <= SYSTEM_COUNT; seed++) {
    try {
      const result = validateSystemPhysics(generateSystem(seed), seed);
      totalSystems++;
      totalPlanets += result.planets;
      totalMoons += result.moons;
      violations.push(...result.violations);
    } catch (error) {
      addViolation(
        violations,
        seed,
        'GENERATION_ERROR',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.log('📊 Results:');
  console.log(`Systems tested: ${totalSystems}`);
  console.log(`Planets generated: ${totalPlanets}`);
  console.log(`Moons generated: ${totalMoons}`);
  console.log(`Violations found: ${violations.length}\n`);

  if (violations.length > 0) {
    console.log('❌ FAILED - Physics violations detected:\n');
    printViolations(violations);
    process.exit(1);
  }

  console.log('✅ PASSED - All physics constraints satisfied!');
  console.log('\nValidated constraints:');
  console.log('  ✓ Planet and moon orbit values are finite and positive');
  console.log('  ✓ No planets orbit inside their star');
  console.log('  ✓ No moons orbit inside their parent planet');
  console.log('  ✓ Generated orbit parents, units, distances, and periods match body data');
  console.log('  ✓ Generated orbit numeric fields are finite and eccentricities are bounded');
  console.log('  ✓ Moon sizes are 0.5-30% of parent planet radius');
  console.log('  ✓ Planet and moon resource abundances are finite and within 0.0-1.0');
}

const isMainModule = Boolean(
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]),
);

if (isMainModule) {
  if (process.argv.includes('--self-test')) {
    runValidatorSelfTest();
  } else {
    runValidation();
  }
}
