#!/bin/bash
# Dorice Smart Academy — run the backend locally
# Use this to test on your machine before pushing to GitHub + Render.
#
# What it does:
#   1. Creates a Python virtual environment (./.venv)
#   2. Installs all dependencies from requirements.txt
#   3. Creates a SQLite database (./instance/dorice.db)
#   4. Seeds 1 admin + 348 students + 1 sample transcript
#   5. Starts gunicorn on http://localhost:5000
#
# Usage:
#   chmod +x run-local.sh
#   ./run-local.sh
#
# Then open http://localhost:5000 in your browser.

set -e

cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════════════"
echo "  Dorice Smart Academy — local backend"
echo "═══════════════════════════════════════════════════════"
echo ""

# 1. Virtual environment
if [ ! -d ".venv" ]; then
  echo "→ Creating Python virtual environment..."
  python3 -m venv .venv
fi
source .venv/bin/activate
echo "✓ Virtual environment active"

# 2. Install dependencies
echo "→ Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo "✓ Dependencies installed"

# 3. Create .env if it doesn't exist
if [ ! -f ".env" ]; then
  echo "→ Creating .env with development defaults..."
  cat > .env <<'EOF'
# Development environment — DO NOT use these values in production
FLASK_CONFIG=development
SECRET_KEY=dev-secret-change-me
DATABASE_URL=sqlite:///./instance/dorice.db
SCHOOL_ADMIN_EMAIL=Doricesmartprimaryschool89@gmail.com
SCHOOL_ADMIN_PASSWORD=Onekenya2030
SCHOOL_NAME=Dorice Smart Academy
SCHOOL_PAYBILL=400222
SCHOOL_ACCOUNT_NUMBER=369369
EOF
  echo "✓ .env created (development defaults)"
fi

# 4. Create the database + run seed
echo "→ Creating database + seeding..."
mkdir -p instance
export FLASK_APP=wsgi.py
flask db upgrade 2>/dev/null || true
python -c "from app import create_app; from migrate import seed; app=create_app(); seed(app)"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Starting gunicorn on http://localhost:5000"
echo ""
echo "  Admin login:  Doricesmartprimaryschool89@gmail.com / Onekenya2030"
echo "  Student login: DSA091 / 1234"
echo ""
echo "  Press Ctrl+C to stop."
echo "═══════════════════════════════════════════════════════"
echo ""

# 5. Run gunicorn
exec gunicorn -w 2 -k gthread --threads 4 -b 0.0.0.0:5000 --reload --access-logfile - --error-logfile - wsgi:app
