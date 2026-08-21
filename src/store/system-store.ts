/**
 * Khora Engine - System State Store
 *
 * Zustand store for managing star system state, IDE state, and scene references.
 * Phase 1: Basic system generation and selection only (no save/load).
 * Phase 2: Galaxy generation with multiple star systems.
 */

import { debugLog } from '../utils/debug';
import { create } from 'zustand';
import type * as THREE from 'three';
import type { RotationalElements, StarSystem } from '../types/celestial-bodies';
import type { Galaxy } from '../types/galaxy';
import type { SelectedObject, UniformOverrideValue } from '../types/scene';
import { generateSystem as buildSystem } from '../generation/system-generator';
import { generateGalaxy } from '../generation/galaxy-generator';
import { useGalaxyStore } from './galaxy-store';

// ============================================================================
// Store State Interface
// ============================================================================

/**
 * View mode for the application
 */
export type ViewMode = 'system' | 'galaxy';

/**
 * App mode for phase selection
 */
export type AppMode = 'landing' | 'diceRoll' | 'architect' | 'explorer';

/**
 * Uniform override for a celestial body (Phase 3: Architect Mode)
 */
export interface UniformOverrides {
  [uniformName: string]: UniformOverrideValue;
}

export type PlanetMotionOverrides = Partial<RotationalElements>;

/**
 * Main application state
 */
interface SystemStore {
  // ===== App Mode (Phase 2 - Landing Page) =====

  /** Current application mode */
  appMode: AppMode;

  /** Resource budget from dice roll (null if not yet rolled) */
  resourceBudget: number | null;

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

  // ===== Simulation Time State =====

  /** Global simulation time in Earth days */
  simulationTimeDays: number;

  /** Global time scale multiplier used by moving systems */
  timeScale: number;

  /** Whether global simulation time is paused */
  isTimePaused: boolean;

  /** Reset target for simulation time */
  initialSimulationTimeDays: number;

  /** Whether orbit trails are visible in system view */
  showOrbitTrails: boolean;

  /** Whether selected objects should auto-focus in scene view */
  autoFocusSelection: boolean;

  /** Whether left control drawer is open */
  controlDrawerOpen: boolean;

  // ===== IDE State =====

  /** Whether IDE panel is open */
  ideOpen: boolean;

  /** Currently selected object in scene (for inspection) */
  selectedObject: SelectedObject | null;

  // ===== Architect Mode State (Phase 3) =====

  /** Uniform overrides for celestial bodies (object ID -> uniform overrides map) */
  uniformOverrides: Map<string, UniformOverrides>;

  /** Motion overrides for planets (object ID -> rotation override map) */
  planetMotionOverrides: Map<string, PlanetMotionOverrides>;

  // ===== Scene State =====

  /** Reference to Three.js scene (set by ThreeSceneManager) */
  scene: THREE.Scene | null;

  /** Reference to Three.js camera (for object picking) */
  camera: THREE.Camera | null;

  // ===== Actions =====

  /**
   * Set the application mode (landing, architect, explorer)
   * @param mode - App mode to switch to
   */
  setAppMode: (mode: AppMode) => void;

  /**
   * Set the resource budget from dice roll
   * @param budget - Total resource points available
   */
  setResourceBudget: (budget: number) => void;

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
   * Set the current system directly (for custom markers not in galaxy)
   * @param system - StarSystem to set as current (or null to clear)
   */
  setCurrentSystem: (system: StarSystem | null) => void;

  /** Advance global simulation time using real delta seconds */
  advanceSimulationTime: (deltaSeconds: number) => void;

  /** Set the current global time scale */
  setTimeScale: (scale: number) => void;

  /** Pause global simulation time */
  pauseTime: () => void;

  /** Resume global simulation time */
  resumeTime: () => void;

  /** Toggle paused state for global simulation time */
  toggleTimePaused: () => void;

  /** Reset global simulation time to baseline */
  resetSimulationTime: () => void;

  /** Toggle orbit trail visibility in system view */
  toggleOrbitTrails: () => void;

  /** Toggle scene auto-focus on selection */
  toggleAutoFocusSelection: () => void;

  /** Toggle left control drawer */
  toggleControlDrawer: () => void;

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

  // ===== Architect Mode Actions (Phase 3) =====

  /**
   * Update a shader uniform for a celestial body
   * @param objectId - ID of the celestial body (star, planet, or moon)
   * @param uniformName - Name of the uniform to update
   * @param value - New value for the uniform
   */
  updateUniform: (objectId: string, uniformName: string, value: UniformOverrideValue) => void;

  /**
   * Reset all shader uniforms for an object to procedural defaults
   * @param objectId - ID of the celestial body
   */
  resetObjectUniforms: (objectId: string) => void;

  /**
   * Get uniform overrides for a specific object
   * @param objectId - ID of the celestial body
   * @returns Uniform overrides or undefined if no overrides exist
   */
  getObjectUniforms: (objectId: string) => UniformOverrides | undefined;

  /** Merge motion override values for a planet */
  updatePlanetMotionOverride: (objectId: string, overrides: PlanetMotionOverrides) => void;

  /** Reset motion overrides for a planet */
  resetPlanetMotionOverrides: (objectId: string) => void;

  /** Get motion overrides for a planet */
  getPlanetMotionOverride: (objectId: string) => PlanetMotionOverrides | undefined;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useSystemStore = create<SystemStore>((set, get) => ({
  // Initial state
  appMode: 'landing',
  resourceBudget: null,
  currentSystem: null,
  isGenerating: false,
  generationError: null,
  currentGalaxy: null,
  viewMode: 'system',
  focusedSystemIndex: null,
  simulationTimeDays: 0,
  timeScale: 1,
  isTimePaused: true,
  initialSimulationTimeDays: 0,
  showOrbitTrails: true,
  autoFocusSelection: false,
  controlDrawerOpen: false,
  ideOpen: false,
  selectedObject: null,
  uniformOverrides: new Map(),
  planetMotionOverrides: new Map(),
  scene: null,
  camera: null,

  // Actions

  setAppMode: (mode: AppMode) => {
    debugLog(`[Store] Switching app mode to: ${mode}`);
    set({ appMode: mode });
  },

  setResourceBudget: (budget: number) => {
    debugLog(`[Store] Setting resource budget: ${budget} points`);
    set({ resourceBudget: budget });
  },

  generateSystem: (seed: number) => {
    // Mark as generating (clear overrides for fresh start)
    set({
      isGenerating: true,
      generationError: null,
      uniformOverrides: new Map(),
      planetMotionOverrides: new Map(),
      selectedObject: null
    });

    try {
      debugLog(`[Store] Generating system with seed: ${seed}`);

      const system = buildSystem(seed);

      // Update state
      set({
        currentSystem: system,
        isGenerating: false,
        generationError: null,
        viewMode: 'system',
        focusedSystemIndex: null,
        simulationTimeDays: 0,
        initialSimulationTimeDays: 0,
        isTimePaused: true
      });

      debugLog('[Store] System generation complete:', system);
    } catch (error) {
      console.error('[Store] System generation failed:', error);
      set({
        isGenerating: false,
        generationError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  clearSystem: () => {
    debugLog('[Store] Clearing current system');
    set({
      currentSystem: null,
      selectedObject: null,
      generationError: null,
      uniformOverrides: new Map(), // Clear overrides when clearing system
      planetMotionOverrides: new Map()
    });
  },

  toggleIDE: () => {
    const { ideOpen } = get();
    debugLog(`[Store] Toggling IDE: ${ideOpen} -> ${!ideOpen}`);
    set({ ideOpen: !ideOpen });
  },

  openIDE: () => {
    debugLog('[Store] Opening IDE');
    set({ ideOpen: true });
  },

  closeIDE: () => {
    debugLog('[Store] Closing IDE');
    set({ ideOpen: false });
  },

  selectObject: (selection: SelectedObject | null) => {
    if (selection) {
      debugLog(`[Store] Selected ${selection.type}:`, selection.data);
    } else {
      debugLog('[Store] Deselected object');
    }
    set({ selectedObject: selection });

    // Auto-open left control drawer for contextual editing.
    // Do not auto-open inspector anymore.
    if (selection && !get().controlDrawerOpen) {
      get().toggleControlDrawer();
    }
  },

  setScene: (scene: THREE.Scene | null) => {
    debugLog('[Store] Scene reference updated');
    set({ scene });
  },

  setCamera: (camera: THREE.Camera | null) => {
    debugLog('[Store] Camera reference updated');
    set({ camera });
  },

  // ===== Phase 2: Galaxy Actions =====

  generateGalaxy: (seed: number, systemCount = 12) => {
    // Mark as generating (clear overrides for fresh start)
    set({
      isGenerating: true,
      generationError: null,
      uniformOverrides: new Map(),
      planetMotionOverrides: new Map(),
      selectedObject: null
    });

    try {
      debugLog(`[Store] Generating galaxy with seed: ${seed}, ${systemCount} systems`);

      // Generate the galaxy
      const galaxy = generateGalaxy({ seed, systemCount });

      debugLog(`[Store] Generated galaxy: ${galaxy.name} (${galaxy.type})`);
      debugLog(`[Store] ${galaxy.systems.length} star systems generated`);

      // Update state
      set({
        currentGalaxy: galaxy,
        viewMode: 'galaxy',
        focusedSystemIndex: null,
        currentSystem: null, // Clear single system when viewing galaxy
        isGenerating: false,
        generationError: null
      });

      // Initialize visual galaxy layers from procedural galaxy (Phase 2.5)
      // All 3 layers become visible as variations of the generated galaxy
      useGalaxyStore.getState().initializeFromProceduralGalaxy(galaxy);

      debugLog('[Store] Galaxy generation complete:', galaxy);
    } catch (error) {
      console.error('[Store] Galaxy generation failed:', error);
      set({
        isGenerating: false,
        generationError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  clearGalaxy: () => {
    debugLog('[Store] Clearing current galaxy');
    set({
      currentGalaxy: null,
      viewMode: 'system',
      focusedSystemIndex: null,
      selectedObject: null,
      generationError: null,
      uniformOverrides: new Map(), // Clear overrides when clearing galaxy
      planetMotionOverrides: new Map()
    });

    // Deactivate visual galaxy particle system layers (Phase 2.5)
    useGalaxyStore.getState().deactivateGalaxyLayers();
  },

  setViewMode: (mode: ViewMode) => {
    debugLog(`[Store] Switching view mode to: ${mode}`);
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
      debugLog(`[Store] Focusing on system ${index}: ${system.name}`);

      set({
        focusedSystemIndex: index,
        currentSystem: system,
        viewMode: 'system',
        uniformOverrides: new Map(), // Clear overrides when switching systems
        planetMotionOverrides: new Map(),
        selectedObject: null // Deselect object when switching systems
      });
    } else {
      debugLog('[Store] Unfocusing system, returning to galaxy view');
      set({
        focusedSystemIndex: null,
        currentSystem: null,
        viewMode: 'galaxy',
        uniformOverrides: new Map(), // Clear overrides when returning to galaxy
        planetMotionOverrides: new Map(),
        selectedObject: null
      });
    }
  },

  setCurrentSystem: (system: StarSystem | null) => {
    if (system) {
      debugLog(`[Store] Setting current system: ${system.name}`);
    } else {
      debugLog('[Store] Clearing current system');
    }
    set({ currentSystem: system });
  },

  advanceSimulationTime: (deltaSeconds: number) => {
    const { isTimePaused, timeScale, simulationTimeDays } = get();
    if (isTimePaused || deltaSeconds <= 0) {
      return;
    }

    set({ simulationTimeDays: simulationTimeDays + deltaSeconds * timeScale });
  },

  setTimeScale: (scale: number) => {
    set({ timeScale: Math.max(0, scale) });
  },

  pauseTime: () => {
    set({ isTimePaused: true });
  },

  resumeTime: () => {
    set({ isTimePaused: false });
  },

  toggleTimePaused: () => {
    set((state) => ({ isTimePaused: !state.isTimePaused }));
  },

  resetSimulationTime: () => {
    set((state) => ({
      simulationTimeDays: state.initialSimulationTimeDays,
      isTimePaused: true
    }));
  },

  toggleOrbitTrails: () => {
    set((state) => ({ showOrbitTrails: !state.showOrbitTrails }));
  },

  toggleAutoFocusSelection: () => {
    set((state) => ({ autoFocusSelection: !state.autoFocusSelection }));
  },

  toggleControlDrawer: () => {
    set((state) => ({ controlDrawerOpen: !state.controlDrawerOpen }));
  },

  // ===== Phase 3: Architect Mode Actions =====

  updateUniform: (objectId: string, uniformName: string, value: UniformOverrideValue) => {
    const { uniformOverrides } = get();

    // Get existing overrides for this object or create new map
    const objectOverrides = uniformOverrides.get(objectId) || {};

    // Update the uniform value
    objectOverrides[uniformName] = value;

    // Create new Map to trigger React re-render
    const newOverrides = new Map(uniformOverrides);
    newOverrides.set(objectId, objectOverrides);

    debugLog(`[Store] Updated uniform ${uniformName} for ${objectId}:`, value);

    set({ uniformOverrides: newOverrides });
  },

  resetObjectUniforms: (objectId: string) => {
    const { uniformOverrides } = get();

    // Create new Map without this object's overrides
    const newOverrides = new Map(uniformOverrides);
    newOverrides.delete(objectId);

    debugLog(`[Store] Reset uniforms for ${objectId}`);

    set({ uniformOverrides: newOverrides });
  },

  getObjectUniforms: (objectId: string) => {
    const { uniformOverrides } = get();
    return uniformOverrides.get(objectId);
  },

  updatePlanetMotionOverride: (objectId: string, overrides: PlanetMotionOverrides) => {
    const { planetMotionOverrides } = get();
    const next = { ...(planetMotionOverrides.get(objectId) || {}), ...overrides };
    const newOverrides = new Map(planetMotionOverrides);
    newOverrides.set(objectId, next);
    set({ planetMotionOverrides: newOverrides });
  },

  resetPlanetMotionOverrides: (objectId: string) => {
    const { planetMotionOverrides } = get();
    const newOverrides = new Map(planetMotionOverrides);
    newOverrides.delete(objectId);
    set({ planetMotionOverrides: newOverrides });
  },

  getPlanetMotionOverride: (objectId: string) => {
    const { planetMotionOverrides } = get();
    return planetMotionOverrides.get(objectId);
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
 * Hook to get simulation time state
 */
export const useSimulationTime = () => useSystemStore((state) => ({
  simulationTimeDays: state.simulationTimeDays,
  timeScale: state.timeScale,
  isTimePaused: state.isTimePaused,
  initialSimulationTimeDays: state.initialSimulationTimeDays,
  showOrbitTrails: state.showOrbitTrails,
  autoFocusSelection: state.autoFocusSelection,
  controlDrawerOpen: state.controlDrawerOpen,
  planetMotionOverrides: state.planetMotionOverrides,
}));

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
  setCurrentSystem: state.setCurrentSystem,
  advanceSimulationTime: state.advanceSimulationTime,
  setTimeScale: state.setTimeScale,
  pauseTime: state.pauseTime,
  resumeTime: state.resumeTime,
  toggleTimePaused: state.toggleTimePaused,
  resetSimulationTime: state.resetSimulationTime,
  toggleOrbitTrails: state.toggleOrbitTrails,
  toggleAutoFocusSelection: state.toggleAutoFocusSelection,
  toggleControlDrawer: state.toggleControlDrawer,
  toggleIDE: state.toggleIDE,
  openIDE: state.openIDE,
  updatePlanetMotionOverride: state.updatePlanetMotionOverride,
  resetPlanetMotionOverrides: state.resetPlanetMotionOverrides,
  closeIDE: state.closeIDE,
  selectObject: state.selectObject,
  setScene: state.setScene,
  setCamera: state.setCamera
}));
