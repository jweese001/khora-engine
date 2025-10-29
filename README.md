# Khora Engine - Phase 1: Genesis Engine

**A procedurally generated star system visualizer with integrated development environment**

Built with React + TypeScript + Three.js + Zustand + Vite

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📚 Documentation Structure

This project uses a **hybrid documentation approach**:

### Working Documents (This Repo)
- **`TASKS.md`** - Active task tracking, updated frequently during development
- **`PLANNING.md`** - Quick reference for technical patterns and implementation details
- **`CLAUDE.md`** - AI-assisted development workflow guide (in parent directory)

### Reference Documents (Obsidian Vault)
Location: `/Projects/Khora Engine/` in Obsidian vault

- **`PRD - Khora Engine v2.md`** - Complete product requirements and specifications
- **`The Khora Engine - A Player's Journey.md`** - Narrative exploration
- **`Exploration Technology & Infrastructure.md`** - Technology progression
- **`Khora Assets.md`** - Master asset catalog
- **`Architect Mode and the IDE.md`** - IDE architecture details

**Why this split?**
- Active development files stay in the code repo (easy to update, version controlled)
- Design docs and requirements stay in Obsidian (wiki links, graph view, documentation features)
- Best of both worlds!

---

## 🎯 Project Status

**Current Phase:** Phase 1 - Single Star System MVP
**Timeline:** 12 weeks to completion
**Current Week:** Week 1 - Foundation & Setup
**Progress:** 18 / 22 tasks complete (82%)

See `TASKS.md` for detailed progress tracking.

---

## 🏗️ Project Structure

```
khora-engine/
├── src/
│   ├── components/          # React components
│   │   ├── Canvas/         # Three.js scene management
│   │   ├── IDE/            # Integrated development environment
│   │   └── UI/             # User interface controls
│   ├── generation/         # Procedural generation algorithms
│   ├── rendering/          # Three.js rendering logic
│   ├── shaders/            # GLSL shader programs
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── TASKS.md                # Active task tracking
├── PLANNING.md             # Technical reference
└── README.md               # This file
```

---

## 🌟 Phase 1 Features

### Core Functionality
- ✅ Deterministic procedural generation (seeded RNG)
- 🔄 Realistic stellar classification (O, B, A, F, G, K, M types)
- 🔄 Physics-based orbital mechanics
- 🔄 3D visualization with Three.js
- 🔄 LOD system for performance (60fps target)
- 🔄 Procedural shaders for unique planet appearances
- 🔄 Integrated IDE for scene inspection

### Explicitly NOT in Phase 1
- ❌ Save/load functionality
- ❌ Multiple star systems (galaxy)
- ❌ Player ship or gameplay mechanics
- ❌ Architect Mode (IDE editing)

See `PLANNING.md` for complete exclusions list.

---

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Three.js** - 3D rendering
- **Zustand** - State management
- **Monaco Editor** - Code editor for IDE
- **Vite** - Build tool & dev server

---

## 🎨 Development

### Key Principles

1. **Deterministic Generation** - Same seed = identical system
2. **Performance First** - 60fps non-negotiable
3. **Real Physics** - No placeholder data
4. **LOD Required** - Critical for performance
5. **Phase 1 Feature Lock** - No scope creep

### File Creation Order

Follow the sequence in `CLAUDE.md` for optimal workflow:
1. Types first (everything depends on these)
2. Utils second (generation depends on these)
3. Generation third (before rendering)
4. Rendering fourth (visualize the data)
5. UI last (wire it together)

---

## 📖 For Developers

**First time setup:**
1. Read `TASKS.md` to understand current progress
2. Read `PLANNING.md` for technical implementation details
3. Check Obsidian vault for comprehensive requirements (PRD)
4. Follow the file creation sequence in `CLAUDE.md`

**Daily workflow:**
1. Check `TASKS.md` for current week's priorities
2. Update task status as you work
3. Commit frequently with descriptive messages
4. Profile performance after visual features

---

## 🧪 Testing

```bash
# Run unit tests (when available)
npm run test

# Type checking
npm run type-check

# Lint
npm run lint
```

---

## 📝 Technical Notes

### TypeScript Configuration
- Using `erasableSyntaxOnly: true` (required for Vite 7.x)
- Enums replaced with `const` objects + `as const`
- Example: `export const SpectralType = { O: 'O', ... } as const`

### Seeded Random Number Generation
- All generation uses `SeededRandom` class (Mulberry32 algorithm)
- **Never** use `Math.random()` in generation code
- Determinism is critical for reproducibility

---

## 🚢 Phase 1 Acceptance Criteria

- [ ] Generate system in <2 seconds
- [ ] Maintain 60fps on GTX 1660 equivalent
- [ ] Same seed produces identical system
- [ ] At least 3 star types render distinctly
- [ ] Procedural shaders show unique planet surfaces
- [ ] IDE allows scene inspection
- [ ] No memory leaks on regeneration
- [ ] Professional visual appearance

Full checklist in `TASKS.md` → M6 Verification

---

## 🤝 Contributing

This is a personal project, but feedback is welcome!

1. Check `TASKS.md` for current priorities
2. Follow the code patterns in `PLANNING.md`
3. Maintain deterministic generation (seeded RNG only)
4. Profile performance before/after changes
5. Update `TASKS.md` with progress

---

## 📄 License

*To be determined*

---

## 🔗 Links

- **Obsidian Vault:** `~/Documents/Obsidian/Projects/Khora Engine/`
- **Tech Stack Docs:**
  - [Three.js](https://threejs.org/docs/)
  - [Zustand](https://github.com/pmndrs/zustand)
  - [Vite](https://vitejs.dev/)
  - [Monaco Editor](https://microsoft.github.io/monaco-editor/)

---

*Phase 1 Target: 12 weeks to production-ready MVP*
*Last Updated: October 29, 2025*
