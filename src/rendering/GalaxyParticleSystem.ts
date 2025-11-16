import * as THREE from 'three';

/**
 * Galaxy types supported by the particle system
 */
export type GalaxyType = 'spiral' | 'barred' | 'elliptical' | 'irregular' | 'ring';

/**
 * Configuration options for galaxy generation
 */
export interface GalaxyConfig {
  // Galaxy structure
  type?: GalaxyType;
  particleCount?: number;
  armCount?: number;
  spiralTightness?: number;

  // Color scheme
  coreColor?: THREE.Color;
  midColor?: THREE.Color;
  edgeColor?: THREE.Color;

  // Size and appearance
  size?: number;
  diskThickness?: number;
  coreSize?: number;

  // Animation
  animationSpeed?: number;
  rotationSpeed?: number;

  // Ring galaxy parameters
  ringInnerRadius?: number;
  ringOuterRadius?: number;

  // Irregular galaxy parameter
  irregularChaos?: number;

  // Elliptical galaxy parameter
  ellipticalFlatten?: number;

  // Particle appearance
  particleSizeMin?: number;
  particleSizeMax?: number;
  particleBrightness?: number;

  // Core controls
  coreBrightness?: number;          // Brightness multiplier for core region (0.0-1.0)
  coreAlphaFalloff?: number;        // How much to reduce alpha near center (0.0-1.0)
  coreExclusionRadius?: number;     // Radius with no particles (0.0-0.2)
}

/**
 * System marker data structure
 */
export interface SystemMarker {
  position: THREE.Vector3;
  color?: THREE.Color;
  size?: number;
  data?: any;
}

/**
 * Internal particle data structure
 */
interface ParticleData {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  size: number;
  alpha: number;
}

/**
 * GalaxyParticleSystem - Flexible procedural galaxy generator
 * Supports: Spiral, Barred Spiral, Elliptical, Irregular, Ring galaxies
 */
export class GalaxyParticleSystem {
  private config: Required<GalaxyConfig>;
  private systemMarkers: SystemMarker[];
  private particlePoints: THREE.Points | null;
  private markerPoints: THREE.Points | null;
  private group: THREE.Group;

  constructor(config: GalaxyConfig = {}) {
    // Configuration with defaults
    this.config = {
      type: config.type || 'spiral',
      particleCount: config.particleCount || 5000,
      armCount: config.armCount || 3,
      spiralTightness: config.spiralTightness || 0.6,
      coreColor: config.coreColor || new THREE.Color(1.0, 0.8, 0.9),  // Pink
      midColor: config.midColor || new THREE.Color(0.8, 0.4, 0.85),    // Purple
      edgeColor: config.edgeColor || new THREE.Color(0.4, 0.2, 0.6),   // Dark purple
      size: config.size || 55,
      diskThickness: config.diskThickness || 4.0,
      coreSize: config.coreSize || 0.25,
      animationSpeed: config.animationSpeed || 0.5,
      rotationSpeed: config.rotationSpeed || 0.01,
      // Ring galaxy parameters
      ringInnerRadius: config.ringInnerRadius !== undefined ? config.ringInnerRadius : 0.4,
      ringOuterRadius: config.ringOuterRadius !== undefined ? config.ringOuterRadius : 0.9,
      // Irregular galaxy parameter
      irregularChaos: config.irregularChaos !== undefined ? config.irregularChaos : 0.4,
      // Elliptical galaxy parameter
      ellipticalFlatten: config.ellipticalFlatten !== undefined ? config.ellipticalFlatten : 0.6,
      // Particle appearance parameters
      particleSizeMin: config.particleSizeMin !== undefined ? config.particleSizeMin : 0.3,
      particleSizeMax: config.particleSizeMax !== undefined ? config.particleSizeMax : 3.0,
      particleBrightness: config.particleBrightness !== undefined ? config.particleBrightness : 1.0,
      // Core controls
      coreBrightness: config.coreBrightness !== undefined ? config.coreBrightness : 0.5,
      coreAlphaFalloff: config.coreAlphaFalloff !== undefined ? config.coreAlphaFalloff : 0.6,
      coreExclusionRadius: config.coreExclusionRadius !== undefined ? config.coreExclusionRadius : 0.0,
    };

    // System markers (explorable star systems)
    this.systemMarkers = [];

    // Three.js objects
    this.particlePoints = null;
    this.markerPoints = null;
    this.group = new THREE.Group();

    this.generate();
  }

  /**
   * Generate galaxy particles based on type
   */
  private generate(): void {
    const positions: number[] = [];
    const sizes: number[] = [];
    const colors: number[] = [];
    const alphas: number[] = [];
    const shifts: number[] = [];

    const { type, particleCount } = this.config;

    for (let i = 0; i < particleCount; i++) {
      let particleData: ParticleData;

      switch (type) {
        case 'spiral':
          particleData = this.generateSpiralParticle();
          break;
        case 'barred':
          particleData = this.generateBarredSpiralParticle();
          break;
        case 'elliptical':
          particleData = this.generateEllipticalParticle();
          break;
        case 'irregular':
          particleData = this.generateIrregularParticle();
          break;
        case 'ring':
          particleData = this.generateRingParticle();
          break;
        default:
          particleData = this.generateSpiralParticle();
      }

      positions.push(particleData.x, particleData.y, particleData.z);
      sizes.push(particleData.size);
      colors.push(particleData.r, particleData.g, particleData.b);
      alphas.push(particleData.alpha);
      shifts.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() * 0.9 + 0.1) * Math.PI * 0.20,
        Math.random() * 0.5 + 0.2
      );
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));
    geometry.setAttribute('shift', new THREE.Float32BufferAttribute(shifts, 4));

    // Create material with shader
    const material = this.createParticleMaterial();

    // Create points
    if (this.particlePoints) {
      this.group.remove(this.particlePoints);
      this.particlePoints.geometry.dispose();
      this.particlePoints.material.dispose();
    }

    this.particlePoints = new THREE.Points(geometry, material);
    this.particlePoints.rotation.x = -Math.PI / 5;
    this.group.add(this.particlePoints);
  }

  /**
   * Generate particle for SPIRAL galaxy
   */
  private generateSpiralParticle(): ParticleData {
    const { size, armCount, spiralTightness, diskThickness, coreExclusionRadius } = this.config;

    // Radius with concentration toward center (power of 3 for better distribution)
    let radius = Math.pow(Math.random(), 3) * size;

    // Apply core exclusion radius (prevents particles at absolute center)
    const exclusionMin = size * coreExclusionRadius;
    if (radius < exclusionMin) {
      radius = exclusionMin + Math.random() * (size * 0.05); // Small scatter outside exclusion
    }

    // Normalized radius for core calculations (0.0 at center, 1.0 at edge)
    const normalizedRadius = radius / size;

    // Determine which arm
    const armIndex = Math.floor(Math.random() * armCount);
    const armAngle = (armIndex / armCount) * Math.PI * 2;

    // Logarithmic spiral
    const spiralOffset = Math.log(radius / 5 + 1) * spiralTightness * 10;
    const baseAngle = armAngle + spiralOffset;

    // Scatter for organic look
    const armWidth = 1.2;
    const scatter = (Math.random() - 0.5) * armWidth;

    // Noise for clustering
    const noise = Math.sin(baseAngle * 4) * Math.cos(radius * 0.2) * 2;
    const angle = baseAngle + scatter + noise * 0.2;

    // Convert to cartesian
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    // Y position - flattened disk, thinner at edges
    const thickness = Math.pow(1 - normalizedRadius, 1.5) * diskThickness;
    const y = (Math.random() - 0.5) * thickness;

    const { particleSizeMin, particleSizeMax, particleBrightness } = this.config;
    const sizeRange = particleSizeMax - particleSizeMin;

    // Base alpha before core adjustments
    const baseAlpha = (0.3 + Math.random() * 0.7) * particleBrightness;

    return {
      x, y, z,
      ...this.getParticleColor(normalizedRadius),
      size: Math.random() * sizeRange + particleSizeMin,
      alpha: this.calculateCoreAlpha(normalizedRadius, baseAlpha)
    };
  }

  /**
   * Generate particle for BARRED SPIRAL galaxy
   */
  private generateBarredSpiralParticle(): ParticleData {
    const { size, armCount, spiralTightness, diskThickness, coreSize, coreExclusionRadius } = this.config;

    let radius = Math.pow(Math.random(), 3) * size;

    // Apply core exclusion radius
    const exclusionMin = size * coreExclusionRadius;
    if (radius < exclusionMin) {
      radius = exclusionMin + Math.random() * (size * 0.05);
    }

    const normalizedRadius = radius / size;
    const isBar = radius < (size * coreSize) && Math.random() < 0.6;

    if (isBar) {
      // Central bar structure
      const barLength = size * coreSize * 0.8;
      const barAngle = Math.random() * Math.PI * 2;
      const barRadius = (Math.random() - 0.5) * barLength;
      const barWidth = 2.0;

      const x = barRadius * Math.cos(barAngle) + (Math.random() - 0.5) * barWidth;
      const z = barRadius * Math.sin(barAngle) + (Math.random() - 0.5) * barWidth;
      const y = (Math.random() - 0.5) * 1.5;

      const { particleSizeMin, particleSizeMax, particleBrightness } = this.config;
      const sizeRange = particleSizeMax - particleSizeMin;

      // Calculate actual distance from center for bar particles
      const barDistance = Math.sqrt(x * x + z * z);
      const barNormalizedRadius = barDistance / size;

      const baseAlpha = (0.5 + Math.random() * 0.5) * particleBrightness;

      return {
        x, y, z,
        ...this.getParticleColor(0.1), // Core color
        size: Math.random() * sizeRange + particleSizeMin,
        alpha: this.calculateCoreAlpha(barNormalizedRadius, baseAlpha)
      };
    } else {
      // Regular spiral arms (starting from bar ends)
      return this.generateSpiralParticle();
    }
  }

  /**
   * Generate particle for ELLIPTICAL galaxy
   */
  private generateEllipticalParticle(): ParticleData {
    const { size, ellipticalFlatten, coreExclusionRadius } = this.config;

    // Spherical distribution with concentration toward center
    let radius = Math.pow(Math.random(), 4) * size * 0.8;

    // Apply core exclusion radius
    const exclusionMin = size * coreExclusionRadius;
    if (radius < exclusionMin) {
      radius = exclusionMin + Math.random() * (size * 0.05);
    }

    const normalizedRadius = radius / (size * 0.8);

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    // Elliptical shape (configurable flattening)
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta) * ellipticalFlatten;
    const z = radius * Math.cos(phi);

    const { particleSizeMin, particleSizeMax, particleBrightness } = this.config;
    const sizeRange = particleSizeMax - particleSizeMin;

    const baseAlpha = (0.2 + Math.random() * 0.6) * particleBrightness;

    return {
      x, y, z,
      ...this.getParticleColor(normalizedRadius),
      size: Math.random() * sizeRange + particleSizeMin,
      alpha: this.calculateCoreAlpha(normalizedRadius, baseAlpha)
    };
  }

  /**
   * Generate particle for IRREGULAR galaxy
   */
  private generateIrregularParticle(): ParticleData {
    const { size, diskThickness, irregularChaos, coreExclusionRadius } = this.config;

    // Chaotic distribution with multiple density clusters
    const clusterCount = 3;
    const clusterIndex = Math.floor(Math.random() * clusterCount);
    const clusterAngle = (clusterIndex / clusterCount) * Math.PI * 2 + (Math.random() - 0.5) * Math.PI;
    const clusterDistance = Math.random() * size * 0.5;

    // Configurable scatter for chaotic look (0.0 = tight clusters, 1.0 = very chaotic)
    const scatter = (Math.random() - 0.5) * size * irregularChaos;
    let radius = clusterDistance + scatter;

    // Apply core exclusion radius
    const exclusionMin = size * coreExclusionRadius;
    if (Math.abs(radius) < exclusionMin) {
      radius = (radius >= 0 ? 1 : -1) * (exclusionMin + Math.random() * (size * 0.05));
    }

    const angle = clusterAngle + (Math.random() - 0.5) * Math.PI;

    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = (Math.random() - 0.5) * diskThickness * 2;

    // Calculate normalized radius for core controls
    const distance = Math.sqrt(x * x + z * z);
    const normalizedRadius = Math.min(distance / size, 1.0);

    const { particleSizeMin, particleSizeMax, particleBrightness } = this.config;
    const sizeRange = particleSizeMax - particleSizeMin;

    const baseAlpha = (0.2 + Math.random() * 0.7) * particleBrightness;

    return {
      x, y, z,
      ...this.getParticleColor(Math.random()), // Random colors
      size: Math.random() * sizeRange + particleSizeMin,
      alpha: this.calculateCoreAlpha(normalizedRadius, baseAlpha)
    };
  }

  /**
   * Generate particle for RING galaxy
   */
  private generateRingParticle(): ParticleData {
    const { size, diskThickness, ringInnerRadius, ringOuterRadius } = this.config;

    // Ring with configurable inner and outer bounds
    const minRadius = size * ringInnerRadius;
    const maxRadius = size * ringOuterRadius;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);

    const normalizedRadius = radius / size;

    const angle = Math.random() * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);

    // Thin disk
    const y = (Math.random() - 0.5) * diskThickness * 0.5;

    const { particleSizeMin, particleSizeMax, particleBrightness } = this.config;
    const sizeRange = particleSizeMax - particleSizeMin;

    const baseAlpha = (0.4 + Math.random() * 0.6) * particleBrightness;

    return {
      x, y, z,
      ...this.getParticleColor((radius - minRadius) / (maxRadius - minRadius)),
      size: Math.random() * sizeRange + particleSizeMin,
      alpha: this.calculateCoreAlpha(normalizedRadius, baseAlpha)
    };
  }

  /**
   * Get particle color based on distance from center
   */
  private getParticleColor(t: number): { r: number; g: number; b: number } {
    const { coreColor, midColor, edgeColor } = this.config;
    let color: THREE.Color;

    if (t < 0.4) {
      // Core to mid
      const localT = t / 0.4;
      color = new THREE.Color().lerpColors(coreColor, midColor, localT);
    } else {
      // Mid to edge
      const localT = (t - 0.4) / 0.6;
      color = new THREE.Color().lerpColors(midColor, edgeColor, localT);
    }

    return { r: color.r, g: color.g, b: color.b };
  }

  /**
   * Calculate alpha value with core brightness and falloff controls
   * @param normalizedRadius - Distance from center (0.0 at center, 1.0 at edge)
   * @param baseAlpha - Base alpha value before core adjustments
   * @returns Final alpha value with core controls applied
   */
  private calculateCoreAlpha(normalizedRadius: number, baseAlpha: number): number {
    const { coreSize, coreBrightness, coreAlphaFalloff } = this.config;

    // Check if particle is in core region
    const isInCore = normalizedRadius < coreSize;

    if (!isInCore) {
      // Outside core - use base alpha
      return baseAlpha;
    }

    // Inside core - apply core brightness and falloff
    const coreT = normalizedRadius / coreSize; // 0.0 at center, 1.0 at core edge

    // Apply alpha falloff (reduces alpha near center to prevent solid appearance)
    // coreAlphaFalloff: 0.0 = no reduction, 1.0 = maximum reduction
    const falloffReduction = (1.0 - coreT) * coreAlphaFalloff;
    const falloffMultiplier = 1.0 - falloffReduction;

    // Apply core brightness multiplier
    return baseAlpha * coreBrightness * falloffMultiplier;
  }

  /**
   * Create shader material for particles
   */
  private createParticleMaterial(): THREE.ShaderMaterial {
    const PI2 = Math.PI * 2;

    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute vec3 color;
        attribute float alpha;
        attribute vec4 shift;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          vAlpha = alpha;

          vec3 pos = position;

          // Particle motion
          float t = time;
          float moveT = mod(shift.x + shift.z * t, ${PI2.toFixed(10)});
          float moveS = mod(shift.y + shift.z * t, ${PI2.toFixed(10)});
          pos += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * 3.0 * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  /**
   * Add system markers (explorable star systems)
   */
  public addSystemMarkers(systems: SystemMarker[]): void {
    // Remove old markers
    if (this.markerPoints) {
      this.group.remove(this.markerPoints);
      this.markerPoints.geometry.dispose();
      this.markerPoints.material.dispose();
    }

    this.systemMarkers = systems;

    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    systems.forEach(system => {
      positions.push(system.position.x, system.position.y, system.position.z);

      // Marker color - slightly brighter than particle colors
      const color = system.color || new THREE.Color(1.0, 1.0, 0.6); // Yellow-white
      colors.push(color.r, color.g, color.b);

      sizes.push(system.size || 4.0);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Marker material - brighter, more visible
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          // Pulsing effect
          float pulse = 1.0 + sin(time * 2.0) * 0.2;
          gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          // Sharp core with glow
          float core = 1.0 - smoothstep(0.0, 0.2, dist);
          float glow = smoothstep(0.5, 0.0, dist);
          float alpha = core + glow * 0.5;

          gl_FragColor = vec4(vColor * 1.3, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.markerPoints = new THREE.Points(geometry, material);
    this.markerPoints.rotation.x = -Math.PI / 5;
    this.markerPoints.name = 'systemMarkers';

    // Store marker data in userData for raycasting/selection
    this.markerPoints.userData = {
      markers: systems, // Full array of SystemMarker objects with data
      markerCount: systems.length
    };

    this.group.add(this.markerPoints);
  }

  /**
   * Update animation
   */
  public update(deltaTime: number): void {
    if (this.particlePoints) {
      this.particlePoints.material.uniforms.time.value += deltaTime * this.config.animationSpeed;
      this.particlePoints.rotation.y += this.config.rotationSpeed * deltaTime;
    }

    if (this.markerPoints) {
      this.markerPoints.material.uniforms.time.value += deltaTime * this.config.animationSpeed;
      this.markerPoints.rotation.y += this.config.rotationSpeed * deltaTime;
    }
  }

  /**
   * Get the Three.js group containing all galaxy elements
   */
  public getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Update galaxy configuration and regenerate
   */
  public updateConfig(newConfig: Partial<GalaxyConfig>): void {
    Object.assign(this.config, newConfig);
    this.generate();
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.particlePoints) {
      this.particlePoints.geometry.dispose();
      this.particlePoints.material.dispose();
    }
    if (this.markerPoints) {
      this.markerPoints.geometry.dispose();
      this.markerPoints.material.dispose();
    }
  }
}
