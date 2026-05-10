# Architecture

## System overview

Production target:

```text
Browser → Nginx → Vue/Vite static frontend
                ↘ /api/* and /d/* → Node/Express backend → SQLite + local upload dir
```

**Current phase**: only the `frontend/` exists. All `/api/*` and `/d/*` calls are emulated through `src/api.ts` so the UI can be developed in isolation. The backend will be added in a later phase.

## Repository layout (planned)

```text
frontend/      Vue 3 + Vite + TypeScript SPA          ← active scope
backend/       Node/Express/SQLite API                 ← deferred
deploy.sh      Manual SSH deploy script                ← deferred
ai/            Project context for AI coding agents
```

## Major modules (frontend)

- `src/main.ts` — app bootstrap + router.
- `src/App.vue` — top-level layout, route outlet.
- `src/api.ts` — emulated API client. Same shape the real backend will expose so swap-over is one file.
- `src/components/FileUploader.vue` — drag/drop + file picker + validation + upload trigger.
- `src/components/UploadResult.vue` — shows the resulting link, copy button.
- `src/components/StatsPanel.vue` — homepage stats grid.
- `src/views/Home.vue` — `/` page composition.
- `src/views/Download.vue` — `/file/:token` page with active/expired/not-found states.
- `src/utils/formatBytes.ts`, `src/utils/formatTime.ts` — display helpers.

## Data flow (frontend, emulated)

```text
FileUploader → api.uploadFile(file, onProgress)
              ↳ emulated: yields fake progress events, returns { token, downloadPageUrl, ... }
              ↘ UploadResult shows link

Download view → api.getFileInfo(token)
              ↳ emulated: returns canned active/expired/not-found response
StatsPanel    → api.getStats()
              ↳ emulated: returns canned numbers
```

## Authentication and authorization

None. The product is anonymous link-sharing. Security comes from unguessable tokens, expiration, and rate limits — all enforced by the backend when it exists.

## External services

None in v1. Future: maybe DigitalOcean Monitoring API for real outbound bandwidth.

## Background jobs

None in the frontend. Backend (deferred) will run a periodic cleanup job to delete expired files.

## Error handling

- Frontend: each upload/download state machine has an explicit `error` state with a user-visible message.
- API client surfaces structured `{ error, message }` shapes (same shape as the spec'd backend errors) so swap-over is transparent.

## Testing architecture

TODO: Frontend test framework not yet chosen. Likely Vitest + Vue Test Utils. Recommended coverage in spec §20:
- file selection displays filename/size
- too-large file shows error
- upload progress state appears
- successful upload displays copyable link
- stats panel renders
- download page active/expired/not-found states

## Deployment model

Deferred. Plan: manual SSH to a DO Droplet, Nginx serves `frontend/dist`, systemd runs Node backend. See `ai/context/deployment.md`.
