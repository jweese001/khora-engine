//
// Rocky Planet Fragment Shader
// Procedural terrain with elevation-based coloring, water coverage, and atmosphere glow
//

#include "../common/noise.glsl"

// Planet properties
uniform vec3 u_baseColor;           // Base terrain color (e.g., brown for rocky, gray for barren)
uniform float u_waterCoverage;      // 0.0-1.0, percentage of surface covered by water
uniform float u_atmosphereDensity;  // 0.0-1.0, affects glow strength
uniform vec3 u_atmosphereColor;     // RGB color of atmosphere (e.g., blue for Earth-like)
uniform float u_seed;               // Deterministic noise offset
uniform bool u_hasAtmosphere;       // Whether planet has an atmosphere

// View-dependent
uniform vec3 u_cameraPosition;      // For atmosphere Fresnel effect

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  // === TERRAIN ELEVATION ===
  // Use 3-octave FBM for realistic terrain variation
  vec3 normPos = normalize(vPosition);
  vec3 noisePos = normPos * 4.0 + vec3(u_seed * 0.1);

  // Generate terrain elevation with 3 octaves
  float terrain = 0.0;
  terrain += 0.5 * simplex3D(noisePos);
  terrain += 0.25 * simplex3D(noisePos * 2.0);
  terrain += 0.125 * simplex3D(noisePos * 4.0);

  // Normalize to 0.0-1.0 range (terrain is elevation)
  terrain = terrain * 0.5 + 0.5;

  // === WATER LEVEL ===
  // Water appears at low elevations if waterCoverage > 0.3
  vec3 waterColor = vec3(0.0, 0.4, 0.7); // Deep blue

  // Determine if this fragment is underwater
  // Water level threshold based on waterCoverage (0.3 = 30% water, 0.7 = 70% water)
  float waterLevel = 1.0 - u_waterCoverage;
  bool isWater = u_waterCoverage > 0.3 && terrain < waterLevel;

  // === TERRAIN COLOR ===
  vec3 finalColor;

  if (isWater) {
    // Water regions: blend between deep and shallow water
    float depth = (waterLevel - terrain) / u_waterCoverage;
    vec3 shallowWater = vec3(0.1, 0.6, 0.9); // Lighter blue
    finalColor = mix(shallowWater, waterColor, depth);
  } else {
    // Land regions: vary color based on elevation
    // Low elevations (near water) - darker terrain
    // Mid elevations - base terrain color
    // High elevations - lighter/rocky color

    float landElevation = (terrain - waterLevel) / (1.0 - waterLevel);

    vec3 lowlandColor = u_baseColor * 0.7;      // Darker lowlands
    vec3 midlandColor = u_baseColor;            // Base color
    vec3 highlandColor = u_baseColor * 1.3;     // Lighter highlands

    if (landElevation < 0.4) {
      // Lowlands: dark to base color
      finalColor = mix(lowlandColor, midlandColor, landElevation / 0.4);
    } else if (landElevation < 0.7) {
      // Midlands: base color
      finalColor = midlandColor;
    } else {
      // Highlands: base to light color
      finalColor = mix(midlandColor, highlandColor, (landElevation - 0.7) / 0.3);
    }

    // Add small-scale texture variation
    float microDetail = simplex3D(normPos * 20.0) * 0.1;
    finalColor += microDetail;
  }

  // === BASIC LIGHTING ===
  // Simple diffuse lighting (sun from upper-right)
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
  float diffuse = max(dot(vNormal, lightDir), 0.0);

  // Ambient + diffuse
  float lighting = 0.3 + diffuse * 0.7;
  finalColor *= lighting;

  // === ATMOSPHERE GLOW (Fresnel) ===
  if (u_hasAtmosphere && u_atmosphereDensity > 0.01) {
    // Fresnel effect: glow at edges when viewing at grazing angles
    vec3 viewDir = normalize(u_cameraPosition - vWorldPosition);
    float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
    fresnel = pow(fresnel, 3.0); // Sharper falloff

    // Atmosphere glow strength based on density
    vec3 atmosphereGlow = u_atmosphereColor * fresnel * u_atmosphereDensity * 0.5;

    // Add glow to final color
    finalColor += atmosphereGlow;
  }

  // Clamp to valid range
  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
}
