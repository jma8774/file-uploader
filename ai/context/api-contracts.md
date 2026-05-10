# API Contracts

> **Status**: backend is not yet implemented. The frontend talks to an emulated client in `src/api.ts` that returns these exact shapes. When the real backend lands, only `src/api.ts` should change.

## API style

REST over HTTPS. JSON request/response, with `multipart/form-data` for upload.

## Authentication

None. Anonymous.

## Endpoints

### `POST /api/upload`

Request: `multipart/form-data`, field name `file`.

Success response:

```json
{
  "token": "abc123",
  "downloadPageUrl": "/file/abc123",
  "directDownloadUrl": "/d/abc123",
  "originalName": "example.zip",
  "sizeBytes": 44879012,
  "expiresAt": "2026-05-11T12:00:00.000Z",
  "maxDownloads": 20
}
```

Frontend uses `axios` so it can emit `onUploadProgress` events. The emulated implementation simulates progress events at intervals before resolving.

### `GET /api/file/:token`

Returns public metadata. Does **not** increment downloads.

Active:

```json
{
  "token": "abc123",
  "originalName": "example.zip",
  "sizeBytes": 44879012,
  "uploadedAt": "2026-05-10T12:00:00.000Z",
  "expiresAt": "2026-05-11T12:00:00.000Z",
  "downloadCount": 3,
  "maxDownloads": 20,
  "status": "active"
}
```

Expired / not found:

```json
{ "status": "expired" }
```

### `GET /d/:token`

Streams the file bytes. Not called by JS — it's a plain `<a href>` / `window.location` navigation so the browser handles the download with the original filename. The emulated frontend can just `console.log` and noop.

### `GET /api/stats`

Returns the homepage stats snapshot — see `domain-model.md` for the field list.

### `GET /api/health`

```json
{
  "status": "ok",
  "storageUsedBytes": 1932735283,
  "activeFiles": 17
}
```

## Error format

```json
{
  "error": "FILE_TOO_LARGE",
  "message": "File is too large. Max size is 100 MB."
}
```

Canonical error codes (frontend should branch on `error`, fall back to `message`):

- `FILE_TOO_LARGE`
- `UPLOADS_DISABLED`
- `DOWNLOADS_DISABLED`
- `FILE_NOT_FOUND` (frontend treats this the same as `EXPIRED`)
- `EXPIRED`
- `MAX_DOWNLOADS_REACHED`
- `RATE_LIMITED`
- `SAFETY_LIMIT_REACHED`
- `INTERNAL_ERROR`

Frontend user-visible strings come from spec §21.

## Backward compatibility rules

The frontend and (future) backend must agree on these shapes. Any contract change must:

1. Update this file.
2. Update `src/api.ts` types + emulation.
3. Update all callers.
