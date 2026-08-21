import { describe, expect, it } from 'vitest';
import { resolveMeanAnomaly, sampleOrbitPosition, solveEccentricAnomaly } from '../src/orbits/orbit-solver';
import type { OrbitalElements } from '../src/types/celestial-bodies';

function createOrbit(overrides: Partial<OrbitalElements> = {}): OrbitalElements {
  return {
    parentId: 'star-1',
    parentType: 'star',
    semiMajorAxis: 10,
    eccentricity: 0,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomalyAtEpoch: 0,
    orbitalPeriod: 100,
    epoch: 0,
    rotationDirection: 'prograde',
    distanceUnit: 'AU',
    ...overrides,
  };
}

function expectPositionsClose(
  first: ReturnType<typeof sampleOrbitPosition>,
  second: ReturnType<typeof sampleOrbitPosition>,
): void {
  expect(first.localPosition.x).toBeCloseTo(second.localPosition.x, 10);
  expect(first.localPosition.y).toBeCloseTo(second.localPosition.y, 10);
  expect(first.localPosition.z).toBeCloseTo(second.localPosition.z, 10);
  expect(first.radius).toBeCloseTo(second.radius, 10);
}

describe('orbit solver', () => {
  it('samples the expected circular-orbit epoch position', () => {
    const sample = sampleOrbitPosition(createOrbit(), 0);

    expect(sample.localPosition.x).toBeCloseTo(10, 10);
    expect(sample.localPosition.y).toBeCloseTo(0, 10);
    expect(sample.localPosition.z).toBeCloseTo(0, 10);
    expect(sample.radius).toBeCloseTo(10, 10);
  });

  it('returns to the same position after one complete period', () => {
    const orbit = createOrbit({ eccentricity: 0.2, inclination: 12 });

    expectPositionsClose(sampleOrbitPosition(orbit, 0), sampleOrbitPosition(orbit, 100));
  });

  it('reverses anomaly progression for retrograde motion', () => {
    const prograde = createOrbit({ rotationDirection: 'prograde' });
    const retrograde = createOrbit({ rotationDirection: 'retrograde' });

    expect(resolveMeanAnomaly(prograde, 25)).toBeCloseTo(Math.PI / 2, 10);
    expect(resolveMeanAnomaly(retrograde, 25)).toBeCloseTo((Math.PI * 3) / 2, 10);

    const progradeSample = sampleOrbitPosition(prograde, 25);
    const retrogradeSample = sampleOrbitPosition(retrograde, 25);
    expect(progradeSample.localPosition.z).toBeCloseTo(-retrogradeSample.localPosition.z, 10);
  });

  it('produces finite output for inclined, oriented, high-eccentricity orbits', () => {
    const sample = sampleOrbitPosition(
      createOrbit({
        eccentricity: 0.95,
        inclination: 47,
        longitudeOfAscendingNode: 123,
        argumentOfPeriapsis: 281,
        meanAnomalyAtEpoch: 1.25,
      }),
      31.5,
    );

    const values = [
      sample.localPosition.x,
      sample.localPosition.y,
      sample.localPosition.z,
      sample.radius,
      sample.meanAnomaly,
      sample.trueAnomaly,
    ];

    expect(values.every(Number.isFinite)).toBe(true);
    expect(sample.radius).toBeGreaterThan(0);
  });

  it('solves Kepler equation within a small residual', () => {
    const meanAnomaly = 2.1;
    const eccentricity = 0.7;
    const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, eccentricity);
    const residual = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly;

    expect(Math.abs(residual)).toBeLessThan(1e-10);
  });
});
