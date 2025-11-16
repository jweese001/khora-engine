/**
 * Khora Engine - Procedural Color Palette Generator
 *
 * Generates harmonious color palettes from seeds for galaxies and planets.
 * Uses HSL color space for better control over saturation and lightness.
 */

import * as THREE from 'three';
import { SeededRandom } from './random';

/**
 * Color palette configuration
 */
export interface PaletteConfig {
  baseHue: number;        // 0-360
  saturation: number;     // 0-1
  lightness: number;      // 0-1
  harmony: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'split-complementary';
}

/**
 * Generate a 3-color gradient palette for galaxies
 * Returns [core, mid, edge] colors
 */
export function generateGalaxyPalette(
  rng: SeededRandom,
  galaxyType: 'spiral' | 'elliptical' | 'irregular' | 'barred' | 'ring'
): [THREE.Color, THREE.Color, THREE.Color] {
  // Generate base hue based on galaxy type tendencies
  let baseHue: number;
  let saturationRange: [number, number];
  let lightnessRange: [number, number];

  switch (galaxyType) {
    case 'spiral':
    case 'barred':
      // Cool to warm spectrum (blues, purples, pinks, magentas)
      baseHue = rng.random() * 120 + 200; // 200-320 (blue to magenta)
      saturationRange = [0.5, 0.8]; // Vibrant
      lightnessRange = [0.4, 0.7];
      break;

    case 'elliptical':
      // Warm spectrum (yellows, oranges, whites)
      baseHue = rng.random() * 80 + 20; // 20-100 (orange to yellow)
      saturationRange = [0.3, 0.6]; // More muted
      lightnessRange = [0.5, 0.75];
      break;

    case 'irregular':
      // Chaotic - full spectrum
      baseHue = rng.random() * 360;
      saturationRange = [0.4, 0.9];
      lightnessRange = [0.3, 0.7];
      break;

    case 'ring':
      // Cool blues and cyans
      baseHue = rng.random() * 60 + 160; // 160-220 (cyan to blue)
      saturationRange = [0.5, 0.7];
      lightnessRange = [0.4, 0.65];
      break;

    default:
      baseHue = rng.random() * 360;
      saturationRange = [0.5, 0.7];
      lightnessRange = [0.4, 0.6];
  }

  // Generate core (brightest), mid, and edge (darkest) colors
  const baseSat = rng.random() * (saturationRange[1] - saturationRange[0]) + saturationRange[0];

  // Core: Brightest and most saturated
  const coreLight = rng.random() * (lightnessRange[1] - lightnessRange[0]) + lightnessRange[0];
  const coreSat = Math.min(baseSat + 0.1, 1.0);
  const coreColor = hslToColor(baseHue, coreSat, coreLight);

  // Mid: Medium brightness, base saturation
  const midHue = (baseHue + rng.random() * 30 - 15) % 360; // Slight hue shift
  const midLight = coreLight - 0.1 - rng.random() * 0.1; // Darker than core
  const midColor = hslToColor(midHue, baseSat, midLight);

  // Edge: Darkest, slightly desaturated
  const edgeHue = (baseHue + rng.random() * 40 - 20) % 360; // More hue variation
  const edgeLight = midLight - 0.15 - rng.random() * 0.1; // Much darker
  const edgeSat = Math.max(baseSat - 0.15, 0.2); // Slightly desaturated
  const edgeColor = hslToColor(edgeHue, edgeSat, edgeLight);

  return [coreColor, midColor, edgeColor];
}

/**
 * Generate a base color for a rocky planet
 * Avoids very light colors to prevent Fresnel hotspots
 */
export function generateRockyPlanetColor(
  rng: SeededRandom,
  planetType: 'Rocky' | 'Barren'
): THREE.Color {
  let hue: number;
  let saturation: number;
  let lightness: number;

  if (planetType === 'Barren') {
    // Barren: Grays, browns, dark reds
    hue = rng.random() < 0.3 ? rng.random() * 30 : 0; // 70% gray, 30% reddish
    saturation = rng.random() * 0.2; // Very low saturation (0-0.2)
    lightness = rng.random() * 0.25 + 0.25; // Dark to medium (0.25-0.5)
  } else {
    // Rocky: Browns, tans, grays, dark greens
    const colorType = rng.random();

    if (colorType < 0.4) {
      // Brown/tan (Mars-like)
      hue = rng.random() * 30 + 15; // 15-45 (orange to yellow-brown)
      saturation = rng.random() * 0.3 + 0.3; // 0.3-0.6
      lightness = rng.random() * 0.2 + 0.3; // 0.3-0.5
    } else if (colorType < 0.7) {
      // Gray (Moon-like)
      hue = rng.random() * 30;
      saturation = rng.random() * 0.15; // 0-0.15 (very muted)
      lightness = rng.random() * 0.25 + 0.25; // 0.25-0.5
    } else {
      // Dark greenish (Earth-like terrain)
      hue = rng.random() * 60 + 80; // 80-140 (green spectrum)
      saturation = rng.random() * 0.25 + 0.2; // 0.2-0.45
      lightness = rng.random() * 0.2 + 0.25; // 0.25-0.45
    }
  }

  // Clamp lightness to prevent hotspots (max 0.65)
  lightness = Math.min(lightness, 0.65);

  return hslToColor(hue, saturation, lightness);
}

/**
 * Generate a color palette for gas giant bands (3-7 colors)
 * Avoids very light colors to prevent Fresnel hotspots
 */
export function generateGasGiantPalette(
  rng: SeededRandom,
  bandCount: number
): THREE.Color[] {
  // Choose a base palette type
  const paletteType = rng.random();
  let baseHue: number;
  let hueRange: number;
  let saturationRange: [number, number];
  let lightnessRange: [number, number];

  if (paletteType < 0.3) {
    // Jupiter-like: Browns, tans, oranges, creams
    baseHue = rng.random() * 40 + 20; // 20-60 (orange-yellow)
    hueRange = 40;
    saturationRange = [0.3, 0.6];
    lightnessRange = [0.35, 0.55]; // Avoid too light
  } else if (paletteType < 0.6) {
    // Saturn-like: Pale yellows, tans, beiges
    baseHue = rng.random() * 30 + 35; // 35-65 (yellow)
    hueRange = 30;
    saturationRange = [0.25, 0.5];
    lightnessRange = [0.4, 0.6];
  } else if (paletteType < 0.85) {
    // Neptune/Uranus-like: Blues, cyans, teals
    baseHue = rng.random() * 60 + 160; // 160-220 (cyan to blue)
    hueRange = 50;
    saturationRange = [0.4, 0.7];
    lightnessRange = [0.3, 0.55];
  } else {
    // Exotic: Purples, magentas, unusual colors
    baseHue = rng.random() * 80 + 260; // 260-340 (purple to magenta)
    hueRange = 60;
    saturationRange = [0.4, 0.7];
    lightnessRange = [0.3, 0.5];
  }

  const colors: THREE.Color[] = [];

  for (let i = 0; i < bandCount; i++) {
    const hue = (baseHue + rng.random() * hueRange - hueRange / 2) % 360;
    const saturation = rng.random() * (saturationRange[1] - saturationRange[0]) + saturationRange[0];
    const lightness = rng.random() * (lightnessRange[1] - lightnessRange[0]) + lightnessRange[0];

    // Clamp lightness to prevent hotspots (max 0.65)
    const clampedLightness = Math.min(lightness, 0.65);

    colors.push(hslToColor(hue, saturation, clampedLightness));
  }

  return colors;
}

/**
 * Generate water color for rocky planets
 * Blues with some variation
 */
export function generateWaterColor(rng: SeededRandom): THREE.Color {
  const hue = rng.random() * 30 + 180; // 180-210 (blue spectrum)
  const saturation = rng.random() * 0.3 + 0.5; // 0.5-0.8 (fairly saturated)
  const lightness = rng.random() * 0.15 + 0.25; // 0.25-0.4 (dark to prevent hotspots)

  return hslToColor(hue, saturation, lightness);
}

/**
 * Generate atmosphere color for rocky planets
 * Usually blues, can be exotic
 */
export function generateAtmosphereColor(rng: SeededRandom): THREE.Color {
  const isExotic = rng.random() < 0.1; // 10% chance of exotic atmosphere

  let hue: number;
  let saturation: number;
  let lightness: number;

  if (isExotic) {
    // Exotic: Greens, purples, oranges
    const exoticType = rng.random();
    if (exoticType < 0.33) {
      hue = rng.random() * 40 + 100; // Green
    } else if (exoticType < 0.66) {
      hue = rng.random() * 40 + 270; // Purple
    } else {
      hue = rng.random() * 30 + 20; // Orange
    }
    saturation = rng.random() * 0.4 + 0.3; // 0.3-0.7
    lightness = rng.random() * 0.2 + 0.4; // 0.4-0.6
  } else {
    // Earth-like: Blues
    hue = rng.random() * 40 + 180; // 180-220 (blue-cyan)
    saturation = rng.random() * 0.3 + 0.4; // 0.4-0.7
    lightness = rng.random() * 0.2 + 0.45; // 0.45-0.65
  }

  return hslToColor(hue, saturation, lightness);
}

/**
 * Generate base color for a moon
 * Usually grays, browns, or icy whites
 */
export function generateMoonColor(rng: SeededRandom, surfaceTemp: number): THREE.Color {
  let hue: number;
  let saturation: number;
  let lightness: number;

  // Icy moons (cold, <150K) - whites, light blues
  if (surfaceTemp < 150) {
    hue = rng.random() * 40 + 180; // 180-220 (blue spectrum)
    saturation = rng.random() * 0.2 + 0.1; // 0.1-0.3 (mostly desaturated)
    lightness = rng.random() * 0.15 + 0.45; // 0.45-0.6 (lighter, but not too bright)
  }
  // Normal moons - grays, browns
  else {
    const colorType = rng.random();

    if (colorType < 0.6) {
      // Gray (most common, like Earth's Moon)
      hue = rng.random() * 30;
      saturation = rng.random() * 0.1; // 0-0.1 (very muted)
      lightness = rng.random() * 0.2 + 0.25; // 0.25-0.45
    } else {
      // Brownish (like Io, Titan)
      hue = rng.random() * 40 + 20; // 20-60 (orange-brown)
      saturation = rng.random() * 0.25 + 0.15; // 0.15-0.4
      lightness = rng.random() * 0.2 + 0.25; // 0.25-0.45
    }
  }

  // Clamp lightness to prevent hotspots
  lightness = Math.min(lightness, 0.6);

  return hslToColor(hue, saturation, lightness);
}

/**
 * Convert HSL to THREE.Color
 */
function hslToColor(h: number, s: number, l: number): THREE.Color {
  // Normalize hue to 0-1 range for THREE.js
  const hNorm = (h % 360) / 360;

  // THREE.Color.setHSL expects h, s, l all in 0-1 range
  const color = new THREE.Color();
  color.setHSL(hNorm, s, l);

  return color;
}

/**
 * Interpolate between two colors
 */
export function interpolateColors(
  color1: THREE.Color,
  color2: THREE.Color,
  t: number
): THREE.Color {
  return new THREE.Color().lerpColors(color1, color2, t);
}
