# Khora Engine - UX Design Guide v2.0
**Stitch-Optimized Edition**

**Version:** 2.0 - Comprehensive Narrative Prompt Collection
**Date:** January 2025
**Status:** Phase 1 prompts validated, Phase 3-4 ready for testing
**Replaces:** `khora-ux.md` (v0.2 - component-based approach)

---

## 📖 Document Purpose & Structure

This comprehensive UX guide provides **AI-optimized prompts** for generating UI mockups in Google Stitch, covering all game phases from MVP to endgame features.

### Two-Track Approach

**Track 1: Stitch Prompts (For Mockup Generation)**
- Narrative descriptions optimized for AI image generation
- Complete screen compositions, not isolated components
- Tested landscape-forcing techniques to prevent mobile layouts

**Track 2: Implementation Specs (For Development)**
- CSS specifications and color values
- Component patterns and layout structures
- Technical requirements for developers

### How to Use This Document

1. **For mockup generation:** Copy the "Stitch Prompt" sections verbatim into Google Stitch
2. **For implementation:** Reference "Implementation Notes" for CSS specs and patterns
3. **For planning:** Use the "User Journey" sections to understand feature flow

---

## 🎨 Core Design System

### Visual Philosophy

**Khora Engine is:**
- A cerebral exploration experience, not action combat
- Built on the awe and beauty of procedurally generated space
- Focused on discovery, analysis, and strategic planning
- Culminating in creative world-building (Architect Mode)

**The UI must:**
- Serve the scene, never dominate it
- Feel like professional NASA mission control
- Provide dense information without clutter
- Use holographic aesthetics (projected on glass)
- Maintain immersion at all times

### Aesthetic Pillars

**1. Deep Space Minimalism**
- Near-black backgrounds (#000510, #1a1a1a)
- The void is the canvas, UI is subtle guidance
- Generous negative space

**2. Holographic Precision**
- Glowing cyan accents (#00ffff) for technology/interaction
- Clean geometric sans-serif typography (Inter)
- Subtle glow effects, never harsh

**3. Professional Data Visualization**
- Information-dense but organized
- Clear visual hierarchy
- Color-coded for meaning (cyan=tech, gold=data, magenta=alerts)

**4. Immersive Transparency**
- UI floats on semi-transparent panels
- Backdrop blur effects
- Scene always visible behind controls

### Color System

**Backgrounds:**
- `#000510` - Deep blue-black (space void)
- `#1a1a1a` - Deep gray (panels)
- `rgba(26, 26, 26, 0.85)` - Semi-transparent overlays

**Accents:**
- `#00ffff` - Cyan (primary interactive, technology, precision)
- `#ff1493` - Magenta (highlights, anomalies, attention)
- `#ffd700` - Gold (discoveries, data readouts, rewards)

**Text:**
- `#ffffff` - White (primary text, important values)
- `#e0e6ed` - Light gray (body text)
- `#888888` - Medium gray (labels, secondary info)
- `#666666` - Dark gray (inactive elements)

**Status:**
- `#00ff00` - Green (success, optimal)
- `#ffaa00` - Orange (warning, caution)
- `#ff4444` - Red (critical, error)

### Typography System

**Font Stack:**
```
Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Monospace: 'Courier New', 'Monaco', 'Menlo', monospace
```

**Type Scale:**
- 10px - Micro labels
- 11px - Small labels (uppercase with 1.5px letter-spacing)
- 14px - Body text, button text
- 16px - Large values
- 18px - Section headers
- 24px - Panel headers
- 32px - Large data values

**Usage Patterns:**
- Labels: 11px uppercase, letter-spacing 1.5px, color #888888
- Buttons: 14px uppercase, letter-spacing 2px, color #00ffff
- Headers: 18px bold, letter-spacing 0.5px, color #00ffff
- Data values: 16-32px bold, color #ffffff or #00ffff

### Spacing System

**Layout:**
- Outer container padding: 24px
- Section padding: 16px
- Element spacing: 12px
- Compact spacing: 8px
- Line spacing (labels): 6px

**Component Sizing:**
- Primary buttons: 48-56px height
- Secondary buttons: 36-40px height
- Input fields: 36-40px height
- Tab bars: 48px height
- Accordion headers: 44px height

### Interaction Patterns

**Hover States:**
- Buttons: Add cyan glow `box-shadow: 0 0 20px rgba(0, 255, 255, 0.4)`
- Cards: Lighten background `rgba(255, 255, 255, 0.08)`
- Links: Underline + brighten color

**Active States:**
- Tabs: Cyan text + 2px bottom border
- Selected items: Cyan left border (3px) + tinted background
- Pressed buttons: Slightly darker + inner shadow

**Disabled States:**
- 50% opacity
- Gray border (#444444)
- No hover effects

**Transitions:**
- Panel slides: 300ms cubic-bezier(0.4, 0.0, 0.2, 1)
- Hover effects: 200ms ease-out
- Accordion expand: 200ms ease-out

### Icon System

**Use Material Design Icons (MDI) for all UI symbols:**
- Folder collapsed: `mdi-chevron-right`
- Folder expanded: `mdi-chevron-down`
- Search: `mdi-magnify`
- Close: `mdi-close`
- Star: `mdi-star-circle`
- Planet: `mdi-circle-slice-8`
- Settings: `mdi-cog`
- Plus/Add: `mdi-plus`
- Minus/Remove: `mdi-minus`

---

## 📐 Phase 1: MVP Screens (Genesis Engine)

Phase 1 delivers the core exploration experience: generate star systems, visualize in 3D, inspect data.

**Scope:**
- Procedural system generation
- 3D orbital visualization
- Object selection and inspection
- Integrated IDE (Scene/Data/Shaders tabs)

**NOT in Phase 1:**
- Save/load functionality
- Multi-system galaxy
- Editable IDE/Architect Mode
- Gameplay mechanics

---

### Screen 1.1: Main HUD - Orbital View (Minimal)

**Purpose:** Primary exploration interface. The 3D star system dominates, UI is barely visible.

**User Journey:**
1. User sees empty orbital view with "Generate System" button
2. Clicks button → system generates and appears in ~2 seconds
3. Uses mouse to orbit camera (left drag), pan (right drag), zoom (wheel)
4. Can click celestial bodies to inspect (opens Data Panel)

**Design Priority:** 95% orbital visualization, 5% UI overlay

---

#### Stitch Prompt (Tested ✅)

```
Design a LANDSCAPE/HORIZONTAL desktop web application interface
(1920×1080 wide-screen format) for Khora Engine's star system
exploration view.

VIEWPORT & ORIENTATION:
This is a full-screen desktop application in landscape mode.
The interface should fill a wide monitor horizontally.

VISUAL HIERARCHY:
The entire screen is dominated by a stunning 3D orbital visualization
of a star system (this should occupy 90-95% of the viewport). UI
elements are minimal transparent overlays that barely intrude on
the beauty of the space scene - like a fighter jet heads-up display,
NOT a dashboard with panels.

MAIN ELEMENT - Orbital Visualization:
- Central glowing star (golden yellow, bright luminous core with
  soft glow halo)
- Concentric orbital rings radiating outward (glowing cyan/teal rings
  with soft outer glow and subtle inner shimmer, transitioning from
  gold near the star to cyan at outer edges)
- 6-8 planets positioned on different orbits showing size variety:
  * Large gas giant (swirled blue/teal, prominent)
  * Medium rocky planet (gold/orange tones)
  * Small terrestrial planets (various colors)
  * Tiny moons orbiting some of the larger planets
- Deep black space background transitioning to subtle teal nebula glow
  near the star
- Subtle starfield with varying star sizes
- The rings should have dynamic gradient and glow effects

MINIMAL UI OVERLAYS (small, transparent, non-intrusive):

TOP-LEFT corner:
- Small text: "SYSTEM: AETHEL" (glowing cyan, uppercase, 11px)
- Below it: "SEED: 8675309" (muted gray, 11px, slightly smaller)
- Font should be small and unobtrusive

TOP-RIGHT corner:
- Small search field: "Search Celestial Bodies" with search icon
- To the right: Zoom controls as icon buttons (+ and -)
- Small circular help/info icon (?)
- These should be minimal, barely visible against the dark background

BOTTOM-CENTER (initial state only):
- ONE large button: "GENERATE SYSTEM"
- Transparent background with glowing cyan border (2px with glow)
- About 1/6th of screen width, centered horizontally
- Positioned in lower third of screen
- Button text: uppercase, generous letter spacing

VISUAL STYLE:
- NASA mission control meets sci-fi minimalism
- All UI elements have subtle cyan glow (#00ffff)
- Transparent overlays with slight blur effect
- Clean geometric sans-serif font (Inter or similar)
- NO status cards, NO panels, NO bottom navigation
- Everything floats on top of the 3D space scene

ATMOSPHERE:
This should feel like looking through a spacecraft window with
minimal HUD guidance - the star system is the star of the show,
UI is barely there. Think elite spacecraft HUD, not dashboard.

DO NOT INCLUDE:
- Status dashboard cards
- Bottom navigation tabs
- Side panels or drawers
- Dense information panels
- Mobile app patterns
```

---

#### Implementation Notes

**Layout Structure:**
```css
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000510;
}

.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.hud-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
}

.hud-overlay > * {
  pointer-events: auto;
}
```

**System Info (Top-Left):**
```css
.system-info {
  position: absolute;
  top: 24px;
  left: 24px;
  font-family: 'Inter', sans-serif;
}

.system-name {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #00ffff;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
  margin-bottom: 6px;
}

.system-seed {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #888888;
}
```

**Search & Controls (Top-Right):**
```css
.top-right-controls {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 280px;
  height: 36px;
  padding: 0 12px 0 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #00ffff;
  outline: none;
}

.icon-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  border-color: #00ffff;
  color: #00ffff;
}
```

**Generate Button:**
```css
.generate-button {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);

  padding: 16px 48px;
  background: transparent;
  border: 2px solid #00ffff;
  border-radius: 8px;

  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #00ffff;

  cursor: pointer;
  transition: all 0.2s ease;
}

.generate-button:hover {
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
  background: rgba(0, 255, 255, 0.05);
}

.generate-button:active {
  transform: translateX(-50%) scale(0.98);
}
```

---

### Screen 1.2: Main HUD - With Status Overlay

**Purpose:** Same orbital view, but with persistent ship/mission status at bottom.

**User Journey:**
1. Same as Screen 1.1, but bottom panel is always visible
2. Shows vessel health, navigation data, current location
3. Tab navigation for different ship systems

**Design Priority:** 70% orbital view, 30% status panel

---

#### Stitch Prompt (Tested ✅)

```
Design a LANDSCAPE/HORIZONTAL desktop web application
(1920×1080 wide-screen format) for Khora Engine showing
two distinct sections:

VIEWPORT & ORIENTATION:
Full-screen desktop application in landscape mode designed
for wide monitors.

TOP SECTION (70% of screen height):
Stunning full-width orbital visualization of a star system:
- Central glowing star with bright luminous core and soft halo
- Concentric glowing cyan orbital rings with soft outer glow radiating
  outward (dynamic glow effects, not flat lines)
- 6-8 colorful planets positioned on different orbits:
  * Large blue-teal gas giant (swirled appearance)
  * Medium gold/orange rocky planet
  * Smaller terrestrial worlds (various colors)
  * Tiny moons orbiting larger planets
- Deep teal-black space background with subtle starfield
- Background transitions from deep black at edges to subtle
  teal nebula glow near the star

MINIMAL UI OVERLAYS on top of orbital view:
- Top-left: Small text "SYSTEM: AETHEL" and "SEED: 8675309"
- Top-right: Search bar "Search system, planet, vessel..." with search icon
- Top-right: Zoom controls (+ and - icon buttons)
- Top-right corner: Small circular help icon (?)

BOTTOM SECTION (30% of screen height):
Dark semi-transparent panel overlay with backdrop blur containing:

LEFT AREA - Vessel Status (2×2 grid of status cards):
Four cards showing:
- "Shield Status" → "98%" (large cyan text)
- "Hull Integrity" → "100%" (large white text)
- "Core Output" → "1.21 GW" (large white text)
- "O₂ Level" → "Optimal" (large white text)

Each status card has:
- Very dark semi-transparent background
- Thin subtle border
- Label in small uppercase gray text (11px)
- Large bold value text (28-32px)

RIGHT AREA - Navigation Data (clean aligned list):
- "Current Location: Proxima Centauri"
- "Destination: Kepler-186f"
- "ETA: 3 Days"
- "Course Status: Engaged"

Each row shows label on left (gray) and value on right (white)

BOTTOM TAB BAR (spans full width at very bottom):
Three tabs horizontally centered:
- "Navigation" (ACTIVE - bright cyan text with 2px underline)
- "Comms" (inactive - muted gray text)
- "Engineering" (inactive - muted gray text)

Tabs are small uppercase text with generous letter spacing

VISUAL STYLE:
- NASA mission control meets elegant data visualization
- Cyan accents for active/interactive elements
- Clean geometric sans-serif font (Inter)
- Semi-transparent bottom panel (rgba(0, 5, 16, 0.85) with backdrop blur)
- Bottom section feels like a HUD overlay, not a heavy dashboard
- Thin borders and subtle shadows

ATMOSPHERE:
Balance between immersive space visualization (top) and
functional ship controls (bottom). The orbital view still
dominates (70%) but essential information is always visible.
The bottom panel should feel integrated, not like a separate UI.

DO NOT INCLUDE:
- Mobile bottom navigation patterns
- Full-screen panels
- Dense cluttered layouts
```

---

#### Implementation Notes

**Bottom Panel Structure:**
```css
.bottom-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30vh;

  background: rgba(0, 5, 16, 0.85);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  display: grid;
  grid-template-rows: 1fr auto;
  gap: 0;
  padding: 24px;
  box-sizing: border-box;
}

.panel-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  align-items: start;
}
```

**Status Cards Grid:**
```css
.vessel-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
}

.status-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 20px;
  transition: background 0.2s;
}

.status-card:hover {
  background: rgba(255, 255, 255, 0.05);
}

.status-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #888888;
  margin-bottom: 8px;
}

.status-value {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
}

.status-value.cyan {
  color: #00ffff;
}
```

**Navigation Data:**
```css
.navigation-data {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
}

.nav-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.nav-label {
  color: #888888;
}

.nav-value {
  color: #ffffff;
  font-weight: 500;
}
```

**Tab Bar:**
```css
.tab-bar {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.tab {
  position: relative;
  padding: 8px 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #666666;
  cursor: pointer;
  transition: color 0.2s;
}

.tab:hover {
  color: #888888;
}

.tab.active {
  color: #00ffff;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #00ffff;
}
```

---

### Screen 1.3: Data Panel - Planet Inspector

**Purpose:** Slide-in panel showing detailed data when a celestial body is clicked.

**User Journey:**
1. User clicks a planet in orbital view
2. Panel slides in from right (400px wide, 25% of screen)
3. Shows classification, physical properties, atmosphere, resources
4. Close button or click outside panel to dismiss

**Design Priority:** Quick data access without leaving orbital view

---

#### Stitch Prompt (Untested ⏳)

```
Design a VERTICAL side panel (400px wide × 1080px tall) for
a desktop web application showing detailed planetary data in
Khora Engine.

CONTEXT & VIEWPORT:
This panel appears on the RIGHT side of a desktop screen (1920×1080)
when a planet is clicked in the orbital view. Design ONLY the panel
itself, shown against a darkened/blurred background to indicate it's
an overlay.

PANEL SPECIFICATIONS:
- Width: 400px (about 25% of screen width)
- Height: Full screen (1080px)
- Background: Semi-transparent very dark (rgba(26, 26, 26, 0.92)
  with strong backdrop blur effect)
- Border-left: 1px solid rgba(255, 255, 255, 0.1)
- Drop shadow extending to the left: 0 0 60px rgba(0, 0, 0, 0.8)
- Vertical scrolling if content overflows

HEADER SECTION (fixed at top):
- Planet name: "AETHEL III" (18px bold cyan text)
- Close button (X icon) in top-right corner
- Planet type badge: "Terrestrial World" (12px, light background chip)
- Horizontal divider line (1px, subtle) below header
- Padding: 24px

BODY SECTION (scrollable):

Section 1 - PLANET CLASSIFICATION (12px uppercase cyan heading):
Display as label-value pairs with proper spacing:
- "TYPE:" (11px uppercase gray) → "Rocky" (14px white)
- "RADIUS:" (11px uppercase gray) → "1.1 R⊕" (14px white)
- "MASS:" (11px uppercase gray) → "0.95 M⊕" (14px white)
- "ORBIT:" (11px uppercase gray) → "1.2 AU" (14px white)
- "IN HABITABLE ZONE:" (11px uppercase gray) → "Yes" (14px gold, highlighted)

Section 2 - ATMOSPHERE (12px uppercase cyan heading):
Atmospheric composition shown as horizontal progress bars:
- "Nitrogen" label → filled bar (78% cyan) → "78%" value
- "Oxygen" label → filled bar (21% cyan) → "21%" value
- "Argon" label → filled bar (1% cyan) → "1%" value

Below bars:
- "Pressure: 0.9 atm" (14px white)
- "Breathable: Yes" (14px gold, highlighted)

Section 3 - AVAILABLE RESOURCES (12px uppercase cyan heading):
Four resource icons arranged horizontally:
- Water icon (droplet) with "Water" label below (cyan)
- Minerals icon (diamond) with "Minerals" label below (cyan)
- Organics icon (flask/beaker) with "Organics" label below (cyan)
- Gases icon (wind/cloud) with "Gases" label below (cyan)

Each icon is about 40px size with 8px label text below

VISUAL STYLE:
- Dark sci-fi NASA aesthetic
- Cyan accents for headings and interactive elements
- Clean data visualization with proper spacing
- Professional technical readout appearance
- Semi-transparent so a hint of the orbital view is visible behind
- Inter or similar geometric sans-serif font
- Monospace for numerical values

ATMOSPHERE:
Like a spacecraft's sensor readout panel - functional,
information-dense but not cluttered, professional. Think
scientific instrument display, not consumer app.

The panel should feel integrated with the main view, not
like a separate modal dialog.
```

---

#### Implementation Notes

**Panel Container:**
```css
.data-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;

  background: rgba(26, 26, 26, 0.92);
  backdrop-filter: blur(12px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -20px 0 60px rgba(0, 0, 0, 0.8);

  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

  overflow-y: auto;
  z-index: 100;
}

.data-panel.open {
  transform: translateX(0);
}
```

**Panel Header:**
```css
.panel-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(8px);
  z-index: 10;
}

.planet-name {
  font-size: 18px;
  font-weight: 700;
  color: #00ffff;
  margin-bottom: 8px;
}

.planet-type-badge {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #e0e6ed;
}

.close-button {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #00ffff;
  color: #00ffff;
}
```

**Panel Sections:**
```css
.panel-section {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-heading {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #00ffff;
  margin-bottom: 16px;
}

.data-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.data-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #888888;
}

.data-value {
  color: #ffffff;
  font-weight: 500;
}

.data-value.highlighted {
  color: #ffd700;
  font-weight: 600;
}
```

**Atmospheric Bars:**
```css
.atmosphere-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.bar-label {
  width: 80px;
  font-size: 11px;
  text-transform: capitalize;
  color: #888888;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #00cccc);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-value {
  width: 40px;
  text-align: right;
  font-size: 11px;
  color: #00ffff;
  font-family: 'Courier New', monospace;
}
```

**Resource Icons:**
```css
.resources-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.resource-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.resource-icon {
  width: 40px;
  height: 40px;
  color: #00ffff;
}

.resource-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888888;
  text-align: center;
}
```

---

### Screen 1.4: IDE Panel - Scene Tab

**Purpose:** Professional dev tool showing Three.js scene hierarchy.

**User Journey:**
1. User clicks "Show IDE" button in top bar
2. Panel slides in from right (640px wide, 40% of screen)
3. Shows hierarchical tree of scene objects
4. Click objects in tree to select them in 3D view

**Design Priority:** VS Code-like professional IDE aesthetic

---

#### Stitch Prompt (Untested ⏳)

```
Design a LARGE side panel (640px wide × 1080px tall) for a
desktop web application showing an IDE-style scene inspector
for Khora Engine.

CONTEXT & VIEWPORT:
This is an advanced developer tool that slides in from the right
side of a desktop screen (1920×1080). Design ONLY the panel itself,
shown against a darkened background. The panel should feel like
VS Code or Chrome DevTools - professional IDE aesthetic.

PANEL SPECIFICATIONS:
- Width: 640px (about 40% of screen width)
- Height: Full screen (1080px)
- Background: Very dark (rgba(26, 26, 26, 0.95) with subtle blur)
- Professional code editor aesthetic with clean lines

TOP TAB BAR (fixed at top):
- Height: 48px
- Very dark background (rgba(0, 0, 0, 0.7))
- Horizontal tabs across the top, each about 160px wide:
  * "SCENE" (ACTIVE - bright cyan text with 2px cyan underline at bottom)
  * "DATA" (inactive - muted gray text)
  * "SHADERS" (inactive - muted gray text)
- Font: 12px uppercase with letter spacing (1.5px)
- Active tab indicator: 2px solid cyan line at bottom edge

MAIN CONTENT AREA - SCENE TREE VIEW:
- Background: Very dark gray, almost black (#0a0a0a)
- Padding: 20px
- Font: 13px monospace (Courier New or Monaco)
- Line height: 1.8

Tree structure with hierarchical indentation (16px per level):

📁 StarSystem (gray text #888888)
  📁 Star: Sol (white text, EXPANDED, ▼ icon before name)
    📄 Mesh (Icosahedron) (gray text #666666, indented 16px)
    📄 Sprite (Glow) (gray text #666666, indented 16px)
  📁 Planet: Earth (bright cyan text #00ffff - SELECTED, highlighted)
    📄 LOD (gray text #666666, indented 16px)
    📄 Orbit (Line) (gray text #666666, indented 16px)
  📁 Planet: Mars (white text, COLLAPSED, ▶ icon before name)
  📁 Planet: Jupiter (white text, COLLAPSED, ▶ icon before name)

TREE NODE STYLING:
- Collapsed folders: Gray triangle pointing right (▶)
- Expanded folders: Cyan triangle pointing down (▼)
- Files/leaf nodes: Small bullet point (•) in gray
- Selected node (Planet: Earth):
  * Light cyan background (very subtle, rgba(0, 255, 255, 0.1))
  * 3px solid cyan border on the left edge
  * Bright cyan text (#00ffff)
  * Slightly rounded corners on background

INTERACTION STATES:
- Hover: Very subtle background lighten (rgba(255, 255, 255, 0.03))
- Selected: As shown for Planet: Earth
- Folder icons change color when expanded (gray → cyan)

VISUAL STYLE:
- Professional IDE dark theme (like VS Code, Sublime Text, or Chrome DevTools)
- Cyan for active/selected elements
- Gray hierarchy for inactive elements
- Clean monospace typography for code/technical feel
- Proper hierarchical indentation showing parent-child relationships
- Subtle borders and backgrounds, nothing heavy

ATMOSPHERE:
Should feel like a professional development tool - clean,
functional, information-dense but organized. Like inspecting
a Three.js scene in Chrome DevTools or browsing files in VS Code.
This is a power-user tool, not a consumer interface.

SCROLLING:
The tree view should be scrollable if content exceeds height,
with a minimal custom scrollbar (thin, cyan accent).
```

---

#### Implementation Notes

**IDE Panel Container:**
```css
.ide-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 640px;
  height: 100vh;

  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);

  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

  display: flex;
  flex-direction: column;
  z-index: 200;
}

.ide-panel.open {
  transform: translateX(0);
}
```

**Tab Bar:**
```css
.ide-tabs {
  display: flex;
  height: 48px;
  background: rgba(0, 0, 0, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.ide-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #666666;

  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.ide-tab:hover {
  color: #888888;
}

.ide-tab.active {
  color: #00ffff;
}

.ide-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #00ffff;
}
```

**Scene Tree:**
```css
.scene-tree {
  flex: 1;
  padding: 20px;
  background: #0a0a0a;
  overflow-y: auto;
  font-family: 'Courier New', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.8;
}

/* Custom scrollbar */
.scene-tree::-webkit-scrollbar {
  width: 8px;
}

.scene-tree::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.scene-tree::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.2);
  border-radius: 4px;
}

.scene-tree::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.3);
}
```

**Tree Nodes:**
```css
.tree-node {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin: 2px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  user-select: none;
}

.tree-node:hover {
  background: rgba(255, 255, 255, 0.03);
}

.tree-node.selected {
  background: rgba(0, 255, 255, 0.1);
  border-left: 3px solid #00ffff;
  padding-left: 5px;
  color: #00ffff;
}

.tree-indent {
  display: inline-block;
  width: 16px;
}

.tree-icon {
  display: inline-block;
  width: 16px;
  margin-right: 8px;
  font-size: 12px;
  color: #888888;
  transition: color 0.15s;
}

.tree-node.expanded > .tree-icon,
.tree-node.selected > .tree-icon {
  color: #00ffff;
}

.tree-label {
  flex: 1;
  color: #ffffff;
}

.tree-node.file > .tree-label {
  color: #666666;
}

.tree-node.folder.collapsed > .tree-label {
  color: #ffffff;
}
```

---

### Screen 1.5: IDE Panel - Data Tab

**Purpose:** JSON data viewer with Monaco Editor showing selected object properties.

**User Journey:**
1. User has IDE panel open
2. Clicks "DATA" tab
3. Sees formatted JSON of currently selected object
4. Can copy JSON to clipboard

**Design Priority:** Clean code editor aesthetic with syntax highlighting

---

#### Stitch Prompt (Untested ⏳)

```
Design a LARGE side panel (640px wide × 1080px tall) showing a
code editor interface for viewing JSON data in Khora Engine.

CONTEXT & VIEWPORT:
This is the DATA tab of the IDE panel. Design the panel showing
a professional code editor with JSON content and syntax highlighting.
The panel is 640px wide on a desktop screen (1920×1080).

PANEL STRUCTURE:

TOP TAB BAR (same as Scene tab):
- Height: 48px
- Very dark background (rgba(0, 0, 0, 0.7))
- Three tabs:
  * "SCENE" (inactive - gray text)
  * "DATA" (ACTIVE - bright cyan text with 2px cyan underline)
  * "SHADERS" (inactive - gray text)

TOOLBAR (below tabs):
- Height: 40px
- Dark background (rgba(0, 0, 0, 0.4))
- Right side: "Copy to Clipboard" button
  * Secondary button style
  * Small size (8px 16px padding)
  * Light border, subtle background
- Padding: 8px 16px

CODE EDITOR AREA (main content):
- Background: Very dark blue-black (#000510)
- Padding: 20px
- Font: 13px monospace (Courier New or Monaco)
- Line numbers on left side (gray #444444, right-aligned)
- Code content with syntax highlighting

Display this JSON with proper syntax highlighting:

{
  "id": "planet-earth-12345",
  "name": "Earth",
  "type": "Rocky",
  "radius": 1.1,
  "mass": 0.95,
  "orbitDistance": 1.2,
  "temperature": 288,
  "waterCoverage": 0.71,
  "habitableZone": true,
  "atmosphere": {
    "composition": "Nitrogen-Oxygen",
    "pressure": 0.9,
    "density": 1.0,
    "breathable": true
  },
  "resources": {
    "Iron": 0.8,
    "Water": 0.9,
    "Titanium": 0.3
  }
}

SYNTAX HIGHLIGHTING COLORS:
- Property names (keys): Bright cyan (#00ffff)
- String values: Gold (#ffd700)
- Number values: Magenta (#ff1493)
- Boolean values: Magenta (#ff1493)
- Braces/brackets/commas: White (#ffffff)
- Line numbers: Dark gray (#444444)

VISUAL STYLE:
- Professional code editor appearance (like VS Code or Monaco Editor)
- Dark theme with excellent readability
- Proper indentation (2 spaces per level)
- Monospace font for perfect alignment
- Subtle line number column on left

ATMOSPHERE:
Should feel like viewing source code in a professional IDE -
clean, readable, technical. This is for developers and power
users who want to see the raw data.

The syntax highlighting should be vibrant enough to be functional
but not garish - professional and tasteful.
```

---

#### Implementation Notes

**Data Tab Container:**
```css
.data-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0a0a0a;
}

.data-toolbar {
  height: 40px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.copy-button {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #e0e6ed;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #00ffff;
  color: #00ffff;
}
```

**Monaco Editor Integration:**
```typescript
import { Editor } from '@monaco-editor/react';

<Editor
  height="100%"
  language="json"
  theme="vs-dark"
  value={JSON.stringify(selectedObject, null, 2)}
  options={{
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 13,
    fontFamily: '"Courier New", Monaco, monospace',
    lineNumbers: 'on',
    renderLineHighlight: 'none',
    scrollBeyondLastLine: false,
  }}
/>
```

**Custom Theme for Monaco:**
```typescript
monaco.editor.defineTheme('khora-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'string.key.json', foreground: '00ffff' },
    { token: 'string.value.json', foreground: 'ffd700' },
    { token: 'number', foreground: 'ff1493' },
    { token: 'keyword', foreground: 'ff1493' },
  ],
  colors: {
    'editor.background': '#000510',
    'editor.lineHighlightBackground': '#0a0a0a',
    'editorLineNumber.foreground': '#444444',
  }
});
```

---

### Screen 1.6: IDE Panel - Shaders Tab

**Purpose:** View GLSL shader code with syntax highlighting.

**User Journey:**
1. User has IDE panel open and object selected
2. Clicks "SHADERS" tab
3. Sees sub-tabs: Vertex / Fragment / Uniforms
4. Views shader code with GLSL syntax highlighting

**Design Priority:** Professional shader editor for technical users

---

#### Stitch Prompt (Untested ⏳)

```
Design a LARGE side panel (640px wide × 1080px tall) showing a
shader code viewer interface for Khora Engine.

CONTEXT & VIEWPORT:
This is the SHADERS tab of the IDE panel. Shows GLSL shader code
with syntax highlighting. Panel is 640px wide on desktop (1920×1080).

PANEL STRUCTURE:

TOP MAIN TAB BAR:
- Height: 48px
- Very dark background (rgba(0, 0, 0, 0.7))
- Three main tabs:
  * "SCENE" (inactive - gray)
  * "DATA" (inactive - gray)
  * "SHADERS" (ACTIVE - bright cyan with 2px underline)

SHADER SUB-TAB BAR (directly below main tabs):
- Height: 40px
- Slightly lighter dark background (rgba(0, 0, 0, 0.3))
- Three shader-specific tabs:
  * "VERTEX SHADER" (ACTIVE - white text with 2px cyan underline)
  * "FRAGMENT SHADER" (inactive - gray text)
  * "UNIFORMS" (inactive - gray text)
- Font: 11px uppercase with letter spacing (1px)
- Compact tabs, each about 180px wide

CODE EDITOR AREA:
- Background: Very dark blue-black (#000510)
- Padding: 20px
- Font: 13px monospace (Courier New or Monaco)
- Line numbers on left (gray #444444)

Display this GLSL code with syntax highlighting:

varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 u_baseColor;
uniform float u_roughness;
uniform float u_time;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.0, 0.0, 1.0));

  float diffuse = max(dot(normal, lightDir), 0.0);

  vec3 color = u_baseColor * diffuse;
  gl_FragColor = vec4(color, 1.0);
}

GLSL SYNTAX HIGHLIGHTING:
- Keywords (varying, uniform, void): Bright cyan (#00ffff)
- Types (vec3, float): Magenta (#ff1493)
- Built-in functions (normalize, max, dot): Gold (#ffd700)
- Variable names: White (#ffffff)
- Numbers/literals: Magenta (#ff1493)
- Comments (if any): Green (#00ff00)
- Operators: White (#ffffff)
- Semicolons/parentheses: White (#ffffff)

VISUAL STYLE:
- Professional shader editor appearance
- Dark theme optimized for code readability
- Clear syntax highlighting that helps understand shader structure
- Line numbers for easy reference
- Proper indentation (2 spaces)

ATMOSPHERE:
Technical shader development environment. Should feel like
Shadertoy or a professional GLSL editor. This is for advanced
users who want to see the actual shader implementation.

The syntax highlighting should help distinguish between different
GLSL constructs - keywords, types, functions, uniforms.
```

---

#### Implementation Notes

**Shader Tab Structure:**
```css
.shader-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.shader-sub-tabs {
  display: flex;
  height: 40px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.shader-sub-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #666666;

  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.shader-sub-tab:hover {
  color: #888888;
}

.shader-sub-tab.active {
  color: #ffffff;
}

.shader-sub-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #00ffff;
}
```

**Monaco Editor with GLSL:**
```typescript
<Editor
  height="100%"
  language="cpp" // Monaco uses cpp for GLSL-like syntax
  theme="khora-shader"
  value={shaderCode}
  options={{
    readOnly: true,
    minimap: { enabled: false },
    fontSize: 13,
    fontFamily: '"Courier New", Monaco, monospace',
    lineNumbers: 'on',
  }}
/>
```

**Custom Shader Theme:**
```typescript
monaco.editor.defineTheme('khora-shader', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '00ffff' },
    { token: 'type', foreground: 'ff1493' },
    { token: 'function', foreground: 'ffd700' },
    { token: 'number', foreground: 'ff1493' },
    { token: 'comment', foreground: '00ff00' },
  ],
  colors: {
    'editor.background': '#000510',
  }
});
```

---

## 📐 Phase 3: Architect Mode (Future)

Phase 3 introduces the **Workbench** - a context-sensitive shader editor that changes controls based on selected object type. This is where players transition from explorer to architect.

**Scope:**
- Live shader parameter editing
- Real-time preview updates
- "Reset to Procedural" functionality
- Save/export custom systems

**NOT in Phase 3:**
- Multi-player sharing
- Economy systems
- Gameplay mechanics

---

### Screen 3.1: Workbench - Empty State

**Purpose:** Show the Workbench tab structure before any object is selected.

**User Journey:**
1. User opens IDE panel
2. Clicks "WORKBENCH" tab (4th tab)
3. Sees empty state message prompting to select an object

---

#### Stitch Prompt (Untested ⏳)

```
Design a LARGE side panel (640px wide × 1080px tall) showing
the Workbench interface in its empty state for Khora Engine.

CONTEXT & VIEWPORT:
This is the WORKBENCH tab of the IDE panel - a new tab added
for Phase 3 (Architect Mode). Panel is 640px wide on desktop.

PANEL STRUCTURE:

TOP TAB BAR:
- Height: 48px
- Very dark background (rgba(0, 0, 0, 0.7))
- Four tabs now (added WORKBENCH):
  * "SCENE" (inactive - gray)
  * "DATA" (inactive - gray)
  * "SHADERS" (inactive - gray)
  * "WORKBENCH" (ACTIVE - bright cyan with 2px underline)
- Font: 12px uppercase, letter spacing 1.5px

EMPTY STATE CONTENT:
- Background: Dark (#1a1a1a)
- Padding: 40px
- Vertically and horizontally centered

Center content showing:
- Large icon (wrench/tool icon, 64px, cyan color, subtle glow)
- Heading: "ARCHITECT MODE" (18px, cyan, centered)
- Message: "Select an object in the 3D view to edit its properties"
  (14px, gray #888888, centered, max-width 280px)
- Small hint below: "Click any star, planet, or moon"
  (11px, very light gray #666666, centered)

VISUAL STYLE:
- Clean empty state design
- Subtle icon with glow
- Professional IDE aesthetic
- Generous whitespace
- Clear call-to-action message

ATMOSPHERE:
Inviting empty state that clearly communicates what the user
should do next. Not cluttered, just clear guidance. Should
feel like the waiting state of a professional tool.
```

---

#### Implementation Notes

**Empty State:**
```css
.workbench-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  text-align: center;
  background: #1a1a1a;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 24px;
  color: #00ffff;
  filter: drop-shadow(0 0 12px rgba(0, 255, 255, 0.4));
}

.empty-heading {
  font-size: 18px;
  font-weight: 700;
  color: #00ffff;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.empty-message {
  font-size: 14px;
  color: #888888;
  max-width: 280px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 11px;
  color: #666666;
}
```

---

### Screen 3.2: Workbench - Star Editor

**Purpose:** Context-sensitive controls for editing a selected star's properties.

**User Journey:**
1. User selects a star in the 3D view
2. Workbench tab shows star-specific controls
3. Can adjust: spectral type, temperature, radius, visual properties
4. Real-time preview in 3D view as parameters change

---

#### Stitch Prompt (Untested ⏳)

```
Design a LARGE side panel (640px wide × 1080px tall) showing
the Workbench interface with controls for editing a star in
Khora Engine.

CONTEXT & VIEWPORT:
This is the WORKBENCH tab populated with star editing controls.
A star has been selected in the 3D view. Panel is 640px wide.

PANEL HEADER (fixed at top):
- Background: Dark with bottom border
- Padding: 16px
- Text: "EDITING: SOL (STAR)" (14px uppercase cyan)
- Close/back button (X icon) in top-right

SCROLLABLE CONTENT AREA:

ACCORDION SECTION 1 - EXPANDED:
Header: "▲ CORE PROPERTIES" (14px uppercase cyan, 44px height)
Background: rgba(255, 255, 255, 0.03)

Content (padding 16px):

  Dropdown control:
  - Label above: "SPECTRAL TYPE" (11px uppercase gray)
  - Dropdown showing: "G (Sun-like)" (14px white)
  - 200px wide, dark background, thin border
  - Down chevron icon on right

  Slider control:
  - Label above: "TEMPERATURE" (11px uppercase gray)
  - Horizontal slider track (280px wide, 4px height, dark gray)
  - Filled portion in cyan (about 50% filled)
  - Handle: small circle with cyan border at current position
  - Value display on right: "5,778 K" (14px cyan)

  Slider control:
  - Label: "RADIUS"
  - Track with ~35% filled
  - Value: "1.0 R☉" (using solar symbol)

ACCORDION SECTION 2 - EXPANDED:
Header: "▲ VISUALS" (14px uppercase cyan)

Content:

  Color picker control:
  - Label: "STAR COLOR" (11px uppercase gray)
  - Color swatch: 32px square showing yellow (#ffd700)
  - White border, slight glow
  - "Click to open color picker" hint below (10px gray)

  Dropdown control:
  - Label: "SURFACE TEXTURE"
  - Current value: "Turbulent"
  - Options hint nearby: (Smooth, Turbulent, Sunspots)

ACCORDION SECTION 3 - COLLAPSED:
Header: "▼ LENS FLARE & BLOOM" (14px uppercase cyan)
- No content visible, just the collapsed header

BOTTOM TOOLBAR (fixed at bottom):
- Height: 64px
- Dark background, top border
- Padding: 16px
- Two buttons side by side:
  * Left: "Reset to Procedural" (secondary button, gray border)
  * Right: "Apply Changes" (primary button, cyan border with glow)

CONTROL SPECIFICATIONS:

Dropdowns:
- 200px width × 36px height
- Dark background rgba(255, 255, 255, 0.05)
- 1px border #444444
- 6px border-radius
- Chevron icon on right

Sliders:
- Track: 280px width × 4px height
- Track background: #333333
- Fill: Cyan gradient
- Handle: 16px circle, white with 2px cyan border
- Subtle glow on handle

Color swatches:
- 32px × 32px square
- 2px white border
- 4px border-radius
- Shows current color
- Hover: subtle white glow

VISUAL STYLE:
- Professional control panel aesthetic
- Dark sci-fi theme with cyan accents
- Clean spacing between controls (16px)
- Labels consistently styled (11px uppercase gray)
- Accordion sections with hover states
- Inter geometric sans-serif font

ATMOSPHERE:
Power user tool for customization. Should feel like professional
3D software (Blender, Unity inspector) or audio software (mixing
console). Dense with controls but organized into collapsible sections.

This is where the player becomes an architect - they're now
designing and customizing, not just exploring.
```

---

#### Implementation Notes

**Workbench Container:**
```css
.workbench-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
}

.workbench-header {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: #0a0a0a;
}

.editing-label {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #00ffff;
}

.workbench-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.workbench-footer {
  height: 64px;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: #0a0a0a;
  display: flex;
  gap: 12px;
}
```

**Accordion Sections:**
```css
.accordion-section {
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
}

.accordion-header {
  height: 44px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #00ffff;

  cursor: pointer;
  transition: background 0.2s;
}

.accordion-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.accordion-icon {
  font-size: 12px;
  transition: transform 0.2s;
}

.accordion-section.collapsed .accordion-icon {
  transform: rotate(-90deg);
}

.accordion-content {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
}

.accordion-content.collapsed {
  display: none;
}
```

**Control Components:**
```css
.control-group {
  margin-bottom: 20px;
}

.control-label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #888888;
}

/* Dropdown */
.dropdown {
  width: 200px;
  height: 36px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #444444;
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.dropdown:hover {
  border-color: #00ffff;
}

/* Slider */
.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-track {
  flex: 1;
  height: 4px;
  background: #333333;
  border-radius: 2px;
  position: relative;
  cursor: pointer;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #00cccc);
  border-radius: 2px;
  position: absolute;
  left: 0;
  top: 0;
}

.slider-handle {
  width: 16px;
  height: 16px;
  background: #ffffff;
  border: 2px solid #00ffff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
}

.slider-value {
  min-width: 80px;
  text-align: right;
  font-size: 14px;
  color: #00ffff;
  font-family: 'Courier New', monospace;
}

/* Color Picker */
.color-swatch {
  width: 32px;
  height: 32px;
  border: 2px solid #ffffff;
  border-radius: 4px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.color-swatch:hover {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}

.color-hint {
  margin-top: 4px;
  font-size: 10px;
  color: #666666;
}
```

**Toolbar Buttons:**
```css
.reset-button {
  flex: 1;
  height: 40px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #444444;
  border-radius: 6px;
  color: #e0e6ed;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #666666;
}

.apply-button {
  flex: 1;
  height: 40px;
  padding: 0 20px;
  background: transparent;
  border: 2px solid #00ffff;
  border-radius: 6px;
  color: #00ffff;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-button:hover {
  background: rgba(0, 255, 255, 0.05);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
}
```

---

### Screen 3.3: Workbench - Habitable Planet Editor

**Purpose:** Most complex workbench view with controls for terrain, water, atmosphere, clouds, and life.

**User Journey:**
1. User selects a habitable planet
2. Workbench shows comprehensive control set
3. Can adjust terrain, water, atmosphere, vegetation
4. Multiple accordion sections for organization

---

#### Stitch Prompt (Untested ⏳)

```
Design a LARGE side panel (640px wide × 1080px tall) showing
the Workbench interface for editing a habitable planet in
Khora Engine. This is the most complex editor view with many
organized controls.

CONTEXT & VIEWPORT:
WORKBENCH tab with a habitable planet selected. This planet type
has the most customization options. Panel is 640px wide.

PANEL HEADER:
- "EDITING: AETHEL III (HABITABLE PLANET)" (14px uppercase cyan)
- Close button top-right

SCROLLABLE CONTENT (use compact spacing to fit more):

ACCORDION 1 - EXPANDED: "▲ TERRAIN"
  Color picker: "LAND COLOR" - swatch showing green (#336633)
  Slider: "LANDMASS SCALE" at 60%
    Label below: "Islands ← → Supercontinent" (10px gray)
  Slider: "MOUNTAIN HEIGHT" at 45%

ACCORDION 2 - COLLAPSED: "▼ WATER"
  (Just the header, no content visible)

ACCORDION 3 - EXPANDED: "▲ ATMOSPHERE"
  Slider: "DENSITY" at 70%
  Color picker: "ATMOSPHERE COLOR" - swatch showing light blue (#6699ff)
  Slider: "FRESNEL GLOW" at 55%

ACCORDION 4 - COLLAPSED: "▼ CLOUDS"
  (Just the header, no content visible)

ACCORDION 5 - EXPANDED: "▲ LIFE & VEGETATION"
  Color picker: "VEGETATION COLOR" - swatch showing green (#44aa44)
  Slider: "FOREST COVERAGE" at 35%
  Color picker: "CITY LIGHTS (NIGHT)" - swatch showing gold (#ffd700)

SCROLL INDICATOR:
- Subtle indicator on right edge showing more content below
- Maybe a small arrow or gradient fade at bottom

BOTTOM TOOLBAR (same as star editor):
- "Reset to Procedural" button (left)
- "Apply Changes" button (right, cyan)

CONTROL STYLING (same as other workbench screens):
- Labels: 11px uppercase gray
- Sliders: 280px track, cyan fill, value display
- Color swatches: 32px square with white border
- Spacing: 12px between controls within section
- Accordion headers: 44px height, cyan text

VISUAL STYLE:
- Information-dense but organized into collapsible sections
- User can focus on one aspect at a time (open/close accordions)
- Professional control panel aesthetic
- Compact but not cramped (12px spacing)

ATMOSPHERE:
This is the creative toolbox for world-building. Many controls
but well-organized. Should feel like professional 3D software
(Substance Designer, Houdini parameter panel) - complex but
manageable through clear hierarchy and collapsible sections.

The player is now truly an architect, sculpting worlds with
precise control over every aspect.

NOTE: Show a subtle scroll indicator to communicate that
there's more content than fits on screen (this is expected
for complex objects).
```

---

#### Implementation Notes

Same CSS as Star Editor (Screen 3.2), but with:

**Scroll Indicator:**
```css
.workbench-content {
  position: relative;
}

.scroll-indicator {
  position: sticky;
  bottom: 0;
  height: 40px;
  background: linear-gradient(to top, #1a1a1a, transparent);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  padding-bottom: 8px;
  pointer-events: none;
}

.scroll-arrow {
  font-size: 12px;
  color: #00ffff;
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

/* Hide when scrolled to bottom */
.workbench-content.scrolled-to-bottom .scroll-indicator {
  display: none;
}
```

**Range Label Helper:**
```css
.slider-range-label {
  margin-top: 4px;
  font-size: 10px;
  color: #666666;
  text-align: center;
}
```

---

## 📐 Phase 4: Gameplay Screens (Future)

Phase 4 adds gameplay systems: navigation, economy, missions, and progression.

**Scope:**
- System Map (2D strategic view)
- Marketplace (station economy)
- Ship Outfitting (upgrades)
- Mission system

---

### Screen 4.1: System Map - Top-Down View

**Purpose:** Strategic 2D schematic for mission planning and navigation.

**User Journey:**
1. User opens System Map view (separate from 3D orbital view)
2. Sees top-down 2D representation of star system
3. Can select planets, plot courses, plan expeditions

---

#### Stitch Prompt (Untested ⏳)

```
Design a LANDSCAPE/HORIZONTAL desktop web application
(1920×1080 wide-screen format) showing a strategic top-down
map view of a star system for Khora Engine.

VIEWPORT & ORIENTATION:
Full-screen desktop application in landscape mode. This is
a 2D strategic view, NOT the 3D orbital view.

MAIN MAP AREA (fills most of screen):

BACKGROUND:
- Very dark (#000510)
- Subtle grid pattern: 1px lines, rgba(255, 255, 255, 0.05)
- Grid spacing: about 100px squares
- Gives technical/tactical feel

CENTER - STAR:
- Gold circle, about 40px diameter
- Soft glow: 0 0 60px rgba(255, 215, 0, 0.6)
- Label below: "SOL" (11px gold uppercase)

ORBITS - Concentric circles from center:
- Very thin lines: 1px, rgba(255, 255, 255, 0.15)
- Multiple orbits at different radii:
  * Orbit 1: ~150px radius
  * Orbit 2: ~250px radius
  * Orbit 3: ~350px radius
  * Orbit 4: ~500px radius

PLANETS on their orbits:
Small circles positioned at various points:
- Gray (#666666) = Unscanned
- White (#ffffff) = Scanned
- Gold (#ffd700) = Mission target (selected, larger, pulsing glow)

Example positions:
- Orbit 1: White planet at 2 o'clock position
- Orbit 2: Gold planet at 7 o'clock (SELECTED, larger)
- Orbit 3: Gray planet at 11 o'clock
- Orbit 4: White planet at 4 o'clock

PLAYER SHIP:
- Cyan chevron icon (24px), positioned at 180px from center, 3 o'clock
- Ship range indicator: Large faint cyan circle (300px radius)
  centered on ship, rgba(0, 255, 255, 0.05)

TRAVEL PATH:
- Dotted cyan line from ship to selected (gold) planet
- Dots: 4px circles, 12px spacing
- Shows planned route

TOP-LEFT UI:
- "SYSTEM MAP: SOL" (14px uppercase cyan)
- "SEED: 8675309" (11px gray)
- Small "Exit Map" button below

RIGHT PANEL (380px wide):
Dark semi-transparent panel showing:
- Selected planet info
- Distance, travel time
- Scan status
- Action button at bottom

VISUAL STYLE:
- NASA mission control / military tactical display
- Clean 2D schematic, not photo-realistic
- Cyan for player/interactive elements
- Gold for targets/destinations
- Grid and thin lines for technical feel

ATMOSPHERE:
Strategic planning interface. Should feel like plotting a
course on a navigation chart or tactical display. Professional,
precise, information-focused.

Think: Elite Dangerous galaxy map, Mass Effect galaxy map,
tactical strategy games.
```

---

#### Implementation Notes

**Map Container:**
```css
.system-map-container {
  width: 100vw;
  height: 100vh;
  background: #000510;
  position: relative;
  overflow: hidden;
}

.map-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Grid background */
.map-canvas::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 100px 100px;
  pointer-events: none;
}
```

**Drawing Elements (SVG or Canvas):**
```typescript
// Orbit circles
<circle
  cx={centerX}
  cy={centerY}
  r={radius}
  fill="none"
  stroke="rgba(255, 255, 255, 0.15)"
  strokeWidth="1"
/>

// Star
<circle
  cx={centerX}
  cy={centerY}
  r="20"
  fill="#ffd700"
  filter="url(#glow)"
/>

// Planet
<circle
  cx={planetX}
  cy={planetY}
  r={isSelected ? "12" : "8"}
  fill={getStatusColor(planet.status)}
  className="planet-marker"
/>

// Travel path
<path
  d={pathData}
  stroke="#00ffff"
  strokeWidth="2"
  strokeDasharray="4 12"
  fill="none"
/>
```

---

### Screen 4.2: Marketplace - Commodities Trading

**Purpose:** Station economy interface for buying/selling resources.

**User Journey:**
1. User docks at a space station
2. Opens Marketplace
3. Can sell cargo, buy supplies, view prices

**Design Priority:** Use gold (#ffd700) as primary accent instead of cyan

---

#### Stitch Prompt (Untested ⏳)

```
Design a LANDSCAPE/HORIZONTAL desktop web application
(1920×1080 wide-screen format) showing a space station
marketplace interface for Khora Engine.

CRITICAL: Use GOLD (#ffd700) as the primary accent color
for this screen, not cyan. This distinguishes the station
UI from the ship UI.

VIEWPORT & ORIENTATION:
Full-screen desktop application in landscape mode.

LEFT NAVIGATION PANEL (200px wide):
- Very dark background rgba(0, 5, 16, 0.95)
- Border-right: 1px solid #333

Four navigation items (each 60px height):
1. "COMMODITIES" - ACTIVE (gold text, 4px gold left border)
2. "SHIP OUTFITTING" - inactive (gray text)
3. "SHIPYARD" - inactive (gray text)
4. "CONTRACTS" - inactive (gray text)

Each item has:
- Icon on left (Material Design style, 32px)
- Text: 14px uppercase, letter spacing 1.5px
- Hover: background rgba(255, 215, 0, 0.1)

TOP BAR (spans full width above everything):
- Height: 64px
- Dark background rgba(0, 0, 0, 0.8)
- Left: "STATION MARKETPLACE" (18px bold, gold)
- Right: Player credits "15,000 CR" (16px, white)

MAIN CONTENT AREA (fills remaining space):
Split into two columns (50/50):

LEFT COLUMN - "YOUR CARGO":
- Header: "YOUR CARGO" (14px uppercase gold, bottom border)
- List of cargo items:

  Item 1 (SELECTED - highlighted):
  - Background: rgba(255, 215, 0, 0.1)
  - Left border: 3px gold
  - Icon: metallic chunk graphic (32×32)
  - "IRON" (14px white)
  - "150 units" (12px gray)

  Item 2, 3 (not selected, same format):
  - "TITANIUM" - 45 units
  - "RARE EARTH" - 8 units

RIGHT COLUMN - "STATION BUY ORDERS":
- Header: "STATION BUY ORDERS"
- Shows details for selected commodity (Iron):

  "IRON" (16px gold)
  "Price: 35 CR / unit" (14px white)
  "Demand: HIGH" (12px green)

BOTTOM TRANSACTION PANEL (spans full width):
- Height: 100px
- Dark background rgba(0, 0, 0, 0.6)
- Padding: 20px

Left side:
- "QUANTITY" label (11px uppercase gray)
- Input box: 150px × 40px, shows "150"
- "Max: 150" hint below (10px gray)

Right side:
- "TOTAL: 5,250 CR" (18px gold bold)
- "SELL" button (48px height, gold border, primary style)

VISUAL STYLE:
- Dark theme similar to ship UI
- GOLD accent (#ffd700) instead of cyan
- Professional marketplace/trading terminal aesthetic
- Clean data display with clear pricing

ATMOSPHERE:
Economic interface. Should feel like a trading terminal or
stock exchange - professional, transactional, focused on
numbers and deals. The gold accent distinguishes this from
the ship's cyan-themed UI.

Think: trading terminals, stock exchange interfaces,
professional financial software.
```

---

#### Implementation Notes

**Color Overrides for Marketplace:**
```css
.marketplace {
  --accent-primary: #ffd700; /* Gold instead of cyan */
  --accent-hover: rgba(255, 215, 0, 0.1);
  --accent-glow: 0 0 20px rgba(255, 215, 0, 0.4);
}

.marketplace .active-tab,
.marketplace .selected-item,
.marketplace .primary-button {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}
```

**Left Navigation:**
```css
.marketplace-nav {
  width: 200px;
  background: rgba(0, 5, 16, 0.95);
  border-right: 1px solid #333333;
  display: flex;
  flex-direction: column;
}

.nav-item {
  height: 60px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;

  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #888888;

  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 215, 0, 0.05);
  color: #aaaaaa;
}

.nav-item.active {
  color: #ffd700;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #ffd700;
}

.nav-icon {
  width: 32px;
  height: 32px;
}
```

**Cargo List:**
```css
.cargo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.cargo-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.cargo-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.cargo-item.selected {
  background: rgba(255, 215, 0, 0.1);
  border-left: 3px solid #ffd700;
  padding-left: 9px;
}

.cargo-icon {
  width: 32px;
  height: 32px;
}

.cargo-info {
  flex: 1;
}

.cargo-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.cargo-quantity {
  font-size: 12px;
  color: #888888;
}
```

---

## 📚 Appendix A: Stitch Best Practices

### The Landscape Formula (Critical!)

**Every prompt must start with:**
```
Design a LANDSCAPE/HORIZONTAL desktop web application interface
(1920×1080 wide-screen format) for [SCREEN NAME].

VIEWPORT & ORIENTATION:
This is a full-screen desktop application in landscape mode.
The interface should fill a wide monitor horizontally.
```

**Why this works:**
- Forces 16:9 aspect ratio
- Fights Stitch's mobile-first bias
- Establishes desktop context
- Prevents portrait layouts

### Narrative Over Technical Specs

**❌ Don't use technical CSS specs:**
```
Button: 48px × 180px, border: 2px solid #00ffff,
border-radius: 8px, padding: 12px 24px
```

**✅ Use narrative descriptions:**
```
Large button about 1/6th of screen width, transparent
background with glowing cyan border, soft rounded corners,
generous padding
```

**Why:** Stitch is an AI image generator, not a design tool. It thinks in images and descriptions, not CSS.

### Use Negative Instructions

**Always include a "DO NOT INCLUDE" section:**
```
DO NOT INCLUDE:
- Status dashboard cards
- Bottom navigation tabs
- Side panels or drawers
- Dense information panels
- Mobile app patterns
```

**Why:** Prevents Stitch from adding unwanted UI chrome based on common web patterns.

### Size Vocabulary

**Use relative terms:**
| Instead of... | Say... |
|--------------|--------|
| "48px tall" | "Large button, prominent" |
| "180px wide" | "About 1/6th of screen width" |
| "400px panel" | "25% of viewport" |
| "24px padding" | "Generous padding" |

### Visual Analogies Work

**Use references Stitch understands:**
- "Like a fighter jet HUD"
- "NASA mission control aesthetic"
- "VS Code dark theme"
- "Holographic projection on glass"
- "Professional data visualization"
- "Trading terminal interface"

### Complete Screens Only

**Don't ask for:**
- ❌ Isolated buttons
- ❌ Single components
- ❌ Design system swatches

**Instead ask for:**
- ✅ Full screens with components in context
- ✅ Specific sections ("side panel only")
- ✅ Complete user flows

### Testing Strategy

**For each new screen:**
1. Generate with base prompt
2. Check orientation (landscape vs portrait)
3. Check visual hierarchy (right elements dominate?)
4. Check color palette (cyan/gold correct?)
5. Refine and regenerate if needed
6. Document what worked in this file

---

## 📚 Appendix B: Implementation Color Palette

### CSS Custom Properties

```css
:root {
  /* Backgrounds */
  --bg-space: #000510;
  --bg-panel: #1a1a1a;
  --bg-panel-alt: #0a0a0a;
  --bg-overlay: rgba(26, 26, 26, 0.85);
  --bg-overlay-strong: rgba(26, 26, 26, 0.95);

  /* Accents */
  --accent-cyan: #00ffff;
  --accent-magenta: #ff1493;
  --accent-gold: #ffd700;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #e0e6ed;
  --text-tertiary: #888888;
  --text-inactive: #666666;

  /* Status */
  --status-success: #00ff00;
  --status-warning: #ffaa00;
  --status-error: #ff4444;
  --status-info: #00ccff;

  /* Borders */
  --border-subtle: 1px solid rgba(255, 255, 255, 0.1);
  --border-medium: 1px solid rgba(255, 255, 255, 0.2);
  --border-accent: 2px solid var(--accent-cyan);

  /* Glow Effects */
  --glow-cyan: 0 0 20px rgba(0, 255, 255, 0.4);
  --glow-cyan-strong: 0 0 40px rgba(0, 255, 255, 0.6);
  --glow-gold: 0 0 20px rgba(255, 215, 0, 0.4);
  --glow-white: 0 0 12px rgba(255, 255, 255, 0.3);

  /* Shadows */
  --shadow-panel: 0 0 60px rgba(0, 0, 0, 0.8);
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.4);
}
```

### Color Usage Guidelines

**Cyan (#00ffff):**
- Primary interactive elements (buttons, links)
- Technology/precision indicators
- Active tabs and selected items
- Ship/exploration UI accent

**Gold (#ffd700):**
- Data readouts and discoveries
- Important values (habitable zone: yes)
- Marketplace/station UI accent
- Rewards and achievements

**Magenta (#ff1493):**
- Alerts and anomalies
- Numerical values in editors
- Attention-required indicators
- Special events

**White (#ffffff):**
- Primary text and headings
- Important data values
- Always-visible UI elements

**Gray Spectrum:**
- #e0e6ed - Body text
- #888888 - Labels and secondary info
- #666666 - Inactive/disabled elements
- #444444 - Borders and dividers

---

## 📚 Appendix C: Troubleshooting Guide

### Issue: Stitch Still Generates Mobile Layouts

**Symptoms:**
- Portrait orientation
- ~400-500px width
- Bottom tab navigation
- Vertical scrolling

**Solutions:**

**Level 1 - Add more keywords:**
```
Design a LANDSCAPE/HORIZONTAL desktop monitor display
(16:9 WIDESCREEN aspect ratio, 1920×1080 resolution)
```

**Level 2 - Add explicit negatives:**
```
CRITICAL: This is a DESKTOP COMPUTER MONITOR display,
NOT a mobile phone. LANDSCAPE orientation (wider than tall).
NO mobile app patterns.
```

**Level 3 - Use aspect ratio language:**
```
The interface should be HORIZONTAL and fill a WIDE
desktop monitor with 16:9 aspect ratio. Think cinema
display, not smartphone.
```

### Issue: Too Much UI Chrome

**Symptoms:**
- Status cards everywhere
- Bottom navigation unprompted
- Panels cover orbital view

**Solutions:**

**Strengthen hierarchy:**
```
CRITICAL: The 3D orbital view should occupy 90-95% of
the screen. UI elements should be subtle transparent
overlays that barely intrude.
```

**Add analogies:**
```
Think fighter jet HUD, not control panel dashboard.
```

**Expand DO NOT INCLUDE:**
```
DO NOT INCLUDE:
- Status dashboard cards
- Bottom navigation tabs
- Side panels or drawers
- Dense information panels
- Full-screen overlays
- Mobile app patterns
- Heavy UI chrome
```

### Issue: Wrong Colors

**Symptoms:**
- Blue instead of cyan
- Flat colors without glow
- Monotone palette

**Solutions:**

**Be more descriptive:**
```
- Glowing BRIGHT cyan (#00ffff) with soft outer halo
- Dynamic gradient from gold (near star) to cyan (edges)
- NOT blue, use cyan specifically
```

**Add atmosphere:**
```
VISUAL STYLE:
- Holographic cyan glow effects throughout
- Luminous elements with soft halos
- Deep teal-black space background
```

### Issue: Elements Too Small/Large

**Symptoms:**
- Tiny unreadable text
- Buttons too small
- Panels too narrow

**Solutions:**

**Use proportions:**
```
- About 1/6th of screen width (not "180px")
- Occupies lower third (not "bottom 360px")
- Large and prominent (not "48px height")
```

**Add context:**
```
The button should be large enough to be easily clickable,
about the width of 2-3 words of title text.
```

---

## 📚 Appendix D: Quick Reference Card

**Copy this starter to your clipboard when using Stitch:**

```
STITCH PROMPT STARTER TEMPLATE:

Design a LANDSCAPE/HORIZONTAL desktop web application interface
(1920×1080 wide-screen format) for [SCREEN NAME] in Khora Engine.

VIEWPORT & ORIENTATION:
This is a full-screen desktop application in landscape mode.
The interface should fill a wide monitor horizontally.

VISUAL HIERARCHY:
[Describe what dominates - usually 80-95% of screen]

[Describe specific UI elements with relative sizes and positions]

VISUAL STYLE:
- NASA mission control meets sci-fi minimalism
- [Cyan/Gold] accents for interactive elements
- Clean geometric sans-serif font (Inter)
- Transparent overlays with subtle glow effects
- Professional data visualization aesthetic

ATMOSPHERE:
[Emotional/experiential description]

DO NOT INCLUDE:
- Status dashboard cards (unless specifically needed)
- Bottom navigation tabs (unless specifically needed)
- Side panels (unless specifically needed)
- Mobile app patterns
- Dense cluttered layouts
```

---

## 📋 Version History

**v2.0 (January 2025)** - Complete rewrite
- Stitch-optimized narrative prompts
- Landscape-forcing techniques validated
- Phase 1 screens tested and documented
- Phase 3-4 screens ready for testing
- Comprehensive implementation notes
- Troubleshooting guide added

**v0.2 (October 2024)** - Original component-based approach (archived)
- Technical CSS specifications
- Isolated component prompts
- Did not work well with Stitch

---

**End of Document**

*Comprehensive UX Design Guide v2.0*
*Stitch-Optimized Edition*
*Last Updated: January 2025*
*Status: Phase 1 tested, Phase 3-4 ready for validation*