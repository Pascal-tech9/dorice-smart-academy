"""Database models for Dorice Smart Academy.

Three account types:
  - User: parents + admin (existing). Parents link to ONE Student
    via Student.parent_id. The school email admin has is_administrator.
  - Student: the actual learner. Has admission_number, 4-digit PIN,
    grade, fees_cleared. Linked to a parent User.
  - Staff: teachers (no login in this build, but tracked for audits).

Other tables:
  - Role: Parent / Teacher / Admin
  - Transcript: one summative assessment report (term + year + grade)
  - TranscriptLine: one subject row inside a Transcript (Entry/Mid/End
    rubric scores + performance level)
  - Payment: M-Pesa payment attempts
  - Message: parent ↔ admin support messages
  - EmailVerification: pending parent signups, ICT must approve
  - AuditLog: who-did-what-when
"""
import re
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from .extensions import db, login_manager


# ─── ROLE ──────────────────────────────────────────────────────────────────
class Role(db.Model):
    """Parent / Teacher / Admin."""
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    # Permission bit. 1 = can access /edit-profile/<id>, can send
    # fetch-requests, can refund, can upload results.
    default = db.Column(db.Boolean, default=False, index=True)
    permissions = db.Column(db.Integer)

    users = db.relationship("User", backref="role", lazy="dynamic")

    @staticmethod
    def insert_roles():
        roles = {
            "Parent":  None,
            "Teacher": None,
            "Admin":   1,
        }
        for r, perm in roles.items():
            role = Role.query.filter_by(name=r).first()
            if role is None:
                role = Role(name=r, permissions=perm)
                db.session.add(role)
        db.session.commit()


# ─── USER (parents + admin) ──────────────────────────────────────────────
class User(UserMixin, db.Model):
    """A parent account (or the single school admin)."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    grade = db.Column(db.String(20), nullable=True)  # parent's own grade (e.g. "Grade 5")
    admission_number = db.Column(db.String(40), unique=True, index=True)
    username = db.Column(db.String(64), index=True)
    phone = db.Column(db.String(20))  # for M-Pesa prompts

    # Role
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"))

    # Auth
    password_hash = db.Column(db.String(255), nullable=False)
    google_id = db.Column(db.String(64), unique=True, index=True)
    auth_provider = db.Column(db.String(20), default="password")

    # Email verification (admin must approve)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    email_verified_at = db.Column(db.DateTime)

    # Admission record uploads
    birth_certificate = db.Column(db.String(255))
    immunization_card = db.Column(db.String(255))

    # Fees gate (for the parent role)
    fees_cleared = db.Column(db.Boolean, default=False, nullable=False)

    # Account lifecycle
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Children
    students = db.relationship("Student", backref="parent", lazy="dynamic")
    sent_messages = db.relationship("Message", foreign_keys="Message.from_user_id",
                                     backref="from_user", lazy="dynamic")

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def is_administrator(self):
        if self.role is None:
            return False
        return bool(self.role.permissions == 1)

    def __repr__(self):
        return f"<User {self.admission_number} {self.full_name}>"


# ─── STUDENT (the actual learner) ─────────────────────────────────────────
class Student(db.Model):
    """A learner. Has admission_number (DSA352 etc) + 4-digit PIN.

    Linked to a parent User (parent_id). One parent can have multiple
    children (siblings); the parent account ties them together.
    """
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    admission_number = db.Column(db.String(40), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(120), nullable=False)
    grade = db.Column(db.String(20), nullable=False, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    photo_path = db.Column(db.String(255))

    # 4-digit numeric PIN (stored hashed). Parent picks it at setup;
    # student uses it to sign in to the learning portal.
    pin_hash = db.Column(db.String(255), nullable=False)

    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_on_roster = db.Column(db.Boolean, default=True, nullable=False)  # vs manual entry

    # Fees gate
    fees_cleared = db.Column(db.Boolean, default=False, nullable=False)
    fees_balance = db.Column(db.Integer, default=0)  # KES outstanding

    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = db.Column(db.DateTime)

    # Related
    transcripts = db.relationship("Transcript", backref="student",
                                   lazy="dynamic", cascade="all, delete-orphan")

    def set_pin(self, raw_pin: str):
        """Set the 4-digit PIN. Stored as bcrypt hash."""
        if not (isinstance(raw_pin, str) and raw_pin.isdigit() and len(raw_pin) == 4):
            raise ValueError("PIN must be 4 digits")
        self.pin_hash = generate_password_hash(raw_pin)

    def check_pin(self, raw_pin: str) -> bool:
        return check_password_hash(self.pin_hash, raw_pin or "")

    def __repr__(self):
        return f"<Student {self.admission_number} {self.full_name} {self.grade}>"


# ─── TRANSCRIPT (one summative assessment report) ─────────────────────────
class Transcript(db.Model):
    """A single summative assessment report.

    One Transcript = one (student, term, year) record. It contains
    many TranscriptLine rows (one per subject). Previous years'
    transcripts stay forever — that's the audit history the ICT
    lead and parents can browse.
    """
    __tablename__ = "transcripts"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"),
                            nullable=False, index=True)
    term = db.Column(db.String(10), nullable=False)  # "Term 1" | "Term 2" | "Term 3"
    year = db.Column(db.Integer, nullable=False, default=lambda: datetime.utcnow().year)
    grade = db.Column(db.String(20), nullable=False)
    phase = db.Column(db.String(20), nullable=False)  # Pre-Primary / Lower Primary / Junior School

    # Form fields from the MoE report
    learner_name = db.Column(db.String(120), nullable=False)
    assessment_number = db.Column(db.String(40))  # the assessment number on the form
    upi = db.Column(db.String(40))  # UPI number

    # Aggregate numbers (computed when all lines are entered)
    total_marks = db.Column(db.Integer)
    total_out_of = db.Column(db.Integer)
    position = db.Column(db.Integer)
    out_of = db.Column(db.Integer)

    # Performance descriptor
    general_performance = db.Column(db.String(120))  # e.g. "Meeting Expectation"

    # Teacher / head sign-offs
    grade_facilitator_comments = db.Column(db.Text)
    head_signature = db.Column(db.String(120))
    facilitator_signature = db.Column(db.String(120))

    # Dates
    closing_date = db.Column(db.Date)
    next_term_begins = db.Column(db.Date)

    # Status
    is_published = db.Column(db.Boolean, default=False, nullable=False, index=True)
    published_at = db.Column(db.DateTime)

    # Audit
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"))  # the ICT user
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Related
    lines = db.relationship("TranscriptLine", backref="transcript",
                              lazy="dynamic", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Transcript {self.student_id} {self.term} {self.year}>"


# ─── TRANSCRIPT LINE (one subject per transcript) ─────────────────────────
class TranscriptLine(db.Model):
    """One subject row in a Transcript.

    Mirrors the MoE summative assessment form:
        Entry 1 (rubric 1-4) | Mid-Term (rubric 1-4) | End-Term (rubric 1-4)
    Plus a final Performance Level (1-4) + facilitator comment.
    """
    __tablename__ = "transcript_lines"

    id = db.Column(db.Integer, primary_key=True)
    transcript_id = db.Column(db.Integer, db.ForeignKey("transcripts.id"),
                                nullable=False, index=True)
    subject = db.Column(db.String(80), nullable=False)
    order = db.Column(db.Integer, default=0)  # display order in the report

    # Rubric scores 1-4 (None = not yet entered)
    entry_score  = db.Column(db.Integer)  # Entry 1
    mid_score    = db.Column(db.Integer)  # Mid-Term
    end_score    = db.Column(db.Integer)  # End-Term
    performance_level = db.Column(db.Integer)  # 1-4, the final descriptor

    facilitator_comment = db.Column(db.String(255))

    def __repr__(self):
        return f"<TranscriptLine {self.subject} {self.performance_level}>"


# ─── PAYMENT ──────────────────────────────────────────────────────────────
class Payment(db.Model):
    """M-Pesa payment attempt.

    Status:
        pending   → STK push fired, waiting for Daraja
        success   → Daraja callback confirmed the charge
        failed    → Daraja rejected / user cancelled
        manual    → parent paid to the till directly, code submitted
    """
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), index=True)

    purpose = db.Column(db.String(120), nullable=False, default="Term fees")
    amount = db.Column(db.Integer, nullable=False)

    phone = db.Column(db.String(20), nullable=False)
    merchant_request_id = db.Column(db.String(80), index=True)
    checkout_request_id = db.Column(db.String(80), index=True)
    mpesa_receipt = db.Column(db.String(80), index=True)
    manual_code = db.Column(db.String(80))

    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    result_desc = db.Column(db.String(255))

    paybill = db.Column(db.String(20), nullable=False, default="400222")
    account_number = db.Column(db.String(20), nullable=False, default="369369")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("payments", lazy="dynamic"))
    student = db.relationship("Student", backref=db.backref("payments", lazy="dynamic"))

    def mark_succeeded(self, receipt=None, desc=None):
        self.status = "success"
        if receipt:
            self.mpesa_receipt = receipt
        if desc:
            self.result_desc = desc
        self.user.fees_cleared = True
        if self.student:
            self.student.fees_cleared = True
            self.student.fees_balance = 0
        db.session.commit()

    def mark_failed(self, desc=None):
        self.status = "failed"
        if desc:
            self.result_desc = desc
        db.session.commit()


# ─── MESSAGE (parent ↔ admin) ─────────────────────────────────────────────
class Message(db.Model):
    """A support message between a parent and the school admin.

    Parents use this to ask questions they don't want to call the
    office about ("how do I upload birth certificate?"). The admin
    replies from the admin dashboard. Both sides see the thread.
    """
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey("messages.id"), index=True)  # self-FK
    from_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    to_user_id   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    subject = db.Column(db.String(200))
    body = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    replies = db.relationship(
        "Message",
        backref=db.backref("parent_message", remote_side=[id]),
        lazy="dynamic",
    )

    def __repr__(self):
        return f"<Message {self.id} from={self.from_user_id} to={self.to_user_id}>"


# ─── EMAIL VERIFICATION (pending parent signups) ──────────────────────────
class EmailVerification(db.Model):
    """When a new parent signs up, the ICT lead must approve before
    they can use the account. This row tracks that pending state.
    """
    __tablename__ = "email_verifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"),
                          nullable=False, index=True)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    # What the parent was asked to prove
    declared_student_admission = db.Column(db.String(40))  # the student they're linked to
    declared_student_name = db.Column(db.String(120))
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    # pending → approved | rejected
    reviewed_by_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    reviewed_at = db.Column(db.DateTime)
    review_note = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[user_id])
    reviewer = db.relationship("User", foreign_keys=[reviewed_by_id])


# ─── AUDIT LOG ────────────────────────────────────────────────────────────
class AuditLog(db.Model):
    """Who-did-what-when log. Used for security review and the
    "we sent this message to the parent" receipts.
    """
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), index=True)
    action = db.Column(db.String(80), nullable=False, index=True)
    target = db.Column(db.String(120))  # e.g. "Student:DSA352", "Transcript:42"
    detail = db.Column(db.Text)
    ip = db.Column(db.String(45))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


# ─── LOGIN LOADER ────────────────────────────────────────────────────────
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ─── LEGACY ASSESSMENT (continuous assessment) ───────────────────────────
class Assessment(db.Model):
    """Legacy continuous-assessment rows. Kept for the existing
    parent dashboard view. New work should use Transcript/TranscriptLine.
    """
    __tablename__ = "assessments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    term = db.Column(db.String(10), nullable=False)
    year = db.Column(db.Integer, nullable=False, default=lambda: datetime.utcnow().year)
    subject = db.Column(db.String(80), nullable=False)

    strand_communication = db.Column(db.Integer)
    strand_numeracy = db.Column(db.Integer)
    strand_critical_thinking = db.Column(db.Integer)
    strand_creativity = db.Column(db.Integer)

    competency_level = db.Column(db.Integer)
    teacher_remark = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship("User", backref=db.backref("assessments", lazy="dynamic"))
