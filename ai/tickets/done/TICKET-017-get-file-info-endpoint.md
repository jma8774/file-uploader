# TICKET-017: GET /api/file/:token

## Status

Backlog

## Goal

Return public file metadata (or the expired shape) for a token. This drives the download landing page on the frontend.

## Background

Contract is in `ai/context/api-contracts.md`. The endpoint must not leak any of the backend-only columns (`id`, `stored_name`, `is_deleted`, etc.) and must not increment the download counter — that only happens on the actual download in TICKET-018.

## Requirements

- `backend/src/routes/fileInfo.ts` registers `GET /api/file/:token`.
- Lookup: `SELECT ... FROM files WHERE token = ? LIMIT 1`.
- Branching:
  - Not found, OR `is_deleted = 1`, OR `expires_at <= now()`: return `{ status: 'expired' }` with status 200. (The spec collapses not-found into expired on purpose — see `ai/context/domain-model.md`.)
  - Otherwise: return the active shape from the contract doc.
- The token route parameter is a string. Don't `parseInt` it. Treat anything that isn't a valid token-format string as not-found (return the expired shape; don't 400).
- No mutation of `files` or any other table.

## Acceptance criteria

- After TICKET-016 uploads a file, `curl /api/file/<token>` returns the active shape with the correct `originalName`, `sizeBytes`, `uploadedAt`, `expiresAt`, `downloadCount: 0`, `maxDownloads`, `status: 'active'`.
- `curl /api/file/does-not-exist` returns `{ "status": "expired" }`.
- After manually backdating `expires_at` to the past in the DB, the same token returns `{ "status": "expired" }`.
- `downloadCount` does not change as a result of hitting this endpoint.

## Files likely involved

- `backend/src/routes/fileInfo.ts`
- `backend/src/services/fileService.ts` (add a `getActiveByToken` helper)
- `backend/src/index.ts` (mount the route)
- `ai/context/api-contracts.md` (drop "emulated" framing for this endpoint)

## Out of scope

- The actual file bytes — that's `GET /d/:token` (TICKET-018).
- Per-IP rate limits on this endpoint — TICKET-021.

## Notes for implementation

- Use prepared statements (`db.prepare(...).get(token)`) — `better-sqlite3` caches them and they're SQL-injection-safe.
- `now()` should be `new Date().toISOString()` so the comparison is a lexicographic string compare against the ISO `expires_at` column. SQLite handles that fine.
- Keep the route handler tiny — let `fileService.getActiveByToken(token)` do the work and the handler just translate to JSON.
