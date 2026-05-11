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

CREATE INDEX idx_files_expires_at ON files(expires_at);

CREATE TABLE download_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  downloaded_at TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  FOREIGN KEY (file_id) REFERENCES files(id)
);

CREATE INDEX idx_download_events_file_id ON download_events(file_id);
CREATE INDEX idx_download_events_downloaded_at ON download_events(downloaded_at);

CREATE TABLE upload_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  ip_hash TEXT,
  FOREIGN KEY (file_id) REFERENCES files(id)
);

CREATE TABLE bandwidth_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT,
  bytes INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_bandwidth_events_created_at ON bandwidth_events(created_at);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
