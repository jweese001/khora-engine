/**
 * Khora Engine - Physical Constants and Reference Data
 *
 * All values based on real astrophysics.
 * Units are documented for each constant.
 */

import { SpectralType, EvolutionaryStage } from '../types/celestial-bodies';

// ============================================================================
// Universal Physical Constants
// ============================================================================

/** Astronomical Unit in kilometers */
export const AU_TO_KM = 149_597_870.7;

/** Solar mass in kilograms */
export const SOLAR_MASS_KG = 1.989e30;

/** Solar radius in kilometers */
export const SOLAR_RADIUS_KM = 695_700;

/** Solar luminosity in watts */
export const SOLAR_LUMINOSITY_W = 3.828e26;

/** Earth mass in kilograms */
export const EARTH_MASS_KG = 5.972e24;

/** Earth radius in kilometers */
export const EARTH_RADIUS_KM = 6_371;

/** Gravitational constant (m^3 kg^-1 s^-2) */
export const G = 6.67430e-11;

/** Speed of light in vacuum (m/s) */
export const SPEED_OF_LIGHT = 299_792_458;

/** Stefan-Boltzmann constant (W m^-2 K^-4) */
export const STEFAN_BOLTZMANN = 5.670374419e-8;

// ============================================================================
// Stellar Classification - Spectral Type Properties
// ============================================================================

/**
 * Property ranges for main sequence stars by spectral type
 * Source: Modern astrophysics data (Habets & Heintze 1981, Cox 2000)
 */
export const SPECTRAL_TYPE_PROPERTIES = {
  [SpectralType.O]: {
    mass: { min: 16, max: 90 },        // Solar masses
    radius: { min: 6.6, max: 15 },     // Solar radii
    temperature: { min: 30_000, max: 50_000 }, // Kelvin
    luminosity: { min: 30_000, max: 1_000_000 }, // Solar luminosities
    color: { r: 0.6, g: 0.7, b: 1.0 }, // RGB color (blue)
    lifespan: { min: 1, max: 10 }      // Million years
  },
  [SpectralType.B]: {
    mass: { min: 2.1, max: 16 },
    radius: { min: 1.8, max: 6.6 },
    temperature: { min: 10_000, max: 30_000 },
    luminosity: { min: 25, max: 30_000 },
    color: { r: 0.7, g: 0.8, b: 1.0 }, // Blue-white
    lifespan: { min: 10, max: 400 }
  },
  [SpectralType.A]: {
    mass: { min: 1.4, max: 2.1 },
    radius: { min: 1.4, max: 1.8 },
    temperature: { min: 7_500, max: 10_000 },
    luminosity: { min: 5, max: 25 },
    color: { r: 0.9, g: 0.95, b: 1.0 }, // White
    lifespan: { min: 400, max: 3_000 }
  },
  [SpectralType.F]: {
    mass: { min: 1.04, max: 1.4 },
    radius: { min: 1.15, max: 1.4 },
    temperature: { min: 6_000, max: 7_500 },
    luminosity: { min: 1.5, max: 5 },
    color: { r: 1.0, g: 0.98, b: 0.9 }, // Yellow-white
    lifespan: { min: 3_000, max: 7_000 }
  },
  [SpectralType.G]: {
    mass: { min: 0.8, max: 1.04 },
    radius: { min: 0.96, max: 1.15 },
    temperature: { min: 5_200, max: 6_000 },
    luminosity: { min: 0.6, max: 1.5 },
    color: { r: 1.0, g: 0.95, b: 0.7 }, // Yellow (Sun-like)
    lifespan: { min: 7_000, max: 15_000 }
  },
  [SpectralType.K]: {
    mass: { min: 0.45, max: 0.8 },
    radius: { min: 0.7, max: 0.96 },
    temperature: { min: 3_700, max: 5_200 },
    luminosity: { min: 0.08, max: 0.6 },
    color: { r: 1.0, g: 0.7, b: 0.4 }, // Orange
    lifespan: { min: 15_000, max: 30_000 }
  },
  [SpectralType.M]: {
    mass: { min: 0.08, max: 0.45 },
    radius: { min: 0.1, max: 0.7 },
    temperature: { min: 2_400, max: 3_700 },
    luminosity: { min: 0.0001, max: 0.08 },
    color: { r: 1.0, g: 0.5, b: 0.2 }, // Red
    lifespan: { min: 30_000, max: 100_000 } // Trillion years (approximate)
  }
} as const;

// ============================================================================
// Stellar Classification - Probability Distribution
// ============================================================================

/**
 * Spectral type probability distribution (Main Sequence only)
 * Based on observed stellar populations in the Milky Way
 * Source: Henry et al. 2006, Kroupa 2001 (IMF)
 *
 * Cumulative probabilities for weighted random selection:
 * - M-type: 76.45% (most common - red dwarfs)
 * - K-type: 12.1%
 * - G-type: 7.6% (Sun-like)
 * - F-type: 3.0%
 * - A-type: 0.6%
 * - B-type: 0.13%
 * - O-type: 0.00003% (extremely rare)
 */
export const SPECTRAL_TYPE_PROBABILITIES: Array<[SpectralType, number]> = [
  [SpectralType.M, 0.7645],  // 76.45%
  [SpectralType.K, 0.121],   // 12.1%
  [SpectralType.G, 0.076],   // 7.6%
  [SpectralType.F, 0.030],   // 3.0%
  [SpectralType.A, 0.006],   // 0.6%
  [SpectralType.B, 0.0013],  // 0.13%
  [SpectralType.O, 0.0000003] // 0.00003%
];

// ============================================================================
// Evolutionary Stage Probabilities
// ============================================================================

/**
 * Evolutionary stage distribution for generated stars
 * Most stars spend majority of lifetime on Main Sequence
 */
export const EVOLUTIONARY_STAGE_PROBABILITIES: Array<[EvolutionaryStage, number]> = [
  [EvolutionaryStage.MainSequence, 0.90], // 90% - stable hydrogen fusion
  [EvolutionaryStage.RedGiant, 0.08],     // 8% - expanded phase
  [EvolutionaryStage.WhiteDwarf, 0.02]    // 2% - stellar remnant
];

// ============================================================================
// Planetary System Generation Constants
// ============================================================================

/** Minimum number of planets in a system */
export const MIN_PLANETS = 2;

/** Maximum number of planets in a system */
export const MAX_PLANETS = 12;

/** Typical number of planets (weighted average) */
export const TYPICAL_PLANETS = 6;

/**
 * Titius-Bode law base parameters
 * Used for semi-realistic orbital spacing
 * d = a + b * 2^n where n = 0, 1, 2, 3...
 */
export const TITIUS_BODE_A = 0.4; // AU
export const TITIUS_BODE_B = 0.3; // AU

/**
 * Frost line distance multiplier
 * Distance beyond which volatiles can condense (ice formation)
 * Typically ~2.7 AU for Sun-like stars, scales with luminosity
 */
export const FROST_LINE_BASE = 2.7; // AU for 1 solar luminosity

/**
 * Planet type probability by distance from star
 * Format: [Rocky, GasGiant, IceGiant, Barren]
 */
export const PLANET_TYPE_BY_DISTANCE = {
  inner: [0.6, 0.0, 0.0, 0.4],    // < 0.8 AU - Rocky or Barren (hot)
  habitable: [0.8, 0.0, 0.0, 0.2], // 0.8-2.0 AU - Mostly rocky
  middle: [0.1, 0.7, 0.2, 0.0],    // 2.0-5.0 AU - Gas giants form
  outer: [0.0, 0.3, 0.6, 0.1]      // > 5.0 AU - Ice giants dominate
} as const;

// ============================================================================
// Moon Generation Constants
// ============================================================================

/** Minimum planet radius (Earth radii) to have moons */
export const MIN_PLANET_RADIUS_FOR_MOONS = 0.3;

/** Maximum moons per planet */
export const MAX_MOONS_PER_PLANET = 8;

/** Probability of a planet having moons (if large enough) */
export const MOON_PROBABILITY = 0.6; // 60%

/** Minimum moon orbital distance from planet surface (km) */
export const MIN_MOON_ORBIT_KM = 2_000;

/** Maximum moon orbital distance from planet surface (km) */
// Set high enough for large gas giants (which can be 50,000+ km radius)
// Moons need to orbit outside the planet's physical body!
// Our Moon orbits at 384,400 km, use that as a reasonable max
export const MAX_MOON_ORBIT_KM = 500_000;

// ============================================================================
// Atmosphere Generation Constants
// ============================================================================

/**
 * Minimum planet mass (Earth masses) to retain atmosphere
 * Below this threshold, solar wind strips atmosphere
 */
export const MIN_MASS_FOR_ATMOSPHERE = 0.1;

/**
 * Probability rocky planet has atmosphere (if massive enough)
 */
export const ROCKY_ATMOSPHERE_PROBABILITY = 0.3; // 30%

/**
 * Gas giants and ice giants ALWAYS have atmospheres
 */

// ============================================================================
// Resource Distribution Constants
// ============================================================================

/**
 * Resource pools by planet type
 * Resources are assigned based on formation conditions
 */
export const RESOURCE_POOLS = {
  Rocky: [
    'Iron', 'Nickel', 'Silicon', 'Magnesium', 'Aluminum',
    'Titanium', 'Carbon', 'Sulfur', 'Rare Earth Metals'
  ],
  GasGiant: [
    'Hydrogen', 'Helium', 'Methane', 'Ammonia', 'Water Vapor',
    'Phosphine', 'Deuterium'
  ],
  IceGiant: [
    'Water Ice', 'Methane Ice', 'Ammonia Ice', 'Nitrogen Ice',
    'Carbon Dioxide Ice', 'Methane', 'Hydrogen'
  ],
  Barren: [
    'Iron', 'Nickel', 'Silicon', 'Basalt', 'Regolith'
  ]
} as const;

/** Minimum resource abundance value (0.0-1.0) */
export const MIN_RESOURCE_ABUNDANCE = 0.1;

/** Maximum resource abundance value (0.0-1.0) */
export const MAX_RESOURCE_ABUNDANCE = 1.0;

// ============================================================================
// Rendering Constants (Three.js)
// ============================================================================

/**
 * Scale factor for converting AU to Three.js scene units
 * 1 AU = 50 scene units (adjusted for visual clarity)
 */
export const AU_TO_SCENE_UNITS = 50;

/**
 * Scale factor for stellar radii to scene units
 * Visual scaling for proper appearance
 */
export const STELLAR_RADIUS_TO_SCENE_UNITS = 5;

/**
 * Scale factor for planetary radii to scene units
 */
export const PLANETARY_RADIUS_TO_SCENE_UNITS = 2;

/**
 * LOD (Level of Detail) distance thresholds
 * Distances in scene units from camera
 *
 * Updated for maximum visual quality
 */
export const LOD_LEVELS = {
  HIGH: 0,      // 0-75 units: High detail (subdivision 6, 81,920 triangles)
  MEDIUM: 75,   // 75-250 units: Medium detail (subdivision 4, 5,120 triangles)
  LOW: 250      // 250+ units: Low detail (subdivision 2, 320 triangles)
} as const;

/**
 * Target frame rate for performance optimization
 */
export const TARGET_FPS = 60;

/**
 * Maximum frame time in milliseconds (1000ms / 60fps)
 */
export const MAX_FRAME_TIME_MS = 1000 / TARGET_FPS;

// ============================================================================
// Shader Constants
// ============================================================================

/**
 * Number of noise octaves for procedural terrain generation
 * Higher = more detail but slower performance
 */
export const TERRAIN_NOISE_OCTAVES = 3;

/**
 * Water coverage threshold for ocean rendering
 * Planets with waterCoverage > this value show blue oceans
 */
export const WATER_THRESHOLD = 0.3;

/**
 * Atmosphere glow intensity multiplier
 */
export const ATMOSPHERE_GLOW_STRENGTH = 0.5;

/**
 * Star bloom effect parameters
 */
export const BLOOM_PARAMS = {
  strength: 1.5,
  radius: 0.4,
  threshold: 0.85
} as const;
