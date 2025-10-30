/**
 * Khora Engine - Celestial Body LOD (Level of Detail)
 *
 * Manages multi-level geometry for planets and moons to optimize performance.
 * Automatically switches between high, medium, and low detail based on camera distance.
 *
 * LOD Strategy:
 * - High Detail (subdivision 4): < 50 units from camera
 * - Medium Detail (subdivision 2): 50-200 units from camera
 * - Low Detail (subdivision 0): > 200 units from camera
 *
 * Phase 1: Basic geometry LOD
 * Future: Include atmosphere/clouds in LOD system
 */

import * as THREE from 'three';
import type { Planet, Moon } from '../types/celestial-bodies';
import { createPlanetMesh } from './PlanetRenderer';
import { createMoonMesh } from './MoonRenderer';

// ============================================================================
// LOD Configuration
// ============================================================================

/**
 * LOD level configuration
 */
interface LODLevel {
  subdivision: number; // IcosahedronGeometry subdivision level
  distance: number;    // Distance threshold in scene units
  name: string;        // Human-readable name for debugging
}

/**
 * Three levels of detail for celestial bodies
 * Distances are in scene units (1 AU ≈ 50 units with ORBIT_SCALE)
 */
const LOD_LEVELS: LODLevel[] = [
  { subdivision: 4, distance: 0, name: 'high' },     // High detail: close up
  { subdivision: 2, distance: 50, name: 'medium' },  // Medium: middle distance
  { subdivision: 0, distance: 200, name: 'low' }     // Low detail: far away
];

// ============================================================================
// CelestialBodyLOD Class
// ============================================================================

/**
 * Manages Level-of-Detail for a planet or moon
 *
 * Creates multiple mesh versions with different geometry complexity
 * and switches between them automatically based on camera distance.
 *
 * Usage:
 * ```typescript
 * // For planets
 * const planetLOD = new CelestialBodyLOD(
 *   planet,
 *   'planet',
 *   sceneUnitsPerSolarRadius
 * );
 * scene.add(planetLOD.object);
 *
 * // For moons
 * const moonLOD = new CelestialBodyLOD(
 *   moon,
 *   'moon',
 *   sceneUnitsPerSolarRadius,
 *   parentPlanet
 * );
 * planetGroup.add(moonLOD.object);
 * ```
 *
 * Important: ThreeSceneManager must call `lod.update(camera)` every frame
 * for automatic level switching (already implemented in animate loop).
 */
export class CelestialBodyLOD {
  /**
   * The THREE.LOD object to add to the scene
   * Contains all detail levels and handles automatic switching
   */
  public readonly object: THREE.LOD;

  /**
   * Reference to body data for debugging/inspection
   */
  private readonly bodyData: Planet | Moon;

  /**
   * Type of celestial body ('planet' or 'moon')
   */
  private readonly bodyType: 'planet' | 'moon';

  /**
   * Create a LOD system for a celestial body
   *
   * @param bodyData - Planet or Moon data
   * @param bodyType - Type identifier ('planet' or 'moon')
   * @param sceneUnitsPerSolarRadius - Scaling factor from star
   * @param parentPlanet - Required for moons, unused for planets
   */
  constructor(
    bodyData: Planet | Moon,
    bodyType: 'planet' | 'moon',
    sceneUnitsPerSolarRadius: number,
    parentPlanet?: Planet
  ) {
    this.bodyData = bodyData;
    this.bodyType = bodyType;

    // Create THREE.LOD container
    this.object = new THREE.LOD();

    // Validation: moons must provide parent planet
    if (bodyType === 'moon' && !parentPlanet) {
      console.error('[CelestialBodyLOD] Moon requires parentPlanet parameter');
      throw new Error('Moon LOD requires parentPlanet parameter');
    }

    // Create and add all LOD levels
    LOD_LEVELS.forEach((level) => {
      const mesh = this.createMeshForLevel(
        level.subdivision,
        sceneUnitsPerSolarRadius,
        parentPlanet
      );

      // Add this detail level to the LOD object
      this.object.addLevel(mesh, level.distance);

      // Debug logging
      console.log(
        `[CelestialBodyLOD] Added ${level.name} detail level ` +
        `(subdivision=${level.subdivision}, distance≥${level.distance}) ` +
        `for ${bodyType}: ${bodyData.name}`
      );
    });

    // Store metadata on LOD object for raycasting/selection
    this.object.userData = {
      type: bodyType,
      data: bodyData,
      lodEnabled: true
    };

    // Name the object for debugging
    this.object.name = `${bodyType}-lod-${bodyData.name}`;
  }

  /**
   * Create a mesh for a specific LOD level
   *
   * Calls the appropriate renderer (PlanetRenderer or MoonRenderer)
   * with the specified subdivision level.
   *
   * @param subdivision - Geometry subdivision level (0, 2, or 4)
   * @param sceneUnitsPerSolarRadius - Scaling factor
   * @param parentPlanet - Required for moons
   * @returns Mesh for this detail level
   */
  private createMeshForLevel(
    subdivision: number,
    sceneUnitsPerSolarRadius: number,
    parentPlanet?: Planet
  ): THREE.Mesh {
    if (this.bodyType === 'planet') {
      // Create planet mesh with specified subdivision
      const planet = this.bodyData as Planet;
      return createPlanetMesh(planet, sceneUnitsPerSolarRadius, subdivision);
    } else {
      // Create moon mesh with specified subdivision
      const moon = this.bodyData as Moon;
      if (!parentPlanet) {
        throw new Error('Parent planet required for moon mesh creation');
      }
      return createMoonMesh(moon, parentPlanet, sceneUnitsPerSolarRadius, subdivision);
    }
  }

  /**
   * Get current active LOD level (for debugging)
   *
   * Returns the index of the currently displayed detail level.
   * Requires camera distance to determine active level.
   *
   * @param camera - Scene camera
   * @returns Index of active level (0=high, 1=medium, 2=low) or -1 if none
   */
  public getCurrentLevel(camera: THREE.Camera): number {
    // Calculate distance from camera to LOD object
    const distance = camera.position.distanceTo(this.object.position);

    // Find which level should be active based on distance
    for (let i = 0; i < LOD_LEVELS.length; i++) {
      const nextLevel = LOD_LEVELS[i + 1];

      // If this is the last level, or distance is less than next threshold
      if (!nextLevel || distance < nextLevel.distance) {
        return i;
      }
    }

    return -1; // Should never happen
  }

  /**
   * Get human-readable name of current LOD level
   *
   * @param camera - Scene camera
   * @returns 'high', 'medium', 'low', or 'unknown'
   */
  public getCurrentLevelName(camera: THREE.Camera): string {
    const levelIndex = this.getCurrentLevel(camera);
    return LOD_LEVELS[levelIndex]?.name || 'unknown';
  }

  /**
   * Get statistics about this LOD system (for debugging/profiling)
   *
   * @returns Object with triangle counts for each level
   */
  public getStats(): {
    bodyName: string;
    bodyType: string;
    levels: Array<{
      name: string;
      subdivision: number;
      distance: number;
      triangles: number;
    }>;
  } {
    const levels = this.object.levels.map((lodLevel, index) => {
      const mesh = lodLevel.object as THREE.Mesh;
      const geometry = mesh.geometry as THREE.BufferGeometry;
      const triangles = geometry.index
        ? geometry.index.count / 3
        : geometry.attributes.position.count / 3;

      return {
        name: LOD_LEVELS[index].name,
        subdivision: LOD_LEVELS[index].subdivision,
        distance: LOD_LEVELS[index].distance,
        triangles: Math.floor(triangles)
      };
    });

    return {
      bodyName: this.bodyData.name,
      bodyType: this.bodyType,
      levels
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Log LOD statistics for all celestial bodies in a scene
 *
 * Useful for debugging and performance profiling.
 *
 * @param scene - Three.js scene to analyze
 * @param camera - Camera for determining current levels
 */
export function logLODStats(scene: THREE.Scene, camera: THREE.Camera): void {
  console.log('[LOD Stats] Analyzing scene...');

  let totalBodies = 0;
  let totalTrianglesHigh = 0;
  let totalTrianglesCurrent = 0;

  scene.traverse((object) => {
    if (object instanceof THREE.LOD && object.userData.lodEnabled) {
      // Find the CelestialBodyLOD instance (we stored userData)
      const bodyType = object.userData.type;
      const bodyData = object.userData.data;

      totalBodies++;

      // Get current level
      const distance = camera.position.distanceTo(object.position);
      const currentLevelIndex = object.levels.findIndex((_level, i) => {
        const nextLevel = object.levels[i + 1];
        return !nextLevel || distance < nextLevel.distance;
      });

      const currentLevel = object.levels[currentLevelIndex];
      const highLevel = object.levels[0];

      // Count triangles
      const currentMesh = currentLevel.object as THREE.Mesh;
      const highMesh = highLevel.object as THREE.Mesh;

      const currentGeo = currentMesh.geometry as THREE.BufferGeometry;
      const highGeo = highMesh.geometry as THREE.BufferGeometry;

      const currentTris = currentGeo.index
        ? currentGeo.index.count / 3
        : currentGeo.attributes.position.count / 3;

      const highTris = highGeo.index
        ? highGeo.index.count / 3
        : highGeo.attributes.position.count / 3;

      totalTrianglesCurrent += currentTris;
      totalTrianglesHigh += highTris;

      console.log(
        `  ${bodyType}: ${bodyData.name} - ` +
        `Level ${currentLevelIndex} (${LOD_LEVELS[currentLevelIndex].name}), ` +
        `${Math.floor(currentTris)} triangles, ` +
        `distance: ${distance.toFixed(1)} units`
      );
    }
  });

  const reduction = ((1 - totalTrianglesCurrent / totalTrianglesHigh) * 100).toFixed(1);

  console.log('[LOD Stats] Summary:');
  console.log(`  Bodies with LOD: ${totalBodies}`);
  console.log(`  Current triangles: ${Math.floor(totalTrianglesCurrent)}`);
  console.log(`  High detail triangles: ${Math.floor(totalTrianglesHigh)}`);
  console.log(`  Triangle reduction: ${reduction}%`);
}

/**
 * Export LOD configuration for external use
 */
export { LOD_LEVELS };
