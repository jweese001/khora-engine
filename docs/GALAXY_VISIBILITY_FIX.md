# Galaxy Layer Visibility Fix

**Date:** November 15, 2025
**Issue:** Multi-layer galaxy system showing default visible layers before user generates a galaxy
**Status:** ✅ FIXED

---

## Problem Description

The multi-layer galaxy system was showing "Layer 1" as visible by default, even when no procedural galaxy had been generated. This violated the expected user flow:

1. User should generate a galaxy using seed input
2. Visual galaxy layers should only appear AFTER generation
3. By default, all layers should be hidden

---

## Root Cause

The `createDefaultLayers()` function in `galaxy-store.ts` was setting Layer 1 `visible: true` by default:

```typescript
// ❌ BEFORE - Layer 1 visible by default
{
  id: 0,
  name: 'Layer 1',
  visible: true,  // ⬅️ Problem: shows before galaxy is generated
  config: { ... }
}
```

This caused the visual particle system to render even when no procedural galaxy existed.

---

## Solution Implemented

### 1. Changed Default Layer Visibility ✅

**File:** `src/store/galaxy-store.ts` (line 128)

```typescript
// ✅ AFTER - All layers hidden by default
{
  id: 0,
  name: 'Layer 1',
  visible: false,  // ⬅️ Hidden until galaxy is generated
  config: { ... }
}
```

All 3 layers now start with `visible: false`.

---

### 2. Added Activation/Deactivation Actions ✅

**File:** `src/store/galaxy-store.ts` (lines 247-256, 364-382)

**New Actions:**

```typescript
/**
 * Activate visual galaxy layers (called when procedural galaxy is generated)
 * Makes Layer 1 visible, keeps others hidden
 */
activateGalaxyLayers: () => void;

/**
 * Deactivate all visual galaxy layers (called when galaxy is cleared)
 */
deactivateGalaxyLayers: () => void;
```

**Implementation:**

```typescript
activateGalaxyLayers: () => {
  // Make Layer 1 visible when procedural galaxy is generated
  set((state) => ({
    layers: state.layers.map((layer) =>
      layer.id === 0 ? { ...layer, visible: true } : layer
    ) as [GalaxyLayer, GalaxyLayer, GalaxyLayer],
  }));
  console.log('[GalaxyStore] Visual galaxy layers activated (Layer 1 visible)');
},

deactivateGalaxyLayers: () => {
  // Hide all layers when galaxy is cleared
  set((state) => ({
    layers: state.layers.map((layer) =>
      ({ ...layer, visible: false })
    ) as [GalaxyLayer, GalaxyLayer, GalaxyLayer],
  }));
  console.log('[GalaxyStore] Visual galaxy layers deactivated (all hidden)');
},
```

---

### 3. Connected to Galaxy Generation Lifecycle ✅

**File:** `src/store/system-store.ts`

**Added Import:**
```typescript
import { useGalaxyStore } from './galaxy-store';
```

**Activation on Generation:** (line 405)
```typescript
generateGalaxy: (seed: number, systemCount = 12) => {
  try {
    const galaxy = generateGalaxy({ seed, systemCount });

    set({
      currentGalaxy: galaxy,
      viewMode: 'galaxy',
      // ...
    });

    // ✅ Activate visual galaxy layers when procedural galaxy is generated
    useGalaxyStore.getState().activateGalaxyLayers();

    console.log('[Store] Galaxy generation complete:', galaxy);
  } catch (error) {
    // ...
  }
},
```

**Deactivation on Clear:** (line 429)
```typescript
clearGalaxy: () => {
  set({
    currentGalaxy: null,
    viewMode: 'system',
    // ...
  });

  // ✅ Deactivate visual galaxy layers when galaxy is cleared
  useGalaxyStore.getState().deactivateGalaxyLayers();
},
```

---

## User Flow After Fix

### Before Galaxy Generation
- **UI:** LayerSelector shows 3 layers with visibility checkboxes
- **Scene:** All layers hidden (no visual particle systems visible)
- **State:** All layers `visible: false`

### User Generates Galaxy (enters seed, clicks "Generate")
1. `generateGalaxy(seed)` called in system-store
2. Procedural galaxy created with star systems
3. **Automatic:** `activateGalaxyLayers()` called
4. **Result:** Layer 1 becomes visible, showing visual particle system

### User Can Toggle Additional Layers
- User checks "Layer 2" checkbox → Layer 2 becomes visible
- User checks "Layer 3" checkbox → Layer 3 becomes visible
- User unchecks "Layer 1" → Layer 1 becomes hidden
- Multiple layers can be visible simultaneously for composition

### User Clears Galaxy
1. `clearGalaxy()` called
2. **Automatic:** `deactivateGalaxyLayers()` called
3. **Result:** All layers become hidden again

---

## Files Modified

### `src/store/galaxy-store.ts`
- **Line 128:** Changed Layer 1 `visible: true` → `visible: false`
- **Line 141:** Changed Layer 2 comment (already false)
- **Line 157:** Changed Layer 3 comment (already false)
- **Lines 247-256:** Added `activateGalaxyLayers()` and `deactivateGalaxyLayers()` actions
- **Lines 364-382:** Implemented activation/deactivation logic

### `src/store/system-store.ts`
- **Line 20:** Added `import { useGalaxyStore } from './galaxy-store';`
- **Line 405:** Added `activateGalaxyLayers()` call in `generateGalaxy()`
- **Line 429:** Added `deactivateGalaxyLayers()` call in `clearGalaxy()`

---

## Testing Checklist

### ✅ Expected Behavior

1. **On app load:**
   - [ ] No visual galaxy particle systems visible
   - [ ] LayerSelector shows all layers unchecked
   - [ ] Scene is empty (no default galaxies)

2. **After generating galaxy (e.g., seed 12345):**
   - [ ] Layer 1 checkbox becomes checked automatically
   - [ ] Visual galaxy particle system appears (pink/purple spiral)
   - [ ] Layers 2 and 3 remain unchecked and hidden

3. **Toggle Layer 2 checkbox:**
   - [ ] Layer 2 becomes visible (blue elliptical galaxy)
   - [ ] Both Layer 1 and Layer 2 visible simultaneously

4. **Toggle Layer 3 checkbox:**
   - [ ] Layer 3 becomes visible (orange ring galaxy)
   - [ ] All 3 layers visible simultaneously

5. **Uncheck Layer 1:**
   - [ ] Layer 1 becomes hidden
   - [ ] Layers 2 and 3 remain visible

6. **Clear galaxy:**
   - [ ] All checkboxes become unchecked
   - [ ] All visual galaxy particle systems hidden
   - [ ] Scene returns to empty state

---

## Build Status

```bash
npm run build
> tsc -b && vite build
```

**Result:** ✅ SUCCESS
Only pre-existing warnings in `GalaxyParticleSystem.ts` and `GalaxyRenderer.ts`.

---

## Architecture Clarification

This fix clarifies the **two separate galaxy concepts**:

### 1. Procedural Galaxy (Game Data)
- **Files:** `types/galaxy.ts`, `generation/galaxy-generator.ts`
- **Purpose:** Collection of star systems with positions
- **Generated:** When user enters seed and clicks "Generate Galaxy"
- **Storage:** `system-store.ts` → `currentGalaxy`

### 2. Visual Galaxy Particle System (Rendering)
- **Files:** `rendering/GalaxyParticleSystem.ts`, `galaxy-store.ts`
- **Purpose:** Visual particle effect background for aesthetics
- **Control:** Multi-layer system with 3 independent particle systems
- **Storage:** `galaxy-store.ts` → `layers`

**Relationship:** Visual layers are **activated when** procedural galaxy is generated, but they are independent visual effects (not data representations).

---

## Next Steps

User should now test:
1. Generate galaxy with seed (e.g., 12345)
2. Verify Layer 1 automatically becomes visible
3. Toggle Layers 2 and 3 to see multi-layer composition
4. Clear galaxy and verify all layers hide

---

**Document Version:** 1.0
**Fix Date:** November 15, 2025
**Branch:** `feature/galaxy-visual-integration`
