/**
 * Khora Engine - Cosmic Dice Roller Scene
 *
 * Full-screen Three.js animation for resource budget rolling
 * Based on cosmic-dice.js with game mechanics integration
 *
 * Mechanics:
 * - 64 cubes in 4×4×4 grid
 * - 16 cubes become solid (randomly selected)
 * - Each solid cube's index (1-64) contributes to budget
 * - Budget = (Sum of indices) × 35 + Pattern Bonuses
 * - User gets 4 tries: 3 optional, 4th mandatory
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useSystemStore } from '../../store/system-store';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GRID_SIZE = 4;
const SHAPE_SIZE = 0.4;
const SPACING = 0.05;
const ROTATION_AMOUNT = Math.PI * 2;
const ROTATION_DURATION = 2.0;
const DELAY_BETWEEN_SHAPES = 0.1;
const HOTPINK_COLOR = 0xff1493;
const BABYBLUE_COLOR = 0x89cff0;
const BACKGROUND_COLOR = 0x1a1a1a;
const GROUP_ROTATION_SPEED = 0.002;
const CAMERA_Z = 12;

// Budget calculation constants
const INDEX_MULTIPLIER = 35;
const HIGH_ROLL_THRESHOLD = 50;
const HIGH_ROLL_BONUS = 100;
const LUCKY_64_BONUS = 2000;
const CLUSTER_BONUS = 500;

interface DiceRollResult {
  solidCubes: number[];     // Indices of solid cubes (1-64)
  baseTotal: number;        // Sum of indices
  bonuses: {
    highRoll: number;
    lucky64: number;
    cluster: number;
  };
  finalBudget: number;
}

interface DiceRollerSceneProps {
  onRollComplete: (result: DiceRollResult) => void;
}

export function DiceRollerScene({ onRollComplete }: DiceRollerSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const shapesRef = useRef<THREE.Mesh[]>([]);
  const shapeGroupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const previousCycleTimeRef = useRef(0);
  const solidCubesThisCycleRef = useRef<Set<number>>(new Set());
  const currentTargetColorRef = useRef(BABYBLUE_COLOR);
  const sequenceDurationRef = useRef(0);
  const rollCompleteRef = useRef(false);

  const [runningTotal, setRunningTotal] = useState(0);
  const [landedCubes, setLandedCubes] = useState<number[]>([]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[DiceRollerScene] Initializing...');

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUND_COLOR);
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = CAMERA_Z;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controlsRef.current = controls;

    // Create cube grid
    createShapeGrid(scene);

    // Calculate sequence duration
    const totalShapes = GRID_SIZE * GRID_SIZE * GRID_SIZE;
    sequenceDurationRef.current = (totalShapes * DELAY_BETWEEN_SHAPES) + ROTATION_DURATION;

    // Select initial solid cubes
    selectRandomSolidCubes();

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Start animation
    console.log('[DiceRollerScene] Starting animation loop...');
    animate();

    // Cleanup
    return () => {
      console.log('[DiceRollerScene] Cleaning up...');
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer && containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer?.dispose();
      controls?.dispose();
    };
  }, []);

  // ============================================================================
  // CREATE CUBE GRID
  // ============================================================================

  function createShapeGrid(scene: THREE.Scene) {
    const shapeGroup = new THREE.Group();
    shapeGroupRef.current = shapeGroup;

    const geometry = new THREE.BoxGeometry(SHAPE_SIZE, SHAPE_SIZE, SHAPE_SIZE);
    const material = new THREE.MeshBasicMaterial({
      color: HOTPINK_COLOR,
      wireframe: true,
      transparent: true,
      opacity: 1.0
    });

    const totalSize = (GRID_SIZE - 1) * (SHAPE_SIZE * 2 + SPACING);
    const offset = totalSize / 2;

    let shapeIndex = 0;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          const mesh = new THREE.Mesh(geometry, material.clone());

          mesh.position.x = (x * (SHAPE_SIZE * 2 + SPACING)) - offset;
          mesh.position.y = (y * (SHAPE_SIZE * 2 + SPACING)) - offset;
          mesh.position.z = (z * (SHAPE_SIZE * 2 + SPACING)) - offset;

          mesh.userData.index = shapeIndex;
          mesh.userData.gridX = x;
          mesh.userData.gridY = y;
          mesh.userData.gridZ = z;
          mesh.userData.startTime = shapeIndex * DELAY_BETWEEN_SHAPES;
          mesh.userData.currentRotation = { x: 0, y: 0, z: 0 };
          mesh.userData.targetRotation = { x: 0, y: 0, z: 0 };

          shapeGroup.add(mesh);
          shapesRef.current.push(mesh);

          shapeIndex++;
        }
      }
    }

    scene.add(shapeGroup);
  }

  // ============================================================================
  // SELECT RANDOM SOLID CUBES
  // ============================================================================

  function selectRandomSolidCubes() {
    solidCubesThisCycleRef.current.clear();

    // For each X,Y position, select one random cube from the 4 along Z-axis
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const cubesAtThisXY = shapesRef.current.filter(shape =>
          shape.userData.gridX === x && shape.userData.gridY === y
        );

        const randomIndex = Math.floor(Math.random() * cubesAtThisXY.length);
        const selectedCube = cubesAtThisXY[randomIndex];

        solidCubesThisCycleRef.current.add(selectedCube.userData.index);
      }
    }
  }

  // ============================================================================
  // UPDATE SHAPES
  // ============================================================================

  function updateShapes() {
    const cycleTime = timeRef.current % sequenceDurationRef.current;

    // Detect cycle restart
    if (cycleTime < previousCycleTimeRef.current) {
      currentTargetColorRef.current = currentTargetColorRef.current === BABYBLUE_COLOR
        ? HOTPINK_COLOR
        : BABYBLUE_COLOR;

      selectRandomSolidCubes();

      shapesRef.current.forEach(shape => {
        shape.userData.rotationLocked = false;
        shape.userData.rotationStarted = false;
      });

      rollCompleteRef.current = false;
      setLandedCubes([]);
      setRunningTotal(0);
    }
    previousCycleTimeRef.current = cycleTime;

    let allSolidCubesLanded = true;

    shapesRef.current.forEach(shape => {
      const startTime = shape.userData.startTime;
      const endTime = startTime + ROTATION_DURATION;

      // Check if rotating
      if (cycleTime >= startTime && cycleTime < endTime) {
        if (!shape.userData.rotationStarted) {
          shape.material.wireframe = true;
          shape.material.opacity = 1.0;
          shape.userData.rotationStarted = true;
        }

        const progress = (cycleTime - startTime) / ROTATION_DURATION;
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        shape.rotation.y = shape.userData.currentRotation.y + (ROTATION_AMOUNT * eased);
      }
      // If rotation complete
      else if (cycleTime >= endTime) {
        if (!shape.userData.rotationLocked) {
          shape.userData.currentRotation.y += ROTATION_AMOUNT;
          shape.material.color.setHex(currentTargetColorRef.current);

          // Turn solid if selected
          if (solidCubesThisCycleRef.current.has(shape.userData.index)) {
            shape.material.wireframe = false;
            shape.material.opacity = 0.5;

            // Add to landed cubes
            setLandedCubes(prev => {
              if (!prev.includes(shape.userData.index)) {
                console.log('[DiceRollerScene] Cube landed:', shape.userData.index + 1);
                return [...prev, shape.userData.index];
              }
              return prev;
            });
          }

          shape.userData.rotationLocked = true;
        }
      } else {
        if (solidCubesThisCycleRef.current.has(shape.userData.index)) {
          allSolidCubesLanded = false;
        }
      }
    });

    // Rotate group
    if (shapeGroupRef.current) {
      shapeGroupRef.current.rotation.y += GROUP_ROTATION_SPEED;
    }

    timeRef.current += 1 / 60;

    // Check if roll complete
    if (allSolidCubesLanded && !rollCompleteRef.current && landedCubes.length === 16) {
      console.log('[DiceRollerScene] Roll complete! All 16 cubes landed.');
      rollCompleteRef.current = true;
      calculateAndReportResult();
    }
  }

  // ============================================================================
  // CALCULATE RESULT
  // ============================================================================

  function calculateAndReportResult() {
    const solidCubes = Array.from(solidCubesThisCycleRef.current);
    const baseTotal = solidCubes.reduce((sum, index) => sum + (index + 1), 0); // +1 because indices are 0-63

    // Calculate bonuses
    const highRollCount = solidCubes.filter(idx => (idx + 1) > HIGH_ROLL_THRESHOLD).length;
    const highRollBonus = highRollCount * HIGH_ROLL_BONUS;

    const lucky64Bonus = solidCubes.includes(63) ? LUCKY_64_BONUS : 0; // 63 = cube 64

    // Cluster bonus (simplified: count adjacent cubes)
    const clusterBonus = calculateClusterBonus(solidCubes);

    const finalBudget = (baseTotal * INDEX_MULTIPLIER) + highRollBonus + lucky64Bonus + clusterBonus;

    const result: DiceRollResult = {
      solidCubes: solidCubes.map(idx => idx + 1), // Convert to 1-64 range
      baseTotal,
      bonuses: {
        highRoll: highRollBonus,
        lucky64: lucky64Bonus,
        cluster: clusterBonus
      },
      finalBudget
    };

    // Update running total
    setRunningTotal(finalBudget);

    // Report result after short delay for dramatic effect
    setTimeout(() => {
      onRollComplete(result);
    }, 1000);
  }

  // ============================================================================
  // CALCULATE CLUSTER BONUS
  // ============================================================================

  function calculateClusterBonus(solidIndices: number[]): number {
    // Simple adjacency check: count cubes that have neighbors
    let clusters = 0;
    const set = new Set(solidIndices);

    solidIndices.forEach(idx => {
      const neighbors = [idx - 1, idx + 1, idx - GRID_SIZE, idx + GRID_SIZE];
      const hasNeighbor = neighbors.some(n => set.has(n));
      if (hasNeighbor) clusters++;
    });

    return Math.floor(clusters / 3) * CLUSTER_BONUS; // Bonus per group of 3
  }

  // ============================================================================
  // ANIMATION LOOP
  // ============================================================================

  function animate() {
    animationIdRef.current = requestAnimationFrame(animate);

    updateShapes();

    if (controlsRef.current) {
      controlsRef.current.update();
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={styles.container}>
      {/* Three.js canvas container */}
      <div ref={containerRef} style={styles.canvas} />

      {/* UI Overlay */}
      <div style={styles.overlay}>
        {/* Top: Instructions */}
        <div style={styles.topBar}>
          <span className="label-text" style={styles.label}>
            Rolling for Resources...
          </span>
        </div>

        {/* Bottom: Running Total and Cube Numbers */}
        <div style={styles.bottomBar}>
          <div style={styles.totalDisplay}>
            <span className="label-text" style={styles.smallLabel}>
              Budget
            </span>
            <div style={styles.budgetNumber}>
              {runningTotal.toLocaleString()}
            </div>
            <span className="label-text" style={styles.smallLabel}>
              Cubes: {landedCubes.length}/16
            </span>
          </div>

          {/* Landed cube numbers */}
          {landedCubes.length > 0 && (
            <div style={styles.cubeNumbersContainer}>
              {landedCubes.slice(-8).map((idx, i) => (
                <span key={i} className="label-text" style={styles.cubeNumber}>
                  {idx + 1}
                </span>
              ))}
              {landedCubes.length > 8 && (
                <span className="label-text" style={styles.cubeNumber}>
                  +{landedCubes.length - 8} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BACKGROUND_COLOR
  },
  canvas: {
    width: '100%',
    height: '100%'
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    padding: '24px'
  },
  topBar: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: '8px 16px',
    borderRadius: '4px',
    backdropFilter: 'blur(10px)',
    alignSelf: 'flex-start'
  },
  label: {
    margin: 0,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)'
  },
  bottomBar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: '16px 24px',
    borderRadius: '4px',
    backdropFilter: 'blur(10px)',
    alignSelf: 'flex-start',
    maxWidth: '400px'
  },
  totalDisplay: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  smallLabel: {
    margin: 0,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)'
  },
  budgetNumber: {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: 'var(--accent-cyan)',
    fontFamily: 'monospace',
    lineHeight: 1
  },
  cubeNumbersContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const
  },
  cubeNumber: {
    padding: '2px 8px',
    backgroundColor: 'rgba(255, 20, 147, 0.2)',
    border: '1px solid rgba(255, 20, 147, 0.4)',
    borderRadius: '3px',
    fontSize: '11px',
    fontFamily: 'monospace',
    margin: 0
  }
};
