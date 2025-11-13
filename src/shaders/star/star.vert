//
// Star Vertex Shader (Temperature-Based)
//

uniform float u_time;
uniform float u_scale;

varying vec3 vTexCoord3D;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Create 3D texture coordinates for noise sampling
  // Slow down time effect significantly for subtle animation
  vTexCoord3D = u_scale * (position.xyz + vec3(u_time * 0.1, u_time * 0.08, u_time * 0.09));
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
