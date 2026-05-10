# TICKET-003: Emulated API client (`src/api.ts`)

## Status

Backlog

## Goal

Build the typed API client that the rest of the frontend uses. The functions must match the spec'd backend contracts exactly, and the implementation returns canned data with a touch of artificial latency.

## Background

We're frontend-first (ADR-0002). The frontend shouldn't know it's talking to a fake. When the real backend lands, only this file changes.

See `ai/context/api-contracts.md` for the exact request/response shapes.

## Requirements

- Install `axios` (needed for upload progress).
- Create `src/api.ts` that exports:
  - `uploadFile(file: File, onProgress?: (pct: number) => void): Promise<UploadResponse>`
  - `getFileInfo(token: string): Promise<FileInfoResponse>` — returns an `active` shape for some tokens and an `{ status: 'expired' }` shape for others (e.g., token containing `expired`).
  - `getStats(): Promise<StatsResponse>` — canned numbers, slightly randomized so it feels live.
  - `getHealth(): Promise<HealthResponse>`
- Export TypeScript types for every request/response in the spec'd shapes.
- Add `// EMULATED:` comments above each fake branch.
- Inject ~300–800 ms of latency on each call so loading states are visible during development.
- Have at least one path that throws an `ApiError { error, message }` so callers can wire error handling (e.g., `uploadFile` rejects with `FILE_TOO_LARGE` if `file.size > 100 * 1024 * 1024`).

## Acceptance criteria

- All four functions are callable from a Vue component and resolve with correctly typed data.
- `uploadFile` calls the progress callback multiple times before resolving, ending at 100.
- `getFileInfo('expired-test')` (or similar sentinel) resolves with the expired shape.
- `uploadFile(<file over 100 MB>)` rejects with `{ error: 'FILE_TOO_LARGE', message: ... }`.
- `tsc --noEmit` passes.

## Files likely involved

- `frontend/package.json`
- `frontend/src/api.ts`
- `frontend/src/types/api.ts` (if you split types out)

## Out of scope

- Real HTTP. No fetch/axios call should leave the browser in this ticket.
- UI consumption (handled in TICKETs 005–009).

## Notes for implementation

- Match the canonical error codes from `ai/context/api-contracts.md`.
- Keep all the canned data in one obvious place (a `MOCK_*` block at the top of the file) so it's easy to find when the real backend lands.
- The progress simulation can be a simple `setInterval` that ticks a counter and calls `onProgress`.
