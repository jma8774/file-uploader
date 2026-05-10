# Database

> **Status**: deferred. No database exists yet — the frontend-first phase uses the emulated API client. This file captures the planned schema so the API contracts and domain model line up.

## Database overview

SQLite via `better-sqlite3`, file at `/var/lib/filedrop/app.db` in production. Sits outside the git checkout so deploys don't wipe data.

## Tables

### `files`

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  mime_type TEXT,
  uploaded_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL,
  bytes_downloaded_estimate INTEGER NOT NULL DEFAULT 0,
  max_transfer_bytes INTEGER NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);
```

Index on `token` (already unique). Likely index on `expires_at` for the cleanup job.

### `download_events`

```sql
CREATE TABLE download_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  downloaded_at TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  FOREIGN KEY (file_id) REFERENCES files(id)
);
```

### `upload_events` (optional)

```sql
CREATE TABLE upload_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  ip_hash TEXT,
  FOREIGN KEY (file_id) REFERENCES files(id)
);
```

### `bandwidth_events`

```sql
CREATE TABLE bandwidth_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT,
  bytes INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

`event_type` is `download` in v1.

### `app_settings`

```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Seed values: `uploads_enabled=true`, `downloads_enabled=true`, `storage_limit_bytes=6442450944`, `monthly_transfer_safety_limit_bytes=268435456000`.

## Migration rules

Deferred. When the backend is added, plan: a `backend/migrations/` directory with numbered SQL files applied in order at startup.

## Data integrity rules

- `token` is unique.
- `is_deleted = 1` means the file no longer exists on disk — never serve it.
- `bytes_downloaded_estimate` and `download_count` only increase.

## Common queries (planned)

- "Is this token active right now?": `WHERE token = ? AND is_deleted = 0 AND expires_at > now`.
- Stats: aggregate queries over `files` + `download_events` + `bandwidth_events`. Today's counts use a `DATE(...)` filter.
- Cleanup: `WHERE expires_at < now AND is_deleted = 0`.
