//
// Planet Vertex Shader (Unified - Rocky/Gas/Ice)
//

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  // Transform normal to world space for lighting calculations
  vNormal = normalize(mat3(modelMatrix) * normal);
  // Pass world position for lighting calculations
  vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vUv = uv;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
