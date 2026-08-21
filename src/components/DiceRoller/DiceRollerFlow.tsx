/**
 * Khora Engine - Dice Roller Flow Manager
 *
 * Manages the 4-try dice rolling flow:
 * - Rolls 1-3: Optional (can accept or reroll)
 * - Roll 4: Mandatory (must accept)
 * - Shows all previous rolls for comparison
 */

import { debugLog } from '../../utils/debug';
import { useState } from 'react';
import { DiceRollerScene } from './DiceRollerScene';
import { useSystemStore } from '../../store/system-store';

interface DiceRollResult {
  solidCubes: number[];
  baseTotal: number;
  bonuses: {
    highRoll: number;
    lucky64: number;
    cluster: number;
  };
  finalBudget: number;
}

export function DiceRollerFlow() {
  const setAppMode = useSystemStore((state) => state.setAppMode);
  const setResourceBudget = useSystemStore((state) => state.setResourceBudget);

  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);
  const [currentRoll, setCurrentRoll] = useState<DiceRollResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);

  const currentTry = rollHistory.length + 1;
  const maxTries = 4;
  const canReroll = currentTry < maxTries;

  const handleStartRoll = () => {
    debugLog('[DiceRollerFlow] Starting roll, try:', currentTry);
    setShowStartScreen(false);
    setIsRolling(true);
    setShowResult(false);
    setCurrentRoll(null);
  };

  const handleRollComplete = (result: DiceRollResult) => {
    debugLog('[DiceRollerFlow] Roll complete, showing result screen', result);
    setCurrentRoll(result);
    setShowResult(true);
    setIsRolling(false);
  };

  const handleAccept = (result: DiceRollResult) => {
    debugLog('[DiceRollerFlow] Accepted roll:', result);
    setResourceBudget(result.finalBudget);
    setAppMode('architect');
  };

  const handleReroll = () => {
    if (!currentRoll) return;

    // Add current roll to history
    setRollHistory(prev => [...prev, currentRoll]);

    // Start new roll
    handleStartRoll();
  };

  const handleAcceptPrevious = (result: DiceRollResult) => {
    debugLog('[DiceRollerFlow] Accepted previous roll:', result);
    setResourceBudget(result.finalBudget);
    setAppMode('architect');
  };

  const handleBypass = () => {
    debugLog('[DiceRollerFlow] Bypassing dice roll with default budget');
    setResourceBudget(20000); // Default budget for testing
    setAppMode('architect');
  };

  return (
    <div style={styles.container}>
      {/* Start Screen */}
      {showStartScreen && (
        <div style={styles.startScreen}>
          {/* Bypass button (temporary for testing) */}
          <button
            onClick={handleBypass}
            style={styles.bypassBtn}
            title="Skip to architect mode (dev only)"
          >
            bypass
          </button>

          <div style={styles.startContent}>
            <span className="mdi mdi-cube-outline" style={styles.startIcon}></span>
            <h1 className="system-title" style={styles.startTitle}>
              Roll for Resources
            </h1>
            <p className="label-text" style={styles.startText}>
              Roll the cosmic dice to determine your galaxy's resource budget
            </p>
            <div style={styles.startInfo}>
              <div style={styles.infoItem}>
                <span className="mdi mdi-dice-multiple" style={styles.infoIcon}></span>
                <span className="label-text">64 Cosmic Dice</span>
              </div>
              <div style={styles.infoItem}>
                <span className="mdi mdi-sync" style={styles.infoIcon}></span>
                <span className="label-text">Up to 4 Rolls</span>
              </div>
              <div style={styles.infoItem}>
                <span className="mdi mdi-star" style={styles.infoIcon}></span>
                <span className="label-text">Try {currentTry} of {maxTries}</span>
              </div>
            </div>
            <button
              className="hud-btn"
              onClick={handleStartRoll}
              style={styles.rollButton}
            >
              <span className="mdi mdi-play"></span>
              {currentTry === 1 ? 'Start Rolling' : 'Roll Again'}
            </button>
          </div>
        </div>
      )}

      {/* Dice Rolling Scene */}
      {isRolling && (
        <DiceRollerScene key={currentTry} onRollComplete={handleRollComplete} />
      )}

      {/* Result Screen */}
      {showResult && currentRoll && (
        <div style={styles.resultContainer}>
          <div style={styles.resultContent}>
            {/* Header */}
            <div style={styles.header}>
              <span className="mdi mdi-cube-outline" style={styles.headerIcon}></span>
              <h1 className="system-title" style={styles.headerTitle}>
                Roll {currentTry} Complete
              </h1>
            </div>

            {/* Current Roll Result */}
            <div style={styles.mainResult}>
              <div style={styles.budgetDisplay}>
                <span className="label-text" style={styles.budgetLabel}>
                  Resource Budget
                </span>
                <div style={styles.budgetValue}>
                  {currentRoll.finalBudget.toLocaleString()}
                </div>
                <span className="label-text" style={styles.budgetUnit}>
                  points
                </span>
              </div>

              {/* Breakdown */}
              <div style={styles.breakdown}>
                <div style={styles.breakdownRow}>
                  <span className="label-text">Base Total</span>
                  <span className="label-text" style={styles.breakdownValue}>
                    {currentRoll.baseTotal} × 35 = {(currentRoll.baseTotal * 35).toLocaleString()}
                  </span>
                </div>

                {currentRoll.bonuses.highRoll > 0 && (
                  <div style={styles.breakdownRow}>
                    <span className="label-text">High Roll Bonus</span>
                    <span className="label-text" style={{...styles.breakdownValue, color: 'var(--accent-green)'}}>
                      +{currentRoll.bonuses.highRoll.toLocaleString()}
                    </span>
                  </div>
                )}

                {currentRoll.bonuses.lucky64 > 0 && (
                  <div style={styles.breakdownRow}>
                    <span className="label-text">Lucky 64! 🎉</span>
                    <span className="label-text" style={{...styles.breakdownValue, color: 'var(--accent-cyan)'}}>
                      +{currentRoll.bonuses.lucky64.toLocaleString()}
                    </span>
                  </div>
                )}

                {currentRoll.bonuses.cluster > 0 && (
                  <div style={styles.breakdownRow}>
                    <span className="label-text">Cluster Bonus</span>
                    <span className="label-text" style={{...styles.breakdownValue, color: 'var(--accent-green)'}}>
                      +{currentRoll.bonuses.cluster.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Solid Cubes */}
              <div style={styles.cubesSection}>
                <span className="label-text" style={styles.cubesLabel}>
                  Solid Cubes ({currentRoll.solidCubes.length})
                </span>
                <div style={styles.cubesList}>
                  {currentRoll.solidCubes.map((cubeNum, i) => (
                    <span key={i} style={{
                      ...styles.cubeChip,
                      ...(cubeNum > 50 ? styles.cubeChipHighlight : {})
                    }}>
                      {cubeNum}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Previous Rolls */}
            {rollHistory.length > 0 && (
              <div style={styles.historySection}>
                <h3 className="label-text" style={styles.historyTitle}>
                  Previous Rolls
                </h3>
                <div style={styles.historyGrid}>
                  {rollHistory.map((roll, index) => (
                    <div key={index} style={styles.historyCard}>
                      <div style={styles.historyHeader}>
                        <span className="label-text">Roll {index + 1}</span>
                        <button
                          className="hud-btn-secondary"
                          onClick={() => handleAcceptPrevious(roll)}
                          style={styles.acceptSmallBtn}
                        >
                          Accept
                        </button>
                      </div>
                      <div style={styles.historyBudget}>
                        {roll.finalBudget.toLocaleString()} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={styles.actions}>
              {canReroll ? (
                <>
                  <button
                    className="hud-btn"
                    onClick={() => handleAccept(currentRoll)}
                    style={styles.acceptBtn}
                  >
                    <span className="mdi mdi-check"></span>
                    Accept This Roll
                  </button>
                  <button
                    className="hud-btn-secondary"
                    onClick={handleReroll}
                    style={styles.rerollBtn}
                  >
                    <span className="mdi mdi-dice-6"></span>
                    Reroll ({maxTries - currentTry} remaining)
                  </button>
                </>
              ) : (
                <button
                  className="hud-btn"
                  onClick={() => handleAccept(currentRoll)}
                  style={styles.acceptBtn}
                >
                  <span className="mdi mdi-check"></span>
                  Continue to Galaxy Builder
                </button>
              )}
            </div>

            {/* Info Text */}
            {canReroll && (
              <p className="label-text" style={styles.infoText}>
                You can accept this roll or try again. Roll 4 will be final.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  startScreen: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--bg-dark)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px'
  },
  startContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '32px',
    maxWidth: '600px',
    textAlign: 'center' as const
  },
  startIcon: {
    fontSize: '80px',
    color: 'var(--accent-cyan)'
  },
  startTitle: {
    margin: 0,
    fontSize: '48px'
  },
  startText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    margin: 0
  },
  startInfo: {
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px'
  },
  infoIcon: {
    fontSize: '24px',
    color: 'var(--accent-cyan)'
  },
  rollButton: {
    marginTop: '16px',
    minWidth: '200px'
  },
  resultContainer: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    overflow: 'auto',
    backdropFilter: 'blur(10px)'
  },
  resultContent: {
    maxWidth: '800px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    justifyContent: 'center'
  },
  headerIcon: {
    fontSize: '48px',
    color: 'var(--accent-cyan)'
  },
  headerTitle: {
    margin: 0,
    fontSize: '36px'
  },
  mainResult: {
    backgroundColor: 'var(--bg-panel)',
    border: '2px solid var(--accent-cyan)',
    borderRadius: '12px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  budgetDisplay: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px'
  },
  budgetLabel: {
    fontSize: '14px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)'
  },
  budgetValue: {
    fontSize: '48px',
    fontWeight: 'bold' as const,
    color: 'var(--accent-cyan)',
    fontFamily: 'monospace',
    lineHeight: 1
  },
  budgetUnit: {
    fontSize: '18px',
    color: 'var(--text-secondary)'
  },
  breakdown: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    padding: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px'
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  breakdownValue: {
    fontFamily: 'monospace',
    color: 'var(--text-primary)'
  },
  cubesSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  cubesLabel: {
    fontSize: '14px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)'
  },
  cubesList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px'
  },
  cubeChip: {
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 20, 147, 0.2)',
    border: '1px solid rgba(255, 20, 147, 0.4)',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'monospace',
    color: 'var(--text-primary)'
  },
  cubeChipHighlight: {
    backgroundColor: 'rgba(137, 207, 240, 0.2)',
    border: '1px solid rgba(137, 207, 240, 0.6)',
    color: 'var(--accent-cyan)'
  },
  historySection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },
  historyTitle: {
    fontSize: '14px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)',
    margin: 0
  },
  historyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  historyCard: {
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border-light)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  historyBudget: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    fontFamily: 'monospace',
    color: 'var(--text-primary)'
  },
  acceptSmallBtn: {
    padding: '4px 12px',
    fontSize: '12px'
  },
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const
  },
  acceptBtn: {
    minWidth: '200px'
  },
  rerollBtn: {
    minWidth: '200px'
  },
  infoText: {
    textAlign: 'center' as const,
    fontSize: '14px',
    color: 'var(--text-secondary)',
    margin: 0
  },
  bypassBtn: {
    position: 'fixed' as const,
    top: '16px',
    right: '16px',
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(137, 207, 240, 0.3)',
    borderRadius: '4px',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    transition: 'all 0.2s',
    opacity: 0.6,
    zIndex: 1000
  } as React.CSSProperties
};
