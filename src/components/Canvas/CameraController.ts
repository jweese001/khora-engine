import { debugLog } from '../../utils/debug';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { StarSystem } from '../../types/celestial-bodies';
import type { Galaxy } from '../../types/galaxy';

interface CameraAnimation {
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  startTarget: THREE.Vector3;
  targetTarget: THREE.Vector3;
  progress: number;
  duration: number;
}

export class CameraController {
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private animation: CameraAnimation | null = null;
  private hasAnimatedToGalaxyView = false;

  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;
    this.controls.addEventListener('start', this.handleInteractionStart);
  }

  private readonly handleInteractionStart = (): void => {
    this.animation = null;
  };

  public animateTo(
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    duration = 1.5,
  ): void {
    this.animation = {
      startPosition: this.camera.position.clone(),
      targetPosition: targetPosition.clone(),
      startTarget: this.controls.target.clone(),
      targetTarget: targetLookAt.clone(),
      progress: 0,
      duration,
    };
  }

  public update(deltaTime: number): void {
    if (!this.animation) return;

    this.animation.progress += deltaTime / this.animation.duration;

    if (this.animation.progress >= 1) {
      this.camera.position.copy(this.animation.targetPosition);
      this.controls.target.copy(this.animation.targetTarget);
      this.controls.update();
      this.animation = null;
      return;
    }

    const easedProgress = this.easeInOutCubic(this.animation.progress);
    this.camera.position.lerpVectors(
      this.animation.startPosition,
      this.animation.targetPosition,
      easedProgress,
    );
    this.controls.target.lerpVectors(
      this.animation.startTarget,
      this.animation.targetTarget,
      easedProgress,
    );
    this.controls.update();
  }

  public focusObject(targetObject: THREE.Object3D): void {
    const worldPosition = new THREE.Vector3();
    targetObject.getWorldPosition(worldPosition);

    const bounds = new THREE.Box3().setFromObject(targetObject);
    const size = new THREE.Vector3();
    const sphere = new THREE.Sphere();
    bounds.getSize(size);
    bounds.getBoundingSphere(sphere);

    const radius = Number.isFinite(sphere.radius) && sphere.radius > 0
      ? sphere.radius
      : Math.max(size.length() * 0.25, 1.5);

    const direction = this.camera.position.clone().sub(this.controls.target);
    if (direction.lengthSq() === 0) {
      direction.set(1, 0.35, 1);
    }
    direction.normalize();

    const focusDistance = THREE.MathUtils.clamp(radius * 5, 12, 220);
    const targetPosition = worldPosition.clone().add(direction.multiplyScalar(focusDistance));
    this.animateTo(targetPosition, worldPosition, 0.85);
  }

  public focusSystem(system: StarSystem, orbitScale: number): void {
    const maxOrbitDistance = system.star.planets.reduce(
      (maximum, planet) => Math.max(maximum, planet.orbitDistance),
      0,
    );
    const systemRadius = maxOrbitDistance * orbitScale;
    const cameraDistance = systemRadius * 2.5;

    this.setDistanceLimits(5, 5000);
    this.animateTo(
      new THREE.Vector3(cameraDistance * 0.5, cameraDistance * 0.5, cameraDistance),
      new THREE.Vector3(0, 0, 0),
      1.2,
    );
  }

  public focusGalaxy(galaxy: Galaxy, returningFromSystemView = false): void {
    const galaxyRadius = galaxy.spiralParams?.diskRadius
      ?? galaxy.ellipticalParams?.majorAxis
      ?? galaxy.irregularParams?.boundingRadius
      ?? 100;

    const targetPosition = new THREE.Vector3(13.26, 81.14, 56.30);
    const targetLookAt = new THREE.Vector3(2.31, 0, 6.86);
    this.setDistanceLimits(galaxyRadius * 0.1, galaxyRadius * 5);

    if (this.hasAnimatedToGalaxyView && !returningFromSystemView) {
      return;
    }

    if (returningFromSystemView && this.hasAnimatedToGalaxyView) {
      this.setPositionAndTarget(
        new THREE.Vector3(3.58, 9.41, 12.59),
        new THREE.Vector3(2.31, 0, 6.86),
      );
      this.animateTo(targetPosition, targetLookAt, 0.8);
      return;
    }

    this.setPositionAndTarget(
      new THREE.Vector3(65.23, 286.34, 311.32),
      new THREE.Vector3(0, 0, 0),
    );
    this.animateTo(targetPosition, targetLookAt, 1);
    this.hasAnimatedToGalaxyView = true;
  }

  public setDistanceLimits(minDistance: number, maxDistance: number): void {
    this.controls.minDistance = minDistance;
    this.controls.maxDistance = maxDistance;
  }

  public printDebugPosition(): void {
    debugLog('═══════════════════════════════════════');
    debugLog('CAMERA POSITION:');
    debugLog(
      `  position: new THREE.Vector3(${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)})`,
    );
    debugLog(
      `  lookAt: new THREE.Vector3(${this.controls.target.x.toFixed(2)}, ${this.controls.target.y.toFixed(2)}, ${this.controls.target.z.toFixed(2)})`,
    );
    debugLog('═══════════════════════════════════════');
  }

  public dispose(): void {
    this.controls.removeEventListener('start', this.handleInteractionStart);
    this.animation = null;
  }

  private setPositionAndTarget(position: THREE.Vector3, target: THREE.Vector3): void {
    this.camera.position.copy(position);
    this.controls.target.copy(target);
    this.controls.update();
  }

  private easeInOutCubic(progress: number): number {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }
}
