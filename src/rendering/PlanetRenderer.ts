/**
 * Khora Engine - Planet Renderer
 *
 * Creates Three.js meshes for planets with type-based materials.
 * Phase 1: Basic colored spheres with atmosphere indication.
 * Future phases: Procedural shaders, terrain, clouds.
 */

import * as THREE from 'three';
import type { Planet } from '../types/celestial-bodies';
import { PlanetType } from '../types/celestial-bodies';

// ============================================================================
// Color Schemes by Planet Type
// ============================================================================

/**
 * Get base color for planet type
 *
 * @param type - Planet type
 * @returns THREE.Color for the planet
 */
function getPlanetBaseColor(type: PlanetType): THREE.Color {
  switch (type) {
    case PlanetType.Rocky:
      return new THREE.Color(0x8B7355); // Brown/tan
    case PlanetType.GasGiant:
      return new THREE.Color(0xFFA500); // Orange
    case PlanetType.IceGiant:
      return new THREE.Color(0x87CEEB); // Light blue
    case PlanetType.Barren:
      return new THREE.Color(0x696969); // Dark gray
    default:
      return new THREE.Color(0x808080); // Gray fallback
  }
}

/**
 * Modify planet color based on properties
 *
 * @param planet - Planet data
 * @param baseColor - Base color from type
 * @returns Modified color
 */
function adjustPlanetColor(planet: Planet, baseColor: THREE.Color): THREE.Color {
  const color = baseColor.clone();

  // Rocky planets with water get blue tint
  if (planet.type === PlanetType.Rocky && planet.waterCoverage > 0.3) {
    const waterBlue = new THREE.Color(0x0077BE);
    color.lerp(waterBlue, planet.waterCoverage * 0.7);
  }

  // Very cold planets get darker
  if (planet.surfaceTemperature < 150) {
    color.multiplyScalar(0.7);
  }

  // Very hot planets get redder (but not too bright)
  if (planet.surfaceTemperature > 500) {
    const hotColor = new THREE.Color(0xCC3300); // Darker red-orange
    color.lerp(hotColor, Math.min((planet.surfaceTemperature - 500) / 1000, 0.4));
  }

  return color;
}

// ============================================================================
// Planet Mesh Creation
// ============================================================================

/**
 * Create a basic planet mesh using star-relative scaling
 *
 * Phase 1: Simple sphere with MeshBasicMaterial for consistent colors.
 * Uses IcosahedronGeometry for better sphere approximation.
 *
 * @param planet - Planet data
 * @param sceneUnitsPerSolarRadius - Scaling factor from star (scene units per solar radius)
 * @param subdivision - Geometry subdivision level (default: 3 for smoother appearance)
 * @returns THREE.Mesh for the planet
 */
export function createPlanetMesh(
  planet: Planet,
  sceneUnitsPerSolarRadius: number,
  subdivision: number = 3
): THREE.Mesh {
  // Star-relative scaling:
  // Convert planet radius (Earth radii) to solar radii, then to scene units
  // 1 solar radius = 109 Earth radii
  const SOLAR_RADIUS_IN_EARTH_RADII = 109;
  const planetRadiusInSolarRadii = planet.radius / SOLAR_RADIUS_IN_EARTH_RADII;
  const baseRadius = planetRadiusInSolarRadii * sceneUnitsPerSolarRadius;

  // Apply minimum for visibility and scale up for better viewing
  // Realistic scale makes planets invisible, so exaggerate sizes
  const PLANET_VISIBILITY_SCALE = 3.0; // Make planets 3× larger
  const visualRadius = Math.max(baseRadius * PLANET_VISIBILITY_SCALE, 2.0);

  // Create geometry
  // IcosahedronGeometry gives better sphere than SphereGeometry
  const geometry = new THREE.IcosahedronGeometry(visualRadius, subdivision);

  // Get planet color
  const baseColor = getPlanetBaseColor(planet.type);
  const color = adjustPlanetColor(planet, baseColor);

  // Phase 1: Use MeshBasicMaterial for consistent color display
  // MeshBasicMaterial doesn't require lighting and shows colors directly
  // Phase 2 (Weeks 8-9): Will switch to procedural shaders with proper materials
  const material = new THREE.MeshBasicMaterial({
    color: color
  });

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Store planet data
  mesh.userData = {
    type: 'planet',
    data: planet,
    material: material // Store for shader inspection later
  };

  // Casting shadows disabled in Phase 1 for performance
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  return mesh;
}

/**
 * Create atmosphere glow for planet
 *
 * Optional visual enhancement for planets with atmospheres.
 * Creates a slightly larger transparent sphere.
 *
 * @param planet - Planet data
 * @param scale - Visual scale factor (should match planet mesh)
 * @returns THREE.Mesh for atmosphere or null if no atmosphere
 */
export function createAtmosphereGlow(
  planet: Planet,
  scale: number = 5.0
): THREE.Mesh | null {
  if (!planet.atmosphere.present) {
    return null;
  }

  // Atmosphere sphere is slightly larger than planet
  const atmosphereRadius = planet.radius * scale * 1.15;

  const geometry = new THREE.IcosahedronGeometry(atmosphereRadius, 2);

  // Atmosphere color based on composition
  let atmosphereColor: THREE.Color;

  if (planet.atmosphere.breathable) {
    // Breathable = Earth-like (blue)
    atmosphereColor = new THREE.Color(0x87CEEB);
  } else if (planet.type === PlanetType.GasGiant || planet.type === PlanetType.IceGiant) {
    // Gas giants - use planet color but lighter
    atmosphereColor = getPlanetBaseColor(planet.type).clone().multiplyScalar(1.3);
  } else {
    // Other atmospheres - yellowish/tan
    atmosphereColor = new THREE.Color(0xDDC084);
  }

  const material = new THREE.MeshBasicMaterial({
    color: atmosphereColor,
    transparent: true,
    opacity: 0.15 * planet.atmosphere.density,
    side: THREE.BackSide, // Only visible from outside
    depthWrite: false
  });

  const atmosphereMesh = new THREE.Mesh(geometry, material);

  return atmosphereMesh;
}

/**
 * Create cloud layer for planet
 *
 * Simple cloud representation using a slightly offset sphere with noise-like texture.
 * Phase 1: Basic implementation, can be enhanced with shaders later.
 *
 * @param planet - Planet data
 * @param scale - Visual scale factor
 * @returns THREE.Mesh for clouds or null
 */
export function createCloudLayer(
  planet: Planet,
  scale: number = 5.0
): THREE.Mesh | null {
  // Only rocky planets with water and atmosphere get clouds
  if (planet.type !== PlanetType.Rocky || !planet.atmosphere.present || planet.waterCoverage < 0.3) {
    return null;
  }

  const cloudRadius = planet.radius * scale * 1.05;

  const geometry = new THREE.IcosahedronGeometry(cloudRadius, 2);

  const material = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.3,
    roughness: 1.0,
    metalness: 0.0,
    depthWrite: false
  });

  const cloudMesh = new THREE.Mesh(geometry, material);

  return cloudMesh;
}

/**
 * Create complete planet object with all visual elements
 *
 * Combines planet mesh, atmosphere, and clouds into a single group.
 *
 * @param planet - Planet data
 * @param sceneUnitsPerSolarRadius - Scaling factor from star
 * @param orbitScale - Scale factor for orbital distance (default: 50.0)
 * @returns THREE.Group with all planet elements
 */
export function createPlanetObject(
  planet: Planet,
  sceneUnitsPerSolarRadius: number,
  orbitScale: number = 50.0
): THREE.Group {
  const group = new THREE.Group();

  // Add planet mesh
  const mesh = createPlanetMesh(planet, sceneUnitsPerSolarRadius);
  group.add(mesh);

  // Add atmosphere if present
  // Note: atmosphere/clouds disabled in Phase 1 for simplicity
  // Will be re-enabled with proper shaders in Phase 2
  // const atmosphere = createAtmosphereGlow(planet, sceneUnitsPerSolarRadius);
  // if (atmosphere) {
  //   group.add(atmosphere);
  // }

  // Add clouds if applicable
  // const clouds = createCloudLayer(planet, sceneUnitsPerSolarRadius);
  // if (clouds) {
  //   group.add(clouds);
  // }

  // Position planet at orbital distance
  // Place on X-axis (will be rotated to actual position later if needed)
  group.position.set(planet.orbitDistance * orbitScale, 0, 0);

  // Store planet data on group
  group.userData = {
    type: 'planet',
    data: planet
  };

  return group;
}

/**
 * Position planet along its orbit
 *
 * Helper function to position planet at a specific angle along its orbit.
 *
 * @param planetGroup - Planet group to position
 * @param orbitDistance - Orbital distance in AU
 * @param angle - Angle in radians (0 = positive X-axis)
 * @param orbitScale - Scale factor for orbital distance
 */
export function positionPlanetOnOrbit(
  planetGroup: THREE.Group,
  orbitDistance: number,
  angle: number,
  orbitScale: number = 50.0
): void {
  const x = Math.cos(angle) * orbitDistance * orbitScale;
  const z = Math.sin(angle) * orbitDistance * orbitScale;

  planetGroup.position.set(x, 0, z);
}

/**
 * Animate planet rotation
 *
 * Updates planet rotation based on rotation period.
 * Call this in animation loop.
 *
 * @param planetGroup - Planet group
 * @param deltaTime - Time since last frame (in seconds)
 */
export function animatePlanetRotation(
  planetGroup: THREE.Group,
  deltaTime: number
): void {
  const planet = planetGroup.userData.data as Planet;

  if (!planet) return;

  // Rotation speed based on rotation period
  // rotationPeriod is in Earth days, convert to rotations per second
  const rotationsPerSecond = 1 / (planet.rotationPeriod * 86400); // 86400 seconds per day
  const rotationSpeed = rotationsPerSecond * Math.PI * 2; // radians per second

  // Rotate around Y-axis
  planetGroup.rotation.y += rotationSpeed * deltaTime;
}
