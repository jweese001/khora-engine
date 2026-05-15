/**
 * Khora Engine - Generate System Button
 *
 * Triggers star system generation with random or specified seed.
 * Now using Khora Design System v1.0 with loading indicator
 */

import { useState } from 'react';
import { useSystemStore } from '../../store/system-store';

export function GenerateButton() {
  const [seedInput, setSeedInput] = useState('');
  const generateSystem = useSystemStore((state) => state.generateSystem);
  const isGenerating = useSystemStore((state) => state.isGenerating);

  const handleGenerate = () => {
    let seed: number;

    if (seedInput.trim()) {
      // Use provided seed (parse as number)
      seed = parseInt(seedInput, 10);
      if (isNaN(seed)) {
        // If not a valid number, use hash of string
        seed = hashString(seedInput);
      }
    } else {
      // Generate random seed
      seed = Math.floor(Math.random() * 1000000);
    }

    console.log(`[GenerateButton] Generating system with seed: ${seed}`);
    generateSystem(seed);

    // Update input to show actual seed used
    setSeedInput(seed.toString());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  return (
    <div style={styles.container}>
      <input
        type="text"
        value={seedInput}
        onChange={(e) => setSeedInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="System seed"
        className="hud-input"
        style={styles.input}
        disabled={isGenerating}
      />
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="hud-btn"
        style={isGenerating ? styles.buttonDisabled : undefined}
      >
        {isGenerating && (
          <span className="loading-spinner" style={styles.spinner}></span>
        )}
        <span className="mdi mdi-atom-variant" style={styles.buttonIcon}></span>
        System
      </button>
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
    gap: '8px',
    alignItems: 'center'
  },
  input: {
    width: '120px',
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
  }
};
