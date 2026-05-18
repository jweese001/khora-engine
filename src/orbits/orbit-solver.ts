import type { OrbitStateSample, OrbitalElements } from '../types/celestial-bodies';

const TAU = Math.PI * 2;
const DEGREES_TO_RADIANS = Math.PI / 180;
const ECCENTRIC_ANOMALY_ITERATIONS = 8;

function normalizeRadians(angle: number): number {
  const normalized = angle % TAU;
  return normalized < 0 ? normalized + TAU : normalized;
}

function toRadians(degrees: number): number {
  return degrees * DEGREES_TO_RADIANS;
}

export function resolveMeanAnomaly(elements: OrbitalElements, simulationTimeDays: number): number {
  if (elements.orbitalPeriod <= 0) {
    return normalizeRadians(elements.meanAnomalyAtEpoch);
  }

  const elapsedDays = simulationTimeDays - elements.epoch;
  const direction = elements.rotationDirection === 'retrograde' ? -1 : 1;
  const meanMotion = TAU / elements.orbitalPeriod;
  return normalizeRadians(elements.meanAnomalyAtEpoch + direction * elapsedDays * meanMotion);
}

export function solveEccentricAnomaly(meanAnomaly: number, eccentricity: number): number {
  if (eccentricity <= 1e-6) {
    return normalizeRadians(meanAnomaly);
  }

  let eccentricAnomaly = eccentricity < 0.8 ? meanAnomaly : Math.PI;

  for (let i = 0; i < ECCENTRIC_ANOMALY_ITERATIONS; i++) {
    const f = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly;
    const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
    eccentricAnomaly -= f / derivative;
  }

  return normalizeRadians(eccentricAnomaly);
}

export function sampleOrbitPosition(elements: OrbitalElements, simulationTimeDays: number): OrbitStateSample {
  const meanAnomaly = resolveMeanAnomaly(elements, simulationTimeDays);
  const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, elements.eccentricity);

  const cosE = Math.cos(eccentricAnomaly);
  const sinE = Math.sin(eccentricAnomaly);
  const radius = elements.semiMajorAxis * (1 - elements.eccentricity * cosE);

  const orbitalPlaneX = elements.semiMajorAxis * (cosE - elements.eccentricity);
  const orbitalPlaneZ = elements.semiMajorAxis * Math.sqrt(1 - elements.eccentricity * elements.eccentricity) * sinE;

  const omega = toRadians(elements.argumentOfPeriapsis);
  const inclination = toRadians(elements.inclination);
  const ascendingNode = toRadians(elements.longitudeOfAscendingNode);

  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);
  const cosI = Math.cos(inclination);
  const sinI = Math.sin(inclination);
  const cosNode = Math.cos(ascendingNode);
  const sinNode = Math.sin(ascendingNode);

  const x1 = orbitalPlaneX * cosOmega - orbitalPlaneZ * sinOmega;
  const z1 = orbitalPlaneX * sinOmega + orbitalPlaneZ * cosOmega;

  const x2 = x1;
  const y2 = -z1 * sinI;
  const z2 = z1 * cosI;

  const x = x2 * cosNode - y2 * sinNode;
  const y = x2 * sinNode + y2 * cosNode;
  const z = z2;

  const trueAnomaly = normalizeRadians(
    2 * Math.atan2(
      Math.sqrt(1 + elements.eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - elements.eccentricity) * Math.cos(eccentricAnomaly / 2)
    )
  );

  return {
    localPosition: { x, y, z },
    radius,
    meanAnomaly,
    trueAnomaly,
  };
}
