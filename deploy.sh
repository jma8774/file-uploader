#!/usr/bin/env bash
# FileDrop production deploy (runs on the Droplet).
#
# Usage:   sudo bash /var/www/filedrop-app/deploy.sh
#
# Pulls the latest main, rebuilds frontend + backend, swaps the static
# bundle into Nginx's docroot, and restarts the systemd service. User
# data (uploads + SQLite DB) lives outside the git checkout, so this is
# safe to re-run as often as needed.

set -euo pipefail

# Locate the repo from the script's own path so this works regardless of
# where the checkout lives (the default is /var/www/filedrop-app).
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_DIR="${PUBLIC_DIR:-/var/www/filedrop-public}"
SERVICE="${SERVICE:-filedrop}"
RUN_USER="${RUN_USER:-filedrop}"

if [[ "$EUID" -ne 0 ]]; then
  echo "deploy.sh must be run as root (sudo). Bailing." >&2
  exit 1
fi

echo "==> pulling latest in $REPO_DIR"
cd "$REPO_DIR"
sudo -u "$RUN_USER" git pull --ff-only

echo "==> backend: install + build"
cd "$REPO_DIR/backend"
sudo -u "$RUN_USER" npm ci
sudo -u "$RUN_USER" npm run build

echo "==> frontend: install + build"
cd "$REPO_DIR/frontend"
sudo -u "$RUN_USER" npm ci
sudo -u "$RUN_USER" npm run build

echo "==> publishing static frontend to $PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"
rsync -a --delete "$REPO_DIR/frontend/dist/" "$PUBLIC_DIR/"
chown -R www-data:www-data "$PUBLIC_DIR"

echo "==> restarting $SERVICE"
systemctl restart "$SERVICE"

echo "==> health check"
curl -fsS http://127.0.0.1:3000/api/health >/dev/null
echo "Deploy complete."
