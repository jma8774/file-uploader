# Integrations

## External services

None in v1. The whole product runs on a single Droplet with Nginx + Node + SQLite + local disk.

Possible future integrations (not in scope):

- DigitalOcean Monitoring API — for real outbound bandwidth measurements as a check against the app-level estimate.
- DigitalOcean Spaces — if local disk becomes the bottleneck.

## Credentials and environment variables

Frontend has no secrets. Backend (deferred) will read:

```env
NODE_ENV
PORT
PUBLIC_BASE_URL
DATABASE_PATH
UPLOAD_DIR
MAX_UPLOAD_BYTES
FILE_TTL_HOURS
STORAGE_LIMIT_BYTES
PER_FILE_TRANSFER_LIMIT_BYTES
MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES
IP_HASH_SECRET
```

`.env` files must not be committed.

## Webhooks

None.

## Failure handling

Frontend treats any non-2xx from the API as either a structured `{ error, message }` to display, or — if the response is malformed — a generic "Upload failed. Please try again."

## Retry behavior

No automatic retries in v1. The user can re-click upload after an error.

## Local development notes

Backend is emulated. To work on the frontend:

```bash
cd frontend
npm install
npm run dev
```

Real API calls do not need to be running. `src/api.ts` returns canned data.
