"""Auth routes — register, login, logout, upload admission records.

Record uploads (birth certificate + immunization card) live here so a
parent can complete the second step of the admissions process.
"""
import os
import uuid
from datetime import datetime
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename

from ..extensions import db
from ..models import User, Student

auth_bp = Blueprint("auth", __name__)

# Module-level helper: tells the login template whether to render
# the "Sign in with Google" button (only when env vars are set).
from .google import is_configured as _google_ok


def _allowed(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["ALLOWED_EXTENSIONS"]


def _save_upload(file_storage):
    """Save uploaded file with a unique name, return relative path or None."""
    if not file_storage or not file_storage.filename:
        return None
    if not _allowed(file_storage.filename):
        return None
    safe = secure_filename(file_storage.filename)
    return _save_upload_with_name(file_storage, safe)


def _save_upload_with_name(file_storage, safe_name):
    """Save an already-validated file to disk under a unique name."""
    if not safe_name:
        return None
    unique = f"{uuid.uuid4().hex}_{safe_name}"
    dest = os.path.join(current_app.config["UPLOAD_FOLDER"], unique)
    file_storage.save(dest)
    return unique


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        full_name = request.form.get("full_name", "").strip()
        email = request.form.get("email", "").strip().lower()
        grade = request.form.get("grade", "").strip()
        admission_number = request.form.get("admission_number", "").strip().upper()
        student_name = request.form.get("student_name", "").strip()
        phone = request.form.get("phone", "").strip()
        password = request.form.get("password", "")

        if not all([full_name, email, grade, password, student_name, admission_number]):
            flash("Please fill in all required fields (including the student you're linked to).", "danger")
            return redirect(url_for("auth.register"))

        if User.query.filter_by(email=email).first():
            flash("An account with that email already exists.", "warning")
            return redirect(url_for("auth.register"))

        # Validate the student they're claiming against the roster
        from ..student_roster import is_known_student, get_name_for
        from ..models import EmailVerification
        import secrets as _secrets

        if not is_known_student(admission_number):
            flash(f"Admission number {admission_number} is not on the school roster. "
                  f"Please confirm with the school office.", "danger")
            return redirect(url_for("auth.register"))
        official_name = get_name_for(admission_number).upper()
        if official_name != student_name.strip().upper():
            flash(f"The student name doesn't match our records. "
                  f"On file: {get_name_for(admission_number)}", "danger")
            return redirect(url_for("auth.register"))

        user = User(
            full_name=full_name,
            email=email,
            grade=grade,
            phone=phone or None,
            fees_cleared=False,
            email_verified=False,  # pending until ICT approves
            auth_provider="password",
        )
        user.set_password(password)

        # File uploads (with firewall)
        from ..security import validate_upload
        for field, attr in [("birth_certificate", "birth_certificate"),
                              ("immunization_card", "immunization_card")]:
            f = request.files.get(field)
            if f and f.filename:
                ok, safe, reason = validate_upload(f, "records")
                if ok:
                    setattr(user, attr, _save_upload_with_name(f, safe))
                else:
                    flash(f"{field.replace('_',' ').title()} rejected: {reason}", "warning")

        db.session.add(user)
        db.session.flush()  # get user.id without committing yet

        # Find or create the Student record for this child
        student = Student.query.filter_by(admission_number=admission_number).first()
        if student is None:
            student = Student(
                admission_number=admission_number,
                full_name=student_name.upper(),
                grade=grade,
                is_on_roster=True,
                parent_id=user.id,
            )
            student.set_pin("0000")  # placeholder — parent must change via portal
            db.session.add(student)
        else:
            # Existing student — just link to this parent if not already
            if not student.parent_id:
                student.parent_id = user.id
        db.session.flush()

        # Also link via the relationship (so user.students works)
        if student not in user.students.all():
            user.students.append(student)
        db.session.commit()

        # Create email verification row for ICT to approve
        ev = EmailVerification(
            user_id=user.id,
            token=_secrets.token_urlsafe(32),
            declared_student_admission=admission_number,
            declared_student_name=student_name,
        )
        db.session.add(ev)
        db.session.commit()

        # Generate and send OTP to the parent's email
        from ..email_otp import generate_otp
        generate_otp(user)

        flash("Account created! A 6-digit verification code has been sent "
              "to your email. Enter it to activate your account.", "info")
        return redirect(url_for("auth.verify_otp", user_id=user.id))

    return render_template("auth/register.html", page_title="Register")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        remember = bool(request.form.get("remember"))

        user = User.query.filter(db.func.lower(User.email) == email).first()
        if user and user.check_password(password):
            if not user.is_active:
                flash("This account is disabled. Contact the school office.", "danger")
                return render_template("auth/login.html", page_title="Sign in",
                                        google_enabled=_google_ok())
            if not user.email_verified and not user.is_administrator():
                from ..email_otp import EmailOTP as _EmailOTP
                has_pending = _EmailOTP.query.filter_by(
                    user_id=user.id, status="pending"
                ).order_by(_EmailOTP.created_at.desc()).first() is not None
                flash(
                    "Your email hasn't been verified yet. "
                    "Check your inbox for a 6-digit code, "
                    "or "
                    + ('<a href="' + url_for("auth.verify_otp", user_id=user.id) + '" style="color:#A8532B;font-weight:600;">resend it here</a>.'
                       if has_pending else '<a href="' + url_for("auth.verify_otp", user_id=user.id) + '" style="color:#A8532B;font-weight:600;">request a new code</a>.')
                    ,
                    "warning"
                )
                return render_template("auth/login.html", page_title="Sign in",
                                        google_enabled=_google_ok())
            login_user(user, remember=remember)
            flash("Signed in.", "success")
            next_url = request.args.get("next") or url_for("main.index")
            return redirect(next_url)
        flash("Invalid email or password.", "danger")

    # Tell the template whether to render the "Sign in with Google"
    # button (only when Google OAuth env vars are set).
    return render_template(
        "auth/login.html",
        page_title="Sign in",
        google_enabled=_google_ok(),
    )


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Signed out.", "info")
    return redirect(url_for("main.index"))


@auth_bp.route("/verify-otp/<int:user_id>", methods=["GET", "POST"])
def verify_otp(user_id):
    """Enter the 6-digit code sent to the parent's email to activate the account."""
    user = User.query.get_or_404(user_id)

    if user.email_verified:
        flash("Your email is already verified. Please sign in.", "info")
        return redirect(url_for("auth.login"))

    from ..email_otp import verify_otp as _check_otp, generate_otp as _send_otp, EmailOTP as _EmailOTP

    # Show remaining attempts from the latest pending OTP
    latest_otp = (
        _EmailOTP.query
        .filter_by(user_id=user.id, status="pending")
        .order_by(_EmailOTP.created_at.desc())
        .first()
    )
    remaining_attempts = None
    if latest_otp:
        remaining_attempts = max(0, 5 - latest_otp.attempts)

    if request.method == "POST":
        code = request.form.get("code", "").strip()
        action = request.form.get("action", "")

        if action == "resend":
            _send_otp(user)
            flash("A new code has been sent to your email.", "info")
            return redirect(url_for("auth.verify_otp", user_id=user.id))

        if _check_otp(user, code):
            user.email_verified = True
            user.email_verified_at = datetime.utcnow()
            db.session.commit()
            flash("Email verified! You can now sign in.", "success")
            return redirect(url_for("auth.login"))
        else:
            remaining_attempts = max(0, (latest_otp.attempts + 1) if latest_otp else 5) if latest_otp else 0
            remaining_attempts = max(0, 5 - remaining_attempts)
            flash(
                f"Invalid or expired code. {remaining_attempts} attempts remaining before the code expires.",
                "danger"
            )

    return render_template(
        "auth/verify_otp.html",
        page_title="Verify Email",
        user=user,
        remaining_attempts=remaining_attempts,
    )


@auth_bp.route("/records", methods=["GET", "POST"])
@login_required
def records():
    """Upload or replace birth certificate / immunization card."""
    if request.method == "POST":
        bc = _save_upload(request.files.get("birth_certificate"))
        imm = _save_upload(request.files.get("immunization_card"))
        if bc:
            current_user.birth_certificate = bc
        if imm:
            current_user.immunization_card = imm
        db.session.commit()
        flash("Records updated.", "success")
        return redirect(url_for("auth.records"))

    return render_template("auth/records.html", page_title="Admission records")
