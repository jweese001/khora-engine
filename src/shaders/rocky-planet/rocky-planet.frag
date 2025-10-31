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

  // Use seed to rotate the noise sampling, not offset it
  // This preserves detail while still making each planet unique
  float seedAngle = u_seed * 6.28318; // Seed determines rotation angle
  mat3 rotation = mat3(
    cos(seedAngle), 0.0, sin(seedAngle),
    0.0, 1.0, 0.0,
    -sin(seedAngle), 0.0, cos(seedAngle)
  );
  vec3 rotatedPos = rotation * normPos;
  vec3 noisePos = rotatedPos * 4.0;

  // Generate terrain elevation with 3 octaves
  float terrain = 0.0;
  terrain += 0.5 * simplex3D(noisePos);
  terrain += 0.25 * simplex3D(noisePos * 2.0);
  terrain += 0.125 * simplex3D(noisePos * 4.0);

  // Normalize to 0.0-1.0 range (terrain is elevation)
  terrain = terrain * 0.5 + 0.5;

  // === TERRAIN COLOR ===
  vec3 finalColor;

  // Check if planet has water
  if (u_waterCoverage > 0.3) {
    // Planet with water: show oceans at low elevations
    vec3 waterColor = vec3(0.0, 0.4, 0.7); // Deep blue
    vec3 shallowWater = vec3(0.1, 0.6, 0.9); // Lighter blue

    float waterLevel = 1.0 - u_waterCoverage;
    bool isWater = terrain < waterLevel;

    if (isWater) {
      // Water regions: blend between deep and shallow water
      float depth = clamp((waterLevel - terrain) / u_waterCoverage, 0.0, 1.0);
      finalColor = mix(shallowWater, waterColor, depth);
    } else {
      // Land regions: vary color based on elevation with better contrast
      float landElevation = clamp((terrain - waterLevel) / (1.0 - waterLevel), 0.0, 1.0);

      vec3 lowlandColor = u_baseColor * 0.6;      // Darker lowlands (coastal areas)
      vec3 midlandColor = u_baseColor * 0.9;      // Medium elevation
      vec3 highlandColor = u_baseColor * 1.2;     // Highlands
      vec3 peakColor = u_baseColor * 1.5;         // Mountain peaks

      // Smoother elevation-based blending
      if (landElevation < 0.3) {
        finalColor = mix(lowlandColor, midlandColor, landElevation / 0.3);
      } else if (landElevation < 0.6) {
        finalColor = mix(midlandColor, highlandColor, (landElevation - 0.3) / 0.3);
      } else {
        finalColor = mix(highlandColor, peakColor, (landElevation - 0.6) / 0.4);
      }

      // Add subtle small-scale texture
      float microDetail = simplex3D(normPos * 20.0) * 0.08;
      finalColor += microDetail;
    }
  } else {
    // Barren/dry planet: enhanced with geological features

    // === LARGE-SCALE REGIONAL VARIATION ===
    // Create distinct color regions (like rust patches, dark maria, etc.)
    float regionNoise = simplex3D(normPos * 1.5);

    // Define color palette based on base color
    vec3 darkRegion = u_baseColor * 0.4;        // Dark maria/lowlands
    vec3 midRegion = u_baseColor * 0.8;         // Medium terrain
    vec3 lightRegion = u_baseColor * 1.2;       // Highlands
    vec3 brightRegion = u_baseColor * 1.6;      // Bright peaks/rims

    // Add color variation (rust/iron oxide patches)
    vec3 rustColor = vec3(0.6, 0.3, 0.2);       // Reddish-brown
    float rustAmount = smoothstep(0.3, 0.7, regionNoise) * 0.3;

    // === CRACK/VALLEY FEATURES ===
    // Create bright "veins" or "cracks" like in reference images
    float crackNoise = abs(simplex3D(normPos * 8.0));
    float cracks = smoothstep(0.85, 0.95, crackNoise); // Bright cracks/ridges
    vec3 crackColor = u_baseColor * 2.0; // Bright exposed material

    // === COMBINE ELEVATION WITH REGIONS ===
    // Blend terrain elevation with regional variation
    float combinedTerrain = terrain * 0.7 + regionNoise * 0.3;

    // Use smoothstep for gradual transitions to avoid banding
    float darkToMid = smoothstep(0.0, 0.4, combinedTerrain);
    float midToLight = smoothstep(0.25, 0.65, combinedTerrain);
    float lightToBright = smoothstep(0.55, 1.0, combinedTerrain);

    // Blend colors smoothly
    finalColor = mix(darkRegion, midRegion, darkToMid);
    finalColor = mix(finalColor, lightRegion, midToLight);
    finalColor = mix(finalColor, brightRegion, lightToBright);

    // Add rust-colored patches
    finalColor = mix(finalColor, rustColor, rustAmount);

    // Add bright cracks/veins
    finalColor = mix(finalColor, crackColor, cracks * 0.4);

    // Add small-scale texture variation
    float microDetail = simplex3D(normPos * 20.0) * 0.08;
    finalColor += microDetail;
  }

  // === BASIC LIGHTING ===
  // Simple diffuse lighting (sun from upper-right)
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
  float diffuse = max(dot(vNormal, lightDir), 0.0);

  // Ambient + diffuse (higher ambient to prevent black planets)
  float lighting = 0.5 + diffuse * 0.5;
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
