//
// Planet Fragment Shader (Unified - Rocky/Gas/Ice)
// Three rendering modes: 0=Rocky, 1=Gas Giant, 2=Ice Giant
//

#include "../common/noise.glsl"

uniform float u_time;
uniform vec3 u_lightPosition;
uniform int u_planetMode; // 0=Rocky, 1=Gas, 2=Ice

// Terrain
uniform float u_terrainScale;
uniform float u_terrainRoughness;
uniform float u_craterDensity;
uniform float u_continentSize;
uniform float u_biomeVariation;
uniform vec3 u_baseColor;
uniform vec3 u_mountainColor;
uniform vec3 u_lowlandColor;
uniform vec3 u_desertColor;

// Water
uniform float u_waterCoverage;
uniform float u_waterSpeed;
uniform vec3 u_waterColor;

// Ice Caps
uniform float u_iceSize;
uniform float u_iceRoughness;
uniform vec3 u_iceColor;

// Atmosphere
uniform float u_atmosphereDensity;
uniform vec3 u_atmosphereColor;

// Clouds
uniform float u_cloudCoverage;
uniform float u_cloudSpeed;
uniform float u_cloudNoiseType;
uniform float u_cloudDepth;
uniform float u_cloudShadow;
uniform vec3 u_cloudColor;

// Gas Giant
uniform float u_bandCount;
uniform float u_turbulence;
uniform float u_bandSpeed;
uniform float u_stormIntensity;
uniform vec3 u_stormColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

// ============================================================================
// Fractal Brownian Motion
// ============================================================================
float fbm(vec3 p, int octaves, float roughness) {
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maxValue = 0.0;

  for(int i = 0; i < 8; i++) {
    if(i >= octaves) break;
    value += amplitude * simplex3D(p * frequency);
    maxValue += amplitude;
    amplitude *= roughness;
    frequency *= 2.0;
  }

  return value / maxValue;
}

// ============================================================================
// Crater Generation
// ============================================================================
float craterNoise(vec3 p, float density) {
  if(density < 0.01) return 0.0;

  float craters = 0.0;
  // Multiple scales of craters
  float large = fbm(p * 2.0, 2, 0.5);
  float medium = fbm(p * 6.0, 2, 0.5);
  float small = fbm(p * 15.0, 2, 0.5);

  // Create crater-like depressions
  large = pow(max(0.0, large), 2.0) * -1.0;
  medium = pow(max(0.0, medium), 2.0) * -0.5;
  small = pow(max(0.0, small), 2.0) * -0.25;

  craters = (large + medium + small) * density;
  return craters;
}

// ============================================================================
// Cloud Noise Types
// ============================================================================
float getCloudNoise(vec3 p, float noiseType, float animTime) {
  vec3 animPos = p + vec3(animTime * 0.2, animTime * 0.1, 0.0);

  // Type 0: Smooth cirrus
  if(noiseType < 0.5) {
    return fbm(animPos * 3.0, 2, 0.4);
  }
  // Type 1: Fluffy cumulus
  else if(noiseType < 1.5) {
    float base = fbm(animPos * 2.5, 3, 0.6);
    float detail = fbm(animPos * 8.0, 2, 0.5);
    return pow(max(0.0, base), 1.5) + detail * 0.2;
  }
  // Type 2: Storm cells
  else if(noiseType < 2.5) {
    float cells = fbm(animPos * 1.8, 2, 0.7);
    float turbulence = fbm(animPos * 6.0, 3, 0.6);
    return pow(max(0.0, cells), 2.0) + turbulence * 0.3;
  }
  // Type 3: Weather fronts
  else {
    float fronts = fbm(animPos * vec3(4.0, 2.0, 4.0), 2, 0.5);
    float swirls = fbm(animPos * 3.5 + vec3(0.0, animTime * 0.3, 0.0), 2, 0.6);
    return fronts * 0.7 + swirls * 0.4;
  }
}

// ============================================================================
// Rocky/Terrestrial Planet Renderer
// ============================================================================
vec3 renderRockyPlanet() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(u_lightPosition - vPosition);
  vec3 viewDir = normalize(vViewPosition);

  // Terrain elevation
  float elevation = fbm(vPosition * u_terrainScale, 4, u_terrainRoughness);

  // Add craters
  float craters = craterNoise(vPosition, u_craterDensity);
  elevation += craters;

  // Adjust continent size - shifts elevation to create more/less land
  // Range: -0.5 to 0.5, where positive = more land, negative = more water
  elevation += (u_continentSize - 0.5);

  // Base terrain color
  vec3 terrainColor = u_baseColor;

  // Biome-based color variation
  if(u_biomeVariation > 0.0) {
    // Calculate climate parameters
    float latitude = abs(vPosition.y / length(vPosition));
    float temperature = 1.0 - latitude; // Warmer at equator
    temperature += elevation * 0.3; // Cooler at high elevations

    // Regional moisture variation
    float moisture = fbm(vPosition * 1.5, 3, 0.6) * 0.5 + 0.5;

    // Use user-selected biome colors with variations
    vec3 mountainColor = u_mountainColor;
    vec3 lowlandColor = u_lowlandColor;
    vec3 desertColor = u_desertColor;
    vec3 tundraColor = mix(lowlandColor, vec3(0.6, 0.65, 0.6), 0.5); // Blend lowland with gray
    vec3 forestColor = lowlandColor * 0.7; // Darker lowland color
    vec3 grasslandColor = lowlandColor * 1.1; // Lighter lowland color

    // Determine biome based on temperature and moisture
    vec3 biomeColor = terrainColor;

    if(elevation > 0.3) {
      // High elevation = mountains
      float mountainVar = fbm(vPosition * 5.0, 2, 0.5) * 0.3;
      biomeColor = mix(mountainColor, mountainColor * 0.7, mountainVar);
    } else if(temperature > 0.7 && moisture < 0.4) {
      // Hot and dry = desert
      float desertVar = fbm(vPosition * 4.0, 2, 0.5) * 0.2;
      biomeColor = desertColor + vec3(desertVar);
    } else if(temperature < 0.4) {
      // Cold = tundra
      biomeColor = mix(tundraColor, tundraColor * 0.8, moisture);
    } else if(moisture > 0.6 && temperature > 0.5) {
      // Warm and wet = forest
      float forestShade = fbm(vPosition * 6.0, 2, 0.5) * 0.3;
      biomeColor = mix(forestColor, forestColor * 0.6, forestShade);
    } else if(moisture > 0.4) {
      // Moderate moisture = grassland
      float grassVar = fbm(vPosition * 3.0, 2, 0.5) * 0.2;
      biomeColor = mix(grasslandColor, grasslandColor * 0.9, grassVar);
    } else {
      // Dry temperate = light grassland/steppe
      biomeColor = mix(grasslandColor, desertColor, 0.5);
    }

    // Blend biome color with base color based on variation strength
    terrainColor = mix(terrainColor, biomeColor, u_biomeVariation);

    // Add subtle noise variation
    float colorVar = fbm(vPosition * 5.0, 2, 0.5) * 0.1;
    terrainColor += vec3(colorVar);
  } else {
    // Simple color variation when biomes disabled
    float colorVar = fbm(vPosition * 5.0, 2, 0.5) * 0.2;
    terrainColor += vec3(colorVar);

    // Height-based color variation
    if(elevation > 0.2) {
      terrainColor *= 0.8; // Darker mountains
    } else if(elevation < -0.1) {
      terrainColor *= 1.1; // Lighter valleys
    }
  }

  // Basic lighting
  float diffuse = max(0.0, dot(normal, lightDir));
  terrainColor *= (0.4 + diffuse * 0.6);

  vec3 finalColor = terrainColor;

  // Water layer
  if(u_waterCoverage > 0.0 && elevation < (u_waterCoverage - 0.5)) {
    vec3 waterColor = u_waterColor;

    // Animated waves
    float waveTime = u_time * u_waterSpeed;
    vec3 wavePos = vPosition * 8.0 + vec3(waveTime * 0.5);
    float waves = fbm(wavePos, 3, 0.5) * 0.1;
    waterColor += vec3(waves);

    // Water lighting
    float waterDiffuse = max(0.0, dot(normal, lightDir));
    waterColor *= (0.5 + waterDiffuse * 0.5);

    // Specular highlight
    vec3 halfVector = normalize(lightDir + viewDir);
    float specular = pow(max(0.0, dot(normal, halfVector)), 32.0);
    waterColor += vec3(specular * 0.8);

    finalColor = waterColor;
  }

  // Ice Caps
  if(u_iceSize > 0.0) {
    float latitude = vPosition.y / length(vPosition);
    float iceThreshold = 1.0 - u_iceSize;
    float iceFactor = smoothstep(iceThreshold - 0.1, iceThreshold, abs(latitude));

    if(iceFactor > 0.01) {
      // Ice texture with noise
      float iceNoise = fbm(vPosition * 8.0, 3, u_iceRoughness);
      vec3 iceColor = u_iceColor + vec3(iceNoise * 0.1);

      // Ice lighting
      float diffuse = max(0.0, dot(normal, lightDir));
      iceColor *= (0.6 + diffuse * 0.4);

      // Ice specular (shiny ice)
      vec3 halfVector = normalize(lightDir + viewDir);
      float specular = pow(max(0.0, dot(normal, halfVector)), 16.0);
      iceColor += vec3(specular * 0.3);

      finalColor = mix(finalColor, iceColor, iceFactor);
    }
  }

  // Clouds with depth and shadows
  float cloudMask = 0.0;
  if(u_cloudCoverage > 0.0) {
    float animTime = u_time * u_cloudSpeed;
    float cloudNoise = getCloudNoise(vPosition, u_cloudNoiseType, animTime);

    float bias = (u_cloudCoverage - 0.5);
    cloudNoise = clamp(cloudNoise + bias, 0.0, 1.0);
    cloudMask = smoothstep(0.35, 0.65, cloudNoise);

    if(cloudMask > 0.01) {
      vec3 cloudColor = u_cloudColor;
      float cloudLighting = max(0.3, dot(normal, lightDir));

      // 3D depth effect - clouds are thicker and darker at center
      float cloudThickness = cloudMask * u_cloudDepth;
      cloudColor *= mix(1.0, 0.7, cloudThickness);
      cloudColor *= cloudLighting;

      // Blend clouds over surface
      finalColor = mix(finalColor, cloudColor, cloudMask * 0.85);
    }

    // Cloud shadows on surface below
    if(u_cloudShadow > 0.0 && cloudMask < 0.95) {
      // Sample clouds slightly offset (simulate sun angle)
      vec3 shadowSamplePos = vPosition + lightDir * 0.15;
      float shadowCloudNoise = getCloudNoise(shadowSamplePos, u_cloudNoiseType, animTime);

      float bias = (u_cloudCoverage - 0.5);
      shadowCloudNoise = clamp(shadowCloudNoise + bias, 0.0, 1.0);
      float shadowMask = smoothstep(0.35, 0.65, shadowCloudNoise);

      // Darken surface where clouds cast shadows
      finalColor *= mix(1.0, 0.6, shadowMask * u_cloudShadow * (1.0 - cloudMask));
    }
  }

  // Atmosphere glow
  if(u_atmosphereDensity > 0.0) {
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
    vec3 atmosphereGlow = u_atmosphereColor * fresnel * u_atmosphereDensity;
    finalColor += atmosphereGlow * 0.5;
  }

  return finalColor;
}

// ============================================================================
// Gas Giant Renderer
// ============================================================================
vec3 renderGasGiant() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(u_lightPosition - vPosition);
  vec3 viewDir = normalize(vViewPosition);

  // Latitude for horizontal bands
  float latitude = vPosition.y / length(vPosition);

  // Base band pattern (handle bandCount = 0)
  float bands = 0.5;
  if(u_bandCount > 0.0) {
    bands = sin(latitude * u_bandCount * 3.14159) * 0.5 + 0.5;
  }

  // Add turbulence to bands
  vec3 turbPos = vPosition + vec3(u_time * u_bandSpeed, 0.0, 0.0);
  float turbulence = fbm(turbPos * 3.0, 4, 0.6) * u_turbulence;
  bands += turbulence;

  // Storm cells (Great Red Spot style)
  float storms = 0.0;
  if(u_stormIntensity > 0.0) {
    // Larger scale for more prominent storm cells
    float stormNoise = fbm(vPosition * 1.8, 3, 0.7);
    // Less aggressive power for more visible effect
    storms = pow(max(0.0, stormNoise), 1.2) * u_stormIntensity * 1.5;
  }

  // Combine patterns
  float pattern = clamp(bands + storms * 0.5, 0.0, 1.0);

  // Color based on pattern
  vec3 color1 = u_baseColor;
  vec3 color2 = u_baseColor * 0.6;
  vec3 color3 = u_baseColor * 1.3;

  vec3 gasColor;
  if(pattern < 0.4) {
    gasColor = mix(color2, color1, pattern / 0.4);
  } else if(pattern < 0.7) {
    gasColor = mix(color1, color3, (pattern - 0.4) / 0.3);
  } else {
    gasColor = mix(color3, color1, (pattern - 0.7) / 0.3);
  }

  // Storm color
  // Lower threshold and stronger effect
  if(storms > 0.15) {
    float stormBlend = clamp((storms - 0.15) * 3.0, 0.0, 0.8);
    gasColor = mix(gasColor, u_stormColor, stormBlend);
  }

  // Lighting
  float diffuse = max(0.0, dot(normal, lightDir));
  gasColor *= (0.5 + diffuse * 0.5);

  // Limb darkening
  float limbDark = pow(max(0.0, dot(viewDir, normal)), 0.8);
  gasColor *= mix(0.6, 1.0, limbDark);

  // Atmospheric glow
  if(u_atmosphereDensity > 0.0) {
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
    vec3 glowColor = u_baseColor * 1.2;
    gasColor += glowColor * fresnel * u_atmosphereDensity * 0.3;
  }

  return gasColor;
}

// ============================================================================
// Ice Giant Renderer (smoother bands, less turbulence)
// ============================================================================
vec3 renderIceGiant() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(u_lightPosition - vPosition);
  vec3 viewDir = normalize(vViewPosition);

  float latitude = vPosition.y / length(vPosition);

  // Smoother bands than gas giants (handle bandCount = 0)
  float bands = 0.5;
  if(u_bandCount > 0.0) {
    bands = sin(latitude * u_bandCount * 3.14159) * 0.5 + 0.5;
  }

  // Subtle turbulence (half speed for smoother ice giant effect)
  vec3 turbPos = vPosition + vec3(u_time * u_bandSpeed * 0.5, 0.0, 0.0);
  float turbulence = fbm(turbPos * 2.0, 3, 0.5) * u_turbulence * 0.5;
  bands += turbulence;

  // Storm features (Great Dark Spot style for Neptune-like planets)
  float storms = 0.0;
  if(u_stormIntensity > 0.0) {
    float stormNoise = fbm(vPosition * 1.5, 3, 0.6);
    storms = pow(max(0.0, stormNoise), 1.3) * u_stormIntensity * 1.2;
  }

  float pattern = clamp(bands + storms * 0.4, 0.0, 1.0);

  // Ice giant colors (cyan/blue tones)
  vec3 color1 = u_baseColor * 0.8;
  vec3 color2 = u_baseColor * 1.1;

  vec3 iceColor = mix(color1, color2, pattern);

  // Storm patches on ice giants (can be dark spots like Great Dark Spot)
  if(storms > 0.2) {
    // Use storm color but darkened for ice giants
    vec3 stormColorDarkened = u_stormColor * 0.5;
    float stormBlend = clamp((storms - 0.2) * 2.5, 0.0, 0.6);
    iceColor = mix(iceColor, stormColorDarkened, stormBlend);
  }

  // Smooth lighting
  float diffuse = max(0.0, dot(normal, lightDir));
  iceColor *= (0.6 + diffuse * 0.4);

  // Hazy atmosphere effect
  float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 2.5);
  vec3 hazeColor = u_baseColor * 1.3;
  iceColor = mix(iceColor, hazeColor, fresnel * u_atmosphereDensity * 0.4);

  return iceColor;
}

// ============================================================================
// Main
// ============================================================================
void main() {
  vec3 finalColor;

  if(u_planetMode == 1) {
    // Gas Giant
    finalColor = renderGasGiant();
  } else if(u_planetMode == 2) {
    // Ice Giant
    finalColor = renderIceGiant();
  } else {
    // Rocky/Terrestrial (includes Barren, Moon, Asteroid)
    finalColor = renderRockyPlanet();
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
