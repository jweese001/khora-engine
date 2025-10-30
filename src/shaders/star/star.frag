//
// Star Fragment Shader
// Emissive star with surface activity and bloom
//

#include "../common/noise.glsl"

uniform vec3 u_starColor;        // Spectral type color (O=blue, G=yellow, M=red)
uniform float u_temperature;     // Temperature affects intensity
uniform float u_activityLevel;   // 0.0-1.0, surface turbulence amount
uniform float u_time;            // For animated surface movement (optional)
uniform float u_seed;            // Deterministic noise offset

varying vec3 vPosition;
varying vec2 vUv;

void main() {
  // Use normalized position (center of sphere = 0,0,0) for radial gradient
  // This avoids UV pole artifacts
  float distFromCenter = length(vPosition);

  // Normalize to 0-1 range (sphere radius is 1.0 in normalized coordinates)
  // Invert so center is bright, edges are dim
  float radialGradient = 1.0 - clamp(distFromCenter, 0.0, 1.0);

  // Apply gentle power curve for smooth falloff
  radialGradient = pow(radialGradient, 0.6);

  // Surface activity using simplex noise
  // Use finer noise scale for subtle surface detail (not large blotches)
  vec3 noisePos = normalize(vPosition) * 8.0 + vec3(u_seed * 0.1);

  // Optional: Add slow time-based animation
  // noisePos += vec3(u_time * 0.05, 0.0, 0.0);

  // Two-octave noise for surface turbulence
  float surfaceNoise = fbm2(noisePos);

  // Normalize noise to subtle variation range
  // fbm2 returns roughly -1.0 to 1.0, map to 0.9-1.1 range for fine detail
  surfaceNoise = surfaceNoise * 0.5 + 0.5; // Now 0.0-1.0
  surfaceNoise = 0.9 + surfaceNoise * 0.2; // Now 0.9-1.1 (subtle)

  // Mix surface activity based on u_activityLevel
  float surface = mix(1.0, surfaceNoise, u_activityLevel * 0.5);

  // Combine radial gradient with surface activity
  float brightness = radialGradient * surface;

  // Temperature affects overall intensity (hotter = brighter)
  // Normalize temperature: assume 3000-50000K range
  float tempNormalized = clamp((u_temperature - 3000.0) / 47000.0, 0.0, 1.0);
  float temperatureBoost = 0.8 + tempNormalized * 1.2;

  // Final star color with brightness
  vec3 finalColor = u_starColor * brightness * temperatureBoost;

  // CRITICAL: Output values > 1.0 for bloom effect
  // Bloom threshold is 0.85, so we want bright stars to exceed this
  finalColor *= 2.0; // Boost to ensure bloom activation

  gl_FragColor = vec4(finalColor, 1.0);
}
