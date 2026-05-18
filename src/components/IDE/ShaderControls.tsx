/**
 * Khora Engine - Shader Controls Component
 *
 * Live parameter editing for celestial body shaders.
 * Based on standalone shader demos UI patterns.
 * Phase 3: Architect Mode
 */

import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import type { Star, Planet, Moon } from '../../types/celestial-bodies';
import { PlanetType } from '../../types/celestial-bodies';
import { useSystemStore } from '../../store/system-store';

// ============================================================================
// Types
// ============================================================================

interface ShaderControlsProps {
  objectType: 'star' | 'planet' | 'moon';
  objectData: Star | Planet | Moon;
  onUniformChange: (uniformName: string, value: any) => void;
  onReset: () => void;
  embedded?: boolean;
}

interface PlanetMotionControlsProps {
  planet: Planet;
}

// ============================================================================
// Component
// ============================================================================

export function ShaderControls({
  objectType,
  objectData,
  onUniformChange,
  onReset,
  embedded = false,
}: ShaderControlsProps) {

  // Star shader uniforms (temperature-based - default G-type values)
  const [starUniforms, setStarUniforms] = useState({
    highTemp: 6000,              // High temperature in Kelvin (bright regions)
    lowTemp: 5200,               // Low temperature in Kelvin (dark regions/sunspots)
    scale: 0.40,                 // Noise scale
    sunspotFreq: 4.0,            // Sunspot frequency (size)
    sunspotIntensity: 1.5,       // Sunspot darkness intensity
    limbDarkeningPower: 2.5,     // How dark edges get
    centerBrightness: 1.5,       // Center brightness multiplier
  });

  // Unified planet shader uniforms (covers all planet types)
  const [planetUniforms, setPlanetUniforms] = useState({
    // Terrain
    terrainScale: 3.0,
    terrainRoughness: 0.5,
    craterDensity: 0.0,
    continentSize: 0.5,
    biomeVariation: 0.7,

    // Colors
    baseColor: '#408758',
    mountainColor: '#8c7355',
    lowlandColor: '#4a7d59',
    desertColor: '#c2996b',
    waterColor: '#1e5a8e',
    iceColor: '#e8f4f8',
    atmosphereColor: '#87ceeb',
    cloudColor: '#ffffff',

    // Water
    waterCoverage: 0.65,
    waterSpeed: 0.3,

    // Ice Caps
    iceSize: 0.25,
    iceRoughness: 0.3,

    // Atmosphere
    atmosphereDensity: 0.6,

    // Clouds
    cloudCoverage: 0.55,
    cloudSpeed: 0.15,
    cloudNoiseType: 1,
    cloudDepth: 0.6,
    cloudShadow: 0.4,

    // Gas Giant
    bandCount: 12,
    turbulence: 0.5,
    bandSpeed: 0.1,
    stormIntensity: 0.3,
    stormColor: '#d4663a',
  });

  // Handle slider change
  const handleSliderChange = (uniformName: string, value: number) => {
    if (objectType === 'star') {
      setStarUniforms(prev => ({ ...prev, [uniformName]: value }));
    } else {
      // Planets and moons use unified planet shader
      setPlanetUniforms(prev => ({ ...prev, [uniformName]: value }));
    }
    // Add u_ prefix for actual shader uniform name
    onUniformChange(`u_${uniformName}`, value);
  };

  // Handle color change
  const handleColorChange = (uniformName: string, hexColor: string) => {
    if (objectType === 'star') {
      setStarUniforms(prev => ({ ...prev, [uniformName]: hexColor }));
    } else {
      // Planets and moons use unified planet shader
      setPlanetUniforms(prev => ({ ...prev, [uniformName]: hexColor }));
    }
    // Add u_ prefix for actual shader uniform name
    onUniformChange(`u_${uniformName}`, hexColor);
  };

  // Render controls based on object type
  const renderControls = () => {
    if (objectType === 'star') {
      return renderStarControls();
    } else if (objectType === 'planet') {
      return renderPlanetControls();
    } else {
      return renderMoonControls();
    }
  };

  // ============================================================================
  // Star Controls
  // ============================================================================

  const renderStarControls = () => (
    <>
      <div style={styles.section}>
        <h4 style={styles.sectionHeader}>Temperature (Kelvin)</h4>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            High Temperature
            <span style={styles.value}>{starUniforms.highTemp.toLocaleString()} K</span>
          </label>
          <input
            type="range"
            min="2000"
            max="50000"
            step="100"
            value={starUniforms.highTemp}
            onChange={(e) => handleSliderChange('highTemp', parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Low Temperature
            <span style={styles.value}>{starUniforms.lowTemp.toLocaleString()} K</span>
          </label>
          <input
            type="range"
            min="2000"
            max="50000"
            step="100"
            value={starUniforms.lowTemp}
            onChange={(e) => handleSliderChange('lowTemp', parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionHeader}>Surface Activity</h4>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Noise Scale
            <span style={styles.value}>{starUniforms.scale.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.01"
            value={starUniforms.scale}
            onChange={(e) => handleSliderChange('scale', parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Sunspot Frequency
            <span style={styles.value}>{starUniforms.sunspotFreq.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="1.0"
            max="15.0"
            step="0.5"
            value={starUniforms.sunspotFreq}
            onChange={(e) => handleSliderChange('sunspotFreq', parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Sunspot Intensity
            <span style={styles.value}>{starUniforms.sunspotIntensity.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={starUniforms.sunspotIntensity}
            onChange={(e) => handleSliderChange('sunspotIntensity', parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionHeader}>Limb Darkening</h4>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Limb Power
            <span style={styles.value}>{starUniforms.limbDarkeningPower.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.1"
            value={starUniforms.limbDarkeningPower}
            onChange={(e) => handleSliderChange('limbDarkeningPower', parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>
            Center Brightness
            <span style={styles.value}>{starUniforms.centerBrightness.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={starUniforms.centerBrightness}
            onChange={(e) => handleSliderChange('centerBrightness', parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>
      </div>
    </>
  );

  // ============================================================================
  // Unified Planet Controls
  // ============================================================================

  const renderPlanetControls = () => {
    const planet = objectData as Planet;
    const isGasGiant = planet.type === PlanetType.GasGiant || planet.type === PlanetType.IceGiant;
    const isRocky = planet.type === PlanetType.Rocky || planet.type === PlanetType.Barren;

    return (
      <>
        {/* Terrain Controls (Rocky/Barren only) */}
        {isRocky && (
          <div style={styles.section}>
            <h4 style={styles.sectionHeader}>Terrain</h4>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Terrain Scale
                <span style={styles.value}>{planetUniforms.terrainScale.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={planetUniforms.terrainScale}
                onChange={(e) => handleSliderChange('terrainScale', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Roughness
                <span style={styles.value}>{planetUniforms.terrainRoughness.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.terrainRoughness}
                onChange={(e) => handleSliderChange('terrainRoughness', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Crater Density
                <span style={styles.value}>{planetUniforms.craterDensity.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.craterDensity}
                onChange={(e) => handleSliderChange('craterDensity', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Continent Size
                <span style={styles.value}>{planetUniforms.continentSize.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.continentSize}
                onChange={(e) => handleSliderChange('continentSize', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Biome Variation
                <span style={styles.value}>{planetUniforms.biomeVariation.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.biomeVariation}
                onChange={(e) => handleSliderChange('biomeVariation', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>
          </div>
        )}

        {/* Colors */}
        <div style={styles.section}>
          <h4 style={styles.sectionHeader}>Colors</h4>

          <ColorControl
            label="Base Color"
            value={planetUniforms.baseColor}
            onChange={(color) => handleColorChange('baseColor', color)}
          />

          {isRocky && (
            <>
              <ColorControl
                label="Mountain Color"
                value={planetUniforms.mountainColor}
                onChange={(color) => handleColorChange('mountainColor', color)}
              />

              <ColorControl
                label="Lowland Color"
                value={planetUniforms.lowlandColor}
                onChange={(color) => handleColorChange('lowlandColor', color)}
              />

              <ColorControl
                label="Desert Color"
                value={planetUniforms.desertColor}
                onChange={(color) => handleColorChange('desertColor', color)}
              />
            </>
          )}
        </div>

        {/* Water (Rocky only) */}
        {isRocky && (
          <div style={styles.section}>
            <h4 style={styles.sectionHeader}>Water</h4>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Coverage
                <span style={styles.value}>{planetUniforms.waterCoverage.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.waterCoverage}
                onChange={(e) => handleSliderChange('waterCoverage', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Animation Speed
                <span style={styles.value}>{planetUniforms.waterSpeed.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={planetUniforms.waterSpeed}
                onChange={(e) => handleSliderChange('waterSpeed', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <ColorControl
              label="Water Color"
              value={planetUniforms.waterColor}
              onChange={(color) => handleColorChange('waterColor', color)}
            />
          </div>
        )}

        {/* Ice Caps (Rocky only) */}
        {isRocky && (
          <div style={styles.section}>
            <h4 style={styles.sectionHeader}>Ice Caps</h4>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Size
                <span style={styles.value}>{planetUniforms.iceSize.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={planetUniforms.iceSize}
                onChange={(e) => handleSliderChange('iceSize', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Roughness
                <span style={styles.value}>{planetUniforms.iceRoughness.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.iceRoughness}
                onChange={(e) => handleSliderChange('iceRoughness', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <ColorControl
              label="Ice Color"
              value={planetUniforms.iceColor}
              onChange={(color) => handleColorChange('iceColor', color)}
            />
          </div>
        )}

        {/* Atmosphere */}
        <div style={styles.section}>
          <h4 style={styles.sectionHeader}>Atmosphere</h4>

          <div style={styles.controlGroup}>
            <label style={styles.label}>
              Density
              <span style={styles.value}>{planetUniforms.atmosphereDensity.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={planetUniforms.atmosphereDensity}
              onChange={(e) => handleSliderChange('atmosphereDensity', parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>

          <ColorControl
            label="Atmosphere Color"
            value={planetUniforms.atmosphereColor}
            onChange={(color) => handleColorChange('atmosphereColor', color)}
          />
        </div>

        {/* Clouds (Rocky only) */}
        {isRocky && (
          <div style={styles.section}>
            <h4 style={styles.sectionHeader}>Clouds</h4>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Coverage
                <span style={styles.value}>{planetUniforms.cloudCoverage.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.cloudCoverage}
                onChange={(e) => handleSliderChange('cloudCoverage', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Speed
                <span style={styles.value}>{planetUniforms.cloudSpeed.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.cloudSpeed}
                onChange={(e) => handleSliderChange('cloudSpeed', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Noise Type
                <span style={styles.value}>
                  {['Cirrus', 'Cumulus', 'Storm', 'Fronts'][planetUniforms.cloudNoiseType]}
                </span>
              </label>
              <select
                value={planetUniforms.cloudNoiseType}
                onChange={(e) => handleSliderChange('cloudNoiseType', parseInt(e.target.value))}
                style={styles.select}
              >
                <option value="0">Smooth Cirrus</option>
                <option value="1">Fluffy Cumulus</option>
                <option value="2">Storm Cells</option>
                <option value="3">Weather Fronts</option>
              </select>
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Depth (3D)
                <span style={styles.value}>{planetUniforms.cloudDepth.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.cloudDepth}
                onChange={(e) => handleSliderChange('cloudDepth', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Shadow Intensity
                <span style={styles.value}>{planetUniforms.cloudShadow.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.cloudShadow}
                onChange={(e) => handleSliderChange('cloudShadow', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <ColorControl
              label="Cloud Color"
              value={planetUniforms.cloudColor}
              onChange={(color) => handleColorChange('cloudColor', color)}
            />
          </div>
        )}

        {/* Gas Giant Bands */}
        {isGasGiant && (
          <div style={styles.section}>
            <h4 style={styles.sectionHeader}>Atmospheric Bands</h4>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Band Count
                <span style={styles.value}>{planetUniforms.bandCount}</span>
              </label>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={planetUniforms.bandCount}
                onChange={(e) => handleSliderChange('bandCount', parseInt(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Turbulence
                <span style={styles.value}>{planetUniforms.turbulence.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.turbulence}
                onChange={(e) => handleSliderChange('turbulence', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Band Animation Speed
                <span style={styles.value}>{planetUniforms.bandSpeed.toFixed(3)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.01"
                value={planetUniforms.bandSpeed}
                onChange={(e) => handleSliderChange('bandSpeed', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>
                Storm Intensity
                <span style={styles.value}>{planetUniforms.stormIntensity.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={planetUniforms.stormIntensity}
                onChange={(e) => handleSliderChange('stormIntensity', parseFloat(e.target.value))}
                style={styles.slider}
              />
            </div>

            <ColorControl
              label="Storm Color"
              value={planetUniforms.stormColor}
              onChange={(color) => handleColorChange('stormColor', color)}
            />
          </div>
        )}
      </>
    );
  };

  // ============================================================================
  // Moon Controls (uses rocky shader)
  // ============================================================================

  const renderMoonControls = () => (
    <>
      <div style={styles.section}>
        <h4 style={styles.sectionHeader}>Base Properties</h4>

        <ColorControl
          label="Base Color"
          value={planetUniforms.baseColor}
          onChange={(color) => handleColorChange('baseColor', color)}
        />
      </div>

      <p style={styles.info}>
        Moons have no water or atmosphere. Only base color can be customized.
      </p>
    </>
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div style={embedded ? styles.embeddedContainer : styles.container}>
      {!embedded && (
        <div style={styles.header}>
          <h3 style={styles.title}>
            {objectType === 'star' && '⭐ Star Shader'}
            {objectType === 'planet' && '🌍 Planet Shader'}
            {objectType === 'moon' && '🌙 Moon Shader'}
          </h3>
          <p style={styles.subtitle}>Live Parameter Editing</p>
        </div>
      )}

      {embedded && (
        <div style={styles.embeddedHeader}>
          <div style={styles.embeddedTitle}>
            {objectType === 'star' && 'Star Controls'}
            {objectType === 'planet' && 'Planet Controls'}
            {objectType === 'moon' && 'Moon Controls'}
          </div>
          <div style={styles.embeddedSubtitle}>Live Parameter Editing</div>
        </div>
      )}

      <div style={embedded ? styles.embeddedContent : styles.scrollContainer}>
        {renderControls()}
      </div>

      <div style={embedded ? styles.embeddedActions : styles.actions}>
        <button
          onClick={onReset}
          style={styles.resetButton}
          className="hud-btn-secondary"
        >
          <span className="mdi mdi-restore" style={styles.buttonIcon}></span>
          Reset to Procedural
        </button>
      </div>
    </div>
  );
}

export function PlanetMotionControls({ planet }: PlanetMotionControlsProps) {
  const planetMotionOverride = useSystemStore((state) => state.planetMotionOverrides.get(planet.id));
  const updatePlanetMotionOverride = useSystemStore((state) => state.updatePlanetMotionOverride);
  const resetPlanetMotionOverrides = useSystemStore((state) => state.resetPlanetMotionOverrides);

  const rotation = {
    ...planet.generatedRotation,
    ...planetMotionOverride,
  };

  const handleMotionChange = (
    field: 'rotationPeriodHours' | 'axialTiltDegrees' | 'rotationDirection',
    value: number | 'prograde' | 'retrograde'
  ) => {
    updatePlanetMotionOverride(planet.id, { [field]: value });
  };

  return (
    <div style={styles.section}>
      <h4 style={styles.sectionHeader}>Motion</h4>

      <div style={styles.controlGroup}>
        <label style={styles.label}>
          Rotation Period
          <span style={styles.value}>{Math.round(rotation.rotationPeriodHours)} h</span>
        </label>
        <input
          type="number"
          min="1"
          max="9999"
          step="1"
          value={Math.round(rotation.rotationPeriodHours)}
          onChange={(e) => handleMotionChange('rotationPeriodHours', Math.max(1, Math.min(9999, parseInt(e.target.value, 10) || 1)))}
          style={styles.numberInput}
        />
      </div>

      <div style={styles.controlGroup}>
        <label style={styles.label}>
          Axial Tilt
          <span style={styles.value}>{rotation.axialTiltDegrees.toFixed(1)}°</span>
        </label>
        <input
          type="range"
          min="0"
          max="180"
          step="0.5"
          value={rotation.axialTiltDegrees}
          onChange={(e) => handleMotionChange('axialTiltDegrees', parseFloat(e.target.value))}
          style={styles.slider}
        />
      </div>

      <div style={styles.controlGroup}>
        <label style={styles.label}>Rotation Direction</label>
        <select
          value={rotation.rotationDirection}
          onChange={(e) => handleMotionChange('rotationDirection', e.target.value as 'prograde' | 'retrograde')}
          style={styles.select}
        >
          <option value="prograde">Prograde</option>
          <option value="retrograde">Retrograde</option>
        </select>
      </div>

      <button
        type="button"
        className="hud-btn-secondary"
        onClick={() => resetPlanetMotionOverrides(planet.id)}
        style={styles.inlineResetButton}
      >
        <span className="mdi mdi-restore" style={styles.buttonIcon}></span>
        Reset Motion
      </button>
    </div>
  );
}

// ============================================================================
// Color Control Sub-Component
// ============================================================================

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorControl({ label, value, onChange }: ColorControlProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div style={styles.controlGroup}>
      <label style={styles.label}>{label}</label>
      <div style={styles.colorInputWrapper}>
        <div
          style={{
            ...styles.colorSwatch,
            backgroundColor: value
          }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.colorInput}
          placeholder="#000000"
        />
      </div>
      {showPicker && (
        <div style={styles.pickerWrapper}>
          <div
            style={styles.pickerOverlay}
            onClick={() => setShowPicker(false)}
          />
          <div style={styles.pickerPopup}>
            <HexColorPicker color={value} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    display: 'block',
    height: 'auto',
    minHeight: 0,
    backgroundColor: 'var(--bg-panel)',
  } as React.CSSProperties,
  embeddedContainer: {
    display: 'block',
    height: 'auto',
    minHeight: 0,
    background: 'transparent',
    border: 'none',
  } as React.CSSProperties,
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-light)',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  embeddedHeader: {
    padding: '0 20px 8px',
  } as React.CSSProperties,
  embeddedTitle: {
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '4px',
  } as React.CSSProperties,
  embeddedSubtitle: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  } as React.CSSProperties,
  scrollContainer: {
    overflowY: 'visible',
    padding: '16px 20px',
  } as React.CSSProperties,
  embeddedContent: {
    overflowY: 'visible',
    padding: '8px 20px 0',
  } as React.CSSProperties,
  section: {
    marginBottom: '24px',
  } as React.CSSProperties,
  sectionHeader: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--accent-cyan)',
    paddingBottom: '6px',
  } as React.CSSProperties,
  controlGroup: {
    marginBottom: '16px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  } as React.CSSProperties,
  value: {
    float: 'right',
    color: 'var(--accent-cyan)',
    fontWeight: 600,
  } as React.CSSProperties,
  slider: {
    width: '100%',
    height: '4px',
    background: '#2a2a2a',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
  } as React.CSSProperties,
  select: {
    width: '100%',
    padding: '6px 8px',
    background: 'var(--bg-dark)',
    border: '1px solid var(--border-light)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '11px',
    cursor: 'pointer',
  } as React.CSSProperties,
  numberInput: {
    width: '100%',
    padding: '6px 8px',
    background: 'var(--bg-dark)',
    border: '1px solid var(--border-light)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '11px',
  } as React.CSSProperties,
  colorInputWrapper: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  } as React.CSSProperties,
  colorSwatch: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    border: '1px solid var(--border-light)',
    cursor: 'pointer',
    flexShrink: 0,
  } as React.CSSProperties,
  colorInput: {
    flex: 1,
    padding: '6px 8px',
    background: 'var(--bg-dark)',
    border: '1px solid var(--border-light)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '11px',
    fontFamily: 'monospace',
  } as React.CSSProperties,
  pickerWrapper: {
    position: 'relative',
  } as React.CSSProperties,
  pickerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  } as React.CSSProperties,
  pickerPopup: {
    position: 'absolute',
    top: '8px',
    left: 0,
    zIndex: 101,
    padding: '12px',
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-light)',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  } as React.CSSProperties,
  info: {
    margin: '12px 0',
    padding: '12px',
    background: 'rgba(0, 122, 204, 0.1)',
    border: '1px solid var(--accent-cyan)',
    borderRadius: '4px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  } as React.CSSProperties,
  actions: {
    padding: '16px 20px',
    borderTop: '1px solid var(--border-light)',
  } as React.CSSProperties,
  embeddedActions: {
    padding: '8px 20px 0',
  } as React.CSSProperties,
  resetButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  } as React.CSSProperties,
  inlineResetButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  } as React.CSSProperties,
  buttonIcon: {
    fontSize: '16px',
  } as React.CSSProperties,
};
