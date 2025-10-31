/**
 * Khora Engine - Shader Viewer Component
 *
 * GLSL shader code viewer using Monaco Editor.
 * Shows vertex shader, fragment shader, and uniforms for selected objects.
 */

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import * as THREE from 'three';
import { useSystemStore } from '../../store/system-store';

type ShaderTab = 'vertex' | 'fragment' | 'uniforms';

export function ShaderViewer() {
  const selectedObject = useSystemStore((state) => state.selectedObject);
  const [activeTab, setActiveTab] = useState<ShaderTab>('fragment');

  if (!selectedObject) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>No object selected</p>
        <p style={styles.emptyHint}>Select a star, planet, or moon to view its shaders</p>
      </div>
    );
  }

  // Get material from selected object
  // Note: In the actual implementation, we'll need to get the material reference
  // from the Three.js mesh. For now, we'll show a placeholder.
  const material = selectedObject.material;

  if (!material || !(material instanceof THREE.ShaderMaterial)) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>No shader available</p>
        <p style={styles.emptyHint}>
          This object doesn't use a shader material, or shader data is not available.
        </p>
      </div>
    );
  }

  const shaderMaterial = material as THREE.ShaderMaterial;

  // Prepare content for each tab
  const content = {
    vertex: shaderMaterial.vertexShader || '// No vertex shader available',
    fragment: shaderMaterial.fragmentShader || '// No fragment shader available',
    uniforms: JSON.stringify(
      formatUniforms(shaderMaterial.uniforms),
      null,
      2
    ),
  };

  const language = activeTab === 'uniforms' ? 'json' : 'glsl';

  return (
    <div style={styles.container}>
      {/* Header with object info */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <span style={styles.objectType}>{selectedObject.type.toUpperCase()}</span>
          <span style={styles.objectName}>{selectedObject.data.name}</span>
        </div>
      </div>

      {/* Shader tabs */}
      <div style={styles.tabBar}>
        {(['vertex', 'fragment', 'uniforms'] as ShaderTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.background = '#2a2d2e';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Monaco Editor */}
      <div style={styles.editorContainer}>
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={content[activeTab]}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'off',
            automaticLayout: true,
            tabSize: 2,
            folding: true,
            renderLineHighlight: 'none',
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>
    </div>
  );
}

// Helper function to format uniforms for display
function formatUniforms(uniforms: { [uniform: string]: THREE.IUniform }): any {
  const formatted: any = {};

  for (const key in uniforms) {
    const uniform = uniforms[key];
    const value = uniform.value;

    // Format Three.js types nicely
    if (value instanceof THREE.Vector2) {
      formatted[key] = { type: 'vec2', value: [value.x, value.y] };
    } else if (value instanceof THREE.Vector3) {
      formatted[key] = { type: 'vec3', value: [value.x, value.y, value.z] };
    } else if (value instanceof THREE.Vector4) {
      formatted[key] = { type: 'vec4', value: [value.x, value.y, value.z, value.w] };
    } else if (value instanceof THREE.Color) {
      formatted[key] = { type: 'vec3', value: [value.r, value.g, value.b] };
    } else if (value instanceof THREE.Texture) {
      formatted[key] = { type: 'sampler2D', value: '[Texture]' };
    } else {
      formatted[key] = { type: 'float', value };
    }
  }

  return formatted;
}

// Styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1e1e1e',
  } as React.CSSProperties,
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
    textAlign: 'center',
    color: '#858585',
  } as React.CSSProperties,
  emptyText: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 600,
  } as React.CSSProperties,
  emptyHint: {
    margin: 0,
    fontSize: '12px',
    opacity: 0.7,
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #3e3e42',
    background: '#252526',
  } as React.CSSProperties,
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  objectType: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#007acc',
    letterSpacing: '0.5px',
    padding: '3px 8px',
    background: '#1e3a5f',
    borderRadius: '3px',
  } as React.CSSProperties,
  objectName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#cccccc',
  } as React.CSSProperties,
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #3e3e42',
    background: '#2d2d30',
  } as React.CSSProperties,
  tab: {
    flex: 1,
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#969696',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,
  tabActive: {
    background: '#1e1e1e',
    borderBottom: '2px solid #007acc',
    color: '#ffffff',
  } as React.CSSProperties,
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
  } as React.CSSProperties,
};
