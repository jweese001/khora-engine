/**
 * Khora Engine - Canvas Container Component
 *
 * React wrapper for ThreeSceneManager.
 * Manages lifecycle: mount, update, unmount.
 */

import { useEffect, useRef } from 'react';
import { ThreeSceneManager } from './ThreeSceneManager';
import { useSystemStore } from '../../store/system-store';

export function CanvasContainer() {
  // Reference to container DOM element
  const containerRef = useRef<HTMLDivElement>(null);

  // Reference to ThreeSceneManager instance
  const sceneManagerRef = useRef<ThreeSceneManager | null>(null);

  // Get store state and actions
  const currentSystem = useSystemStore((state) => state.currentSystem);

  // Initialize ThreeSceneManager on mount
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[CanvasContainer] Initializing ThreeSceneManager');

    // Get store actions inside effect to avoid re-render issues
    const { setScene, setCamera, selectObject } = useSystemStore.getState();

    // Create scene manager
    sceneManagerRef.current = new ThreeSceneManager(
      containerRef.current,
      (userData) => {
        // Object selected callback
        if (userData) {
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

    // Cleanup on unmount
    return () => {
      console.log('[CanvasContainer] Disposing ThreeSceneManager');
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
      }
      setScene(null);
      setCamera(null);
    };
  }, []); // Only run once on mount

  // Update scene when currentSystem changes
  useEffect(() => {
    if (!sceneManagerRef.current) return;

    if (currentSystem) {
      console.log('[CanvasContainer] Rendering system:', currentSystem.name);
      sceneManagerRef.current.renderSystem(currentSystem);
    } else {
      console.log('[CanvasContainer] No system to render');
    }
  }, [currentSystem]);

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
