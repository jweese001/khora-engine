/**
 * Khora Engine - Orbit Renderer
 *
 * Creates Three.js line geometry for planetary orbits.
 * Displays orbital paths as circular lines around the star.
 */

import * as THREE from 'three';

// ============================================================================
// Orbit Line Creation
// ============================================================================

/**
 * Create a circular orbit line
 *
 * Creates a thin line circle to represent a planet's orbital path.
 * Orbits are drawn in the XZ plane (Y=0).
 *
 * @param radius - Orbital radius in scene units
 * @param segments - Number of line segments (default: 128)
 * @param color - Orbit line color (default: gray)
 * @param opacity - Line opacity (default: 0.3)
 * @returns THREE.Line for the orbit
 */
export function createOrbitLine(
  radius: number,
  segments: number = 128,
  color: THREE.Color | number = 0x444444,
  opacity: number = 0.3
): THREE.Line {
  // Create points for circle
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    points.push(new THREE.Vector3(x, 0, z));
  }

  // Create geometry from points
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // Create material
  const material = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
    depthWrite: false // Prevent z-fighting with other orbits
  });

  // Create line
  const line = new THREE.Line(geometry, material);

  return line;
}

/**
 * Create orbit line with planet type-specific color
 *
 * Different planet types get different colored orbits for visual clarity.
 *
 * @param radius - Orbital radius
 * @param planetType - Type of planet ('Rocky', 'GasGiant', etc.)
 * @returns THREE.Line for the orbit
 */
export function createTypedOrbitLine(
  radius: number,
  planetType: string
): THREE.Line {
  // Choose color based on planet type
  let color: number;
  let opacity: number = 0.3;

  switch (planetType) {
    case 'Rocky':
      color = 0x8B7355; // Brown
      break;
    case 'GasGiant':
      color = 0xFFA500; // Orange
      break;
    case 'IceGiant':
      color = 0x87CEEB; // Sky blue
      break;
    case 'Barren':
      color = 0x666666; // Dark gray
      break;
    default:
      color = 0x444444; // Gray
  }

  return createOrbitLine(radius, 128, color, opacity);
}

/**
 * Create orbit line for habitable zone boundary
 *
 * Special rendering for habitable zone edges.
 *
 * @param radius - Habitable zone boundary radius
 * @param isInner - True for inner boundary, false for outer
 * @returns THREE.Line for habitable zone edge
 */
export function createHabitableZoneLine(
  radius: number,
  isInner: boolean
): THREE.Line {
  // Green color for habitable zone
  const color = 0x00FF00;
  const opacity = isInner ? 0.4 : 0.3;

  const line = createOrbitLine(radius, 128, color, opacity);

  // Make line slightly dashed for distinction
  const material = line.material as THREE.LineBasicMaterial;
  material.opacity = opacity;

  return line;
}

/**
 * Create moon orbit line around a planet
 *
 * Similar to planet orbits but smaller and more subtle.
 *
 * @param radius - Moon orbital radius (in scene units)
 * @param planetPosition - Position of parent planet
 * @returns THREE.Line for moon orbit
 */
export function createMoonOrbitLine(
  radius: number,
  planetPosition: THREE.Vector3
): THREE.Line {
  // Create base orbit
  const line = createOrbitLine(radius, 64, 0x666666, 0.15);

  // Position relative to planet
  line.position.copy(planetPosition);

  return line;
}

/**
 * Create orbital path with directional indicator
 *
 * Adds a small arrow or marker to show orbital direction.
 * Phase 1: Simple implementation, can be enhanced later.
 *
 * @param radius - Orbital radius
 * @param planetType - Type of planet
 * @returns THREE.Group with orbit line and direction marker
 */
export function createOrbitWithDirection(
  radius: number,
  planetType: string
): THREE.Group {
  const group = new THREE.Group();

  // Add orbit line
  const orbit = createTypedOrbitLine(radius, planetType);
  group.add(orbit);

  // Add direction arrow (small cone at theta=0)
  const arrowGeometry = new THREE.ConeGeometry(radius * 0.02, radius * 0.05, 3);
  const arrowMaterial = new THREE.MeshBasicMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.5
  });
  const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);

  // Position at start of orbit
  arrow.position.set(radius, 0, 0);
  arrow.rotation.z = -Math.PI / 2; // Point in orbit direction

  group.add(arrow);

  return group;
}
