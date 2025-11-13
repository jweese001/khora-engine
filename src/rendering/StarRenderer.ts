/**
 * Khora Engine - Star Renderer
 *
 * Creates Three.js meshes for stars with procedural shader rendering.
 * Uses custom star shader with emissive surface activity and bloom.
 */

import * as THREE from 'three';
import type { Star } from '../types/celestial-bodies';
import starVertShader from '../shaders/star/star.vert';
import starFragShader from '../shaders/star/star.frag';
import { deriveStarUniforms } from './shaderUniforms';

// ============================================================================
// Star-Relative Scaling System
// ============================================================================

/**
 * Calculate scene units per solar radius for a given star
 *
 * This is the foundation of the star-relative scaling system.
 * All other celestial bodies scale relative to this value.
 *
 * @param star - Star to calculate scaling for
 * @returns Scene units per solar radius
 */
export function calculateSceneUnitsPerSolarRadius(star: Star): number {
  const STAR_BASE_SIZE = 40; // Fixed visual size for stars
  return STAR_BASE_SIZE / star.radius;
}

// ============================================================================
// Color Calculation
// ============================================================================

/**
 * Convert star temperature to RGB color
 *
 * Uses blackbody radiation approximation:
 * - <3500K: Red/orange (M-type)
 * - 3500-5000K: Orange/yellow (K-type)
 * - 5000-6000K: Yellow (G-type, like Sun)
 * - 6000-7500K: Yellow-white (F-type)
 * - 7500-10000K: White (A-type)
 * - 10000-30000K: Blue-white (B-type)
 * - >30000K: Blue (O-type)
 *
 * @param temperature - Star temperature in Kelvin
 * @returns THREE.Color for the star
 */
function temperatureToColor(temperature: number): THREE.Color {
  let r, g, b;

  if (temperature < 3500) {
    // Red/orange (M-type red dwarfs)
    r = 1.0;
    g = 0.3 + (temperature - 2000) / 1500 * 0.4; // 0.3-0.7
    b = 0.0;
  } else if (temperature < 5000) {
    // Orange (K-type)
    r = 1.0;
    g = 0.5 + (temperature - 3500) / 1500 * 0.4; // 0.5-0.9
    b = 0.1 + (temperature - 3500) / 1500 * 0.2; // 0.1-0.3
  } else if (temperature < 6000) {
    // Yellow (G-type, like Sun)
    r = 1.0;
    g = 0.9 + (temperature - 5000) / 1000 * 0.1; // 0.9-1.0
    b = 0.4 + (temperature - 5000) / 1000 * 0.3; // 0.4-0.7
  } else if (temperature < 7500) {
    // Yellow-white (F-type)
    r = 0.9 + (temperature - 6000) / 1500 * 0.1; // 0.9-1.0
    g = 0.9 + (temperature - 6000) / 1500 * 0.1; // 0.9-1.0
    b = 0.8 + (temperature - 6000) / 1500 * 0.2; // 0.8-1.0
  } else if (temperature < 10000) {
    // White (A-type)
    r = 0.95;
    g = 0.95;
    b = 1.0;
  } else if (temperature < 30000) {
    // Blue-white (B-type)
    const blend = (temperature - 10000) / 20000; // 0-1
    r = 0.9 - blend * 0.2; // 0.9-0.7
    g = 0.9 - blend * 0.2; // 0.9-0.7
    b = 1.0;
  } else {
    // Blue (O-type)
    r = 0.6;
    g = 0.7;
    b = 1.0;
  }

  return new THREE.Color(r, g, b);
}

// ============================================================================
// Star Mesh Creation
// ============================================================================

/**
 * Create a star mesh with enhanced procedural shader material
 *
 * Uses enhanced star shader with:
 * - Multi-color control (base, noise, center colors)
 * - Center gradient overlay with opacity control
 * - Limb darkening for realistic brightness falloff
 * - Procedural surface activity (noise-based turbulence)
 * - Temperature-based coloring and brightness
 * - Spectral type-based parameter mapping
 * - Bloom-ready output (values > 1.0 for glow effect)
 *
 * @param star - Star data
 * @param scale - Visual scale factor (default: 1.0)
 * @param camera - Camera for view-dependent effects (required)
 * @returns THREE.Mesh for the star
 */
export function createStarMesh(
  star: Star,
  scale: number = 1.0,
  camera?: THREE.Camera
): THREE.Mesh {
  // Star-relative scaling system:
  // All celestial body sizes are calculated relative to the star
  // Star gets fixed comfortable visual size, everything else scales from that
  // This ensures: star > planets > moons, with proper proportions
  const STAR_BASE_SIZE = 40; // scene units for visual comfort
  const visualRadius = STAR_BASE_SIZE * scale;

  // Create sphere geometry
  // Use higher subdivision for stars since they're always visible and important
  const geometry = new THREE.SphereGeometry(visualRadius, 32, 32);

  // Get temperature-based shader uniforms from spectral type mapping
  const cameraRef = camera || new THREE.PerspectiveCamera(); // Fallback camera
  const uniforms = deriveStarUniforms(star, cameraRef);

  console.log(`[StarRenderer] Temperature-based star ${star.name} (${star.spectralType}-type): highTemp=${uniforms.u_highTemp.value}K, lowTemp=${uniforms.u_lowTemp.value}K, sunspots=${uniforms.u_sunspotIntensity.value.toFixed(2)}`);

  // Create ShaderMaterial with enhanced star shader
  const material = new THREE.ShaderMaterial({
    vertexShader: starVertShader,
    fragmentShader: starFragShader,
    uniforms: uniforms as any, // THREE.js uniforms type compatibility
    // No lights needed - shader is fully emissive
    side: THREE.FrontSide,
    transparent: false
  });

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Store star data and material in userData for selection/inspection/animation
  mesh.userData = {
    type: 'star',
    data: star,
    material: material // Store for shader inspection and time updates
  };

  // Stars don't cast shadows (they ARE the light source)
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  return mesh;
}

/**
 * Create a glow sprite for star
 *
 * Optional enhancement for star appearance.
 * Creates a billboard sprite with radial gradient for "glow" effect.
 *
 * @param star - Star data
 * @param scale - Visual scale factor
 * @returns THREE.Sprite for glow effect
 */
export function createStarGlow(star: Star, scale: number = 1.0): THREE.Sprite {
  // Create canvas for glow texture
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Draw radial gradient
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);

  const color = temperatureToColor(star.temperature);
  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);

  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
  gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.6)`);
  gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.2)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);

  // Create sprite material
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.6
  });

  // Create sprite
  const sprite = new THREE.Sprite(spriteMaterial);

  // Size based on star luminosity (brighter = bigger glow)
  const glowSize = Math.max(star.radius * scale * 3, 2.0 * scale) * Math.sqrt(star.luminosity);
  sprite.scale.set(glowSize, glowSize, 1);

  return sprite;
}

/**
 * Create a point light for the star
 *
 * Stars are light sources. This creates a Three.js light for lighting planets.
 * Phase 1: Use multiple directional lights to simulate omnidirectional star light
 * without distance falloff issues.
 *
 * @param star - Star data
 * @param intensity - Light intensity (default: 3.0)
 * @returns THREE.Group containing multiple directional lights
 */
export function createStarLight(star: Star, intensity: number = 3.0): THREE.Group {
  const color = temperatureToColor(star.temperature);
  const lightGroup = new THREE.Group();

  // Create multiple directional lights pointing in different directions
  // This simulates omnidirectional lighting from the star
  const directions = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];

  directions.forEach((dir) => {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.copy(dir).multiplyScalar(100);
    light.castShadow = false;
    lightGroup.add(light);
  });

  return lightGroup;
}

/**
 * Create complete star object with mesh, glow, and light
 *
 * Convenience function that creates all star visual elements.
 *
 * @param star - Star data
 * @param scale - Visual scale factor
 * @param camera - Camera for view-dependent shader effects
 * @param includeGlow - Whether to add glow sprite (default: true)
 * @param includeLight - Whether to add point light (default: true)
 * @returns THREE.Group containing all star elements
 */
export function createStarObject(
  star: Star,
  scale: number = 1.0,
  camera?: THREE.Camera,
  includeGlow: boolean = true,
  includeLight: boolean = true
): THREE.Group {
  const group = new THREE.Group();

  // Add star mesh with enhanced shader
  const mesh = createStarMesh(star, scale, camera);
  group.add(mesh);

  // Add glow sprite
  if (includeGlow) {
    const glow = createStarGlow(star, scale);
    group.add(glow);
  }

  // Add point light
  if (includeLight) {
    const light = createStarLight(star);
    group.add(light);
  }

  // Store star data on group
  group.userData = {
    type: 'star',
    data: star
  };

  return group;
}
