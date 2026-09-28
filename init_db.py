"""One-shot DB init: loads .env, creates tables, seeds default data.

Works for both SQLite (local dev) and Postgres/Supabase (production).
"""
import os

# Try to load .env if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed — env vars must be set in the shell

# Set sane defaults
os.environ.setdefault("FLASK_CONFIG", "development")
if not os.environ.get("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "local-dev-secret-please-change-me"

from app import create_app
from app.extensions import db
from app.seed import seed_db

app = create_app()
print("DB URI:", app.config["SQLALCHEMY_DATABASE_URI"])

with app.app_context():
    db.create_all()
    print("Tables created.")
    seed_db()
    print("Seed complete.")
    from app.models import User, Student, Transcript
    print("  Users:", User.query.count())
    print("  Students:", Student.query.count())
    print("  Transcripts:", Transcript.query.count())
    print()
    print("Admin login:")
    print("  Email:    Doricesmartprimaryschool89@gmail.com")
    print("  Password: Onekenya2030")
