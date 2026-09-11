import os
import sys

basedir = os.path.abspath(os.path.dirname(__file__))


def _sqlite_fallback():
    """Where the dev SQLite DB lives. Used when DATABASE_URL is not set."""
    return "sqlite:///" + os.path.join(basedir, "app.db")


def _normalise_db_url(url: str) -> str:
    """Translate Heroku's legacy 'postgres://' to 'postgresql://'."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


class Config:
    """Base config — sensible defaults for dev and test."""
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dorice-smart-academy-dev-secret"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # File upload settings
    UPLOAD_FOLDER = os.path.join(basedir, "app", "uploads", "records")
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8MB cap

    # Auto-set on create by the app factory if you prefer; declared here
    # so subclasses can override for tests.
    WTF_CSRF_TIME_LIMIT = None  # forms stay valid for the session


class DevelopmentConfig(Config):
    DEBUG = True
    # Respect DATABASE_URL if set (e.g. Supabase), otherwise use a local
    # SQLite file in the project directory (not /tmp which is Unix-only).
    _default_db = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(basedir, "instance", "dorice_dev.db"),
    )
    SQLALCHEMY_DATABASE_URI = _default_db
    SQLALCHEMY_ECHO = False


class TestingConfig(Config):
    """In-memory SQLite, CSRF disabled, no seed side effects."""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
    SECRET_KEY = "test-secret"


class ProductionConfig(Config):
    """For Render / Heroku / VPS deployment.

    Required env vars (set these in your platform's dashboard, never in
    source control):

        SECRET_KEY       long random string
        DATABASE_URL     postgresql://user:pass@host:5432/dbname

    On Heroku, DATABASE_URL is set automatically when you provision a
    Postgres add-on. On Render, it's set when you create the Postgres
    service and link it to the web service.

    Heroku's older "postgres://" scheme is normalised to "postgresql://"
    because SQLAlchemy 2.x rejects the legacy form.
    """
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = _normalise_db_url(
        os.environ.get("DATABASE_URL") or _sqlite_fallback()
    )

    # ─── Session cookie hardening ─────────────────────────────────
    SESSION_COOKIE_SECURE   = True   # only sent over HTTPS
    SESSION_COOKIE_HTTPONLY  = True   # JS can't read the cookie
    SESSION_COOKIE_SAMESITE  = "Lax"  # CSRF mitigation
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 8  # 8 hours
    REMEMBER_COOKIE_SECURE  = True
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = 60 * 60 * 24 * 30  # 30 days

    # ─── Proxy / HTTPS trust ─────────────────────────────────────
    # On Render/Heroku, requests arrive via their load balancer
    # over HTTP. We need to trust the X-Forwarded-Proto header so
    # url_for(..., _external=True) generates https:// links.
    PREFERRED_URL_SCHEME = "https"

    # ─── Security headers (set in app factory after_request) ────
    SECURITY_HEADERS = {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Content-Type-Options":    "nosniff",
        "X-Frame-Options":           "SAMEORIGIN",
        "Referrer-Policy":           "strict-origin-when-cross-origin",
        "Permissions-Policy":        "geolocation=(), microphone=(), camera=()",
    }

    # ─── Optional: Pinned CSP for the public site ───────────────
    # Add your domain (e.g. portal.doricesmartacademy.school.ke) to
    # script-src / connect-src if you serve anything from a CDN
    # beyond jsdelivr + googleapis.
    CONTENT_SECURITY_POLICY = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://accounts.google.com; "
        "frame-src https://accounts.google.com; "
        "connect-src 'self' https://accounts.google.com; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )

    # Pre-flight: warn loudly if SECRET_KEY is missing in production.
    SECRET_KEY = os.environ.get("SECRET_KEY")

    @classmethod
    def init_app(cls, app):
        if not cls.SECRET_KEY:
            sys.stderr.write(
                "\n*** WARNING: SECRET_KEY is not set. "
                "Set it in the environment before running in production. ***\n\n"
            )
        # Trust the X-Forwarded-Proto header from the platform's
        # load balancer. Required so url_for(..., _external=True)
        # generates https:// links behind Render/Heroku/VPS+nginx.
        from werkzeug.middleware.proxy_fix import ProxyFix
        app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)


# Map for the FLASK_ENV / APP_ENV switch in run.py and wsgi.py
config = {
    "development": DevelopmentConfig,
    "testing":     TestingConfig,
    "production":  ProductionConfig,
    "default":     DevelopmentConfig,
}
