//
// Enhanced Star Fragment Shader
// Multi-color control with gradient overlay and limb darkening
//

#include "../common/noise.glsl"

// Star properties
uniform vec3 u_starColor;           // Base star color
uniform vec3 u_noiseColor;          // Dark spots/cooler regions color
uniform vec3 u_centerColor;         // Center gradient color (yellow/white)
uniform float u_temperature;        // Temperature multiplier (0.5-2.0)
uniform float u_seed;               // Deterministic noise offset

// Surface activity (sunspots, prominences)
uniform float u_activityLevel;      // 0.0-1.0, how much noise affects surface
uniform float u_activityScale;      // Noise frequency (larger = smaller spots)
uniform float u_activitySpeed;      // Animation speed

// Center gradient
uniform float u_gradientStrength;   // How strong the center color is
uniform float u_gradientFalloff;    // How quickly gradient fades from center
uniform float u_gradientOpacity;    // Blend between gradient and surface noise

// Limb darkening (edges appear darker)
uniform float u_limbDarkeningPower; // Higher = darker edges
uniform float u_centerBrightness;   // Brightness boost at center

// View-dependent
uniform vec3 u_cameraPosition;      // For view calculations
uniform float u_time;               // For animation

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  // === SURFACE ACTIVITY (NOISE PATTERNS) ===
  vec3 normPos = normalize(vPosition);

  // Use seed to rotate noise sampling (preserves detail, unlike offset)
  float seedAngle = u_seed * 6.28318; // Full rotation based on seed
  mat3 rotation = mat3(
    cos(seedAngle), 0.0, sin(seedAngle),
    0.0, 1.0, 0.0,
    -sin(seedAngle), 0.0, cos(seedAngle)
  );
  vec3 rotatedPos = rotation * normPos;

  // Animated noise for surface activity
  vec3 noiseInput = rotatedPos * u_activityScale;
  noiseInput.x += u_time * u_activitySpeed;

  // Multi-octave noise for realistic surface variation
  float noise1 = simplex3D(noiseInput);
  float noise2 = simplex3D(noiseInput * 2.3) * 0.5;
  float noise3 = simplex3D(noiseInput * 4.7) * 0.25;
  float combinedNoise = noise1 + noise2 + noise3;

  // Normalize to 0.0-1.0 range
  float noiseMix = (combinedNoise + 1.0) * 0.5;

  // Blend between noise color (dark spots) and star color
  vec3 surfaceColor = mix(u_noiseColor, u_starColor, noiseMix);

  // Apply activity level (high activity = more surface variation)
  // When activity is 0, use pure starColor (uniform)
  // When activity is 1, use full surfaceColor (maximum variation)
  vec3 activityBlended = mix(u_starColor, surfaceColor, u_activityLevel);

  // === LIMB DARKENING (CENTER GRADIENT) ===
  // Calculate view direction dot product (1.0 at center, 0.0 at edges)
  float viewDot = max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);

  // Center gradient: stronger at center, fades to edges
  float centerGradient = pow(viewDot, u_gradientFalloff);

  // Blend center color with activity-blended surface using gradient
  float gradientMix = centerGradient * u_gradientStrength * u_gradientOpacity;
  vec3 gradientColor = mix(activityBlended, u_centerColor, gradientMix);

  // === FINAL BRIGHTNESS ===
  // Limb darkening: star is brighter at center, darker at edges
  float limbDarkening = pow(viewDot, u_limbDarkeningPower);

  // Apply brightness (temperature affects overall brightness)
  // Boosted back up slightly for bloom activation
  float brightness = limbDarkening * u_centerBrightness * u_temperature * 0.85;

  // Combine gradient color with brightness
  vec3 finalColor = gradientColor * brightness;

  // Clamp to valid range (bloom threshold is 0.5, so allow values >0.5)
  finalColor = clamp(finalColor, 0.0, 2.5);

  gl_FragColor = vec4(finalColor, 1.0);
}
