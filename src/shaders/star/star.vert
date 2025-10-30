//
// Star Vertex Shader
// Simple vertex shader for emissive star rendering
//

varying vec3 vPosition;
varying vec2 vUv;

void main() {
  // Pass local position for radial gradient calculation
  vPosition = position;

  // Pass UV coordinates
  vUv = uv;

  // Standard vertex transformation
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
