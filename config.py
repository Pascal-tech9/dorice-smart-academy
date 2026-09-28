"""Configuration classes for Dorice Smart Academy.

Three configs:
  - DevelopmentConfig  — local dev, SQLite by default, reads DATABASE_URL
  - TestingConfig      — in-memory SQLite, CSRF off, deterministic
  - ProductionConfig   — Postgres (Supabase or Render), SSL, security headers

The key change in this version: DevelopmentConfig now respects the
DATABASE_URL env var, so you can point it at Supabase Postgres
without editing source code.
"""
import os
from datetime import timedelta


class Config:
    """Base config — all other configs inherit from this."""

    # Core
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-change-me"
    JSON_SORT_KEYS = False

    # SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,    # reconnect on stale connections
        "pool_recycle": 300,      # recycle connections every 5 min
    }

    # Uploads
    UPLOAD_FOLDER = os.path.join(
        os.path.abspath(os.path.dirname(__file__)),
        "app", "uploads"
    )
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB
    ALLOWED_UPLOAD_EXTENSIONS = {
        "pdf", "jpg", "jpeg", "png", "doc", "docx"
    }

    # School identity
    SCHOOL_NAME = "Dorice Smart Academy"
    SCHOOL_PHONE = "0115 622615"
    SCHOOL_LOCATION = "Lumakanda, Kakamega County — 3.6km from town"
    SCHOOL_ADMIN_EMAIL = os.environ.get(
        "SCHOOL_ADMIN_EMAIL", "Doricesmartprimaryschool89@gmail.com"
    )
    SCHOOL_PAYBILL = os.environ.get("SCHOOL_PAYBILL", "400222")
    SCHOOL_ACCOUNT_NUMBER = os.environ.get("SCHOOL_ACCOUNT_NUMBER", "369369")

    # Session
    PERMANENT_SESSION_LIFETIME = timedelta(days=14)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"

    # CSRF
    WTF_CSRF_TIME_LIMIT = 60 * 60 * 8  # 8 hours

    # Email (optional — for verification + audit digests)
    MAIL_SERVER = os.environ.get("MAIL_SERVER")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.environ.get(
        "MAIL_DEFAULT_SENDER",
        '"Dorice Smart Academy" <noreply@dorice.local>'
    )

    # i18n
    BABEL_DEFAULT_LOCALE = "en"
    BABEL_DEFAULT_TIMEZONE = "Africa/Nairobi"

    @staticmethod
    def _fix_supabase_url(url):
        """Supabase connection strings need ?sslmode=require.
        Append it if missing, so psycopg2 doesn't error out.
        """
        if not url or "supabase" not in url:
            return url
        if "sslmode=" in url:
            return url
        sep = "&" if "?" in url else "?"
        return url + sep + "sslmode=require"

    @classmethod
    def init_app(cls, app):
        """Hook called from create_app() after config is loaded."""
        # If using Supabase, ensure SSL is on
        if "DATABASE_URL" in os.environ:
            fixed = cls._fix_supabase_url(os.environ["DATABASE_URL"])
            if fixed != os.environ["DATABASE_URL"]:
                os.environ["DATABASE_URL"] = fixed
                app.config["SQLALCHEMY_DATABASE_URI"] = fixed


class DevelopmentConfig(Config):
    """Local dev. SQLite by default; respects DATABASE_URL env var
    so you can point it at Supabase Postgres without editing source.
    """
    DEBUG = True
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///dorice.db"
    )


class TestingConfig(Config):
    """In-memory SQLite, CSRF disabled, no seed side effects."""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    """For Render / Heroku / VPS / Supabase deployment.

    Required env vars:
        SECRET_KEY       long random string
        DATABASE_URL     postgres://... (Supabase or Render Postgres)
        FLASK_CONFIG=production
    """
    DEBUG = False
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

    # Tighter connection pool for production
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 5,
        "max_overflow": 10,
    }

    # Session cookie security
    SESSION_COOKIE_SECURE = True   # only over HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"

    # Security headers (applied in app/__init__.py after_request hook)
    SECURITY_HEADERS = {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    }
    CONTENT_SECURITY_POLICY = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://accounts.google.com; "
        "frame-src https://accounts.google.com; "
        "connect-src 'self' https://accounts.google.com; "
        "object-src 'none'; "
        "base-uri 'self';"
    )

    @classmethod
    def init_app(cls, app):
        super().init_app(app)
        # Production must have a real DATABASE_URL
        if not app.config.get("SQLALCHEMY_DATABASE_URI"):
            raise RuntimeError(
                "DATABASE_URL is not set. Set it to your Supabase "
                "Postgres URL or another production database."
            )
        # Production must have a real SECRET_KEY
        if not os.environ.get("SECRET_KEY") or \
           os.environ["SECRET_KEY"] in ("dev-secret-change-me",
                                          "local-dev-secret",
                                          "local-dev-secret-please-change-me"):
            raise RuntimeError(
                "SECRET_KEY is not set to a strong value. "
                "Generate one with: python -c 'import secrets;print(secrets.token_hex(32))'"
            )


# Config registry
config = {
    "development": DevelopmentConfig,
    "testing":     TestingConfig,
    "production":  ProductionConfig,
    "default":     DevelopmentConfig,
}
