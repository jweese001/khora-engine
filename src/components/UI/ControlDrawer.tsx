import { useEffect, useState } from 'react';
import { useSystemStore } from '../../store/system-store';
import { OrbitControlsSection } from './OrbitControlsSection';
import { PlanetMotionControls, ShaderControls } from '../IDE/ShaderControls';
import { GalaxyControls } from '../IDE/GalaxyControls';
import type { SelectedObject, UniformOverrideValue } from '../../types/scene';

export function ControlDrawer() {
  const controlDrawerOpen = useSystemStore((state) => state.controlDrawerOpen);
  const toggleControlDrawer = useSystemStore((state) => state.toggleControlDrawer);
  const selectedObject = useSystemStore((state) => state.selectedObject);
  const viewMode = useSystemStore((state) => state.viewMode);
  const currentSystem = useSystemStore((state) => state.currentSystem);

  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [orbitExpanded, setOrbitExpanded] = useState(false);

  const selectedLabel = selectedObject
    ? `${selectedObject.type.charAt(0).toUpperCase() + selectedObject.type.slice(1)} Selected`
    : viewMode === 'galaxy'
      ? 'Galaxy Context'
      : 'System Context';

  useEffect(() => {
    if (selectedObject) {
      setControlsExpanded(true);
      return;
    }

    setControlsExpanded(false);
  }, [selectedObject]);

  return (
    <div style={controlDrawerOpen ? { ...styles.container, ...styles.containerOpen } : styles.container}>
      {controlDrawerOpen && (
        <>
          <div style={styles.header}>
            <div style={styles.headerCopy}>
              <h2 style={styles.title}>Control Panel</h2>
              <span style={styles.subtitle}>{selectedLabel}</span>
            </div>
            <button onClick={toggleControlDrawer} style={styles.closeButton} title="Close Controls">
              ✕
            </button>
          </div>

          <div style={styles.content}>
            <AccordionSection
              title="Controls"
              icon="mdi-tune-variant"
              expanded={controlsExpanded}
              onToggle={() => {
                const nextExpanded = !controlsExpanded;
                setControlsExpanded(nextExpanded);
                if (nextExpanded) {
                  setOrbitExpanded(false);
                }
              }}
            >
              <ContextualControlsContent
                selectedObject={selectedObject}
                viewMode={viewMode}
                currentSystemName={currentSystem?.name ?? null}
              />
            </AccordionSection>

            {viewMode === 'system' && currentSystem && (
              <AccordionSection
                title="Orbit"
                icon="mdi-orbit"
                expanded={orbitExpanded}
                onToggle={() => {
                  const nextExpanded = !orbitExpanded;
                  setOrbitExpanded(nextExpanded);
                  if (nextExpanded) {
                    setControlsExpanded(false);
                  }
                }}
              >
                <OrbitControlsSection />
              </AccordionSection>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AccordionSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section style={expanded ? { ...styles.sectionRing, ...styles.sectionRingExpanded } : styles.sectionRing}>
      <button
        onClick={onToggle}
        style={expanded ? { ...styles.sectionHeader, ...styles.sectionHeaderExpanded } : styles.sectionHeader}
      >
        <div style={styles.sectionHeaderLeft}>
          <span className={`mdi ${icon}`} style={styles.sectionIcon}></span>
          <span style={styles.sectionTitle}>{title}</span>
        </div>
        <span className={`mdi ${expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'}`} style={styles.chevron}></span>
      </button>

      {expanded && <div style={styles.sectionBody}>{children}</div>}
    </section>
  );
}

function ContextualControlsContent({
  selectedObject,
  viewMode,
  currentSystemName,
}: {
  selectedObject: SelectedObject | null;
  viewMode: 'system' | 'galaxy';
  currentSystemName: string | null;
}) {
  const currentGalaxy = useSystemStore((state) => state.currentGalaxy);
  const updateUniform = useSystemStore((state) => state.updateUniform);
  const resetObjectUniforms = useSystemStore((state) => state.resetObjectUniforms);

  if (viewMode === 'galaxy' && currentGalaxy && !selectedObject) {
    return (
      <div style={styles.contextStack}>
        <div style={styles.contextCard}>
          <div className="label-text" style={styles.contextLabel}>Galaxy Context</div>
          <div style={styles.contextTitle}>{currentGalaxy.name}</div>
        </div>
        <GalaxyControls galaxy={currentGalaxy} />
      </div>
    );
  }

  if (selectedObject) {
    const objectId = selectedObject.data.id;

    const handleUniformChange = (uniformName: string, value: UniformOverrideValue) => {
      updateUniform(objectId, uniformName, value);
    };

    const handleReset = () => {
      resetObjectUniforms(objectId);
    };

    return (
      <div style={styles.contextStack}>
        <div style={styles.contextCard}>
          <div className="label-text" style={styles.contextLabel}>Selected Object</div>
          <div style={styles.contextTitle}>{selectedObject.data.name}</div>
          <div style={styles.contextMetaRow}>
            <span style={styles.contextChip}>{selectedObject.type.toUpperCase()}</span>
            {selectedObject.type === 'planet' && (
              <span style={styles.contextChip}>{selectedObject.data.type.toUpperCase()}</span>
            )}
          </div>
        </div>

        <ShaderControls
          objectType={selectedObject.type}
          objectData={selectedObject.data}
          onUniformChange={handleUniformChange}
          onReset={handleReset}
          embedded
        />

        {selectedObject.type === 'planet' && (
          <div style={styles.motionControlsBlock}>
            <PlanetMotionControls planet={selectedObject.data} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.contextCard}>
      <div className="label-text" style={styles.contextLabel}>System Context</div>
      <div style={styles.contextTitle}>{currentSystemName ?? 'No system selected'}</div>
      <p style={styles.contextText}>
        Select star, planet, or moon to reveal body-specific controls here. Orbit simulation controls stay in separate module below.
      </p>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 'min(360px, 32vw)',
    minWidth: '320px',
    height: '100vh',
    background: 'linear-gradient(180deg, rgba(14, 17, 26, 0.98), rgba(10, 12, 18, 0.98))',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 900,
    boxShadow: '18px 0 48px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,
  containerOpen: {
    transform: 'translateX(0)',
  } as React.CSSProperties,
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as React.CSSProperties,
  headerCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.56)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#858585',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: '1',
  } as React.CSSProperties,
  content: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  } as React.CSSProperties,
  sectionRing: {
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '15px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
    overflow: 'hidden',
    flexShrink: 0,
    alignSelf: 'stretch',
  } as React.CSSProperties,
  sectionRingExpanded: {
    border: '1px solid rgba(136, 247, 255, 0.28)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
    boxShadow: '0 0 0 1px rgba(136, 247, 255, 0.04)',
  } as React.CSSProperties,
  sectionHeader: {
    width: '100%',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    background: 'rgba(255,255,255,0.02)',
    color: '#ffffff',
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  } as React.CSSProperties,
  sectionHeaderExpanded: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025))',
  } as React.CSSProperties,
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  sectionIcon: {
    color: '#88f7ff',
    fontSize: '16px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
  } as React.CSSProperties,
  chevron: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: '18px',
  } as React.CSSProperties,
  sectionBody: {
    padding: '16px',
    minHeight: 0,
    overflow: 'visible',
  } as React.CSSProperties,
  contextStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minHeight: 0,
    overflow: 'visible',
  } as React.CSSProperties,
  contextCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012))',
  } as React.CSSProperties,
  motionControlsBlock: {
    marginTop: '4px',
  } as React.CSSProperties,
  contextLabel: {
    color: 'rgba(167, 245, 255, 0.72)',
    letterSpacing: '1.5px',
  } as React.CSSProperties,
  contextTitle: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.3,
  } as React.CSSProperties,
  contextMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  } as React.CSSProperties,
  contextChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '999px',
    border: '1px solid rgba(0,255,255,0.22)',
    background: 'rgba(0,255,255,0.08)',
    color: '#d9fcff',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '1px',
  } as React.CSSProperties,
  contextText: {
    margin: 0,
    color: 'rgba(255,255,255,0.72)',
    fontSize: '13px',
    lineHeight: 1.55,
  } as React.CSSProperties,
};
