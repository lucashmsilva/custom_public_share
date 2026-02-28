#!/usr/bin/env bash
set -euo pipefail

APP_NAME="custom_public_share"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Directories to deploy — excludes src/, node_modules/, and build tooling
DEPLOY_ITEMS=(appinfo lib templates css js)

usage() {
	echo "Usage: $0 <[user@]host> <remote-custom-apps-path>"
	echo ""
	echo "  [user@]host              Remote server (e.g. 192.168.1.10 or www-data@192.168.1.10)"
	echo "  remote-custom-apps-path  Absolute path to Nextcloud's custom_apps directory"
	echo ""
	echo "Examples:"
	echo "  $0 192.168.1.10 /var/www/nextcloud/custom_apps"
	echo "  $0 www-data@192.168.1.10 /var/www/html/nextcloud/custom_apps"
	exit 1
}

die() {
	echo "Error: $*" >&2
	exit 1
}

[ $# -eq 2 ] || usage

REMOTE_HOST="$1"
REMOTE_APPS_PATH="$2"
REMOTE_APP_PATH="${REMOTE_APPS_PATH}/${APP_NAME}"

# Sanity-check: built JS must exist before deploying
[ -f "$APP_DIR/js/${APP_NAME}-admin.js" ] \
	|| die "Built JS not found. Run 'npm run build' before deploying."

echo "Deploying ${APP_NAME} → ${REMOTE_HOST}:${REMOTE_APP_PATH}"
echo ""

# Create the app directory on the remote server
echo "Creating remote directory ..."
ssh "$REMOTE_HOST" "mkdir -p '${REMOTE_APP_PATH}'"

# Copy each item
for item in "${DEPLOY_ITEMS[@]}"; do
	src="${APP_DIR}/${item}"
	if [ -e "$src" ]; then
		echo "  Copying ${item} ..."
		scp -r "$src" "${REMOTE_HOST}:${REMOTE_APP_PATH}/"
	else
		echo "  Warning: ${item} not found locally, skipping."
	fi
done

echo ""
echo "Done."
echo ""
echo "If this is a first-time install, enable the app on the remote server:"
echo "  sudo -u www-data php occ app:enable ${APP_NAME}"
echo "or executing through Docker if running a Nextcloud container:"
echo "  docker compose exec nextcloud-service-name php occ app:enable custom_public_share"
