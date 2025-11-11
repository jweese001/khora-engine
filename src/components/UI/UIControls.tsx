/**
 * Khora Engine - UI Controls Container
 *
 * Top bar with system generation controls and IDE toggle.
 * Now using Khora Design System v1.0
 */

import { GenerateButton } from './GenerateButton';
import { useSystemStore } from '../../store/system-store';

export function UIControls() {
  const ideOpen = useSystemStore((state) => state.ideOpen);
  const toggleIDE = useSystemStore((state) => state.toggleIDE);

  return (
    <div style={styles.container}>
      {/* Left: Branding */}
      <div style={styles.leftSection}>
        <div style={styles.brandingGroup}>
          <span className="mdi mdi-atom" style={styles.icon}></span>
          <h1 className="system-title" style={styles.title}>Khora Engine</h1>
        </div>
        <span className="label-text" style={styles.subtitle}>Phase 1 - Genesis Engine</span>
      </div>

      {/* Center: Generation Controls */}
      <div style={styles.centerSection}>
        <GenerateButton />
      </div>

      {/* Right: IDE Toggle */}
      <div style={styles.rightSection}>
        <button
          onClick={toggleIDE}
          className={`hud-btn-secondary ${ideOpen ? 'active' : ''}`}
          style={ideOpen ? { ...styles.ideButton, borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' } : styles.ideButton}
        >
          <span className={`mdi ${ideOpen ? 'mdi-code-braces' : 'mdi-code-braces-box'}`} style={styles.buttonIcon}></span>
          {ideOpen ? 'Hide IDE' : 'Show IDE'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-light)',
    height: '60px',
    boxSizing: 'border-box' as const,
    backdropFilter: 'blur(10px)'
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1
  },
  brandingGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  icon: {
    fontSize: '24px',
    color: 'var(--accent-cyan)'
  },
  title: {
    margin: 0
  },
  subtitle: {
    paddingLeft: '16px',
    borderLeft: '1px solid var(--border-light)'
  },
  centerSection: {
    display: 'flex',
    justifyContent: 'center',
    flex: 1
  },
  rightSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flex: 1
  },
  ideButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  buttonIcon: {
    fontSize: '16px'
  }
};
