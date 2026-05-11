# FileDrop backend

Express + TypeScript + SQLite. Single process, runs under systemd in production.

## Local dev

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Then:

```bash
curl http://localhost:3000/api/health
# => {"status":"ok","storageUsedBytes":0,"activeFiles":0}
```

The dev defaults put uploads + the SQLite file under `backend/var/`. These directories are created automatically on startup and are gitignored.

## Config

All runtime config lives in `.env` (loaded by `src/config.ts`). See `.env.example` for the full list. Production sets `IP_HASH_SECRET` from a real random value and points `DATABASE_PATH` / `UPLOAD_DIR` at absolute paths outside the git checkout (e.g., `/var/lib/filedrop/...`).
