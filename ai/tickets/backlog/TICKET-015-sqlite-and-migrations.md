# TICKET-015: SQLite + migrations + initial schema

## Status

Backlog

## Goal

Wire `better-sqlite3` into the backend, add a tiny migration runner that applies numbered SQL files on startup, and ship the v1 schema (`files`, `download_events`, `bandwidth_events`, `app_settings`). After this ticket, the rest of the backend can do real DB work.

## Background

The schema is fixed by the spec — see `ai/context/database.md`. We don't need a heavyweight ORM. Raw SQL + a couple of typed helpers is enough at this scale, and `better-sqlite3` is synchronous (fits a single-process small app well).

## Requirements

- Add deps: `better-sqlite3`. DevDeps: `@types/better-sqlite3`.
- `backend/src/db.ts` opens the SQLite database at `config.databasePath`, returns a shared `Database` instance, and runs migrations on first import. WAL mode on by default.
- `backend/migrations/` holds numbered files: `001_init.sql` (creates the four spec'd tables + a `schema_migrations` table).
  - `files` per spec §10.
  - `download_events`, `bandwidth_events` per spec §10.
  - `app_settings` per spec §10 with seed rows: `uploads_enabled=true`, `downloads_enabled=true`, `storage_limit_bytes={config.storageLimitBytes}`, `monthly_transfer_safety_limit_bytes={config.monthlyTransferSafetyLimitBytes}`. (Seed values come from config, not hard-coded SQL, so env vars stay authoritative.)
  - Indexes: unique on `files.token`, plus `files(expires_at)` for the cleanup query.
- `schema_migrations(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)` tracks applied filenames.
- Migration runner reads `migrations/` lexically, skips already-applied versions, applies the rest inside a transaction each, and inserts the version row. Logs each application.
- `GET /api/health` is updated to query real numbers from the DB (`SELECT COUNT(*) FROM files WHERE is_deleted = 0 AND expires_at > now`; `SELECT COALESCE(SUM(size_bytes),0) FROM files WHERE is_deleted = 0`).
- `backend/src/services/settingsService.ts` exposes `getSetting(key)` / `setSetting(key, value)` typed helpers used later by the safety-cap kill switch.

## Acceptance criteria

- First `npm run dev` after `cp .env.example .env` creates the DB file at `var/app.db` and applies `001_init.sql`.
- Restarting the server does not re-apply the migration (the version row is honored).
- `curl http://localhost:3000/api/health` returns `{ status: 'ok', storageUsedBytes: 0, activeFiles: 0 }` (zeros because no rows yet) and the values come from real queries.
- `npm run build` passes.

## Files likely involved

- `backend/package.json`
- `backend/src/db.ts`
- `backend/src/migrations/runner.ts`
- `backend/migrations/001_init.sql`
- `backend/src/routes/health.ts`
- `backend/src/services/settingsService.ts`
- `ai/context/database.md` (drop the "deferred" framing; reflect what actually shipped)

## Out of scope

- Upload / download / stats endpoints (TICKETs 016–019).
- Cleanup job (TICKET-020).
- Rollback / down migrations — keep it forward-only for v1.

## Notes for implementation

- Wrap each migration in `db.transaction(...)()` so a half-applied migration can't leave a corrupt schema row.
- The runner runs on `db.ts` import. It must not throw silently — bubble errors up so the server crashes loudly during dev.
- `is_deleted` is `INTEGER NOT NULL DEFAULT 0` in SQLite (boolean is just 0/1). Don't fight the spec.
- `expires_at` and `uploaded_at` are stored as ISO strings (TEXT) to match the spec and stay JSON-friendly.
