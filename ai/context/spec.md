# FileDrop Project Specification

## 1. Project Summary

FileDrop is a lightweight temporary file-sharing website hosted on a single DigitalOcean Droplet. Users can upload a file and receive a temporary download link. Files expire automatically after a fixed period. The homepage shows simple public usage statistics such as total uploads, total downloads, active files, and storage usage.

This project is intentionally simple and designed for a low-cost Droplet with limited resources.

## 2. Goals

- Allow users to upload one file at a time.
- Generate a random, hard-to-guess download link.
- Allow users to download files through a clean download page.
- Automatically delete expired files.
- Track simple statistics:
  - total uploads
  - total downloads
  - active files
  - storage used
  - uploads today
  - downloads today
  - estimated monthly outbound transfer
- Prevent abuse through upload limits, download limits, rate limits, expiration, and a global transfer safety cap.
- Keep the infrastructure simple: one Droplet, one Node backend, one Vue frontend, one SQLite database.

## 3. Non-Goals for Version 1

Do not implement these in v1:

- User accounts
- Admin dashboard
- Redis
- PostgreSQL
- Kubernetes
- Docker orchestration
- Multi-file upload
- Permanent file hosting
- Public file listing/search
- Email sharing
- Virus scanning
- Payment system
- Complex analytics
- Object storage such as DigitalOcean Spaces

These can be considered later if the app grows.

## 4. Target Infrastructure

Initial hosting target:

```text
DigitalOcean Basic Droplet
Memory:   512 MiB
vCPU:     1 vCPU
Transfer: 500 GiB/month
SSD:      10 GiB
Cost:     roughly $4/month
```

The app should assume resources are constrained. Avoid unnecessary background services and avoid keeping large files in memory.

## 5. High-Level Architecture

```text
Browser
  |
  v
Nginx
  |-----------------------> Vue/Vite static frontend
  |
  | /api/*
  v
Node Backend
  |
  | metadata/stats
  v
SQLite Database
  |
  | actual uploaded files
  v
Local Upload Folder
```

Recommended server layout:

```text
/var/www/filedrop-app        # Git repo / app source
/var/www/filedrop-public     # built frontend served by Nginx
/var/lib/filedrop/uploads    # uploaded files
/var/lib/filedrop/app.db     # SQLite database
/var/log/filedrop            # optional app logs
```

Important rule: uploaded files and SQLite database should live outside the Git repo so deployments do not delete user data.

## 6. Tech Stack

### Frontend

- Vite
- Vue
- TypeScript recommended, but JavaScript acceptable
- Plain CSS or a lightweight CSS approach

### Backend

- Node.js
- Express
- Multer for disk-based uploads
- SQLite via `better-sqlite3`
- `express-rate-limit` for basic rate limiting
- `nanoid` or Node `crypto` for random tokens

### Server

- Nginx
- systemd for running the Node backend
- Certbot or Caddy for HTTPS

## 7. Main User Flow

### Upload Flow

```text
User opens homepage
  ↓
User selects or drags a file
  ↓
Frontend validates file size
  ↓
User clicks Upload
  ↓
Frontend sends POST /api/upload
  ↓
Backend validates request
  ↓
Backend saves file to disk
  ↓
Backend writes file metadata to SQLite
  ↓
Backend returns download page URL
  ↓
Frontend displays copyable link
  ↓
Stats refresh on homepage
```

### Download Flow

```text
User opens /file/:token
  ↓
Frontend calls GET /api/file/:token
  ↓
Frontend displays filename, size, expiration, and download button
  ↓
User clicks Download
  ↓
Browser requests GET /d/:token
  ↓
Backend validates token, expiration, limits, and rate limits
  ↓
Backend increments stats
  ↓
Backend sends file
```

## 8. Frontend Specification

The v1 frontend should be mostly a single page.

### Routes

```text
/              Home page with upload form and stats panel
/file/:token   Download landing page
```

### Home Page Sections

The homepage should contain:

1. App title and short explanation
2. Upload area
3. Upload progress
4. Upload result link
5. Stats panel directly under the upload button/result area

Example layout:

```text
Temporary File Drop
Upload a file and get a temporary download link.
Files expire after 24 hours.

[ Drop file here or click to choose ]

Selected:
example.zip — 42.8 MB

[ Upload ]

Upload progress: 64%

Your link:
https://example.com/file/abc123
[ Copy Link ] [ Open Link ]

--------------------------------
Site Stats

Total uploads        128
Total downloads      902
Active files         17
Storage used         1.8 GB / 6 GB
Uploads today        9
Downloads today      44
Monthly transfer     12.4 GB / 250 GB safety cap
```

### Upload States

The upload component should support these states:

```text
idle
selected
uploading
success
error
```

### Upload Progress

Use Axios or XMLHttpRequest for upload progress. Native `fetch` is not ideal for upload progress.

Example:

```ts
await axios.post('/api/upload', formData, {
  onUploadProgress: (event) => {
    const total = event.total ?? 1;
    uploadProgress.value = Math.round((event.loaded * 100) / total);
  }
});
```

### Frontend Validation

Frontend should validate:

- file is selected
- file does not exceed configured max size
- user cannot click Upload repeatedly while upload is running

Backend must still enforce all limits. Frontend validation is only for user experience.

### Download Page

The download landing page should show:

- original filename
- file size
- expiration time or time remaining
- download button
- expired/not found state

Example:

```text
Your file is ready

example.zip
42.8 MB
Expires in 18 hours

[ Download ]
```

Expired state:

```text
File expired

This download link is no longer available.
Files are automatically deleted after expiration.

[ Upload another file ]
```

### Public Stats Privacy

Public stats may show:

- total upload count
- total download count
- active file count
- storage used
- upload/download counts by day
- estimated monthly transfer

Public stats must not show:

- original filenames
- IP addresses
- user agents
- download tokens
- recent upload list

## 9. Backend API Specification

### POST `/api/upload`

Uploads one file.

Request:

- `multipart/form-data`
- field name: `file`

Backend responsibilities:

- reject if uploads are disabled
- reject if global transfer safety cap has been reached
- enforce max file size
- store file using a generated internal filename
- never trust the original filename as a filesystem path
- generate a random token
- calculate expiration time
- calculate per-file max download count
- insert metadata into SQLite
- return download URLs and metadata

Example response:

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

### GET `/api/file/:token`

Returns safe public metadata for a file.

Should not increment download count.

Example response:

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

If not found or expired:

```json
{
  "status": "expired"
}
```

### GET `/d/:token`

Serves the actual file download.

Backend must check:

- downloads are enabled
- file exists
- file has not expired
- file is not deleted
- download count is below max downloads
- per-file transfer cap has not been reached
- IP rate limit has not been exceeded
- global monthly safety cap has not been reached

On successful download:

- increment `download_count`
- increment `bytes_downloaded_estimate` by file size
- insert a row into `download_events`
- insert a row into `bandwidth_events`
- send the file with the original filename as the download name

Simple v1 serving can use `res.download(filePath, originalName)`.

Later optimization can use Nginx `X-Accel-Redirect`.

### GET `/api/stats`

Returns public stats for the homepage.

Example response:

```json
{
  "totalUploads": 128,
  "totalDownloads": 902,
  "activeFiles": 17,
  "storageUsedBytes": 1932735283,
  "storageLimitBytes": 6442450944,
  "uploadsToday": 9,
  "downloadsToday": 44,
  "expiredFilesDeleted": 81,
  "estimatedMonthlyTransferBytes": 13314398617,
  "monthlyTransferSafetyLimitBytes": 268435456000,
  "uploadsEnabled": true,
  "downloadsEnabled": true
}
```

### GET `/api/health`

Simple health check.

Example response:

```json
{
  "status": "ok",
  "storageUsedBytes": 1932735283,
  "activeFiles": 17
}
```

## 10. Database Schema

Use SQLite.

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

### `upload_events`

Optional, because the `files` table already records uploads. Useful if more detailed stats are wanted.

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

Used for estimated outbound transfer tracking.

```sql
CREATE TABLE bandwidth_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT,
  bytes INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

`event_type` should initially support:

```text
download
```

### `app_settings`

Used for hard stops and runtime flags.

```sql
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Suggested settings:

```text
uploads_enabled = true
downloads_enabled = true
storage_limit_bytes = 6442450944
monthly_transfer_safety_limit_bytes = 268435456000
```

## 11. Storage and Cleanup Policy

Initial policy:

```text
Max upload size: 100 MB
File expiration: 24 hours
Local storage cap: 6 GiB
Monthly transfer safety cap: 250 GiB
```

The cleanup job should run periodically, for example every 10 minutes.

Cleanup responsibilities:

- delete expired files from disk
- mark expired files as deleted in SQLite
- if storage usage exceeds cap, delete oldest active files until below cap
- count deleted/expired files for stats

Deletion should be careful:

- only delete files inside the configured uploads directory
- never build file paths directly from user input
- stored filenames should be generated by the backend

## 12. Abuse Prevention

Use multiple protections together.

### File Limits

Recommended v1 limits:

```text
Max file size: 100 MB
File expiration: 24 hours
Per-file transfer cap: 2 GiB
Global monthly safety cap: 250 GiB
```

Calculate per-file max downloads based on file size:

```js
const maxTransferPerFile = 2 * 1024 * 1024 * 1024;
const maxDownloads = Math.max(1, Math.floor(maxTransferPerFile / fileSizeBytes));
```

Examples:

```text
10 MB file  -> about 200 downloads
100 MB file -> about 20 downloads
```

### IP Rate Limits

Recommended v1 limits:

```text
Uploads per IP: 5 per hour
Downloads per IP: 30 per hour
Downloads of same file by same IP: 3 per hour
```

Use Express middleware and/or Nginx rate limiting.

### Global Transfer Hard Stop

Track estimated monthly outbound transfer in the database.

Before allowing uploads or downloads, check monthly estimated transfer:

```text
if monthly_estimated_transfer >= 250 GiB:
    disable uploads
    disable downloads
```

The homepage should still load and display a clear message:

```text
Monthly safety limit reached.
Uploads and downloads are temporarily paused to protect server bandwidth.
```

### DigitalOcean Monitoring Later

App-level transfer tracking is an estimate. Later, add a scheduled job that queries DigitalOcean Monitoring metrics for real public outbound bandwidth and disables downloads if provider-level usage is too high.

## 13. Security Requirements

### Must-Haves

- HTTPS only in production
- Do not trust client-side validation
- Do not expose uploaded files through a public directory listing
- Generate random tokens using secure randomness
- Do not use sequential IDs in public URLs
- Do not store files using original filenames
- Do not commit `.env` to Git
- Limit upload size in both Nginx and Node
- Rate limit upload and download endpoints
- Keep public stats anonymous

### Token Generation

Tokens should be long enough to be unguessable.

Example using Node crypto:

```js
import crypto from 'node:crypto';

function createToken() {
  return crypto.randomBytes(16).toString('base64url');
}
```

### Filename Handling

Original filename is only for display and download headers.

Actual stored file should use a generated internal name, for example:

```text
2026-05/7f3e9d8a2c1b.bin
```

### MIME Type

Do not fully trust client-provided MIME type. Store it if useful, but do not rely on it for security.

### Public Exposure

Avoid public recent uploads or public file lists. This app should behave like private-link sharing.

## 14. Environment Variables

Suggested backend environment variables:

```env
NODE_ENV=production
PORT=3000
PUBLIC_BASE_URL=https://example.com
DATABASE_PATH=/var/lib/filedrop/app.db
UPLOAD_DIR=/var/lib/filedrop/uploads
MAX_UPLOAD_BYTES=104857600
FILE_TTL_HOURS=24
STORAGE_LIMIT_BYTES=6442450944
PER_FILE_TRANSFER_LIMIT_BYTES=2147483648
MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES=268435456000
IP_HASH_SECRET=replace-with-random-secret
```

Do not commit real `.env` files.

## 15. Nginx Responsibilities

Nginx should:

- serve built frontend static files
- reverse proxy `/api/*` to Node backend
- reverse proxy `/d/*` to Node backend
- enforce upload body size limit
- handle HTTPS
- optionally apply basic rate limiting

Conceptual routing:

```text
/        -> /var/www/filedrop-public
/api/*   -> http://localhost:3000/api/*
/d/*     -> http://localhost:3000/d/*
```

Set upload limit around the same as backend max file size:

```nginx
client_max_body_size 100M;
```

## 16. Deployment Strategy

Use manual SSH deployment for v1.

Basic deployment flow:

```text
SSH into Droplet
  ↓
cd /var/www/filedrop-app
  ↓
git pull
  ↓
install backend dependencies
  ↓
run migrations
  ↓
build frontend
  ↓
copy frontend dist to /var/www/filedrop-public
  ↓
restart backend systemd service
  ↓
check health endpoint and logs
```

Example `deploy.sh`:

```bash
#!/usr/bin/env bash
set -e

cd /var/www/filedrop-app

git pull

cd backend
npm ci
npm run migrate || true

cd ../frontend
npm ci
npm run build

sudo rsync -a --delete dist/ /var/www/filedrop-public/

sudo systemctl restart filedrop

curl -f http://localhost:3000/api/health

echo "Deploy complete"
```

## 17. systemd Service

Node backend should run under systemd, not manually in an SSH session.

Example conceptual service:

```ini
[Unit]
Description=FileDrop Node Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/filedrop-app/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
EnvironmentFile=/etc/filedrop.env
User=filedrop
Group=filedrop

[Install]
WantedBy=multi-user.target
```

## 18. Project Structure

Recommended repo structure:

```text
filedrop/
├── frontend/
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.ts
│   │   ├── api.ts
│   │   ├── components/
│   │   │   ├── FileUploader.vue
│   │   │   ├── UploadResult.vue
│   │   │   └── StatsPanel.vue
│   │   └── utils/
│   │       ├── formatBytes.ts
│   │       └── formatTime.ts
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── config.js
│   │   ├── db.js
│   │   ├── routes/
│   │   │   ├── upload.js
│   │   │   ├── download.js
│   │   │   ├── fileInfo.js
│   │   │   ├── stats.js
│   │   │   └── health.js
│   │   ├── services/
│   │   │   ├── fileService.js
│   │   │   ├── cleanupService.js
│   │   │   ├── bandwidthService.js
│   │   │   └── tokenService.js
│   │   └── middleware/
│   │       ├── rateLimit.js
│   │       └── errorHandler.js
│   ├── migrations/
│   ├── package.json
│   └── README.md
│
├── deploy.sh
├── .gitignore
├── README.md
└── PROJECT_SPEC.md
```

## 19. Implementation Phases

### Phase 1: Local MVP

- Create Vue/Vite frontend
- Create Express backend
- Implement upload endpoint
- Store files on local disk
- Generate token
- Store metadata in SQLite
- Show returned link on homepage
- Implement direct download endpoint

### Phase 2: Stats

- Add stats API
- Add stats panel under upload button
- Track total uploads and downloads
- Track active files and storage usage
- Track estimated monthly transfer

### Phase 3: Cleanup and Limits

- Add expiration logic
- Add cleanup job
- Add max upload size
- Add per-file download limit
- Add per-file transfer cap
- Add global monthly safety cap

### Phase 4: Production Deployment

- Create Droplet
- Install Node, Nginx, SQLite dependencies
- Configure systemd service
- Configure Nginx
- Configure HTTPS
- Deploy app manually through SSH

### Phase 5: Hardening

- Add stronger Nginx rate limiting
- Add better error pages
- Add health checks
- Add log rotation
- Add app-level kill switch
- Optionally add DigitalOcean Monitoring API usage

## 20. Testing Plan

### Backend Unit Tests

Test:

- token generation
- file expiration logic
- max download calculation
- transfer cap logic
- stats queries
- cleanup selection logic

### Backend Integration Tests

Test:

- upload succeeds
- upload rejects too-large file
- download succeeds
- expired file rejects
- max downloads rejects
- transfer safety cap rejects
- stats update after upload/download

### Frontend Tests

Test:

- file selection displays filename and size
- too-large file shows error
- upload progress state appears
- successful upload displays copyable link
- stats panel renders
- download page handles active/expired/not-found states

## 21. Error Handling

Use clear user-facing errors.

Examples:

```text
File is too large. Max size is 100 MB.
This file has expired.
This file reached its download limit.
Monthly safety limit reached. Uploads and downloads are temporarily paused.
Upload failed. Please try again.
```

Backend should return structured JSON errors for API routes:

```json
{
  "error": "FILE_TOO_LARGE",
  "message": "File is too large. Max size is 100 MB."
}
```

## 22. Future Ideas

Possible later features:

- Password-protected downloads
- Custom expiration times
- One-time links
- QR code for download link
- Multiple file upload
- Zip bundle upload
- DigitalOcean Spaces for file storage
- Admin dashboard
- GitHub Actions deployment
- Daily usage chart
- Email link sharing
- User accounts

## 23. Design Principle

Keep the app simple, safe, and temporary.

The app should not try to be a full cloud storage service. It should be a small, fast, temporary file-drop tool with clear limits and good abuse protection.
