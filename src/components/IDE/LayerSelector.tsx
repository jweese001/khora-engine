/**
 * Khora Engine - Layer Selector Component
 *
 * Tab navigation and visibility controls for multi-layer galaxy system.
 * Allows switching between 3 independent galaxy layers and toggling their visibility.
 */

import { useGalaxyStore } from '../../store/galaxy-store';

export function LayerSelector() {
  const { layers, activeLayerId, setActiveLayer, toggleLayerVisibility } = useGalaxyStore();

  return (
    <div style={styles.container}>
      {/* Layer Tabs */}
      <div style={styles.tabBar}>
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            style={{
              ...styles.tab,
              ...(activeLayerId === layer.id ? styles.tabActive : {}),
            }}
          >
            {layer.name}
          </button>
        ))}
      </div>

      {/* Visibility Controls */}
      <div style={styles.visibilityBar}>
        {layers.map((layer) => (
          <label key={layer.id} style={styles.visibilityControl}>
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => toggleLayerVisibility(layer.id)}
              style={styles.checkbox}
            />
            <span style={styles.checkboxLabel}>
              {layer.visible ? '👁️' : '👁️‍🗨️'} {layer.name}
            </span>
          </label>
        ))}
      </div>

      {/* Active Layer Hint */}
      <p style={styles.hint}>
        Editing <strong style={styles.highlightText}>{layers[activeLayerId].name}</strong>
        {' • '}
        Click tabs to switch layers
      </p>
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    marginBottom: '16px',
    background: '#1e1e1e',
    borderRadius: '4px',
    border: '1px solid #3e3e42',
    overflow: 'hidden',
  } as React.CSSProperties,

  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #3e3e42',
    background: '#252526',
  } as React.CSSProperties,

  tab: {
    flex: 1,
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#969696',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  } as React.CSSProperties,

  tabActive: {
    borderBottomColor: '#007acc',
    color: '#ffffff',
    background: '#1e1e1e',
  } as React.CSSProperties,

  visibilityBar: {
    display: 'flex',
    gap: '16px',
    padding: '12px 16px',
    background: '#1e1e1e',
    borderBottom: '1px solid #3e3e42',
  } as React.CSSProperties,

  visibilityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#cccccc',
    cursor: 'pointer',
    userSelect: 'none',
  } as React.CSSProperties,

  checkbox: {
    width: '14px',
    height: '14px',
    cursor: 'pointer',
    accentColor: '#007acc',
  } as React.CSSProperties,

  checkboxLabel: {
    fontSize: '11px',
    color: '#969696',
  } as React.CSSProperties,

  hint: {
    margin: 0,
    padding: '10px 16px',
    fontSize: '11px',
    color: '#858585',
    background: '#252526',
  } as React.CSSProperties,

  highlightText: {
    color: '#cccccc',
    fontWeight: 600,
  } as React.CSSProperties,
};
