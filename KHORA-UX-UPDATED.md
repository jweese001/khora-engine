# Khora Engine - UI/UX Mockup Prompts

**Version:** 0.2 (Stitch-Optimized)
**Purpose:** Structured prompts optimized for Google Stitch. Each prompt is self-contained with full style specifications for consistency.

**Core Style Guide:**
*   **Theme:** Dark mode.
*   **Primary Colors:** Dark blues (`#000510`), deep grays (`#1a1a1a`).
*   **Accent Colors:** Bright, glowing cyan (`#00ffff`), magenta (`#ff1493`), and gold (`#ffd700`) for interactive elements, highlights, and data readouts.
*   **Typography:** Clean, sharp, sans-serif font (like Inter or a similar geometric font).
*   **Feel:** Functional, information-dense but not cluttered, professional, and immersive.

---

## Stitch Prompt Template

**IMPORTANT: Include this style block at the start of EVERY Stitch prompt for consistency.**

```
Design a UI mockup for a sci-fi space exploration game called Khora Engine.

STYLE REQUIREMENTS:
- Dark theme with background colors: #000510 (dark blue-black) and #1a1a1a (deep gray)
- Accent colors: #00ffff (cyan) for interactive elements, #ff1493 (magenta) for highlights, #ffd700 (gold) for data readouts
- Typography: Inter or similar geometric sans-serif font
  • Headers: 18px bold
  • Body text: 14px regular
  • Small labels: 11px uppercase with 1.5px letter-spacing
- Interactive elements: 2px borders, 8px border radius, subtle glow effects (#00ffff with 20px blur at 40% opacity)
- Overall aesthetic: NASA mission control meets modern data visualization - clean, professional, information-dense but not cluttered

LAYOUT:
- Use 24px padding for outer containers
- Use 16px padding for inner sections
- Use 12px spacing between elements
- Semi-transparent panels: rgba(26, 26, 26, 0.85) with 10px blur backdrop
```

---

## 1. Master Visual & Thematic Prompt

This section serves as a high-level system prompt to guide the overall look, feel, and tone of the Khora Engine game. It can be used for generating concept art, directing UI design, or as a mission statement for the project's aesthetic.

### 1.1 High-Level Concept

Khora Engine is a cerebral and immersive sci-fi game focused on exploration, discovery, and strategic planning. The player is an explorer charting a procedurally generated universe, one star system at a time. The core experience is one of awe and intellectual curiosity, not fast-paced action. The gameplay loop involves scanning celestial bodies, discovering resources and anomalies, planning expeditions based on ship capabilities, and upgrading technology to venture further into the unknown. The ultimate endgame is to transition from an explorer into an architect, shaping and customizing these generated worlds for others to discover.

### 1.2 Art Style & Tone

*   **Tone:** Awe-inspiring, grounded, and professional. The feeling should be closer to a NASA mission control or a high-end data visualization suite than an arcade game. The focus is on the beauty and scale of space.
*   **Aesthetic:** Minimalist, dark-themed, and well-organized. The UI should be clean and information-dense without feeling cluttered. It serves the experience, it doesn't dominate it.
*   **Inspiration:** Think of the functional, clean interfaces from films like *The Martian* and *Arrival*, combined with the data-rich displays of real-world tools from NASA, JPL, and SpaceX.

### 1.3 Key Experience Prompts

*   **For HUDs and UI:**
    *   "A high-tech, futuristic heads-up display for a deep space exploration vessel. The layout is minimal and dark-themed, with glowing cyan and gold holographic elements. Information is presented with crisp, vector-based lines and a clean, sans-serif typeface. The UI feels diegetic, as if it is being projected onto the cockpit's glass."

*   **For Stand-in Graphics & Scenery:**
    *   "A stunningly realistic, high-fidelity depiction of a celestial phenomenon. The image should be scientifically grounded and awe-inspiring. Examples include:
        *   A vibrant, shimmering aurora over the pole of a rocky planet.
        *   A detailed, top-down schematic of a star system, showing planetary orbits as faint, glowing lines on a dark grid.
        *   A grand, swirling spiral galaxy with a bright, dense core and wispy, star-filled arms.
        *   A solar system view with a G-type star, showcasing detailed planets with visible atmospheric haze, cloud patterns, and intricate ring systems."

*   **For the Shipyard Environment:**
    *   "A vast, cavernous spaceport hangar. The scale is immense, with a massive exploration ship docked in the center, surrounded by scaffolding and gantries. Beams of volumetric light cut through atmospheric dust motes. In the background, a colossal bay door is partially open, revealing the stars outside. Small maintenance drones and engineers can be seen, providing a sense of scale and activity."

---

## 2. Component Library

**Purpose:** Define reusable UI components for consistency across all mockups.

### 2.1 Button - Primary Action

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create a primary action button component for the Khora Engine UI:

SPECIFICATIONS:
- Size: 48px height × 180px width
- Background: Transparent
- Border: 2px solid cyan (#00ffff)
- Border radius: 8px
- Text: "GENERATE SYSTEM" in 14px uppercase, letter-spacing 2px, cyan color
- Padding: 12px 24px
- Hover state: Add soft cyan glow (box-shadow: 0 0 20px rgba(0, 255, 255, 0.4))
- Disabled state: 50% opacity, gray border (#444444)

Show both normal and hover states side by side.
```

### 2.2 Button - Secondary

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create a secondary button component:

SPECIFICATIONS:
- Size: 36px height × auto width
- Background: rgba(255, 255, 255, 0.05)
- Border: 1px solid #333333
- Border radius: 8px
- Text: 12px regular, white color
- Padding: 8px 16px
- Hover state: Background changes to rgba(255, 255, 255, 0.08)

Example text: "Copy to Clipboard"
```

### 2.3 Accordion Section Header

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create an accordion header component for collapsible sections:

SPECIFICATIONS:
- Full width
- Height: 44px
- Background: rgba(255, 255, 255, 0.03)
- Border-bottom: 1px solid #333333
- Padding: 12px 16px
- Text: 14px uppercase, letter-spacing 1.5px, cyan (#00ffff)
- Icon: Triangle chevron (▼) on the left, 12px, cyan
- Hover state: Background changes to rgba(255, 255, 255, 0.05)

Show two states:
1. Collapsed (▼ Core Properties)
2. Expanded (▲ Core Properties)
```

### 2.4 Slider Control

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create a slider control component:

SPECIFICATIONS:
- Label: Above slider, 11px uppercase, gray (#888888), "BLOOM INTENSITY"
- Track: 280px width × 4px height, background #333333, border-radius 2px
- Filled portion: Cyan gradient (#00ffff), extends from left based on value
- Handle: 16px circle, white background, 2px cyan border, positioned at current value
- Value display: Right of slider, 14px, cyan, shows "0.75"
- Glow: Handle has subtle cyan glow (0 0 8px rgba(0, 255, 255, 0.6))

Show slider at approximately 75% position.
```

### 2.5 Color Picker Swatch

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create a color picker swatch component:

SPECIFICATIONS:
- Label: Above swatch, 11px uppercase, gray (#888888), "BASE COLOR"
- Swatch size: 32px × 32px square
- Border: 2px solid white
- Border-radius: 4px
- Shows current color (example: orange #ff6600)
- Cursor: pointer (hand icon)
- Hover state: 2px white glow (0 0 8px rgba(255, 255, 255, 0.4))

Note: "Click to open full color picker" in 10px gray text below swatch.
```

### 2.6 Dropdown Menu

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create a dropdown select component:

SPECIFICATIONS:
- Label: Above dropdown, 11px uppercase, gray (#888888), "SPECTRAL TYPE"
- Dropdown box: 200px width × 36px height
- Background: rgba(255, 255, 255, 0.05)
- Border: 1px solid #444444
- Border-radius: 6px
- Text: 14px regular, white, shows current selection "G (Sun-like)"
- Chevron: Down arrow (▾) on right, 12px, gray
- Padding: 8px 12px
- Hover state: Border changes to cyan (#00ffff)

Show closed state with "G (Sun-like)" selected.
```

---

## 3. Main HUD (Exploration View)

This is the player's default view. It should be as minimal as possible to maximize the visual impact of the 3D scene.

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create a minimalist, full-screen HUD for space exploration. The main view shows a beautiful 3D rendered star system (use a placeholder: a golden star with several planets on orbital paths against a starfield). UI elements are minimal overlays.

TOP-LEFT CORNER:
- Position: 24px from top, 24px from left
- Line 1: "SYSTEM: AETHEL" (cyan #00ffff, 11px uppercase, letter-spacing 1.5px)
- Line 2: "SEED: 8675309" (gray #888888, 11px uppercase, letter-spacing 1.5px)
- Line spacing: 6px between lines

TOP-RIGHT CORNER:
- Position: 24px from top, 24px from right
- Button: "[ IDE ]" (14px uppercase, cyan border, 48px × 80px)
- Border: 2px solid cyan, 8px border-radius
- Background: transparent

BOTTOM-CENTER (Initial State):
- Position: Centered horizontally, 80px from bottom
- Button: "[ GENERATE SYSTEM ]" (14px uppercase, letter-spacing 2px)
- Size: 56px height × 240px width
- Border: 2px solid cyan with subtle glow
- Background: transparent

CENTER:
- A minimal crosshair reticle: thin cyan lines forming a + shape, 20px × 20px
- Very subtle, non-intrusive

The 3D scene behind should be clearly visible - this is the hero element.
```

---

## 4. Data Panel (Object Inspector)

This panel slides in from the right when a player has selected a celestial body. It provides a quick overview of the most important data.

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Design a data panel that slides in from the right side of the screen, overlaying the 3D view. The panel covers 25% of the viewport width (approximately 400px on a 1600px screen).

PANEL SPECIFICATIONS:
- Background: rgba(26, 26, 26, 0.85) with 10px backdrop blur
- Padding: 24px
- Drop shadow: 0 0 40px rgba(0, 0, 0, 0.8) extending left

HEADER:
- Planet name: "AETHEL III" (18px bold, cyan #00ffff)
- Border-bottom: 1px solid #333333
- Padding-bottom: 16px
- Margin-bottom: 20px

BODY - KEY DATA:
Display as label-value pairs with 12px spacing between rows:
- "TYPE:" (11px uppercase gray) "Rocky" (14px white)
- "RADIUS:" (11px uppercase gray) "1.1 R⊕" (14px white)
- "ORBIT:" (11px uppercase gray) "1.2 AU" (14px white)
- "IN HABITABLE ZONE:" (11px uppercase gray) "Yes" (14px gold #ffd700)

SUBSECTION - ATMOSPHERE:
- Heading: "ATMOSPHERE" (12px uppercase cyan, margin-top 24px, margin-bottom 12px)
- "PRESSURE:" (11px uppercase gray) "0.9 atm" (14px white)
- "BREATHABLE:" (11px uppercase gray) "Yes" (14px gold #ffd700)

SUBSECTION - RESOURCES:
- Heading: "RESOURCES" (12px uppercase cyan, margin-top 24px, margin-bottom 12px)
- Resource list (12px spacing between items):

  "IRON" (11px uppercase gray)
  [Progress bar: 280px width × 8px height, background #333, filled portion cyan for 60%, border-radius 4px]
  "60%" (11px gray, right-aligned)

  "TITANIUM" (11px uppercase gray)
  [Progress bar: 35% filled]
  "35%" (11px gray, right-aligned)

The 3D scene should be visible (but darkened) behind the left edge of the panel.
```

---

## 5. IDE Panel (Advanced Inspection)

This is the power-user tool that slides in from the right, covering ~40% of the screen. It should look like a professional, integrated development environment (like VS Code).

### 5.1 IDE Panel - Scene Tab

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create the Scene tab of the IDE Panel - a hierarchical tree view showing the 3D scene's object structure.

PANEL SPECIFICATIONS:
- Width: 40% of viewport (approximately 640px on 1600px screen)
- Background: rgba(26, 26, 26, 0.92) with 10px backdrop blur
- Slides in from right side

TAB BAR (at top):
- Height: 48px
- Background: rgba(0, 0, 0, 0.6)
- Three tabs, each 160px wide:
  1. "SCENE" - active (cyan #00ffff text, bottom border 2px cyan)
  2. "DATA" - inactive (gray #666666 text)
  3. "SHADERS" - inactive (gray #666666 text)
- Font: 12px uppercase, letter-spacing 1.5px

SCENE TREE VIEW:
- Padding: 20px
- Background: #1a1a1a
- Font: 13px monospace (Courier or similar)

Tree structure with proper indentation (16px per level):

📁 StarSystem (gray #888)
  📁 Star: Sol (white, expandable)
    📄 Mesh (Icosahedron) (gray #666, indented)
    📄 Sprite (Glow) (gray #666)
  📁 Planet: Earth (cyan #00ffff, SELECTED, highlighted background rgba(0,255,255,0.1))
    📄 LOD (gray #666, indented)
    📄 Orbit (Line) (gray #666)
  📁 Planet: Mars (white, collapsed, ▶ icon)

Icons:
- Folder collapsed: ▶ (12px, gray)
- Folder expanded: ▼ (12px, cyan)
- File: • (8px bullet, gray)

Selection highlight:
- Background: rgba(0, 255, 255, 0.1)
- Left border: 3px solid cyan
```

### 5.2 IDE Panel - Data Tab

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create the Data tab of the IDE Panel showing JSON data in a code editor.

PANEL SPECIFICATIONS:
- Width: 40% of viewport
- Background: rgba(26, 26, 26, 0.92) with 10px backdrop blur

TAB BAR:
- Same as Scene tab, but "DATA" is active (cyan) and others are inactive (gray)

TOOLBAR (below tabs):
- Height: 40px
- Background: rgba(0, 0, 0, 0.4)
- Contains: Secondary button "Copy to Clipboard" on right side (8px 16px padding)
- Padding: 8px 16px

CODE EDITOR AREA:
- Background: #000510
- Padding: 20px
- Font: 13px monospace (Courier or Monaco)
- Line numbers: On left, gray #444444

Display this JSON with syntax highlighting:
{
  "id": "planet-earth",
  "name": "Earth",
  "type": "Rocky",
  "radius": 1.1,
  "orbitDistance": 1.2,
  "habitableZone": true,
  "atmosphere": {
    "pressure": 0.9,
    "breathable": true
  }
}

Syntax highlighting colors:
- Property names: cyan #00ffff
- Strings: gold #ffd700
- Numbers: magenta #ff1493
- Booleans: magenta #ff1493
- Braces/brackets: white
```

### 5.3 IDE Panel - Shader Tab

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create the Shader tab of the IDE Panel showing GLSL shader code.

PANEL SPECIFICATIONS:
- Width: 40% of viewport
- Background: rgba(26, 26, 26, 0.92) with 10px backdrop blur

MAIN TAB BAR:
- "SHADERS" is active (cyan), others inactive

SHADER SUB-TAB BAR (below main tabs):
- Height: 40px
- Background: rgba(0, 0, 0, 0.3)
- Three sub-tabs:
  1. "VERTEX SHADER" - active (white text, bottom border 2px cyan)
  2. "FRAGMENT SHADER" - inactive (gray #666)
  3. "UNIFORMS" - inactive (gray #666)
- Font: 11px uppercase, letter-spacing 1px

CODE EDITOR AREA:
- Background: #000510
- Padding: 20px
- Font: 13px monospace
- Line numbers: gray #444444

Display this GLSL code with syntax highlighting:

varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 u_baseColor;
uniform float u_roughness;

void main() {
  vec3 normal = normalize(vNormal);
  float diffuse = max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0);

  vec3 color = u_baseColor * diffuse;
  gl_FragColor = vec4(color, 1.0);
}

Syntax highlighting:
- Keywords (varying, uniform, void): cyan #00ffff
- Types (vec3, float): magenta #ff1493
- Functions (normalize, max, dot): gold #ffd700
- Variables: white
- Comments: green #00ff00
```

---

## 6. The Workbench (Architect Mode)

This appears as a new tab in the IDE Panel called **"Workbench"**. Its key feature is that the controls are **context-sensitive**, changing based on the selected celestial body type.

### 6.1 Main Workbench Layout

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create the Workbench tab layout showing the tab structure.

PANEL SPECIFICATIONS:
- Width: 40% of viewport
- Background: rgba(26, 26, 26, 0.92)

TAB BAR:
- Four tabs now: SCENE | DATA | SHADERS | WORKBENCH
- "WORKBENCH" is active (cyan), others inactive

CONTENT AREA:
- Background: #1a1a1a
- Padding: 20px
- Shows message: "Select an object in the 3D view to edit its properties" (14px gray, centered vertically)

This is the empty state before any object is selected.
```

### 6.2 Workbench - Star Editor

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create the Workbench panel populated with controls for editing a Star.

PANEL HEADER:
- "EDITING: SOL (STAR)" (14px uppercase cyan, padding 16px, border-bottom 1px #333)

SCROLLABLE CONTENT (with 16px padding):

ACCORDION SECTION 1 - EXPANDED:
- Header: "▲ CORE PROPERTIES" (cyan, 44px height, background rgba(255,255,255,0.03))
- Content (padding 16px):

  [Dropdown component - "SPECTRAL TYPE"]
  Current value: "G (Sun-like)"

  [Slider component - "TEMPERATURE"]
  Value: "5,778 K"
  Position: ~50%

  [Slider component - "RADIUS"]
  Value: "1.0 R☉"
  Position: ~35%

ACCORDION SECTION 2 - EXPANDED:
- Header: "▲ VISUALS"
- Content:

  [Color Picker component - "STAR COLOR"]
  Swatch showing: yellow (#ffd700)

  [Dropdown component - "SURFACE TEXTURE"]
  Current value: "Turbulent"
  Options hint: Smooth, Turbulent, Sunspots

ACCORDION SECTION 3 - COLLAPSED:
- Header: "▼ LENS FLARE & BLOOM"
- No content visible (collapsed)

BOTTOM TOOLBAR:
- Height: 56px
- Border-top: 1px solid #333
- Two buttons:
  - Left: "Reset to Procedural" (secondary button)
  - Right: "Apply Changes" (primary button)
```

### 6.3 Workbench - Barren Planet Editor

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create the Workbench panel for editing a Barren Planet.

PANEL HEADER:
- "EDITING: DESOLATION IV (BARREN PLANET)" (14px uppercase cyan)

SCROLLABLE CONTENT:

ACCORDION SECTION 1 - EXPANDED:
- Header: "▲ SURFACE PROPERTIES"
- Content:

  [Color Picker - "BASE COLOR"]
  Swatch: dark gray (#444444)

  [Dropdown - "SURFACE TEXTURE"]
  Value: "Cracked"

  [Slider - "CRATER DENSITY"]
  Range label: "None ←  →  Heavy"
  Value: 65% position

ACCORDION SECTION 2 - EXPANDED:
- Header: "▲ GEOLOGICAL FEATURES"
- Content:

  [Color Picker - "ORE VEIN COLOR"]
  Swatch: rust orange (#cc6633)

  [Slider - "ORE VEIN INTENSITY"]
  Value: 40%

  [Slider - "CANYON DEPTH"]
  Value: 25%

BOTTOM TOOLBAR:
- Reset and Apply buttons
```

### 6.4 Workbench - Habitable Planet Editor

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Create the Workbench panel for editing a Habitable Planet - this is the most complex view with many controls.

PANEL HEADER:
- "EDITING: AETHEL III (HABITABLE PLANET)" (14px uppercase cyan)

SCROLLABLE CONTENT (use compact spacing to fit more):

ACCORDION 1 - EXPANDED: "▲ TERRAIN"
  [Color Picker - "LAND COLOR"] Swatch: green (#336633)
  [Slider - "LANDMASS SCALE"] 60% - Label: "Islands ← → Supercontinent"
  [Slider - "MOUNTAIN HEIGHT"] 45%

ACCORDION 2 - COLLAPSED: "▼ WATER"

ACCORDION 3 - EXPANDED: "▲ ATMOSPHERE"
  [Slider - "DENSITY"] 70%
  [Color Picker - "ATMOSPHERE COLOR"] Swatch: light blue (#6699ff)
  [Slider - "FRESNEL GLOW"] 55%

ACCORDION 4 - COLLAPSED: "▼ CLOUDS"

ACCORDION 5 - EXPANDED: "▲ LIFE & VEGETATION"
  [Color Picker - "VEGETATION COLOR"] Swatch: green (#44aa44)
  [Slider - "FOREST COVERAGE"] 35%
  [Color Picker - "CITY LIGHTS (NIGHT)"] Swatch: gold (#ffd700)

BOTTOM TOOLBAR:
- Reset and Apply buttons

NOTE: Show scroll indicator on right edge to indicate more content below.
```

---

## 7. The Station Marketplace (Store UI)

This UI is accessed when the player docks at a space station. It's a full-screen interface with a different accent color (gold) to distinguish it from the ship's HUD.

### 7.1 Marketplace - Main Layout

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE - but change accent color from cyan to gold (#ffd700)]

Design a full-screen marketplace UI for a space station.

LEFT NAVIGATION PANEL:
- Width: 200px
- Background: rgba(0, 5, 16, 0.95)
- Border-right: 1px solid #333

Navigation items (each 60px height):
1. "COMMODITIES" - ACTIVE (gold #ffd700 text, left border 4px gold)
2. "SHIP OUTFITTING" - inactive (gray #888)
3. "SHIPYARD" - inactive (gray #888)
4. "CONTRACTS" - inactive (gray #888)

Each item has:
- Icon on left (48px × 48px): use Material Design Icons
  - Commodities: cube/box icon
  - Outfitting: wrench/tool icon
  - Shipyard: rocket icon
  - Contracts: document icon
- Text: 14px uppercase, letter-spacing 1.5px
- Hover: background rgba(255, 215, 0, 0.1)

RIGHT CONTENT AREA:
- Fills remaining space
- Background: #1a1a1a
- Padding: 32px
- Shows placeholder text: "Content area - see specific tabs below"

TOP BAR (spans full width):
- Height: 64px
- Background: rgba(0, 0, 0, 0.8)
- Left: "STATION MARKETPLACE" (18px bold, gold)
- Right: Player credits "15,000 CR" (16px, white)
```

### 7.2 Marketplace - Commodities Tab

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK - use gold accent (#ffd700)]

Show the Commodities trading view - a two-column layout for selling cargo.

CONTENT AREA (split 50/50):

LEFT COLUMN - "YOUR CARGO":
- Header: "YOUR CARGO" (14px uppercase gold, border-bottom 2px gold, padding-bottom 12px)
- List of items with 12px spacing:

  Row 1 - SELECTED (background rgba(255,215,0,0.1), left border 3px gold):
    Icon: [metallic chunk graphic 32×32]
    "IRON" (14px white)
    "150 units" (12px gray)

  Row 2:
    Icon: [silver ingot graphic]
    "TITANIUM" (14px white)
    "45 units" (12px gray)

  Row 3:
    Icon: [crystal graphic]
    "RARE EARTH" (14px white)
    "8 units" (12px gray)

RIGHT COLUMN - "STATION BUY ORDERS":
- Header: "STATION BUY ORDERS"
- Matching list for selected commodity (Iron):

  "IRON" (16px gold)
  "Price: 35 CR / unit" (14px white)
  "Demand: HIGH" (12px green #00ff00)

BOTTOM TRANSACTION PANEL:
- Background: rgba(0, 0, 0, 0.6)
- Padding: 20px
- Height: 100px

  Left side:
    "QUANTITY" label (11px uppercase gray)
    Input box: 150px × 40px, shows "150" (14px white)
    "Max: 150" (10px gray below)

  Right side:
    "TOTAL: 5,250 CR" (18px gold bold)
    [Primary button: "SELL"] 48px height, gold border
```

### 7.3 Marketplace - Ship Outfitting Tab

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK - use gold accent]

Show the Ship Outfitting view for upgrading ship modules.

LAYOUT (three-panel):

LEFT PANEL (30%): "SHIP SCHEMATIC"
- Title: "YOUR SHIP: SCOUT-CLASS" (12px uppercase gold)
- Center: Simplified schematic of ship with labeled slots:

  Top: [Scanner Module] - box outline, SELECTED (gold highlight)
  Middle-left: [Propulsion] - box outline
  Middle-right: [Cargo Bay] - box outline
  Bottom: [Power Core] - box outline

  Selected slot has: 3px gold border, subtle glow

CENTER PANEL (40%): "CURRENTLY EQUIPPED"
- Shows current module in selected slot:

  "BASIC GEOLOGICAL SCANNER" (16px white)
  [Icon placeholder: radar dish graphic 64×64]

  Stats list (12px):
  • Scan Range: 2.0 AU
  • Power Draw: 50W
  • Scan Time: 5 minutes

  Small text: "Tier 1" (10px gray)

RIGHT PANEL (30%): "AVAILABLE MODULES"
- Scrollable list of upgrades:

  Module card (background rgba(255,255,255,0.03), padding 12px, margin-bottom 12px):

    "GEOLOGICAL SCANNER MK II" (14px gold)
    "Advanced mineral detection" (11px gray)

    Cost: "150 Titanium, 5,000 CR" (12px white)

    Stat changes:
    "Scan Range: +50%" (green #00ff00)
    "Power Draw: +10%" (red #ff4444)

    [Button: "PURCHASE & EQUIP"] Secondary style, full width

Show 2-3 module cards in the list.
```

### 7.4 Marketplace - Shipyard Tab

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK - use gold accent]

Show the Shipyard view for purchasing new ships.

TOP SECTION: SHIP CAROUSEL
- Height: 80px
- Background: rgba(0, 0, 0, 0.4)
- Horizontal row of ship cards:

  Card 1 - SELECTED (gold border 2px, background rgba(255,215,0,0.1)):
    [Small ship icon 48×48]
    "FREIGHTER" (12px gold)
    "45,000 CR" (10px white)

  Card 2:
    [Ship icon]
    "MINER" (12px gray)
    "38,000 CR" (10px gray)

  Card 3:
    [Ship icon]
    "EXPLORER" (12px gray)
    "52,000 CR" (10px gray)

CENTER: 3D SHIP PREVIEW
- Large area showing placeholder 3D ship model
- Background: very dark with subtle grid
- Text overlay: "ROTATE: Click and drag" (10px gray, bottom-left)

BOTTOM SECTION: SHIP STATISTICS
- Background: rgba(0, 0, 0, 0.6)
- Padding: 24px
- Two columns:

  Left column:
    "FREIGHTER-CLASS HAULER" (18px gold)
    "Designed for maximum cargo capacity" (12px gray)

  Right column (stats with icons):
    "Cargo: 500 units" (14px white)
    "Module Slots: 6" (14px white)
    "Speed: Medium" (14px white)
    "Maneuverability: Low" (14px white)

BOTTOM RIGHT:
- "TOTAL: 45,000 CR" (20px gold bold)
- [Primary button: "PURCHASE SHIP"] Large, 56px height
- Small text: "Your credits: 15,000 CR" (10px red - insufficient funds)
```

---

## 8. The System Map (Astrometrics)

This is the strategic planning view showing a top-down, 2D schematic of the star system for mission planning.

### 8.1 System Map - Main View

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Design a full-screen, top-down 2D strategic map of a star system.

BACKGROUND:
- Very dark (#000510)
- Subtle grid pattern: 1px lines, rgba(255, 255, 255, 0.05), 100px spacing

CENTER: STAR
- Gold circle, 40px diameter
- Soft glow: 0 0 60px rgba(255, 215, 0, 0.6)
- Label below: "SOL" (11px gold uppercase)

ORBITS (concentric circles from center):
- Lines: 1px, rgba(255, 255, 255, 0.15)
- Orbit 1: 150px radius
- Orbit 2: 250px radius
- Orbit 3: 350px radius
- Orbit 4: 500px radius

PLANETS (on their orbits):
- Small circles 16px diameter
- Color coding:
  - Gray (#666) = Unscanned
  - White (#fff) = Scanned
  - Gold (#ffd700) = Mission target (selected)

Position planets at various points on orbits:
- Orbit 1: White planet at 2 o'clock
- Orbit 2: Gold planet at 7 o'clock (SELECTED)
- Orbit 3: Gray planet at 11 o'clock
- Orbit 4: White planet at 4 o'clock

PLAYER SHIP:
- Cyan chevron icon 24px, positioned at 180px from center, 3 o'clock
- Ship range indicator: Large cyan circle 300px radius, very faint rgba(0,255,255,0.05), centered on ship

TRAVEL PATH:
- Dotted cyan line from ship to selected (gold) planet
- Dots: 4px, 12px spacing

TOP-LEFT UI:
- "SYSTEM MAP: SOL" (14px uppercase cyan)
- "SEED: 8675309" (11px gray)

TOP-RIGHT UI:
- [Button: "EXIT MAP"] Secondary style

RIGHT PANEL:
- Shows placeholder: "Mission Planning Panel (see below)"
```

### 8.2 System Map - Mission Planning Panel (Unscanned)

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Show the System Map with the Mission Planning Panel for an unscanned planet.

Use same map layout as 8.1, but add this panel on the right side:

RIGHT PANEL:
- Width: 380px
- Background: rgba(26, 26, 26, 0.92) with backdrop blur
- Padding: 24px
- Border-left: 1px solid #333

HEADER:
- "UNKNOWN OBJECT" (18px cyan)
- Border-bottom: 1px solid #333, padding-bottom 16px

CONTENT:
- "DISTANCE: 4.5 AU" (14px white, margin-top 20px)
- "STATUS: Unscanned" (14px gray)

SCANNER INFO (margin-top 32px):
- "SCANNER RANGE: 3.0 AU" (12px white)
- "OBJECT RANGE: 4.5 AU" (12px red)
- Warning icon: ⚠ (16px red)
- "Out of scanner range" (11px red)

BOTTOM ACTION:
- [Button: "INITIATE SCAN"] Primary style, full width, DISABLED
  - Opacity 40%, gray border
  - Below button: "Out of scanner range" (10px red)
```

### 8.3 System Map - Mission Planning Panel (Scanned)

**Prompt for Stitch:**

```
[INSERT STYLE BLOCK FROM ABOVE]

Show the Mission Planning Panel for a fully scanned planet.

RIGHT PANEL (same layout as 8.2):

HEADER:
- "AETHEL III" (18px cyan)
- Planet type chip: "Rocky (Habitable)" (11px, gold background rgba(255,215,0,0.2), gold text, 6px padding, 4px radius)

DATA SUMMARY (margin-top 20px):
- Section title: "DISCOVERIES" (12px uppercase cyan, margin-bottom 12px)
- "Resources: Titanium (Trace), Iron (High)" (12px white)
- "Anomalies: Unidentified Energy Signature" (12px magenta)

ACCORDION 1 - EXPANDED:
- Header: "▲ MISSION LOGISTICS"
- Content:
  "Distance: 1.2 AU" (12px white)
  "Est. Travel Time: 8 Hours" (12px white)
  "Fuel Cost: 75 Units" (12px red - player only has 50)

ACCORDION 2 - EXPANDED:
- Header: "▲ KNOWN HAZARDS"
- Content (icon + text rows):
  [Cracked planet icon 20px] "High Tectonic Stress" (12px white)
  [Biohazard icon 20px] "Corrosive Atmosphere" (12px white)

FUEL WARNING (margin-top 24px):
- Background: rgba(255, 68, 68, 0.1)
- Border-left: 3px solid red
- Padding: 12px
- "⚠ Insufficient Fuel" (12px red)
- "Required: 75 units" (11px white)
- "Available: 50 units" (11px red)

BOTTOM ACTION:
- [Button: "PLOT COURSE"] Primary style, full width, DISABLED
  - Below: "Insufficient fuel" (10px red)
```

---

## Workflow Summary for Using These Prompts

### Phase 1: Foundation (Start here)
1. **Component Library** (Section 2.1-2.6) - Generate all base components first
2. **Main HUD** (Section 3) - Establish core aesthetic

### Phase 2: Core Interfaces
3. **Data Panel** (Section 4) - Quick inspector
4. **IDE Panel - Scene** (Section 5.1)
5. **IDE Panel - Data** (Section 5.2)
6. **IDE Panel - Shader** (Section 5.3)

### Phase 3: Architect Mode
7. **Workbench Layout** (Section 6.1)
8. **Star Editor** (Section 6.2)
9. **Planet Editors** (Section 6.3-6.4)

### Phase 4: Advanced Screens
10. **System Map** (Section 8.1-8.3)
11. **Marketplace** (Section 7.1-7.4)

---

**End of Document**
