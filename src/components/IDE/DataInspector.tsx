/**
 * Khora Engine - Data Inspector Component
 *
 * JSON viewer for inspecting celestial body data using Monaco Editor.
 */

import Editor from '@monaco-editor/react';
import { useSystemStore } from '../../store/system-store';

export function DataInspector() {
  const selectedObject = useSystemStore((state) => state.selectedObject);
  const currentGalaxy = useSystemStore((state) => state.currentGalaxy);
  const currentSystem = useSystemStore((state) => state.currentSystem);
  const viewMode = useSystemStore((state) => state.viewMode);

  // Determine what data to show
  let jsonData: string;
  let headerInfo: { type: string; name: string } | null = null;

  if (selectedObject) {
    // Show selected object data
    jsonData = JSON.stringify(selectedObject.data, null, 2);
    headerInfo = {
      type: selectedObject.type.toUpperCase(),
      name: selectedObject.data.name
    };
  } else if (viewMode === 'galaxy' && currentGalaxy) {
    // Show galaxy data when in galaxy view
    jsonData = JSON.stringify(currentGalaxy, null, 2);
    headerInfo = {
      type: 'GALAXY',
      name: currentGalaxy.name
    };
  } else if (currentSystem) {
    // Show current system data
    jsonData = JSON.stringify(currentSystem, null, 2);
    headerInfo = {
      type: 'SYSTEM',
      name: currentSystem.name
    };
  } else {
    // Nothing to show
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>No data available</p>
        <p style={styles.emptyHint}>
          {viewMode === 'galaxy'
            ? 'Generate a galaxy to view its data'
            : 'Generate a system or select an object to view its data'}
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonData).then(
      () => {
        console.log('[DataInspector] Data copied to clipboard');
        // Optional: Show toast notification
      },
      (err) => {
        console.error('[DataInspector] Failed to copy data:', err);
      }
    );
  };

  return (
    <div style={styles.container}>
      {/* Header with object info and copy button */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <span style={styles.objectType}>{headerInfo?.type || 'DATA'}</span>
          <span style={styles.objectName}>{headerInfo?.name || 'Unknown'}</span>
        </div>
        <button onClick={handleCopy} style={styles.copyButton} title="Copy JSON to clipboard">
          <span style={styles.copyIcon}>📋</span>
          <span style={styles.copyText}>Copy JSON</span>
        </button>
      </div>

      {/* Monaco Editor */}
      <div style={styles.editorContainer}>
        <Editor
          height="100%"
          language="json"
          theme="vs-dark"
          value={jsonData}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            wrappingIndent: 'indent',
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
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#0e639c',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  } as React.CSSProperties,
  copyIcon: {
    fontSize: '14px',
  } as React.CSSProperties,
  copyText: {
    fontSize: '12px',
  } as React.CSSProperties,
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
  } as React.CSSProperties,
};
