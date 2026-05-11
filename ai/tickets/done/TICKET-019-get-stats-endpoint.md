# TICKET-019: GET /api/stats

## Status

Backlog

## Goal

Return the aggregated public stats payload consumed by the homepage's `StatsPanel`. All counts come from real SQL — no leaking of per-file information.

## Background

Contract is in `ai/context/api-contracts.md`. Privacy rules in `ai/context/domain-model.md`: no filenames, IPs, tokens, recent uploads — only aggregates.

## Requirements

- `backend/src/routes/stats.ts` registers `GET /api/stats`.
- Run a single transaction with the queries below (or compose them as discrete `db.prepare` calls — pick whichever reads cleaner; they're all reads):
  - `totalUploads`: `SELECT COUNT(*) FROM files`
  - `totalDownloads`: `SELECT COALESCE(SUM(download_count), 0) FROM files` (or equivalently `SELECT COUNT(*) FROM download_events` — pick one and stay consistent; the spec doesn't require either).
  - `activeFiles`: `SELECT COUNT(*) FROM files WHERE is_deleted = 0 AND expires_at > ?` (now ISO).
  - `storageUsedBytes`: `SELECT COALESCE(SUM(size_bytes), 0) FROM files WHERE is_deleted = 0`.
  - `storageLimitBytes`: `config.storageLimitBytes`.
  - `uploadsToday`: `SELECT COUNT(*) FROM files WHERE uploaded_at >= ?` where the bind value is the start of today UTC.
  - `downloadsToday`: `SELECT COUNT(*) FROM download_events WHERE downloaded_at >= ?` (same start-of-day).
  - `expiredFilesDeleted`: `SELECT COUNT(*) FROM files WHERE is_deleted = 1`.
  - `estimatedMonthlyTransferBytes`: `SELECT COALESCE(SUM(bytes), 0) FROM bandwidth_events WHERE created_at >= ?` (start of current calendar month, UTC).
  - `monthlyTransferSafetyLimitBytes`: `config.monthlyTransferSafetyLimitBytes`.
  - `uploadsEnabled`: from `app_settings` (`getSetting('uploads_enabled') !== 'false'`).
  - `downloadsEnabled`: same with `downloads_enabled`.
- Return the full `StatsResponse` shape from the contract doc.

## Acceptance criteria

- With an empty DB, the endpoint returns zeros for all counts and the configured limits for the cap values, plus both flags true.
- After running TICKET-016 upload + TICKET-018 download once, the totals, active count, storage used, and today's counts all increment correctly.
- Setting `uploads_enabled='false'` in `app_settings` makes `uploadsEnabled: false` in the response (without needing a restart).

## Files likely involved

- `backend/src/routes/stats.ts`
- `backend/src/services/statsService.ts` (the actual SQL)
- `backend/src/index.ts` (mount the route)
- `ai/context/api-contracts.md`

## Out of scope

- Caching the response — the queries are cheap; don't optimize prematurely. Revisit if SQLite contention is ever a real issue.
- Per-day breakdowns / time-series charts. Public stats are aggregates only.

## Notes for implementation

- "Start of today UTC" = `new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z'`. Same shape as the stored `uploaded_at`, so lexicographic comparison works.
- Keep the stats service synchronous (`better-sqlite3` is sync). No `async` ceremony.
- Don't include any fields beyond the contract — adding "uploads this week" or anything else is scope creep.
