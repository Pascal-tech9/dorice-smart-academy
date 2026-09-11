"""Results blueprint.

The KEY logic from the spec lives here:
    if current_user.fees_cleared == False:
        redirect to payment reminder, do NOT show CBC assessment results.
"""
from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user

from ..models import Assessment, Transcript

results_bp = Blueprint("results", __name__)


@results_bp.route("/")
@login_required
def index():
    # ---------- FEES GATE ----------
    # This is the bit the spec asked for. If fees aren't cleared,
    # bounce to the payment reminder page instead of showing results.
    if current_user.fees_cleared == False:
        return redirect(url_for("results.payment_reminder"))
    # --------------------------------

    # Fetch all CBC transcripts for the students linked to this parent.
    # Only published transcripts are visible to parents.
    linked_students = current_user.students.all()
    student_transcripts = {}  # {student_id: [Transcript, ...]}
    for s in linked_students:
        student_transcripts[s.id] = (
            Transcript.query
            .filter_by(student_id=s.id, is_published=True)
            .order_by(Transcript.year.desc(), Transcript.term.desc())
            .all()
        )

    # Legacy Assessment rows (older CBC strand scores)
    assessments = (
        Assessment.query
        .filter_by(user_id=current_user.id)
        .order_by(Assessment.subject.asc(), Assessment.term.asc())
        .all()
    )
    return render_template(
        "results/index.html",
        page_title="CBC Results",
        linked_students=linked_students,
        student_transcripts=student_transcripts,
        assessments=assessments,
    )


@results_bp.route("/payment-reminder")
@login_required
def payment_reminder():
    return render_template(
        "results/payment_reminder.html",
        page_title="Payment Reminder",
    )


@results_bp.route("/pay", methods=["GET", "POST"])
@login_required
def mark_paid():
    """Demo helper: lets a parent mark fees as cleared from the reminder page.

    In a real deployment this would be replaced by an M-Pesa callback or
    a manual admin override once payment is verified at the school office.
    """
    current_user.fees_cleared = True
    from ..extensions import db
    db.session.commit()
    flash("Payment marked as cleared. Welcome to your results.", "success")
    return redirect(url_for("results.index"))
