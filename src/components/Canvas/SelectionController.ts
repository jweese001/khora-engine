import * as THREE from 'three';
import type { StarSystem } from '../../types/celestial-bodies';
import type { SceneSelectionPayload, SelectedObject } from '../../types/scene';

interface SelectionControllerDeps {
  domElement: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.Camera;
  getViewMode: () => 'system' | 'galaxy';
  areMarkersClickable: () => boolean;
  getMarkerPointObjects: () => THREE.Points[];
  getFallbackSystem: (markerIndex: number) => StarSystem | undefined;
  onSystemSelected: (system: StarSystem) => void;
  onSelection: (selection: SceneSelectionPayload) => void;
}

export class SelectionController {
  private readonly domElement: HTMLElement;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.Camera;
  private readonly getViewMode: SelectionControllerDeps['getViewMode'];
  private readonly areMarkersClickable: SelectionControllerDeps['areMarkersClickable'];
  private readonly getMarkerPointObjects: SelectionControllerDeps['getMarkerPointObjects'];
  private readonly getFallbackSystem: SelectionControllerDeps['getFallbackSystem'];
  private readonly onSystemSelected: SelectionControllerDeps['onSystemSelected'];
  private readonly onSelection: SelectionControllerDeps['onSelection'];
  private readonly raycaster = new THREE.Raycaster();
  private readonly mouse = new THREE.Vector2();

  constructor(deps: SelectionControllerDeps) {
    this.domElement = deps.domElement;
    this.scene = deps.scene;
    this.camera = deps.camera;
    this.getViewMode = deps.getViewMode;
    this.areMarkersClickable = deps.areMarkersClickable;
    this.getMarkerPointObjects = deps.getMarkerPointObjects;
    this.getFallbackSystem = deps.getFallbackSystem;
    this.onSystemSelected = deps.onSystemSelected;
    this.onSelection = deps.onSelection;

    this.raycaster.params.Points.threshold = 0.4;
    this.domElement.addEventListener('click', this.handleClick);
  }

  public dispose(): void {
    this.domElement.removeEventListener('click', this.handleClick);
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.getViewMode() === 'galaxy') {
      this.selectGalaxySystem();
    } else {
      this.selectCelestialObject();
    }
  };

  private selectGalaxySystem(): void {
    if (!this.areMarkersClickable()) return;

    for (const markerPoints of this.getMarkerPointObjects()) {
      if (!markerPoints.visible) continue;

      const intersection = this.raycaster.intersectObject(markerPoints, false)[0];
      if (!intersection || intersection.index === undefined) continue;

      const markers: unknown = markerPoints.userData?.markers;
      const marker = Array.isArray(markers) ? markers[intersection.index] : undefined;
      const system = this.extractStarSystem(marker)
        ?? this.getFallbackSystem(intersection.index);

      if (system) {
        this.onSystemSelected(system);
      }
      return;
    }
  }

  private selectCelestialObject(): void {
    const intersections = this.raycaster.intersectObjects(
      this.scene.children.filter(
        (object) => object.name !== 'starfield' && !object.name.startsWith('orbit-'),
      ),
      true,
    );

    if (intersections.length === 0) {
      this.onSelection(null);
      return;
    }

    const meshObject = intersections[0].object as THREE.Mesh;
    let selectedObject: THREE.Object3D | null = intersections[0].object;

    while (selectedObject && !selectedObject.userData?.type) {
      selectedObject = selectedObject.parent;
    }

    if (!selectedObject) return;

    const { type, data } = selectedObject.userData;
    if ((type !== 'star' && type !== 'planet' && type !== 'moon') || !data) return;

    this.onSelection({
      type,
      data,
      material: meshObject.material,
    } as SelectedObject);
  }

  private extractStarSystem(value: unknown): StarSystem | undefined {
    if (!value || typeof value !== 'object') return undefined;

    const candidate = value as Record<string, unknown>;
    if (
      typeof candidate.id === 'string'
      && typeof candidate.name === 'string'
      && typeof candidate.seed === 'number'
      && candidate.star
      && typeof candidate.star === 'object'
    ) {
      return candidate as unknown as StarSystem;
    }

    return this.extractStarSystem(candidate.data)
      ?? this.extractStarSystem(candidate.system);
  }
}
