/**
 * Khora Engine - Root Application Component
 *
 * Main layout: top controls, canvas, and IDE panel.
 */

import { CanvasContainer } from './Canvas/CanvasContainer';
import { UIControls } from './UI/UIControls';
import { IDEPanel } from './IDE/IDEPanel';
import { LODDebug } from './UI/LODDebug';

export function App() {
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
  } as React.CSSProperties
};
