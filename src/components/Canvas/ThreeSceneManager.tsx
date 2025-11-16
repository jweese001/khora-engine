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
import type { StarSystem } from '../../types/celestial-bodies';
import type { Galaxy, GalaxySystemPlacement } from '../../types/galaxy';
import type { GalaxyConfig } from '../../rendering/GalaxyParticleSystem';
import { createStarMesh, createStarLight, calculateSceneUnitsPerSolarRadius } from '../../rendering/StarRenderer';
import { createTypedOrbitLine } from '../../rendering/OrbitRenderer';
import { CelestialBodyLOD } from '../../rendering/CelestialBodyLOD';
import { GalaxyRenderer } from '../../rendering/GalaxyRenderer';
import { GalaxyParticleSystem } from '../../rendering/GalaxyParticleSystem';
import { useGalaxyStore, type GalaxyLayer, generateMarkerPositions } from '../../store/galaxy-store';
import { useSystemStore } from '../../store/system-store';
import { generateGalaxySystems } from '../../generation/galaxy-generator';
import { SeededRandom } from '../../utils/random';

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

  // Animation loop
  private animationFrameId: number | null = null;

  // Container reference
  private container: HTMLElement;

  // Callbacks
  private onObjectSelected?: (object: any) => void;

  // Raycasting for object selection
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  // Galaxy rendering (Phase 2)
  private galaxyRenderer: GalaxyRenderer;
  private currentViewMode: 'system' | 'galaxy' = 'system';
  private hasAnimatedToGalaxyView: boolean = false; // Track if initial galaxy animation has played

  // Multi-layer galaxy particle system (Phase 2.5)
  // Array of exactly 3 independent galaxy particle systems for visual composition
  private galaxyLayers: (GalaxyParticleSystem | null)[] = [null, null, null];
  private galaxyStoreUnsubscribe: (() => void) | null = null;
  private galaxyLayersInitialized: boolean = false; // Track if layers have been created

  // Independent marker system (separate from galaxy layers)
  // Markers persist when layers are edited/switched
  private markerGroup: THREE.Group;
  private markerPoints: THREE.Points | null = null;
  private markerMaterial: THREE.ShaderMaterial | null = null;
  private markerStoreUnsubscribe: (() => void) | null = null;

  // Material tracking (Phase 3: Architect Mode)
  // Maps object ID -> THREE.Material for live uniform updates
  private materialRegistry: Map<string, THREE.Material> = new Map();

  // Debug mode (toggle with D key)
  private debugMode: number = 0; // 0=normal, 1-7=debug visualizations

  // Time tracking for delta calculations
  private lastTime: number = 0;

  // Camera animation for smooth transitions
  private cameraAnimation: {
    active: boolean;
    startPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    targetTarget: THREE.Vector3;
    progress: number;
    duration: number;
  } | null = null;

  /**
   * Initialize Three.js scene manager
   *
   * @param container - DOM element to mount the renderer
   * @param onObjectSelected - Callback when user clicks an object
   */
  constructor(
    container: HTMLElement,
    onObjectSelected?: (object: any) => void
  ) {
    this.container = container;
    this.onObjectSelected = onObjectSelected;

    // Initialize raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Set threshold for Points raycasting (markers)
    // This determines how close the mouse needs to be to a point for it to register as a hit
    // Value is in scene units (NOT light-years - those are converted to scene units)
    // Smaller values require more precise clicking
    this.raycaster.params.Points.threshold = 0.4; // 0.4 scene units - requires clicking close to visible marker

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

    // Create controls
    this.controls = this.createControls();

    // Initialize galaxy renderer (Phase 2)
    this.galaxyRenderer = new GalaxyRenderer();

    // Multi-layer galaxy system (Phase 2.5) - Deferred until first galaxy generation
    // Galaxy layers will be created when user generates a galaxy, NOT on app load
    // This ensures no default galaxy appears before user interaction

    // Independent marker system - Markers persist when galaxy layers change
    this.markerGroup = new THREE.Group();
    this.markerGroup.name = 'independentMarkers';
    this.scene.add(this.markerGroup);

    // Subscribe to marker store changes
    this.subscribeToMarkerStore();

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
   * Set up event listeners for window resize, object selection, and debug controls
   */
  private setupEventListeners(): void {
    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Object selection (click)
    this.renderer.domElement.addEventListener('click', this.handleClick);

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
   * Handle click for object selection via raycasting
   */
  private handleClick = (event: MouseEvent): void => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // In galaxy view, raycast against marker systems
    if (this.currentViewMode === 'galaxy') {
      // Check if markers are clickable
      const { markers } = useGalaxyStore.getState();
      if (!markers.clickable) {
        console.log('[ThreeSceneManager] Click ignored - markers not clickable');
        return; // Skip marker click detection when disabled
      }

      let intersects: THREE.Intersection[] = [];

      // Check BOTH marker systems:
      // 1. Independent marker system (from control panel)
      if (this.markerPoints && this.markerPoints.visible) {
        console.log('[ThreeSceneManager] Raycasting against independent marker system...');
        intersects = this.raycaster.intersectObject(this.markerPoints, false);
        console.log('[ThreeSceneManager] Independent markers raycast result:', {
          intersectCount: intersects.length,
          markerCount: this.markerPoints.geometry.attributes.position.count
        });
      }

      // 2. Galaxy layer system markers (auto-generated)
      if (intersects.length === 0 && this.galaxyLayers[0]) {
        const galaxyGroup = this.galaxyLayers[0].getGroup();
        const galaxyMarkers = galaxyGroup.getObjectByName('systemMarkers');

        if (galaxyMarkers) {
          console.log('[ThreeSceneManager] Raycasting against galaxy layer markers...');
          intersects = this.raycaster.intersectObject(galaxyMarkers, false);
          console.log('[ThreeSceneManager] Galaxy layer markers raycast result:', {
            intersectCount: intersects.length,
            markerData: galaxyMarkers.userData
          });
        }
      }

      if (intersects.length > 0) {
        // Found an intersection with marker points
        const intersection = intersects[0];
        const markerIndex = intersection.index;

        console.log('[ThreeSceneManager] Marker clicked at index:', markerIndex);

        // Get the corresponding star system from the store
        const store = useSystemStore.getState();
        const currentGalaxy = store.currentGalaxy;

        if (currentGalaxy && markerIndex !== undefined && markerIndex < currentGalaxy.systems.length) {
          const clickedSystem = currentGalaxy.systems[markerIndex].system;

          if (clickedSystem) {
            console.log('[ThreeSceneManager] Star system selected:', clickedSystem.star?.name || 'Unknown');

            // Transition to system view with this system
            this.transitionToSystem(clickedSystem);
          }
        }
      }
      return;
    }

    // In system view, raycast against celestial bodies
    // Check for intersections (exclude starfield and orbit lines)
    const intersects = this.raycaster.intersectObjects(
      this.scene.children.filter((obj) =>
        obj.name !== 'starfield' && !obj.name.startsWith('orbit-')
      ),
      true // Recursive
    );

    if (intersects.length > 0) {
      // Find the first object with userData
      let selectedObject = intersects[0].object;
      let meshObject = intersects[0].object as THREE.Mesh;

      // Walk up the hierarchy to find object with userData
      while (selectedObject && !selectedObject.userData?.type) {
        selectedObject = selectedObject.parent as THREE.Object3D;
      }

      if (selectedObject?.userData?.type && this.onObjectSelected) {
        console.log('[ThreeSceneManager] Object selected:', selectedObject.userData);

        // Get material from the actual mesh
        const material = (meshObject as THREE.Mesh).material;

        this.onObjectSelected({
          ...selectedObject.userData,
          material: material
        });
      }
    } else {
      // Clicked on empty space - deselect
      if (this.onObjectSelected) {
        this.onObjectSelected(null);
      }
    }
  };

  /**
   * Find the closest marker to a clicked point
   * Used for determining which star system marker was clicked
   */
  private findClosestMarker(layer: GalaxyParticleSystem, clickPoint: THREE.Vector3): any {
    // GalaxyParticleSystem stores markers internally but doesn't expose them
    // We need to access the marker data through the Points geometry
    const group = layer.getGroup();
    const markerPoints = group.children.find(child => child.name === 'systemMarkers') as THREE.Points;

    if (!markerPoints || !markerPoints.geometry) {
      console.warn('[ThreeSceneManager] No marker geometry found');
      return null;
    }

    const positions = markerPoints.geometry.getAttribute('position');
    if (!positions) {
      console.warn('[ThreeSceneManager] No position attribute in marker geometry');
      return null;
    }

    // We need to get the system data from somewhere
    // The marker data is stored in the GalaxyParticleSystem's private systemMarkers array
    // For now, we'll access it through a public getter that we'll add to GalaxyParticleSystem
    // Or we can access the userData if we stored it there

    // Find the closest marker position to the click point
    let closestIndex = -1;
    let closestDistance = Infinity;

    for (let i = 0; i < positions.count; i++) {
      const markerPos = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );

      // Transform to world space (account for marker rotation)
      markerPos.applyMatrix4(markerPoints.matrixWorld);

      const distance = markerPos.distanceTo(clickPoint);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    console.log(`[ThreeSceneManager] Closest marker index: ${closestIndex}, distance: ${closestDistance.toFixed(2)}`);

    // We need to get the actual system data for this marker
    // Store it in userData when creating markers
    if (markerPoints.userData?.markers && markerPoints.userData.markers[closestIndex]) {
      return markerPoints.userData.markers[closestIndex];
    }

    console.warn('[ThreeSceneManager] No marker data found in userData');
    return null;
  }

  /**
   * Transition from galaxy view to system view
   * Zooms camera to the selected star system and renders it
   */
  private transitionToSystem(system: any): void {
    console.log('[ThreeSceneManager] Transitioning to system:', system.star?.name || 'Unknown');

    // Find the index of this system in the current galaxy
    const store = useSystemStore.getState();
    const currentGalaxy = store.currentGalaxy;

    if (!currentGalaxy) {
      console.error('[ThreeSceneManager] No current galaxy to find system in');
      return;
    }

    // Find the system index by matching the system ID or name
    const systemIndex = currentGalaxy.systems.findIndex(
      (placement: GalaxySystemPlacement) => placement.system.id === system.id || placement.system.name === system.name
    );

    if (systemIndex === -1) {
      console.error('[ThreeSceneManager] Could not find system in galaxy:', system.name);
      return;
    }

    console.log(`[ThreeSceneManager] Found system at index ${systemIndex}, focusing...`);

    // Use the store's focusSystem method to transition
    store.focusSystem(systemIndex);

    // The store will trigger renderSystem() via the subscription
    // Camera animation will be handled there
  }

  /**
   * Handle keyboard input for debug controls
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Press P to print current camera position
    if (event.key === 'p' || event.key === 'P') {
      console.log('═══════════════════════════════════════');
      console.log('CAMERA POSITION:');
      console.log(`  position: new THREE.Vector3(${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)})`);
      console.log(`  lookAt: new THREE.Vector3(${this.controls.target.x.toFixed(2)}, ${this.controls.target.y.toFixed(2)}, ${this.controls.target.z.toFixed(2)})`);
      console.log('═══════════════════════════════════════');
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

    // Update multi-layer galaxy particle systems (Phase 2.5)
    // All layers update regardless of view mode for smooth transitions
    this.galaxyLayers.forEach((galaxy) => {
      if (galaxy) {
        galaxy.update(deltaTime);
      }
    });

    // Update independent marker system
    // Sync rotation with active galaxy layer so markers rotate with galaxy
    if (this.currentViewMode === 'galaxy') {
      const { activeLayerId } = useGalaxyStore.getState();
      const activeGalaxy = this.galaxyLayers[activeLayerId];

      if (activeGalaxy && this.markerPoints) {
        // Copy rotation from active galaxy layer to marker group
        const galaxyGroup = activeGalaxy.getGroup();
        this.markerGroup.rotation.copy(galaxyGroup.rotation);

        // Update time uniform for pulsing effect
        if (this.markerMaterial && this.markerMaterial.uniforms.time) {
          this.markerMaterial.uniforms.time.value = time;
        }
      }
    }

    // Update camera animation if active
    if (this.cameraAnimation && this.cameraAnimation.active) {
      this.updateCameraAnimation(deltaTime);
    }

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

  /**
   * Animate camera to a new position smoothly
   * @param targetPosition - Target camera position
   * @param targetLookAt - Target look-at point
   * @param duration - Animation duration in seconds (default: 1.5s)
   */
  private animateCamera(
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    duration: number = 1.5
  ): void {
    this.cameraAnimation = {
      active: true,
      startPosition: this.camera.position.clone(),
      targetPosition: targetPosition.clone(),
      startTarget: this.controls.target.clone(),
      targetTarget: targetLookAt.clone(),
      progress: 0,
      duration
    };
  }

  /**
   * Update camera animation (called every frame)
   * @param deltaTime - Time since last frame in seconds
   */
  private updateCameraAnimation(deltaTime: number): void {
    if (!this.cameraAnimation) return;

    // Update progress
    this.cameraAnimation.progress += deltaTime / this.cameraAnimation.duration;

    if (this.cameraAnimation.progress >= 1.0) {
      // Animation complete - snap to final position
      this.camera.position.copy(this.cameraAnimation.targetPosition);
      this.controls.target.copy(this.cameraAnimation.targetTarget);
      this.controls.update();
      this.cameraAnimation.active = false;
      console.log('[ThreeSceneManager] Camera animation complete');
    } else {
      // Ease-in-out interpolation for smooth motion
      const t = this.easeInOutCubic(this.cameraAnimation.progress);

      // Lerp position
      this.camera.position.lerpVectors(
        this.cameraAnimation.startPosition,
        this.cameraAnimation.targetPosition,
        t
      );

      // Lerp target
      this.controls.target.lerpVectors(
        this.cameraAnimation.startTarget,
        this.cameraAnimation.targetTarget,
        t
      );

      this.controls.update();
    }
  }

  /**
   * Ease-in-out cubic function for smooth camera motion
   * @param t - Progress from 0 to 1
   * @returns Eased value from 0 to 1
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
    const calcPlanetVisualRadius = (planet: any) => {
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
    const starMesh = createStarMesh(system.star, 1.0, this.camera);
    starMesh.name = 'star';
    this.scene.add(starMesh);

    // Register star material for Phase 3 live editing
    if (starMesh.material) {
      this.materialRegistry.set(system.star.id, starMesh.material as THREE.Material);
      console.log(`[ThreeSceneManager] Registered star material: ${system.star.id}`);
    }

    // Add star lighting for planets
    const starLights = createStarLight(system.star, 3.0);
    starLights.name = 'star-lights';
    this.scene.add(starLights);

    console.log(`[ThreeSceneManager] Added star: ${system.star.name} (scaling: ${sceneUnitsPerSolarRadius.toFixed(2)} units/solar radius)`);

    // Create planets, their orbits, and moons (with LOD)
    system.star.planets.forEach((planet, planetIndex) => {
      // Create orbit line
      const orbitLine = createTypedOrbitLine(
        planet.orbitDistance * ORBIT_SCALE,
        planet.type
      );
      orbitLine.name = `orbit-planet-${planetIndex}`;
      this.scene.add(orbitLine);

      // Create container group for planet + moons
      // This allows moons to be in planet's local space
      const planetSystemGroup = new THREE.Group();
      planetSystemGroup.name = `planet-system-${planetIndex}`;

      // Position the group at the planet's orbital location
      planetSystemGroup.position.set(planet.orbitDistance * ORBIT_SCALE, 0, 0);

      // Store planet data on group for raycasting
      planetSystemGroup.userData = {
        type: 'planet',
        data: planet
      };

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
      planetSystemGroup.add(planetLOD.object);

      // Register planet LOD for Phase 3 live editing
      this.materialRegistry.set(planet.id, planetLOD as any); // Store LOD object, not material
      console.log(`[ThreeSceneManager] Registered planet LOD: ${planet.id}`);

      // Calculate planet visual radius using the helper function (ensures consistency)
      const planetVisualRadius = calcPlanetVisualRadius(planet);

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

        // Distribute moons evenly around planet
        const angle = (moonIndex / planet.moons.length) * Math.PI * 2;
        const moonLocalX = Math.cos(angle) * moonOrbitSceneUnits;
        const moonLocalZ = Math.sin(angle) * moonOrbitSceneUnits;

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

        moonLOD.object.position.set(moonLocalX, 0, moonLocalZ);

        planetSystemGroup.add(moonLOD.object);

        // Register moon LOD for Phase 3 live editing
        this.materialRegistry.set(moon.id, moonLOD as any); // Store LOD object, not material
        console.log(`[ThreeSceneManager] Registered moon LOD: ${moon.id}`);
      });

      // Add the complete planet system to scene
      this.scene.add(planetSystemGroup);

      console.log(
        `[ThreeSceneManager] Added planet ${planetIndex + 1}/${system.star.planets.length}: ` +
        `${planet.name} with ${planet.moons.length} moons (LOD enabled)`
      );
    });

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
    // Find the outermost planet
    let maxOrbitDistance = 0;
    system.star.planets.forEach((planet) => {
      if (planet.orbitDistance > maxOrbitDistance) {
        maxOrbitDistance = planet.orbitDistance;
      }
    });

    // Position camera to view the whole system
    const systemRadius = maxOrbitDistance * orbitScale;
    const cameraDistance = systemRadius * 2.5; // View from a comfortable distance

    const targetPosition = new THREE.Vector3(
      cameraDistance * 0.5,
      cameraDistance * 0.5,
      cameraDistance
    );
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    // Animate camera to new position (1.2s duration)
    this.animateCamera(targetPosition, targetLookAt, 1.2);

    console.log(
      `[ThreeSceneManager] Camera focusing on system (radius: ${systemRadius.toFixed(2)} units)`
    );
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
      console.log(`[ThreeSceneManager] Added ${markers.length} star system markers to Layer 0`);
      console.log(`[ThreeSceneManager] Scale factors: XZ=${scaleXZ.toFixed(3)} (${proceduralRadius.toFixed(1)} LY → ${visualSize} units), Y=${scaleY.toFixed(3)} (${proceduralThickness.toFixed(1)} LY → ${visualThickness} units)`);
      console.log(`[ThreeSceneManager] Sample marker positions (scaled):`, markers.slice(0, 3).map(m => ({
        x: m.position.x.toFixed(2),
        y: m.position.y.toFixed(2),
        z: m.position.z.toFixed(2)
      })));
    }

    // Switch to galaxy view mode
    this.currentViewMode = 'galaxy';

    // Position camera to view entire galaxy
    this.focusOnGalaxy(galaxy, wasInSystemView);

    console.log('[ThreeSceneManager] Galaxy view activated (multi-layer rendering)');
  }

  /**
   * Update galaxy particle system configuration
   * Phase 2.5: This method is DEPRECATED - use galaxy-store actions instead
   * Multi-layer system automatically updates via store subscription
   * @param config - Partial galaxy config to apply
   */
  public updateGalaxyConfig(_config: Partial<GalaxyConfig>): void {
    console.log('[ThreeSceneManager] DEPRECATED: updateGalaxyConfig called (use galaxy-store instead)');
    // Legacy method - multi-layer system uses store-based updates now
    // This is kept for backward compatibility but does nothing
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
   * Subscribe to marker store changes
   * Watches for marker position, config, and visibility updates
   */
  private subscribeToMarkerStore(): void {
    this.markerStoreUnsubscribe = useGalaxyStore.subscribe(
      (state) => {
        // Update markers when positions or visibility changes
        this.handleMarkerUpdate(
          state.markerPositions,
          state.markers,
          state.markersVisible
        );
      }
    );
  }

  /**
   * Handle marker updates from store
   * Recreates marker Points when positions, config, or visibility changes
   */
  private handleMarkerUpdate(
    positions: THREE.Vector3[],
    config: any,
    visible: boolean
  ): void {
    // Clear existing markers
    if (this.markerPoints) {
      this.markerGroup.remove(this.markerPoints);
      this.markerPoints.geometry.dispose();
      if (this.markerMaterial) {
        this.markerMaterial.dispose();
      }
      this.markerPoints = null;
      this.markerMaterial = null;
    }

    // If no positions, we're done
    if (positions.length === 0) {
      return;
    }

    // Create new markers
    this.createMarkerPoints(positions, config);

    // Set visibility
    if (this.markerPoints) {
      this.markerPoints.visible = visible;
    }
  }

  /**
   * Create THREE.Points for markers with shader material
   * Matches demo implementation with pulsing effect
   */
  private createMarkerPoints(
    positions: THREE.Vector3[],
    config: any
  ): void {
    const positionsArray: number[] = [];
    const colorsArray: number[] = [];
    const sizesArray: number[] = [];

    const markerColor = new THREE.Color(config.color || '#fff3b3');

    positions.forEach((pos) => {
      positionsArray.push(pos.x, pos.y, pos.z);
      colorsArray.push(markerColor.r, markerColor.g, markerColor.b);
      sizesArray.push(config.size || 4.0);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsArray, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizesArray, 1));

    // Marker shader material - matches demo with pulsing effect
    this.markerMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pulseFrequency: { value: config.pulseFrequency || 2.0 }
      },
      vertexShader: `
        uniform float time;
        uniform float pulseFrequency;
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Pulsing effect with configurable frequency
          // When pulseFrequency = 0, pulse = 1.0 (no pulsing)
          float pulse = 1.0 + sin(time * pulseFrequency) * 0.2;
          gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          // Sharp core with glow
          float core = 1.0 - smoothstep(0.0, 0.2, dist);
          float glow = smoothstep(0.5, 0.0, dist);
          float alpha = core + glow * 0.5;

          gl_FragColor = vec4(vColor * 1.3, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.markerPoints = new THREE.Points(geometry, this.markerMaterial);
    this.markerPoints.name = 'systemMarkers';

    // Apply the same tilt as galaxy particles (-36 degrees on X-axis)
    // This ensures markers rotate with the galaxy
    this.markerPoints.rotation.x = -Math.PI / 5;

    this.markerGroup.add(this.markerPoints);

    console.log(`[ThreeSceneManager] Created ${positions.length} marker points`);
  }

  /**
   * Generate random markers for the active galaxy layer
   * Adds procedurally positioned markers based on galaxy structure
   */
  public generateMarkersForActiveLayer(): void {
    console.log('[ThreeSceneManager] generateMarkersForActiveLayer() called');
    const galaxyStore = useGalaxyStore.getState();
    const { activeLayerId, markers, layers } = galaxyStore;

    console.log('[ThreeSceneManager] Active layer ID:', activeLayerId, 'Marker count requested:', markers.count);

    // Verify galaxy layers are initialized
    const activeGalaxy = this.galaxyLayers[activeLayerId];
    if (!activeGalaxy) {
      console.warn('[ThreeSceneManager] Cannot generate markers - galaxy layers not initialized');
      console.warn('[ThreeSceneManager] Available galaxy layers:', Object.keys(this.galaxyLayers));
      return;
    }

    // Get galaxy configuration from active layer
    const activeLayer = layers[activeLayerId];
    const galaxyConfig = activeLayer.config;

    // Create a new RNG for this generation
    const seed = Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);

    // Determine galaxy type and params from config
    const galaxyType = galaxyConfig.type;
    const params: any = {};

    if (galaxyType === 'spiral') {
      params.spiralParams = {
        armCount: galaxyConfig.armCount || 3,
        armTightness: galaxyConfig.spiralTightness || 0.6,
        armWidth: 15,
        diskRadius: galaxyConfig.size || 100,
        diskThickness: galaxyConfig.diskThickness || 10,
        bulgeRadius: galaxyConfig.size ? galaxyConfig.size * 0.2 : 20,
        rotationSpeed: 0.0001,
      };
    } else if (galaxyType === 'elliptical') {
      params.ellipticalParams = {
        majorAxis: galaxyConfig.size ? galaxyConfig.size * 1.2 : 120,
        minorAxis: galaxyConfig.size ? galaxyConfig.size * 0.8 : 80,
        eccentricity: galaxyConfig.ellipticalFlatten || 0.6,
        coreRadius: galaxyConfig.size ? galaxyConfig.size * 0.25 : 30,
      };
    } else if (galaxyType === 'irregular') {
      params.irregularParams = {
        boundingRadius: galaxyConfig.size || 100,
        clusterCount: 5,
        dispersalFactor: galaxyConfig.irregularChaos || 0.4,
      };
    }

    // Generate star systems with positions
    const systemPlacements = generateGalaxySystems(
      markers.count,
      galaxyType,
      params,
      25, // minDistance in light-years
      rng
    );

    if (systemPlacements.length === 0) {
      console.log('[ThreeSceneManager] No systems generated');
      return;
    }

    // Convert to SystemMarker objects with actual star system data
    const markerColor = new THREE.Color(markers.color || '#fff3b3');
    const systemMarkers = systemPlacements.map(placement => ({
      position: new THREE.Vector3(placement.position.x, placement.position.y, placement.position.z),
      color: markerColor,
      size: markers.size || 5.0,
      data: placement.system // Actual star system data
    }));

    // Add markers to galaxy layer (replaces existing markers)
    activeGalaxy.addSystemMarkers(systemMarkers);

    console.log(`[ThreeSceneManager] Generated ${systemMarkers.length} star systems with markers for galaxy layer`);
  }

  /**
   * Clear all galaxy layer markers
   */
  public clearMarkers(): void {
    console.log('[ThreeSceneManager] clearMarkers() called');

    // Clear markers from galaxy layer
    if (this.galaxyLayers[0]) {
      this.galaxyLayers[0].addSystemMarkers([]); // Pass empty array to clear
      console.log('[ThreeSceneManager] Galaxy layer markers cleared');
    } else {
      console.warn('[ThreeSceneManager] No galaxy layer to clear markers from');
    }
  }

  /**
   * Toggle galaxy layer marker visibility
   */
  public toggleMarkersVisibility(): void {
    console.log('[ThreeSceneManager] toggleMarkersVisibility() called');

    if (this.galaxyLayers[0]) {
      const galaxyGroup = this.galaxyLayers[0].getGroup();
      const markerPoints = galaxyGroup.getObjectByName('systemMarkers');

      if (markerPoints) {
        markerPoints.visible = !markerPoints.visible;
        console.log('[ThreeSceneManager] Galaxy layer markers visibility toggled to:', markerPoints.visible);
      } else {
        console.warn('[ThreeSceneManager] No galaxy layer markers found to toggle');
      }
    } else {
      console.warn('[ThreeSceneManager] No galaxy layer to toggle markers on');
    }
  }

  /**
   * Dispose independent marker system
   * Called during cleanup
   */
  private disposeMarkers(): void {
    // Unsubscribe from store
    if (this.markerStoreUnsubscribe) {
      this.markerStoreUnsubscribe();
      this.markerStoreUnsubscribe = null;
    }

    // Clean up marker Points
    if (this.markerPoints) {
      this.markerGroup.remove(this.markerPoints);
      this.markerPoints.geometry.dispose();
      if (this.markerMaterial) {
        this.markerMaterial.dispose();
      }
      this.markerPoints = null;
      this.markerMaterial = null;
    }

    // Remove marker group from scene
    this.scene.remove(this.markerGroup);

    console.log('[ThreeSceneManager] Independent marker system disposed');
  }

  /**
   * Adjust camera to view the entire galaxy
   * @param galaxy - Galaxy to focus on
   * @param returningFromSystemView - True if returning from system view (reposition without animation)
   */
  private focusOnGalaxy(galaxy: Galaxy, returningFromSystemView: boolean = false): void {
    // Determine galaxy bounding radius based on type
    let galaxyRadius = 100; // Default

    if (galaxy.spiralParams) {
      galaxyRadius = galaxy.spiralParams.diskRadius;
    } else if (galaxy.ellipticalParams) {
      galaxyRadius = galaxy.ellipticalParams.majorAxis;
    } else if (galaxy.irregularParams) {
      galaxyRadius = galaxy.irregularParams.boundingRadius;
    }

    // Rest position (after animation, and when returning from system view)
    const targetPosition = new THREE.Vector3(13.26, 81.14, 56.30);
    const targetLookAt = new THREE.Vector3(2.31, 0.00, 6.86);

    // Update controls limits for galaxy scale
    this.controls.minDistance = galaxyRadius * 0.1;
    this.controls.maxDistance = galaxyRadius * 5;

    // Determine what to do based on current state
    if (this.hasAnimatedToGalaxyView && !returningFromSystemView) {
      // Already animated once AND we're not returning from system view
      // This is a regeneration - keep camera where it is
      console.log('[ThreeSceneManager] Regeneration detected - camera stays in place');
      return;
    }

    if (returningFromSystemView && this.hasAnimatedToGalaxyView) {
      // Returning from system view - animate from close-up to rest position
      console.log('[ThreeSceneManager] Returning from system view - animating camera pull-back to rest position');

      const returnStartPosition = new THREE.Vector3(3.58, 9.41, 12.59);
      const returnStartLookAt = new THREE.Vector3(2.31, 0.00, 6.86);

      // Set camera to close-up starting position
      this.camera.position.copy(returnStartPosition);
      this.controls.target.copy(returnStartLookAt);
      this.controls.update();

      // Animate pull-back to rest position (0.8s duration for smooth transition)
      this.animateCamera(targetPosition, targetLookAt, 0.8);
      return;
    }

    // First generation: Start camera farther back and fly IN dramatically
    const startPosition = new THREE.Vector3(65.23, 286.34, 311.32);
    const startLookAt = new THREE.Vector3(0.00, 0.00, 0.00);

    // Set camera to distant starting position
    this.camera.position.copy(startPosition);
    this.controls.target.copy(startLookAt);
    this.controls.update();

    // Animate camera flying INTO the galaxy view (quick and dramatic: 1.0s)
    this.animateCamera(targetPosition, targetLookAt, 1.0);

    // Mark that we've done the initial animation
    this.hasAnimatedToGalaxyView = true;

    console.log(
      `[ThreeSceneManager] Camera flying into galaxy (radius: ${galaxyRadius.toFixed(2)} light-years)`
    );
  }

  /**
   * Switch back from galaxy view to system view
   */
  public switchToSystemView(): void {
    console.log('[ThreeSceneManager] Switching to system view');

    // Clear galaxy rendering
    const galaxyGroup = this.scene.getObjectByName('GalaxyGroup');
    if (galaxyGroup) {
      this.scene.remove(galaxyGroup);
    }
    this.galaxyRenderer.clear();

    // Reset camera controls for system scale
    this.controls.minDistance = 5;
    this.controls.maxDistance = 5000;

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
      this.disposeObjectRecursive(object);
    });

    // Clear material registry (Phase 3)
    this.materialRegistry.clear();

    console.log('[ThreeSceneManager] System objects cleared');
  }

  /**
   * Recursively dispose of object and all its children
   */
  private disposeObjectRecursive(object: THREE.Object3D): void {
    // Dispose children first
    object.children.forEach((child) => {
      this.disposeObjectRecursive(child);
    });

    // Then dispose this object
    this.disposeObject(object);
  }

  /**
   * Dispose of Three.js object (prevent memory leaks)
   */
  private disposeObject(object: THREE.Object3D): void {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    }
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
  public updateObjectUniforms(objectId: string, uniformName: string, value: any): void {
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
    this.renderer.domElement.removeEventListener('click', this.handleClick);

    // Dispose controls
    this.controls.dispose();

    // Dispose galaxy renderer (Phase 2)
    this.galaxyRenderer.dispose();

    // Dispose multi-layer galaxy system (Phase 2.5)
    this.disposeGalaxyLayers();

    // Dispose independent marker system
    this.disposeMarkers();

    // Clear scene
    this.clearSystemObjects();

    // Dispose starfield
    const starfield = this.scene.getObjectByName('starfield');
    if (starfield) {
      this.disposeObject(starfield);
    }

    // Dispose renderer
    this.renderer.dispose();

    // Remove canvas from DOM
    this.container.removeChild(this.renderer.domElement);

    console.log('[ThreeSceneManager] Disposed successfully');
  }
}
