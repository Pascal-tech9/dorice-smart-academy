#!/bin/bash
# Dorice Smart Academy — manual database backup
# Use this for off-platform backups (Render's built-in backup is recommended
# for nightly automation; this script is for ad-hoc dumps).
#
# Usage:
#   DATABASE_URL=postgres://user:pass@host:port/dbname ./backup-db.sh
#   DATABASE_URL=postgres://... ./backup-db.sh s3://my-bucket/dorice/
#
# If no DATABASE_URL is set, the script reads it from .env.

set -e
cd "$(dirname "$0")"

if [ -z "$DATABASE_URL" ] && [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "✗ DATABASE_URL is not set. Either put it in .env or pass it as an env var."
  exit 1
fi

TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
OUT="dorice-backup-${TIMESTAMP}.sql.gz"

echo "→ Dumping $DATABASE_URL to $OUT ..."
pg_dump "$DATABASE_URL" | gzip > "$OUT"
ls -lh "$OUT"
echo "✓ Backup complete: $OUT"
echo ""
echo "To restore:"
echo "  gunzip -c $OUT | psql \$DATABASE_URL"
