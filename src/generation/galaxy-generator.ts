/**
 * Khora Engine - Galaxy Generation Algorithm
 *
 * Phase 2: Procedural galaxy generation with multiple star systems
 * Supports spiral, elliptical, and irregular galaxy types
 */

import { SeededRandom } from '../utils/random';
import { generateSystem } from './system-generator';
import { GalaxyType, SpiralArmCount, distanceBetweenPositions } from '../types/galaxy';
import type {
  Galaxy,
  GalaxyGenerationParams,
  GalacticPosition,
  GalaxySystemPlacement,
  SpiralGalaxyParams,
  EllipticalGalaxyParams,
  IrregularGalaxyParams,
} from '../types/galaxy';

/**
 * Default galaxy generation parameters
 */
const DEFAULT_PARAMS: Required<GalaxyGenerationParams> = {
  seed: 0,
  systemCount: 12,
  preferredType: undefined as any,
  minSystemDistance: 25, // Light-years
};

/**
 * Main galaxy generation function
 * Creates a complete galaxy with multiple star systems
 */
export function generateGalaxy(params: GalaxyGenerationParams): Galaxy {
  const fullParams = { ...DEFAULT_PARAMS, ...params };
  const rng = new SeededRandom(fullParams.seed);

  // Step 1: Determine galaxy type
  const galaxyType = fullParams.preferredType || rollGalaxyType(rng);

  // Step 2: Generate galaxy parameters based on type
  let spiralParams: SpiralGalaxyParams | undefined;
  let ellipticalParams: EllipticalGalaxyParams | undefined;
  let irregularParams: IrregularGalaxyParams | undefined;

  switch (galaxyType) {
    case GalaxyType.Spiral:
      spiralParams = generateSpiralParams(rng);
      break;
    case GalaxyType.Elliptical:
      ellipticalParams = generateEllipticalParams(rng);
      break;
    case GalaxyType.Irregular:
      irregularParams = generateIrregularParams(rng);
      break;
  }

  // Step 3: Determine actual system count (with some variation)
  const systemCount = fullParams.systemCount + rng.randomInt(-2, 2);

  // Step 4: Generate star systems
  const systems = generateGalaxySystems(
    systemCount,
    galaxyType,
    { spiralParams, ellipticalParams, irregularParams },
    fullParams.minSystemDistance,
    rng
  );

  // Step 5: Generate galaxy age (affects star population)
  const age = rng.random() * 12 + 2; // 2-14 billion years

  return {
    id: `galaxy-${fullParams.seed}`,
    name: generateGalaxyName(rng),
    seed: fullParams.seed,
    type: galaxyType,
    spiralParams,
    ellipticalParams,
    irregularParams,
    systems,
    systemCount: systems.length,
    generatedAt: new Date(),
    age,
  };
}

/**
 * Roll galaxy type based on real-universe distribution
 * Spiral: 60%, Elliptical: 30%, Irregular: 10%
 */
function rollGalaxyType(rng: SeededRandom): GalaxyType {
  const roll = rng.random();

  if (roll < 0.60) return GalaxyType.Spiral;
  if (roll < 0.90) return GalaxyType.Elliptical;
  return GalaxyType.Irregular;
}

/**
 * Generate parameters for spiral galaxy
 */
function generateSpiralParams(rng: SeededRandom): SpiralGalaxyParams {
  // Roll number of spiral arms (2-5)
  const armCountRoll = rng.random();
  let armCount: SpiralArmCount;
  if (armCountRoll < 0.40) armCount = SpiralArmCount.Two;       // 40%
  else if (armCountRoll < 0.70) armCount = SpiralArmCount.Three; // 30%
  else if (armCountRoll < 0.90) armCount = SpiralArmCount.Four;  // 20%
  else armCount = SpiralArmCount.Five;                            // 10%

  // Galaxy scale (small to large)
  const scale = rng.random() * 0.6 + 0.7; // 0.7-1.3 multiplier

  return {
    armCount,
    armTightness: rng.random() * 0.5 + 0.3,  // 0.3-0.8 (tighter = more wound)
    armWidth: 15 * scale,                      // 10.5-19.5 light-years
    diskRadius: 100 * scale,                   // 70-130 light-years
    diskThickness: 10 * scale,                 // 7-13 light-years
    bulgeRadius: 20 * scale,                   // 14-26 light-years
    rotationSpeed: (rng.random() * 0.0002 + 0.0001) * (rng.random() < 0.5 ? 1 : -1), // Clockwise or counter-clockwise
  };
}

/**
 * Generate parameters for elliptical galaxy
 */
function generateEllipticalParams(rng: SeededRandom): EllipticalGalaxyParams {
  const scale = rng.random() * 0.6 + 0.7; // 0.7-1.3 multiplier

  // Eccentricity determines how elongated (0=sphere, 1=very flat)
  const eccentricity = rng.random() * 0.7 + 0.1; // 0.1-0.8

  const majorAxis = 120 * scale; // 84-156 light-years
  const minorAxis = majorAxis * (1 - eccentricity);

  return {
    majorAxis,
    minorAxis,
    eccentricity,
    coreRadius: 30 * scale, // 21-39 light-years
  };
}

/**
 * Generate parameters for irregular galaxy
 */
function generateIrregularParams(rng: SeededRandom): IrregularGalaxyParams {
  const scale = rng.random() * 0.6 + 0.7;

  return {
    boundingRadius: 80 * scale,        // 56-104 light-years
    clusterCount: rng.randomInt(3, 6), // 3-6 dense clusters
    dispersalFactor: rng.random() * 0.4 + 0.4, // 0.4-0.8 (higher = more scattered)
  };
}

/**
 * Generate all star systems for the galaxy
 * Positions them according to galaxy type and ensures minimum spacing
 */
function generateGalaxySystems(
  count: number,
  galaxyType: GalaxyType,
  params: {
    spiralParams?: SpiralGalaxyParams;
    ellipticalParams?: EllipticalGalaxyParams;
    irregularParams?: IrregularGalaxyParams;
  },
  minDistance: number,
  rng: SeededRandom
): GalaxySystemPlacement[] {
  const placements: GalaxySystemPlacement[] = [];

  for (let i = 0; i < count; i++) {
    // Generate a unique seed for this star system
    const systemSeed = Math.floor(rng.random() * 1000000);

    // Generate position based on galaxy type
    let position: GalacticPosition;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      position = generateSystemPosition(galaxyType, params, rng);
      attempts++;

      // Check if position is valid (not too close to other systems)
      const isValid = placements.every(
        (placement) => distanceBetweenPositions(position, placement.position) >= minDistance
      );

      if (isValid) break;
      if (attempts >= maxAttempts) {
        console.warn(`Failed to place system ${i} after ${maxAttempts} attempts, using last position`);
        break;
      }
    } while (attempts < maxAttempts);

    // Generate the star system
    const system = generateSystem(systemSeed);

    // Determine region (for categorization)
    const region = determineRegion(position, galaxyType, params);

    placements.push({
      system,
      position,
      region,
    });
  }

  return placements;
}

/**
 * Generate a position for a star system based on galaxy type
 */
function generateSystemPosition(
  galaxyType: GalaxyType,
  params: {
    spiralParams?: SpiralGalaxyParams;
    ellipticalParams?: EllipticalGalaxyParams;
    irregularParams?: IrregularGalaxyParams;
  },
  rng: SeededRandom
): GalacticPosition {
  switch (galaxyType) {
    case GalaxyType.Spiral:
      return generateSpiralPosition(params.spiralParams!, rng);
    case GalaxyType.Elliptical:
      return generateEllipticalPosition(params.ellipticalParams!, rng);
    case GalaxyType.Irregular:
      return generateIrregularPosition(params.irregularParams!, rng);
  }
}

/**
 * Generate position along spiral arms
 * Uses logarithmic spiral: r = a * e^(b*theta)
 */
function generateSpiralPosition(params: SpiralGalaxyParams, rng: SeededRandom): GalacticPosition {
  // Choose a random spiral arm
  const armIndex = rng.randomInt(0, params.armCount - 1);
  const armAngleOffset = (armIndex / params.armCount) * Math.PI * 2;

  // Distance from center (biased toward outer disk)
  const radiusRoll = Math.pow(rng.random(), 0.7); // Power curve for distribution
  const radius = radiusRoll * params.diskRadius;

  // Logarithmic spiral angle
  const theta = armAngleOffset + (radius / params.diskRadius) * Math.PI * 2 * params.armTightness;

  // Add some random deviation from perfect spiral (creates arm width)
  const armDeviation = (rng.random() - 0.5) * params.armWidth;

  // Convert to cartesian coordinates
  const x = Math.cos(theta) * (radius + armDeviation);
  const z = Math.sin(theta) * (radius + armDeviation);

  // Vertical position (thin disk)
  const y = (rng.random() - 0.5) * params.diskThickness * (1 - radius / params.diskRadius); // Thinner at edges

  return { x, y, z };
}

/**
 * Generate position within ellipsoidal distribution
 */
function generateEllipticalPosition(params: EllipticalGalaxyParams, rng: SeededRandom): GalacticPosition {
  // Use rejection sampling for ellipsoidal distribution
  // Density decreases with distance from center (roughly exponential)

  const theta = rng.random() * Math.PI * 2;  // Azimuthal angle
  const phi = rng.random() * Math.PI;         // Polar angle

  // Distance from center (power curve for density distribution)
  const radiusRoll = Math.pow(rng.random(), 1.5); // More stars toward center
  const normalizedRadius = radiusRoll;

  // Scale by axes
  const x = Math.sin(phi) * Math.cos(theta) * params.majorAxis * normalizedRadius;
  const y = Math.cos(phi) * params.minorAxis * normalizedRadius;
  const z = Math.sin(phi) * Math.sin(theta) * params.majorAxis * normalizedRadius;

  return { x, y, z };
}

/**
 * Generate position in irregular, clustered distribution
 */
function generateIrregularPosition(params: IrregularGalaxyParams, rng: SeededRandom): GalacticPosition {
  // Choose a random cluster center
  const clusterIndex = rng.randomInt(0, params.clusterCount - 1);

  // Generate cluster center position (random within bounding radius)
  const clusterTheta = (clusterIndex / params.clusterCount) * Math.PI * 2 + rng.random() * Math.PI * 0.5;
  const clusterRadius = rng.random() * params.boundingRadius * 0.6;

  const clusterX = Math.cos(clusterTheta) * clusterRadius;
  const clusterZ = Math.sin(clusterTheta) * clusterRadius;
  const clusterY = (rng.random() - 0.5) * params.boundingRadius * 0.3;

  // Offset from cluster center (Gaussian-ish distribution)
  const offsetMagnitude = (rng.random() + rng.random() + rng.random()) / 3; // Approximate normal distribution
  const offsetAngle = rng.random() * Math.PI * 2;
  const offsetRadius = offsetMagnitude * params.boundingRadius * params.dispersalFactor * 0.3;

  const x = clusterX + Math.cos(offsetAngle) * offsetRadius;
  const z = clusterZ + Math.sin(offsetAngle) * offsetRadius;
  const y = clusterY + (rng.random() - 0.5) * params.boundingRadius * 0.2;

  return { x, y, z };
}

/**
 * Determine which region of the galaxy a position belongs to
 */
function determineRegion(
  position: GalacticPosition,
  galaxyType: GalaxyType,
  params: {
    spiralParams?: SpiralGalaxyParams;
    ellipticalParams?: EllipticalGalaxyParams;
    irregularParams?: IrregularGalaxyParams;
  }
): string {
  const distance = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);

  switch (galaxyType) {
    case GalaxyType.Spiral: {
      const p = params.spiralParams!;
      if (distance < p.bulgeRadius) return 'bulge';
      if (distance < p.diskRadius * 0.5) return 'inner-disk';
      if (distance < p.diskRadius * 0.8) return 'outer-disk';
      return 'halo';
    }
    case GalaxyType.Elliptical: {
      const p = params.ellipticalParams!;
      if (distance < p.coreRadius) return 'core';
      if (distance < p.majorAxis * 0.5) return 'inner-region';
      return 'outer-region';
    }
    case GalaxyType.Irregular: {
      const p = params.irregularParams!;
      if (distance < p.boundingRadius * 0.3) return 'central-cluster';
      if (distance < p.boundingRadius * 0.6) return 'mid-region';
      return 'outer-region';
    }
  }
}

/**
 * Generate a procedural galaxy name
 */
function generateGalaxyName(rng: SeededRandom): string {
  const prefixes = [
    'NGC', 'Messier', 'Andromeda', 'Triangulum', 'Pinwheel',
    'Sombrero', 'Whirlpool', 'Cartwheel', 'Tadpole', 'Antennae',
    'Sculptor', 'Phoenix', 'Fornax', 'Centaurus', 'Pegasus',
  ];

  const suffixes = [
    'Major', 'Minor', 'Dwarf', 'Prime', 'Alpha',
    'Beta', 'Gamma', 'Delta', 'Nebula', 'Cluster',
  ];

  const useNumber = rng.random() < 0.6;

  if (useNumber) {
    const prefix = rng.choice(prefixes);
    const number = rng.randomInt(1000, 9999);
    return `${prefix} ${number}`;
  } else {
    const prefix = rng.choice(prefixes);
    const suffix = rng.choice(suffixes);
    return `${prefix} ${suffix}`;
  }
}
