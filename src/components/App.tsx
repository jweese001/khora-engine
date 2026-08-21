/**
 * Khora Engine - Root Application Component
 *
 * Main layout with mode-based routing:
 * - Landing: Mode selection screen
 * - Architect: Galaxy construction interface
 * - Explorer: Astronaut gameplay (Phase 4)
 */

import { lazy, Suspense } from 'react';
import { LandingPage } from './Landing/LandingPage';
import { useSystemStore } from '../store/system-store';

const CanvasContainer = lazy(() => import('./Canvas/CanvasContainer').then((module) => ({ default: module.CanvasContainer })));
const UIControls = lazy(() => import('./UI/UIControls').then((module) => ({ default: module.UIControls })));
const IDEPanel = lazy(() => import('./IDE/IDEPanel').then((module) => ({ default: module.IDEPanel })));
const ControlDrawer = lazy(() => import('./UI/ControlDrawer').then((module) => ({ default: module.ControlDrawer })));
const DiceRollerFlow = lazy(() => import('./DiceRoller/DiceRollerFlow').then((module) => ({ default: module.DiceRollerFlow })));

export function App() {
  const appMode = useSystemStore((state) => state.appMode);
  const ideOpen = useSystemStore((state) => state.ideOpen);
  const controlDrawerOpen = useSystemStore((state) => state.controlDrawerOpen);

  // Landing page: Mode selection
  if (appMode === 'landing') {
    return <LandingPage />;
  }

  // Dice roll: Resource budget rolling
  if (appMode === 'diceRoll') {
    return (
      <Suspense fallback={<LoadingSurface label="Preparing cosmic dice" />}>
        <DiceRollerFlow />
      </Suspense>
    );
  }

  // Explorer mode: Phase 4 placeholder
  if (appMode === 'explorer') {
    return (
      <div style={styles.placeholderContainer}>
        <div style={styles.placeholderContent}>
          <span className="mdi mdi-rocket" style={styles.placeholderIcon}></span>
          <h1 className="system-title" style={styles.placeholderTitle}>
            Explorer Mode
          </h1>
          <p className="label-text" style={styles.placeholderText}>
            Coming in Phase 4: Navigation, mining, colonization, and defense
          </p>
          <button
            className="hud-btn"
            onClick={() => useSystemStore.getState().setAppMode('landing')}
            style={styles.backButton}
          >
            <span className="mdi mdi-arrow-left"></span>
            Back to Mode Selection
          </button>
        </div>
      </div>
    );
  }

  // Architect mode: Galaxy construction interface
  return (
    <Suspense fallback={<LoadingSurface label="Initializing architect mode" />}>
      <div style={styles.container}>
        <UIControls />

        <div style={{
          ...styles.canvasWrapper,
          ...(ideOpen ? styles.canvasWrapperWithIDE : {}),
          ...(controlDrawerOpen ? styles.canvasWrapperWithControls : {}),
        }}>
          <CanvasContainer />
        </div>

        <ControlDrawer />
        <IDEPanel />
      </div>
    </Suspense>
  );
}

function LoadingSurface({ label }: { label: string }) {
  return (
    <div style={styles.loadingSurface} role="status" aria-live="polite">
      <span className="mdi mdi-loading mdi-spin" style={styles.loadingIcon}></span>
      <span className="label-text" style={styles.loadingLabel}>{label}</span>
    </div>
  );
}

// Inline styles (will be replaced with proper CSS in TASK-021)
const styles = {
  loadingSurface: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: '#000510',
  } as React.CSSProperties,
  loadingIcon: {
    fontSize: '32px',
    color: 'var(--accent-cyan, #00ffff)',
  } as React.CSSProperties,
  loadingLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#000510',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  } as React.CSSProperties,
  canvasWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    transition: 'margin-right 0.3s ease-in-out'
  } as React.CSSProperties,
  canvasWrapperWithIDE: {
    marginRight: 'max(40%, 400px)' // Match IDE panel width/minWidth
  } as React.CSSProperties,
  canvasWrapperWithControls: {
    marginLeft: 'min(360px, 32vw)'
  } as React.CSSProperties,
  placeholderContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-dark)'
  } as React.CSSProperties,
  placeholderContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '48px',
    maxWidth: '500px',
    textAlign: 'center'
  } as React.CSSProperties,
  placeholderIcon: {
    fontSize: '64px',
    color: 'var(--accent-green)'
  } as React.CSSProperties,
  placeholderTitle: {
    margin: 0,
    fontSize: '32px'
  } as React.CSSProperties,
  placeholderText: {
    margin: 0,
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'var(--text-secondary)'
  } as React.CSSProperties,
  backButton: {
    marginTop: '24px'
  } as React.CSSProperties
};
