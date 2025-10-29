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
import type { StarSystem } from '../../types/celestial-bodies';

// ============================================================================
// ThreeSceneManager Class
// ============================================================================

export class ThreeSceneManager {
  // Three.js core objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
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

    // Create renderer
    this.renderer = this.createRenderer();

    // Create controls
    this.controls = this.createControls();

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
   */
  private addStarfield(): void {
    const starCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Random position in sphere
      const radius = Math.random() * 2000 + 1000;
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
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    const stars = new THREE.Points(geometry, material);
    stars.name = 'starfield';
    this.scene.add(stars);

    console.log('[ThreeSceneManager] Starfield added (5000 stars)');
  }

  // ==========================================================================
  // Event Handling
  // ==========================================================================

  /**
   * Set up event listeners for window resize and object selection
   */
  private setupEventListeners(): void {
    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Object selection (click)
    this.renderer.domElement.addEventListener('click', this.handleClick);
  }

  /**
   * Handle window resize - update camera and renderer
   */
  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Update camera
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(width, height);
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

    // Check for intersections (exclude starfield)
    const intersects = this.raycaster.intersectObjects(
      this.scene.children.filter((obj) => obj.name !== 'starfield'),
      true // Recursive
    );

    if (intersects.length > 0) {
      // Find the first object with userData
      let selectedObject = intersects[0].object;

      // Walk up the hierarchy to find object with userData
      while (selectedObject && !selectedObject.userData?.type) {
        selectedObject = selectedObject.parent as THREE.Object3D;
      }

      if (selectedObject?.userData?.type && this.onObjectSelected) {
        console.log('[ThreeSceneManager] Object selected:', selectedObject.userData);
        this.onObjectSelected(selectedObject.userData);
      }
    } else {
      // Clicked on empty space - deselect
      if (this.onObjectSelected) {
        this.onObjectSelected(null);
      }
    }
  };

  // ==========================================================================
  // Animation Loop
  // ==========================================================================

  /**
   * Main animation loop - updates controls and renders scene
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Update controls (damping requires update every frame)
    this.controls.update();

    // Update LOD levels (will be used in Week 6-7)
    this.scene.traverse((object) => {
      if (object instanceof THREE.LOD) {
        object.update(this.camera);
      }
    });

    // Render scene
    this.renderer.render(this.scene, this.camera);
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

    // Clear existing system objects
    this.clearSystemObjects();

    // TODO (Week 4-5): Implement actual system rendering
    // - Create star mesh (StarRenderer.createStarMesh)
    // - Create planet meshes (PlanetRenderer.createPlanetMesh)
    // - Create moon meshes (MoonRenderer.createMoonMesh)
    // - Create orbit lines (OrbitRenderer.createOrbit)
    // - Position objects with AU_TO_SCENE_UNITS scaling

    // Placeholder: Add a simple sphere to show system center
    const placeholderGeometry = new THREE.SphereGeometry(5, 32, 32);
    const placeholderMaterial = new THREE.MeshBasicMaterial({
      color: 0xff9900,
      wireframe: true
    });
    const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    placeholder.name = 'system-placeholder';
    this.scene.add(placeholder);

    console.log('[ThreeSceneManager] System rendered (placeholder)');
  }

  /**
   * Clear all system objects from scene (keep starfield)
   */
  private clearSystemObjects(): void {
    const objectsToRemove: THREE.Object3D[] = [];

    this.scene.traverse((object) => {
      if (object.name !== 'starfield' && object !== this.scene) {
        objectsToRemove.push(object);
      }
    });

    // Remove and dispose
    objectsToRemove.forEach((object) => {
      this.scene.remove(object);
      this.disposeObject(object);
    });

    console.log('[ThreeSceneManager] System objects cleared');
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
    this.renderer.domElement.removeEventListener('click', this.handleClick);

    // Dispose controls
    this.controls.dispose();

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
