# Khora Documentation Archive

Historical implementation notes, milestone reports, design drafts, and diagnostic tools live here so the repository root remains focused on current work.

These files preserve project history. They are **not** the source of truth for current commands, architecture, or readiness claims.

## Current documentation

Use these first:

- [`../../README.md`](../../README.md)
- [`../../TASKS.md`](../../TASKS.md)
- [`../../PLANNING.md`](../../PLANNING.md)
- [`../../ROADMAP.md`](../../ROADMAP.md)
- [`../verification.md`](../verification.md)
- [`../plans/2026-08-16-project-cleanup-plan.md`](../plans/2026-08-16-project-cleanup-plan.md)

## Archive sections

### `sessions/`

Chronological session handoffs and status snapshots from Phase 1, galaxy integration, shader work, and Orbit V1 development. Treat dates and “next action” statements as historical context.

### `milestones/`

Phase completion reports, acceptance procedures, LOD guides, and implementation plans. These document decisions and outcomes at the time they were written.

### `design/`

Earlier UX prompts, Stitch-oriented design drafts, and design cheat sheets. Current color and typography decisions remain governed by the project instructions and designated style guide.

### `tools/`

Historical manual diagnostics and standalone HTML/JavaScript experiments. They are not part of `npm run verify` and may rely on older data or rendering contracts.

## Archive policy

- Do not update archived documents to make them appear current.
- If an archived decision still governs current code, restate it in current documentation and link back here.
- New session transcripts should not be added at the repository root.
- Prefer focused plans in `docs/plans/`, specifications in `docs/specs/`, and repeatable checks in `docs/verification.md`.
