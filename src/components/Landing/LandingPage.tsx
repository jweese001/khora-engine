/**
 * Khora Engine - Landing Page
 *
 * Mode selection screen: Create (Architect) vs Explore (Astronaut)
 * First screen user sees when launching the application
 */

import { debugLog } from '../../utils/debug';
import { ModeCard } from './ModeCard';
import { useSystemStore } from '../../store/system-store';

export function LandingPage() {
  const setAppMode = useSystemStore((state) => state.setAppMode);

  const handleCreateMode = () => {
    debugLog('[LandingPage] User selected Create (Architect) mode - starting dice roll');
    setAppMode('diceRoll');
  };

  const handleExploreMode = () => {
    debugLog('[LandingPage] User selected Explore (Astronaut) mode');
    setAppMode('explorer');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brandingGroup}>
          <span className="mdi mdi-atom" style={styles.atomIcon}></span>
          <h1 className="system-title" style={styles.title}>Khora Engine</h1>
        </div>
        <p className="label-text" style={styles.subtitle}>
          Choose your journey
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div style={styles.cardContainer}>
        {/* Create (Architect Mode) */}
        <ModeCard
          title="Create"
          description="Design and construct your own galaxy. Strategically place star systems and manage finite resources to build a thriving cosmic civilization."
          icon="mdi-wrench"
          accentColor="var(--accent-cyan)"
          onClick={handleCreateMode}
        />

        {/* Explore (Astronaut Mode) */}
        <ModeCard
          title="Explore"
          description="Navigate existing galaxies as an astronaut. Chart unknown systems, mine resources, establish colonies, and defend your territories."
          icon="mdi-rocket"
          accentColor="var(--accent-green)"
          onClick={handleExploreMode}
          disabled={true} // Phase 4 feature
        />
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p className="label-text" style={styles.footerText}>
          Phase 2: Strategic Galaxy Construction
        </p>
        <p className="label-text" style={styles.versionText}>
          v2.0.0-alpha
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-dark)',
    padding: '32px',
    gap: '48px',
    overflow: 'auto'
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px'
  },
  brandingGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  atomIcon: {
    fontSize: '48px',
    color: 'var(--accent-cyan)'
  },
  title: {
    margin: 0,
    fontSize: '48px'
  },
  subtitle: {
    margin: 0,
    fontSize: '18px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em'
  },
  cardContainer: {
    display: 'flex',
    gap: '48px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '800px'
  },
  footer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px'
  },
  footerText: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-secondary)'
  },
  versionText: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--text-tertiary)'
  }
};
