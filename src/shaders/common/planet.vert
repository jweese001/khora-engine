//
// Shared Vertex Shader for All Planet Types
// Calculates world position, normals, and view direction
//

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDirection;
varying vec2 vUv;

void main() {
  // Pass UV coordinates to fragment shader
  vUv = uv;

  // Transform normal to world space
  vNormal = normalize(normalMatrix * normal);

  // Calculate world position
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;

  // Calculate view direction (from surface to camera)
  vViewDirection = normalize(cameraPosition - vWorldPosition);

  // Standard vertex transformation
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
