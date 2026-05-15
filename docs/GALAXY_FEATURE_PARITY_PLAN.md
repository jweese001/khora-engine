# Galaxy Feature Parity - Implementation Plan
**Goal:** Achieve functional parity with `test-galaxy-integration.html` demo
**Status:** Analysis Complete - Ready for Implementation
**Estimated Timeline:** 4-5 weeks (50-63 hours)

---

## Executive Summary

### Current State
- ✅ **Phase 1 Complete:** Single galaxy instance with basic controls
- ✅ **Core Controls Implemented:** All Session 5 core brightness controls working
- ⏳ **50% Feature Parity:** Basic galaxy rendering functional

### Missing Features (Demo → Khora)

| Feature | Demo | Khora | Priority | Est. Hours |
|---------|------|-------|----------|------------|
| **Multi-Layer System** | 3 independent galaxies | Single instance | **🔴 HIGH** | 15-19 |
| **Independent Markers** | Separate scene group | None | **🔴 HIGH** | 12-15 |
| **Marker Controls** | Size/color/pulse/clickable | None | **🟡 MEDIUM** | 4-5 |
| **Raycasting** | Click detection | None | **🟡 MEDIUM** | 6-7 |
| **Presets** | Save/load configs | None | **🟢 LOW** | 5-6 |
| **Panel Toggle** | Show/hide UI | None | **🟢 LOW** | 2-3 |

**Total Missing:** 6 major feature areas, ~45-55 hours

---

## Feature Gap Analysis

### ✅ Already in Khora
- GalaxyParticleSystem class with 5 galaxy types
- Core brightness controls (coreBrightness, coreAlphaFalloff, coreExclusionRadius)
- Basic UI controls in GalaxyControls.tsx
- Animation and rotation system
- Color gradient system (core/mid/edge)

### ❌ Missing from Khora

#### 1. **Multi-Layer Galaxy System** (Demo lines 530-575, 782-875)
**What it is:**
- Array of 3 independent galaxy instances
- Each layer has separate visibility toggle
- Active layer selection for editing
- Per-layer configuration management

**Why it matters:**
- Allows combining different galaxy types (spiral + elliptical)
- Creates visual depth and complexity
- Essential for creative galaxy compositions

**Implementation complexity:** 🔴 HIGH (requires store refactor)

---

#### 2. **Independent Marker System** (Demo lines 578-582, 1003-1087)
**What it is:**
- Markers are NOT children of galaxy layers
- Separate `markerGroup` in scene root
- Persistent across layer visibility changes
- Type-specific positioning algorithms (uniform/spiral/clustered)

**Why it matters:**
- Represents explorable star systems
- Core gameplay mechanic for Phase 2+
- Must stay visible when galaxy layers are hidden

**Implementation complexity:** 🟡 MEDIUM (new rendering system)

---

#### 3. **Marker Positioning Algorithms** (Demo lines 893-1006)
**What it is:**
- **Uniform:** Random spherical distribution
- **Spiral:** Follows galaxy arm curves
- **Clustered:** Multiple density clusters

**Why it matters:**
- Realistic marker placement within galaxy structure
- Different algorithms for different game scenarios

**Implementation complexity:** 🟢 LOW (can port demo code directly)

---

#### 4. **Marker Visual Controls** (Demo lines 415-446)
**What it is:**
- Marker size slider (0.1-5.0)
- Color picker
- Pulse frequency (0-10)
- Clickable toggle (enable/disable raycasting)

**Why it matters:**
- User customization of marker appearance
- Visual distinction for different marker types

**Implementation complexity:** 🟢 LOW (UI controls)

---

#### 5. **Raycasting System** (Demo lines 587-613)
**What it is:**
- Click detection on markers
- Console logging of clicked markers
- Toggle-able clickable state

**Why it matters:**
- Player interaction with star systems
- Foundation for system navigation (Phase 2)

**Implementation complexity:** 🟡 MEDIUM (raycaster setup + click handling)

---

#### 6. **Preset System** (Demo lines 1133-1196)
**What it is:**
- Save current config to localStorage
- Load preset configurations
- Default presets (Dense Core, Wispy Arms, etc.)

**Why it matters:**
- Quick configuration switching
- Save/share galaxy designs

**Implementation complexity:** 🟡 MEDIUM (serialization + localStorage)

---

## Architecture Changes Required

### Store Structure (NEW: `galaxy-store.ts`)

```typescript
interface GalaxyLayer {
  id: number;              // 0, 1, or 2
  name: string;            // "Layer 1", "Layer 2", "Layer 3"
  visible: boolean;        // Show/hide this layer
  config: GalaxyConfig;    // Galaxy particle system config
}

interface MarkerConfig {
  count: number;                        // 5-200
  size: number;                         // 0.1-5.0
  color: string;                        // Hex color
  pulseFrequency: number;               // 0-10
  distribution: 'uniform' | 'spiral' | 'clustered';
  clickable: boolean;                   // Enable/disable raycasting
}

interface GalaxyState {
  // Multi-layer system
  layers: [GalaxyLayer, GalaxyLayer, GalaxyLayer];  // Exactly 3
  activeLayerId: 0 | 1 | 2;

  // Independent markers
  markers: MarkerConfig;
  markerPositions: THREE.Vector3[];

  // Presets
  presets: Map<string, GalaxyPreset>;

  // Actions
  setActiveLayer: (id: 0 | 1 | 2) => void;
  toggleLayerVisibility: (id: number) => void;
  updateLayerConfig: (id: number, config: Partial<GalaxyConfig>) => void;
  updateMarkerConfig: (config: Partial<MarkerConfig>) => void;
  generateMarkers: () => void;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
}
```

### Scene Management (UPDATE: `ThreeSceneManager.tsx`)

```typescript
class ThreeSceneManager {
  // Before: Single galaxy instance
  private galaxy: GalaxyParticleSystem;

  // After: Array of 3 galaxies
  private galaxyLayers: GalaxyParticleSystem[] = []; // 3 instances

  // NEW: Marker rendering system
  private markerGroup: THREE.Group;
  private markerRenderer: MarkerRenderer;

  // NEW: Raycaster for click detection
  private raycaster: THREE.Raycaster;

  initializeGalaxyLayers() {
    // Create 3 galaxy instances
    for (let i = 0; i < 3; i++) {
      const galaxy = new GalaxyParticleSystem(defaultConfig);
      galaxy.points.visible = i === 0; // Only layer 0 visible by default
      this.scene.add(galaxy.points);
      this.galaxyLayers.push(galaxy);
    }

    // Create independent marker group
    this.markerGroup = new THREE.Group();
    this.scene.add(this.markerGroup);
    this.markerRenderer = new MarkerRenderer(this.markerGroup);
  }
}
```

### Component Hierarchy (NEW/UPDATED)

```
GalaxyControls.tsx (refactored)
├── LayerSelector.tsx (NEW)
│   ├── Layer 1 | Layer 2 | Layer 3 tabs
│   └── Visibility toggles
├── GalaxyLayerControls (existing controls, now applies to active layer)
│   ├── Galaxy type
│   ├── Particle controls
│   ├── Color scheme
│   ├── Core controls
│   └── Animation
├── MarkerControls.tsx (NEW)
│   ├── Add/Remove markers
│   ├── Count slider
│   ├── Size slider
│   ├── Color picker
│   ├── Pulse frequency
│   ├── Distribution selector
│   └── Clickable toggle
├── PresetControls.tsx (NEW)
│   ├── Save preset input
│   └── Load preset dropdown
└── PanelToggle (NEW)
    └── Show/Hide UI button
```

---

## Implementation Plan (4-Week Timeline)

### **Week 1: Multi-Layer Foundation** (15-19 hours)

#### Task 1.1: Create Galaxy Store (3-4 hours)
**File:** `src/store/galaxy-store.ts` (NEW)

**What:**
- Create new Zustand store for galaxy state
- Define GalaxyLayer and GalaxyState interfaces
- Implement layer management actions

**Success Criteria:**
- Store compiles without errors
- Can get/set active layer
- Can toggle layer visibility
- Can update individual layer configs

---

#### Task 1.2: Refactor ThreeSceneManager (5-6 hours)
**File:** `src/components/Canvas/ThreeSceneManager.tsx`

**What:**
- Add array of 3 galaxy instances
- Subscribe to galaxy store changes
- Implement layer visibility control
- Update layer configs independently

**Success Criteria:**
- Three galaxy instances render
- Visibility toggle shows/hides correct layer
- Config changes affect only active layer
- No memory leaks

---

#### Task 1.3: Create Layer Selector UI (4-5 hours)
**File:** `src/components/IDE/LayerSelector.tsx` (NEW)

**What:**
- Create layer tab navigation (Layer 1/2/3)
- Add visibility checkboxes per layer
- Highlight active layer

**Success Criteria:**
- Clicking tab switches active layer
- Checkbox toggles visibility
- UI syncs with store

---

#### Task 1.4: Refactor GalaxyControls (3-4 hours)
**File:** `src/components/IDE/GalaxyControls.tsx`

**What:**
- Load active layer config into controls
- Apply changes only to active layer
- Add LayerSelector component

**Success Criteria:**
- Controls show active layer config
- Switching layers loads new config
- All existing controls still work

---

### **Week 2: Independent Marker System** (12-15 hours)

#### Task 2.1: Marker Data Structures (2-3 hours)
**File:** `src/store/galaxy-store.ts` (UPDATE)

**What:**
- Add MarkerConfig interface to store
- Add marker state and actions
- Create generateMarkers() action

**Success Criteria:**
- Marker config stored
- updateMarkerConfig action works
- generateMarkers creates positions array

---

#### Task 2.2: Marker Positioning Algorithms (4-5 hours)
**File:** `src/utils/marker-positioning.ts` (NEW)

**What:**
- Implement uniform distribution
- Implement spiral distribution (follows galaxy arms)
- Implement clustered distribution

**Success Criteria:**
- All 3 algorithms implemented
- Generates correct number of positions
- Positions stay within galaxy radius
- Visual verification in 3D

---

#### Task 2.3: Marker Rendering System (6-7 hours)
**File:** `src/rendering/MarkerRenderer.ts` (NEW)

**What:**
- Create MarkerRenderer class
- Implement pulsing shader material
- Subscribe to marker store changes
- Update markers on config change

**Success Criteria:**
- Markers render as pulsing spheres
- Color/size/pulse configurable
- Independent of galaxy visibility
- No memory leaks

---

### **Week 3: Controls & Interaction** (10-12 hours)

#### Task 3.1: Marker Controls UI (4-5 hours)
**File:** `src/components/IDE/MarkerControls.tsx` (NEW)

**What:**
- Add/Remove markers buttons
- Count, size, color, pulse sliders
- Distribution type selector
- Clickable toggle checkbox

**Success Criteria:**
- All controls render
- Sliders update markers real-time
- Add/remove works
- Distribution changes regenerate

---

#### Task 3.2: Raycasting System (6-7 hours)
**File:** `src/rendering/MarkerRenderer.ts` (UPDATE)

**What:**
- Create raycaster instance
- Add click event listener
- Implement marker intersection detection
- Log clicked marker to console
- Optional: visual highlight feedback

**Success Criteria:**
- Clicking marker logs to console
- Clickable toggle disables raycasting
- Marker highlights when clicked
- No performance impact

---

### **Week 4: Presets & Polish** (7-9 hours)

#### Task 4.1: Preset System (5-6 hours)
**File:** `src/store/galaxy-store.ts` (UPDATE)
**File:** `src/components/IDE/PresetControls.tsx` (NEW)

**What:**
- Create GalaxyPreset interface
- Implement save/load actions
- Save to localStorage
- Create default presets
- UI for save/load

**Success Criteria:**
- Can save current config
- Can load preset
- Presets persist
- Default presets available

---

#### Task 4.2: Panel Toggle (2-3 hours)
**File:** `src/components/IDE/GalaxyControls.tsx` (UPDATE)

**What:**
- Add Show/Hide UI button
- Implement panel slide animation
- Persist state to localStorage

**Success Criteria:**
- Button toggles panel
- Smooth animation
- State persists
- Button visible when hidden

---

## Technical Challenges & Solutions

### Challenge 1: Multi-Layer State Management
**Problem:** Zustand store currently single galaxy config
**Solution:** Array of 3 layers with active layer ID
**Complexity:** 🟡 MEDIUM - requires store refactor

### Challenge 2: Independent Marker Lifecycle
**Problem:** Markers must persist when galaxy layers hidden
**Solution:** Separate `markerGroup` at scene root (not child of galaxies)
**Complexity:** 🟢 LOW - follows demo pattern

### Challenge 3: Per-Layer vs Global Controls
**Problem:** Some controls apply to layer, others global
**Solution:** UI clearly distinguishes layer vs marker controls
**Complexity:** 🟡 MEDIUM - UI organization

### Challenge 4: Marker Positioning Algorithms
**Problem:** Need realistic marker placement
**Solution:** Port demo algorithms (uniform/spiral/clustered)
**Complexity:** 🟢 LOW - demo code can be ported

### Challenge 5: Raycaster Performance
**Problem:** Raycasting 100+ markers expensive
**Solution:** Only raycast on click, not every frame
**Complexity:** 🟢 LOW - demo pattern is performant

---

## Success Metrics

### Visual Parity
- [ ] 3 galaxy layers render simultaneously
- [ ] Layer visibility toggles work
- [ ] Active layer selection changes controls
- [ ] Markers independent of layers
- [ ] All 3 marker distributions distinct
- [ ] Marker pulse effect visible
- [ ] Clicking marker logs (when enabled)
- [ ] Presets restore exact config

### Performance
- [ ] 60fps with 3 visible layers
- [ ] 60fps with 200 markers + 3 layers
- [ ] No memory leaks (layer toggling)
- [ ] No memory leaks (marker regeneration)
- [ ] Raycasting doesn't impact FPS

### Code Quality
- [ ] TypeScript compiles cleanly
- [ ] No console errors/warnings
- [ ] Store state properly typed
- [ ] Components properly separated
- [ ] No regressions in existing features

---

## Risk Mitigation

### 🔴 High Risk: Store Refactor Breaking Features
**Mitigation:**
- Create `galaxy-store.ts` separately
- Migrate features gradually (week by week)
- Keep old state until migration complete
- Test existing features after each migration

### 🟡 Medium Risk: Performance with Full Feature Set
**Mitigation:**
- Profile early (after Task 2.3)
- Target 60fps minimum
- Fallback: Limit to 2 layers or 100 markers

### 🟢 Low Risk: Raycaster Click Conflicts
**Mitigation:**
- Check `event.target === canvas` before raycasting
- Prevents UI button clicks from triggering raycast

---

## Next Steps

### Ready to Start?

**Recommended approach:**

1. **Review this plan** with team/user
2. **Confirm priorities** - Is multi-layer most important?
3. **Start with Task 1.1** - Create galaxy store
4. **Work sequentially** - Each week builds on previous

**First task:** Create `src/store/galaxy-store.ts` with layer management

Would you like to:
- [ ] Start implementation immediately
- [ ] Review/modify the plan first
- [ ] Create detailed code for Task 1.1
- [ ] Set up project structure first

---

**Document Version:** 1.0
**Last Updated:** November 15, 2025
**Estimated Completion:** December 15, 2025 (4 weeks from start)
