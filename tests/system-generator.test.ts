import { describe, expect, it } from 'vitest';
import { generateSystem } from '../src/generation/system-generator';
import type { StarSystem } from '../src/types/celestial-bodies';

function canonicalize(system: StarSystem): Omit<StarSystem, 'generatedAt'> {
  const { generatedAt, ...canonical } = system;
  void generatedAt;
  return canonical;
}

describe('generateSystem', () => {
  it.each([1, 42, 777, 12345, 99999])(
    'produces identical canonical output for seed %i',
    (seed) => {
      expect(canonicalize(generateSystem(seed))).toEqual(canonicalize(generateSystem(seed)));
    },
  );

  it.each([1, 42, 777, 12345, 99999])(
    'generates complete, finite orbit contracts for seed %i',
    (seed) => {
      const system = generateSystem(seed);

      for (const planet of system.star.planets) {
        expect(planet.generatedOrbit).toMatchObject({
          parentId: system.star.id,
          parentType: 'star',
          distanceUnit: 'AU',
          semiMajorAxis: planet.orbitDistance,
          orbitalPeriod: planet.orbitalPeriod,
        });
        expect(Number.isFinite(planet.orbitDistance)).toBe(true);
        expect(Number.isFinite(planet.orbitalPeriod)).toBe(true);
        expect(planet.orbitDistance).toBeGreaterThan(0);
        expect(planet.orbitalPeriod).toBeGreaterThan(0);

        for (const moon of planet.moons) {
          expect(moon.generatedOrbit).toMatchObject({
            parentId: planet.id,
            parentType: 'planet',
            distanceUnit: 'km',
            semiMajorAxis: moon.orbitDistance,
            orbitalPeriod: moon.orbitalPeriod,
          });
          expect(Number.isFinite(moon.orbitDistance)).toBe(true);
          expect(Number.isFinite(moon.orbitalPeriod)).toBe(true);
          expect(moon.orbitDistance).toBeGreaterThan(0);
          expect(moon.orbitalPeriod).toBeGreaterThan(0);
        }
      }
    },
  );
});
