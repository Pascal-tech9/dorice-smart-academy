"""Application factory for Dorice Smart Academy.

Large-app structure: each concern is its own blueprint (main, auth,
admissions, results, resources). The app factory wires everything
together so the same code can run in dev, test, and production
without circular imports.
"""
import os

from flask import Flask, render_template
from flask_migrate import Migrate

from config import config
from .extensions import db, login_manager, csrf

# Single Migrate instance — bound to the app in create_app().
migrate = Migrate()


def create_app(config_name=None):
    """Build a Flask app instance.

    config_name: "development" (default), "testing", or "production".
    Honors the FLASK_CONFIG environment variable if config_name is None,
    and falls back to development.
    """
    if config_name is None:
        config_name = os.environ.get("FLASK_CONFIG", "development")

    app = Flask(__name__)
    app.config.from_object(config[config_name])
    # If the config class has an init_app hook (ProductionConfig does),
    # call it now so it can do pre-flight checks.
    init_app = getattr(config[config_name], "init_app", None)
    if callable(init_app):
        init_app(app)

    # Ensure upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Init extensions
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    migrate.init_app(app, db)

    # Import all models so Alembic / SQLAlchemy sees them for migrations
    # and for db.create_all() to build the full schema.
    from . import models  # noqa: F401
    from . import email_otp  # noqa: F401  — EmailOTP model must be registered for db.create_all()

    # Register blueprints
    from .main.routes import main_bp
    from .auth.routes import auth_bp
    from .auth.google import google_bp
    from .admissions.routes import admissions_bp
    from .results.routes import results_bp
    from .resources.routes import resources_bp
    from .payments.routes import payments_bp
    from .student import student_bp
    from .messaging import messaging_bp
    from .admin_portal import admin_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(google_bp)
    app.register_blueprint(admissions_bp, url_prefix="/admissions")
    app.register_blueprint(results_bp, url_prefix="/results")
    app.register_blueprint(resources_bp, url_prefix="/resources")
    app.register_blueprint(payments_bp, url_prefix="/payments")
    app.register_blueprint(student_bp)
    app.register_blueprint(messaging_bp)
    app.register_blueprint(admin_bp)

    # Seed default data on first run (skipped in testing to keep tests
    # deterministic — tests build their own fixtures).
    if config_name != "testing":
        with app.app_context():
            db.create_all()
            from .seed import seed_db
            seed_db()

    # Friendly error pages
    @app.errorhandler(404)
    def not_found(e):
        return render_template("errors/404.html"), 404

    @app.errorhandler(403)
    def forbidden(e):
        return render_template("errors/403.html"), 403

    @app.errorhandler(413)
    def too_large(e):
        return render_template("errors/413.html"), 413

    @app.errorhandler(500)
    def server_error(e):
        return render_template("errors/500.html"), 500

    # Security headers (production only — disabled in dev so we
    # can still see HMR / debug routes).
    if config_name == "production":
        @app.after_request
        def _security_headers(response):
            for header, value in app.config.get("SECURITY_HEADERS", {}).items():
                response.headers[header] = value
            csp = app.config.get("CONTENT_SECURITY_POLICY")
            if csp:
                response.headers["Content-Security-Policy"] = csp
            return response

    # Inject globals for templates
    @app.context_processor
    def inject_globals():
        from datetime import datetime
        return {
            "school_name": "Dorice Smart Academy",
            "school_phone": "0115 622615",
            "school_location": "Lumakanda, Kakamega County — 3.6km from town",
            "now_year": datetime.utcnow().year,
        }

    # Register Jinja filters
    @app.template_filter("rubric")
    def _rubric_filter(score):
        """Convert a 1-4 CBC score to its rubric abbreviation."""
        return {
            4: "EE",  # Exceeding Expectation
            3: "ME",  # Meeting Expectation
            2: "AE",  # Approaching Expectation
            1: "BE",  # Below Expectation
        }.get(score, "")

    return app
