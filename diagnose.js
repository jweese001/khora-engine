// Paste this into browser console to diagnose rendering issues
const store = window.__KHORA_STORE__.getState();
const system = store.currentSystem;

if (!system) {
  console.error('No system generated yet. Run: window.__KHORA_STORE__.getState().generateSystem(12345)');
} else {
  console.log('=== SYSTEM DIAGNOSTICS ===\n');

  // Star info
  const star = system.star;
  console.log(`Star: ${star.name}`);
  console.log(`  Temperature: ${star.temperature}K`);
  console.log(`  Spectral Type: ${star.spectralType}`);
  console.log(`  Radius: ${star.radius.toFixed(2)} solar radii`);
  console.log('');

  // Planet info
  console.log(`Planets: ${star.planets.length}`);
  star.planets.forEach((planet, idx) => {
    console.log(`\n${idx + 1}. ${planet.name}`);
    console.log(`   Type: ${planet.type}`);
    console.log(`   Mass: ${planet.mass.toFixed(2)} Earth masses`);
    console.log(`   Radius: ${planet.radius.toFixed(2)} Earth radii`);
    console.log(`   Orbit: ${planet.orbitDistance.toFixed(2)} AU`);
    console.log(`   Moons: ${planet.moons.length}`);

    if (planet.moons.length > 0) {
      planet.moons.forEach((moon, moonIdx) => {
        console.log(`     - ${moon.name}: ${moon.radius.toFixed(0)}km radius, ${(moon.orbitDistance/1000).toFixed(0)}k km orbit`);
      });
    }
  });

  // Count moons by planet type
  console.log('\n=== MOON DISTRIBUTION ===');
  const types = { Rocky: 0, GasGiant: 0, IceGiant: 0, Barren: 0 };
  const moonCounts = { Rocky: 0, GasGiant: 0, IceGiant: 0, Barren: 0 };

  star.planets.forEach(planet => {
    types[planet.type]++;
    moonCounts[planet.type] += planet.moons.length;
  });

  Object.keys(types).forEach(type => {
    if (types[type] > 0) {
      const avg = (moonCounts[type] / types[type]).toFixed(1);
      console.log(`${type}: ${types[type]} planets, ${moonCounts[type]} total moons (avg ${avg} per planet)`);
    }
  });

  // Check for gas giants without moons
  console.log('\n=== GAS GIANTS WITHOUT MOONS ===');
  const gasGiantsNoMoons = star.planets.filter(p =>
    (p.type === 'GasGiant' || p.type === 'IceGiant') && p.moons.length === 0
  );

  if (gasGiantsNoMoons.length > 0) {
    console.log(`Found ${gasGiantsNoMoons.length} gas/ice giants without moons:`);
    gasGiantsNoMoons.forEach(p => {
      console.log(`  - ${p.name} (${p.type}, mass=${p.mass.toFixed(1)}, radius=${p.radius.toFixed(2)})`);
    });
    console.log('\nNote: 40% of planets dont get moons due to random chance (MOON_PROBABILITY = 0.6)');
  } else {
    console.log('All gas/ice giants have moons!');
  }
}
