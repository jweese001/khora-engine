//
// Gas Giant Vertex Shader
// Vertex shader for gas giants and ice giants with band patterns
//

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  // Pass local position for noise calculation
  vPosition = position;

  // Pass normal for lighting calculations
  vNormal = normalize(normalMatrix * normal);

  // Pass world position
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  // Pass UV coordinates
  vUv = uv;

  // Standard vertex transformation
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
