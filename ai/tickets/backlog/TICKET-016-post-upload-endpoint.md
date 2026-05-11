# TICKET-016: POST /api/upload

## Status

Backlog

## Goal

Accept a single `multipart/form-data` upload, store the file on disk under a generated internal name, write a `files` row, and return the spec-shaped `UploadResponse`.

## Background

The contract is fixed in `ai/context/api-contracts.md` (matched by the frontend's emulated client). Rate limits and global safety caps are deferred to TICKET-021 — here we implement the happy path plus the basic per-request validation (size limit, missing-field rejection).

## Requirements

- Add deps: `multer`, `nanoid` (or use Node `crypto`). DevDeps: `@types/multer`.
- `backend/src/routes/upload.ts` registers `POST /api/upload` with Multer configured for disk storage.
- Storage strategy:
  - Files land in `${config.uploadDir}/<YYYY-MM>/<random>.bin`. The month folder is created on demand.
  - `<random>` is `crypto.randomBytes(12).toString('hex')` — enough entropy for collision-resistance on disk while keeping the filename short.
  - The original filename is **never** used as a path component. It is stored in the DB column `original_name` for display + Content-Disposition only.
- Token: `crypto.randomBytes(16).toString('base64url')` — exactly the spec's algorithm.
- Per-file `max_downloads` = `Math.max(1, Math.floor(PER_FILE_TRANSFER_LIMIT_BYTES / size_bytes))`.
- `expires_at` = `uploaded_at + FILE_TTL_HOURS`.
- Reject if no `file` field is present (400 + `{ error: 'INTERNAL_ERROR', message: 'No file uploaded.' }` — Multer's default is fine to wrap).
- Reject when `file.size > MAX_UPLOAD_BYTES`: send `413` with `{ error: 'FILE_TOO_LARGE', message: 'File is too large. Max size is 100 MB.' }`. Multer's `limits.fileSize` does the enforcement; the route translates the error.
- Insert a row into `files` with `id = nanoid()` (or another generated unique id, separate from `token`), `stored_name = "<YYYY-MM>/<random>.bin"`, the original name, mime type (untrusted, store as-is), sizes, timestamps, computed caps.
- Respond with the exact `UploadResponse` shape from the contract doc.
- On any failure after the file has been written to disk, delete it before returning the error (no orphaned files).

## Acceptance criteria

- `curl -F "file=@/tmp/sample.txt" http://localhost:3000/api/upload` returns the expected JSON, the file appears under `var/uploads/YYYY-MM/`, and a row exists in `files`.
- Uploading a >100 MB file returns 413 with the spec error shape.
- A request without a `file` field returns 400 with a friendly error.
- Restarting the server preserves both the file on disk and the DB row.

## Files likely involved

- `backend/package.json`
- `backend/src/routes/upload.ts`
- `backend/src/services/fileService.ts` (insert + filename / token generation helpers)
- `backend/src/services/tokenService.ts` (token + random filename)
- `backend/src/middleware/errorHandler.ts` (translate Multer errors to the spec shape)
- `ai/context/api-contracts.md` (drop "emulated" framing for `POST /api/upload`)

## Out of scope

- Rate limiting / IP throttling — TICKET-021.
- Safety-cap kill switch — TICKET-021.
- Streaming or chunked uploads.
- Virus scanning (explicitly a non-goal in spec §3).
- MIME-type sniffing beyond trusting the client header (spec §13.4).

## Notes for implementation

- The error JSON shape is `{ error: CODE, message: STRING }` — same shape the frontend's `ApiError` consumes. Keep the codes from `ai/context/api-contracts.md`.
- Don't put the upload directory under the source tree on dev — keep it at the cwd-relative `./var/uploads` so it survives a `git clean`.
- A small `services/fileService.ts` keeps the route handler thin.
