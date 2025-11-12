/**
 * Khora Engine - Galaxy Renderer
 *
 * Renders galaxy-scale view with star system positions
 * Uses instanced rendering for performance with 100+ systems
 */

import * as THREE from 'three';
import type { Galaxy, GalaxySystemPlacement } from '../types/galaxy';
import { isSpiralGalaxy, isEllipticalGalaxy, isIrregularGalaxy } from '../types/galaxy';

/**
 * Galaxy rendering system
 * Handles galaxy-scale visualization and system positioning
 */
export class GalaxyRenderer {
  private galaxyGroup: THREE.Group;
  private systemMarkers: THREE.InstancedMesh | null = null;
  private galaxyOutline: THREE.Line | null = null;
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
   * Render a complete galaxy
   */
  public renderGalaxy(galaxy: Galaxy): void {
    // Clear previous galaxy
    this.clear();

    // Render galaxy structure outline (optional guide)
    this.renderGalaxyOutline(galaxy);

    // Render all star systems
    this.renderSystems(galaxy.systems);

    console.log(`[GalaxyRenderer] Rendered ${galaxy.systems.length} star systems`);
  }

  /**
   * Render galaxy structure outline/guide
   * Visual representation of galaxy shape
   */
  private renderGalaxyOutline(galaxy: Galaxy): void {
    const points: THREE.Vector3[] = [];

    if (isSpiralGalaxy(galaxy)) {
      // Render spiral arm guides
      const params = galaxy.spiralParams;
      const armCount = params.armCount;
      const diskRadius = params.diskRadius;
      const tightness = params.armTightness;

      // Create spiral arm curves
      for (let arm = 0; arm < armCount; arm++) {
        const armOffset = (arm / armCount) * Math.PI * 2;

        // Generate points along spiral arm
        for (let i = 0; i <= 50; i++) {
          const t = i / 50;
          const r = t * diskRadius;
          const theta = t * Math.PI * 4 * (1 - tightness * 0.5) + armOffset;

          const x = r * Math.cos(theta);
          const z = r * Math.sin(theta);
          const y = 0; // Arms in disk plane

          points.push(new THREE.Vector3(x, y, z));
        }
      }
    } else if (isEllipticalGalaxy(galaxy)) {
      // Render elliptical outline (3 rings at different angles)
      const params = galaxy.ellipticalParams;
      const segments = 64;

      // XZ plane
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = params.majorAxis * Math.cos(theta);
        const z = params.minorAxis * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0, z));
      }

      // XY plane
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = params.majorAxis * Math.cos(theta);
        const y = params.minorAxis * Math.sin(theta) * 0.5;
        points.push(new THREE.Vector3(x, y, 0));
      }
    } else if (isIrregularGalaxy(galaxy)) {
      // Render bounding sphere
      const params = galaxy.irregularParams;
      const segments = 32;

      // Equator
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = params.boundingRadius * Math.cos(theta);
        const z = params.boundingRadius * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0, z));
      }

      // Meridian
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = params.boundingRadius * Math.cos(theta);
        const y = params.boundingRadius * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, 0));
      }
    }

    // Create line geometry from points
    if (points.length > 0) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x444444,
        opacity: 0.2,
        transparent: true,
      });

      this.galaxyOutline = new THREE.LineSegments(geometry, material);
      this.galaxyGroup.add(this.galaxyOutline);
    }
  }

  /**
   * Render all star systems as instanced markers
   */
  private renderSystems(systems: GalaxySystemPlacement[]): void {
    if (systems.length === 0) return;

    // Create instanced mesh for all system markers
    const markerGeometry = new THREE.SphereGeometry(2, 8, 8); // Small sphere
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
    });

    this.systemMarkers = new THREE.InstancedMesh(
      markerGeometry,
      markerMaterial,
      systems.length
    );

    // Position each system marker
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();

    systems.forEach((placement, index) => {
      const pos = placement.position;
      position.set(pos.x, pos.y, pos.z);

      // Set instance matrix
      matrix.makeTranslation(position.x, position.y, position.z);
      this.systemMarkers!.setMatrixAt(index, matrix);

      // Store system data for raycasting/selection
      // Create invisible object at same position for raycasting
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      marker.position.copy(position);
      marker.userData = {
        type: 'galaxy-system',
        systemIndex: index,
        system: placement.system,
        position: placement.position,
        region: placement.region,
      };

      this.systemObjects.push(marker);
      this.galaxyGroup.add(marker);
    });

    this.systemMarkers.instanceMatrix.needsUpdate = true;
    this.systemMarkers.name = 'SystemMarkers';
    this.galaxyGroup.add(this.systemMarkers);

    console.log(`[GalaxyRenderer] Created instanced mesh with ${systems.length} markers`);
  }

  /**
   * Get all system marker objects for raycasting
   */
  public getSystemObjects(): THREE.Object3D[] {
    return this.systemObjects;
  }

  /**
   * Clear all galaxy rendering
   */
  public clear(): void {
    // Dispose of instanced mesh
    if (this.systemMarkers) {
      this.systemMarkers.geometry.dispose();
      if (this.systemMarkers.material instanceof THREE.Material) {
        this.systemMarkers.material.dispose();
      }
      this.galaxyGroup.remove(this.systemMarkers);
      this.systemMarkers = null;
    }

    // Dispose of outline
    if (this.galaxyOutline) {
      this.galaxyOutline.geometry.dispose();
      if (this.galaxyOutline.material instanceof THREE.Material) {
        this.galaxyOutline.material.dispose();
      }
      this.galaxyGroup.remove(this.galaxyOutline);
      this.galaxyOutline = null;
    }

    // Clear system objects
    this.systemObjects.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        }
      }
      this.galaxyGroup.remove(obj);
    });
    this.systemObjects = [];

    console.log('[GalaxyRenderer] Cleared galaxy rendering');
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.clear();
  }
}
