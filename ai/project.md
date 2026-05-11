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

Frontend (TICKETs 001–013) and backend MVP (TICKETs 014–019) are done, plus TICKET-022 which wired the frontend to the real backend (ADR-0002 superseded). **Active scope** is the hardening pass — TICKET-020 (cleanup job), TICKET-021 (rate limits + safety-cap kill switch), TICKET-023 (backend tests).

Local dev runs on macOS; production target is a single Linux DigitalOcean Droplet — paths to the uploads dir and SQLite file come from environment variables so the same source runs on both.

The full spec lives at `ai/context/spec.md` (mirrored from the original `filedrop_project_spec.md`); the dark-theme spec lives at `ai/context/theme-spec.md`.
