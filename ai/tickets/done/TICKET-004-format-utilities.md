# TICKET-004: Format utilities (`formatBytes`, `formatTime`)

## Status

Backlog

## Goal

Add the small display helpers the rest of the UI will need. Doing this once, in isolation, keeps the rest of the tickets focused on UX.

## Background

Multiple components need to render byte sizes ("42.8 MB", "1.8 GB / 6 GB") and relative times ("Expires in 18 hours"). The spec uses these strings throughout §8.

## Requirements

- `src/utils/formatBytes.ts` — `formatBytes(n: number): string`. Uses binary units (KiB/MiB/GiB) since the rest of the system does, but renders with the spec's friendlier labels (`KB`, `MB`, `GB`). 1–2 decimal places. Examples:
  - `formatBytes(0)` → `'0 B'`
  - `formatBytes(44879012)` → `'42.8 MB'`
  - `formatBytes(1932735283)` → `'1.8 GB'`
- `src/utils/formatTime.ts` — `formatTimeRemaining(expiresAt: string | Date): string`:
  - `'Expires in 18 hours'` / `'Expires in 23 minutes'` / `'Expires in 12 seconds'`.
  - Returns `'Expired'` if the timestamp is in the past.
  - Picks the largest unit that's ≥1 (days → hours → minutes → seconds).
- Both helpers are pure, no side effects.

## Acceptance criteria

- Both files export the function as a named export.
- Unit examples above produce the listed strings.
- `tsc --noEmit` passes.

## Files likely involved

- `frontend/src/utils/formatBytes.ts`
- `frontend/src/utils/formatTime.ts`

## Out of scope

- Date pickers, timezone handling beyond UTC ISO strings.
- I18n / pluralization libraries.

## Notes for implementation

- `Math.abs` to handle slight clock skew (a file that "expires in -2 seconds" should be `'Expired'`).
- `formatBytes` should handle 0 and very large numbers (>1 GiB) without breaking.
