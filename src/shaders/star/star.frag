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
  // Radial gradient: brighter at center, dimmer at edges
  // Use distance from center in UV space (0.5, 0.5)
  vec2 center = vec2(0.5);
  float distFromCenter = length(vUv - center);
  float radialGradient = 1.0 - smoothstep(0.0, 0.5, distFromCenter);

  // Core brightness boost (make center VERY bright for bloom)
  radialGradient = pow(radialGradient, 0.8);

  // Surface activity using simplex noise
  // Use vPosition (sphere coordinates) for consistent 3D noise
  vec3 noisePos = vPosition * 3.0 + vec3(u_seed);

  // Optional: Add slow time-based animation
  // noisePos += vec3(u_time * 0.05, 0.0, 0.0);

  // Two-octave noise for surface turbulence
  float surfaceNoise = fbm2(noisePos);

  // Mix surface activity based on u_activityLevel
  float surface = mix(1.0, 1.0 + surfaceNoise * 0.3, u_activityLevel);

  // Combine radial gradient with surface activity
  float brightness = radialGradient * surface;

  // Temperature affects overall intensity (hotter = brighter)
  // Normalize temperature: assume 3000-50000K range
  float tempNormalized = clamp((u_temperature - 3000.0) / 47000.0, 0.0, 1.0);
  float temperatureBoost = 0.5 + tempNormalized * 1.5;

  // Final star color with brightness
  vec3 finalColor = u_starColor * brightness * temperatureBoost;

  // CRITICAL: Output values > 1.0 for bloom effect
  // Bloom threshold is 0.85, so we want bright stars to exceed this
  finalColor *= 1.5; // Boost to ensure bloom activation

  gl_FragColor = vec4(finalColor, 1.0);
}
