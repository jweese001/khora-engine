import { describe, expect, it } from 'vitest';
import { SeededRandom, createFromString } from '../src/utils/random';

describe('SeededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const first = new SeededRandom(12345);
    const second = new SeededRandom(12345);

    const firstSequence = Array.from({ length: 1_000 }, () => first.random());
    const secondSequence = Array.from({ length: 1_000 }, () => second.random());

    expect(firstSequence).toEqual(secondSequence);
  });

  it('restores the original sequence after reset', () => {
    const rng = new SeededRandom(42);
    const initial = Array.from({ length: 20 }, () => rng.random());

    rng.reset(42);

    expect(Array.from({ length: 20 }, () => rng.random())).toEqual(initial);
  });

  it('keeps integer, float, and boolean helpers within their contracts', () => {
    const rng = new SeededRandom(777);

    for (let sample = 0; sample < 1_000; sample++) {
      const integer = rng.randomInt(-3, 7);
      const float = rng.randomFloat(-2.5, 4.25);

      expect(Number.isInteger(integer)).toBe(true);
      expect(integer).toBeGreaterThanOrEqual(-3);
      expect(integer).toBeLessThanOrEqual(7);
      expect(float).toBeGreaterThanOrEqual(-2.5);
      expect(float).toBeLessThan(4.25);
    }

    expect(rng.boolean(0)).toBe(false);
    expect(rng.boolean(1)).toBe(true);
  });

  it('rejects choosing from an empty array', () => {
    expect(() => new SeededRandom(1).choice([])).toThrow('Cannot choose from empty array');
  });

  it('creates deterministic generators from string seeds', () => {
    const first = createFromString('Khora');
    const second = createFromString('Khora');

    expect(Array.from({ length: 20 }, () => first.random())).toEqual(
      Array.from({ length: 20 }, () => second.random()),
    );
  });
});
