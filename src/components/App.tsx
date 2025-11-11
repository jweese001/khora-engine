/**
 * Khora Engine - Root Application Component
 *
 * Main layout with mode-based routing:
 * - Landing: Mode selection screen
 * - Architect: Galaxy construction interface
 * - Explorer: Astronaut gameplay (Phase 4)
 */

import { CanvasContainer } from './Canvas/CanvasContainer';
import { UIControls } from './UI/UIControls';
import { IDEPanel } from './IDE/IDEPanel';
import { LODDebug } from './UI/LODDebug';
import { LandingPage } from './Landing/LandingPage';
import { DiceRollerFlow } from './DiceRoller/DiceRollerFlow';
import { useSystemStore } from '../store/system-store';

export function App() {
  const appMode = useSystemStore((state) => state.appMode);

  // Landing page: Mode selection
  if (appMode === 'landing') {
    return <LandingPage />;
  }

  // Dice roll: Resource budget rolling
  if (appMode === 'diceRoll') {
    return <DiceRollerFlow />;
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
    <div style={styles.container}>
      {/* Top navigation bar */}
      <UIControls />

      {/* Main canvas area */}
      <div style={styles.canvasWrapper}>
        <CanvasContainer />
      </div>

      {/* IDE panel (slides in from right) */}
      <IDEPanel />

      {/* LOD Debug overlay (press L to toggle) */}
      <LODDebug />
    </div>
  );
}

// Inline styles (will be replaced with proper CSS in TASK-021)
const styles = {
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
    overflow: 'hidden'
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
