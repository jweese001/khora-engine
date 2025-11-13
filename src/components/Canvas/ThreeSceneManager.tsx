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
import type { Galaxy } from '../../types/galaxy';
import { createStarMesh, createStarLight, calculateSceneUnitsPerSolarRadius } from '../../rendering/StarRenderer';
import { createTypedOrbitLine } from '../../rendering/OrbitRenderer';
import { CelestialBodyLOD } from '../../rendering/CelestialBodyLOD';
import { GalaxyRenderer } from '../../rendering/GalaxyRenderer';

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

  // Material tracking (Phase 3: Architect Mode)
  // Maps object ID -> THREE.Material for live uniform updates
  private materialRegistry: Map<string, THREE.Material> = new Map();

  // Debug mode (toggle with D key)
  private debugMode: number = 0; // 0=normal, 1-7=debug visualizations

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
    // VERY LOW threshold + moderate strength
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.9,  // strength - moderate
      0.7,  // radius
      0.5   // threshold - VERY LOW (even dim areas will glow slightly)
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

    // In galaxy view, raycast against galaxy system markers
    if (this.currentViewMode === 'galaxy') {
      const systemObjects = this.galaxyRenderer.getSystemObjects();
      const intersects = this.raycaster.intersectObjects(systemObjects, false);

      if (intersects.length > 0 && this.onObjectSelected) {
        const selectedObject = intersects[0].object;
        console.log('[ThreeSceneManager] Galaxy system selected:', selectedObject.userData);
        this.onObjectSelected(selectedObject.userData);
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
   * Handle keyboard input for debug controls
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
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

    // Update shader uniforms for all celestial bodies
    // CRITICAL: Camera position must be updated every frame for correct lighting and atmosphere
    const time = performance.now() * 0.001; // Convert to seconds
    this.scene.traverse((object) => {
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
    });

    // Render scene with post-processing (bloom)
    this.composer.render();
  };

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

    this.camera.position.set(cameraDistance * 0.5, cameraDistance * 0.5, cameraDistance);
    this.camera.lookAt(0, 0, 0);

    // Update controls target
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    console.log(
      `[ThreeSceneManager] Camera focused on system (radius: ${systemRadius.toFixed(2)} units)`
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

    // Clear existing system objects (keep starfield)
    this.clearSystemObjects();

    // Clear previous galaxy rendering
    const previousGalaxyGroup = this.scene.getObjectByName('GalaxyGroup');
    if (previousGalaxyGroup) {
      this.scene.remove(previousGalaxyGroup);
    }

    // Render galaxy
    this.galaxyRenderer.renderGalaxy(galaxy);

    // Add galaxy group to scene
    const galaxyGroup = this.galaxyRenderer.getGroup();
    this.scene.add(galaxyGroup);

    // Switch to galaxy view mode
    this.currentViewMode = 'galaxy';

    // Position camera to view entire galaxy
    this.focusOnGalaxy(galaxy);

    console.log('[ThreeSceneManager] Galaxy rendered successfully');
  }

  /**
   * Adjust camera to view the entire galaxy
   * @param galaxy - Galaxy to focus on
   */
  private focusOnGalaxy(galaxy: Galaxy): void {
    // Determine galaxy bounding radius based on type
    let galaxyRadius = 100; // Default

    if (galaxy.spiralParams) {
      galaxyRadius = galaxy.spiralParams.diskRadius;
    } else if (galaxy.ellipticalParams) {
      galaxyRadius = galaxy.ellipticalParams.majorAxis;
    } else if (galaxy.irregularParams) {
      galaxyRadius = galaxy.irregularParams.boundingRadius;
    }

    // Position camera to view the whole galaxy
    const cameraDistance = galaxyRadius * 2.5;

    this.camera.position.set(
      cameraDistance * 0.5,
      cameraDistance * 0.8, // Higher angle for better overview
      cameraDistance
    );
    this.camera.lookAt(0, 0, 0);

    // Update controls target and limits for galaxy scale
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = galaxyRadius * 0.1;
    this.controls.maxDistance = galaxyRadius * 5;
    this.controls.update();

    console.log(
      `[ThreeSceneManager] Camera focused on galaxy (radius: ${galaxyRadius.toFixed(2)} light-years)`
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
   * Clear all system objects from scene (keep starfield)
   */
  private clearSystemObjects(): void {
    const objectsToRemove: THREE.Object3D[] = [];

    // Only collect DIRECT children of scene (not nested objects like moons)
    this.scene.children.forEach((object) => {
      if (object.name !== 'starfield') {
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
