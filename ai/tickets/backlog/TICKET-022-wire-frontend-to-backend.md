# TICKET-022: Wire the frontend to the real backend (+ local dev orchestration)

## Status

Backlog

## Goal

Replace the emulated `src/api.ts` with real HTTP calls and add a one-command local dev experience that runs the Vue dev server and the Node backend in parallel.

## Background

After TICKETs 014–019 the backend exposes the full v1 API on `http://localhost:3000`. The frontend's `api.ts` currently returns canned data per ADR-0002. This ticket retires the emulation.

In production, Nginx fronts both the static frontend and the Node API. In dev we proxy from Vite (5173) to the Node app (3000) so the frontend code can keep using same-origin `/api/...` and `/d/...` paths.

## Requirements

### Frontend

- `frontend/vite.config.ts` adds a `server.proxy`:
  - `'/api'` → `http://localhost:3000`
  - `'/d'` → `http://localhost:3000`
- Replace `frontend/src/api.ts`:
  - `uploadFile(file, onProgress)` uses **axios** (already a dep — that's why we added it back in TICKET-003) so `onUploadProgress` works. POST to `/api/upload` as `multipart/form-data` with field `file`. On non-2xx, throw `ApiError` constructed from the JSON body `{ error, message }`. On axios's `ERR_NETWORK` / unknown errors, throw `ApiError('INTERNAL_ERROR', 'Upload failed. Please try again.')`.
  - `getFileInfo(token)` does a `fetch('/api/file/' + encodeURIComponent(token))` and returns the JSON. Non-2xx → throw `ApiError`. Expired/not-found is a 200 with `{ status: 'expired' }` per the contract — passes through.
  - `getStats()` does a `fetch('/api/stats')`. Errors throw `ApiError` so the StatsPanel falls into its error branch.
  - `getHealth()` mirrors stats.
- Remove every `// EMULATED:` branch and every `MOCK_*` block.
- The exported types (`UploadResponse`, `FileInfoResponse`, `StatsResponse`, `HealthResponse`, `ApiError`, `ApiErrorCode`) stay byte-identical so call sites don't change.

### Tests

- The Vitest unit tests for `api.ts` that exercise the emulation (size cap, sentinel tokens, stats bumping) need updating. Use `msw` or just `vi.spyOn(global, 'fetch')` / axios mocking — pick whichever is less ceremony. Replace the sentinel-token assertions with mock-server responses for the 200 / `{ status: 'expired' }` / 4xx branches.
- The Playwright e2e tests already drive the real UI; reconfigure `playwright.config.ts`'s `webServer` to start **both** the frontend dev server and the backend (use the `webServer: [{...}, {...}]` array form). The download-page sentinel tokens (`expired-test`, `error-test`) no longer have meaning against the real backend — switch those specs to seed an actual file via the upload flow, then assert the active state; or call a small DB-seed helper directly via a Playwright fixture.

### Dev orchestration

- Add a repo-root `package.json` with **only** a `scripts.dev` that runs frontend + backend concurrently. Use `concurrently` (a tiny dev dep), or a plain shell script — either is acceptable. The command should also stream both logs with clear prefixes.
- Repo-root `package.json` is not for installing app deps. It's only a meta-launcher. `concurrently` is its only dep.
- `README.md` (repo root, new): a 15-line "getting started" — clone, install in `frontend/` and `backend/`, copy `.env`, `npm run dev` from the root.

### Documentation

- `ai/decisions/ADR-0002-frontend-first-emulated-backend.md`: append a "Status: Superseded by TICKET-022" note. Keep the body for historical context.
- `ai/architecture.md`: drop the "frontend-first / emulated" framing in the relevant sections.
- `ai/conventions.md`: remove the "Emulation rules" subsection.

## Acceptance criteria

- From the repo root: `npm run dev` boots both servers; the frontend's `/` shows live numbers from a real `/api/stats` call, and an actual upload through the UI:
  1. Writes a file to `backend/var/uploads/...`
  2. Creates a `files` row
  3. Renders a real result link that, when opened in another tab, calls `/api/file/<token>` and renders the active card
  4. Clicking Download triggers a real file download via `/d/<token>` and the byte count comes back as the original file
- Vitest unit suite is green against the new (mocked-HTTP) `api.ts` tests.
- Playwright e2e suite is green against the real backend.
- `grep -r "EMULATED" frontend/src` returns no hits.

## Files likely involved

- `frontend/vite.config.ts`
- `frontend/src/api.ts`
- `frontend/src/api.test.ts`
- `frontend/e2e/*.spec.ts` (download specs)
- `frontend/playwright.config.ts`
- `package.json` (new, repo root)
- `README.md` (new, repo root)
- `ai/decisions/ADR-0002-frontend-first-emulated-backend.md`
- `ai/architecture.md`
- `ai/conventions.md`

## Out of scope

- Production Nginx config — separate prod-deploy ticket.
- A `frontend` env var pointing at a different backend host. Same-origin is the only supported mode in v1. Use the Vite proxy for dev.
- Backend tests — that's TICKET-023.

## Notes for implementation

- `axios.post('/api/upload', formData, { onUploadProgress: ... })` does the right thing — don't set a Content-Type header manually; axios infers it from the FormData.
- The proxy is for dev only. In production, Nginx handles `/api` and `/d`. Don't bake the backend host into the frontend bundle.
- When mocking `fetch` in unit tests, scope each mock to the test that needs it and restore in `afterEach`. Global mocks bleed.
- Take a fresh screenshot during manual QA — the dark theme should look exactly the same. This ticket is a wiring change, not a visual change.
