import * as THREE from 'three';

type ResourceOwner = THREE.Object3D & {
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
};

function asResourceOwner(object: THREE.Object3D): ResourceOwner {
  return object as ResourceOwner;
}

export function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  const materials = Array.isArray(material) ? material : [material];
  for (const item of materials) {
    item.dispose();
  }
}

export function disposeObjectResources(object: THREE.Object3D): void {
  const resourceOwner = asResourceOwner(object);
  resourceOwner.geometry?.dispose();

  if (resourceOwner.material) {
    disposeMaterial(resourceOwner.material);
  }
}

/**
 * Dispose geometry and materials owned by an object tree without altering its
 * parent/child structure. Shared resources are disposed only once per call.
 */
export function disposeObjectTree(root: THREE.Object3D): void {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();

  root.traverse((object) => {
    const resourceOwner = asResourceOwner(object);

    if (resourceOwner.geometry && !disposedGeometries.has(resourceOwner.geometry)) {
      disposedGeometries.add(resourceOwner.geometry);
      resourceOwner.geometry.dispose();
    }

    if (!resourceOwner.material) return;

    const materials = Array.isArray(resourceOwner.material)
      ? resourceOwner.material
      : [resourceOwner.material];

    for (const material of materials) {
      if (!disposedMaterials.has(material)) {
        disposedMaterials.add(material);
        material.dispose();
      }
    }
  });
}
