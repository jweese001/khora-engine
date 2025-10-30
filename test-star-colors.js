// Test different seeds to see star colors
// Paste this into browser console

const testSeeds = [
  12345,  // F-type (yellow-white)
  99999,  // Try for M-type (red)
  42,     // Random
  7777,   // Random
  11111,  // Random
  54321,  // Random
  8888,   // Random
  3333,   // Random
  6666,   // Random
  1234    // Random
];

console.log('=== TESTING STAR COLORS ===\n');
console.log('Generating 10 systems to find colorful stars...\n');

const store = window.__KHORA_STORE__.getState();

testSeeds.forEach(seed => {
  store.generateSystem(seed);
  const system = store.currentSystem;
  const star = system.star;

  let colorName = '';
  if (star.temperature < 3500) colorName = 'RED';
  else if (star.temperature < 5000) colorName = 'ORANGE';
  else if (star.temperature < 6000) colorName = 'YELLOW';
  else if (star.temperature < 7500) colorName = 'YELLOW-WHITE';
  else if (star.temperature < 10000) colorName = 'WHITE';
  else colorName = 'BLUE-WHITE';

  console.log(`Seed ${seed}: ${star.spectralType}-type (${star.temperature.toFixed(0)}K) - ${colorName}`);

  // Count gas giants with moons
  const gasGiants = star.planets.filter(p => p.type === 'GasGiant' || p.type === 'IceGiant');
  const gasGiantsWithMoons = gasGiants.filter(p => p.moons.length > 0);
  console.log(`  Gas/Ice Giants: ${gasGiants.length}, with moons: ${gasGiantsWithMoons.length}`);
});

console.log('\n=== RECOMMENDATION ===');
console.log('Seeds with colorful stars:');
console.log('- For RED/ORANGE stars, look for M or K types');
console.log('- For YELLOW stars, look for G types');
console.log('- For BLUE stars, look for B or O types');
console.log('\nCurrent seed (12345) has F-type which is naturally pale yellow-white.');
console.log('This is astronomically correct - F-type stars ARE nearly white!');
