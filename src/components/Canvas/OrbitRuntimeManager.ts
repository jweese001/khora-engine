import * as THREE from 'three';
import { sampleOrbitPosition } from '../../orbits/orbit-solver';
import type { Moon, Planet, RotationalElements } from '../../types/celestial-bodies';

type PlanetRotationOverrides = Partial<RotationalElements>;

export interface MoonOrbitBinding {
  moon: Moon;
  object: THREE.Object3D;
  minSceneRadius: number;
  maxSceneRadius: number;
}

export interface PlanetOrbitBinding {
  planet: Planet;
  group: THREE.Group;
  tiltGroup: THREE.Group;
  planetObject: THREE.Object3D;
  orbitScale: number;
  moons: MoonOrbitBinding[];
}

export class OrbitRuntimeManager {
  private planetBindings: PlanetOrbitBinding[] = [];
  private trailObjects: THREE.Object3D[] = [];
  private trailVisibility = true;

  public configure(
    planetBindings: PlanetOrbitBinding[],
    trailObjects: THREE.Object3D[],
    trailVisibility: boolean,
  ): void {
    this.planetBindings = planetBindings;
    this.trailObjects = trailObjects;
    this.trailVisibility = trailVisibility;
    this.applyTrailVisibility();
  }

  public update(
    simulationTimeDays: number,
    motionOverrides: ReadonlyMap<string, PlanetRotationOverrides>,
  ): void {
    for (const binding of this.planetBindings) {
      const planetSample = sampleOrbitPosition(binding.planet.generatedOrbit, simulationTimeDays);
      binding.group.position.set(
        planetSample.localPosition.x * binding.orbitScale,
        planetSample.localPosition.y * binding.orbitScale,
        planetSample.localPosition.z * binding.orbitScale,
      );

      this.applyPlanetRotation(
        binding,
        simulationTimeDays,
        motionOverrides.get(binding.planet.id),
      );

      for (const moonBinding of binding.moons) {
        this.updateMoonPosition(moonBinding, simulationTimeDays);
      }
    }
  }

  public setTrailVisibility(visible: boolean): void {
    if (this.trailVisibility === visible) return;
    this.trailVisibility = visible;
    this.applyTrailVisibility();
  }

  public reset(): void {
    this.planetBindings = [];
    this.trailObjects = [];
  }

  private updateMoonPosition(binding: MoonOrbitBinding, simulationTimeDays: number): void {
    const moonSample = sampleOrbitPosition(binding.moon.generatedOrbit, simulationTimeDays);
    const direction = new THREE.Vector3(
      moonSample.localPosition.x,
      moonSample.localPosition.y,
      moonSample.localPosition.z,
    );

    if (direction.lengthSq() === 0) {
      binding.object.position.set(
        (binding.minSceneRadius + binding.maxSceneRadius) * 0.5,
        0,
        0,
      );
      return;
    }

    const mappedRadius = this.mapMoonOrbitRadiusToScene(
      binding.moon,
      binding.minSceneRadius,
      binding.maxSceneRadius,
      moonSample.radius,
    );

    direction.normalize().multiplyScalar(mappedRadius);
    binding.object.position.copy(direction);
  }

  public mapMoonOrbitRadiusToScene(
    moon: Moon,
    minSceneRadius: number,
    maxSceneRadius: number,
    sampledRadius: number,
  ): number {
    const orbit = moon.generatedOrbit;
    const minOrbitRadius = orbit.semiMajorAxis * (1 - orbit.eccentricity);
    const maxOrbitRadius = orbit.semiMajorAxis * (1 + orbit.eccentricity);

    if (Math.abs(maxOrbitRadius - minOrbitRadius) < 1e-6) {
      return (minSceneRadius + maxSceneRadius) * 0.5;
    }

    const normalized = (sampledRadius - minOrbitRadius) / (maxOrbitRadius - minOrbitRadius);
    return minSceneRadius
      + THREE.MathUtils.clamp(normalized, 0, 1) * (maxSceneRadius - minSceneRadius);
  }

  private applyPlanetRotation(
    binding: PlanetOrbitBinding,
    simulationTimeDays: number,
    override?: PlanetRotationOverrides,
  ): void {
    const rotation = this.resolvePlanetRotation(binding.planet, override);
    const direction = rotation.rotationDirection === 'retrograde' ? -1 : 1;
    const elapsedHours = simulationTimeDays * 24;
    const revolutions = elapsedHours / rotation.rotationPeriodHours;
    const spinDegrees = rotation.spinPhaseDegrees + revolutions * 360 * direction;

    binding.tiltGroup.rotation.z = THREE.MathUtils.degToRad(rotation.axialTiltDegrees);
    binding.planetObject.rotation.y = THREE.MathUtils.degToRad(spinDegrees);
  }

  private resolvePlanetRotation(
    planet: Planet,
    override?: PlanetRotationOverrides,
  ): RotationalElements {
    return {
      ...planet.generatedRotation,
      ...override,
      rotationPeriodHours: Math.max(
        0.1,
        override?.rotationPeriodHours ?? planet.generatedRotation.rotationPeriodHours,
      ),
      axialTiltDegrees: THREE.MathUtils.clamp(
        override?.axialTiltDegrees ?? planet.generatedRotation.axialTiltDegrees,
        0,
        180,
      ),
      rotationDirection: override?.rotationDirection ?? planet.generatedRotation.rotationDirection,
      spinPhaseDegrees: override?.spinPhaseDegrees ?? planet.generatedRotation.spinPhaseDegrees,
    };
  }

  private applyTrailVisibility(): void {
    for (const trail of this.trailObjects) {
      trail.visible = this.trailVisibility;
    }
  }
}
