"""Production database migration script.

Two modes:
  1. Flask-Migrate (alembic) — preferred. Run `python migrate.py upgrade`
     to apply pending migrations, or `python migrate.py revision --autogenerate -m "..."`
     after a schema change.
  2. db.create_all() — fallback for greenfield deploys where there's no
     migration history yet. Creates every table from the current models,
     then seeds default data.

This script is also called by `render.yaml` buildCommand and the
`Procfile` release phase, so first-deploy is automatic.

Usage:
    python migrate.py                  # upgrade via alembic
    python migrate.py upgrade          # same
    python migrate.py stamp            # stamp the DB as up-to-date without running
    python migrate.py seed             # only seed (idempotent)
    python migrate.py reset            # DROP + recreate + seed (DEV ONLY)
"""
import os
import sys

# Ensure FLASK_CONFIG is set
os.environ.setdefault("FLASK_CONFIG", "production")

from flask_migrate import upgrade as alembic_upgrade, stamp as alembic_stamp
from app import create_app
from app.extensions import db


def banner(text):
    print()
    print("=" * 60)
    print(text)
    print("=" * 60)
    print()


def do_upgrade():
    """Apply any pending alembic migrations to head."""
    banner("DORICE SMART ACADEMY — Alembic upgrade")
    app = create_app()
    with app.app_context():
        try:
            alembic_upgrade()
            print("✓ Migrations applied (head)")
        except Exception as e:
            print(f"!! Alembic upgrade failed: {e}")
            print("   Falling back to db.create_all() (greenfield mode)")
            db.create_all()
            print("✓ Tables created via db.create_all()")
        from app.seed import seed_db
        seed_db()
        print("✓ Seed complete")


def do_stamp():
    """Stamp the database as up-to-date without running migrations."""
    banner("DORICE SMART ACADEMY — Alembic stamp head")
    app = create_app()
    with app.app_context():
        alembic_stamp()
        print("✓ Stamped head")


def do_seed():
    """Idempotent seed run."""
    banner("DORICE SMART ACADEMY — Seed")
    app = create_app()
    with app.app_context():
        from app.seed import seed_db
        seed_db()
        print("✓ Seed complete")


def do_reset():
    """DEV ONLY: drop all tables, recreate, seed."""
    if os.environ.get("FLASK_CONFIG", "production") == "production":
        print("!! REFUSING to reset in production. Unset FLASK_CONFIG=production or set FLASK_CONFIG=development.")
        sys.exit(1)
    banner("DORICE SMART ACADEMY — RESET (dev only)")
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        from app.seed import seed_db
        seed_db()
        print("✓ Reset complete")


def do_init():
    """Greenfield: create tables + seed (no alembic history yet)."""
    banner("DORICE SMART ACADEMY — Initial schema")
    app = create_app()
    with app.app_context():
        db.create_all()
        from app.seed import seed_db
        seed_db()
        # Stamp alembic to head so future runs use migrations, not create_all
        try:
            alembic_stamp()
            print("✓ Alembic stamped to head")
        except Exception as e:
            print(f"⚠ Could not stamp alembic: {e}")
    print()
    print("Next steps:")
    print("  1. Sign in as Doricesmartprimaryschool89@gmail.com / Onekenya2030")
    print("  2. CHANGE THE PASSWORD immediately (/admin → Change my password)")
    print("  3. Plug in your M-Pesa Daraja + Google OAuth credentials")
    print("  4. Print /payments/sim-guide and share with parents")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "upgrade"
    if cmd in ("upgrade", "up", "migrate"):
        do_upgrade()
    elif cmd in ("stamp",):
        do_stamp()
    elif cmd in ("seed",):
        do_seed()
    elif cmd in ("reset",):
        do_reset()
    elif cmd in ("init", "first"):
        do_init()
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n!!! FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
