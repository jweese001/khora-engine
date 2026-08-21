/**
 * Khora Engine - UI Controls Container
 *
 * Top bar with system generation controls and IDE toggle.
 * Now using Khora Design System v1.0
 * Phase 2: Added galaxy generation
 */

import { debugLog } from '../../utils/debug';
import { useState } from 'react';
import { GenerateButton } from './GenerateButton';
import { useSystemStore } from '../../store/system-store';

export function UIControls() {
  const ideOpen = useSystemStore((state) => state.ideOpen);
  const toggleIDE = useSystemStore((state) => state.toggleIDE);
  const controlDrawerOpen = useSystemStore((state) => state.controlDrawerOpen);
  const toggleControlDrawer = useSystemStore((state) => state.toggleControlDrawer);
  const generateGalaxy = useSystemStore((state) => state.generateGalaxy);
  const isGenerating = useSystemStore((state) => state.isGenerating);
  const currentGalaxy = useSystemStore((state) => state.currentGalaxy);
  const viewMode = useSystemStore((state) => state.viewMode);
  const focusSystem = useSystemStore((state) => state.focusSystem);

  const [galaxySeedInput, setGalaxySeedInput] = useState('');
  const [systemCount, setSystemCount] = useState('16');

  // Show "Back to Galaxy" button when viewing a system that's part of a galaxy
  const showBackButton = currentGalaxy !== null && viewMode === 'system';

  const handleBackToGalaxy = () => {
    debugLog('[UIControls] Returning to galaxy view');
    focusSystem(null); // Unfocus system, return to galaxy view
  };

  const handleGenerateGalaxy = () => {
    let seed: number;

    if (galaxySeedInput.trim()) {
      seed = parseInt(galaxySeedInput, 10);
      if (isNaN(seed)) {
        // If not a valid number, use hash of string
        seed = hashString(galaxySeedInput);
      }
    } else {
      // Generate random seed
      seed = Math.floor(Math.random() * 1000000);
    }

    const count = parseInt(systemCount, 10) || 16;

    debugLog(`[UIControls] Generating galaxy with seed: ${seed}, ${count} systems`);
    generateGalaxy(seed, count);

    // Update input to show actual seed used
    setGalaxySeedInput(seed.toString());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerateGalaxy();
    }
  };


  return (
    <div style={styles.container}>
      {/* Left: Branding */}
      <div style={styles.leftSection}>
        <span className="mdi mdi-atom" style={styles.icon}></span>
        <h1 className="system-title" style={styles.title}>Khora Engine</h1>
        {currentGalaxy && (
          <span className="label-text" style={styles.subtitle}>
            {currentGalaxy.name}
          </span>
        )}
      </div>

      {/* Right: Compact Controls */}
      <div style={styles.rightSection}>
        <GenerateButton />

        <div style={styles.separator}></div>

        {/* Galaxy Generation */}
        <input
          type="text"
          value={galaxySeedInput}
          onChange={(e) => setGalaxySeedInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Galaxy seed"
          className="hud-input"
          style={styles.input}
          disabled={isGenerating}
        />
        <input
          type="text"
          value={systemCount}
          onChange={(e) => {
            // Only allow numeric input
            const value = e.target.value.replace(/[^0-9]/g, '');
            setSystemCount(value);
          }}
          placeholder="Systems"
          className="hud-input"
          style={styles.smallInput}
          disabled={isGenerating}
        />
        <button
          onClick={handleGenerateGalaxy}
          disabled={isGenerating}
          className="hud-btn"
          style={isGenerating ? styles.buttonDisabled : undefined}
        >
          {isGenerating && (
            <span className="loading-spinner" style={styles.spinner}></span>
          )}
          <span className="mdi mdi-weather-hurricane" style={styles.buttonIcon}></span>
          Galaxy
        </button>

        <div style={styles.separator}></div>

        {showBackButton && (
          <button
            onClick={handleBackToGalaxy}
            className="hud-btn-secondary"
            style={styles.backButton}
          >
            <span className="mdi mdi-arrow-left" style={styles.buttonIcon}></span>
            Back
          </button>
        )}

        <button
          onClick={toggleControlDrawer}
          className={`hud-btn-secondary ${controlDrawerOpen ? 'active' : ''}`}
          style={controlDrawerOpen ? { ...styles.drawerButton, border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)' } : styles.drawerButton}
        >
          <span className={`mdi ${controlDrawerOpen ? 'mdi-dock-left' : 'mdi-dock-left'}`} style={styles.buttonIcon}></span>
          Controls
        </button>

        <button
          onClick={toggleIDE}
          className={`hud-btn-secondary ${ideOpen ? 'active' : ''}`}
          style={ideOpen ? { ...styles.drawerButton, border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)' } : styles.drawerButton}
        >
          <span className={`mdi ${ideOpen ? 'mdi-dock-right' : 'mdi-dock-right'}`} style={styles.buttonIcon}></span>
          Inspector
        </button>

      </div>
    </div>
  );
}

/**
 * Simple string hash function for seed generation
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-light)',
    height: '52px',
    boxSizing: 'border-box' as const,
    backdropFilter: 'blur(10px)',
    fontSize: '13px',
    position: 'relative' as const,
    zIndex: 40,
    overflow: 'visible' as const,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '18px',
    color: 'var(--accent-cyan)'
  },
  title: {
    margin: 0,
    fontSize: '14px'
  },
  subtitle: {
    paddingLeft: '12px',
    borderLeft: '1px solid var(--border-light)',
    fontSize: '12px'
  },
  separator: {
    width: '1px',
    height: '24px',
    backgroundColor: 'var(--border-light)',
    margin: '0 8px'
  },
  input: {
    width: '120px',
    fontSize: '12px'
  },
  smallInput: {
    width: '75px',
    fontSize: '12px'
  },
  buttonIcon: {
    fontSize: '14px',
    marginRight: '4px'
  },
  spinner: {
    marginRight: '6px'
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  rightSection: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
    position: 'relative' as const,
    overflow: 'visible' as const,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px'
  },
  drawerButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px'
  } as React.CSSProperties
};
