"""WSGI entry point for production.

Used by gunicorn (see Procfile). Honours the FLASK_CONFIG env var;
defaults to "production" if unset, which uses ProductionConfig.
"""
import os

# Pick up FLASK_CONFIG from the platform's env (Render, Heroku, etc.)
os.environ.setdefault("FLASK_CONFIG", "production")

from app import create_app  # noqa: E402

app = create_app()


# Tiny healthcheck for the platform's load balancer.
# Returns 200 if the app is alive, regardless of DB state.
@app.route("/healthz")
def healthz():
    return {"status": "ok", "service": "dorice-smart-academy"}, 200


# Database health check — verifies the DB is reachable and reports
# row counts for the most critical tables. Use this in your uptime
# monitor (e.g. UptimeRobot, Better Stack) to detect a broken DB
# connection before parents notice.
@app.route("/healthz/db")
def healthz_db():
    from sqlalchemy import text
    from app.extensions import db
    try:
        with db.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            user_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            student_count = conn.execute(text("SELECT COUNT(*) FROM students")).scalar()
            transcript_count = conn.execute(text("SELECT COUNT(*) FROM transcripts")).scalar()
        return {
            "status": "ok",
            "engine": db.engine.dialect.name,
            "users": user_count,
            "students": student_count,
            "transcripts": transcript_count,
        }, 200
    except Exception as e:
        return {"status": "error", "error": str(e)[:200]}, 500
