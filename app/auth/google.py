"""Google OAuth Sign-in.

Set these env vars to enable (https://console.cloud.google.com/):
    GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET
    GOOGLE_OAUTH_REDIRECT_URI  (default: https://yourdomain/auth/google/callback)

If any of these are missing, the helper `is_configured()` returns False
and the "Sign in with Google" button is hidden in the login template.
"""
import os
from flask import Blueprint, redirect, url_for, session, flash, current_app
from flask_login import login_user, current_user
from authlib.integrations.requests_client import OAuth2Session
import requests

from ..models import User, Role
from ..extensions import db

google_bp = Blueprint("google_auth", __name__)

CLIENT_ID     = os.environ.get("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
REDIRECT_URI  = os.environ.get("GOOGLE_OAUTH_REDIRECT_URI",
                                "http://localhost:5000/auth/google/callback")

AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO  = "https://openidconnect.googleapis.com/v1/userinfo"

SCOPES = ["openid", "email", "profile"]


def is_configured():
    """True if Google OAuth is fully configured. The login template
    uses this to decide whether to show the button."""
    return bool(CLIENT_ID and CLIENT_SECRET)


@google_bp.route("/auth/google/login")
def login():
    """Start the OAuth flow. Redirects the browser to Google."""
    if not is_configured():
        flash(
            "Google sign-in isn't configured on this server yet. "
            "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
            "warning",
        )
        return redirect(url_for("auth.login"))

    oauth = OAuth2Session(
        CLIENT_ID,
        CLIENT_SECRET,
        scope=SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    uri, state = oauth.create_authorization_url(AUTH_URL, prompt="select_account")
    session["_google_oauth_state"] = state
    return redirect(uri)


@google_bp.route("/auth/google/callback")
def callback():
    """Google redirects the browser here after the user consents.

    We exchange the code for a token, fetch the user's profile, and
    either log them in (existing account) or create a new one.
    """
    if not is_configured():
        return redirect(url_for("auth.login"))

    # Validate state to block CSRF
    expected_state = session.pop("_google_oauth_state", None)
    if not expected_state or expected_state != request.args.get("state"):
        flash("Google sign-in failed: state mismatch. Please try again.", "danger")
        return redirect(url_for("auth.login"))

    oauth = OAuth2Session(
        CLIENT_ID,
        CLIENT_SECRET,
        scope=SCOPES,
        redirect_uri=REDIRECT_URI,
        state=expected_state,
    )
    try:
        token = oauth.fetch_token(
            TOKEN_URL,
            authorization_response=request.url,
            client_secret=CLIENT_SECRET,
        )
    except Exception as e:
        current_app.logger.exception("Google OAuth token exchange failed")
        flash(f"Google sign-in failed: {e}", "danger")
        return redirect(url_for("auth.login"))

    # Fetch profile
    resp = requests.get(
        USERINFO,
        headers={"Authorization": f"Bearer {token['access_token']}"},
        timeout=10,
    )
    resp.raise_for_status()
    info = resp.json()

    email = (info.get("email") or "").lower().strip()
    if not email or not info.get("email_verified"):
        flash("Google sign-in needs a verified email address.", "danger")
        return redirect(url_for("auth.login"))

    full_name = info.get("name") or email.split("@")[0]
    google_id = info.get("sub")

    # Find or create the user
    user = User.query.filter_by(email=email).first()
    if user is None:
        # Auto-register new Google users as Parents. Set a random
        # password so the NOT NULL constraint is satisfied — the user
        # can keep signing in with Google and never need it.
        import secrets as _secrets
        parent_role = Role.query.filter_by(name="Parent").first()
        user = User(
            email=email,
            username=email.split("@")[0],
            full_name=full_name,
            role_id=parent_role.id if parent_role else 1,
            google_id=google_id,
            auth_provider="google",
        )
        user.set_password(_secrets.token_urlsafe(32))
        db.session.add(user)
        db.session.commit()
        flash(f"Welcome, {full_name}! Your Dorice Smart Academy account is ready.", "success")
    else:
        # Existing user — link the Google ID if not already linked
        if not user.google_id:
            user.google_id = google_id
        # If they previously signed in with a password, mark as
        # dual-capable so the login form still works.
        if not user.auth_provider:
            user.auth_provider = "password"
        db.session.commit()

    login_user(user)
    flash(f"Signed in as {user.full_name}.", "success")
    # If they have no linked student yet, send them to the claim page
    # so they can link their child's record before seeing results.
    if not user.students.count():
        return redirect(url_for("auth.claim_student"))
    return redirect(url_for("main.index"))


@google_bp.route("/auth/claim-student", methods=["GET", "POST"])
def claim_student():
    """Link a Google-signed-in parent to a student on the roster.

    The parent must enter their child's admission number and confirm
    the student name as on the school register. We verify against the
    official roster (student_roster.py) and then attach the Student
    to this User via the student_links association.
    """
    from ..student_roster import is_known_student, get_name_for
    from ..models import Student

    if not current_user.is_authenticated:
        return redirect(url_for("auth.login"))

    # Already linked? Bounce them to results.
    if current_user.students.count():
        return redirect(url_for("results.index"))

    # Pass a small roster map to the template for the auto-fill lookup.
    # For very large rosters, replace with an AJAX endpoint.
    from ..student_roster import STUDENT_ROSTER
    roster_map = {adm: {"name": name, "grade": grade}
                  for adm, (name, grade) in STUDENT_ROSTER.items()}

    if request.method == "POST":
        adm = (request.form.get("admission_number") or "").strip().upper()
        stuname = (request.form.get("student_name") or "").strip()
        if not adm or not stuname:
            flash("Please enter the admission number and confirm the name.", "warning")
            return render_template("auth/claim_student.html", roster=roster_map)
        if not is_known_student(adm):
            flash(f"Admission number {adm} is not on the school roster.", "danger")
            return render_template("auth/claim_student.html", roster=roster_map)
        official = get_name_for(adm).upper()
        if official != stuname.upper():
            flash(f"Name does not match. On file: {get_name_for(adm)}.", "danger")
            return render_template("auth/claim_student.html", roster=roster_map)
        # Link it
        student = Student.query.filter_by(admission_number=adm).first()
        if student is None:
            # Not yet in the DB — create from roster data
            student = Student(
                admission_number=adm,
                full_name=get_name_for(adm),
                grade=request.form.get("grade") or "",
                is_on_roster=True,
            )
            db.session.add(student)
            db.session.flush()
        if student not in current_user.students.all():
            current_user.students.append(student)
            # Mark as the primary contact for this student
            student.parent_id = current_user.id
        db.session.commit()
        flash(f"Linked to {student.full_name}. You can now see their report.", "success")
        return redirect(url_for("results.index"))

    return render_template("auth/claim_student.html", roster=roster_map)


# Patch the import — `request` is needed for `request.args` in the
# callback above. Moved here to keep the top of the file clean.
from flask import request  # noqa: E402
