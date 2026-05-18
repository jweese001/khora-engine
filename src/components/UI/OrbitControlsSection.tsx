import { useMemo } from 'react';
import { useSystemStore } from '../../store/system-store';

const TIME_SCALE_PRESETS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50] as const;
const MIN_TIME_SCALE = 0.01;
const MAX_TIME_SCALE = 100;
const SLIDER_STEPS = 200;

function formatTimeScale(scale: number): string {
  if (scale >= 10) {
    return `${scale.toFixed(scale % 1 === 0 ? 0 : 1)}x`;
  }

  if (scale >= 1) {
    return `${scale.toFixed(scale % 1 === 0 ? 0 : 2)}x`;
  }

  if (scale >= 0.1) {
    return `${scale.toFixed(2)}x`;
  }

  return `${scale.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}x`;
}

function sliderValueToTimeScale(sliderValue: number): number {
  const minLog = Math.log10(MIN_TIME_SCALE);
  const maxLog = Math.log10(MAX_TIME_SCALE);
  const t = sliderValue / SLIDER_STEPS;
  return Math.pow(10, minLog + t * (maxLog - minLog));
}

function timeScaleToSliderValue(scale: number): number {
  const clamped = Math.min(MAX_TIME_SCALE, Math.max(MIN_TIME_SCALE, scale));
  const minLog = Math.log10(MIN_TIME_SCALE);
  const maxLog = Math.log10(MAX_TIME_SCALE);
  const t = (Math.log10(clamped) - minLog) / (maxLog - minLog);
  return Math.round(t * SLIDER_STEPS);
}

function formatSimulationDays(days: number): string {
  if (days < 100) {
    return `${days.toFixed(1)} days`;
  }

  if (days < 1000) {
    return `${days.toFixed(0)} days`;
  }

  return `${(days / 365).toFixed(1)} yrs`;
}

export function OrbitControlsSection() {
  const simulationTimeDays = useSystemStore((state) => state.simulationTimeDays);
  const timeScale = useSystemStore((state) => state.timeScale);
  const isTimePaused = useSystemStore((state) => state.isTimePaused);
  const showOrbitTrails = useSystemStore((state) => state.showOrbitTrails);
  const setTimeScale = useSystemStore((state) => state.setTimeScale);
  const pauseTime = useSystemStore((state) => state.pauseTime);
  const resumeTime = useSystemStore((state) => state.resumeTime);
  const resetSimulationTime = useSystemStore((state) => state.resetSimulationTime);
  const toggleOrbitTrails = useSystemStore((state) => state.toggleOrbitTrails);

  const sliderValue = useMemo(() => timeScaleToSliderValue(timeScale), [timeScale]);

  return (
    <div style={styles.container}>
      <div style={styles.telemetryRow}>
        <div style={styles.metricBlock}>
          <div className="label-text" style={styles.metricLabel}>Simulation</div>
          <div style={styles.metricValue}>{formatSimulationDays(simulationTimeDays)}</div>
        </div>
        <div style={styles.metricDivider} />
        <div style={styles.metricBlock}>
          <div className="label-text" style={styles.metricLabel}>Sim Rate</div>
          <div style={styles.metricValue}>{formatTimeScale(timeScale)}</div>
        </div>
      </div>

      <div style={styles.actionsRow}>
        <button
          className="hud-btn"
          onClick={isTimePaused ? resumeTime : pauseTime}
          style={styles.primaryAction}
        >
          <span className={`mdi ${isTimePaused ? 'mdi-play' : 'mdi-pause'}`} />
          {isTimePaused ? 'Resume' : 'Pause'}
        </button>

        <button
          className="hud-btn-secondary"
          onClick={resetSimulationTime}
          style={styles.resetAction}
        >
          <span className="mdi mdi-restore" />
          Reset
        </button>
      </div>

      <div style={styles.sliderSection}>
        <div style={styles.sliderLabels}>
          <span style={styles.sliderEdgeLabel}>0.01x</span>
          <span style={styles.sliderCaption}>Days / sec</span>
          <span style={styles.sliderEdgeLabel}>100x</span>
        </div>
        <input
          type="range"
          min={0}
          max={SLIDER_STEPS}
          step={1}
          value={sliderValue}
          onChange={(event) => setTimeScale(sliderValueToTimeScale(Number(event.target.value)))}
          style={styles.slider}
        />
      </div>

      <div style={styles.presetGrid}>
        {TIME_SCALE_PRESETS.map((preset) => {
          const active = Math.abs(timeScale - preset) < 0.0001;
          return (
            <button
              key={preset}
              className="hud-btn-secondary"
              onClick={() => setTimeScale(preset)}
              style={{
                ...styles.presetChip,
                ...(active ? styles.presetChipActive : {}),
              }}
            >
              {formatTimeScale(preset)}
            </button>
          );
        })}
      </div>

      <div style={styles.toggleRow}>
        <div style={styles.toggleCopy}>
          <div className="label-text" style={styles.toggleLabel}>Orbit Trails</div>
          <div style={styles.toggleHelp}>Display orbital paths in system view</div>
        </div>
        <button
          className="hud-btn-secondary"
          onClick={toggleOrbitTrails}
          style={{
            ...styles.toggleButton,
            ...(showOrbitTrails ? styles.toggleButtonActive : {}),
          }}
        >
          <span className={`mdi ${showOrbitTrails ? 'mdi-eye-outline' : 'mdi-eye-off-outline'}`} />
          {showOrbitTrails ? 'Visible' : 'Hidden'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  } as React.CSSProperties,
  telemetryRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'stretch',
    gap: '12px',
    padding: '13px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
  } as React.CSSProperties,
  metricBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
  } as React.CSSProperties,
  metricLabel: {
    color: 'rgba(255,255,255,0.46)',
    letterSpacing: '1.4px',
  } as React.CSSProperties,
  metricValue: {
    color: 'rgba(255,255,255,0.96)',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.4px',
  } as React.CSSProperties,
  metricDivider: {
    width: '1px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.12), rgba(255,255,255,0.02))',
  } as React.CSSProperties,
  actionsRow: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    gap: '10px',
  } as React.CSSProperties,
  primaryAction: {
    justifyContent: 'center',
    minHeight: '36px',
  } as React.CSSProperties,
  resetAction: {
    justifyContent: 'center',
    minHeight: '36px',
  } as React.CSSProperties,
  sliderSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px 12px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
  } as React.CSSProperties,
  sliderLabels: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  sliderEdgeLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  sliderCaption: {
    color: 'rgba(167, 245, 255, 0.78)',
    fontSize: '10px',
    letterSpacing: '1.1px',
    textTransform: 'uppercase',
    textAlign: 'center',
  } as React.CSSProperties,
  slider: {
    width: '100%',
    accentColor: '#00ffff',
    cursor: 'pointer',
  } as React.CSSProperties,
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: '8px',
  } as React.CSSProperties,
  presetChip: {
    minHeight: '34px',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.84)',
    fontSize: '11px',
    letterSpacing: '1px',
    padding: '0 8px',
  } as React.CSSProperties,
  presetChipActive: {
    border: '1px solid rgba(0,255,255,0.42)',
    background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(0,255,255,0.26))',
    color: '#f7feff',
    boxShadow: '0 0 18px rgba(0,255,255,0.18), inset 0 0 16px rgba(0,212,255,0.08)',
  } as React.CSSProperties,
  toggleRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '2px',
  } as React.CSSProperties,
  toggleCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  } as React.CSSProperties,
  toggleLabel: {
    color: 'rgba(255,255,255,0.52)',
    letterSpacing: '1.5px',
  } as React.CSSProperties,
  toggleHelp: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: '12px',
    lineHeight: 1.4,
  } as React.CSSProperties,
  toggleButton: {
    minHeight: '34px',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: 'rgba(255,255,255,0.84)',
    fontSize: '11px',
    letterSpacing: '1px',
    padding: '0 12px',
  } as React.CSSProperties,
  toggleButtonActive: {
    border: '1px solid rgba(0,255,255,0.42)',
    background: 'linear-gradient(135deg, rgba(0,212,255,0.16), rgba(0,255,255,0.22))',
    color: '#f7feff',
    boxShadow: '0 0 18px rgba(0,255,255,0.14), inset 0 0 14px rgba(0,212,255,0.06)',
  } as React.CSSProperties,
};
