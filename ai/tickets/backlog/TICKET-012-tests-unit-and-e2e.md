# TICKET-012: Unit + e2e tests for the frontend

## Status

Backlog

## Goal

Add an automated test suite to the frontend so the behavior shipped in TICKETs 001–011 doesn't regress. This is the only "make sure the elements are on screen" gate the project has — manual visual checks are easy to forget.

## Background

We deferred test framework selection on purpose (see `ai/workflows.md`) so we could get the UI shape settled first. Now that the components and views exist, set up Vitest for unit tests and Playwright for headless-browser end-to-end checks.

## Requirements

### Toolchain

- Add `vitest`, `@vue/test-utils`, `jsdom` (or `happy-dom`), and `@vitest/coverage-v8` as devDependencies.
- Add `playwright` (`@playwright/test`) and install the Chromium browser binary in CI / locally.
- Add npm scripts:
  - `test` → `vitest run`
  - `test:watch` → `vitest`
  - `test:e2e` → `playwright test`
- Co-locate unit tests next to the unit under test (`formatBytes.test.ts` next to `formatBytes.ts`); put e2e specs in `frontend/e2e/`.

### Unit tests (Vitest)

Cover the determinstic pieces. At minimum:

- `formatBytes`:
  - `0` → `'0 B'`
  - `44879012` → `'42.8 MB'`
  - `1932735283` → `'1.8 GB'`
  - `6 * 1024**3` → `'6 GB'` (trimmed `.0`)
  - `250 * 1024**3` → `'250 GB'`
  - negative / NaN → `'0 B'`
- `formatTimeRemaining`:
  - 18 h ahead → `'Expires in 18 hours'`
  - 1 h ahead → `'Expires in 1 hour'` (singular)
  - past timestamp → `'Expired'`
  - invalid date string → `'Expired'`
- `api.ts`:
  - `uploadFile(<>100 MB file>)` rejects with `ApiError` code `FILE_TOO_LARGE`.
  - `uploadFile(<small file>, onProgress)` calls `onProgress` at least twice and ends at `100`.
  - `getFileInfo('expired-anything')` resolves with `{ status: 'expired' }`.
  - `getFileInfo('error-anything')` rejects with `ApiError`.
  - `getStats()` resolves with a numeric `totalUploads`.
- Component tests with `@vue/test-utils` (jsdom env):
  - `FileUploader`: picking a too-large `File` shows the spec's error message and stays out of `uploading`.
  - `FileUploader`: a valid pick shows the filename + formatted size + Upload button.
  - `UploadResult`: renders the absolute URL and the Copy/Open buttons (TICKET-007 adds this).
  - `StatsPanel`: renders a loading state then the values returned by a mocked `api.getStats()` (TICKET-008 adds this).

### E2E tests (Playwright)

Run against `npm run dev` (configure Playwright's `webServer` block). Use Chromium headless. Keep specs short and focused on "are the right things on screen":

- **homepage.spec.ts**
  - `/` renders the title "Temporary File Drop" and the drop zone.
  - The stats panel renders the labels listed in spec §8 (`Total uploads`, `Total downloads`, `Active files`, `Storage used`, `Uploads today`, `Downloads today`, `Monthly transfer`).
- **upload-flow.spec.ts**
  - Choose a small file via `setInputFiles` → the filename and size appear, Upload button is enabled.
  - Click Upload → "Upload progress" text appears, then the result URL renders.
  - The Copy Link button writes the URL to the clipboard (use Playwright clipboard permissions).
- **download-page.spec.ts**
  - `/file/<some-token>` shows filename + size + "Expires in …" + Download button (after TICKET-009).
  - `/file/expired-test` shows the expired message + "Upload another file" action.
  - `/file/error-test` shows the generic error state.
- **safety-cap.spec.ts** (after TICKET-010)
  - With `uploadsEnabled` flipped to `false` in the emulated stats, the safety-cap banner appears and the Upload button is disabled.

### Coverage / CI

- Add a `test` GitHub Actions workflow (`.github/workflows/test.yml`) that runs `npm ci && npm run build && npm test && npx playwright install --with-deps chromium && npm run test:e2e` on push and PR.
- Don't enforce a hard coverage threshold yet — get the suite green first, tune later.

## Acceptance criteria

- `cd frontend && npm test` runs the Vitest suite to green.
- `cd frontend && npm run test:e2e` runs the Playwright suite to green against a freshly built dev server.
- All four homepage stat labels and the dropzone text are asserted in at least one e2e spec, so a future "moved an element off screen" regression breaks the build.
- The GitHub Actions workflow file exists and exercises both suites.
- No test imports the real backend — everything runs against the emulated `src/api.ts`.

## Files likely involved

- `frontend/package.json` (devDeps + scripts)
- `frontend/vitest.config.ts` or `frontend/vite.config.ts` (test config)
- `frontend/playwright.config.ts`
- `frontend/src/**/*.test.ts` (co-located unit specs)
- `frontend/e2e/*.spec.ts`
- `.github/workflows/test.yml`

## Out of scope

- Backend tests (no backend exists yet).
- Visual regression / screenshot diffing.
- Cross-browser coverage beyond Chromium.
- Performance / load testing.

## Notes for implementation

- Prefer `@testing-library/vue` over `@vue/test-utils` only if it's a small adjustment — both are fine. If you pick `@testing-library/vue`, install `@testing-library/jest-dom` for the assertion sugar.
- Playwright's `webServer` block is the easiest way to spin up `npm run dev` for the e2e run; otherwise build first and serve `dist/` with `npx vite preview`.
- For the upload e2e, use `page.setInputFiles(selector, { name, mimeType, buffer })` so the test doesn't depend on a fixture file on disk.
- The emulated API client has time delays. Keep e2e timeouts generous and rely on Playwright's auto-waiting.
- If a test only works by relaxing a state-machine guard, fix the guard — don't relax the test.
