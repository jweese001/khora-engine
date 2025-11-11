/**
 * Khora Engine - Mode Selection Card Component
 *
 * Reusable card for landing page mode selection
 * Used for Create (Architect) and Explore (Astronaut) modes
 */

import { useState } from 'react';

interface ModeCardProps {
  title: string;
  description: string;
  icon: string;           // Material Design Icon class (e.g., "mdi-wrench")
  accentColor: string;    // CSS custom property (e.g., "var(--accent-cyan)")
  onClick: () => void;
  disabled?: boolean;
}

export function ModeCard({
  title,
  description,
  icon,
  accentColor,
  onClick,
  disabled = false
}: ModeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        ...(isHovered && !disabled ? styles.cardHover : {}),
        ...(disabled ? styles.cardDisabled : {}),
        borderColor: isHovered && !disabled ? accentColor : 'var(--border-light)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        style={{
          ...styles.iconContainer,
          backgroundColor: isHovered && !disabled ? accentColor : 'transparent',
          borderColor: accentColor
        }}
      >
        <span
          className={`mdi ${icon}`}
          style={{
            ...styles.icon,
            color: isHovered && !disabled ? 'var(--bg-dark)' : accentColor
          }}
        ></span>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <h2
          className="system-title"
          style={{
            ...styles.title,
            color: isHovered && !disabled ? accentColor : 'var(--text-primary)'
          }}
        >
          {title}
        </h2>
        <p className="label-text" style={styles.description}>
          {description}
        </p>
      </div>

      {/* Disabled overlay */}
      {disabled && (
        <div style={styles.disabledOverlay}>
          <span className="label-text" style={styles.comingSoonText}>
            Coming in Phase 4
          </span>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
    padding: '48px 32px',
    backgroundColor: 'var(--bg-panel)',
    border: '2px solid var(--border-light)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '280px',
    maxWidth: '320px',
    backdropFilter: 'blur(10px)'
  },
  cardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  },
  cardDisabled: {
    cursor: 'not-allowed',
    opacity: 0.6
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    border: '2px solid',
    borderRadius: '50%',
    transition: 'all 0.3s ease'
  },
  icon: {
    fontSize: '48px',
    transition: 'color 0.3s ease'
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center' as const
  },
  title: {
    margin: 0,
    fontSize: '24px',
    transition: 'color 0.3s ease'
  },
  description: {
    margin: 0,
    lineHeight: '1.6',
    maxWidth: '260px'
  },
  disabledOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '8px',
    backdropFilter: 'blur(4px)'
  },
  comingSoonText: {
    fontSize: '14px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)'
  }
};
