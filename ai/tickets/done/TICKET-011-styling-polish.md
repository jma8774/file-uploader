# TICKET-011: Styling and responsive polish pass

## Status

Backlog

## Goal

Take the functionally complete frontend (after TICKETs 001–010) and apply a single, consistent CSS pass so the app looks intentional and works on mobile.

## Background

We deferred all styling. Components have been built with default browser styles. This ticket is the deliberate "make it look nice" pass — done once, after the structure is settled, so we don't churn CSS while still moving components around.

## Requirements

- One global stylesheet (`src/assets/styles.css` or similar) imported in `main.ts`. Per-component scoped styles are fine for component-local concerns.
- A small set of CSS custom properties (`--color-bg`, `--color-text`, `--color-accent`, `--radius`, `--space-1..4`) at `:root` — no preprocessor.
- Visual design rules:
  - Single column, max width ~640 px, centered.
  - Generous padding around the upload zone; the drop zone is visually distinct (dashed border, subtle hover/dragover treatment).
  - Stats panel renders as a clean two-column list.
  - Buttons are visibly buttons (not links). Disabled state has reduced opacity + `cursor: not-allowed`.
  - Error messages use a clearly distinct color but are still readable on the page background.
- Mobile (≤480 px wide):
  - Drop zone shrinks but stays usable.
  - Buttons remain finger-sized (min 44 px tall).
  - Stats panel collapses gracefully (no horizontal scroll).
- Use system fonts (no web font import in v1).
- Light theme only in v1. Dark mode is a future ticket.

## Acceptance criteria

- The homepage and download page both look intentional, not default-styled, on desktop and on a 375-px-wide mobile viewport.
- No horizontal scroll at any reasonable width.
- All interactive states (hover, focus, active, disabled) are visible.
- Visible focus rings on all keyboard-reachable controls (don't suppress `:focus-visible`).
- No regressions: the dev-mode `npm run dev` still works; all states from prior tickets still reachable.

## Files likely involved

- `frontend/src/main.ts` (import the global stylesheet)
- `frontend/src/assets/styles.css` (new) or equivalent
- `frontend/src/components/*.vue` (scoped tweaks)
- `frontend/src/views/*.vue` (scoped tweaks)

## Out of scope

- Dark mode.
- Custom fonts.
- Animations beyond simple opacity/color transitions.
- Component library / design system.

## Notes for implementation

- Keep the CSS short. The whole app is ~5 routes and components.
- Prefer logical properties (`padding-inline`, `margin-block`) where reasonable.
- Don't reach for utility-class frameworks. Plain CSS is the call (per `ai/conventions.md`).
