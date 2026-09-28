"""Seed default data on first run.

Production seed:
  - School admin: Doricesmartprimaryschool89@gmail.com / Onekenya2030
    (CHANGE THIS PASSWORD VIA /admin AFTER FIRST DEPLOY)
  - All 170+ students from the official roster, PIN = 1234 (ICT can change)
  - 1 sample CBC transcript for the demo child

NO demo parent accounts in production. Real parents register
themselves through /auth/register and identify their child by
admission number + name from the official roster. The ICT lead
approves each signup from /admin/verifications before the parent
can sign in.
"""
import secrets
from datetime import datetime as _dt

from .extensions import db
from .models import (
    User, Role, Student, Assessment, Transcript, TranscriptLine,
)
from .student_roster import STUDENT_ROSTER, phase_for_grade, subjects_for_grade


# The ONE admin account. This email is the only one that can reach /admin/*
# (gated by @require_ict_email).
SCHOOL_ADMIN_EMAIL = "Doricesmartprimaryschool89@gmail.com"


def _username_for(email):
    return email.split("@", 1)[0]


def seed_db():
    if User.query.first():
        return  # already seeded

    # Roles
    Role.insert_roles()

    admin_role  = Role.query.filter_by(name="Admin").first()
    parent_role = Role.query.filter_by(name="Parent").first()

    # ─── School admin (the ICT lead) ─────────────────────────────
    admin = User(
        full_name="Mrs. D. A. Chapia",
        email=SCHOOL_ADMIN_EMAIL,
        username=SCHOOL_ADMIN_EMAIL.split("@")[0],
        grade="—",
        admission_number="DSA-ADMIN-ICT",
        fees_cleared=True,
        role=admin_role,
        auth_provider="password",
        email_verified=True,
        email_verified_at=_dt.utcnow(),
        phone="0115622615",
    )
    admin.set_password("Onekenya2030")
    db.session.add(admin)
    db.session.commit()

    # ─── Seed all 170+ students from the official roster ───────
    for adm_no, (name, grade) in STUDENT_ROSTER.items():
        s = Student(
            admission_number=adm_no,
            full_name=name,
            grade=grade,
            is_on_roster=True,
        )
        s.set_pin("1234")
        db.session.add(s)
    db.session.commit()

    # ─── Seed one sample CBC transcript so the student dashboard ──
    # has something to show. Uses the first Grade 5 student.
    sample = Student.query.filter_by(admission_number="DSA091").first()
    if sample:
        t = Transcript(
            student_id=sample.id,
            term="Term 1",
            year=2026,
            grade=sample.grade,
            phase=phase_for_grade(sample.grade),
            learner_name=sample.full_name,
            assessment_number=f"{sample.admission_number}-T1-2026",
            general_performance="Meeting Expectation",
            total_marks=24, total_out_of=28, position=2, out_of=22,
            grade_facilitator_comments=(
                "Martin is a curious and diligent learner. "
                "He excels in numeracy and enjoys group work. "
                "Encourage him to participate more in class discussions."
            ),
            facilitator_signature="Ms. Wairimu",
            head_signature="Headteacher",
            is_published=True,
            published_at=_dt.utcnow(),
            created_by_id=admin.id,
        )
        db.session.add(t)
        db.session.commit()
        for idx, subj in enumerate(subjects_for_grade(sample.grade)):
            db.session.add(TranscriptLine(
                transcript_id=t.id, subject=subj, order=idx,
                entry_score=3, mid_score=3, end_score=3,
                performance_level=3,
                facilitator_comment="Solid performance, keep it up.",
            ))
        db.session.commit()
