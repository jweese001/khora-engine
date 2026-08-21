import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraController } from '../src/components/Canvas/CameraController';
import type { Galaxy } from '../src/types/galaxy';
import type { StarSystem } from '../src/types/celestial-bodies';

function createControlsStub(): {
  controls: OrbitControls;
  update: ReturnType<typeof vi.fn>;
  dispatchStart: () => void;
} {
  let startListener: (() => void) | null = null;
  const update = vi.fn();
  const controls = {
    target: new THREE.Vector3(),
    minDistance: 0,
    maxDistance: 0,
    update,
    addEventListener: (type: string, listener: () => void) => {
      if (type === 'start') startListener = listener;
    },
    removeEventListener: (type: string, listener: () => void) => {
      if (type === 'start' && startListener === listener) startListener = null;
    },
  } as unknown as OrbitControls;

  return {
    controls,
    update,
    dispatchStart: () => startListener?.(),
  };
}

describe('CameraController', () => {
  it('interpolates and completes a camera transition', () => {
    const camera = new THREE.PerspectiveCamera();
    const { controls, update } = createControlsStub();
    const controller = new CameraController(camera, controls);

    controller.animateTo(new THREE.Vector3(10, 20, 30), new THREE.Vector3(1, 2, 3), 1);
    controller.update(0.5);

    expect(camera.position.toArray()).toEqual([5, 10, 15]);
    expect(controls.target.toArray()).toEqual([0.5, 1, 1.5]);

    controller.update(0.5);

    expect(camera.position.toArray()).toEqual([10, 20, 30]);
    expect(controls.target.toArray()).toEqual([1, 2, 3]);
    expect(update).toHaveBeenCalled();
  });

  it('cancels an active transition when controls interaction starts', () => {
    const camera = new THREE.PerspectiveCamera();
    const { controls, dispatchStart } = createControlsStub();
    const controller = new CameraController(camera, controls);

    controller.animateTo(new THREE.Vector3(10, 0, 0), new THREE.Vector3(), 1);
    dispatchStart();
    controller.update(1);

    expect(camera.position.x).toBe(0);
  });

  it('frames a system and applies system distance limits', () => {
    const camera = new THREE.PerspectiveCamera();
    const { controls } = createControlsStub();
    const controller = new CameraController(camera, controls);
    const system = {
      star: {
        planets: [
          { orbitDistance: 2 },
          { orbitDistance: 5 },
        ],
      },
    } as StarSystem;

    controller.focusSystem(system, 10);
    controller.update(1.2);

    expect(controls.minDistance).toBe(5);
    expect(controls.maxDistance).toBe(5000);
    expect(camera.position.toArray()).toEqual([62.5, 62.5, 125]);
  });

  it('uses galaxy scale for distance limits', () => {
    const camera = new THREE.PerspectiveCamera();
    const { controls } = createControlsStub();
    const controller = new CameraController(camera, controls);
    const galaxy = {
      spiralParams: { diskRadius: 200 },
    } as Galaxy;

    controller.focusGalaxy(galaxy);

    expect(controls.minDistance).toBe(20);
    expect(controls.maxDistance).toBe(1000);
  });
});
