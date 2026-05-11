#!/usr/bin/env bash
# FileDrop deploy from a macOS / Linux laptop.
#
# Builds the frontend and backend locally, then rsyncs only the artifacts
# (no node_modules, no source) to the Droplet over SSH. This dodges the
# vue-tsc OOM on a 512 MB Droplet and the "wrong Node version" class of
# bugs entirely — the Droplet only has to install production deps and
# restart.
#
# Usage:
#   ./deploy-local.sh root@<droplet-ip>
#   FILEDROP_HOST=root@<droplet-ip> ./deploy-local.sh
#
# Optional env overrides:
#   REMOTE_APP=/var/www/filedrop-app
#   REMOTE_PUBLIC=/var/www/filedrop-public
#   SERVICE=filedrop
#   RUN_USER=filedrop

set -euo pipefail

HOST="${1:-${FILEDROP_HOST:-}}"
if [[ -z "$HOST" ]]; then
  echo "Usage: $0 <ssh-target>" >&2
  echo "  e.g. $0 root@198.199.73.73" >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_APP="${REMOTE_APP:-/var/www/filedrop-app}"
REMOTE_PUBLIC="${REMOTE_PUBLIC:-/var/www/filedrop-public}"
SERVICE="${SERVICE:-filedrop}"
RUN_USER="${RUN_USER:-filedrop}"

echo "==> building frontend"
( cd "$REPO_DIR/frontend" && npm ci && npm run build )

echo "==> building backend"
( cd "$REPO_DIR/backend" && npm ci && npm run build )

echo "==> rsync frontend/dist -> $HOST:$REMOTE_PUBLIC"
rsync -a --delete \
  "$REPO_DIR/frontend/dist/" \
  "$HOST:$REMOTE_PUBLIC/"

echo "==> rsync backend/dist -> $HOST:$REMOTE_APP/backend/dist"
rsync -a --delete \
  "$REPO_DIR/backend/dist/" \
  "$HOST:$REMOTE_APP/backend/dist/"

echo "==> rsync backend manifests + migrations"
rsync -a \
  "$REPO_DIR/backend/package.json" \
  "$REPO_DIR/backend/package-lock.json" \
  "$HOST:$REMOTE_APP/backend/"
rsync -a --delete \
  "$REPO_DIR/backend/migrations/" \
  "$HOST:$REMOTE_APP/backend/migrations/"

echo "==> remote: chown, install prod deps, restart, health check"
ssh "$HOST" bash -s <<REMOTE
set -euo pipefail
chown -R ${RUN_USER}:${RUN_USER} ${REMOTE_APP}/backend
chown -R www-data:www-data ${REMOTE_PUBLIC}
cd ${REMOTE_APP}/backend
sudo -u ${RUN_USER} npm ci --omit=dev
systemctl restart ${SERVICE}
sleep 1
curl -fsS http://127.0.0.1:3000/api/health >/dev/null
echo "Remote deploy complete."
REMOTE

echo "Deploy complete."
