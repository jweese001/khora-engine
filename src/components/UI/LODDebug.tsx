/**
 * LOD Debug Overlay
 *
 * Displays real-time LOD information for the closest celestial body.
 * Shows current detail level, distance, and triangle count.
 */

import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSystemStore } from '../../store/system-store';

interface LODInfo {
  name: string;
  type: string;
  level: number;
  levelName: string;
  distance: number;
  triangles: number;
  totalLODObjects: number;
}

export function LODDebug() {
  const [lodInfo, setLodInfo] = useState<LODInfo | null>(null);
  const [visible, setVisible] = useState(true);
  const scene = useSystemStore((state) => state.scene);

  useEffect(() => {
    if (!scene) return;

    // Find camera (stored in scene.userData by ThreeSceneManager)
    const camera = scene.userData.camera as THREE.Camera;
    if (!camera) return;

    // Update LOD info every frame
    let animationId: number;

    const updateLODInfo = () => {
      // Find all LOD objects
      const lodObjects: Array<{
        lod: THREE.LOD;
        distance: number;
        name: string;
        type: string;
      }> = [];

      scene.traverse((object) => {
        if (object instanceof THREE.LOD && object.userData.lodEnabled) {
          const distance = camera.position.distanceTo(object.position);
          lodObjects.push({
            lod: object,
            distance,
            name: object.name,
            type: object.userData.type || 'unknown'
          });
        }
      });

      if (lodObjects.length === 0) {
        setLodInfo(null);
        animationId = requestAnimationFrame(updateLODInfo);
        return;
      }

      // Find closest LOD object
      lodObjects.sort((a, b) => a.distance - b.distance);
      const closest = lodObjects[0];

      // Determine current LOD level
      const lod = closest.lod;
      const distance = closest.distance;

      let currentLevel = 0;
      let currentLevelName = 'high';

      // Check which level is active
      for (let i = 0; i < lod.levels.length; i++) {
        const nextLevel = lod.levels[i + 1];

        if (!nextLevel || distance < nextLevel.distance) {
          currentLevel = i;
          // Determine level name based on index
          currentLevelName = i === 0 ? 'high' : i === 1 ? 'medium' : 'low';
          break;
        }
      }

      // Get triangle count for current level
      const currentMesh = lod.levels[currentLevel].object as THREE.Mesh;
      const geometry = currentMesh.geometry as THREE.BufferGeometry;
      const triangles = geometry.index
        ? geometry.index.count / 3
        : geometry.attributes.position.count / 3;

      setLodInfo({
        name: closest.name,
        type: closest.type,
        level: currentLevel,
        levelName: currentLevelName,
        distance: Math.round(distance * 10) / 10,
        triangles: Math.floor(triangles),
        totalLODObjects: lodObjects.length
      });

      animationId = requestAnimationFrame(updateLODInfo);
    };

    updateLODInfo();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [scene]);

  // Keyboard toggle (press 'L' to toggle)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        setVisible((v) => !v);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  if (!visible || !lodInfo) return null;

  // Color-code by LOD level
  const levelColors = {
    high: '#00ff00',    // Green
    medium: '#ffaa00',  // Orange
    low: '#ff0000'      // Red
  };

  const levelColor = levelColors[lodInfo.levelName as keyof typeof levelColors] || '#ffffff';

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '20px',
        background: 'rgba(15, 20, 25, 0.95)',
        border: `2px solid ${levelColor}`,
        borderRadius: '8px',
        padding: '16px',
        color: '#e0e6ed',
        fontFamily: 'Monaco, Consolas, monospace',
        fontSize: '13px',
        lineHeight: '1.6',
        minWidth: '280px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        userSelect: 'none'
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '12px',
          fontSize: '14px',
          color: levelColor,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          borderBottom: `1px solid ${levelColor}`,
          paddingBottom: '8px'
        }}
      >
        LOD Debug (Press L to toggle)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <span style={{ color: '#8a9ba8', marginRight: '8px' }}>Object:</span>
          <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{lodInfo.name}</span>
          <span style={{ color: '#6b7c8a', marginLeft: '8px' }}>({lodInfo.type})</span>
        </div>

        <div>
          <span style={{ color: '#8a9ba8', marginRight: '8px' }}>Distance:</span>
          <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{lodInfo.distance}</span>
          <span style={{ color: '#6b7c8a', marginLeft: '4px' }}>units</span>
        </div>

        <div>
          <span style={{ color: '#8a9ba8', marginRight: '8px' }}>LOD Level:</span>
          <span
            style={{
              color: levelColor,
              fontWeight: 'bold',
              fontSize: '15px',
              textTransform: 'uppercase'
            }}
          >
            {lodInfo.level} - {lodInfo.levelName}
          </span>
        </div>

        <div>
          <span style={{ color: '#8a9ba8', marginRight: '8px' }}>Triangles:</span>
          <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
            {lodInfo.triangles.toLocaleString()}
          </span>
        </div>

        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2a3a4a' }}>
          <span style={{ color: '#6b7c8a', fontSize: '11px' }}>
            {lodInfo.totalLODObjects} LOD objects in scene
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #2a3a4a',
          fontSize: '11px',
          color: '#6b7c8a'
        }}
      >
        <div>High: 0-75 units (82k tri)</div>
        <div>Medium: 75-250 units (5k tri)</div>
        <div>Low: 250+ units (320 tri)</div>
      </div>
    </div>
  );
}
