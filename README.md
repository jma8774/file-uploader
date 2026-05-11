# FileDrop

Temporary file-sharing site. Vue 3 + Vite frontend, Node/Express + SQLite backend, designed to run on a single small DigitalOcean Droplet. See [`ai/context/spec.md`](./ai/context/spec.md) for the full product spec.

## Getting started

```bash
# Backend deps + .env
cd backend
npm install
cp .env.example .env
cd ..

# Frontend deps
cd frontend
npm install
cd ..

# Root-level meta script
npm install
```

Then from the repo root:

```bash
npm run dev
```

That boots the backend on `http://localhost:3000` and the Vue dev server on `http://localhost:5173`. The Vue server proxies `/api/*` and `/d/*` to the backend so same-origin paths just work.

## Layout

```text
backend/    Express + TypeScript + SQLite. See backend/README.md.
frontend/   Vue 3 + Vite + TypeScript. See frontend/README.md if added.
ai/         Project context for AI coding agents (CLAUDE.md points at this).
```

## Tests

```bash
# Unit + e2e for the frontend
cd frontend && npm test && npm run test:e2e

# Backend tests land in TICKET-023.
```
