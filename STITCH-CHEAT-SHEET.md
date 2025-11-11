# Khora Engine - Stitch Quick Reference
*Keep this handy while generating mockups in Google Stitch*

---

## 📋 Style Block Template (Copy This!)

**Copy and paste this at the start of EVERY Stitch prompt:**

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

## 🎨 Color Palette Quick Reference

| Usage | Color | Hex Code |
|-------|-------|----------|
| **Backgrounds** | Dark blue-black | `#000510` |
| | Deep gray | `#1a1a1a` |
| **Accents** | Cyan (primary) | `#00ffff` |
| | Magenta | `#ff1493` |
| | Gold | `#ffd700` |
| **Text** | White (primary) | `#ffffff` |
| | Gray (labels) | `#888888` |
| | Dark gray (inactive) | `#666666` |
| **Status** | Green (success) | `#00ff00` |
| | Red (error/warning) | `#ff4444` |

### Special Use Cases:
- **Marketplace screens:** Use `#ffd700` (gold) as primary accent instead of cyan
- **Semi-transparent panels:** `rgba(26, 26, 26, 0.85)`
- **Hover overlays:** `rgba(0, 255, 255, 0.1)` for cyan, `rgba(255, 215, 0, 0.1)` for gold
- **Glow effects:** `0 0 20px rgba(0, 255, 255, 0.4)` for cyan buttons

---

## 🚀 Recommended Generation Workflow

### **Phase 1: Foundation** (Start here - 25-30 min)

1. **Component Library** → Section 2.1-2.6 in khora-ux.md
   - Generate 6 base components (buttons, sliders, accordions, etc.)
   - Save these as reference images
   - Use to verify aesthetic consistency

2. **Main HUD** → Section 3
   - Simplest screen, establishes overall look
   - Verify color palette and typography work together

### **Phase 2: Core Interfaces** (45-60 min)

3. **Data Panel** → Section 4
   - Quick inspector overlay (25% width)

4. **IDE Panel - Scene Tab** → Section 5.1
   - Tree view hierarchy

5. **IDE Panel - Data Tab** → Section 5.2
   - JSON code editor

6. **IDE Panel - Shader Tab** → Section 5.3
   - GLSL code editor with sub-tabs

### **Phase 3: Architect Mode** (60-90 min)

7. **Workbench Empty State** → Section 6.1
   - Tab structure

8. **Workbench - Star Editor** → Section 6.2
   - Establishes control patterns

9. **Workbench - Habitable Planet** → Section 6.4
   - Most complex control set (save for last)

### **Phase 4: Advanced Screens** (Optional - 2-3 hrs)

10. **System Map** → Section 8.1-8.3
    - Top-down strategic view

11. **Marketplace** → Section 7.1-7.4
    - Economic system UI

---

## ✅ Pre-Flight Checklist

Before generating each mockup:

- [ ] Style block template copied to prompt
- [ ] Specific section prompt added after style block
- [ ] Component references correct (if using pre-defined components)
- [ ] Measurements specified (widths, heights, padding)
- [ ] Color codes use exact hex values
- [ ] Font sizes specified

---

## 💡 Stitch Tips & Tricks

### **Getting Better Results:**

1. **Be specific with measurements**
   - ✅ "48px height × 180px width"
   - ❌ "medium sized button"

2. **Use exact colors**
   - ✅ "cyan #00ffff"
   - ❌ "bright blue"

3. **Request multiple states**
   - Example: "Show both normal and hover states side by side"
   - Example: "Show both expanded and collapsed accordion"

4. **Reference Material Design Icons**
   - If prompts ask for icons, mention: "use Material Design Icons style"
   - Common icons: mdi-atom, mdi-telescope, mdi-orbit, mdi-rocket

5. **Layer complex UIs**
   - Start with empty/simple states
   - Generate populated states separately
   - Combine concepts manually if needed

### **If Results Aren't Matching:**

- **Colors look wrong?** → Double-check hex codes copied exactly
- **Typography too large/small?** → Add specific px sizes to every text element
- **Layout feels cramped?** → Explicitly specify padding/margins (24px, 16px, 12px)
- **Panels too transparent?** → Specify exact rgba values: `rgba(26, 26, 26, 0.85)`
- **Glow effects missing?** → Include box-shadow specs: `0 0 20px rgba(0, 255, 255, 0.4)`

---

## 📐 Common Layout Patterns

### **Panel Widths:**
- **Data Panel (quick inspector):** 25% of viewport (~400px on 1600px screen)
- **IDE Panel (full inspector):** 40% of viewport (~640px on 1600px screen)
- **Marketplace Left Nav:** 200px fixed width

### **UI Element Heights:**
- **Top bars/headers:** 48-64px
- **Tab bars:** 48px
- **Accordion headers:** 44px
- **Primary buttons:** 48-56px
- **Secondary buttons:** 36-40px
- **Input fields:** 36-40px
- **Sliders (track):** 4px

### **Spacing System:**
- **Outer container padding:** 24px
- **Section padding:** 16px
- **Element spacing:** 12px
- **Compact spacing:** 8px
- **Line spacing (labels):** 6px

---

## 🎯 Quick Component Reference

Copy these component summaries into prompts when needed:

**Primary Button:**
- 48px height, transparent background, 2px cyan border, 8px radius
- Text: 14px uppercase, letter-spacing 2px
- Hover: cyan glow `0 0 20px rgba(0, 255, 255, 0.4)`

**Slider:**
- Track: 280px × 4px, #333 background
- Fill: cyan gradient from left
- Handle: 16px circle, white with 2px cyan border
- Label above: 11px uppercase gray
- Value right: 14px cyan

**Accordion:**
- Header: 44px height, rgba(255,255,255,0.03) background
- Text: 14px uppercase cyan, letter-spacing 1.5px
- Icon: ▼/▲ chevron (12px)

**Color Picker:**
- 32px × 32px square swatch
- 2px white border, 4px radius
- Label above: 11px uppercase gray

**Dropdown:**
- 200px × 36px, rgba(255,255,255,0.05) background
- 1px #444 border, 6px radius
- Text: 14px regular white
- Chevron: ▾ (12px gray)

---

## 📝 Example Prompt Structure

```
[PASTE STYLE BLOCK FROM TOP OF THIS FILE]

Create a [specific UI element/screen].

SPECIFICATIONS:
- Element 1: [exact measurements and colors]
- Element 2: [exact measurements and colors]

[Describe layout, positioning, relationships]

[Optional: Request specific states like hover, active, disabled]
```

---

## 🔄 Iteration Strategy

1. **Generate base version** with full specifications
2. **Review and note issues** (colors, spacing, proportions)
3. **Refine prompt** with corrections
4. **Re-generate** (Stitch has no memory, must re-submit full prompt)
5. **Save winners** as reference images for future consistency

---

## 📚 Full Prompt Reference

**Complete prompts for all UI sections located in:**
- **Obsidian:** `Projects/Khora Engine/khora-ux.md`
- **Code Repo:** `/Users/kraken/Documents/khora/khora-engine/KHORA-UX-UPDATED.md`

---

**Happy designing! 🚀**

*Remember: Stitch has no memory between generations. Always include the full style block!*
