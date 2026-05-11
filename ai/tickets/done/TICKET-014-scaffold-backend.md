# TICKET-014: Scaffold the Node backend (Express + TS + config + /health)

## Status

Active

## Goal

Stand up the `backend/` directory so subsequent tickets have an Express app to extend. Endpoints come in TICKETs 016–019; this ticket only establishes the project, build, dev script, env-driven config, and a working `GET /api/health`.

## Background

After TICKET-013 the frontend is feature-complete against an emulated client (ADR-0002). The product needs a real server. Per ADR-0001 and `ai/context/spec.md`, the backend is Node + Express + `better-sqlite3` + Multer running under systemd in production. This ticket is the skeleton.

The dev machine is macOS; production is a Linux DigitalOcean Droplet. Paths to the SQLite file and uploads directory must come from environment variables so the same code runs on both with no source edits.

## Requirements

- Create `backend/` at the repo root with TypeScript + Express:
  - `package.json` with scripts: `dev` (uses `tsx watch src/index.ts`), `build` (`tsc`), `start` (`node dist/index.js`).
  - `tsconfig.json` targeting `ES2022`, `module: nodenext`, `outDir: dist`.
  - Deps: `express`, `dotenv`. DevDeps: `tsx`, `typescript`, `@types/express`, `@types/node`.
- `backend/src/config.ts` — read env vars once at startup, expose a frozen object. Required vars + defaults (dev defaults must be macOS-friendly relative paths):
  - `NODE_ENV` (default `development`)
  - `PORT` (default `3000`)
  - `PUBLIC_BASE_URL` (default `http://localhost:3000`)
  - `DATABASE_PATH` (default `./var/app.db` relative to backend cwd)
  - `UPLOAD_DIR` (default `./var/uploads` relative to backend cwd)
  - `MAX_UPLOAD_BYTES` (default `104857600` — 100 MiB)
  - `FILE_TTL_HOURS` (default `24`)
  - `STORAGE_LIMIT_BYTES` (default `6442450944` — 6 GiB)
  - `PER_FILE_TRANSFER_LIMIT_BYTES` (default `2147483648` — 2 GiB)
  - `MONTHLY_TRANSFER_SAFETY_LIMIT_BYTES` (default `268435456000` — 250 GiB)
  - `IP_HASH_SECRET` (required, no default — fail fast if missing in production; allow a placeholder in development)
- Resolve numeric env vars defensively (`parseInt`, ignore NaN, fall back to default).
- On startup, `mkdir -p` both `UPLOAD_DIR` and the directory containing `DATABASE_PATH`. (`ensureDirs()` helper.)
- `backend/src/index.ts` boots an Express app, mounts JSON middleware, registers `GET /api/health`, and `app.listen(config.port)` with a clear "FileDrop backend listening on …" log.
- `GET /api/health` returns `{ status: 'ok', storageUsedBytes: 0, activeFiles: 0 }` (the real numbers come once the DB lands in TICKET-015 — keep the shape spec-correct from day one).
- `backend/.env.example` documents every env var with a one-line comment. Real `.env` files must be in `.gitignore` (already covered by the repo-root rule).
- `backend/README.md` (short) covers: `npm install`, copy `.env.example`, `npm run dev`, verify `curl http://localhost:3000/api/health`.

## Acceptance criteria

- `cd backend && npm install && cp .env.example .env && npm run dev` starts the server and prints the listening message.
- `curl http://localhost:3000/api/health` returns the expected JSON shape.
- `npm run build` produces `dist/` with no errors.
- Missing `IP_HASH_SECRET` in `NODE_ENV=production` exits with a clear error message; same in development logs a warning but uses a fixed placeholder.
- The upload directory and DB-parent directory are created if missing on first boot.

## Files likely involved

- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/index.ts`
- `backend/src/config.ts`
- `backend/src/routes/health.ts`
- `backend/.env.example`
- `backend/README.md`
- `ai/context/deployment.md` (small update: drop the "deferred" framing for the local dev section)
- `ai/architecture.md` (update "current phase" framing)

## Out of scope

- SQLite / migrations (TICKET-015).
- Any business endpoints — `/api/upload`, `/api/file/:token`, `/d/:token`, `/api/stats` come in later tickets.
- Nginx / systemd / production deployment.
- Frontend changes — the emulated `src/api.ts` keeps running; TICKET-022 swaps it.

## Notes for implementation

- Use `tsx` for dev so we don't need a separate compile step.
- Keep `config.ts` import-time-side-effect-free *except* for the directory creation, which is the one safe startup action. Everything else (reading env, validating) is pure.
- Do not commit a real `.env`. The example file uses obvious placeholders like `replace-me-with-32-random-bytes`.
- The frontend's expected backend port is `3000` (it's referenced in `ai/context/api-contracts.md`). Keep that default.
