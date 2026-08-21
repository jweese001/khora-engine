import type * as THREE from 'three';
import type { Moon, Planet, Star } from './celestial-bodies';

export type UniformOverrideValue =
  | number
  | string
  | boolean
  | readonly number[]
  | THREE.Color
  | THREE.Vector2
  | THREE.Vector3
  | THREE.Vector4;

export type SelectedObject =
  | { type: 'star'; data: Star; material?: THREE.Material | THREE.Material[] }
  | { type: 'planet'; data: Planet; material?: THREE.Material | THREE.Material[] }
  | { type: 'moon'; data: Moon; material?: THREE.Material | THREE.Material[] };

export interface GalaxySystemSelection {
  type: 'galaxy-system';
  systemIndex: number;
}

export type SceneSelectionPayload = SelectedObject | GalaxySystemSelection | null;
