/**
 * Khora Engine - IDE Panel
 *
 * Sliding panel for scene inspection and data viewing.
 * Phase 1: Basic shell with slide animation.
 * Full implementation in Weeks 10-11.
 */

import { useSystemStore } from '../../store/system-store';

export function IDEPanel() {
  const ideOpen = useSystemStore((state) => state.ideOpen);
  const toggleIDE = useSystemStore((state) => state.toggleIDE);
  const selectedObject = useSystemStore((state) => state.selectedObject);

  return (
    <div style={ideOpen ? { ...styles.container, ...styles.containerOpen } : styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h2 style={styles.title}>Scene Inspector</h2>
            <span style={styles.subtitle}>Read-only view</span>
          </div>
          <button
            style={styles.closeButton}
            onClick={toggleIDE}
            title="Close Inspector"
          >
            ✕
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {selectedObject ? (
          <div style={styles.selectedInfo}>
            <h3 style={styles.objectType}>{selectedObject.type.toUpperCase()}</h3>
            <pre style={styles.dataPreview}>
              {JSON.stringify(selectedObject.data, null, 2)}
            </pre>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No object selected</p>
            <p style={styles.emptyHint}>Click on a star, planet, or moon to inspect</p>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <span style={styles.footerText}>Phase 1 - Basic Inspector</span>
        <span style={styles.footerHint}>Full IDE in Weeks 10-11</span>
      </div>
    </div>
  );
}

// Inline styles (will be replaced with proper CSS in TASK-021)
const styles = {
  container: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '40%',
    height: '100vh',
    backgroundColor: '#0f1419',
    borderLeft: '1px solid #1a2332',
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 1000
  } as React.CSSProperties,
  containerOpen: {
    transform: 'translateX(0)'
  } as React.CSSProperties,
  header: {
    padding: '20px',
    borderBottom: '1px solid #1a2332'
  } as React.CSSProperties,
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  } as React.CSSProperties,
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#6b7a8f',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: '1',
    transition: 'color 0.2s',
    outline: 'none'
  } as React.CSSProperties,
  title: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: 700,
    color: '#e0e6ed'
  } as React.CSSProperties,
  subtitle: {
    fontSize: '12px',
    color: '#6b7a8f'
  } as React.CSSProperties,
  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto'
  } as React.CSSProperties,
  selectedInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  } as React.CSSProperties,
  objectType: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 700,
    color: '#4a90e2',
    letterSpacing: '1px'
  } as React.CSSProperties,
  dataPreview: {
    margin: 0,
    padding: '12px',
    backgroundColor: '#1a2332',
    border: '1px solid #2a3a4a',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#e0e6ed',
    overflow: 'auto',
    maxHeight: '500px'
  } as React.CSSProperties,
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#6b7a8f'
  } as React.CSSProperties,
  emptyText: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600
  } as React.CSSProperties,
  emptyHint: {
    margin: 0,
    fontSize: '12px',
    opacity: 0.7
  } as React.CSSProperties,
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #1a2332',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  } as React.CSSProperties,
  footerText: {
    fontSize: '11px',
    color: '#6b7a8f',
    fontWeight: 600
  } as React.CSSProperties,
  footerHint: {
    fontSize: '10px',
    color: '#4a5a6a',
    fontStyle: 'italic'
  } as React.CSSProperties
};
