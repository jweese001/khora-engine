#!/usr/bin/env node
/**
 * Determinism check for canonical star system generation output.
 *
 * Contract:
 * - Canonical: normalized generateSystem(seed) output
 * - Excluded metadata: top-level generatedAt
 */

import { generateSystem } from '../src/generation/system-generator.ts';

const TEST_SEEDS = [1, 42, 777, 12345, 99999];

function normalizeSystem(system) {
  const { generatedAt: _generatedAt, ...canonicalSystem } = system;
  return canonicalSystem;
}

function serializeNormalizedSystem(seed) {
  return JSON.stringify(normalizeSystem(generateSystem(seed)));
}

console.log('🧪 Determinism Check');
console.log(`Testing canonical generateSystem(seed) output for seeds: ${TEST_SEEDS.join(', ')}\n`);

for (const seed of TEST_SEEDS) {
  try {
    const first = serializeNormalizedSystem(seed);
    const second = serializeNormalizedSystem(seed);

    if (first !== second) {
      console.error(`❌ Determinism check failed for seed ${seed}`);
      process.exit(1);
    }

    console.log(`✓ Seed ${seed}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Determinism check errored for seed ${seed}: ${message}`);
    process.exit(1);
  }
}

console.log('\n✅ Determinism check passed');
process.exit(0);
