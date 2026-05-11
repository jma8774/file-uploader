# TICKET-021: Rate limiting + global safety-cap enforcement

## Status

Backlog

## Goal

Enforce the abuse-prevention rules from the spec at the application layer: per-IP rate limits on uploads and downloads, and the global monthly-transfer kill switch that disables both endpoints when usage crosses the safety cap.

## Background

Spec §12 defines:
- Uploads per IP: 5 / hour
- Downloads per IP: 30 / hour
- Downloads of the same file by the same IP: 3 / hour
- Global monthly transfer hard stop at `MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES`

Nginx can layer extra rate limiting on top in production; this ticket covers the application-level checks that work locally too.

## Requirements

- Add dep: `express-rate-limit`.
- `backend/src/middleware/rateLimit.ts` exports:
  - `uploadLimiter`: 5 requests per hour, keyed by IP (`req.ip`). On limit, respond with `429` + `{ error: 'RATE_LIMITED', message: 'Too many uploads. Please wait and try again.' }`.
  - `downloadLimiter`: 30 requests per hour per IP. Same error shape with download wording.
  - `perFileDownloadLimiter`: keyed by `${ip}:${token}`, 3 / hour. Mount it before `downloadLimiter` so the more-specific cap fires first.
- `backend/src/middleware/safetyCap.ts`:
  - `enforceUploadEnabled`: reads `app_settings.uploads_enabled` (cached in-memory with a 5-second TTL to avoid hammering SQLite on every request); rejects with `503` + `{ error: 'UPLOADS_DISABLED', message: 'Monthly safety limit reached. Uploads and downloads are temporarily paused.' }` when disabled.
  - `enforceDownloadEnabled`: mirror of the above using `downloads_enabled` and `DOWNLOADS_DISABLED`.
- Cleanup pass (TICKET-020) is extended: after each pass, recompute `estimatedMonthlyTransferBytes`; if `>= MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES`, flip both `uploads_enabled` and `downloads_enabled` to `'false'` in `app_settings`. Log the transition once. Do not auto-re-enable on the next pass — flipping back is a manual action (operator updates `app_settings` directly).
- Mount the middlewares in `backend/src/index.ts`:
  - `app.use('/api/upload', enforceUploadEnabled, uploadLimiter, uploadRouter)`
  - `app.use('/d', enforceDownloadEnabled, perFileDownloadLimiter, downloadLimiter, downloadRouter)`
- Trust the proxy: `app.set('trust proxy', 1)` so `req.ip` is the real client IP behind Nginx in production. Document in `backend/README.md`.

## Acceptance criteria

- Six uploads in a row from the same IP within an hour → the sixth returns 429 with the spec error JSON.
- Four downloads of the same token by the same IP within an hour → the fourth returns 429 with the spec error JSON.
- Manually setting `uploads_enabled='false'` in `app_settings` → next upload returns 503; setting it back to `'true'` re-enables within a few seconds (the cache TTL).
- Forcing `estimatedMonthlyTransferBytes` past the cap (e.g., temporarily shrinking `MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES`) → after the next cleanup pass, both flags flip and uploads/downloads start rejecting.

## Files likely involved

- `backend/package.json`
- `backend/src/middleware/rateLimit.ts`
- `backend/src/middleware/safetyCap.ts`
- `backend/src/services/cleanupService.ts`
- `backend/src/index.ts`
- `backend/README.md` (trust-proxy note)
- `ai/context/api-contracts.md` (error code reference is already there — sanity-check it matches)

## Out of scope

- IP reputation lists, fail2ban-style longer-term blocks, Cloudflare integration.
- Nginx-layer rate limits (a separate prod deployment ticket).
- Resetting transfer counters monthly — the spec uses a calendar-month window via the SQL query in TICKET-019, so there's no scheduled "reset" task.

## Notes for implementation

- `express-rate-limit`'s default store is in-memory. That's fine for a single-process Node app on one Droplet — no shared store needed.
- The 5-second cache for `app_settings` is small enough that operators flipping the kill switch see effect almost instantly, and the read is cheap regardless. Don't over-engineer this.
- The cleanup-triggered auto-disable is a one-way switch on purpose: the safety cap is a "last resort" and re-enabling deserves a human decision.
