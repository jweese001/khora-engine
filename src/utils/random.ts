/**
 * Khora Engine - Seeded Random Number Generator
 *
 * CRITICAL: This class is the foundation of deterministic generation.
 * Same seed MUST produce identical sequence across all platforms.
 *
 * Algorithm: Mulberry32 - Fast, high-quality 32-bit PRNG
 * Source: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */

export class SeededRandom {
  private seed: number;

  /**
   * Create a new seeded random number generator
   * @param seed - Integer seed value (will be converted to uint32)
   */
  constructor(seed: number) {
    // Ensure seed is a valid uint32
    this.seed = Math.floor(Math.abs(seed)) >>> 0;
  }

  /**
   * Generate next random number in sequence
   * @returns Pseudorandom float in range [0, 1)
   */
  random(): number {
    // Mulberry32 algorithm
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer in range [min, max] (inclusive)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns Random integer
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random float in range [min, max)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Random float
   */
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  /**
   * Choose random element from array
   * @param array - Array to choose from
   * @returns Random element
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[Math.floor(this.random() * array.length)];
  }

  /**
   * Weighted random choice
   * @param options - Array of [value, weight] pairs
   * @returns Randomly selected value based on weights
   */
  weightedChoice<T>(options: [T, number][]): T {
    const totalWeight = options.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = this.random() * totalWeight;

    for (const [value, weight] of options) {
      roll -= weight;
      if (roll <= 0) {
        return value;
      }
    }

    // Fallback (should never reach here with valid weights)
    return options[options.length - 1][0];
  }

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   * @param array - Array to shuffle (modified in place)
   * @returns Shuffled array (same reference)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate random boolean with given probability
   * @param probability - Probability of true (0.0-1.0)
   * @returns Random boolean
   */
  boolean(probability: number = 0.5): boolean {
    return this.random() < probability;
  }

  /**
   * Reset the RNG to a specific seed
   * Useful for creating sub-generators from a base seed
   * @param seed - New seed value
   */
  reset(seed: number): void {
    this.seed = Math.floor(Math.abs(seed)) >>> 0;
  }

  /**
   * Get current internal seed state
   * Useful for debugging/reproducibility
   * @returns Current seed value
   */
  getSeed(): number {
    return this.seed;
  }
}

/**
 * Create a deterministic RNG from a string seed
 * Useful for named seeds like "Alpha Centauri"
 * @param stringSeed - String to convert to numeric seed
 * @returns SeededRandom instance
 */
export function createFromString(stringSeed: string): SeededRandom {
  // Simple hash function for string -> number
  let hash = 0;
  for (let i = 0; i < stringSeed.length; i++) {
    const char = stringSeed.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return new SeededRandom(Math.abs(hash));
}
