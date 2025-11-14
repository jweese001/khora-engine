//
// Planet Vertex Shader (Unified - Rocky/Gas/Ice)
//

varying vec3 vNormal;
varying vec3 vPosition;       // Local space position for noise (radius 1.0)
varying vec3 vWorldPosition;  // World space position for lighting
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  // Transform normal to world space for lighting calculations
  vNormal = normalize(mat3(modelMatrix) * normal);

  // Pass LOCAL position for consistent noise sampling across all planet sizes
  vPosition = position;

  // Pass WORLD position for accurate lighting calculations
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  vUv = uv;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
