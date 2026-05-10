# ADR-0001: Initial architecture

## Status

Accepted

## Context

FileDrop is a temporary file-sharing site targeted at a single small DigitalOcean Droplet (~512 MiB RAM, 1 vCPU, 10 GiB SSD). The product is small and the infrastructure budget is small. Anything we add — services, dependencies, abstractions — burns either money or RAM.

## Decision

Single-Droplet, single-process architecture:

- **Frontend**: Vue 3 + Vite + TypeScript, built to static files, served by Nginx.
- **Backend**: Node.js + Express, single process under systemd.
- **Database**: SQLite via `better-sqlite3`, file on local disk.
- **File storage**: local disk under `/var/lib/filedrop/uploads`.
- **Reverse proxy / TLS**: Nginx + Certbot (or Caddy).
- **No** Redis, Postgres, Docker, object storage, or background worker process in v1. Cleanup runs as an in-process interval inside the Node backend.

User data (uploaded files + SQLite DB) lives outside the git checkout so deploys don't destroy it.

Tokens are unguessable (16 random bytes, base64url). Original filenames are display-only — files on disk use generated names.

## Consequences

**Benefits**
- One process, one box, one DB file. Easy to reason about, easy to deploy.
- Cheap (~$4/month).
- No external dependencies → no extra failure modes.

**Tradeoffs**
- No horizontal scaling. If usage outgrows the Droplet, the whole architecture has to change.
- SQLite handles concurrent reads fine but a high write rate would be a problem (acceptable for v1).
- Storage and transfer are hard-capped to protect the cheap Droplet.

## Alternatives considered

- **Postgres + Redis**: rejected. Overkill for the data volume; doesn't fit in 512 MiB with Node + Nginx.
- **DigitalOcean Spaces (object storage)**: rejected for v1. Adds a paid dependency and complicates streaming. Reconsider if local disk becomes the bottleneck.
- **Docker / container orchestration**: rejected. systemd + an Nginx config does the same thing with less RAM.
