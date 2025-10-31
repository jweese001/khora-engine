/**
 * Khora Engine - IDE Panel
 *
 * Sliding panel for scene inspection and data viewing.
 * Contains tabs for Scene Tree, Data Inspector, and Shader Viewer.
 */

import { useState } from 'react';
import { useSystemStore } from '../../store/system-store';
import { SceneTree } from './SceneTree';
import { DataInspector } from './DataInspector';
import { ShaderViewer } from './ShaderViewer';

type TabType = 'scene' | 'data' | 'shaders';

export function IDEPanel() {
  const ideOpen = useSystemStore((state) => state.ideOpen);
  const toggleIDE = useSystemStore((state) => state.toggleIDE);
  const [activeTab, setActiveTab] = useState<TabType>('scene');

  return (
    <div style={ideOpen ? { ...styles.container, ...styles.containerOpen } : styles.container}>
      {/* Panel content (only when open) */}
      {ideOpen && (
        <>
          {/* Header with title and close button */}
          <div style={styles.header}>
            <div style={styles.headerContent}>
              <div>
                <h2 style={styles.title}>System Inspector</h2>
                <span style={styles.subtitle}>Read-only view</span>
              </div>
              <button
                onClick={toggleIDE}
                style={styles.closeButton}
                title="Close Inspector"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#cccccc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#858585';
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div style={styles.tabBar}>
            {(['scene', 'data', 'shaders'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab ? styles.tabActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.color = '#cccccc';
                    e.currentTarget.style.background = '#333337';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.color = '#969696';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={styles.content}>
            {activeTab === 'scene' && <SceneTree />}
            {activeTab === 'data' && <DataInspector />}
            {activeTab === 'shaders' && <ShaderViewer />}
          </div>
        </>
      )}
    </div>
  );
}

// Inline styles
const styles = {
  container: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '40%',
    minWidth: '400px',
    height: '100vh',
    backgroundColor: '#1e1e1e',
    borderLeft: '1px solid #3e3e42',
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 1000,
  } as React.CSSProperties,
  containerOpen: {
    transform: 'translateX(0)',
  } as React.CSSProperties,
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #3e3e42',
    background: '#252526',
  } as React.CSSProperties,
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#858585',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: '1',
    transition: 'color 0.2s',
    outline: 'none',
  } as React.CSSProperties,
  title: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#cccccc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '12px',
    color: '#858585',
  } as React.CSSProperties,
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #3e3e42',
    background: '#2d2d30',
  } as React.CSSProperties,
  tab: {
    flex: 1,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#969696',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    textTransform: 'capitalize',
    transition: 'all 0.2s',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,
  tabActive: {
    background: '#1e1e1e',
    borderBottom: '2px solid #007acc',
    color: '#ffffff',
  } as React.CSSProperties,
  content: {
    flex: 1,
    overflow: 'hidden',
    background: '#1e1e1e',
  } as React.CSSProperties,
};
