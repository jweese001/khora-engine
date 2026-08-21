/**
 * Khora Engine - Scene Tree Component
 *
 * Hierarchical tree view of the Three.js scene showing system structure.
 */

import { useState } from 'react';
import { useSystemStore } from '../../store/system-store';
import type { Star, Planet, Moon } from '../../types/celestial-bodies';

export function SceneTree() {
  const currentSystem = useSystemStore((state) => state.currentSystem);
  const selectedObject = useSystemStore((state) => state.selectedObject);
  const selectObject = useSystemStore((state) => state.selectObject);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['system', 'star']));

  if (!currentSystem) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>No system generated</p>
        <p style={styles.emptyHint}>Click "Generate System" to create a star system</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isSelected = (id: string) => {
    return selectedObject?.data?.id === id;
  };

  function handleSelect(type: 'star', data: Star): void;
  function handleSelect(type: 'planet', data: Planet): void;
  function handleSelect(type: 'moon', data: Moon): void;
  function handleSelect(type: 'star' | 'planet' | 'moon', data: Star | Planet | Moon): void {
    if (type === 'star') {
      selectObject({ type, data: data as Star });
    } else if (type === 'planet') {
      selectObject({ type, data: data as Planet });
    } else {
      selectObject({ type, data: data as Moon });
    }
  }

  return (
    <div style={styles.container}>
      {/* System root */}
      <TreeNode
        label={currentSystem.name}
        icon="🌌"
        depth={0}
        isExpanded={expanded.has('system')}
        isSelected={false}
        onToggle={() => toggleExpand('system')}
      />

      {expanded.has('system') && (
        <>
          {/* Star */}
          <TreeNode
            label={currentSystem.star.name}
            icon="⭐"
            depth={1}
            isExpanded={expanded.has('star')}
            isSelected={isSelected(currentSystem.star.id)}
            onClick={() => handleSelect('star', currentSystem.star)}
            onToggle={() => toggleExpand('star')}
            hasChildren={currentSystem.star.planets.length > 0}
          />

          {/* Planets */}
          {expanded.has('star') &&
            currentSystem.star.planets.map((planet) => (
              <div key={planet.id}>
                <TreeNode
                  label={planet.name}
                  icon={getPlanetIcon(planet.type)}
                  depth={2}
                  isExpanded={expanded.has(planet.id)}
                  isSelected={isSelected(planet.id)}
                  onClick={() => handleSelect('planet', planet)}
                  onToggle={() => toggleExpand(planet.id)}
                  hasChildren={planet.moons.length > 0}
                />

                {/* Moons */}
                {expanded.has(planet.id) &&
                  planet.moons.map((moon) => (
                    <TreeNode
                      key={moon.id}
                      label={moon.name}
                      icon="🌙"
                      depth={3}
                      isExpanded={false}
                      isSelected={isSelected(moon.id)}
                      onClick={() => handleSelect('moon', moon)}
                    />
                  ))}
              </div>
            ))}
        </>
      )}
    </div>
  );
}

// Tree node component
interface TreeNodeProps {
  label: string;
  icon: string;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onClick?: () => void;
  onToggle?: () => void;
  hasChildren?: boolean;
}

function TreeNode({
  label,
  icon,
  depth,
  isExpanded,
  isSelected,
  onClick,
  onToggle,
  hasChildren = false,
}: TreeNodeProps) {
  return (
    <div
      style={{
        ...styles.node,
        paddingLeft: `${depth * 20 + 12}px`,
        background: isSelected ? '#37373d' : 'transparent',
        borderLeft: isSelected ? '2px solid #007acc' : '2px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = '#2a2d2e';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {/* Expand/collapse button */}
      {hasChildren ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          style={styles.expandButton}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      ) : (
        <span style={styles.expandPlaceholder} />
      )}

      {/* Icon and label */}
      <div
        onClick={onClick}
        style={{
          ...styles.content,
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <span style={styles.icon}>{icon}</span>
        <span style={styles.label}>{label}</span>
      </div>
    </div>
  );
}

// Helper function to get planet icon by type
function getPlanetIcon(type: string): string {
  switch (type) {
    case 'Rocky':
      return '🪨';
    case 'GasGiant':
      return '🪐';
    case 'IceGiant':
      return '🔵';
    case 'Barren':
      return '⚫';
    default:
      return '🌍';
  }
}

// Styles
const styles = {
  container: {
    padding: '8px 0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    color: '#cccccc',
  } as React.CSSProperties,
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
    textAlign: 'center',
    color: '#858585',
  } as React.CSSProperties,
  emptyText: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 600,
  } as React.CSSProperties,
  emptyHint: {
    margin: 0,
    fontSize: '12px',
    opacity: 0.7,
  } as React.CSSProperties,
  node: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'background 0.1s',
    userSelect: 'none',
  } as React.CSSProperties,
  expandButton: {
    background: 'none',
    border: 'none',
    color: '#858585',
    cursor: 'pointer',
    padding: '0 4px',
    fontSize: '10px',
    width: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  expandPlaceholder: {
    width: '16px',
    padding: '0 4px',
  } as React.CSSProperties,
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  } as React.CSSProperties,
  icon: {
    fontSize: '16px',
    lineHeight: 1,
  } as React.CSSProperties,
  label: {
    fontSize: '13px',
  } as React.CSSProperties,
};
