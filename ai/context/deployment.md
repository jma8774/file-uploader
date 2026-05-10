# Deployment

> **Status**: deferred. Nothing is deployed yet. Captured here so future agents (and future-you) have the target shape in mind while building the frontend.

## Environments

- **Local dev**: Vite dev server, emulated API. `npm run dev` in `frontend/`.
- **Production (planned)**: single DigitalOcean Basic Droplet (512 MiB / 1 vCPU / 10 GiB SSD / 500 GiB transfer/mo).

No staging in v1.

## Server layout (planned)

```text
/var/www/filedrop-app        # Git checkout
/var/www/filedrop-public     # Built frontend served by Nginx
/var/lib/filedrop/uploads    # User uploads (outside git checkout)
/var/lib/filedrop/app.db     # SQLite DB (outside git checkout)
/var/log/filedrop            # App logs
```

Rule: user data must live outside the git checkout so deploys don't wipe it.

## Build process

```bash
cd frontend
npm ci
npm run build      # produces frontend/dist
```

## Release process (planned)

Manual SSH deploy. Flow:

```text
ssh → git pull → npm ci (backend + frontend) → run migrations
    → npm run build (frontend) → rsync dist → systemctl restart backend
    → curl /api/health
```

A `deploy.sh` in the repo root will encapsulate this.

## CI/CD

None in v1. Future: GitHub Actions for build + lint on PRs.

## Rollback process

`git checkout <prev-sha> && deploy.sh`. User data is preserved because the uploads dir and SQLite file live outside the checkout.

## Environment variables

See `ai/context/integrations.md`. **No real values in this repo.** Production values go in `/etc/filedrop.env` on the Droplet, owned by the `filedrop` user, mode `0600`.

## Nginx

- Serves `/var/www/filedrop-public` for `/`.
- Reverse-proxies `/api/*` and `/d/*` to `http://localhost:3000`.
- `client_max_body_size 100M;`.
- Handles HTTPS via Certbot or Caddy.

## systemd

Backend runs under a `filedrop` systemd unit. Restart=always, EnvironmentFile=/etc/filedrop.env.

## Monitoring

v1: tail logs via journalctl. Future: DigitalOcean Monitoring for outbound bandwidth.
