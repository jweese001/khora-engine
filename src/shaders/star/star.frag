//
// Star Fragment Shader (Temperature-Based with Blackbody Radiation)
// Based on unified demo - uses high/low temperature for realistic color
//

#include "../common/noise.glsl"

// Temperature-based uniforms
uniform float u_highTemp;       // High temperature in Kelvin (bright regions)
uniform float u_lowTemp;        // Low temperature in Kelvin (dark regions/sunspots)
uniform float u_scale;          // Noise scale
uniform float u_time;           // Animation time

// Sunspot parameters
uniform float u_sunspotFreq;    // Sunspot frequency (size)
uniform float u_sunspotIntensity; // Sunspot darkness intensity

// Limb darkening
uniform float u_limbDarkeningPower; // How dark edges get
uniform float u_centerBrightness;   // Center brightness multiplier

varying vec3 vTexCoord3D;
varying vec3 vNormal;
varying vec3 vPosition;

// Multi-octave noise function
const int octaves = 4;

float noise(vec3 position, float frequency, float persistence) {
  float total = 0.0;
  float maxAmplitude = 0.0;
  float amplitude = 1.0;
  for (int i = 0; i < octaves; i++) {
    total += simplex3D(position * frequency) * amplitude;
    frequency *= 2.0;
    maxAmplitude += amplitude;
    amplitude *= persistence;
  }
  return total / maxAmplitude;
}

void main() {
  // Base noise for surface variation
  float noiseBase = (noise(vTexCoord3D, 0.40, 0.7) + 1.0) / 2.0;

  // Multi-octave sunspots (cooler dark regions)
  float sunspot1 = simplex3D(vTexCoord3D * u_sunspotFreq);
  float sunspot2 = simplex3D(vTexCoord3D * u_sunspotFreq * 2.3) * 0.5;
  float sunspot3 = simplex3D(vTexCoord3D * u_sunspotFreq * 4.7) * 0.25;
  float sunspotNoise = (sunspot1 + sunspot2 + sunspot3);

  // Create discrete spots with threshold - adjusted for better visibility
  float t1 = sunspotNoise * u_sunspotIntensity - 0.8;

  // Bright spots (hotter regions) - also multi-octave
  float bright1 = simplex3D(vTexCoord3D * 0.8);
  float bright2 = simplex3D(vTexCoord3D * 1.6) * 0.5;
  float brightNoise = (bright1 + bright2) * 0.5 - 0.3;

  float ss = max(0.0, t1) * 0.3;
  float brightSpot = max(0.0, brightNoise) * 0.2;
  float total = clamp(noiseBase - ss + brightSpot, 0.0, 1.0);

  // Calculate temperature from noise
  float temp = (u_highTemp * total + (1.0 - total) * u_lowTemp);

  // ========================================================================
  // Temperature to RGB conversion (blackbody radiation approximation)
  // ========================================================================
  float i = (temp - 800.0) * 0.035068;

  // R channel buckets
  bool rbucket1 = i < 60.0;
  bool rbucket2 = i >= 60.0 && i < 236.0;
  bool rbucket3 = i >= 236.0 && i < 288.0;
  bool rbucket4 = i >= 288.0 && i < 377.0;
  bool rbucket5 = i >= 377.0 && i < 511.0;
  bool rbucket6 = i >= 511.0;

  // G channel buckets
  bool gbucket1 = i < 60.0;
  bool gbucket2 = i >= 60.0 && i < 103.0;
  bool gbucket3 = i >= 103.0 && i < 133.0;
  bool gbucket4 = i >= 133.0 && i < 174.0;
  bool gbucket5 = i >= 174.0 && i < 236.0;
  bool gbucket6 = i >= 236.0 && i < 286.0;
  bool gbucket7 = i >= 286.0 && i < 367.0;
  bool gbucket8 = i >= 367.0 && i < 511.0;
  bool gbucket9 = i >= 511.0;

  // B channel buckets
  bool bbucket1 = i < 103.0;
  bool bbucket2 = i >= 103.0 && i < 133.0;
  bool bbucket3 = i >= 133.0 && i < 173.0;
  bool bbucket4 = i >= 173.0 && i < 231.0;
  bool bbucket5 = i >= 231.0;

  float r =
    float(rbucket1) * (0.0 + i * 4.25) +
    float(rbucket2) * (255.0) +
    float(rbucket3) * (255.0 + (i - 236.0) * -2.442) +
    float(rbucket4) * (128.0 + (i - 288.0) * -0.764) +
    float(rbucket5) * (60.0 + (i - 377.0) * -0.4477) +
    float(rbucket6) * 0.0;

  float g =
     float(gbucket1) * (0.0) +
     float(gbucket2) * (0.0 + (i - 60.0) * 2.3255) +
     float(gbucket3) * (100.0 + (i - 103.0) * 4.433) +
     float(gbucket4) * (233.0 + (i - 133.0) * 0.53658) +
     float(gbucket5) * (255.0) +
     float(gbucket6) * (255.0 + (i - 236.0) * -1.24) +
     float(gbucket7) * (193.0 + (i - 286.0) * -0.7901) +
     float(gbucket8) * (129.0 + (i - 367.0) * -0.45138) +
     float(gbucket9) * (64.0 + (i - 511.0) * -0.06237);

  float b =
    float(bbucket1) * 0.0 +
    float(bbucket2) * (0.0 + (i - 103.0) * 7.0333) +
    float(bbucket3) * (211.0 + (i - 133.0) * 0.9) +
    float(bbucket4) * (247.0 + (i - 173.0) * 0.1379) +
    float(bbucket5) * 255.0;

  vec3 color = vec3(r / 255.0, g / 255.0, b / 255.0);

  // ========================================================================
  // Limb darkening effect
  // ========================================================================
  float viewDot = max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
  float limbDarkening = pow(viewDot, u_limbDarkeningPower);
  float brightness = limbDarkening * u_centerBrightness;

  // Apply limb darkening to final color
  vec3 finalColor = color * brightness;

  gl_FragColor = vec4(finalColor, 1.0);
}
