# TICKET-023: Backend tests (Vitest + supertest)

## Status

Backlog

## Goal

Add a backend test suite covering token generation, file expiration logic, max-download calculation, stats queries, cleanup selection logic (per spec §20), plus HTTP-level integration tests for upload / file-info / download / stats. Run in CI alongside the frontend suite.

## Background

Spec §20 lays out the expected coverage. We use Vitest to match the frontend toolchain. `supertest` drives the Express app without a real server. Each integration test uses a fresh on-disk SQLite database in a temp directory so tests are isolated.

## Requirements

### Toolchain

- DevDeps: `vitest`, `supertest`, `@types/supertest`.
- `backend/vitest.config.ts` with `environment: 'node'` and `globals: true`.
- Npm scripts: `test` (`vitest run`), `test:watch` (`vitest`).

### Unit tests (co-located `*.test.ts`)

- `tokenService.test.ts`: tokens are 22-char base64url strings, every call yields a different value across 1000 iterations.
- `fileService.test.ts`: `computeMaxDownloads(sizeBytes)` matches the spec formula and `max(1, ...)` floor for tiny / zero / huge sizes.
- `expiration helpers`: `isExpired(expiresAt, now)` returns true for past timestamps, false for future, true for invalid input.
- `cleanupService.test.ts`: given a pre-populated DB, one pass marks the right rows deleted, unlinks the right files, and trims oldest-first when over the storage cap.
- `statsService.test.ts`: with a known set of `files` + `download_events` + `bandwidth_events` rows, each field returns the expected number.

### Integration tests (`backend/test/integration/*.test.ts`)

Helper: `createTestApp()` returns an Express app wired to a fresh DB + uploads dir under `os.tmpdir()`. Cleanup runs after each test.

- `upload.test.ts`:
  - 200 + spec response shape for a small file.
  - 413 + `FILE_TOO_LARGE` for an oversized file.
  - 400 + `INTERNAL_ERROR` when no `file` field is present.
  - The DB row + on-disk file both exist after success.
  - When the upload fails after the file is written (simulate via a forced DB-insert error), the on-disk file is cleaned up.
- `file-info.test.ts`:
  - 200 + active shape for a token just uploaded.
  - 200 + `{ status: 'expired' }` for a token with `expires_at` in the past.
  - 200 + `{ status: 'expired' }` for a random unknown token.
  - The endpoint does not increment `download_count`.
- `download.test.ts`:
  - 200 + correct bytes for an active token; Content-Disposition has the original filename.
  - `download_count` and `bytes_downloaded_estimate` increment by exactly 1 / size after each successful download.
  - A `download_events` row + `bandwidth_events` row are inserted.
  - 404 + `EXPIRED` for an unknown token.
  - 403 + `MAX_DOWNLOADS_REACHED` once `download_count == max_downloads`.
- `stats.test.ts`:
  - Empty DB returns zeros + configured limits.
  - After 1 upload + 1 download, totals/active/storage/today fields match.
  - Setting `uploads_enabled='false'` in `app_settings` flips the boolean in the response.
- `rate-limits.test.ts` (added with TICKET-021, but write the test stubs here):
  - 5 successful uploads + 6th returns 429 from the same simulated IP.
  - 30 successful downloads + 31st returns 429.
  - Per-file 4th download of the same token by same IP returns 429.

### CI

- Update `.github/workflows/test.yml` to add a `backend` job that runs `npm ci` + `npm test` in `backend/` against Node 20.
- Both jobs (`frontend`, `backend`) run on push + PR. They can run in parallel.

## Acceptance criteria

- `cd backend && npm test` runs the suite to green.
- The Vitest suite never touches `var/app.db` or `var/uploads/` — only temp directories.
- CI runs both frontend and backend jobs.
- New tests cover every endpoint at least at the 200 / canonical-error level.

## Files likely involved

- `backend/package.json`
- `backend/vitest.config.ts`
- `backend/src/**/*.test.ts`
- `backend/test/integration/*.test.ts`
- `backend/test/helpers/createTestApp.ts`
- `.github/workflows/test.yml`
- `ai/workflows.md` (drop the "test framework not yet wired" line for the backend)

## Out of scope

- Visual regression tests.
- Load / stress testing.
- Browser-based e2e of the backend (the frontend's Playwright suite already covers the integration after TICKET-022).
- A separate "smoke" environment.

## Notes for implementation

- Each integration test should `beforeEach(() => createTestApp())` and tear it down in `afterEach` to avoid cross-test bleed.
- Use `supertest(app).post('/api/upload').attach('file', Buffer.from('...'), 'sample.txt')`. No real network is needed.
- For the rate-limit tests, you'll want to override `app.set('trust proxy', true)` and send a fake `X-Forwarded-For` header so each test can simulate a different "IP."
- Don't share a Vitest `beforeAll` that wires the real config — tests must use the temp-dir overrides, not the dev defaults.
