# TICKET-020: Cleanup job

## Status

Backlog

## Goal

Run a periodic in-process job that deletes expired files from disk + marks them deleted in the DB, and trims the oldest still-active files when storage exceeds the cap.

## Background

The spec mandates 24 h auto-expiry and a 6 GiB storage cap. Per ADR-0001 we have no background worker process — the cleanup runs inside the Node backend on a `setInterval`.

## Requirements

- `backend/src/services/cleanupService.ts` exports `runCleanup()` (one pass) and `startCleanupLoop()` (schedules + runs).
- One pass does:
  1. **Expire**: `SELECT id, stored_name FROM files WHERE is_deleted = 0 AND expires_at <= ?` → for each, delete the file from disk and update `is_deleted = 1, deleted_at = now`.
  2. **Storage trim**: if `SUM(size_bytes) WHERE is_deleted = 0` exceeds `config.storageLimitBytes`, repeatedly delete the oldest active file (`ORDER BY uploaded_at ASC`) until usage falls under the cap. Log each eviction.
- The disk delete uses `fs.promises.unlink` and tolerates ENOENT (already gone) — log a warning, still mark the row deleted.
- Path safety: before unlinking, resolve `path.join(uploadDir, stored_name)` and verify it stays inside `uploadDir` (same guard as TICKET-018). Refuse to unlink anything else.
- `startCleanupLoop()` runs once on startup, then schedules `setInterval(runCleanup, 10 * 60 * 1000)` (10 minutes). Catches and logs errors so a single failed pass doesn't kill the loop.
- `backend/src/index.ts` calls `startCleanupLoop()` after the server listens.
- A `CLEANUP_INTERVAL_MS` env var lets dev override the cadence (default 600000); useful for quick manual testing. Document in `.env.example`.
- The cleanup pass tracks how many files it expired and how many it evicted — log them as a single summary line per pass.

## Acceptance criteria

- Manually backdating a file's `expires_at` to the past and waiting (or calling `runCleanup()` directly from a one-shot script) deletes it from disk and flips `is_deleted` to 1.
- Forcing storage usage above the cap (e.g., shrinking `STORAGE_LIMIT_BYTES` in `.env` to a value below current usage) triggers eviction of the oldest active file.
- A missing on-disk file (manually `rm`'d outside the app) still flips the row to deleted without crashing.
- Cleanup logs are short and informative — one line per pass: "cleanup: expired N, evicted M, usage X / Y bytes".

## Files likely involved

- `backend/src/services/cleanupService.ts`
- `backend/src/index.ts`
- `backend/.env.example` (`CLEANUP_INTERVAL_MS`)
- `ai/context/database.md` / `ai/architecture.md` (note the in-process scheduler)

## Out of scope

- A separate cron / worker process — explicit non-goal in spec §3.
- Soft-delete recovery / undelete.
- File integrity checks (hashes, etc.).

## Notes for implementation

- Run the disk deletion *before* the DB update inside each per-file step, but catch errors so an unlink failure doesn't break the row update. The DB is the source of truth for "this file is gone."
- Use `db.transaction(...)` only inside the per-file step; don't wrap the whole pass in one transaction — eviction passes can be long.
- Don't `await Promise.all` over thousands of unlinks. Sequential is fine for v1 — keeps RAM use bounded.
