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

export function LODDebugPanel() {
  const [lodInfo, setLodInfo] = useState<LODInfo | null>(null);
  const scene = useSystemStore((state) => state.scene);

  useEffect(() => {
    if (!scene) return;

    const camera = scene.userData.camera as THREE.Camera;
    if (!camera) return;

    let animationId: number;

    const updateLODInfo = () => {
      const lodObjects: Array<{
        lod: THREE.LOD;
        distance: number;
        name: string;
        type: string;
      }> = [];

      scene.traverse((object) => {
        if (object instanceof THREE.LOD && object.userData.lodEnabled) {
          const worldPos = new THREE.Vector3();
          object.getWorldPosition(worldPos);
          const distance = camera.position.distanceTo(worldPos);

          lodObjects.push({
            lod: object,
            distance,
            name: object.name,
            type: object.userData.type || 'unknown',
          });
        }
      });

      if (lodObjects.length === 0) {
        setLodInfo(null);
        animationId = requestAnimationFrame(updateLODInfo);
        return;
      }

      lodObjects.sort((a, b) => a.distance - b.distance);
      const closest = lodObjects[0];
      const lod = closest.lod;
      const distance = closest.distance;

      let currentLevel = 0;
      let currentLevelName = 'high';

      for (let i = 0; i < lod.levels.length; i++) {
        const nextLevel = lod.levels[i + 1];

        if (!nextLevel || distance < nextLevel.distance) {
          currentLevel = i;
          currentLevelName = i === 0 ? 'high' : i === 1 ? 'medium' : 'low';
          break;
        }
      }

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
        totalLODObjects: lodObjects.length,
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

  const levelColors = {
    high: '#00ff9c',
    medium: '#ffaa00',
    low: '#ff5a4f',
  };

  const levelColor = lodInfo ? levelColors[lodInfo.levelName as keyof typeof levelColors] || '#ffffff' : '#88f7ff';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div className="label-text" style={styles.eyebrow}>LOD Diagnostics</div>
          <div style={styles.title}>Adaptive Mesh Status</div>
        </div>
        <div style={{ ...styles.levelBadge, borderColor: levelColor, color: levelColor }}>
          {lodInfo ? `${lodInfo.levelName.toUpperCase()}` : 'IDLE'}
        </div>
      </div>

      {!lodInfo ? (
        <div style={styles.emptyState}>
          <span className="mdi mdi-layers-outline" style={styles.emptyIcon}></span>
          <p style={styles.emptyText}>No active LOD bodies in current scene.</p>
        </div>
      ) : (
        <>
          <div style={styles.metricsGrid}>
            <Metric label="Object" value={lodInfo.name} subvalue={`(${lodInfo.type})`} />
            <Metric label="Distance" value={`${lodInfo.distance}`} subvalue="units" />
            <Metric label="LOD Level" value={`${lodInfo.level}`} subvalue={lodInfo.levelName.toUpperCase()} accent={levelColor} />
            <Metric label="Triangles" value={lodInfo.triangles.toLocaleString()} />
          </div>

          <div style={styles.footerRow}>
            <span style={styles.footerText}>{lodInfo.totalLODObjects} LOD objects in scene</span>
          </div>

          <div style={styles.thresholdBlock}>
            <div style={styles.thresholdRow}><span>High</span><span>0–75 units · 82k tri</span></div>
            <div style={styles.thresholdRow}><span>Medium</span><span>75–250 units · 5k tri</span></div>
            <div style={styles.thresholdRow}><span>Low</span><span>250+ units · 320 tri</span></div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  subvalue,
  accent,
}: {
  label: string;
  value: string;
  subvalue?: string;
  accent?: string;
}) {
  return (
    <div style={styles.metricCard}>
      <div className="label-text" style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, ...(accent ? { color: accent } : {}) }}>{value}</div>
      {subvalue && <div style={{ ...styles.metricSubvalue, ...(accent ? { color: accent } : {}) }}>{subvalue}</div>}
    </div>
  );
}

const styles = {
  container: {
    borderTop: '1px solid #2b2f38',
    padding: '18px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  } as React.CSSProperties,
  eyebrow: {
    color: 'rgba(167, 245, 255, 0.72)',
    letterSpacing: '1.4px',
    marginBottom: '6px',
  } as React.CSSProperties,
  title: {
    color: '#f2f5f7',
    fontSize: '15px',
    fontWeight: 600,
  } as React.CSSProperties,
  levelBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '72px',
    padding: '6px 10px',
    borderRadius: '999px',
    border: '1px solid rgba(136,247,255,0.35)',
    background: 'rgba(255,255,255,0.03)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1px',
  } as React.CSSProperties,
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
  } as React.CSSProperties,
  metricCard: {
    padding: '12px 12px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.025)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
  } as React.CSSProperties,
  metricLabel: {
    color: 'rgba(255,255,255,0.46)',
    letterSpacing: '1.2px',
  } as React.CSSProperties,
  metricValue: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.1,
    overflowWrap: 'anywhere',
  } as React.CSSProperties,
  metricSubvalue: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: '12px',
    letterSpacing: '0.3px',
  } as React.CSSProperties,
  footerRow: {
    paddingTop: '2px',
  } as React.CSSProperties,
  footerText: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: '12px',
  } as React.CSSProperties,
  thresholdBlock: {
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  } as React.CSSProperties,
  thresholdRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 12px',
    color: 'rgba(255,255,255,0.72)',
    fontSize: '12px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  } as React.CSSProperties,
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
  } as React.CSSProperties,
  emptyIcon: {
    color: 'rgba(136, 247, 255, 0.58)',
    fontSize: '20px',
  } as React.CSSProperties,
  emptyText: {
    margin: 0,
    color: 'rgba(255,255,255,0.68)',
    fontSize: '13px',
  } as React.CSSProperties,
};
