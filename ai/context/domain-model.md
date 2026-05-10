# Domain Model

## Core entities

### File

The central entity. Backed (eventually) by the `files` SQLite table.

Public-facing fields (used by the frontend):

- `token` — random URL-safe string, the public handle.
- `originalName` — for display + Content-Disposition.
- `sizeBytes` — display + validation reference.
- `uploadedAt` — ISO timestamp.
- `expiresAt` — ISO timestamp. Drives the "expires in X hours" display.
- `downloadCount` — how many successful downloads so far.
- `maxDownloads` — computed cap.
- `status` — `active` | `expired` (frontend collapses "not found" into `expired` per spec).

Backend-only fields (not exposed): `id`, `stored_name`, `mime_type`, `bytes_downloaded_estimate`, `max_transfer_bytes`, `is_deleted`, `deleted_at`.

### Stats snapshot

Returned by `GET /api/stats`. Aggregates only, no per-file rows.

Fields: `totalUploads`, `totalDownloads`, `activeFiles`, `storageUsedBytes`, `storageLimitBytes`, `uploadsToday`, `downloadsToday`, `expiredFilesDeleted`, `estimatedMonthlyTransferBytes`, `monthlyTransferSafetyLimitBytes`, `uploadsEnabled`, `downloadsEnabled`.

## Entity relationships

- A `File` has many `download_events` (1:N).
- A `File` may have one `upload_event` (1:1, optional).
- `bandwidth_events` belong loosely to a file (nullable FK).

## Lifecycle states (File)

```text
uploaded → active → (expired OR max_downloads_reached OR storage_evicted) → deleted
```

- `active`: within TTL, under download cap, file present on disk.
- `expired`: past `expiresAt`. Cleanup job deletes the file.
- `deleted`: `is_deleted = 1`. Always returns "expired" to the client.

## Business rules

- A token is single-use only in the sense that it maps to exactly one file forever; download attempts after expiration return the expired state.
- `maxDownloads = max(1, floor(2 GiB / sizeBytes))`.
- Public stats never include filenames, tokens, IPs, or user agents.
- Frontend size validation is UX-only; the backend re-validates everything.

## Edge cases (frontend should handle)

- File picked, but user navigates away mid-upload → cancel the in-flight request.
- Upload completes but response is malformed → show generic upload-failed error.
- Download page hit with a non-existent token → "expired" state (spec collapses both).
- Stats endpoint fails → render the stats panel with a "Stats unavailable" placeholder, not a blank page.
- Safety cap reached → `uploadsEnabled: false` should disable the upload button and show the spec'd message.
