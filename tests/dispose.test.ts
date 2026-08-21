import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { disposeMaterial, disposeObjectResources, disposeObjectTree } from '../src/rendering/dispose';

describe('Three.js disposal helpers', () => {
  it('disposes shared tree resources only once per traversal', () => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshBasicMaterial();
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const materialDispose = vi.spyOn(material, 'dispose');
    const root = new THREE.Group();

    root.add(
      new THREE.Mesh(geometry, material),
      new THREE.Mesh(geometry, material),
    );

    disposeObjectTree(root);

    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
  });

  it('disposes standalone geometry and material arrays', () => {
    const geometry = new THREE.BufferGeometry();
    const firstMaterial = new THREE.MeshBasicMaterial();
    const secondMaterial = new THREE.MeshBasicMaterial();
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const firstDispose = vi.spyOn(firstMaterial, 'dispose');
    const secondDispose = vi.spyOn(secondMaterial, 'dispose');
    const mesh = new THREE.Mesh(geometry, [firstMaterial, secondMaterial]);

    disposeObjectResources(mesh);

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(firstDispose).toHaveBeenCalledOnce();
    expect(secondDispose).toHaveBeenCalledOnce();
  });

  it('disposes a direct material array', () => {
    const firstMaterial = new THREE.MeshBasicMaterial();
    const secondMaterial = new THREE.MeshBasicMaterial();
    const firstDispose = vi.spyOn(firstMaterial, 'dispose');
    const secondDispose = vi.spyOn(secondMaterial, 'dispose');

    disposeMaterial([firstMaterial, secondMaterial]);

    expect(firstDispose).toHaveBeenCalledOnce();
    expect(secondDispose).toHaveBeenCalledOnce();
  });
});
