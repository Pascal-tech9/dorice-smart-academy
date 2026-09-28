#!/bin/bash
# Dorice Smart Academy — restore a database backup
#
# Usage:
#   DATABASE_URL=postgres://... ./restore-db.sh dorice-backup-20260101-120000.sql.gz
#
# WARNING: this DROPS the existing data and re-creates the schema.

set -e
cd "$(dirname "$0")"

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh dorice-backup-*.sql.gz 2>/dev/null || echo "  (none in current directory)"
  exit 1
fi

if [ -z "$DATABASE_URL" ] && [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "✗ DATABASE_URL is not set."
  exit 1
fi

BACKUP="$1"
if [ ! -f "$BACKUP" ]; then
  echo "✗ Backup file not found: $BACKUP"
  exit 1
fi

echo "→ Restoring $BACKUP into $DATABASE_URL"
echo "  (This will drop existing data. Press Ctrl+C in the next 5s to cancel.)"
sleep 5

gunzip -c "$BACKUP" | psql "$DATABASE_URL" --quiet
echo "✓ Restore complete. Run: python migrate.py seed"
