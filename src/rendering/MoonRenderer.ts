/**
 * Khora Engine - Moon Renderer
 *
 * Creates Three.js meshes for moons (natural satellites).
 * Moons use the rocky planet shader with no water/atmosphere.
 */

import { debugLog } from '../utils/debug';
import * as THREE from 'three';
import type { Moon, Planet } from '../types/celestial-bodies';
import { deriveMoonUniforms } from './shaderUniforms';

// Import rocky planet shaders (moons use the same shader)
// IMPORTANT: NO ?raw suffix - let vite-plugin-glsl process #include directives
import rockyVertShader from '../shaders/rocky-planet/rocky-planet.vert';
import rockyFragShader from '../shaders/rocky-planet/rocky-planet.frag';

// ============================================================================
// Moon Mesh Creation
// ============================================================================

/**
 * Create a moon mesh using star-relative scaling with procedural shaders
 *
 * Moons use the rocky planet shader with no water or atmosphere.
 *
 * @param moon - Moon data
 * @param parentPlanet - Parent planet (for color determination)
 * @param sceneUnitsPerSolarRadius - Scaling factor from star
 * @param camera - Camera for view-dependent shader effects
 * @param subdivision - Geometry subdivision (default: 1 for small moons)
 * @returns THREE.Mesh for the moon
 */
export function createMoonMesh(
  moon: Moon,
  parentPlanet: Planet,
  sceneUnitsPerSolarRadius: number,
  camera: THREE.Camera,
  subdivision: number = 1
): THREE.Mesh {
  // Calculate parent planet's visual radius for proportional moon sizing
  // MUST match PlanetRenderer.ts scaling to stay consistent
  const SOLAR_RADIUS_IN_EARTH_RADII = 109;
  const planetRadiusInSolarRadii = parentPlanet.radius / SOLAR_RADIUS_IN_EARTH_RADII;
  const planetBaseRadius = planetRadiusInSolarRadii * sceneUnitsPerSolarRadius;
  const PLANET_VISIBILITY_SCALE = 2.0; // MUST match PlanetRenderer (reduced from 3.0)
  const MIN_BASE_RADIUS = 0.15; // MUST match PlanetRenderer
  const planetVisualRadius = Math.max(planetBaseRadius, MIN_BASE_RADIUS) * PLANET_VISIBILITY_SCALE;

  // Make moon size proportional to parent planet
  // Real-world reference: Earth's moon is 27% of Earth's diameter (unusually large!)
  // Most moons are 1-10% of their planet's size
  // We'll use conservative scaling to keep moons clearly smaller than planets
  const maxMoonRadiusKm = parentPlanet.mass > 100 ? 2500 : parentPlanet.mass > 10 ? 2000 : 1500;
  const moonSizeFraction = moon.radius / maxMoonRadiusKm; // 0-1 based on moon size

  // Conservative moon scaling - MUCH smaller than before
  let moonScale;

  if (planetVisualRadius > 4.0) {
    // Large gas giants: Very small moons for clear visual hierarchy
    // Tiny moons (<500km): 0.5-1% of planet
    // Small moons (500-1500km): 1-2% of planet
    // Large moons (>1500km): 2-3% of planet
    if (moon.radius < 500) {
      moonScale = 0.005 + moonSizeFraction * 0.005; // 0.5-1%
    } else if (moon.radius < 1500) {
      moonScale = 0.01 + moonSizeFraction * 0.01; // 1-2%
    } else {
      moonScale = 0.02 + moonSizeFraction * 0.01; // 2-3%
    }
  } else if (planetVisualRadius > 2.0) {
    // Medium planets: 3-6% of planet radius
    moonScale = 0.03 + moonSizeFraction * 0.03;
  } else {
    // Small planets: 5-10% of planet radius (still smaller than before)
    moonScale = 0.05 + moonSizeFraction * 0.05;
  }

  const visualRadius = planetVisualRadius * moonScale;

  debugLog(`[MoonRenderer] ${moon.name} around ${parentPlanet.name}: moonRadius=${moon.radius.toFixed(0)}km, planetVisual=${planetVisualRadius.toFixed(2)}, moonVisual=${visualRadius.toFixed(2)} (${(moonScale*100).toFixed(0)}% of planet)`);

  // Create geometry
  const geometry = new THREE.IcosahedronGeometry(visualRadius, subdivision);

  // Get shader uniforms for moon (uses rocky planet shader with no water/atmosphere)
  const uniforms = deriveMoonUniforms(moon, parentPlanet, camera);

  debugLog(`[MoonRenderer] Shader-based moon ${moon.name} around ${parentPlanet.name}: temp=${moon.surfaceTemperature.toFixed(0)}K, baseColor=(${uniforms.u_baseColor.value.x.toFixed(2)}, ${uniforms.u_baseColor.value.y.toFixed(2)}, ${uniforms.u_baseColor.value.z.toFixed(2)})`);

  // Create shader material using rocky planet shader
  const material = new THREE.ShaderMaterial({
    vertexShader: rockyVertShader,
    fragmentShader: rockyFragShader,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    side: THREE.FrontSide,
  });

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Store moon data and material for shader updates
  mesh.userData = {
    type: 'moon',
    data: moon,
    parentPlanet: parentPlanet,
    material: material // Store for potential uniform updates
  };

  mesh.castShadow = false;
  mesh.receiveShadow = false;

  return mesh;
}

/**
 * Create complete moon object positioned around parent planet
 *
 * @param moon - Moon data
 * @param parentPlanet - Parent planet
 * @param planetPosition - Position of parent planet in scene (legacy, not used)
 * @param sceneUnitsPerSolarRadius - Scaling factor from star
 * @param camera - Camera for view-dependent shader effects
 * @returns THREE.Group with moon
 */
export function createMoonObject(
  moon: Moon,
  parentPlanet: Planet,
  _planetPosition: THREE.Vector3, // Legacy parameter, not used
  sceneUnitsPerSolarRadius: number,
  camera: THREE.Camera
): THREE.Group {
  const group = new THREE.Group();

  // Create moon mesh with shader material
  const mesh = createMoonMesh(moon, parentPlanet, sceneUnitsPerSolarRadius, camera);
  group.add(mesh);

  // Position moon at orbital distance from planet (in local space)
  // Scale moon orbit based on PARENT PLANET'S VISUAL SIZE for tight clustering
  // Calculate parent planet's visual radius in scene units
  // MUST match the calculation in createMoonMesh to stay consistent!
  const SOLAR_RADIUS_IN_EARTH_RADII = 109;
  const planetRadiusInSolarRadii = parentPlanet.radius / SOLAR_RADIUS_IN_EARTH_RADII;
  const planetBaseRadius = planetRadiusInSolarRadii * sceneUnitsPerSolarRadius;
  const PLANET_VISIBILITY_SCALE = 3.0; // Match PlanetRenderer and createMoonMesh
  const planetVisualRadius = Math.max(planetBaseRadius * PLANET_VISIBILITY_SCALE, 2.0);

  // Moon orbits 1.3-2.5× parent planet's visual radius
  // Balance between visual clarity and compact clustering
  // Visual radius already includes 3× scale, so we only need small multipliers
  // Normalize moon's orbital distance to 0-1 range based on planet-relative generation
  const planetRadiusKm = parentPlanet.radius * 6371;
  const minOrbitKm = planetRadiusKm * 3;
  const maxOrbitKm = planetRadiusKm * 8;

  // Calculate orbit fraction with safety check for divide-by-zero
  const orbitRange = maxOrbitKm - minOrbitKm;
  const orbitFraction = orbitRange > 0
    ? Math.max(0, Math.min(1, (moon.orbitDistance - minOrbitKm) / orbitRange))
    : 0.5; // Default to middle if range is invalid

  // Orbit at 1.3-2.5× planet visual radius (compact but clear clustering)
  const moonOrbitRadius = planetVisualRadius * (1.3 + orbitFraction * 1.2); // 1.3-2.5× planet visual radius

  // Random angle for initial position around planet
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * moonOrbitRadius;
  const z = Math.sin(angle) * moonOrbitRadius;

  // Position is relative to parent (will be added as child to planet group)
  group.position.set(x, 0, z);

  // Store moon data
  group.userData = {
    type: 'moon',
    data: moon,
    parentPlanet: parentPlanet,
    orbitRadius: moonOrbitRadius
  };

  return group;
}

/**
 * Position moon along its orbit around parent planet
 *
 * @param moonGroup - Moon group to position
 * @param planetPosition - Current position of parent planet
 * @param orbitRadius - Moon's orbital radius in scene units
 * @param angle - Angle in radians
 */
export function positionMoonOnOrbit(
  moonGroup: THREE.Group,
  planetPosition: THREE.Vector3,
  orbitRadius: number,
  angle: number
): void {
  const x = planetPosition.x + Math.cos(angle) * orbitRadius;
  const z = planetPosition.z + Math.sin(angle) * orbitRadius;

  moonGroup.position.set(x, planetPosition.y, z);
}

/**
 * Animate moon rotation
 *
 * Updates moon rotation. Most moons are tidally locked, so they rotate
 * at the same rate as they orbit.
 *
 * @param moonGroup - Moon group
 * @param deltaTime - Time since last frame (in seconds)
 */
export function animateMoonRotation(
  moonGroup: THREE.Group,
  deltaTime: number
): void {
  const moon = moonGroup.userData.data as Moon;

  if (!moon) return;

  // Rotation speed based on rotation period
  const rotationsPerSecond = 1 / (moon.rotationPeriod * 86400);
  const rotationSpeed = rotationsPerSecond * Math.PI * 2;

  moonGroup.rotation.y += rotationSpeed * deltaTime;
}

/**
 * Create all moons for a planet
 *
 * Convenience function to create all moon objects for a planet.
 *
 * @param planet - Parent planet
 * @param planetPosition - Position of planet in scene (legacy, not used)
 * @param sceneUnitsPerSolarRadius - Scaling factor from star
 * @param camera - Camera for view-dependent shader effects
 * @returns Array of moon groups
 */
export function createMoonsForPlanet(
  planet: Planet,
  planetPosition: THREE.Vector3,
  sceneUnitsPerSolarRadius: number,
  camera: THREE.Camera
): THREE.Group[] {
  const moonGroups: THREE.Group[] = [];

  planet.moons.forEach((moon) => {
    const moonGroup = createMoonObject(moon, planet, planetPosition, sceneUnitsPerSolarRadius, camera);

    // Moon positioning is now handled inside createMoonObject() using planet-relative scaling
    // No additional positioning needed

    moonGroups.push(moonGroup);
  });

  return moonGroups;
}
