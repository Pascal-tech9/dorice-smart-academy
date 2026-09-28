"""Student portal — separate login with admission number + 4-digit PIN.

Students are NOT logged in via the parent login. They go to
/student/login, enter their admission number (e.g. DSA352) and a
4-digit PIN (chosen by the parent/ICT, default 1234 for the demo).

Once in, they see their own transcript(s), learning resources, and
can message the school.
"""
import functools
from flask import (
    Blueprint, render_template, redirect, url_for, flash, request, session, abort,
)
from flask_login import LoginManager
from flask_login import UserMixin

from ..extensions import db
from ..models import Student, Transcript, Message, User
from ..student_roster import is_known_student, get_name_for, get_grade_for
from ..security import audit, rate_limit


student_bp = Blueprint("student", __name__, url_prefix="/student")


# A separate LoginManager instance for students. We can't use flask_login's
# main one because that loads User, not Student. We just use session cookies
# instead — a "student_id" key.
#
# Login is "admission number + 4-digit PIN". Logout clears the cookie.
# This is intentional: keeps students in a fully separate security context
# from parents + admin, so a leaked student PIN can't pivot to a parent
# account.

STUDENT_SESSION_KEY = "_student_id"


def current_student():
    sid = session.get(STUDENT_SESSION_KEY)
    if not sid:
        return None
    return Student.query.get(sid)


def login_student(student: Student):
    session.clear()
    session[STUDENT_SESSION_KEY] = student.id
    audit("student_login", target=f"Student:{student.admission_number}",
          user=student.parent)


def logout_student():
    s = current_student()
    if s:
        audit("student_logout", target=f"Student:{s.admission_number}")
    session.pop(STUDENT_SESSION_KEY, None)


def student_required(view):
    @functools.wraps(view)
    def wrapper(*args, **kwargs):
        if not current_student():
            return redirect(url_for("student.login", next=request.path))
        return view(*args, **kwargs)
    return wrapper


@student_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_student():
        return redirect(url_for("student.dashboard"))

    if request.method == "POST":
        adm   = (request.form.get("admission_number") or "").strip().upper()
        pin   = (request.form.get("pin") or "").strip()
        ip_key = f"student_login:{request.remote_addr}"

        if not rate_limit(ip_key, max_per_minute=10):
            flash("Too many attempts. Please wait a minute.", "warning")
            return render_template("student/login.html"), 429

        if not adm or not pin:
            flash("Enter your admission number and 4-digit PIN.", "warning")
            return render_template("student/login.html")

        if len(pin) != 4 or not pin.isdigit():
            flash("PIN must be exactly 4 digits.", "danger")
            return render_template("student/login.html")

        student = Student.query.filter_by(admission_number=adm).first()
        if not student:
            # Maybe the user typed a name by mistake — give a hint
            flash("Admission number not found. Ask your parent or the office.", "danger")
            return render_template("student/login.html")

        if not student.is_active:
            flash("This student account is currently disabled. Contact the office.", "warning")
            return render_template("student/login.html")

        if not student.check_pin(pin):
            audit("student_login_fail", target=f"Student:{adm}")
            flash("Wrong PIN. Please try again.", "danger")
            return render_template("student/login.html")

        # Success
        from datetime import datetime
        student.last_login_at = datetime.utcnow()
        db.session.commit()
        login_student(student)
        flash(f"Welcome, {student.full_name}!", "success")
        return redirect(url_for("student.dashboard"))

    return render_template("student/login.html")


@student_bp.route("/logout")
def logout():
    logout_student()
    flash("Signed out.", "info")
    return redirect(url_for("student.login"))


@student_bp.route("/dashboard")
@student_required
def dashboard():
    s = current_student()
    transcripts = (Transcript.query
                   .filter_by(student_id=s.id, is_published=True)
                   .order_by(Transcript.year.desc(), Transcript.term.desc())
                   .all())
    return render_template(
        "student/dashboard.html",
        student=s,
        transcripts=transcripts,
    )


@student_bp.route("/transcript/<int:transcript_id>")
@student_required
def view_transcript(transcript_id):
    s = current_student()
    t = Transcript.query.get_or_404(transcript_id)
    if t.student_id != s.id:
        abort(403)
    return render_template(
        "student/transcript.html",
        student=s,
        transcript=t,
    )


# ─── "Identify me" helper for parent signups ─────────────────────────────
# When a parent registers, they need to identify the student they're a
# guardian of. This endpoint accepts an admission number + student name,
# and confirms whether it matches the roster.

@student_bp.route("/identify", methods=["POST"])
def identify():
    """AJAX endpoint. Parent enters admission + name, we check it
    against the official roster before letting them complete signup.
    """
    adm = (request.form.get("admission_number") or "").strip().upper()
    name = (request.form.get("name") or "").strip().upper()

    if not adm or not name:
        return {"ok": False, "error": "Provide both admission number and name."}, 400

    if not is_known_student(adm):
        return {"ok": False,
                "error": f"Admission number {adm} is not on the school roster. "
                          f"Please confirm with the office."}, 404

    official_name = get_name_for(adm).upper()
    # Normalise: strip multi-spaces, ignore special chars
    def norm(s):
        return re.sub(r"[^A-Z ]", "", " ".join(s.split())).strip()

    if norm(official_name) != norm(name):
        return {"ok": False,
                "error": f"Name does not match our records. "
                          f"On file: {get_name_for(adm)}"}, 400

    return {
        "ok": True,
        "admission_number": adm,
        "name": get_name_for(adm),
        "grade": get_grade_for(adm),
    }


import re
