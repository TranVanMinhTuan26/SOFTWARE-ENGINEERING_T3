#!/usr/bin/env bash
set -Eeuo pipefail
cd "${DEPLOY_DIR:-/opt/brewlite}"
new_tag="${1:?commit SHA required}"
[[ "$new_tag" =~ ^[a-f0-9]{40}$ ]] || { echo "Invalid image SHA"; exit 1; }
exec 9>.deploy.lock
flock -n 9 || { echo "Another deployment is running"; exit 1; }
previous="$(cat .current-tag 2>/dev/null || true)"
export IMAGE_TAG="$new_tag"
compose=(docker compose --env-file .env -f docker-compose.prod.yml)
rollback() {
  echo "Deployment failed. Application rollback requested; DB schema is not reverted."
  if [[ "$previous" =~ ^[a-f0-9]{40}$ ]]; then
    export IMAGE_TAG="$previous"
    "${compose[@]}" up -d --no-deps api web
  fi
  exit 1
}
trap rollback ERR
"${compose[@]}" pull
"${compose[@]}" up -d --wait --wait-timeout 120 db
# Require backup before every migration. Backup contains sensitive data; keep on VPS only.
mkdir -p backups
chmod 700 backups
"${compose[@]}" exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "backups/pre-$new_tag.sql"
chmod 600 "backups/pre-$new_tag.sql"
"${compose[@]}" run --rm --no-deps api npm run db:deploy
"${compose[@]}" up -d --wait --wait-timeout 180
"${compose[@]}" exec -T api node -e "fetch('http://localhost:4000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
"${compose[@]}" exec -T web node -e "fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
printf '%s\n' "$previous" > .previous-tag
printf '%s\n' "$new_tag" > .current-tag
trap - ERR
echo "Deployment healthy: $new_tag"
