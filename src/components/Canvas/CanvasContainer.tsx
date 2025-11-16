/**
 * Khora Engine - Canvas Container Component
 *
 * React wrapper for ThreeSceneManager.
 * Manages lifecycle: mount, update, unmount.
 */

import { useEffect, useRef } from 'react';
import { ThreeSceneManager } from './ThreeSceneManager';
import { useSystemStore } from '../../store/system-store';
import { useGalaxyStore } from '../../store/galaxy-store';

export function CanvasContainer() {
  // Reference to container DOM element
  const containerRef = useRef<HTMLDivElement>(null);

  // Reference to ThreeSceneManager instance
  const sceneManagerRef = useRef<ThreeSceneManager | null>(null);

  // Get store state and actions
  const currentSystem = useSystemStore((state) => state.currentSystem);
  const currentGalaxy = useSystemStore((state) => state.currentGalaxy);
  const viewMode = useSystemStore((state) => state.viewMode);
  const uniformOverrides = useSystemStore((state) => state.uniformOverrides);
  const galaxyConfig = useSystemStore((state) => state.galaxyConfig);

  // Initialize ThreeSceneManager on mount
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[CanvasContainer] Initializing ThreeSceneManager');

    // Get store actions inside effect to avoid re-render issues
    const { setScene, setCamera, selectObject, focusSystem } = useSystemStore.getState();

    // Create scene manager
    sceneManagerRef.current = new ThreeSceneManager(
      containerRef.current,
      (userData) => {
        // Object selected callback
        if (userData) {
          // Handle galaxy system selection
          if (userData.type === 'galaxy-system') {
            console.log('[CanvasContainer] Galaxy system selected, focusing on system:', userData.systemIndex);
            focusSystem(userData.systemIndex);
            return;
          }

          // Handle regular object selection (planets, moons, stars)
          selectObject({
            type: userData.type,
            data: userData.data,
            material: userData.material
          });
        } else {
          selectObject(null);
        }
      }
    );

    // Store scene and camera references in Zustand
    setScene(sceneManagerRef.current.getScene());
    setCamera(sceneManagerRef.current.getCamera());

    // Store scene manager reference in galaxy store (for marker controls)
    const { setSceneManagerRef } = useGalaxyStore.getState();
    setSceneManagerRef(sceneManagerRef.current);

    // Cleanup on unmount
    return () => {
      console.log('[CanvasContainer] Disposing ThreeSceneManager');
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
      }
      setScene(null);
      setCamera(null);

      // Clear scene manager reference in galaxy store
      const { setSceneManagerRef } = useGalaxyStore.getState();
      setSceneManagerRef(null);
    };
  }, []); // Only run once on mount

  // Update scene when currentSystem changes
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    if (viewMode !== 'system') return; // Only render in system view mode

    if (currentSystem) {
      console.log('[CanvasContainer] Rendering system:', currentSystem.name);
      // Switch to system view (removes galaxy objects)
      sceneManagerRef.current.switchToSystemView();
      // Then render the system
      sceneManagerRef.current.renderSystem(currentSystem);
    } else {
      console.log('[CanvasContainer] No system to render');
    }
  }, [currentSystem, viewMode]);

  // Update scene when currentGalaxy changes (Phase 2)
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    if (viewMode !== 'galaxy') return; // Only render in galaxy view mode

    if (currentGalaxy) {
      console.log('[CanvasContainer] Rendering galaxy:', currentGalaxy.name);
      sceneManagerRef.current.renderGalaxy(currentGalaxy);
    } else {
      console.log('[CanvasContainer] No galaxy to render');
    }
  }, [currentGalaxy, viewMode]);

  // Apply uniform overrides to scene (Phase 3: Architect Mode)
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    if (uniformOverrides.size === 0) return;

    console.log('[CanvasContainer] Applying uniform overrides:', uniformOverrides.size, 'objects');

    // Iterate through all objects with overrides
    uniformOverrides.forEach((overrides, objectId) => {
      // Apply each uniform override for this object
      Object.entries(overrides).forEach(([uniformName, value]) => {
        sceneManagerRef.current?.updateObjectUniforms(objectId, uniformName, value);
      });
    });
  }, [uniformOverrides]);

  // Apply galaxy config changes to particle system (Phase 2: Galaxy customization)
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    if (viewMode !== 'galaxy') return;
    if (!galaxyConfig) return;

    console.log('[CanvasContainer] Applying galaxy config changes:', galaxyConfig);
    sceneManagerRef.current.updateGalaxyConfig(galaxyConfig);
  }, [galaxyConfig, viewMode]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000510'
      }}
    />
  );
}
