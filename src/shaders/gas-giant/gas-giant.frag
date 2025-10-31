//
// Gas Giant Fragment Shader
// Horizontal band patterns with turbulence for gas giants and ice giants
//

#include "../common/noise.glsl"

// Planet properties
uniform vec3 u_bandColor1;    // Primary band color
uniform vec3 u_bandColor2;    // Secondary band color
uniform vec3 u_bandColor3;    // Tertiary band color
uniform float u_bandCount;    // Number of bands (typically 5-12)
uniform float u_turbulence;   // 0.0-1.0, amount of turbulent mixing
uniform float u_seed;         // Deterministic noise offset

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  // === LATITUDE-BASED BANDS ===
  // Use Y component (up axis) for latitude bands
  vec3 normPos = normalize(vPosition);
  float latitude = normPos.y; // -1.0 (south pole) to 1.0 (north pole)

  // === TURBULENCE ===
  // Generate multiple layers of turbulence for realistic atmospheric mixing

  // Large-scale turbulence (atmospheric cells)
  vec3 noisePos1 = normPos * 1.5 + vec3(u_seed * 0.0001);
  float largeTurbulence = fbm2(noisePos1);

  // Medium-scale turbulence (storm systems)
  vec3 noisePos2 = normPos * 4.0 + vec3(u_seed * 0.0002);
  float mediumTurbulence = simplex3D(noisePos2);

  // Horizontal flow patterns (Jupiter-like zonal flows)
  // Stronger distortion in X direction, minimal in Y (preserves latitude structure)
  vec3 flowNoisePos = normPos * vec3(8.0, 1.5, 8.0) + vec3(u_seed * 0.0003);
  float flowDistortion = simplex3D(flowNoisePos);

  // Combine turbulence layers with different strengths
  float totalTurbulence = largeTurbulence * 0.6 + mediumTurbulence * 0.3 + flowDistortion * 0.5;

  // Apply turbulence to distort latitude (scaled by u_turbulence parameter)
  // CRITICAL: Keep distortion subtle - we want wavy bands, not complete chaos
  // Distortion should be ~10-20% of latitude range to preserve band structure
  float distortedLatitude = latitude + (totalTurbulence * u_turbulence * 0.15);

  // Map distorted latitude to band index (0.0-1.0 range)
  float latitudeNormalized = (distortedLatitude + 1.0) * 0.5;

  // Create bands using sine wave
  float bandPattern = sin(latitudeNormalized * u_bandCount * 3.14159 * 2.0);
  bandPattern = bandPattern * 0.5 + 0.5; // 0-1 range

  // DON'T use smoothstep - it removes all the turbulence detail!

  // === COLOR SELECTION ===
  // Blend between 3 colors based on band pattern
  vec3 finalColor;

  // Simple linear interpolation across the three band colors
  if (bandPattern < 0.5) {
    // Blend from color1 to color2 in first half
    float t = bandPattern * 2.0; // Map 0-0.5 to 0-1
    finalColor = mix(u_bandColor1, u_bandColor2, t);
  } else {
    // Blend from color2 to color3 in second half
    float t = (bandPattern - 0.5) * 2.0; // Map 0.5-1 to 0-1
    finalColor = mix(u_bandColor2, u_bandColor3, t);
  }

  // === SMALL-SCALE DETAIL ===
  // Add fine-grained atmospheric turbulence (subtle to avoid washing out bands)
  float microDetail = simplex3D(normPos * 15.0 + vec3(u_seed * 0.2)) * 0.03;
  finalColor += microDetail;

  // === BASIC LIGHTING ===
  // Gas giants are self-luminous, use minimal lighting
  vec3 lightDir = normalize(vec3(1.0, 0.5, 0.5));
  float diffuse = max(dot(vNormal, lightDir), 0.0);

  // Gentle lighting with lower ambient for darker appearance
  float lighting = 0.6 + diffuse * 0.3;
  finalColor *= lighting;

  // Clamp to valid range
  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
}
