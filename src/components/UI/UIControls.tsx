/**
 * Khora Engine - UI Controls Container
 *
 * Top bar with system generation controls and IDE toggle.
 */

import { GenerateButton } from './GenerateButton';
import { useSystemStore } from '../../store/system-store';

export function UIControls() {
  const ideOpen = useSystemStore((state) => state.ideOpen);
  const toggleIDE = useSystemStore((state) => state.toggleIDE);

  return (
    <div style={styles.container}>
      <div style={styles.leftSection}>
        <h1 style={styles.title}>Khora Engine</h1>
        <span style={styles.subtitle}>Phase 1 - Genesis Engine</span>
      </div>

      <div style={styles.centerSection}>
        <GenerateButton />
      </div>

      <div style={styles.rightSection}>
        <button
          onClick={toggleIDE}
          style={ideOpen ? { ...styles.ideButton, ...styles.ideButtonActive } : styles.ideButton}
        >
          {ideOpen ? 'Hide IDE' : 'Show IDE'}
        </button>
      </div>
    </div>
  );
}

// Inline styles (will be replaced with proper CSS in TASK-021)
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#0f1419',
    borderBottom: '1px solid #1a2332',
    height: '60px',
    boxSizing: 'border-box'
  } as React.CSSProperties,
  leftSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    flex: 1
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#e0e6ed',
    letterSpacing: '0.5px'
  } as React.CSSProperties,
  subtitle: {
    fontSize: '12px',
    color: '#6b7a8f',
    fontWeight: 400
  } as React.CSSProperties,
  centerSection: {
    display: 'flex',
    justifyContent: 'center',
    flex: 1
  } as React.CSSProperties,
  rightSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    flex: 1
  } as React.CSSProperties,
  ideButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid #3a4a5a',
    borderRadius: '4px',
    backgroundColor: '#1a2332',
    color: '#e0e6ed',
    cursor: 'pointer',
    transition: 'all 0.2s'
  } as React.CSSProperties,
  ideButtonActive: {
    backgroundColor: '#2a4a72',
    borderColor: '#4a90e2',
    color: '#ffffff'
  } as React.CSSProperties
};
