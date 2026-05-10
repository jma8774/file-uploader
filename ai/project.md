# Project Overview

## What this project does

FileDrop is a lightweight temporary file-sharing site. A user uploads a single file, receives a hard-to-guess download link, and the file auto-expires after a fixed period (24 hours in v1). The homepage shows anonymous public usage stats (total uploads, downloads, active files, storage used, transfer cap).

The product is intentionally small and is targeted at a single low-resource DigitalOcean Droplet (~512 MiB RAM, 1 vCPU, 10 GiB SSD).

## Primary users

- Anonymous web visitors uploading a file to share via a temporary link.
- Anonymous recipients clicking a shared link to download.

There are no accounts.

## Core user flows

1. **Upload** — visit `/`, select/drag file, see progress, get copyable download link.
2. **Download** — visit `/file/:token`, see filename/size/expiration, click download.
3. **Stats** — homepage shows aggregated public usage numbers.

## Non-goals (v1)

User accounts, admin dashboard, multi-file upload, permanent hosting, public file listing, virus scanning, payments, object storage, Redis, Postgres, Docker, K8s.

## Important constraints

- Constrained server: avoid heavy in-memory work, avoid extra background services.
- Max upload size: 100 MB; file TTL: 24 hours; storage cap: 6 GiB; monthly transfer cap: 250 GiB.
- Tokens must be unguessable; original filenames are never used as filesystem paths.
- Public stats must remain anonymous (no filenames, IPs, tokens, recent upload list).

## Current project status

Greenfield. **Currently in a frontend-first phase**: the Vue/Vite frontend is being built first, and the backend is emulated through a mock API client (`src/api.ts`). Button clicks and network calls are noops or return canned data so the UI can be developed and styled end-to-end before the Node/Express/SQLite backend exists.

The full spec lives at `ai/context/spec.md` (mirrored from the original `filedrop_project_spec.md`).
