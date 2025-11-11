/**
 * Khora Engine - UI Controls Container
 *
 * Top bar with system generation controls and IDE toggle.
 * Now using Khora Design System v1.0
 * Phase 2: Added galaxy generation
 */

import { useState } from 'react';
import { GenerateButton } from './GenerateButton';
import { useSystemStore } from '../../store/system-store';

export function UIControls() {
  const ideOpen = useSystemStore((state) => state.ideOpen);
  const toggleIDE = useSystemStore((state) => state.toggleIDE);
  const generateGalaxy = useSystemStore((state) => state.generateGalaxy);
  const isGenerating = useSystemStore((state) => state.isGenerating);
  const currentGalaxy = useSystemStore((state) => state.currentGalaxy);

  const [galaxySeedInput, setGalaxySeedInput] = useState('');
  const [systemCount, setSystemCount] = useState('12');

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

    const count = parseInt(systemCount, 10) || 12;

    console.log(`[UIControls] Generating galaxy with seed: ${seed}, ${count} systems`);
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
        <div style={styles.brandingGroup}>
          <span className="mdi mdi-atom" style={styles.icon}></span>
          <h1 className="system-title" style={styles.title}>Khora Engine</h1>
        </div>
        <span className="label-text" style={styles.subtitle}>
          Phase 2 - Galaxy Engine {currentGalaxy && `(${currentGalaxy.name})`}
        </span>
      </div>

      {/* Center: Generation Controls */}
      <div style={styles.centerSection}>
        <div style={styles.generationGroup}>
          <GenerateButton />

          <div style={styles.separator}></div>

          {/* Galaxy Generation */}
          <div style={styles.galaxyControls}>
            <input
              type="text"
              value={galaxySeedInput}
              onChange={(e) => setGalaxySeedInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Galaxy seed (optional)"
              className="hud-input"
              style={styles.input}
              disabled={isGenerating}
            />
            <input
              type="number"
              value={systemCount}
              onChange={(e) => setSystemCount(e.target.value)}
              placeholder="Systems"
              className="hud-input"
              style={styles.smallInput}
              min="4"
              max="100"
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
              <span className="mdi mdi-galaxy" style={styles.buttonIcon}></span>
              {isGenerating ? 'Generating...' : 'Generate Galaxy'}
            </button>
          </div>
        </div>
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
  generationGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  separator: {
    width: '1px',
    height: '30px',
    backgroundColor: 'var(--border-light)'
  },
  galaxyControls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  input: {
    width: '180px'
  },
  smallInput: {
    width: '80px'
  },
  buttonIcon: {
    fontSize: '16px',
    marginRight: '4px'
  },
  spinner: {
    marginRight: '8px'
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
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
  }
};
