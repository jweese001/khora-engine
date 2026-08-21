import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { generateSystem } from '../src/generation/system-generator';
import { sampleOrbitPosition } from '../src/orbits/orbit-solver';
import {
  OrbitRuntimeManager,
  type PlanetOrbitBinding,
} from '../src/components/Canvas/OrbitRuntimeManager';

function createBinding(): PlanetOrbitBinding {
  const system = generateSystem(1);
  const planet = system.star.planets.find((candidate) => candidate.moons.length > 0);
  if (!planet) throw new Error('Expected seed 1 to generate a planet with a moon');

  const group = new THREE.Group();
  const tiltGroup = new THREE.Group();
  const planetObject = new THREE.Object3D();
  tiltGroup.add(planetObject);
  group.add(tiltGroup);

  return {
    planet,
    group,
    tiltGroup,
    planetObject,
    orbitScale: 20,
    moons: [{
      moon: planet.moons[0],
      object: new THREE.Object3D(),
      minSceneRadius: 3,
      maxSceneRadius: 8,
    }],
  };
}

describe('OrbitRuntimeManager', () => {
  it('updates planet and moon transforms from absolute simulation time', () => {
    const manager = new OrbitRuntimeManager();
    const binding = createBinding();
    manager.configure([binding], [], true);

    manager.update(25, new Map());

    const expectedPlanet = sampleOrbitPosition(binding.planet.generatedOrbit, 25);
    expect(binding.group.position.x).toBeCloseTo(expectedPlanet.localPosition.x * 20, 10);
    expect(binding.group.position.y).toBeCloseTo(expectedPlanet.localPosition.y * 20, 10);
    expect(binding.group.position.z).toBeCloseTo(expectedPlanet.localPosition.z * 20, 10);

    const moonDistance = binding.moons[0].object.position.length();
    expect(moonDistance).toBeGreaterThanOrEqual(3);
    expect(moonDistance).toBeLessThanOrEqual(8);
  });

  it('applies bounded planet rotation overrides', () => {
    const manager = new OrbitRuntimeManager();
    const binding = createBinding();
    manager.configure([binding], [], true);

    manager.update(1, new Map([
      [binding.planet.id, {
        rotationPeriodHours: 24,
        axialTiltDegrees: 220,
        rotationDirection: 'retrograde' as const,
        spinPhaseDegrees: 15,
      }],
    ]));

    expect(binding.tiltGroup.rotation.z).toBeCloseTo(Math.PI, 10);
    expect(binding.planetObject.rotation.y).toBeCloseTo(
      THREE.MathUtils.degToRad(-345),
      10,
    );
  });

  it('synchronizes trail visibility and resets bindings', () => {
    const manager = new OrbitRuntimeManager();
    const binding = createBinding();
    const trail = new THREE.Object3D();
    manager.configure([binding], [trail], false);

    expect(trail.visible).toBe(false);

    manager.setTrailVisibility(true);
    expect(trail.visible).toBe(true);

    const originalPosition = binding.group.position.clone();
    manager.reset();
    manager.update(50, new Map());
    expect(binding.group.position).toEqual(originalPosition);
  });
});
