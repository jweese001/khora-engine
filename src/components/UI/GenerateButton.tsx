/**
 * Khora Engine - Generate System Button
 *
 * Triggers star system generation with random or specified seed.
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

  return (
    <div style={styles.container}>
      <input
        type="text"
        value={seedInput}
        onChange={(e) => setSeedInput(e.target.value)}
        placeholder="Enter seed (optional)"
        style={styles.input}
        disabled={isGenerating}
      />
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        style={isGenerating ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
      >
        {isGenerating ? 'Generating...' : 'Generate System'}
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

// Inline styles (will be replaced with proper CSS in TASK-021)
const styles = {
  container: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #3a4a5a',
    borderRadius: '4px',
    backgroundColor: '#1a2332',
    color: '#e0e6ed',
    outline: 'none',
    width: '200px'
  } as React.CSSProperties,
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#4a90e2',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  } as React.CSSProperties,
  buttonDisabled: {
    backgroundColor: '#2a4a72',
    cursor: 'not-allowed',
    opacity: 0.6
  } as React.CSSProperties
};
