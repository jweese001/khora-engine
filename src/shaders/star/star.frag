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
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  // Add subtle radial dimming (limb darkening) to help texture show
  // Calculate distance from center in normalized space
  vec3 normPos = normalize(vPosition);
  float distFromCenter = length(normPos);

  // Very gentle radial falloff (edges slightly dimmer)
  float radialDim = 1.0 - pow(distFromCenter * 0.5, 2.0); // 0.75-1.0 range

  // Surface activity using simplex noise
  vec3 noisePos = normPos * 2.5 + vec3(u_seed * 0.1);

  // Two-octave noise for surface turbulence
  float surfaceNoise = fbm2(noisePos);

  // Normalize noise to visible range
  surfaceNoise = surfaceNoise * 0.5 + 0.5; // Now 0.0-1.0

  // Stronger variation: 0.5-1.5 (100% range)
  surfaceNoise = 0.5 + surfaceNoise * 1.0;

  // Mix surface activity based on u_activityLevel
  float surface = mix(1.0, surfaceNoise, u_activityLevel);

  // Combine surface texture with radial dimming
  float brightness = surface * radialDim;

  // Temperature affects overall intensity
  float tempNormalized = clamp((u_temperature - 3000.0) / 47000.0, 0.0, 1.0);
  float temperatureBoost = 0.7 + tempNormalized * 0.6; // Brighter

  // Final star color
  vec3 finalColor = u_starColor * brightness * temperatureBoost;

  // Boost to ensure bloom activation
  finalColor *= 1.5;

  gl_FragColor = vec4(finalColor, 1.0);
}
