import * as THREE from 'three';
import { generateSystem } from '../../generation/system-generator';
import { GalaxyParticleSystem } from '../../rendering/GalaxyParticleSystem';
import { useGalaxyStore, type MarkerConfig, generateMarkerPositions } from '../../store/galaxy-store';
import { useSystemStore } from '../../store/system-store';
import { SeededRandom } from '../../utils/random';

interface MarkerSystemManagerDeps {
  scene: THREE.Scene;
  getActiveGalaxyLayer: () => GalaxyParticleSystem | null;
  getGalaxyLayers: () => (GalaxyParticleSystem | null)[];
  setCustomMarkersSet: (value: boolean) => void;
}

export class MarkerSystemManager {
  private readonly scene: THREE.Scene;
  private readonly getActiveGalaxyLayer: () => GalaxyParticleSystem | null;
  private readonly getGalaxyLayers: () => (GalaxyParticleSystem | null)[];
  private readonly setCustomMarkersSet: (value: boolean) => void;

  private readonly markerGroup: THREE.Group;
  private markerPoints: THREE.Points | null = null;
  private markerMaterial: THREE.ShaderMaterial | null = null;
  private markerStoreUnsubscribe: (() => void) | null = null;

  constructor(deps: MarkerSystemManagerDeps) {
    this.scene = deps.scene;
    this.getActiveGalaxyLayer = deps.getActiveGalaxyLayer;
    this.getGalaxyLayers = deps.getGalaxyLayers;
    this.setCustomMarkersSet = deps.setCustomMarkersSet;

    this.markerGroup = new THREE.Group();
    this.markerGroup.name = 'independentMarkers';
    this.scene.add(this.markerGroup);

    this.subscribeToMarkerStore();
  }

  public getMarkerPoints(): THREE.Points | null {
    return this.markerPoints;
  }

  public updateFrame(time: number, currentViewMode: 'system' | 'galaxy'): void {
    if (currentViewMode !== 'galaxy') {
      return;
    }

    const activeGalaxy = this.getActiveGalaxyLayer();
    if (!activeGalaxy || !this.markerPoints) {
      return;
    }

    const galaxyGroup = activeGalaxy.getGroup();
    this.markerGroup.rotation.copy(galaxyGroup.rotation);

    if (this.markerMaterial?.uniforms.time) {
      this.markerMaterial.uniforms.time.value = time;
    }
  }

  public generateMarkersForActiveLayer(): void {
    console.log('═══════════════════════════════════════');
    console.log('[MarkerSystemManager] generateMarkersForActiveLayer() called');

    try {
      const galaxyStore = useGalaxyStore.getState();
      const { activeLayerId, markers, layers } = galaxyStore;

      console.log('[MarkerSystemManager] Active layer ID:', activeLayerId, 'Marker count requested:', markers.count);
      console.log('[MarkerSystemManager] Galaxy layers:', this.getGalaxyLayers());

      const activeGalaxy = this.getActiveGalaxyLayer();
      if (!activeGalaxy) {
        console.error('[MarkerSystemManager] ❌ Cannot generate markers - galaxy layers not initialized');
        console.error('[MarkerSystemManager] Available galaxy layers:', Object.keys(this.getGalaxyLayers()));
        return;
      }

      console.log('[MarkerSystemManager] ✓ Active galaxy found:', activeGalaxy);

      const systemStore = useSystemStore.getState();
      const proceduralGalaxy = systemStore.currentGalaxy;

      if (!proceduralGalaxy) {
        console.error('[MarkerSystemManager] ❌ No procedural galaxy available in system store');
        return;
      }

      console.log('[MarkerSystemManager] Using procedural galaxy:', proceduralGalaxy.name);
      console.log('[MarkerSystemManager] Procedural galaxy type:', proceduralGalaxy.type);

      const activeLayer = layers[activeLayerId];
      const visualConfig = activeLayer.config;

      console.log('[MarkerSystemManager] Active visual layer type:', visualConfig.type);
      console.log('[MarkerSystemManager] Generating', markers.count, 'markers using active visual layer config');

      const seed = Math.floor(Math.random() * 1000000);
      const rng = new SeededRandom(seed);
      console.log('[MarkerSystemManager] Using seed:', seed);

      const positions = generateMarkerPositions(markers.count, visualConfig);
      const systemPlacements: any[] = [];

      positions.forEach((position) => {
        const systemSeed = Math.floor(rng.random() * 1000000);
        const system = generateSystem(systemSeed);

        systemPlacements.push({
          system,
          position: {
            x: position.x,
            y: position.y,
            z: position.z
          },
          region: 'disk'
        });
      });

      console.log('[MarkerSystemManager] Generated', systemPlacements.length, 'systems with visual-matched positions');

      if (systemPlacements.length === 0) {
        console.warn('[MarkerSystemManager] ⚠️ No systems generated');
        return;
      }

      console.log('[MarkerSystemManager] Creating markers from visual positions (no scaling needed)');

      const markerColor = new THREE.Color(markers.color || '#fff3b3');
      const systemMarkers = systemPlacements.map((placement) => ({
        position: new THREE.Vector3(
          placement.position.x,
          placement.position.y,
          placement.position.z
        ),
        color: markerColor,
        size: markers.size || 5.0,
        data: placement.system
      }));

      console.log('[MarkerSystemManager] Adding markers to galaxy layer...');
      activeGalaxy.addSystemMarkers(systemMarkers, markers.pulseFrequency || 1.0);

      if (proceduralGalaxy) {
        if (proceduralGalaxy.originalSystemCount === undefined) {
          proceduralGalaxy.originalSystemCount = proceduralGalaxy.systems.length;
        }

        proceduralGalaxy.systems.push(...systemPlacements);
        proceduralGalaxy.systemCount = proceduralGalaxy.systems.length;

        console.log(`[MarkerSystemManager] Added ${systemPlacements.length} systems to galaxy (original: ${proceduralGalaxy.originalSystemCount}, total: ${proceduralGalaxy.systemCount})`);
      }

      this.setCustomMarkersSet(true);

      console.log(`[MarkerSystemManager] ✅ Generated ${systemMarkers.length} star systems with markers for galaxy layer`);
      console.log('═══════════════════════════════════════');
    } catch (error) {
      console.error('[MarkerSystemManager] ❌ Error generating markers:', error);
      console.error('[MarkerSystemManager] Stack trace:', (error as Error).stack);
      console.log('═══════════════════════════════════════');
    }
  }

  public clearMarkers(): void {
    console.log('[MarkerSystemManager] clearMarkers() called');

    const primaryGalaxyLayer = this.getGalaxyLayers()[0];
    if (primaryGalaxyLayer) {
      primaryGalaxyLayer.addSystemMarkers([]);
      this.setCustomMarkersSet(false);
      console.log('[MarkerSystemManager] Galaxy layer markers cleared');
    } else {
      console.warn('[MarkerSystemManager] No galaxy layer to clear markers from');
    }

    const systemStore = useSystemStore.getState();
    const currentGalaxy = systemStore.currentGalaxy;

    if (currentGalaxy && currentGalaxy.originalSystemCount !== undefined) {
      const removedCount = currentGalaxy.systems.length - currentGalaxy.originalSystemCount;
      currentGalaxy.systems = currentGalaxy.systems.slice(0, currentGalaxy.originalSystemCount);
      currentGalaxy.systemCount = currentGalaxy.systems.length;

      console.log(`[MarkerSystemManager] Removed ${removedCount} custom systems, back to ${currentGalaxy.systemCount} original systems`);
    }
  }

  public toggleMarkersVisibility(): void {
    console.log('[MarkerSystemManager] toggleMarkersVisibility() called');

    const primaryGalaxyLayer = this.getGalaxyLayers()[0];
    if (primaryGalaxyLayer) {
      const galaxyGroup = primaryGalaxyLayer.getGroup();
      const markerPoints = galaxyGroup.getObjectByName('systemMarkers');

      if (markerPoints) {
        markerPoints.visible = !markerPoints.visible;
        console.log('[MarkerSystemManager] Galaxy layer markers visibility toggled to:', markerPoints.visible);
      } else {
        console.warn('[MarkerSystemManager] No galaxy layer markers found to toggle');
      }
    } else {
      console.warn('[MarkerSystemManager] No galaxy layer to toggle markers on');
    }
  }

  public dispose(): void {
    if (this.markerStoreUnsubscribe) {
      this.markerStoreUnsubscribe();
      this.markerStoreUnsubscribe = null;
    }

    this.clearIndependentMarkers();
    this.scene.remove(this.markerGroup);

    console.log('[MarkerSystemManager] Independent marker system disposed');
  }

  private subscribeToMarkerStore(): void {
    this.markerStoreUnsubscribe = useGalaxyStore.subscribe((state) => {
      this.handleMarkerUpdate(
        state.markerPositions,
        state.markers,
        state.markersVisible
      );
      this.syncGalaxyLayerMarkerPresentation(state.markers.pulseFrequency);
    });
  }

  private handleMarkerUpdate(
    positions: THREE.Vector3[],
    config: MarkerConfig,
    visible: boolean
  ): void {
    this.clearIndependentMarkers();

    if (positions.length === 0) {
      return;
    }

    const markerPoints = this.createMarkerPoints(positions, config);
    markerPoints.visible = visible;
  }

  private clearIndependentMarkers(): void {
    if (!this.markerPoints) {
      return;
    }

    this.markerGroup.remove(this.markerPoints);
    this.markerPoints.geometry.dispose();
    this.markerMaterial?.dispose();
    this.markerPoints = null;
    this.markerMaterial = null;
  }

  private syncGalaxyLayerMarkerPresentation(pulseFrequency: number): void {
    const activeGalaxy = this.getActiveGalaxyLayer();
    if (!activeGalaxy) {
      return;
    }

    activeGalaxy.updateSystemMarkerPulseFrequency(pulseFrequency);
  }

  private createMarkerPoints(
    positions: THREE.Vector3[],
    config: MarkerConfig
  ): THREE.Points {
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

    this.markerMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pulseFrequency: { value: config.pulseFrequency || 1.0 }
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

          float pulse = 1.0 + sin(time * pulseFrequency * 2.0) * 0.2;
          gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

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
    this.markerPoints.rotation.x = -Math.PI / 5;
    this.markerGroup.add(this.markerPoints);

    console.log(`[MarkerSystemManager] Created ${positions.length} marker points`);

    return this.markerPoints;
  }
}
