/**
 * Khora Engine - Galaxy Renderer
 *
 * Renders galaxy-scale view with beautiful particle system
 * Maps procedurally generated star systems to visual markers
 */

import { debugLog } from '../utils/debug';
import * as THREE from 'three';
import type { Galaxy, GalaxySystemPlacement } from '../types/galaxy';
import { isSpiralGalaxy, isEllipticalGalaxy, isIrregularGalaxy } from '../types/galaxy';
import { GalaxyParticleSystem } from './GalaxyParticleSystem';
import type { SystemMarker, GalaxyConfig } from './GalaxyParticleSystem';
import { disposeObjectTree } from './dispose';
import { SpectralType } from '../types/celestial-bodies';

/**
 * Map star spectral type to marker color
 * Based on actual stellar colors from astronomy
 */
function getStarColor(spectralType: SpectralType): THREE.Color {
  const colors: Record<string, THREE.Color> = {
    'O': new THREE.Color(0x9bb0ff), // Blue
    'B': new THREE.Color(0xaabfff), // Blue-white
    'A': new THREE.Color(0xcad7ff), // White
    'F': new THREE.Color(0xf8f7ff), // Yellow-white
    'G': new THREE.Color(0xfff4ea), // Yellow (like our Sun)
    'K': new THREE.Color(0xffd2a1), // Orange
    'M': new THREE.Color(0xffcc6f), // Red
  };
  return colors[spectralType] || new THREE.Color(0xffffff);
}

/**
 * Calculate marker size based on star mass
 * Larger, more massive stars get bigger markers
 */
function getMarkerSize(mass: number): number {
  // Mass is in solar masses
  // Size range: 3.0 - 8.0 for visual distinction
  const minSize = 3.0;
  const maxSize = 8.0;

  // Logarithmic scale for better visual distribution
  const normalizedMass = Math.log10(mass + 1) / Math.log10(100); // Assume max ~100 solar masses
  return minSize + (maxSize - minSize) * Math.min(normalizedMass, 1.0);
}

/**
 * Map galaxy type to particle system configuration
 */
function mapGalaxyToParticleConfig(galaxy: Galaxy): GalaxyConfig {
  const baseConfig: GalaxyConfig = {
    particleCount: 5000,
    size: 100, // Adjusted for galaxy scale
    animationSpeed: 0.3,
    rotationSpeed: 0.005,
    coreSize: 0.10, // Reduced from 0.15 to minimize bright center
    particleSizeMin: 0.5,
    particleSizeMax: 2.5,
    particleBrightness: 0.7, // Reduced from 0.8 for dimmer particles
    // Core control parameters
    coreBrightness: 0.5,      // 50% brightness for core region (adjustable)
    coreAlphaFalloff: 0.6,    // 60% alpha reduction near center (prevents solid appearance)
    coreExclusionRadius: 0.0, // No exclusion zone by default
  };

  if (isSpiralGalaxy(galaxy)) {
    return {
      ...baseConfig,
      type: 'spiral',
      armCount: galaxy.spiralParams.armCount,
      spiralTightness: galaxy.spiralParams.armTightness,
      diskThickness: galaxy.spiralParams.diskThickness / 100, // Scale down for rendering
      // Color scheme: blue-purple for spiral
      coreColor: new THREE.Color(0xe6f2ff),
      midColor: new THREE.Color(0x99ccff),
      edgeColor: new THREE.Color(0x4d79ff),
    };
  } else if (isEllipticalGalaxy(galaxy)) {
    return {
      ...baseConfig,
      type: 'elliptical',
      ellipticalFlatten: 1 - galaxy.ellipticalParams.eccentricity,
      // Color scheme: yellow-orange for elliptical (older stars)
      coreColor: new THREE.Color(0xfff4e6),
      midColor: new THREE.Color(0xffdd99),
      edgeColor: new THREE.Color(0xff9966),
    };
  } else if (isIrregularGalaxy(galaxy)) {
    return {
      ...baseConfig,
      type: 'irregular',
      irregularChaos: galaxy.irregularParams.dispersalFactor,
      // Color scheme: mixed colors for irregular
      coreColor: new THREE.Color(0xffe6f2),
      midColor: new THREE.Color(0xffb3d9),
      edgeColor: new THREE.Color(0xff66b3),
    };
  }

  return { ...baseConfig, type: 'spiral' };
}

/**
 * Galaxy rendering system with beautiful particle visualization
 * Handles galaxy-scale visualization and system positioning
 */
export class GalaxyRenderer {
  private galaxyGroup: THREE.Group;
  private particleSystem: GalaxyParticleSystem | null = null;
  private systemObjects: THREE.Object3D[] = []; // For raycasting

  constructor() {
    this.galaxyGroup = new THREE.Group();
    this.galaxyGroup.name = 'GalaxyGroup';
  }

  /**
   * Get the root group for adding to scene
   */
  public getGroup(): THREE.Group {
    return this.galaxyGroup;
  }

  /**
   * Render a complete galaxy with particle system
   */
  public renderGalaxy(galaxy: Galaxy): void {
    // Clear previous galaxy
    this.clear();

    // Create particle system with galaxy-appropriate configuration
    const particleConfig = mapGalaxyToParticleConfig(galaxy);
    this.particleSystem = new GalaxyParticleSystem(particleConfig);

    // Add particle system to scene
    this.galaxyGroup.add(this.particleSystem.getGroup());

    // Map star systems to visual markers
    this.renderSystemMarkers(galaxy.systems);

    debugLog(`[GalaxyRenderer] Rendered ${galaxy.systems.length} star systems with particle system`);
  }

  /**
   * Render star system markers on the particle galaxy
   */
  private renderSystemMarkers(systems: GalaxySystemPlacement[]): void {
    if (systems.length === 0 || !this.particleSystem) return;

    // Convert system placements to particle system markers
    const markers: SystemMarker[] = systems.map((placement, index) => {
      const star = placement.system.star;

      return {
        position: new THREE.Vector3(
          placement.position.x / 100, // Scale from light-years to render units
          placement.position.y / 100,
          placement.position.z / 100
        ),
        color: getStarColor(star.spectralType),
        size: getMarkerSize(star.mass),
        data: {
          type: 'galaxy-system',
          systemIndex: index,
          system: placement.system,
          position: placement.position,
          region: placement.region,
        }
      };
    });

    // Add markers to particle system
    this.particleSystem.addSystemMarkers(markers);

    // Create invisible raycasting objects for click detection
    // These match the marker positions but are separate for raycasting
    markers.forEach((marker) => {
      const raycastObject = new THREE.Mesh(
        new THREE.SphereGeometry(marker.size || 4.0, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );

      raycastObject.position.copy(marker.position);

      // Apply same rotation as markers for alignment
      const tempGroup = new THREE.Group();
      tempGroup.rotation.x = -Math.PI / 5;
      tempGroup.add(raycastObject);
      tempGroup.updateMatrixWorld(true);

      // Get world position after rotation
      const worldPos = new THREE.Vector3();
      raycastObject.getWorldPosition(worldPos);

      // Remove from temp group and set world position
      tempGroup.remove(raycastObject);
      raycastObject.position.copy(worldPos);

      // Store system data when the marker carries an object payload.
      if (marker.data && typeof marker.data === 'object') {
        Object.assign(raycastObject.userData, marker.data);
      }

      this.systemObjects.push(raycastObject);
      this.galaxyGroup.add(raycastObject);
    });

    debugLog(`[GalaxyRenderer] Created ${markers.length} system markers with raycasting`);
  }

  /**
   * Update animation (call each frame)
   */
  public update(deltaTime: number): void {
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }
  }

  /**
   * Get all system marker objects for raycasting
   */
  public getSystemObjects(): THREE.Object3D[] {
    return this.systemObjects;
  }

  /**
   * Update galaxy particle system configuration
   */
  public updateConfig(config: Partial<GalaxyConfig>): void {
    if (this.particleSystem) {
      debugLog('[GalaxyRenderer] Updating galaxy config:', config);
      this.particleSystem.updateConfig(config);
    }
  }

  /**
   * Clear all galaxy rendering
   */
  public clear(): void {
    // Dispose of particle system
    if (this.particleSystem) {
      this.particleSystem.dispose();
      this.galaxyGroup.remove(this.particleSystem.getGroup());
      this.particleSystem = null;
    }

    // Clear system objects
    this.systemObjects.forEach((object) => {
      disposeObjectTree(object);
      this.galaxyGroup.remove(object);
    });
    this.systemObjects = [];

    debugLog('[GalaxyRenderer] Cleared galaxy rendering');
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.clear();
  }
}
