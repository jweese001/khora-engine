/**
 * Khora Engine - Galaxy Controls Component
 *
 * Live editing interface for galaxy particle system parameters.
 * Comprehensive controls matching the standalone demo.
 *
 * Phase 2.5: Refactored to work with multi-layer galaxy system.
 * Controls now operate on the active layer from galaxy-store.
 */

import { HexColorPicker } from 'react-colorful';
import { useState, useEffect } from 'react';
import type { Galaxy } from '../../types/galaxy';
import type { GalaxyConfig, GalaxyType } from '../../rendering/GalaxyParticleSystem';
import * as THREE from 'three';
import { useGalaxyStore } from '../../store/galaxy-store';
import { LayerSelector } from './LayerSelector';

interface GalaxyControlsProps {
  // Legacy props (optional for backward compatibility)
  galaxy?: Galaxy;
  onConfigChange?: (config: Partial<GalaxyConfig>) => void;
  onReset?: () => void;
}

export function GalaxyControls({ galaxy, onConfigChange, onReset }: GalaxyControlsProps) {
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  // Multi-layer galaxy system (Phase 2.5)
  const {
    layers,
    activeLayerId,
    markers,
    sceneManagerRef,
    updateLayerConfig,
    updateMarkerConfig,
    resetLayer
  } = useGalaxyStore();
  const activeLayer = layers[activeLayerId];

  // Track current type from active layer config
  const [currentType, setCurrentType] = useState<GalaxyType>(activeLayer.config.type || 'spiral');

  // Update currentType when active layer changes
  useEffect(() => {
    if (activeLayer.config.type) {
      setCurrentType(activeLayer.config.type);
    }
  }, [activeLayerId, activeLayer.config.type]);

  // Convert THREE.Color to hex string
  const colorToHex = (color: THREE.Color | undefined): string => {
    if (!color) return '#ffffff';
    return `#${color.getHexString()}`;
  };

  // Convert hex to RGB for THREE.Color
  const hexToColor = (hex: string): THREE.Color => {
    return new THREE.Color(hex);
  };

  // Apply config change to active layer (with legacy support)
  const applyConfigChange = (config: Partial<GalaxyConfig>) => {
    // Use multi-layer store
    updateLayerConfig(activeLayerId, config);

    // Also call legacy callback if provided
    if (onConfigChange) {
      onConfigChange(config);
    }
  };

  const handleColorChange = (colorName: string, hex: string) => {
    applyConfigChange({ [colorName]: hexToColor(hex) });
  };

  const handleTypeChange = (type: GalaxyType) => {
    setCurrentType(type);
    applyConfigChange({ type });
  };

  const handleSliderChange = (param: string, value: number) => {
    applyConfigChange({ [param]: value });
  };

  const handleReset = () => {
    // Reset active layer
    resetLayer(activeLayerId);

    // Reset local state
    setCurrentType(activeLayer.config.type || 'spiral');

    // Call legacy callback if provided
    if (onReset) {
      onReset();
    }
  };

  return (
    <div style={styles.container}>
      {/* Multi-Layer Selector (Phase 2.5) */}
      <LayerSelector />

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <span style={styles.galaxyType}>
            {activeLayer.config.type?.toUpperCase() || 'GALAXY'}
          </span>
          <span style={styles.galaxyName}>
            {activeLayer.name} {galaxy ? `• ${galaxy.name}` : ''}
          </span>
        </div>
        <button onClick={handleReset} style={styles.resetButton}>
          Reset Layer
        </button>
      </div>

      {/* Scrollable content */}
      <div style={styles.content}>
        {/* Galaxy Type Selector */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Galaxy Type</h3>
          <div style={styles.typeGrid}>
            {(['spiral', 'barred', 'elliptical', 'irregular', 'ring'] as GalaxyType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                style={{
                  ...styles.typeButton,
                  ...(currentType === type ? styles.typeButtonActive : {})
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <p style={styles.hint}>
            Change the visual galaxy type (independent of procedural generation)
          </p>
        </div>

        {/* Particle System */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Particle System</h3>

          <SliderControl
            label="Particle Count"
            value={activeLayer.config.particleCount ?? 5000}
            min={1000}
            max={15000}
            step={500}
            onChange={(v) => handleSliderChange('particleCount', v)}
          />

          <SliderControl
            label="Size Min"
            value={activeLayer.config.particleSizeMin ?? 0.5}
            min={0.1}
            max={2.0}
            step={0.1}
            onChange={(v) => handleSliderChange('particleSizeMin', v)}
          />

          <SliderControl
            label="Size Max"
            value={activeLayer.config.particleSizeMax ?? 2.5}
            min={1.0}
            max={6.0}
            step={0.1}
            onChange={(v) => handleSliderChange('particleSizeMax', v)}
          />

          <SliderControl
            label="Brightness"
            value={activeLayer.config.particleBrightness ?? 0.8}
            min={0.3}
            max={2.0}
            step={0.1}
            onChange={(v) => handleSliderChange('particleBrightness', v)}
          />

          <SliderControl
            label="Galaxy Size"
            value={activeLayer.config.size ?? 100}
            min={50}
            max={200}
            step={5}
            onChange={(v) => handleSliderChange('size', v)}
          />
        </div>

        {/* Color Scheme */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Color Scheme</h3>

          <ColorControl
            label="Core Color"
            defaultColor={colorToHex(activeLayer.config.coreColor)}
            activePicker={activeColorPicker}
            onTogglePicker={() => setActiveColorPicker(activeColorPicker === 'coreColor' ? null : 'coreColor')}
            onChange={(hex) => handleColorChange('coreColor', hex)}
          />

          <ColorControl
            label="Mid Color"
            defaultColor={colorToHex(activeLayer.config.midColor)}
            activePicker={activeColorPicker}
            onTogglePicker={() => setActiveColorPicker(activeColorPicker === 'midColor' ? null : 'midColor')}
            onChange={(hex) => handleColorChange('midColor', hex)}
          />

          <ColorControl
            label="Edge Color"
            defaultColor={colorToHex(activeLayer.config.edgeColor)}
            activePicker={activeColorPicker}
            onTogglePicker={() => setActiveColorPicker(activeColorPicker === 'edgeColor' ? null : 'edgeColor')}
            onChange={(hex) => handleColorChange('edgeColor', hex)}
          />
        </div>

        {/* Core Controls */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Core Controls</h3>
          <p style={styles.hint}>
            Fine-tune the galaxy core brightness and appearance
          </p>

          <SliderControl
            label="Core Brightness"
            value={activeLayer.config.coreBrightness ?? 0.5}
            min={0.0}
            max={1.0}
            step={0.05}
            onChange={(v) => handleSliderChange('coreBrightness', v)}
          />

          <SliderControl
            label="Core Alpha Falloff"
            value={activeLayer.config.coreAlphaFalloff ?? 0.6}
            min={0.0}
            max={1.0}
            step={0.05}
            onChange={(v) => handleSliderChange('coreAlphaFalloff', v)}
          />

          <SliderControl
            label="Core Exclusion Radius"
            value={activeLayer.config.coreExclusionRadius ?? 0.0}
            min={0.0}
            max={0.2}
            step={0.01}
            onChange={(v) => handleSliderChange('coreExclusionRadius', v)}
          />
        </div>

        {/* Animation */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Animation</h3>

          <SliderControl
            label="Animation Speed"
            value={activeLayer.config.animationSpeed ?? 0.3}
            min={0.0}
            max={2.0}
            step={0.1}
            onChange={(v) => handleSliderChange('animationSpeed', v)}
          />

          <SliderControl
            label="Rotation Speed"
            value={activeLayer.config.rotationSpeed ?? 0.005}
            min={0.0}
            max={0.05}
            step={0.005}
            onChange={(v) => handleSliderChange('rotationSpeed', v)}
          />
        </div>

        {/* Type-Specific Controls */}
        {(currentType === 'spiral' || currentType === 'barred') && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Spiral Parameters</h3>

            <SliderControl
              label="Arm Count"
              value={activeLayer.config.armCount ?? 3}
              min={2}
              max={8}
              step={1}
              onChange={(v) => handleSliderChange('armCount', v)}
            />

            <SliderControl
              label="Spiral Tightness"
              value={activeLayer.config.spiralTightness ?? 0.6}
              min={0.2}
              max={1.5}
              step={0.1}
              onChange={(v) => handleSliderChange('spiralTightness', v)}
            />

            <SliderControl
              label="Disk Thickness"
              value={activeLayer.config.diskThickness ?? 4.0}
              min={2}
              max={8}
              step={0.5}
              onChange={(v) => handleSliderChange('diskThickness', v)}
            />

            <SliderControl
              label="Core Size"
              value={activeLayer.config.coreSize ?? 0.15}
              min={0.05}
              max={0.5}
              step={0.05}
              onChange={(v) => handleSliderChange('coreSize', v)}
            />
          </div>
        )}

        {currentType === 'elliptical' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Elliptical Parameters</h3>

            <SliderControl
              label="Flattening"
              value={activeLayer.config.ellipticalFlatten ?? 0.6}
              min={0.3}
              max={1.0}
              step={0.05}
              onChange={(v) => handleSliderChange('ellipticalFlatten', v)}
            />
          </div>
        )}

        {currentType === 'irregular' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Irregular Parameters</h3>

            <SliderControl
              label="Chaos Factor"
              value={activeLayer.config.irregularChaos ?? 0.4}
              min={0.1}
              max={1.0}
              step={0.05}
              onChange={(v) => handleSliderChange('irregularChaos', v)}
            />

            <SliderControl
              label="Disk Thickness"
              value={activeLayer.config.diskThickness ?? 4.0}
              min={2}
              max={10}
              step={0.5}
              onChange={(v) => handleSliderChange('diskThickness', v)}
            />
          </div>
        )}

        {currentType === 'ring' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Ring Parameters</h3>

            <SliderControl
              label="Inner Radius"
              value={activeLayer.config.ringInnerRadius ?? 0.4}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(v) => handleSliderChange('ringInnerRadius', v)}
            />

            <SliderControl
              label="Outer Radius"
              value={activeLayer.config.ringOuterRadius ?? 0.9}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(v) => handleSliderChange('ringOuterRadius', v)}
            />

            <SliderControl
              label="Disk Thickness"
              value={activeLayer.config.diskThickness ?? 4.0}
              min={1}
              max={8}
              step={0.5}
              onChange={(v) => handleSliderChange('diskThickness', v)}
            />
          </div>
        )}

        {/* System Markers */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>System Markers</h3>

          <div style={styles.control}>
            <label style={styles.label}>
              <span>Explorable Systems</span>
              <span style={styles.labelValue}>{markers.count}</span>
            </label>
            <input
              type="number"
              min="0"
              max="200"
              value={markers.count}
              onChange={(e) => updateMarkerConfig({ count: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%',
                padding: '8px',
                background: '#3e3e42',
                border: '1px solid #3e3e42',
                borderRadius: '4px',
                color: '#cccccc',
                fontSize: '12px',
              }}
            />
          </div>

          <SliderControl
            label="Marker Size"
            value={markers.size}
            min={1}
            max={10}
            step={0.5}
            onChange={(v) => updateMarkerConfig({ size: v })}
          />

          <div style={styles.control}>
            <label style={styles.label}>
              <span>Marker Color</span>
            </label>
            <input
              type="color"
              value={markers.color}
              onChange={(e) => updateMarkerConfig({ color: e.target.value })}
              style={{
                width: '100%',
                height: '32px',
                padding: '4px',
                background: '#3e3e42',
                border: '1px solid #3e3e42',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          </div>

          <SliderControl
            label="Pulse Speed"
            value={markers.pulseFrequency}
            min={0.0}
            max={4.0}
            step={0.1}
            onChange={(v) => updateMarkerConfig({ pulseFrequency: v })}
          />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => sceneManagerRef?.generateMarkersForActiveLayer()}
              disabled={!sceneManagerRef}
              style={{
                ...styles.resetButton,
                flex: 1,
                background: '#0e639c',
                borderColor: '#007acc',
              }}
            >
              Add Markers
            </button>
            <button
              onClick={() => sceneManagerRef?.clearMarkers()}
              disabled={!sceneManagerRef}
              style={{
                ...styles.resetButton,
                flex: 1,
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={() => sceneManagerRef?.toggleMarkersVisibility()}
              disabled={!sceneManagerRef}
              style={{
                ...styles.resetButton,
                flex: 1,
              }}
            >
              {useGalaxyStore.getState().markersVisible ? 'Hide Markers' : 'Show Markers'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <input
              type="checkbox"
              checked={markers.clickable}
              onChange={(e) => updateMarkerConfig({ clickable: e.target.checked })}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label style={{ fontSize: '12px', color: '#969696', cursor: 'pointer' }}>
              Markers Clickable
            </label>
          </div>
        </div>

        {/* Future Features Note */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Coming Soon</h3>
          <div style={styles.comingSoon}>
            <p style={styles.comingSoonText}>• Preset configurations</p>
            <p style={styles.comingSoonText}>• Galaxy morphing animations</p>
            <p style={styles.comingSoonText}>• Advanced marker distribution algorithms</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Slider Control Component
interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function SliderControl({ label, value, min, max, step, onChange }: SliderControlProps) {
  const [currentValue, setCurrentValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setCurrentValue(newValue);
    onChange(newValue);
  };

  return (
    <div style={styles.control}>
      <label style={styles.label}>
        {label}
        <span style={styles.labelValue}>{currentValue.toFixed(step < 1 ? 2 : 0)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        style={styles.slider}
      />
      <div style={styles.rangeLabels}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// Reusable Color Control Component
interface ColorControlProps {
  label: string;
  defaultColor: string;
  activePicker: string | null;
  onTogglePicker: () => void;
  onChange: (hex: string) => void;
}

function ColorControl({ label, defaultColor, activePicker, onTogglePicker, onChange }: ColorControlProps) {
  const [color, setColor] = useState(defaultColor);
  const isActive = activePicker === label.toLowerCase().replace(' ', '');

  const handleColorChange = (hex: string) => {
    setColor(hex);
    onChange(hex);
  };

  return (
    <div style={styles.colorControl}>
      <label style={styles.label}>{label}</label>
      <div
        style={{
          ...styles.colorSwatch,
          backgroundColor: color
        }}
        onClick={onTogglePicker}
      />
      {isActive && (
        <div style={styles.colorPickerPopup}>
          <HexColorPicker color={color} onChange={handleColorChange} />
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1e1e1e',
  } as React.CSSProperties,
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #3e3e42',
    background: '#252526',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  galaxyType: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#007acc',
    letterSpacing: '0.5px',
    padding: '3px 8px',
    background: '#1e3a5f',
    borderRadius: '3px',
  } as React.CSSProperties,
  galaxyName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#cccccc',
  } as React.CSSProperties,
  resetButton: {
    padding: '6px 12px',
    background: '#0e639c',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  } as React.CSSProperties,
  section: {
    marginBottom: '24px',
  } as React.CSSProperties,
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#cccccc',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '8px',
  } as React.CSSProperties,
  typeButton: {
    padding: '10px 12px',
    background: '#2d2d30',
    border: '1px solid #3e3e42',
    borderRadius: '4px',
    color: '#969696',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  typeButtonActive: {
    background: '#0e639c',
    borderColor: '#007acc',
    color: '#ffffff',
  } as React.CSSProperties,
  hint: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: '#858585',
    fontStyle: 'italic',
  } as React.CSSProperties,
  control: {
    marginBottom: '16px',
  } as React.CSSProperties,
  label: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '12px',
    color: '#969696',
  } as React.CSSProperties,
  labelValue: {
    color: '#cccccc',
    fontWeight: 500,
  } as React.CSSProperties,
  slider: {
    width: '100%',
    height: '4px',
    background: '#3e3e42',
    outline: 'none',
    borderRadius: '2px',
    appearance: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
    fontSize: '10px',
    color: '#858585',
  } as React.CSSProperties,
  colorControl: {
    position: 'relative',
    marginBottom: '16px',
  } as React.CSSProperties,
  colorSwatch: {
    width: '100%',
    height: '32px',
    borderRadius: '4px',
    border: '1px solid #3e3e42',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  colorPickerPopup: {
    position: 'absolute',
    top: '40px',
    left: 0,
    zIndex: 1000,
    background: '#252526',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #3e3e42',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  } as React.CSSProperties,
  comingSoon: {
    padding: '12px',
    background: '#2d2d30',
    borderRadius: '4px',
    border: '1px solid #3e3e42',
  } as React.CSSProperties,
  comingSoonText: {
    margin: '4px 0',
    fontSize: '12px',
    color: '#858585',
  } as React.CSSProperties,
};
