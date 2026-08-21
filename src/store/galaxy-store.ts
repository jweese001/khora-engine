/**
 * Khora Engine - Galaxy Multi-Layer Store
 *
 * Manages multiple galaxy particle system layers for visual composition.
 * Separate from procedural galaxy generation (types/galaxy.ts).
 *
 * Architecture:
 * - 3 independent galaxy particle system layers
 * - Each layer has independent visibility and configuration
 * - Active layer selection for editing
 * - Independent marker system for explorable star systems
 */

import { create } from 'zustand';
import * as THREE from 'three';
import type { GalaxyConfig } from '../rendering/GalaxyParticleSystem';
import type { Galaxy } from '../types/galaxy';
import { SeededRandom } from '../utils/random';
import { generateGalaxyPalette } from '../utils/color-palette';

// ============================================================================
// Types
// ============================================================================

/**
 * Single galaxy layer in the multi-layer system
 */
export interface GalaxyLayer {
  id: 0 | 1 | 2;           // Layer index (exactly 3 layers)
  name: string;            // Display name ("Layer 1", "Layer 2", "Layer 3")
  visible: boolean;        // Show/hide this layer in scene
  config: GalaxyConfig;    // Particle system configuration
}

/**
 * Marker positioning distribution algorithms
 */
export type MarkerDistribution = 'uniform' | 'spiral' | 'clustered';

/**
 * Configuration for explorable star system markers
 */
export interface MarkerConfig {
  count: number;                    // Number of markers (5-200)
  size: number;                     // Marker size (0.1-5.0)
  color: string;                    // Hex color (#rrggbb)
  pulseFrequency: number;           // Pulse animation speed (0-10)
  distribution: MarkerDistribution; // Positioning algorithm
  clickable: boolean;               // Enable/disable raycasting
}

/**
 * Complete preset including all layers and markers
 */
export interface GalaxySceneManagerHandle {
  generateMarkersForActiveLayer: () => void;
  clearMarkers: () => void;
  toggleMarkersVisibility: () => void;
}

export interface GalaxyPreset {
  name: string;
  description?: string;
  layers: [GalaxyLayer, GalaxyLayer, GalaxyLayer];
  markers: MarkerConfig;
  markerPositions: THREE.Vector3[];
}

type SerializedGalaxyConfig = Omit<GalaxyConfig, 'coreColor' | 'midColor' | 'edgeColor'> & {
  coreColor?: string;
  midColor?: string;
  edgeColor?: string;
};

interface SerializedGalaxyLayer extends Omit<GalaxyLayer, 'config'> {
  config: SerializedGalaxyConfig;
}

interface SerializedGalaxyPreset {
  name: string;
  description?: string;
  layers: [SerializedGalaxyLayer, SerializedGalaxyLayer, SerializedGalaxyLayer];
  markers: MarkerConfig;
  markerPositions: Array<[number, number, number]>;
}

// ============================================================================
// Default Configurations
// ============================================================================

/**
 * Default galaxy configuration for a new layer
 */
const createDefaultGalaxyConfig = (): GalaxyConfig => ({
  type: 'spiral',
  seed: 0,
  particleCount: 5000,
  armCount: 3,
  spiralTightness: 0.6,

  // Colors (pink-purple gradient)
  coreColor: new THREE.Color(1.0, 0.8, 0.9),   // Pink
  midColor: new THREE.Color(0.8, 0.4, 0.85),   // Purple
  edgeColor: new THREE.Color(0.4, 0.2, 0.6),   // Dark purple

  // Size
  size: 55,
  diskThickness: 4.0,
  coreSize: 0.25,

  // Animation
  animationSpeed: 0.5,
  rotationSpeed: 0.01,

  // Ring parameters
  ringInnerRadius: 0.4,
  ringOuterRadius: 0.9,

  // Irregular parameter
  irregularChaos: 0.4,

  // Elliptical parameter
  ellipticalFlatten: 0.6,

  // Particle appearance
  particleSizeMin: 0.3,
  particleSizeMax: 3.0,
  particleBrightness: 1.0,

  // Core controls
  coreBrightness: 0.5,
  coreAlphaFalloff: 0.6,
  coreExclusionRadius: 0.0,
});

/**
 * Default marker configuration
 */
const createDefaultMarkerConfig = (): MarkerConfig => ({
  count: 50,
  size: 4.0,
  color: '#fff3b3',  // Warm yellow-white
  pulseFrequency: 1.0,
  distribution: 'uniform',
  clickable: true,
});

/**
 * Initialize 3 galaxy layers with distinct configurations
 * ALL LAYERS START HIDDEN - only become visible after galaxy generation
 */
const createDefaultLayers = (): [GalaxyLayer, GalaxyLayer, GalaxyLayer] => [
  {
    id: 0,
    name: 'Layer 1',
    visible: false,  // Hidden until galaxy is generated
    config: {
      ...createDefaultGalaxyConfig(),
      type: 'spiral',
      particleCount: 5000,
      coreColor: new THREE.Color('#ffccee'),  // Pink
      midColor: new THREE.Color('#cc66dd'),   // Purple
      edgeColor: new THREE.Color('#663399'),  // Dark purple
    },
  },
  {
    id: 1,
    name: 'Layer 2',
    visible: false,  // Hidden until user enables
    config: {
      ...createDefaultGalaxyConfig(),
      type: 'elliptical',
      particleCount: 3000,
      coreColor: new THREE.Color('#e6f2ff'),  // Light blue
      midColor: new THREE.Color('#99ccff'),   // Blue
      edgeColor: new THREE.Color('#4d79ff'),  // Dark blue
      particleSizeMin: 0.2,
      particleSizeMax: 2.0,
      particleBrightness: 0.5,
    },
  },
  {
    id: 2,
    name: 'Layer 3',
    visible: false,  // Hidden until user enables
    config: {
      ...createDefaultGalaxyConfig(),
      type: 'ring',
      particleCount: 2000,
      coreColor: new THREE.Color('#ffe6cc'),  // Light orange
      midColor: new THREE.Color('#ffcc99'),   // Orange
      edgeColor: new THREE.Color('#ff9966'),  // Dark orange
      ringInnerRadius: 0.5,
      ringOuterRadius: 0.8,
      particleSizeMin: 0.3,
      particleSizeMax: 2.5,
      particleBrightness: 0.7,
    },
  },
];

// ============================================================================
// Store State
// ============================================================================

interface GalaxyStoreState {
  // ============================================================================
  // Multi-Layer System
  // ============================================================================

  /**
   * Array of exactly 3 galaxy layers
   */
  layers: [GalaxyLayer, GalaxyLayer, GalaxyLayer];

  /**
   * Currently active layer for editing (0, 1, or 2)
   */
  activeLayerId: 0 | 1 | 2;

  // ============================================================================
  // Independent Marker System
  // ============================================================================

  /**
   * Marker configuration
   */
  markers: MarkerConfig;

  /**
   * Generated marker positions (world space)
   * Empty array means no markers currently generated
   */
  markerPositions: THREE.Vector3[];

  /**
   * Whether markers are currently visible
   * Separate from having positions - allows toggle without regeneration
   */
  markersVisible: boolean;

  /**
   * Reference to scene manager (for marker operations from UI)
   * Set by CanvasContainer on mount
   */
  sceneManagerRef: GalaxySceneManagerHandle | null;

  // ============================================================================
  // Preset System
  // ============================================================================

  /**
   * Saved presets (name -> preset data)
   */
  presets: Map<string, GalaxyPreset>;

  // ============================================================================
  // Layer Actions
  // ============================================================================

  /**
   * Set which layer is currently being edited
   */
  setActiveLayer: (id: 0 | 1 | 2) => void;

  /**
   * Toggle visibility of a specific layer
   */
  toggleLayerVisibility: (id: 0 | 1 | 2) => void;

  /**
   * Update configuration for a specific layer
   * Only updates the specified layer, does not affect other layers
   */
  updateLayerConfig: (id: 0 | 1 | 2, config: Partial<GalaxyConfig>) => void;

  /**
   * Reset a specific layer to default configuration
   */
  resetLayer: (id: 0 | 1 | 2) => void;

  /**
   * Reset all layers to default configuration
   */
  resetAllLayers: () => void;

  /**
   * Configure and activate visual galaxy layers from procedural galaxy
   * Called when user generates a galaxy - all 3 layers become visible
   * Each layer is a visual variation of the same procedural galaxy
   * @param galaxy - The procedurally generated galaxy to visualize
   */
  initializeFromProceduralGalaxy: (galaxy: Galaxy) => void;

  /**
   * Deactivate all visual galaxy layers (called when galaxy is cleared)
   */
  deactivateGalaxyLayers: () => void;

  // ============================================================================
  // Marker Actions
  // ============================================================================

  /**
   * Update marker configuration
   */
  updateMarkerConfig: (config: Partial<MarkerConfig>) => void;

  /**
   * Generate marker positions based on current config and active layer
   * Uses the active layer's galaxy config for positioning context
   */
  generateMarkers: () => void;

  /**
   * Clear all markers (empty positions array)
   */
  clearMarkers: () => void;

  /**
   * Toggle marker visibility
   */
  toggleMarkersVisibility: () => void;

  // ============================================================================
  // Preset Actions
  // ============================================================================

  /**
   * Save current state as a preset
   */
  savePreset: (name: string, description?: string) => void;

  /**
   * Load a preset (restores layers, markers, and positions)
   */
  loadPreset: (name: string) => void;

  /**
   * Delete a preset
   */
  deletePreset: (name: string) => void;

  /**
   * Load presets from localStorage (called on init)
   */
  loadPresetsFromStorage: () => void;

  /**
   * Set scene manager reference (called from CanvasContainer)
   */
  setSceneManagerRef: (ref: GalaxySceneManagerHandle | null) => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

/**
 * Galaxy multi-layer store
 * Manages visual galaxy particle systems (separate from procedural generation)
 */
export const useGalaxyStore = create<GalaxyStoreState>((set, get) => ({
  // ============================================================================
  // Initial State
  // ============================================================================

  layers: createDefaultLayers(),
  activeLayerId: 0,
  markers: createDefaultMarkerConfig(),
  markerPositions: [],
  markersVisible: true,
  sceneManagerRef: null,
  presets: new Map(),

  // ============================================================================
  // Layer Actions
  // ============================================================================

  setActiveLayer: (id) => {
    set({ activeLayerId: id });
  },

  toggleLayerVisibility: (id) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      ) as [GalaxyLayer, GalaxyLayer, GalaxyLayer],
    }));
  },

  updateLayerConfig: (id, configUpdate) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id
          ? { ...layer, config: { ...layer.config, ...configUpdate } }
          : layer
      ) as [GalaxyLayer, GalaxyLayer, GalaxyLayer],
    }));
  },

  resetLayer: (id) => {
    const defaultLayers = createDefaultLayers();
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? defaultLayers[id] : layer
      ) as [GalaxyLayer, GalaxyLayer, GalaxyLayer],
    }));
  },

  resetAllLayers: () => {
    set({
      layers: createDefaultLayers(),
      activeLayerId: 0,
    });
  },

  initializeFromProceduralGalaxy: (galaxy: Galaxy) => {
    // Configure all 3 layers based on procedural galaxy type AND parameters
    // Each layer is a visual variation of the same galaxy
    const galaxyType = galaxy.type; // 'Spiral', 'Elliptical', or 'Irregular'

    // Create RNG from galaxy seed for consistent color generation

    set((state) => {
      const updatedLayers = state.layers.map((layer) => {
        // Only Layer 1 (id: 0) visible by default
        // User can enable Layer 2 and Layer 3 manually
        const visible = layer.id === 0;

        // Configure each layer as a variation of the galaxy type
        let layerType: GalaxyConfig['type'];
        let particleCount: number;
        let coreColor: THREE.Color;
        let midColor: THREE.Color;
        let edgeColor: THREE.Color;

        // Type-specific parameters from procedural galaxy
        let armCount: number | undefined;
        let spiralTightness: number | undefined;
        let diskThickness: number | undefined;
        let ellipticalFlatten: number | undefined;
        let irregularChaos: number | undefined;

        if (galaxyType === 'Spiral' && galaxy.spiralParams) {
          // Use procedural spiral parameters
          const params = galaxy.spiralParams;

          // Layer 0: Main spiral
          // Layer 1: Barred spiral variation
          // Layer 2: Tighter spiral
          layerType = layer.id === 0 ? 'spiral' : layer.id === 1 ? 'barred' : 'spiral';
          particleCount = layer.id === 0 ? 6000 : layer.id === 1 ? 4000 : 3000;

          // Generate unique color palette for each layer using seed
          const layerRng = new SeededRandom(galaxy.seed + layer.id * 1000);
          const palette = generateGalaxyPalette(layerRng, layerType);
          [coreColor, midColor, edgeColor] = palette;

          // Pass procedural parameters to visual layers
          armCount = params.armCount;
          spiralTightness = params.armTightness;
          diskThickness = params.diskThickness / 100; // Convert to normalized value

        } else if (galaxyType === 'Elliptical' && galaxy.ellipticalParams) {
          // Use procedural elliptical parameters
          const params = galaxy.ellipticalParams;

          // All layers elliptical with different densities
          layerType = 'elliptical';
          particleCount = layer.id === 0 ? 5000 : layer.id === 1 ? 3500 : 2500;

          // Generate unique color palette for each layer using seed
          const layerRng = new SeededRandom(galaxy.seed + layer.id * 1000);
          const palette = generateGalaxyPalette(layerRng, layerType);
          [coreColor, midColor, edgeColor] = palette;

          // Pass procedural parameters to visual layers
          ellipticalFlatten = params.eccentricity;

        } else {
          // Irregular - use irregular and ring types
          const params = galaxy.irregularParams;

          layerType = layer.id === 0 ? 'irregular' : layer.id === 1 ? 'irregular' : 'ring';
          particleCount = layer.id === 0 ? 4000 : layer.id === 1 ? 3000 : 2000;

          // Generate unique color palette for each layer using seed
          const layerRng = new SeededRandom(galaxy.seed + layer.id * 1000);
          const palette = generateGalaxyPalette(layerRng, layerType);
          [coreColor, midColor, edgeColor] = palette;

          // Pass procedural parameters to visual layers
          if (params) {
            irregularChaos = params.dispersalFactor;
            diskThickness = 0.5; // Default for irregular
          }
        }

        return {
          ...layer,
          visible,
          config: {
            ...layer.config,
            seed: galaxy.seed + layer.id * 1000,
            type: layerType,
            particleCount,
            coreColor,
            midColor,
            edgeColor,
            // Type-specific parameters
            ...(armCount !== undefined && { armCount }),
            ...(spiralTightness !== undefined && { spiralTightness }),
            ...(diskThickness !== undefined && { diskThickness }),
            ...(ellipticalFlatten !== undefined && { ellipticalFlatten }),
            ...(irregularChaos !== undefined && { irregularChaos }),
          }
        };
      }) as [GalaxyLayer, GalaxyLayer, GalaxyLayer];

      return { layers: updatedLayers };
    });

    console.log(`[GalaxyStore] Visual galaxy layers initialized from ${galaxyType} galaxy (Layer 1 visible, Layers 2-3 available)`);
  },

  deactivateGalaxyLayers: () => {
    // Hide all layers when galaxy is cleared
    set((state) => ({
      layers: state.layers.map((layer) =>
        ({ ...layer, visible: false })
      ) as [GalaxyLayer, GalaxyLayer, GalaxyLayer],
    }));
    console.log('[GalaxyStore] Visual galaxy layers deactivated (all hidden)');
  },

  // ============================================================================
  // Marker Actions
  // ============================================================================

  updateMarkerConfig: (configUpdate) => {
    set((state) => ({
      markers: { ...state.markers, ...configUpdate },
    }));
  },

  generateMarkers: () => {
    const { markers, layers, activeLayerId } = get();
    const activeLayer = layers[activeLayerId];

    // Generate positions based on active layer's galaxy structure
    const positions = generateMarkerPositions(
      markers.count,
      activeLayer.config
    );

    set({ markerPositions: positions });
  },

  clearMarkers: () => {
    set({ markerPositions: [] });
  },

  toggleMarkersVisibility: () => {
    set((state) => ({ markersVisible: !state.markersVisible }));
  },

  // ============================================================================
  // Preset Actions
  // ============================================================================

  savePreset: (name, description) => {
    const { layers, markers, markerPositions } = get();

    // Deep clone layers (serialize THREE.Color to hex)
    const serializedLayers = layers.map((layer) => ({
      ...layer,
      config: {
        ...layer.config,
        coreColor: layer.config.coreColor ? new THREE.Color(layer.config.coreColor) : undefined,
        midColor: layer.config.midColor ? new THREE.Color(layer.config.midColor) : undefined,
        edgeColor: layer.config.edgeColor ? new THREE.Color(layer.config.edgeColor) : undefined,
      },
    })) as [GalaxyLayer, GalaxyLayer, GalaxyLayer];

    const preset: GalaxyPreset = {
      name,
      description,
      layers: serializedLayers,
      markers: { ...markers },
      markerPositions: markerPositions.map((v) => v.clone()),
    };

    // Add to presets map
    set((state) => ({
      presets: new Map(state.presets).set(name, preset),
    }));

    // Save to localStorage
    savePresetsToStorage(get().presets);
  },

  loadPreset: (name) => {
    const preset = get().presets.get(name);
    if (!preset) {
      console.warn(`Preset "${name}" not found`);
      return;
    }

    // Deep clone to avoid reference issues
    const layers = preset.layers.map((layer) => ({
      ...layer,
      config: {
        ...layer.config,
        coreColor: layer.config.coreColor ? new THREE.Color(layer.config.coreColor) : undefined,
        midColor: layer.config.midColor ? new THREE.Color(layer.config.midColor) : undefined,
        edgeColor: layer.config.edgeColor ? new THREE.Color(layer.config.edgeColor) : undefined,
      },
    })) as [GalaxyLayer, GalaxyLayer, GalaxyLayer];

    set({
      layers,
      markers: { ...preset.markers },
      markerPositions: preset.markerPositions.map((v) => v.clone()),
      activeLayerId: 0, // Reset to first layer
    });
  },

  deletePreset: (name) => {
    const newPresets = new Map(get().presets);
    newPresets.delete(name);
    set({ presets: newPresets });
    savePresetsToStorage(newPresets);
  },

  loadPresetsFromStorage: () => {
    const presets = loadPresetsFromStorage();
    set({ presets });
  },

  /**
   * Set scene manager reference (called from CanvasContainer)
   */
  setSceneManagerRef: (ref: GalaxySceneManagerHandle | null) => {
    set({ sceneManagerRef: ref });
  },
}));

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate marker positions based on galaxy type and structure
 * Positions generated in galaxy local space (will be transformed to world space by ThreeSceneManager)
 *
 * Algorithms based on galaxy type:
 * - Spiral/Barred: Follow spiral arm structure
 * - Ring: Distributed in ring bounds (inner/outer radius)
 * - Irregular: Chaotic multi-cluster distribution
 * - Elliptical: Spherical distribution with flattening
 */
export function generateMarkerPositions(
  count: number,
  galaxyConfig: GalaxyConfig
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const galaxyType = galaxyConfig.type;
  const galaxySize = galaxyConfig.size || 55;
  const diskThickness = galaxyConfig.diskThickness || 4.0;
  const coreExclusionRadius = galaxyConfig.coreExclusionRadius || 0.0;
  const minMarkerSpacing = Math.max(0.75, (galaxySize / Math.sqrt(Math.max(count, 1))) * 0.35);
  const maxPlacementAttempts = 24;

  const sampleRadiusOutsideExclusion = (maxRadius: number, exponent: number, exclusionMin: number): number => {
    if (exclusionMin <= 0) {
      return Math.pow(Math.random(), exponent) * maxRadius;
    }

    const clampedExclusion = Math.min(exclusionMin, maxRadius * 0.9);
    const availableRange = maxRadius - clampedExclusion;
    return clampedExclusion + Math.pow(Math.random(), exponent) * availableRange;
  };

  const hasEnoughSpacing = (candidate: THREE.Vector3): boolean => {
    return positions.every((existing) => existing.distanceTo(candidate) >= minMarkerSpacing);
  };

  for (let i = 0; i < count; i++) {
    let position = new THREE.Vector3();
    let placed = false;

    for (let attempt = 0; attempt < maxPlacementAttempts; attempt++) {
      let candidate: THREE.Vector3;

      if (galaxyType === 'spiral' || galaxyType === 'barred') {
        // SPIRAL/BARRED: follow arms, but distribute markers more evenly across the radius
        const armCount = galaxyConfig.armCount || 3;
        const spiralTightness = galaxyConfig.spiralTightness || 0.6;
        const maxRadius = galaxySize * 0.85;
        const exclusionMin = galaxySize * coreExclusionRadius;
        const radius = sampleRadiusOutsideExclusion(maxRadius, 1.6, exclusionMin);

        const armIndex = Math.floor(Math.random() * armCount);
        const armAngle = (armIndex / armCount) * Math.PI * 2;
        const spiralOffset = Math.log(radius / 5 + 1) * spiralTightness * 10;
        const baseAngle = armAngle + spiralOffset;

        // Slightly wider than before to reduce click-hostile stacking near the core
        const armWidth = 0.45;
        const scatter = (Math.random() - 0.5) * armWidth;
        const noise = Math.sin(baseAngle * 4) * Math.cos(radius * 0.2) * 2;
        const angle = baseAngle + scatter + noise * 0.08;

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const thickness = Math.pow(1 - Math.min(radius / galaxySize, 1), 1.5) * diskThickness;
        const y = (Math.random() - 0.5) * thickness;

        candidate = new THREE.Vector3(x, y, z);
      } else if (galaxyType === 'ring') {
        // RING: Empty center with outer ring (using configured bounds)
        const minR = galaxySize * Math.max(galaxyConfig.ringInnerRadius || 0.4, coreExclusionRadius);
        const maxR = galaxySize * (galaxyConfig.ringOuterRadius || 0.9);
        const radius = minR + Math.random() * (maxR - minR);
        const angle = Math.random() * Math.PI * 2;

        candidate = new THREE.Vector3(
          radius * Math.cos(angle),
          (Math.random() - 0.5) * diskThickness * 0.5,
          radius * Math.sin(angle)
        );
      } else if (galaxyType === 'irregular') {
        // IRREGULAR: chaotic multi-cluster distribution with less center crowding
        const clusterCount = 3;
        const clusterIndex = Math.floor(Math.random() * clusterCount);
        const clusterAngle = (clusterIndex / clusterCount) * Math.PI * 2 + (Math.random() - 0.5) * Math.PI;
        const minClusterDistance = galaxySize * Math.max(coreExclusionRadius, 0.15);
        const clusterDistance = minClusterDistance + Math.random() * galaxySize * 0.35;
        const chaosLevel = (galaxyConfig.irregularChaos || 0.4) * 0.75;
        const scatter = (Math.random() - 0.5) * galaxySize * chaosLevel;
        const radius = clusterDistance + scatter;
        const angle = clusterAngle + (Math.random() - 0.5) * Math.PI;

        candidate = new THREE.Vector3(
          radius * Math.cos(angle),
          (Math.random() - 0.5) * diskThickness * 2,
          radius * Math.sin(angle)
        );
      } else {
        // ELLIPTICAL: still center-weighted, but less aggressively than before
        const maxRadius = galaxySize * 0.7;
        const exclusionMin = galaxySize * coreExclusionRadius;
        const radius = sampleRadiusOutsideExclusion(maxRadius, 1.8, exclusionMin);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const flattenFactor = galaxyConfig.ellipticalFlatten || 0.6;

        candidate = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta) * flattenFactor,
          radius * Math.cos(phi)
        );
      }

      position = candidate;
      if (hasEnoughSpacing(candidate)) {
        placed = true;
        break;
      }
    }

    if (!placed && positions.length > 0) {
      // Keep a fallback candidate, but avoid exact overlap if retries were exhausted.
      position = position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.6,
      ));
    }

    positions.push(position);
  }

  return positions;
}

/**
 * Save presets to localStorage
 */
function savePresetsToStorage(presets: Map<string, GalaxyPreset>): void {
  try {
    // Serialize presets (convert Map to array, THREE.Vector3 to arrays)
    const serialized = Array.from(presets.entries()).map(([name, preset]) => ({
      name,
      description: preset.description,
      layers: preset.layers.map((layer) => ({
        ...layer,
        config: {
          ...layer.config,
          coreColor: layer.config.coreColor?.getHexString(),
          midColor: layer.config.midColor?.getHexString(),
          edgeColor: layer.config.edgeColor?.getHexString(),
        },
      })),
      markers: preset.markers,
      markerPositions: preset.markerPositions.map((v) => v.toArray()),
    }));

    localStorage.setItem('khora-galaxy-presets', JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save presets to localStorage:', error);
  }
}

function isSerializedGalaxyPreset(value: unknown): value is SerializedGalaxyPreset {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === 'string'
    && Array.isArray(candidate.layers)
    && candidate.layers.length === 3
    && candidate.layers.every((layer) => Boolean(layer) && typeof layer === 'object')
    && Boolean(candidate.markers)
    && typeof candidate.markers === 'object'
    && Array.isArray(candidate.markerPositions)
    && candidate.markerPositions.every(
      (position) => Array.isArray(position)
        && position.length === 3
        && position.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate)),
    )
  );
}

/**
 * Load presets from localStorage
 */
function loadPresetsFromStorage(): Map<string, GalaxyPreset> {
  try {
    const stored = localStorage.getItem('khora-galaxy-presets');
    if (!stored) return new Map();

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isSerializedGalaxyPreset)) {
      throw new Error('Stored galaxy presets have an invalid shape');
    }

    // Deserialize presets (convert arrays to Map, hex strings to THREE.Color, arrays to THREE.Vector3)
    const presets = new Map<string, GalaxyPreset>(
      parsed.map((item) => {
        const layers = item.layers.map((layer) => ({
          ...layer,
          config: {
            ...layer.config,
            coreColor: layer.config.coreColor ? new THREE.Color(`#${layer.config.coreColor}`) : undefined,
            midColor: layer.config.midColor ? new THREE.Color(`#${layer.config.midColor}`) : undefined,
            edgeColor: layer.config.edgeColor ? new THREE.Color(`#${layer.config.edgeColor}`) : undefined,
          },
        })) as [GalaxyLayer, GalaxyLayer, GalaxyLayer];

        return [
          item.name,
          {
            name: item.name,
            description: item.description,
            layers,
            markers: item.markers,
            markerPositions: item.markerPositions.map(
              ([x, y, z]) => new THREE.Vector3(x, y, z),
            ),
          },
        ];
      }),
    );

    return presets;
  } catch (error) {
    console.error('Failed to load presets from localStorage:', error);
    return new Map();
  }
}

// ============================================================================
// Initialize Store
// ============================================================================

// Load presets from localStorage on module load
if (typeof window !== 'undefined') {
  useGalaxyStore.getState().loadPresetsFromStorage();
}
