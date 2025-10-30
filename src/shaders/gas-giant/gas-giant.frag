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

  // Map latitude to band index (0.0-1.0 range)
  float latitudeNormalized = (latitude + 1.0) * 0.5;

  // Create bands using sine wave pattern
  float bandPattern = sin(latitudeNormalized * u_bandCount * 3.14159 * 2.0) * 0.5 + 0.5;

  // === TURBULENCE ===
  // Add horizontal turbulence to bands
  vec3 noisePos = normPos * 3.0 + vec3(u_seed * 0.1);

  // Use 2-octave noise for turbulent swirls
  float turbulenceNoise = fbm2(noisePos);
  turbulenceNoise = turbulenceNoise * 0.5 + 0.5; // Normalize to 0-1

  // Mix turbulence into band pattern
  bandPattern = mix(bandPattern, turbulenceNoise, u_turbulence * 0.3);

  // === COLOR SELECTION ===
  // Map band pattern to 3 colors
  vec3 finalColor;

  if (bandPattern < 0.33) {
    // Blend between color 1 and 2
    float t = bandPattern / 0.33;
    finalColor = mix(u_bandColor1, u_bandColor2, t);
  } else if (bandPattern < 0.67) {
    // Blend between color 2 and 3
    float t = (bandPattern - 0.33) / 0.34;
    finalColor = mix(u_bandColor2, u_bandColor3, t);
  } else {
    // Blend between color 3 and 1 (wrap around)
    float t = (bandPattern - 0.67) / 0.33;
    finalColor = mix(u_bandColor3, u_bandColor1, t);
  }

  // === SMALL-SCALE DETAIL ===
  // Add fine-grained atmospheric turbulence
  float microDetail = simplex3D(normPos * 15.0 + vec3(u_seed * 0.2)) * 0.08;
  finalColor += microDetail;

  // === BASIC LIGHTING ===
  // Simple diffuse lighting
  vec3 lightDir = normalize(vec3(1.0, 0.5, 0.5));
  float diffuse = max(dot(vNormal, lightDir), 0.0);

  // Ambient + diffuse (higher ambient for visibility)
  float lighting = 0.5 + diffuse * 0.5;
  finalColor *= lighting;

  // Clamp to valid range
  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, 1.0);
}
