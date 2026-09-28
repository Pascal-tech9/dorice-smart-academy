"""Admissions blueprint — public-facing 4-step process page."""
from flask import Blueprint, render_template

admissions_bp = Blueprint("admissions", __name__)


@admissions_bp.route("/")
def index():
    steps = [
        {
            "n": "01",
            "title": "Call the office",
            "body": "Reach the school office on 0115 622615 to confirm openings for your child's grade and ask any questions about the term structure.",
            "cta": "tel:0115622615",
            "cta_label": "Call 0115 622615",
        },
        {
            "n": "02",
            "title": "Submit records",
            "body": "Bring the learner's birth certificate, immunization card, and any report from a previous school. You can also upload them through the parent portal after signing in.",
            "cta": "auth.register",
            "cta_label": "Create a parent account",
        },
        {
            "n": "03",
            "title": "Meet the class teacher",
            "body": "A short placement conversation confirms the right grade and section, and gives you a chance to talk with the teacher who'll be with your child daily.",
            "cta": None,
            "cta_label": None,
        },
        {
            "n": "04",
            "title": "Enroll",
            "body": "Complete the term fee arrangement with the office and receive the uniform list, supply list, and term dates for the year.",
            "cta": "admissions.index",
            "cta_label": "View 2026 calendar",
        },
    ]
    return render_template(
        "admissions/index.html",
        page_title="Admissions",
        steps=steps,
    )
