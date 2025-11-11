/**
 * Khora Engine - System State Store
 *
 * Zustand store for managing star system state, IDE state, and scene references.
 * Phase 1: Basic system generation and selection only (no save/load).
 * Phase 2: Galaxy generation with multiple star systems.
 */

import { create } from 'zustand';
import type * as THREE from 'three';
import type { StarSystem } from '../types/celestial-bodies';
import type { Galaxy } from '../types/galaxy';
import { SeededRandom } from '../utils/random';
import { generateStar } from '../generation/star-generator';
import { generatePlanets } from '../generation/planet-generator';
import { generateMoons } from '../generation/moon-generator';
import { distributePlanetResources, distributeMoonResources } from '../generation/resource-distributor';
import { generateGalaxy } from '../generation/galaxy-generator';

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
 * View mode for the application
 */
export type ViewMode = 'system' | 'galaxy';

/**
 * Main application state
 */
interface SystemStore {
  // ===== Star System State (Phase 1) =====

  /** Currently generated star system (null if none generated) */
  currentSystem: StarSystem | null;

  /** Loading state during generation */
  isGenerating: boolean;

  /** Last error during generation (null if no error) */
  generationError: string | null;

  // ===== Galaxy State (Phase 2) =====

  /** Currently generated galaxy (null if none generated) */
  currentGalaxy: Galaxy | null;

  /** Current view mode: 'system' for single system view, 'galaxy' for multi-system view */
  viewMode: ViewMode;

  /** Currently focused system within galaxy (for system-detail view) */
  focusedSystemIndex: number | null;

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
   * Generate a new star system from seed (Phase 1)
   * @param seed - Random seed for deterministic generation
   */
  generateSystem: (seed: number) => void;

  /**
   * Clear current system and reset state
   */
  clearSystem: () => void;

  /**
   * Generate a new galaxy with multiple star systems (Phase 2)
   * @param seed - Random seed for deterministic generation
   * @param systemCount - Number of star systems to generate (default: 12)
   */
  generateGalaxy: (seed: number, systemCount?: number) => void;

  /**
   * Clear current galaxy and reset to system view
   */
  clearGalaxy: () => void;

  /**
   * Switch view mode between system and galaxy
   * @param mode - View mode to switch to
   */
  setViewMode: (mode: ViewMode) => void;

  /**
   * Focus on a specific system within the galaxy
   * @param index - Index of the system in galaxy.systems array (null to unfocus)
   */
  focusSystem: (index: number | null) => void;

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
  currentGalaxy: null,
  viewMode: 'system',
  focusedSystemIndex: null,
  ideOpen: false,
  selectedObject: null,
  scene: null,
  camera: null,

  // Actions

  generateSystem: (seed: number) => {
    // Mark as generating
    set({ isGenerating: true, generationError: null });

    try {
      console.log(`[Store] Generating system with seed: ${seed}`);

      // Create RNG for this system
      const rng = new SeededRandom(seed);

      // Generate star
      const star = generateStar(seed);
      console.log(`[Store] Generated star: ${star.name} (${star.spectralType}-type)`);

      // Generate planets
      star.planets = generatePlanets(star, rng);
      console.log(`[Store] Generated ${star.planets.length} planets`);

      // Generate moons and resources for each planet
      star.planets.forEach((planet, i) => {
        // Generate moons
        planet.moons = generateMoons(planet, star.mass, rng);
        console.log(`[Store] Planet ${i} (${planet.name}): ${planet.moons.length} moons`);

        // Distribute planet resources
        planet.resources = distributePlanetResources(planet, rng);

        // Distribute moon resources
        planet.moons.forEach(moon => {
          moon.resources = distributeMoonResources(moon, planet, rng);
        });
      });

      // Create complete star system
      const system: StarSystem = {
        id: `system-${seed}`,
        name: star.name,
        seed,
        star,
        generatedAt: new Date()
      };

      // Update state
      set({
        currentSystem: system,
        isGenerating: false,
        generationError: null
      });

      console.log('[Store] System generation complete:', system);
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
  },

  // ===== Phase 2: Galaxy Actions =====

  generateGalaxy: (seed: number, systemCount = 12) => {
    // Mark as generating
    set({ isGenerating: true, generationError: null });

    try {
      console.log(`[Store] Generating galaxy with seed: ${seed}, ${systemCount} systems`);

      // Generate the galaxy
      const galaxy = generateGalaxy({ seed, systemCount });

      console.log(`[Store] Generated galaxy: ${galaxy.name} (${galaxy.type})`);
      console.log(`[Store] ${galaxy.systems.length} star systems generated`);

      // Update state
      set({
        currentGalaxy: galaxy,
        viewMode: 'galaxy',
        focusedSystemIndex: null,
        currentSystem: null, // Clear single system when viewing galaxy
        isGenerating: false,
        generationError: null
      });

      console.log('[Store] Galaxy generation complete:', galaxy);
    } catch (error) {
      console.error('[Store] Galaxy generation failed:', error);
      set({
        isGenerating: false,
        generationError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  clearGalaxy: () => {
    console.log('[Store] Clearing current galaxy');
    set({
      currentGalaxy: null,
      viewMode: 'system',
      focusedSystemIndex: null,
      selectedObject: null,
      generationError: null
    });
  },

  setViewMode: (mode: ViewMode) => {
    console.log(`[Store] Switching view mode to: ${mode}`);
    set({ viewMode: mode });

    // If switching to system view and no current system, unfocus any galaxy system
    if (mode === 'system' && !get().currentSystem) {
      set({ focusedSystemIndex: null });
    }
  },

  focusSystem: (index: number | null) => {
    const { currentGalaxy } = get();

    if (index !== null && currentGalaxy) {
      if (index < 0 || index >= currentGalaxy.systems.length) {
        console.error(`[Store] Invalid system index: ${index}`);
        return;
      }

      const system = currentGalaxy.systems[index].system;
      console.log(`[Store] Focusing on system ${index}: ${system.name}`);

      set({
        focusedSystemIndex: index,
        currentSystem: system,
        viewMode: 'system'
      });
    } else {
      console.log('[Store] Unfocusing system, returning to galaxy view');
      set({
        focusedSystemIndex: null,
        currentSystem: null,
        viewMode: 'galaxy'
      });
    }
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
 * Hook to get current galaxy
 */
export const useCurrentGalaxy = () => useSystemStore((state) => state.currentGalaxy);

/**
 * Hook to get view mode
 */
export const useViewMode = () => useSystemStore((state) => state.viewMode);

/**
 * Hook to get focused system index
 */
export const useFocusedSystemIndex = () => useSystemStore((state) => state.focusedSystemIndex);

/**
 * Hook to get all store actions
 */
export const useSystemActions = () => useSystemStore((state) => ({
  generateSystem: state.generateSystem,
  clearSystem: state.clearSystem,
  generateGalaxy: state.generateGalaxy,
  clearGalaxy: state.clearGalaxy,
  setViewMode: state.setViewMode,
  focusSystem: state.focusSystem,
  toggleIDE: state.toggleIDE,
  openIDE: state.openIDE,
  closeIDE: state.closeIDE,
  selectObject: state.selectObject,
  setScene: state.setScene,
  setCamera: state.setCamera
}));
