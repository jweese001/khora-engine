/**
 * Khora Engine - Three.js Scene Manager
 *
 * Manages the Three.js scene, camera, renderer, and controls.
 * Handles system rendering, object selection (raycasting), and animation loop.
 *
 * Phase 1: Basic scene with starfield, orbit controls, and system rendering.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { Planet, StarSystem } from '../../types/celestial-bodies';
import type { Galaxy, GalaxySystemPlacement } from '../../types/galaxy';
import type { SceneSelectionPayload, UniformOverrideValue } from '../../types/scene';
import type { GalaxyConfig } from '../../rendering/GalaxyParticleSystem';
import { createStarMesh, createStarLight, calculateSceneUnitsPerSolarRadius } from '../../rendering/StarRenderer';
import { createOrbitLineFromElements, getOrbitLineStyle } from '../../rendering/OrbitRenderer';
import { CelestialBodyLOD } from '../../rendering/CelestialBodyLOD';
import { GalaxyRenderer } from '../../rendering/GalaxyRenderer';
import { GalaxyParticleSystem } from '../../rendering/GalaxyParticleSystem';
import { useGalaxyStore, type GalaxyLayer } from '../../store/galaxy-store';
import { useSystemStore } from '../../store/system-store';
import { MarkerSystemManager } from './MarkerSystemManager';
import { CameraController } from './CameraController';
import { SelectionController } from './SelectionController';
import {
  OrbitRuntimeManager,
  type MoonOrbitBinding,
  type PlanetOrbitBinding,
} from './OrbitRuntimeManager';
import { disposeObjectResources, disposeObjectTree } from '../../rendering/dispose';
import { sampleOrbitPosition } from '../../orbits/orbit-solver';

// ============================================================================
// ThreeSceneManager Class
// ============================================================================

export class ThreeSceneManager {
  // Three.js core objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;
  private cameraController: CameraController;
  private selectionController: SelectionController;

  // Animation loop
  private animationFrameId: number | null = null;

  // Container reference
  private container: HTMLElement;

  // Callbacks
  private onObjectSelected?: (object: SceneSelectionPayload) => void;

  // Galaxy rendering (Phase 2)
  private galaxyRenderer: GalaxyRenderer;
  private currentViewMode: 'system' | 'galaxy' = 'system';

  // Multi-layer galaxy particle system (Phase 2.5)
  // Array of exactly 3 independent galaxy particle systems for visual composition
  private galaxyLayers: (GalaxyParticleSystem | null)[] = [null, null, null];
  private galaxyStoreUnsubscribe: (() => void) | null = null;
  private lastGalaxyStoreLayers: [GalaxyLayer, GalaxyLayer, GalaxyLayer] | null = null;
  private galaxyLayersInitialized: boolean = false; // Track if layers have been created
  private customMarkersSet: boolean = false; // Track if user has set custom markers (don't auto-regenerate)

  // Independent marker system (separate from galaxy layers)
  // Markers persist when layers are edited/switched
  private markerManager: MarkerSystemManager;

  // Material tracking (Phase 3: Architect Mode)
  // Maps object ID -> THREE.Material for live uniform updates
  private materialRegistry: Map<string, THREE.Material | CelestialBodyLOD> = new Map();
  private objectRegistry: Map<string, THREE.Object3D> = new Map();
  private orbitRuntimeManager = new OrbitRuntimeManager();

  // Debug mode (toggle with D key)
  private debugMode: number = 0; // 0=normal, 1-7=debug visualizations

  // Time tracking for delta calculations
  private lastTime: number = 0;

  /**
   * Initialize Three.js scene manager
   *
   * @param container - DOM element to mount the renderer
   * @param onObjectSelected - Callback when user clicks an object
   */
  constructor(
    container: HTMLElement,
    onObjectSelected?: (object: SceneSelectionPayload) => void
  ) {
    this.container = container;
    this.onObjectSelected = onObjectSelected;

    // Create scene
    this.scene = this.createScene();

    // Create camera
    this.camera = this.createCamera();

    // Store camera reference in scene for LODDebug component
    this.scene.userData.camera = this.camera;

    // Create renderer
    this.renderer = this.createRenderer();

    // Create post-processing composer with bloom
    this.composer = this.createComposer();

    // Create controls and camera transition controller
    this.controls = this.createControls();
    this.cameraController = new CameraController(this.camera, this.controls);

    // Initialize galaxy renderer (Phase 2)
    this.galaxyRenderer = new GalaxyRenderer();

    // Multi-layer galaxy system (Phase 2.5) - Deferred until first galaxy generation
    // Galaxy layers will be created when user generates a galaxy, NOT on app load
    // This ensures no default galaxy appears before user interaction

    // Independent marker system - Markers persist when galaxy layers change
    this.markerManager = new MarkerSystemManager({
      scene: this.scene,
      getActiveGalaxyLayer: () => {
        const { activeLayerId } = useGalaxyStore.getState();
        return this.galaxyLayers[activeLayerId];
      },
      getGalaxyLayers: () => this.galaxyLayers,
      setCustomMarkersSet: (value: boolean) => {
        this.customMarkersSet = value;
      }
    });

    this.selectionController = new SelectionController({
      domElement: this.renderer.domElement,
      scene: this.scene,
      camera: this.camera,
      getViewMode: () => this.currentViewMode,
      areMarkersClickable: () => useGalaxyStore.getState().markers.clickable,
      getMarkerPointObjects: () => {
        const markerObjects: THREE.Points[] = [];
        const independentMarkers = this.markerManager.getMarkerPoints();
        if (independentMarkers) markerObjects.push(independentMarkers);

        for (const layer of this.galaxyLayers) {
          const layerMarkers = layer?.getGroup().getObjectByName('systemMarkers');
          if (layerMarkers instanceof THREE.Points) markerObjects.push(layerMarkers);
        }
        return markerObjects;
      },
      getFallbackSystem: (markerIndex) => (
        useSystemStore.getState().currentGalaxy?.systems[markerIndex]?.system
      ),
      onSystemSelected: (system) => this.transitionToSystem(system),
      onSelection: (selection) => this.onObjectSelected?.(selection),
    });

    // Register this scene manager with the galaxy store for UI access
    useGalaxyStore.setState({ sceneManagerRef: this });

    // Add starfield background
    this.addStarfield();

    // Mount renderer to container
    this.container.appendChild(this.renderer.domElement);

    // Set up event listeners
    this.setupEventListeners();

    // Start animation loop
    this.animate();

    console.log('[ThreeSceneManager] Initialized successfully');
  }

  // ==========================================================================
  // Initialization Methods
  // ==========================================================================

  /**
   * Create Three.js scene with optimal settings
   */
  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();

    // Dark space background
    scene.background = new THREE.Color(0x000510);

    // Add ambient light so we can see objects even in shadow
    // This simulates scattered starlight and ensures visibility
    // Very low intensity (0.05) to preserve star colors and planet colors
    // Directional lights from star provide most of the illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambientLight);

    // Optional: Add fog for depth perception (disabled for space)
    // scene.fog = new THREE.Fog(0x000510, 100, 1000);

    return scene;
  }

  /**
   * Create camera with professional settings
   */
  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60, // FOV - 60 degrees for comfortable viewing
      this.container.clientWidth / this.container.clientHeight,
      0.1, // Near clipping plane
      10000 // Far clipping plane - large for star systems
    );

    // Default camera position
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

    return camera;
  }

  /**
   * Create WebGL renderer with optimized settings
   */
  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false // Don't need transparency for full-screen scene
    });

    // Set size to container dimensions
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    // Optimize pixel ratio (cap at 2 for performance)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Enable shadow mapping (if needed later)
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Tone mapping for realistic lighting
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    return renderer;
  }

  /**
   * Create post-processing composer with bloom effect
   */
  private createComposer(): EffectComposer {
    const composer = new EffectComposer(this.renderer);

    // Add render pass (renders the scene)
    const renderPass = new RenderPass(this.scene, this.camera);
    composer.addPass(renderPass);

    // Add bloom pass for star glow
    // Match reference demo: strong bloom for dramatic star glow
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,  // strength - reduced from 2.3 to prevent galaxy particle artifacts
      0.6,  // radius - reduced for cleaner galaxy rendering
      0.9   // threshold - higher to only affect brightest elements
    );
    composer.addPass(bloomPass);

    console.log('[ThreeSceneManager] Post-processing composer initialized with bloom');

    return composer;
  }

  /**
   * Create orbit controls for camera manipulation
   */
  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Control settings
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Don't pan in screen space
    controls.minDistance = 5; // Minimum zoom
    controls.maxDistance = 5000; // Maximum zoom
    controls.maxPolarAngle = Math.PI; // Allow full rotation

    // Optional: Set target to center of solar system
    controls.target.set(0, 0, 0);

    return controls;
  }

  /**
   * Add starfield background (5000 point stars)
   * Extended range for deeper space feel
   */
  private addStarfield(): void {
    const starCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Random position in sphere (extended range: 3000-8000 units)
      // Pushed farther out to avoid interfering with system view
      const radius = Math.random() * 5000 + 3000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Slight color variation (white to blue-white)
      const brightness = 0.8 + Math.random() * 0.2;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = 1.0; // Slight blue tint
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3, // Slightly larger to compensate for distance
      vertexColors: true,
      transparent: true,
      opacity: 0.9, // Slightly brighter for visibility at distance
      sizeAttenuation: true
    });

    const stars = new THREE.Points(geometry, material);
    stars.name = 'starfield';
    this.scene.add(stars);

    console.log('[ThreeSceneManager] Starfield added (5000 stars, range: 3000-8000 units)');
  }

  // ==========================================================================
  // Event Handling
  // ==========================================================================

  /**
   * Set up event listeners for window resize and debug controls.
   * Pointer selection is owned by SelectionController.
   */
  private setupEventListeners(): void {
    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Debug mode toggle (press D key)
    window.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Handle window resize - update camera, renderer, and composer
   */
  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Update camera
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(width, height);

    // Update composer (for bloom pass)
    this.composer.setSize(width, height);
  };

  /**
   * Transition from galaxy view to system view
   * Zooms camera to the selected star system and renders it
   */
  private transitionToSystem(system: StarSystem): void {
    console.log('[ThreeSceneManager] Transitioning to system:', system.star?.name || 'Unknown');

    // Find the index of this system in the current galaxy
    const store = useSystemStore.getState();
    const currentGalaxy = store.currentGalaxy;

    if (!currentGalaxy) {
      console.error('[ThreeSceneManager] No current galaxy to find system in');
      return;
    }

    // Try to find the system index by matching the system ID or name
    const systemIndex = currentGalaxy.systems.findIndex(
      (placement: GalaxySystemPlacement) => placement.system.id === system.id || placement.system.name === system.name
    );

    if (systemIndex !== -1) {
      // System found in galaxy - use store's focusSystem method
      console.log(`[ThreeSceneManager] Found system at index ${systemIndex}, using store focus...`);
      store.focusSystem(systemIndex);
      // The store will trigger renderSystem() via the subscription
    } else {
      // System NOT in galaxy (custom marker) - render directly
      console.log('[ThreeSceneManager] System not in galaxy (custom marker), rendering directly...');

      // Switch to system view mode first (this will hide galaxy layers)
      this.switchToSystemView();

      // Set the current system in the store
      store.setCurrentSystem(system);

      // Switch view mode in store
      store.setViewMode('system');

      // Render the system directly (bypass store's focusSystem)
      this.renderSystem(system);
    }
  }

  /**
   * Handle keyboard input for debug controls
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Press P to print current camera position
    if (event.key === 'p' || event.key === 'P') {
      this.cameraController.printDebugPosition();
      return;
    }

    // Press D to cycle through debug modes
    if (event.key === 'd' || event.key === 'D') {
      this.debugMode = (this.debugMode + 1) % 8; // Cycle 0-7

      const debugModeNames = [
        'Normal Rendering',
        'Diffuse Only (Day/Night)',
        'World-Space Normals',
        'Light Direction',
        'View Direction',
        'Surface Facing Light',
        'Distance to Light',
        'World Positions'
      ];

      console.log(`[DEBUG] Mode ${this.debugMode}: ${debugModeNames[this.debugMode]}`);

      // Update all planet materials with new debug mode
      this.scene.traverse((object) => {
        if (object instanceof THREE.LOD) {
          object.levels.forEach((level) => {
            const mesh = level.object as THREE.Mesh;
            if (mesh.material && (mesh.material as THREE.ShaderMaterial).uniforms) {
              const material = mesh.material as THREE.ShaderMaterial;
              if (material.uniforms.u_debugMode) {
                material.uniforms.u_debugMode.value = this.debugMode;
              }
            }
          });
        }
      });
    }
  };

  // ==========================================================================
  // Animation Loop
  // ==========================================================================

  /**
   * Main animation loop - updates controls, shader uniforms, and renders scene
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Update controls (damping requires update every frame)
    this.controls.update();

    // CRITICAL: Update world matrices before LOD calculations
    // This ensures LOD distance is calculated from actual geometry position,
    // not from (0,0,0). Without this, all planets use the same LOD level.
    this.scene.updateMatrixWorld();

    // Calculate delta time for animations
    const time = performance.now() * 0.001; // Convert to seconds
    const deltaTime = this.lastTime === 0 ? 0 : time - this.lastTime;
    this.lastTime = time;

    // Phase 2.5: Old GalaxyRenderer NO LONGER USED
    // Multi-layer galaxy animation handled separately (see below)

    const systemStore = useSystemStore.getState();
    systemStore.advanceSimulationTime(deltaTime);

    // Update multi-layer galaxy particle systems (Phase 2.5)
    // Only update when in galaxy view mode to prevent rendering when viewing systems
    if (this.currentViewMode === 'galaxy') {
      this.galaxyLayers.forEach((galaxy) => {
        if (galaxy) {
          galaxy.update(deltaTime);
        }
      });
    }

    this.orbitRuntimeManager.update(
      systemStore.simulationTimeDays,
      systemStore.planetMotionOverrides,
    );
    this.orbitRuntimeManager.setTrailVisibility(systemStore.showOrbitTrails);

    // Update independent marker system
    this.markerManager.updateFrame(time, this.currentViewMode);

    this.cameraController.update(deltaTime);

    // Update shader uniforms for all celestial bodies
    // CRITICAL: Camera position must be updated every frame for correct lighting and atmosphere
    this.scene.traverse((object) => {
      // Update LOD objects (planets, moons)
      if (object instanceof THREE.LOD) {
        object.update(this.camera);

        // Update shader uniforms for all LOD levels
        object.levels.forEach((level) => {
          const mesh = level.object as THREE.Mesh;
          if (mesh.material && (mesh.material as THREE.ShaderMaterial).uniforms) {
            const material = mesh.material as THREE.ShaderMaterial;

            // Update camera position for view-dependent effects (atmosphere, specular)
            if (material.uniforms.u_cameraPosition) {
              material.uniforms.u_cameraPosition.value.copy(this.camera.position);
            }

            // Update time for animated effects
            if (material.uniforms.u_time) {
              material.uniforms.u_time.value = time;
            }
          }
        });
      }

      // Update star mesh (regular Mesh, not LOD)
      if (object.name === 'star' && object instanceof THREE.Mesh) {
        const material = object.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          // Update time for surface activity animation
          if (material.uniforms.u_time) {
            material.uniforms.u_time.value = time;
          }

          // Update camera position (not currently used in star shader, but future-proof)
          if (material.uniforms.u_cameraPosition) {
            material.uniforms.u_cameraPosition.value.copy(this.camera.position);
          }
        }

        // Add subtle rotation for additional dynamism (like sunspot/feature rotation)
        object.rotation.y += 0.0005; // Half speed of temp demo for subtlety
      }
    });

    // Render scene with post-processing (bloom)
    this.composer.render();
  };

  // ==========================================================================
  // Camera Animation
  // ==========================================================================

  public focusObjectById(objectId: string): void {
    const targetObject = this.objectRegistry.get(objectId);
    if (!targetObject) {
      console.warn(`[ThreeSceneManager] No focus target found for object: ${objectId}`);
      return;
    }

    this.cameraController.focusObject(targetObject);
  }

  // ==========================================================================
  // System Rendering
  // ==========================================================================

  /**
   * Render a star system in the scene
   *
   * @param system - StarSystem to render
   */
  public renderSystem(system: StarSystem): void {
    console.log('[ThreeSceneManager] Rendering system:', system.name);

    // Clear existing system objects (also clears material registry)
    this.clearSystemObjects();

    // Star-relative scaling system:
    // Calculate scaling factor from star size (scene units per solar radius)
    // All other objects scale relative to this
    const sceneUnitsPerSolarRadius = calculateSceneUnitsPerSolarRadius(system.star);

    // CRITICAL: Calculate ORBIT_SCALE dynamically to ensure:
    // 1. Innermost planet clears star (no star-planet overlap)
    // 2. Adjacent planets don't collide with each other (no planet-planet overlap)
    const STAR_VISUAL_RADIUS = 40; // Must match StarRenderer STAR_BASE_SIZE
    const CLEARANCE_MARGIN = 8; // Minimum gap between object surfaces
    const PLANET_VISIBILITY_SCALE = 2.0; // Reduced from 3.0 for more realistic planet sizes
    const MIN_BASE_RADIUS = 0.15;
    const SOLAR_RADIUS_IN_EARTH_RADII = 109;

    // Helper function to calculate planet visual radius (matches PlanetRenderer)
    const calcPlanetVisualRadius = (planet: Planet) => {
      const planetRadiusInSolarRadii = planet.radius / SOLAR_RADIUS_IN_EARTH_RADII;
      const planetBaseRadius = planetRadiusInSolarRadii * sceneUnitsPerSolarRadius;
      return Math.max(planetBaseRadius, MIN_BASE_RADIUS) * PLANET_VISIBILITY_SCALE;
    };

    // Find innermost planet
    const innermostPlanet = system.star.planets.reduce((closest, p) =>
      p.orbitDistance < closest.orbitDistance ? p : closest
    );
    const innermostPlanetVisualRadius = calcPlanetVisualRadius(innermostPlanet);

    // Constraint 1: Innermost planet must clear star
    const minOrbitClearance = STAR_VISUAL_RADIUS + CLEARANCE_MARGIN + innermostPlanetVisualRadius;
    let minOrbitScale = minOrbitClearance / innermostPlanet.orbitDistance;

    // Constraint 2: Adjacent planets must not collide
    // CRITICAL: Must account for MOON ORBITAL SHELLS, not just planet surfaces!
    // Moons orbit up to 2.5× planet radius, so planets need spacing for:
    // planet1_radius + moon_orbit1 + margin + moon_orbit2 + planet2_radius
    const MAX_MOON_ORBIT = 2.5; // Must match ThreeSceneManager moon positioning

    // Sort planets by orbital distance
    const sortedPlanets = [...system.star.planets].sort((a, b) => a.orbitDistance - b.orbitDistance);

    for (let i = 0; i < sortedPlanets.length - 1; i++) {
      const planet1 = sortedPlanets[i];
      const planet2 = sortedPlanets[i + 1];
      const radius1 = calcPlanetVisualRadius(planet1);
      const radius2 = calcPlanetVisualRadius(planet2);

      // If planet has moons, account for their orbital extent
      // Otherwise just use planet radius
      const extent1 = planet1.moons.length > 0
        ? radius1 + (radius1 * MAX_MOON_ORBIT) // Planet radius + outermost moon orbit
        : radius1; // No moons, just planet radius

      const extent2 = planet2.moons.length > 0
        ? radius2 + (radius2 * MAX_MOON_ORBIT)
        : radius2;

      // Required center-to-center distance to prevent moon orbit overlap
      const minCenterDistance = extent1 + CLEARANCE_MARGIN + extent2;

      // Orbital separation in AU
      const orbitSeparation = planet2.orbitDistance - planet1.orbitDistance;

      // ORBIT_SCALE needed for this pair: orbitSeparation * scale >= minCenterDistance
      const pairMinScale = minCenterDistance / orbitSeparation;

      if (pairMinScale > minOrbitScale) {
        minOrbitScale = pairMinScale;
        const moonInfo = planet1.moons.length > 0 || planet2.moons.length > 0
          ? ` (accounting for ${planet1.moons.length + planet2.moons.length} moons)`
          : '';
        console.log(`[ThreeSceneManager] Planet spacing constraint: ${planet1.name} & ${planet2.name} require scale ${pairMinScale.toFixed(1)}${moonInfo}`);
      }
    }

    // Use larger of minimum required or default comfortable scale
    const ORBIT_SCALE = Math.max(minOrbitScale, 50.0);

    console.log(`[ThreeSceneManager] Orbit scaling: ${ORBIT_SCALE.toFixed(1)} units/AU (star clearance: ${(innermostPlanet.orbitDistance * ORBIT_SCALE - innermostPlanetVisualRadius - STAR_VISUAL_RADIUS).toFixed(1)} units)`);

    // Moon orbits now calculated from planet visual size (no scale constant needed)

    // Create star with enhanced shader (use mesh only - shader handles bloom, no glow sprite needed)
    const starMesh = createStarMesh(system.star, 1.0);
    starMesh.name = 'star';
    this.scene.add(starMesh);

    // Register star material for Phase 3 live editing
    if (starMesh.material) {
      this.materialRegistry.set(system.star.id, starMesh.material as THREE.Material);
      console.log(`[ThreeSceneManager] Registered star material: ${system.star.id}`);
    }
    this.objectRegistry.set(system.star.id, starMesh);

    // Add star lighting for planets
    const starLights = createStarLight(system.star, 3.0);
    starLights.name = 'star-lights';
    this.scene.add(starLights);

    console.log(`[ThreeSceneManager] Added star: ${system.star.name} (scaling: ${sceneUnitsPerSolarRadius.toFixed(2)} units/solar radius)`);

    const orbitingPlanets: PlanetOrbitBinding[] = [];
    const orbitTrailObjects: THREE.Object3D[] = [];
    const { simulationTimeDays: initialSimulationTimeDays, showOrbitTrails } = useSystemStore.getState();

    // Create planets, their orbits, and moons (with LOD)
    system.star.planets.forEach((planet, planetIndex) => {
      // Create orbit line from explicit orbital elements so trail matches live motion
      const { color, opacity } = getOrbitLineStyle(planet.type);
      const orbitLine = createOrbitLineFromElements(
        planet.generatedOrbit,
        ORBIT_SCALE,
        color,
        opacity
      );
      orbitLine.name = `orbit-planet-${planetIndex}`;
      orbitLine.visible = showOrbitTrails;
      this.scene.add(orbitLine);
      orbitTrailObjects.push(orbitLine);

      // Create container group for planet + moons
      // This allows moons to be in planet's local space
      const planetSystemGroup = new THREE.Group();
      planetSystemGroup.name = `planet-system-${planetIndex}`;

      const initialPlanetSample = sampleOrbitPosition(planet.generatedOrbit, initialSimulationTimeDays);

      // Position the group at the planet's orbital location
      planetSystemGroup.position.set(
        initialPlanetSample.localPosition.x * ORBIT_SCALE,
        initialPlanetSample.localPosition.y * ORBIT_SCALE,
        initialPlanetSample.localPosition.z * ORBIT_SCALE
      );

      // Store planet data on group for raycasting
      planetSystemGroup.userData = {
        type: 'planet',
        data: planet
      };
      this.objectRegistry.set(planet.id, planetSystemGroup);

      // Star position in world space (at origin)
      const starPositionWorld = new THREE.Vector3(0, 0, 0);

      // Create planet with LOD (pass camera and habitable zone for intelligent shader parameters)
      const planetLOD = new CelestialBodyLOD(
        planet,
        'planet',
        sceneUnitsPerSolarRadius,
        undefined, // No parent planet for planets
        this.camera, // Pass camera for atmosphere effects
        system.star.habitableZone, // Pass habitable zone for intelligent parameter mapping
        starPositionWorld // Star position in world coordinate system
      );
      planetLOD.object.name = `planet-${planetIndex}`;

      const tiltGroup = new THREE.Group();
      tiltGroup.name = `planet-tilt-${planetIndex}`;
      tiltGroup.add(planetLOD.object);
      planetSystemGroup.add(tiltGroup);

      // Register planet LOD for Phase 3 live editing
      this.materialRegistry.set(planet.id, planetLOD);
      console.log(`[ThreeSceneManager] Registered planet LOD: ${planet.id}`);

      // Calculate planet visual radius using the helper function (ensures consistency)
      const planetVisualRadius = calcPlanetVisualRadius(planet);
      const moonBindings: MoonOrbitBinding[] = [];

      // Create moons with LOD and add as children
      planet.moons.forEach((moon, moonIndex) => {
        // CRITICAL: Keep moons TIGHT around planet (within Hill sphere)
        // Position moons in concentric shells from 1.5× to 2.5× planet radius
        // This ensures they stay within planet's gravitational sphere of influence
        const MIN_MOON_ORBIT = 1.5; // Minimum: 1.5× planet radius (clear of surface)
        const MAX_MOON_ORBIT = 2.5; // Maximum: 2.5× planet radius (tight clustering)

        // Distribute moons proportionally from inner to outer shell
        const orbitMultiplier = planet.moons.length === 1
          ? (MIN_MOON_ORBIT + MAX_MOON_ORBIT) / 2 // Single moon: middle orbit
          : MIN_MOON_ORBIT + (moonIndex / (planet.moons.length - 1)) * (MAX_MOON_ORBIT - MIN_MOON_ORBIT);

        const moonOrbitSceneUnits = planetVisualRadius * orbitMultiplier;
        const nextOrbitMultiplier = planet.moons.length === 1
          ? orbitMultiplier
          : MIN_MOON_ORBIT + ((moonIndex + 1) / planet.moons.length) * (MAX_MOON_ORBIT - MIN_MOON_ORBIT);
        const maxMoonOrbitSceneUnits = planetVisualRadius * Math.min(nextOrbitMultiplier, MAX_MOON_ORBIT);

        // Star position in world space (at origin) - same for all moons
        const starPositionWorld = new THREE.Vector3(0, 0, 0);

        const moonLOD = new CelestialBodyLOD(
          moon,
          'moon',
          sceneUnitsPerSolarRadius,
          planet, // Parent planet required for moon renderer
          this.camera, // Pass camera for shader uniforms
          undefined, // Moons don't use habitable zone in shader
          starPositionWorld // Star position in world coordinate system
        );

        moonLOD.object.name = `moon-${planetIndex}-${moonIndex}`;

        const initialMoonSample = sampleOrbitPosition(moon.generatedOrbit, initialSimulationTimeDays);
        const initialMoonDirection = new THREE.Vector3(
          initialMoonSample.localPosition.x,
          initialMoonSample.localPosition.y,
          initialMoonSample.localPosition.z
        );
        const initialMoonRadius = this.orbitRuntimeManager.mapMoonOrbitRadiusToScene(
          moon,
          moonOrbitSceneUnits,
          maxMoonOrbitSceneUnits,
          initialMoonSample.radius
        );

        if (initialMoonDirection.lengthSq() === 0) {
          moonLOD.object.position.set(initialMoonRadius, 0, 0);
        } else {
          initialMoonDirection.normalize().multiplyScalar(initialMoonRadius);
          moonLOD.object.position.copy(initialMoonDirection);
        }

        planetSystemGroup.add(moonLOD.object);

        // Register moon LOD for Phase 3 live editing
        this.materialRegistry.set(moon.id, moonLOD);
        this.objectRegistry.set(moon.id, moonLOD.object);
        console.log(`[ThreeSceneManager] Registered moon LOD: ${moon.id}`);

        moonBindings.push({
          moon,
          object: moonLOD.object,
          minSceneRadius: moonOrbitSceneUnits,
          maxSceneRadius: maxMoonOrbitSceneUnits,
        });
      });

      const binding: PlanetOrbitBinding = {
        planet,
        group: planetSystemGroup,
        tiltGroup,
        planetObject: planetLOD.object,
        orbitScale: ORBIT_SCALE,
        moons: moonBindings,
      };

      orbitingPlanets.push(binding);

      // Add the complete planet system to scene
      this.scene.add(planetSystemGroup);

      console.log(
        `[ThreeSceneManager] Added planet ${planetIndex + 1}/${system.star.planets.length}: ` +
        `${planet.name} with ${planet.moons.length} moons (LOD enabled)`
      );
    });

    this.orbitRuntimeManager.configure(
      orbitingPlanets,
      orbitTrailObjects,
      showOrbitTrails,
    );
    this.orbitRuntimeManager.update(
      initialSimulationTimeDays,
      useSystemStore.getState().planetMotionOverrides,
    );

    // Adjust camera to view the whole system
    this.focusOnSystem(system, ORBIT_SCALE);

    console.log('[ThreeSceneManager] System rendered successfully');
  }

  /**
   * Adjust camera to view the entire system
   * @param system - Star system to focus on
   * @param orbitScale - Scene units per AU (calculated in renderSystem)
   */
  private focusOnSystem(system: StarSystem, orbitScale: number): void {
    this.cameraController.focusSystem(system, orbitScale);
  }

  // ==========================================================================
  // Galaxy Rendering (Phase 2)
  // ==========================================================================

  /**
   * Render a galaxy in the scene (Phase 2)
   * Switches to galaxy view mode
   *
   * @param galaxy - Galaxy to render
   */
  public renderGalaxy(galaxy: Galaxy): void {
    console.log('[ThreeSceneManager] Rendering galaxy:', galaxy.name, `(${galaxy.systemCount} systems)`);

    // Capture previous view mode before switching (for camera positioning logic)
    const wasInSystemView = this.currentViewMode === 'system';

    // Reset custom markers flag if this is a new galaxy generation (not returning from system)
    if (!wasInSystemView) {
      this.customMarkersSet = false;
      console.log('[ThreeSceneManager] New galaxy - reset customMarkersSet flag');
    }

    // Clear existing system objects (keep starfield)
    this.clearSystemObjects();

    // Clear previous OLD galaxy rendering (if any)
    const previousGalaxyGroup = this.scene.getObjectByName('GalaxyGroup');
    if (previousGalaxyGroup) {
      this.scene.remove(previousGalaxyGroup);
    }

    // Phase 2.5: Multi-layer galaxy system handles visual rendering
    // The old GalaxyRenderer is NO LONGER USED - multi-layer system renders instead

    // Initialize galaxy layers on FIRST galaxy generation only
    if (!this.galaxyLayersInitialized) {
      this.initializeGalaxyLayers();
      this.galaxyLayersInitialized = true;
      console.log('[ThreeSceneManager] Galaxy layers initialized on first generation');
    }

    // Visual layers are automatically updated via store subscription
    // galaxy-store.initializeFromProceduralGalaxy() configures layers based on galaxy type

    // Add star system markers to Layer 0 (primary layer)
    // Convert procedural star systems to visual markers
    if (this.galaxyLayers[0]) {
      // Calculate scale factors: Convert from light-years to scene units
      // Galaxies have different scales for horizontal (X/Z) and vertical (Y)
      // Visual: diskRadius ~55 units, diskThickness ~4 units
      // Procedural: diskRadius ~100 LY, diskThickness ~10 LY

      let proceduralRadius = 100; // Default fallback
      let proceduralThickness = 10; // Default fallback

      if (galaxy.type === 'Spiral' && galaxy.spiralParams) {
        proceduralRadius = galaxy.spiralParams.diskRadius;
        proceduralThickness = galaxy.spiralParams.diskThickness;
      } else if (galaxy.type === 'Elliptical' && galaxy.ellipticalParams) {
        proceduralRadius = galaxy.ellipticalParams.majorAxis;
        proceduralThickness = galaxy.ellipticalParams.minorAxis; // For elliptical, use minor axis for Y
      } else if (galaxy.type === 'Irregular' && galaxy.irregularParams) {
        proceduralRadius = galaxy.irregularParams.boundingRadius;
        proceduralThickness = galaxy.irregularParams.boundingRadius * 0.5; // Irregular uses ~half radius for thickness
      }

      const visualSize = 55; // From GalaxyParticleSystem default config
      const visualThickness = 4.0; // From GalaxyParticleSystem default diskThickness

      const scaleXZ = visualSize / proceduralRadius; // Horizontal scale
      const scaleY = visualThickness / proceduralThickness; // Vertical scale (much smaller!)

      // Only add auto-generated markers if user hasn't set custom markers
      if (!this.customMarkersSet) {
        const markers = galaxy.systems.map(systemPlacement => ({
          position: new THREE.Vector3(
            systemPlacement.position.x * scaleXZ,
            systemPlacement.position.y * scaleY, // Different scale for Y!
            systemPlacement.position.z * scaleXZ
          ),
          color: new THREE.Color(1.0, 1.0, 0.7), // Yellow-white for star systems
          size: 5.0, // Bright, visible markers
          data: systemPlacement.system // Store system data for interaction
        }));

        this.galaxyLayers[0].addSystemMarkers(markers);
        console.log(`[ThreeSceneManager] Added ${markers.length} auto-generated star system markers to Layer 0`);
        console.log(`[ThreeSceneManager] Scale factors: XZ=${scaleXZ.toFixed(3)} (${proceduralRadius.toFixed(1)} LY → ${visualSize} units), Y=${scaleY.toFixed(3)} (${proceduralThickness.toFixed(1)} LY → ${visualThickness} units)`);
        console.log(`[ThreeSceneManager] Sample marker positions (scaled):`, markers.slice(0, 3).map(m => ({
          x: m.position.x.toFixed(2),
          y: m.position.y.toFixed(2),
          z: m.position.z.toFixed(2)
        })));
      } else {
        console.log(`[ThreeSceneManager] Skipping auto-generated markers (custom markers are set)`);
      }
    }

    // Switch to galaxy view mode
    this.currentViewMode = 'galaxy';

    // Restore galaxy layer visibility based on store state
    // (They were hidden when switching to system view)
    const { layers } = useGalaxyStore.getState();
    this.galaxyLayers.forEach((galaxy, index) => {
      if (galaxy) {
        const layerGroup = galaxy.getGroup();
        layerGroup.visible = layers[index].visible;
        console.log(`[ThreeSceneManager] Restored Layer ${index} visibility:`, layers[index].visible);
      }
    });

    // Position camera to view entire galaxy
    this.focusOnGalaxy(galaxy, wasInSystemView);

    console.log('[ThreeSceneManager] Galaxy view activated (multi-layer rendering)');
  }

  // ==========================================================================
  // Multi-Layer Galaxy System (Phase 2.5)
  // ==========================================================================

  /**
   * Initialize multi-layer galaxy particle system
   * Creates 3 independent galaxy instances and subscribes to store changes
   */
  private initializeGalaxyLayers(): void {
    const { layers } = useGalaxyStore.getState();
    this.lastGalaxyStoreLayers = layers;

    // Create 3 galaxy particle system instances
    layers.forEach((layer, index) => {
      const galaxy = new GalaxyParticleSystem(layer.config);
      const galaxyGroup = galaxy.getGroup();

      // Set visibility based on layer state
      galaxyGroup.visible = layer.visible;

      // Store layer ID in userData for identification
      galaxyGroup.userData = { layerId: index };
      galaxyGroup.name = `GalaxyLayer${index}`;

      // Add to scene
      this.scene.add(galaxyGroup);

      // Store reference
      this.galaxyLayers[index] = galaxy;
    });

    // Subscribe to galaxy store changes
    this.galaxyStoreUnsubscribe = useGalaxyStore.subscribe(
      (state) => {
        if (state.layers === this.lastGalaxyStoreLayers) {
          return;
        }

        this.lastGalaxyStoreLayers = state.layers;
        this.handleGalaxyLayersUpdate(state.layers);
      }
    );

    console.log('[ThreeSceneManager] Multi-layer galaxy system initialized (3 layers)');
  }

  /**
   * Handle galaxy layer updates from store
   * @param layers - Updated layer configurations
   */
  private handleGalaxyLayersUpdate(layers: [GalaxyLayer, GalaxyLayer, GalaxyLayer]): void {
    layers.forEach((layer, index) => {
      const galaxy = this.galaxyLayers[index];
      if (!galaxy) return;

      const galaxyGroup = galaxy.getGroup();

      // Update visibility
      if (galaxyGroup.visible !== layer.visible) {
        galaxyGroup.visible = layer.visible;
        console.log(`[ThreeSceneManager] Layer ${index} visibility:`, layer.visible);
      }

      // Update configuration (galaxy will regenerate particles)
      galaxy.updateConfig(layer.config);
    });
  }

  /**
   * Update a specific galaxy layer configuration
   * @param layerId - Layer index (0, 1, or 2)
   * @param config - Partial galaxy config to apply
   */
  public updateGalaxyLayer(layerId: 0 | 1 | 2, config: Partial<GalaxyConfig>): void {
    const galaxy = this.galaxyLayers[layerId];
    if (!galaxy) {
      console.warn(`[ThreeSceneManager] Galaxy layer ${layerId} not initialized`);
      return;
    }

    galaxy.updateConfig(config);
    console.log(`[ThreeSceneManager] Updated galaxy layer ${layerId}:`, config);
  }

  /**
   * Set visibility for a specific galaxy layer
   * @param layerId - Layer index (0, 1, or 2)
   * @param visible - Visibility state
   */
  public setGalaxyLayerVisibility(layerId: 0 | 1 | 2, visible: boolean): void {
    const galaxy = this.galaxyLayers[layerId];
    if (!galaxy) {
      console.warn(`[ThreeSceneManager] Galaxy layer ${layerId} not initialized`);
      return;
    }

    const galaxyGroup = galaxy.getGroup();
    galaxyGroup.visible = visible;
    console.log(`[ThreeSceneManager] Galaxy layer ${layerId} visibility:`, visible);
  }

  /**
   * Dispose multi-layer galaxy system
   * Called during cleanup
   */
  private disposeGalaxyLayers(): void {
    // Unsubscribe from store
    if (this.galaxyStoreUnsubscribe) {
      this.galaxyStoreUnsubscribe();
      this.galaxyStoreUnsubscribe = null;
    }

    this.lastGalaxyStoreLayers = null;

    // Dispose each galaxy layer
    this.galaxyLayers.forEach((galaxy, index) => {
      if (galaxy) {
        const galaxyGroup = galaxy.getGroup();
        this.scene.remove(galaxyGroup);
        galaxy.dispose();
        this.galaxyLayers[index] = null;
      }
    });

    console.log('[ThreeSceneManager] Multi-layer galaxy system disposed');
  }

  // ============================================================================
  // Independent Marker System
  // ============================================================================

  /**
   * Generate random markers for the active galaxy layer
   * Adds procedurally positioned markers based on galaxy structure
   */
  public generateMarkersForActiveLayer(): void {
    this.markerManager.generateMarkersForActiveLayer();
  }

  /**
   * Clear all galaxy layer markers
   */
  public clearMarkers(): void {
    this.markerManager.clearMarkers();
  }

  /**
   * Toggle galaxy layer marker visibility
   */
  public toggleMarkersVisibility(): void {
    this.markerManager.toggleMarkersVisibility();
  }

  /**
   * Adjust camera to view the entire galaxy
   * @param galaxy - Galaxy to focus on
   * @param returningFromSystemView - True if returning from system view (reposition without animation)
   */
  private focusOnGalaxy(galaxy: Galaxy, returningFromSystemView: boolean = false): void {
    this.cameraController.focusGalaxy(galaxy, returningFromSystemView);
  }

  /**
   * Switch back from galaxy view to system view
   */
  public switchToSystemView(): void {
    console.log('[ThreeSceneManager] Switching to system view');

    // Clear old galaxy rendering (Phase 2 legacy)
    const galaxyGroup = this.scene.getObjectByName('GalaxyGroup');
    if (galaxyGroup) {
      this.scene.remove(galaxyGroup);
    }
    this.galaxyRenderer.clear();

    // Hide all galaxy layers (Phase 2.5 multi-layer system)
    this.galaxyLayers.forEach((layer, index) => {
      if (layer) {
        const layerGroup = layer.getGroup();
        layerGroup.visible = false;
        console.log(`[ThreeSceneManager] Hid galaxy layer ${index}`);
      }
    });

    // Reset camera controls for system scale
    this.cameraController.setDistanceLimits(5, 5000);

    // Switch view mode
    this.currentViewMode = 'system';

    console.log('[ThreeSceneManager] Switched to system view');
  }

  /**
   * Clear all system objects from scene (keep starfield and galaxy layers)
   */
  private clearSystemObjects(): void {
    const objectsToRemove: THREE.Object3D[] = [];

    // Only collect DIRECT children of scene (not nested objects like moons)
    // Preserve: starfield, GalaxyLayer0, GalaxyLayer1, GalaxyLayer2
    this.scene.children.forEach((object) => {
      const isStarfield = object.name === 'starfield';
      const isGalaxyLayer = object.name?.startsWith('GalaxyLayer');

      if (!isStarfield && !isGalaxyLayer) {
        objectsToRemove.push(object);
      }
    });

    // Remove and recursively dispose
    objectsToRemove.forEach((object) => {
      this.scene.remove(object);
      disposeObjectTree(object);
    });

    // Clear material and object registries (Phase 3)
    this.materialRegistry.clear();
    this.objectRegistry.clear();
    this.orbitRuntimeManager.reset();

    console.log('[ThreeSceneManager] System objects cleared');
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get reference to Three.js scene
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get reference to camera
   */
  public getCamera(): THREE.Camera {
    return this.camera;
  }

  /**
   * Get reference to renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get current view mode (system or galaxy)
   */
  public getViewMode(): 'system' | 'galaxy' {
    return this.currentViewMode;
  }

  /**
   * Recompute renderer/camera sizes when layout changes without a window resize.
   */
  public resize(): void {
    this.handleResize();
  }

  // ==========================================================================
  // Phase 3: Architect Mode - Live Shader Editing
  // ==========================================================================

  /**
   * Update shader uniform for a celestial body (Phase 3: Architect Mode)
   *
   * @param objectId - ID of the celestial body (star, planet, or moon)
   * @param uniformName - Name of the shader uniform to update
   * @param value - New value for the uniform
   */
  public updateObjectUniforms(objectId: string, uniformName: string, value: UniformOverrideValue): void {
    const entry = this.materialRegistry.get(objectId);

    if (!entry) {
      console.warn(`[ThreeSceneManager] No material found for object: ${objectId}`);
      return;
    }

    // Check if entry is a LOD object (planets/moons) or direct material (stars)
    if (entry instanceof CelestialBodyLOD) {
      // LOD object - update all LOD level materials
      entry.updateUniform(uniformName, value);
      console.log(`[ThreeSceneManager] Updated LOD uniform ${uniformName} for ${objectId}`);
    } else if (entry instanceof THREE.Material) {
      // Direct material (star) - update single material
      if (entry instanceof THREE.ShaderMaterial) {
        // Check if uniform exists
        if (!entry.uniforms[uniformName]) {
          console.warn(`[ThreeSceneManager] Uniform ${uniformName} not found in material for ${objectId}`);
          return;
        }

        // Handle color conversion from hex string
        if (typeof value === 'string' && value.startsWith('#')) {
          const color = new THREE.Color(value);
          entry.uniforms[uniformName].value.set(color.r, color.g, color.b);
        } else {
          entry.uniforms[uniformName].value = value;
        }
        entry.uniformsNeedUpdate = true;
        console.log(`[ThreeSceneManager] Updated material uniform ${uniformName} for ${objectId}`);
      }
    }
  }

  /**
   * Dispose of scene manager - clean up resources
   */
  public dispose(): void {
    console.log('[ThreeSceneManager] Disposing...');

    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.selectionController.dispose();

    // Dispose camera controller and controls
    this.cameraController.dispose();
    this.controls.dispose();

    // Dispose galaxy renderer (Phase 2)
    this.galaxyRenderer.dispose();

    // Dispose multi-layer galaxy system (Phase 2.5)
    this.disposeGalaxyLayers();

    // Dispose independent marker system
    this.markerManager.dispose();

    // Clear scene
    this.clearSystemObjects();

    // Dispose starfield
    const starfield = this.scene.getObjectByName('starfield');
    if (starfield) {
      disposeObjectResources(starfield);
    }

    // Dispose renderer
    this.renderer.dispose();

    // Remove canvas from DOM
    this.container.removeChild(this.renderer.domElement);

    console.log('[ThreeSceneManager] Disposed successfully');
  }
}
