#!/bin/bash
# Dorice Smart Academy — initialize alembic migrations
# Run this once on a greenfield deploy, BEFORE the first `python migrate.py`.
#
# What it does:
#   1. flask db init   — creates the migrations/ folder
#   2. flask db migrate -m "initial schema" — autogenerate the first migration
#   3. flask db upgrade — apply it
#   4. python migrate.py seed — seed default data
#
# After this, every future schema change follows the standard alembic flow:
#   - Edit a model in app/models.py
#   - flask db migrate -m "what changed"
#   - flask db upgrade
#   - Commit, push, Render auto-runs the upgrade on next deploy.
#
# Usage:
#   ./init-migrations.sh

set -e
cd "$(dirname "$0")"

# Pick up FLASK_CONFIG / DATABASE_URL from .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Use the venv if it exists
if [ -d .venv ]; then
  source .venv/bin/activate
fi

export FLASK_APP=wsgi.py

echo "═══════════════════════════════════════════════════════"
echo "  Dorice Smart Academy — init alembic migrations"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ -d "migrations" ]; then
  echo "→ migrations/ already exists. Skipping init."
else
  echo "→ Step 1/4: flask db init"
  flask db init
fi

echo "→ Step 2/4: flask db migrate -m 'initial schema'"
flask db migrate -m "initial schema"

echo "→ Step 3/4: flask db upgrade"
flask db upgrade

echo "→ Step 4/4: seed default data"
python migrate.py seed

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Done. migrations/ folder is ready."
echo "  Next deploys will auto-apply via: python migrate.py"
echo "═══════════════════════════════════════════════════════"
