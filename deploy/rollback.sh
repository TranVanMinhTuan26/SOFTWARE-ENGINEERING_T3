#!/usr/bin/env bash
set -Eeuo pipefail
cd "${DEPLOY_DIR:-/opt/brewlite}"
exec 9>.deploy.lock
flock -n 9 || { echo "Another deployment is running"; exit 1; }
tag="${1:-$(cat .previous-tag)}"
[[ "$tag" =~ ^[a-f0-9]{40}$ ]] || { echo "Valid previous SHA required"; exit 1; }
export IMAGE_TAG="$tag"
docker compose --env-file .env -f docker-compose.prod.yml up -d --no-deps --wait api web
cat .current-tag > .failed-tag
printf '%s\n' "$tag" > .current-tag
# The failed release must never become the next automatic rollback target.
printf '%s\n' '' > .previous-tag
echo "Application rollback complete; verify public smoke and schema compatibility. DB was not restored."
