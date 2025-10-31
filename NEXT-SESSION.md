# Next Session: M6 - IDE Integration
**Current Status:** M5 Complete (100%) - All Procedural Shaders Working
**Next Milestone:** M6 - IDE Integration (Weeks 10-11)
**Target:** Interactive inspection of generated systems

---

## Quick Status Check

### ✅ What's Complete (M5)
- **Stars:** Enhanced shader with spectral type colors, multi-octave noise, limb darkening
- **Rocky Planets:** Terrain, water, atmosphere with procedural variation
- **Gas Giants:** Band patterns with turbulence
- **Moons:** Procedural terrain (reuses rocky planet shader, no water/atmosphere)
- **LOD System:** 3-level detail switching (subdivision 6/4/2)
- **Post-Processing:** Bloom effect for stars

### 🎯 What's Next (M6)

**Goal:** Create an interactive IDE panel for inspecting generated systems

**User Story:**
> As a developer, I want to click on any celestial body in the 3D scene and see its data (JSON) and shader code (GLSL) in an IDE-like panel, so I can understand and debug the procedural generation system.

---

## Implementation Plan

### Phase 1: Foundation (Session 10)

#### 1. Store Updates (`src/store/system-store.ts`)
**Add state:**
```typescript
selectedObject: {
  type: 'star' | 'planet' | 'moon' | null;
  data: Star | Planet | Moon | null;
  mesh: THREE.Mesh | null;
} | null;

ideOpen: boolean;

// Actions
setSelectedObject: (obj) => void;
toggleIDE: () => void;
```

#### 2. Raycasting System (`ThreeSceneManager.tsx`)
**Add click handler:**
```typescript
private setupRaycasting() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  this.container.addEventListener('click', (event) => {
    // Convert to NDC
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      // Walk up to find LOD with userData
      let object = intersects[0].object;
      while (object && !object.userData?.data) {
        object = object.parent;
      }

      if (object?.userData?.data) {
        useStore.getState().setSelectedObject({
          type: object.userData.type,
          data: object.userData.data,
          mesh: object
        });

        // Auto-open IDE on selection
        if (!useStore.getState().ideOpen) {
          useStore.getState().toggleIDE();
        }
      }
    }
  });
}
```

**Call in constructor:** `this.setupRaycasting();`

#### 3. IDE Panel Component (`src/components/IDE/IDEPanel.tsx`)
**Create sliding panel:**
```tsx
export function IDEPanel() {
  const { ideOpen, toggleIDE, selectedObject } = useStore();
  const [activeTab, setActiveTab] = useState<'scene' | 'data' | 'shaders'>('scene');

  return (
    <div className={`ide-panel ${ideOpen ? 'open' : 'closed'}`}>
      {/* Toggle button (always visible) */}
      <button className="ide-toggle" onClick={toggleIDE}>
        {ideOpen ? '→' : '←'} IDE
      </button>

      {/* Panel content (only when open) */}
      {ideOpen && (
        <div className="ide-content">
          {/* Tab bar */}
          <div className="tab-bar">
            <button onClick={() => setActiveTab('scene')}>Scene</button>
            <button onClick={() => setActiveTab('data')}>Data</button>
            <button onClick={() => setActiveTab('shaders')}>Shaders</button>
          </div>

          {/* Tab content */}
          <div className="tab-content">
            {activeTab === 'scene' && <SceneTree />}
            {activeTab === 'data' && <DataInspector />}
            {activeTab === 'shaders' && <ShaderViewer />}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Styling (basic):**
```css
.ide-panel {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 40%;
  background: #1e1e1e;
  color: #d4d4d4;
  transition: transform 0.3s ease;
  z-index: 1000;
}

.ide-panel.closed {
  transform: translateX(100%);
}

.ide-toggle {
  position: absolute;
  left: -40px;
  top: 50%;
  transform: translateY(-50%);
}
```

#### 4. Scene Tree Component (`src/components/IDE/SceneTree.tsx`)
**Hierarchical view:**
```tsx
export function SceneTree() {
  const { currentSystem, selectedObject, setSelectedObject } = useStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['system', 'star']));

  if (!currentSystem) {
    return <div className="empty">No system generated</div>;
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="scene-tree">
      {/* System root */}
      <TreeNode
        label={currentSystem.name}
        icon="🌌"
        isExpanded={expanded.has('system')}
        onToggle={() => toggleExpand('system')}
      />

      {expanded.has('system') && (
        <>
          {/* Star */}
          <TreeNode
            label={currentSystem.star.name}
            icon="⭐"
            onClick={() => setSelectedObject({
              type: 'star',
              data: currentSystem.star,
              mesh: null
            })}
            isSelected={selectedObject?.data?.id === currentSystem.star.id}
          />

          {/* Planets */}
          {currentSystem.star.planets.map(planet => (
            <PlanetNode key={planet.id} planet={planet} />
          ))}
        </>
      )}
    </div>
  );
}
```

---

### Phase 2: Data Display (Session 10 continued)

#### 5. Monaco Editor Setup
**Install:**
```bash
npm install @monaco-editor/react
```

**Configure (`src/components/IDE/MonacoConfig.ts`):**
```typescript
import * as monaco from 'monaco-editor';

export function configureMonaco() {
  // Dark theme
  monaco.editor.defineTheme('khora-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e1e',
    }
  });

  // GLSL language support (if not built-in)
  monaco.languages.register({ id: 'glsl' });
  monaco.languages.setMonarchTokensProvider('glsl', {
    // GLSL syntax highlighting rules
  });
}
```

#### 6. Data Inspector (`src/components/IDE/DataInspector.tsx`)
**JSON viewer with Monaco:**
```tsx
import Editor from '@monaco-editor/react';

export function DataInspector() {
  const { selectedObject } = useStore();

  if (!selectedObject) {
    return <div className="empty">Select an object to view data</div>;
  }

  const jsonData = JSON.stringify(selectedObject.data, null, 2);

  return (
    <div className="data-inspector">
      <div className="header">
        <h3>{selectedObject.type}: {selectedObject.data.name}</h3>
        <button onClick={() => navigator.clipboard.writeText(jsonData)}>
          Copy JSON
        </button>
      </div>

      <Editor
        height="calc(100vh - 120px)"
        language="json"
        theme="khora-dark"
        value={jsonData}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
```

#### 7. Shader Viewer (`src/components/IDE/ShaderViewer.tsx`)
**GLSL viewer with tabs:**
```tsx
export function ShaderViewer() {
  const { selectedObject } = useStore();
  const [tab, setTab] = useState<'vertex' | 'fragment' | 'uniforms'>('fragment');

  if (!selectedObject?.mesh?.material) {
    return <div className="empty">Select an object to view shaders</div>;
  }

  const material = selectedObject.mesh.material as THREE.ShaderMaterial;

  const content = {
    vertex: material.vertexShader || 'No vertex shader',
    fragment: material.fragmentShader || 'No fragment shader',
    uniforms: JSON.stringify(material.uniforms, null, 2)
  };

  return (
    <div className="shader-viewer">
      <div className="shader-tabs">
        <button onClick={() => setTab('vertex')}>Vertex</button>
        <button onClick={() => setTab('fragment')}>Fragment</button>
        <button onClick={() => setTab('uniforms')}>Uniforms</button>
      </div>

      <Editor
        height="calc(100vh - 160px)"
        language={tab === 'uniforms' ? 'json' : 'glsl'}
        theme="khora-dark"
        value={content[tab]}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
        }}
      />
    </div>
  );
}
```

---

### Phase 3: Integration (Session 11)

#### 8. App Integration (`src/App.tsx`)
**Add IDE panel:**
```tsx
import { IDEPanel } from './components/IDE/IDEPanel';

function App() {
  return (
    <>
      <CanvasContainer />
      <IDEPanel />
      <UI /> {/* Generate button, etc. */}
    </>
  );
}
```

#### 9. Testing Checklist
- [ ] Click star → IDE opens, shows star data
- [ ] Click planet → Shows planet data + shader
- [ ] Click moon → Shows moon data + shader
- [ ] Scene tree shows full hierarchy
- [ ] Expand/collapse works
- [ ] Click tree node → selects in scene
- [ ] Data tab shows valid JSON
- [ ] Shader tab shows GLSL code
- [ ] Copy JSON button works
- [ ] IDE toggle button works
- [ ] IDE remembers last tab

---

## File Creation Order (Recommended)

**Session 10 (Foundation + Data Display):**
1. Update `system-store.ts` (add IDE state)
2. Create `src/components/IDE/` directory
3. Create `IDEPanel.tsx` (empty shell)
4. Update `App.tsx` (mount IDE panel)
5. Test toggle button works
6. Update `ThreeSceneManager.tsx` (add raycasting)
7. Test object selection updates store
8. Create `SceneTree.tsx`
9. Create `DataInspector.tsx`
10. Test clicking planet → shows JSON

**Session 11 (Shader Viewer + Polish):**
1. Create `ShaderViewer.tsx`
2. Test shader display
3. Add copy buttons
4. Polish styling
5. Add keyboard shortcuts (optional)
6. Performance testing
7. Documentation

---

## Key References

**Planning Docs:**
- `/PLANNING.md` - IDE section (search "IDE Integration")
- `/CLAUDE.md` - Session 10-11 file creation order
- `SESSION-9-NOTES.md` - Latest session context

**Code Patterns:**
- `ThreeSceneManager.tsx` - Scene access patterns
- `system-store.ts` - Store patterns
- `CelestialBodyLOD.ts` - userData structure

**Dependencies:**
- `@monaco-editor/react` - Code editor component
- `three` - Raycasting

---

## Common Pitfalls to Avoid

1. **Raycasting Deep Hierarchies**
   - Don't just use `intersects[0].object`
   - Walk up parent chain to find LOD with userData
   - Check for `userData.data` existence

2. **Shader Material Access**
   - Not all materials are ShaderMaterial
   - Check `material instanceof THREE.ShaderMaterial`
   - Stars, planets, moons use ShaderMaterial
   - Orbits use LineBasicMaterial (no shader)

3. **State Synchronization**
   - Scene selection should update store
   - Tree selection should update scene highlight
   - Keep selectedObject in sync

4. **Monaco Performance**
   - Use `minimap: { enabled: false }` for performance
   - Limit editor height to prevent layout thrashing
   - Don't re-create editor on every render

5. **JSON Serialization**
   - THREE.Vector3 doesn't serialize well
   - May need custom serializer for materials
   - Use `JSON.stringify(data, null, 2)` for readability

---

## Success Criteria (M6 Acceptance)

### Must Have:
- ✅ Click any celestial body → IDE opens with its data
- ✅ Scene tree shows full system hierarchy
- ✅ Data inspector displays valid JSON
- ✅ Shader viewer displays GLSL code
- ✅ Copy JSON to clipboard works
- ✅ IDE toggle button works

### Nice to Have (if time):
- Highlight selected object in scene (outline effect)
- Search/filter in scene tree
- Syntax highlighting in shader viewer
- Live uniform editing (changes shader in real-time)
- Keyboard shortcuts (E for IDE, Esc to close)

### Out of Scope (Phase 2+):
- Editing data (read-only in Phase 1)
- Saving/loading systems (Phase 2)
- Multiple system comparison (Phase 2)
- Performance profiler (Phase 3)
- Architect mode (editable IDE - Phase 3)

---

## Estimated Timeline

**Session 10 (4-6 hours):**
- Store updates: 30min
- Raycasting: 1 hour
- IDE panel structure: 1 hour
- Scene tree: 2 hours
- Data inspector: 1 hour

**Session 11 (2-4 hours):**
- Shader viewer: 2 hours
- Styling polish: 1 hour
- Testing + bug fixes: 1 hour

**Total: 6-10 hours** (conservative estimate)

---

## Quick Start Commands

```bash
# Install Monaco Editor
npm install @monaco-editor/react

# Start dev server (if not running)
npm run dev

# Test in browser
# 1. Generate system: window.__KHORA_STORE__.getState().generateSystem(12345)
# 2. Click toggle IDE button
# 3. Click on star/planet/moon
# 4. Verify data appears in IDE panel
```

---

*Ready to begin M6 - IDE Integration!*
*All procedural shaders complete - time to inspect what we've built!*
