/**
 * Khora Engine - Physics Calculations
 *
 * Astrophysics formulas for realistic stellar system generation.
 * All calculations based on real physics equations.
 */

import {
  AU_TO_KM,
  SOLAR_MASS_KG,
  EARTH_MASS_KG,
  G
} from './constants';
import type { HabitableZone } from '../types/celestial-bodies';

// ============================================================================
// Habitable Zone Calculations
// ============================================================================

/**
 * Calculate the habitable zone boundaries for a star
 *
 * Based on the "Continuously Habitable Zone" model (Kasting et al. 1993)
 * Conservative estimate where liquid water can exist on a planet's surface.
 *
 * Formula:
 *   d_inner = sqrt(L / 1.1) AU
 *   d_outer = sqrt(L / 0.53) AU
 *
 * Where L is stellar luminosity in solar luminosities.
 *
 * @param luminosity - Stellar luminosity in solar luminosities
 * @returns Habitable zone inner and outer boundaries in AU
 */
export function calculateHabitableZone(luminosity: number): HabitableZone {
  // Inner boundary: too hot for liquid water (runaway greenhouse)
  const inner = Math.sqrt(luminosity / 1.1);

  // Outer boundary: too cold for liquid water (maximum greenhouse effect)
  const outer = Math.sqrt(luminosity / 0.53);

  return { inner, outer };
}

/**
 * Check if a distance from star is within the habitable zone
 *
 * @param orbitDistance - Distance from star in AU
 * @param habitableZone - The star's habitable zone boundaries
 * @returns True if within habitable zone
 */
export function isInHabitableZone(
  orbitDistance: number,
  habitableZone: HabitableZone
): boolean {
  return orbitDistance >= habitableZone.inner && orbitDistance <= habitableZone.outer;
}

// ============================================================================
// Orbital Mechanics
// ============================================================================

/**
 * Calculate orbital period using Kepler's Third Law
 *
 * Formula (simplified for circular orbits):
 *   T^2 = (4 * π^2 / (G * M)) * a^3
 *
 * Where:
 *   T = orbital period (seconds)
 *   G = gravitational constant
 *   M = mass of central body (kg)
 *   a = semi-major axis (meters)
 *
 * @param semiMajorAxis - Orbit distance in AU
 * @param stellarMass - Star mass in solar masses
 * @returns Orbital period in Earth days
 */
export function calculateOrbitalPeriod(
  semiMajorAxis: number,
  stellarMass: number
): number {
  // Convert AU to meters
  const semiMajorAxisMeters = semiMajorAxis * AU_TO_KM * 1000;

  // Convert solar masses to kg
  const stellarMassKg = stellarMass * SOLAR_MASS_KG;

  // Kepler's Third Law
  const periodSquared =
    (4 * Math.PI * Math.PI * semiMajorAxisMeters * semiMajorAxisMeters * semiMajorAxisMeters) /
    (G * stellarMassKg);

  const periodSeconds = Math.sqrt(periodSquared);

  // Convert seconds to Earth days
  const periodDays = periodSeconds / (24 * 60 * 60);

  return periodDays;
}

/**
 * Calculate orbital velocity for a circular orbit
 *
 * Formula:
 *   v = sqrt(G * M / r)
 *
 * @param orbitDistance - Distance from star in AU
 * @param stellarMass - Star mass in solar masses
 * @returns Orbital velocity in km/s
 */
export function calculateOrbitalVelocity(
  orbitDistance: number,
  stellarMass: number
): number {
  // Convert to SI units
  const orbitRadiusMeters = orbitDistance * AU_TO_KM * 1000;
  const stellarMassKg = stellarMass * SOLAR_MASS_KG;

  // Calculate velocity in m/s
  const velocityMs = Math.sqrt((G * stellarMassKg) / orbitRadiusMeters);

  // Convert to km/s
  return velocityMs / 1000;
}

/**
 * Calculate escape velocity from a celestial body
 *
 * Formula:
 *   v_escape = sqrt(2 * G * M / r)
 *
 * @param mass - Body mass in Earth masses
 * @param radius - Body radius in Earth radii
 * @returns Escape velocity in km/s
 */
export function calculateEscapeVelocity(mass: number, radius: number): number {
  // Convert to SI units
  const massKg = mass * EARTH_MASS_KG;
  const radiusMeters = radius * 6_371_000; // Earth radius in meters

  // Calculate escape velocity in m/s
  const velocityMs = Math.sqrt((2 * G * massKg) / radiusMeters);

  // Convert to km/s
  return velocityMs / 1000;
}

// ============================================================================
// Surface Temperature Calculations
// ============================================================================

/**
 * Calculate equilibrium temperature of a planet
 *
 * Simplified formula (assuming no atmosphere):
 *   T = T_star * sqrt(R_star / (2 * d))
 *
 * Where:
 *   T_star = stellar temperature (K)
 *   R_star = stellar radius (solar radii)
 *   d = orbital distance (AU)
 *
 * @param stellarTemperature - Star temperature in Kelvin
 * @param stellarRadius - Star radius in solar radii
 * @param orbitDistance - Planet distance from star in AU
 * @param albedo - Planet's bond albedo (0.0-1.0, default 0.3)
 * @returns Equilibrium temperature in Kelvin
 */
export function calculateEquilibriumTemperature(
  stellarTemperature: number,
  stellarRadius: number,
  orbitDistance: number,
  albedo: number = 0.3
): number {
  // Convert stellar radius to AU
  const stellarRadiusAU = stellarRadius * 0.00465; // Solar radius to AU conversion

  // Simplified blackbody temperature calculation
  const temperature =
    stellarTemperature *
    Math.sqrt(stellarRadiusAU / (2 * orbitDistance)) *
    Math.pow(1 - albedo, 0.25);

  return temperature;
}

/**
 * Calculate surface temperature with greenhouse effect
 *
 * Applies a simple greenhouse warming factor based on atmosphere density.
 * Real greenhouse effect is complex - this is a simplified approximation.
 *
 * @param equilibriumTemp - Base equilibrium temperature in Kelvin
 * @param atmosphereDensity - Atmosphere density (0.0-1.0)
 * @returns Surface temperature in Kelvin
 */
export function applyGreenhouseEffect(
  equilibriumTemp: number,
  atmosphereDensity: number
): number {
  // Greenhouse warming factor (1.0 = no warming, >1.0 = warming)
  // Earth has ~33K greenhouse warming with atmosphere density ~0.6
  const greenhouseFactor = 1.0 + atmosphereDensity * 0.15;

  return equilibriumTemp * greenhouseFactor;
}

// ============================================================================
// Stellar Properties
// ============================================================================

/**
 * Calculate stellar luminosity from mass (main sequence approximation)
 *
 * Formula:
 *   L ≈ M^3.5 (for M > 0.43 solar masses)
 *   L ≈ 0.23 * M^2.3 (for M ≤ 0.43 solar masses)
 *
 * @param mass - Stellar mass in solar masses
 * @returns Luminosity in solar luminosities
 */
export function calculateLuminosityFromMass(mass: number): number {
  if (mass > 0.43) {
    return Math.pow(mass, 3.5);
  } else {
    return 0.23 * Math.pow(mass, 2.3);
  }
}

/**
 * Calculate stellar radius from mass and luminosity
 *
 * Using Stefan-Boltzmann law:
 *   L = 4 * π * R^2 * σ * T^4
 *
 * For main sequence approximation:
 *   R ≈ M^0.8 (rough approximation)
 *
 * @param mass - Stellar mass in solar masses
 * @returns Radius in solar radii (approximate)
 */
export function calculateRadiusFromMass(mass: number): number {
  return Math.pow(mass, 0.8);
}

// ============================================================================
// Color Calculations
// ============================================================================

/**
 * Convert temperature to RGB color using blackbody radiation approximation
 *
 * Based on Tanner Helland's algorithm (adapted from Charity's CIE algorithm)
 * Temperature range: 1000K - 40000K
 *
 * @param temperature - Temperature in Kelvin
 * @returns RGB color as [r, g, b] where each value is 0.0-1.0
 */
export function temperatureToColor(temperature: number): [number, number, number] {
  // Clamp temperature to valid range
  const temp = Math.max(1000, Math.min(40000, temperature));

  // Work with temperature in hundreds of Kelvin
  const tempK = temp / 100;

  let red: number, green: number, blue: number;

  // Calculate red
  if (tempK <= 66) {
    red = 255;
  } else {
    red = tempK - 60;
    red = 329.698727446 * Math.pow(red, -0.1332047592);
    red = Math.max(0, Math.min(255, red));
  }

  // Calculate green
  if (tempK <= 66) {
    green = tempK;
    green = 99.4708025861 * Math.log(green) - 161.1195681661;
  } else {
    green = tempK - 60;
    green = 288.1221695283 * Math.pow(green, -0.0755148492);
  }
  green = Math.max(0, Math.min(255, green));

  // Calculate blue
  if (tempK >= 66) {
    blue = 255;
  } else if (tempK <= 19) {
    blue = 0;
  } else {
    blue = tempK - 10;
    blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
    blue = Math.max(0, Math.min(255, blue));
  }

  // Normalize to 0.0-1.0 range
  return [red / 255, green / 255, blue / 255];
}

/**
 * Interpolate between two colors
 *
 * @param color1 - First color [r, g, b]
 * @param color2 - Second color [r, g, b]
 * @param factor - Interpolation factor (0.0-1.0)
 * @returns Interpolated color [r, g, b]
 */
export function interpolateColor(
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number
): [number, number, number] {
  const f = Math.max(0, Math.min(1, factor));

  return [
    color1[0] + (color2[0] - color1[0]) * f,
    color1[1] + (color2[1] - color1[1]) * f,
    color1[2] + (color2[2] - color1[2]) * f
  ];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate Hill Sphere radius (gravitational sphere of influence)
 *
 * Useful for determining maximum stable moon orbits around a planet.
 *
 * Formula:
 *   r_H = a * (m_planet / (3 * m_star))^(1/3)
 *
 * @param planetMass - Planet mass in Earth masses
 * @param stellarMass - Star mass in solar masses
 * @param orbitDistance - Planet's orbit distance in AU
 * @returns Hill sphere radius in AU
 */
export function calculateHillSphere(
  planetMass: number,
  stellarMass: number,
  orbitDistance: number
): number {
  // Convert to solar masses for comparison
  const planetMassSolar = planetMass * (EARTH_MASS_KG / SOLAR_MASS_KG);

  const hillSphere =
    orbitDistance * Math.pow(planetMassSolar / (3 * stellarMass), 1 / 3);

  return hillSphere;
}

/**
 * Convert astronomical units to kilometers
 *
 * @param au - Distance in AU
 * @returns Distance in kilometers
 */
export function auToKm(au: number): number {
  return au * AU_TO_KM;
}

/**
 * Convert kilometers to astronomical units
 *
 * @param km - Distance in kilometers
 * @returns Distance in AU
 */
export function kmToAu(km: number): number {
  return km / AU_TO_KM;
}

/**
 * Calculate density from mass and radius
 *
 * @param mass - Mass in Earth masses
 * @param radius - Radius in Earth radii
 * @returns Density in g/cm³ (Earth = 5.51 g/cm³)
 */
export function calculateDensity(mass: number, radius: number): number {
  // Earth's density is 5.51 g/cm³
  const earthDensity = 5.51;

  // Density scales as mass / volume
  // Volume scales as radius^3
  const density = (mass / Math.pow(radius, 3)) * earthDensity;

  return density;
}

/**
 * Calculate surface gravity
 *
 * @param mass - Mass in Earth masses
 * @param radius - Radius in Earth radii
 * @returns Surface gravity in Earth gravities (Earth = 1.0)
 */
export function calculateSurfaceGravity(mass: number, radius: number): number {
  // Gravity scales as mass / radius^2
  return mass / Math.pow(radius, 2);
}
