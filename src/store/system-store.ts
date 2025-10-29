/**
 * Khora Engine - System State Store
 *
 * Zustand store for managing star system state, IDE state, and scene references.
 * Phase 1: Basic system generation and selection only (no save/load).
 */

import { create } from 'zustand';
import type * as THREE from 'three';
import type { StarSystem } from '../types/celestial-bodies';

// ============================================================================
// Store State Interface
// ============================================================================

/**
 * Selected object information for IDE display
 */
interface SelectedObject {
  type: 'star' | 'planet' | 'moon';
  data: any; // Will be Star, Planet, or Moon
  material?: THREE.Material; // Reference to Three.js material (for shader inspection)
}

/**
 * Main application state
 */
interface SystemStore {
  // ===== Star System State =====

  /** Currently generated star system (null if none generated) */
  currentSystem: StarSystem | null;

  /** Loading state during generation */
  isGenerating: boolean;

  /** Last error during generation (null if no error) */
  generationError: string | null;

  // ===== IDE State =====

  /** Whether IDE panel is open */
  ideOpen: boolean;

  /** Currently selected object in scene (for inspection) */
  selectedObject: SelectedObject | null;

  // ===== Scene State =====

  /** Reference to Three.js scene (set by ThreeSceneManager) */
  scene: THREE.Scene | null;

  /** Reference to Three.js camera (for object picking) */
  camera: THREE.Camera | null;

  // ===== Actions =====

  /**
   * Generate a new star system from seed
   * @param seed - Random seed for deterministic generation
   */
  generateSystem: (seed: number) => void;

  /**
   * Clear current system and reset state
   */
  clearSystem: () => void;

  /**
   * Toggle IDE panel open/closed
   */
  toggleIDE: () => void;

  /**
   * Open IDE panel
   */
  openIDE: () => void;

  /**
   * Close IDE panel
   */
  closeIDE: () => void;

  /**
   * Select an object in the scene for inspection
   * @param selection - Object to select (null to deselect)
   */
  selectObject: (selection: SelectedObject | null) => void;

  /**
   * Set scene reference (called by ThreeSceneManager on mount)
   * @param scene - Three.js scene instance
   */
  setScene: (scene: THREE.Scene | null) => void;

  /**
   * Set camera reference (called by ThreeSceneManager on mount)
   * @param camera - Three.js camera instance
   */
  setCamera: (camera: THREE.Camera | null) => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useSystemStore = create<SystemStore>((set, get) => ({
  // Initial state
  currentSystem: null,
  isGenerating: false,
  generationError: null,
  ideOpen: false,
  selectedObject: null,
  scene: null,
  camera: null,

  // Actions

  generateSystem: (seed: number) => {
    // Mark as generating
    set({ isGenerating: true, generationError: null });

    try {
      // TODO: Implement actual generation in Weeks 2-3
      // For now, just log the seed
      console.log(`[STUB] generateSystem called with seed: ${seed}`);

      // Placeholder: In real implementation, this will call:
      // const star = generateStar(seed);
      // const system: StarSystem = {
      //   id: `system-${seed}`,
      //   name: star.name,
      //   seed,
      //   star,
      //   generatedAt: new Date()
      // };

      // For now, set to null (no generation yet)
      set({
        currentSystem: null,
        isGenerating: false,
        generationError: null
      });

      console.log('[Store] System generation complete (stub)');
    } catch (error) {
      console.error('[Store] System generation failed:', error);
      set({
        isGenerating: false,
        generationError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  clearSystem: () => {
    console.log('[Store] Clearing current system');
    set({
      currentSystem: null,
      selectedObject: null,
      generationError: null
    });
  },

  toggleIDE: () => {
    const { ideOpen } = get();
    console.log(`[Store] Toggling IDE: ${ideOpen} -> ${!ideOpen}`);
    set({ ideOpen: !ideOpen });
  },

  openIDE: () => {
    console.log('[Store] Opening IDE');
    set({ ideOpen: true });
  },

  closeIDE: () => {
    console.log('[Store] Closing IDE');
    set({ ideOpen: false });
  },

  selectObject: (selection: SelectedObject | null) => {
    if (selection) {
      console.log(`[Store] Selected ${selection.type}:`, selection.data);
    } else {
      console.log('[Store] Deselected object');
    }
    set({ selectedObject: selection });

    // Automatically open IDE when selecting an object
    if (selection && !get().ideOpen) {
      get().openIDE();
    }
  },

  setScene: (scene: THREE.Scene | null) => {
    console.log('[Store] Scene reference updated');
    set({ scene });
  },

  setCamera: (camera: THREE.Camera | null) => {
    console.log('[Store] Camera reference updated');
    set({ camera });
  }
}));

// ============================================================================
// Selector Hooks (Optional convenience hooks)
// ============================================================================

/**
 * Hook to get current system
 */
export const useCurrentSystem = () => useSystemStore((state) => state.currentSystem);

/**
 * Hook to get IDE open state
 */
export const useIDEOpen = () => useSystemStore((state) => state.ideOpen);

/**
 * Hook to get selected object
 */
export const useSelectedObject = () => useSystemStore((state) => state.selectedObject);

/**
 * Hook to get generation loading state
 */
export const useIsGenerating = () => useSystemStore((state) => state.isGenerating);

/**
 * Hook to get all store actions
 */
export const useSystemActions = () => useSystemStore((state) => ({
  generateSystem: state.generateSystem,
  clearSystem: state.clearSystem,
  toggleIDE: state.toggleIDE,
  openIDE: state.openIDE,
  closeIDE: state.closeIDE,
  selectObject: state.selectObject,
  setScene: state.setScene,
  setCamera: state.setCamera
}));
