/**
 * Khora Engine - Procedural Name Generator
 *
 * Generates deterministic names for stars, planets, and moons.
 * Uses SeededRandom for consistent naming across regeneration.
 */

import { SeededRandom } from '../utils/random';

// ============================================================================
// Name Components
// ============================================================================

/**
 * Greek letters for star designation (Bayer system)
 */
const GREEK_LETTERS = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
];

/**
 * Constellation names for star systems
 */
const CONSTELLATIONS = [
  'Centauri', 'Orionis', 'Andromedae', 'Cassiopeiae', 'Draconis',
  'Lyrae', 'Cygni', 'Aquilae', 'Bootis', 'Virginis',
  'Scorpii', 'Sagittarii', 'Geminorum', 'Tauri', 'Leonis',
  'Cancri', 'Piscium', 'Arietis', 'Capricorni', 'Aquarii',
  'Ursae Majoris', 'Ursae Minoris', 'Canis Majoris', 'Canis Minoris',
  'Persei', 'Aurigae', 'Herculis', 'Ophiuchi', 'Serpentis'
];

/**
 * Catalog prefixes for catalog designation system
 */
const CATALOG_PREFIXES = [
  'HD', 'HR', 'HIP', 'GJ', 'Gl', 'LHS', 'Ross', 'Wolf',
  'Lalande', 'BD', 'CD', 'CPD', 'SAO', 'PPM'
];

/**
 * Greek/Latin names for special planets (used for habitable zone planets)
 */
const PLANET_NAMES = [
  'Prometheus', 'Epimetheus', 'Titan', 'Hyperion', 'Iapetus',
  'Phoebe', 'Janus', 'Mimas', 'Enceladus', 'Tethys',
  'Dione', 'Rhea', 'Ariel', 'Umbriel', 'Titania',
  'Oberon', 'Miranda', 'Io', 'Europa', 'Ganymede',
  'Callisto', 'Amalthea', 'Thebe', 'Adrastea', 'Metis',
  'Triton', 'Nereid', 'Proteus', 'Larissa', 'Galatea'
];

/**
 * Suffixes for moon names
 */
const MOON_SUFFIXES = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
  'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't'
];

// ============================================================================
// Star Name Generation
// ============================================================================

/**
 * Generate a star name using either Bayer designation or catalog number
 *
 * Examples:
 * - "Alpha Centauri" (Bayer system)
 * - "HD 209458" (catalog designation)
 *
 * @param rng - Seeded random number generator
 * @returns Star name
 */
export function generateStarName(rng: SeededRandom): string {
  const useCatalog = rng.boolean(0.4); // 40% catalog, 60% Bayer

  if (useCatalog) {
    // Catalog designation (e.g., "HD 209458")
    const prefix = rng.choice(CATALOG_PREFIXES);
    const number = rng.randomInt(1000, 999999);
    return `${prefix} ${number}`;
  } else {
    // Bayer designation (e.g., "Alpha Centauri")
    const greek = rng.choice(GREEK_LETTERS);
    const constellation = rng.choice(CONSTELLATIONS);

    // Occasionally add numeric suffix for multiple star systems
    const hasNumeric = rng.boolean(0.15); // 15% chance
    if (hasNumeric) {
      const numeric = rng.randomInt(1, 5);
      return `${greek} ${constellation} ${numeric}`;
    }

    return `${greek} ${constellation}`;
  }
}

// ============================================================================
// Planet Name Generation
// ============================================================================

/**
 * Generate a planet name based on parent star and position
 *
 * Naming conventions:
 * - First planet: Use Greek/Latin name if in habitable zone, otherwise Roman numeral
 * - Other planets: Use Roman numerals (I, II, III, IV, etc.)
 * - Catalog stars: Use letter suffixes (b, c, d, e, etc.)
 *
 * Examples:
 * - "Alpha Centauri II" (Bayer system, 2nd planet)
 * - "HD 209458 b" (catalog system, 1st planet)
 * - "Alpha Centauri Titan" (special name for habitable zone)
 *
 * @param starName - Name of parent star
 * @param planetIndex - Planet position (0-based)
 * @param isInHabitableZone - Whether planet is in habitable zone
 * @param rng - Seeded random number generator
 * @returns Planet name
 */
export function generatePlanetName(
  starName: string,
  planetIndex: number,
  isInHabitableZone: boolean,
  rng: SeededRandom
): string {
  const isCatalogStar = starName.includes(' ') && /\d/.test(starName.split(' ')[1]);

  if (isCatalogStar) {
    // Catalog stars use letter suffixes (b, c, d, e...)
    // Note: 'a' is reserved for the star itself
    const letter = String.fromCharCode(98 + planetIndex); // 98 = 'b'
    return `${starName} ${letter}`;
  } else {
    // Bayer stars use Roman numerals or special names

    // 30% chance to use Greek/Latin name if in habitable zone
    if (isInHabitableZone && rng.boolean(0.3)) {
      const specialName = rng.choice(PLANET_NAMES);
      return `${starName} ${specialName}`;
    }

    // Otherwise use Roman numerals
    const romanNumeral = toRomanNumeral(planetIndex + 1);
    return `${starName} ${romanNumeral}`;
  }
}

/**
 * Convert number to Roman numeral
 *
 * @param num - Number to convert (1-20 supported)
 * @returns Roman numeral string
 */
function toRomanNumeral(num: number): string {
  const romanNumerals: [number, string][] = [
    [20, 'XX'], [19, 'XIX'], [18, 'XVIII'], [17, 'XVII'], [16, 'XVI'],
    [15, 'XV'], [14, 'XIV'], [13, 'XIII'], [12, 'XII'], [11, 'XI'],
    [10, 'X'], [9, 'IX'], [8, 'VIII'], [7, 'VII'], [6, 'VI'],
    [5, 'V'], [4, 'IV'], [3, 'III'], [2, 'II'], [1, 'I']
  ];

  for (const [value, numeral] of romanNumerals) {
    if (num >= value) {
      return numeral + (num > value ? toRomanNumeral(num - value) : '');
    }
  }

  return '';
}

// ============================================================================
// Moon Name Generation
// ============================================================================

/**
 * Generate a moon name based on parent planet
 *
 * Naming conventions:
 * - Numeric suffix: "Alpha Centauri II-1" (first moon)
 * - Letter suffix: "Alpha Centauri II-a" (first moon, alternative)
 * - For catalog planets: "HD 209458 b-1"
 *
 * @param planetName - Name of parent planet
 * @param moonIndex - Moon position (0-based)
 * @param rng - Seeded random number generator
 * @returns Moon name
 */
export function generateMoonName(
  planetName: string,
  moonIndex: number,
  rng: SeededRandom
): string {
  const useLetter = rng.boolean(0.5); // 50% letter, 50% number

  if (useLetter && moonIndex < MOON_SUFFIXES.length) {
    // Use letter suffix (a, b, c...)
    const suffix = MOON_SUFFIXES[moonIndex];
    return `${planetName}-${suffix}`;
  } else {
    // Use numeric suffix (1, 2, 3...)
    return `${planetName}-${moonIndex + 1}`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID for a celestial body
 *
 * @param prefix - Type prefix ('star', 'planet', 'moon')
 * @param seed - System seed for uniqueness
 * @param index - Optional index for multiple bodies
 * @returns Unique ID string
 */
export function generateId(prefix: string, seed: number, index?: number): string {
  if (index !== undefined) {
    return `${prefix}-${seed}-${index}`;
  }
  return `${prefix}-${seed}`;
}

/**
 * Sanitize a name for use in IDs or URLs
 *
 * @param name - Name to sanitize
 * @returns Sanitized name
 */
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
