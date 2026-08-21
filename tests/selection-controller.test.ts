import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { SelectionController } from '../src/components/Canvas/SelectionController';
import { generateSystem } from '../src/generation/system-generator';

function createDomStub(): {
  domElement: HTMLElement;
  click: (x?: number, y?: number) => void;
  removeListener: ReturnType<typeof vi.fn>;
} {
  let clickListener: ((event: MouseEvent) => void) | null = null;
  const removeListener = vi.fn((type: string, listener: (event: MouseEvent) => void) => {
    if (type === 'click' && listener === clickListener) clickListener = null;
  });
  const domElement = {
    addEventListener: (type: string, listener: (event: MouseEvent) => void) => {
      if (type === 'click') clickListener = listener;
    },
    removeEventListener: removeListener,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  } as unknown as HTMLElement;

  return {
    domElement,
    click: (x = 50, y = 50) => clickListener?.({ clientX: x, clientY: y } as MouseEvent),
    removeListener,
  };
}

function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}

describe('SelectionController', () => {
  it('reports a typed celestial selection from a center click', () => {
    const system = generateSystem(42);
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
    );
    mesh.userData = { type: 'star', data: system.star };
    scene.add(mesh);
    scene.updateMatrixWorld(true);
    const { domElement, click } = createDomStub();
    const onSelection = vi.fn();
    const controller = new SelectionController({
      domElement,
      scene,
      camera: createCamera(),
      getViewMode: () => 'system',
      areMarkersClickable: () => true,
      getMarkerPointObjects: () => [],
      getFallbackSystem: () => undefined,
      onSystemSelected: vi.fn(),
      onSelection,
    });

    click();

    expect(onSelection).toHaveBeenCalledWith(expect.objectContaining({
      type: 'star',
      data: system.star,
      material: mesh.material,
    }));
    controller.dispose();
  });

  it('selects a galaxy system from marker user data', () => {
    const system = generateSystem(1);
    const markerGeometry = new THREE.BufferGeometry();
    markerGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0], 3),
    );
    const markerPoints = new THREE.Points(markerGeometry, new THREE.PointsMaterial({ size: 1 }));
    markerPoints.userData.markers = [{ data: system }];
    markerPoints.updateMatrixWorld(true);
    const { domElement, click } = createDomStub();
    const onSystemSelected = vi.fn();
    const controller = new SelectionController({
      domElement,
      scene: new THREE.Scene(),
      camera: createCamera(),
      getViewMode: () => 'galaxy',
      areMarkersClickable: () => true,
      getMarkerPointObjects: () => [markerPoints],
      getFallbackSystem: () => undefined,
      onSystemSelected,
      onSelection: vi.fn(),
    });

    click();

    expect(onSystemSelected).toHaveBeenCalledWith(system);
    controller.dispose();
  });

  it('ignores galaxy clicks when markers are disabled and removes its listener', () => {
    const { domElement, click, removeListener } = createDomStub();
    const onSystemSelected = vi.fn();
    const controller = new SelectionController({
      domElement,
      scene: new THREE.Scene(),
      camera: createCamera(),
      getViewMode: () => 'galaxy',
      areMarkersClickable: () => false,
      getMarkerPointObjects: () => [],
      getFallbackSystem: () => undefined,
      onSystemSelected,
      onSelection: vi.fn(),
    });

    click();
    controller.dispose();

    expect(onSystemSelected).not.toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalledOnce();
  });
});
