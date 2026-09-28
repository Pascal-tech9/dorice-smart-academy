"""Admin (ICT) portal — Excel I/O, transcript management, student
clearing, fee updates, email verification approvals.

All routes here are gated by @require_ict_email (the strictest gate).
Only Doricesmartprimaryschool89@gmail.com can pass.
"""
import io
import os
import csv
import secrets
from datetime import datetime, date

from flask import (
    Blueprint, render_template, redirect, url_for, flash, request,
    send_file, abort, current_app, jsonify,
)
from flask_login import login_required, current_user
from sqlalchemy import or_

from .extensions import db
from .models import (
    User, Student, Transcript, TranscriptLine, Message,
    EmailVerification, Payment, AuditLog,
)
from .student_roster import (
    STUDENT_ROSTER, ALL_GRADES, phase_for_grade, subjects_for_grade,
    is_known_student, get_grade_for, get_name_for,
)
from .security import (
    audit, validate_upload, require_ict_email, MAX_UPLOAD_SIZES,
)


admin_bp = Blueprint("admin", __name__)


# ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────
@admin_bp.route("/admin")
@login_required
@require_ict_email
def dashboard():
    stats = {
        "total_students":  Student.query.count(),
        "active_students": Student.query.filter_by(is_active=True).count(),
        "total_parents":   User.query.filter_by(role_id=1).count(),
        "verified_parents": User.query.filter_by(email_verified=True).count(),
        "pending_approvals": EmailVerification.query.filter_by(status="pending").count(),
        "unread_messages":  Message.query.filter_by(to_user_id=current_user.id, is_read=False).count(),
        "published_transcripts": Transcript.query.filter_by(is_published=True).count(),
        "draft_transcripts": Transcript.query.filter_by(is_published=False).count(),
    }
    return render_template("admin/dashboard.html", stats=stats)


# ─── EMAIL VERIFICATION APPROVALS ───────────────────────────────────────
@admin_bp.route("/admin/verifications", methods=["GET"])
@login_required
@require_ict_email
def verifications():
    pending = (EmailVerification.query
               .filter_by(status="pending")
               .order_by(EmailVerification.created_at.asc())
               .all())
    return render_template("admin/verifications.html", pending=pending)


@admin_bp.route("/admin/verifications/<int:vid>/approve", methods=["POST"])
@login_required
@require_ict_email
def verify_approve(vid):
    v = EmailVerification.query.get_or_404(vid)
    v.status = "approved"
    v.reviewed_by_id = current_user.id
    v.reviewed_at = datetime.utcnow()
    v.review_note = request.form.get("note", "")
    v.user.email_verified = True
    v.user.email_verified_at = datetime.utcnow()
    # If a student was claimed, link them
    if v.declared_student_admission:
        s = Student.query.filter_by(admission_number=v.declared_student_admission).first()
        if s and s.parent_id is None:
            s.parent_id = v.user_id
    db.session.commit()
    audit("verify_approve", target=f"User:{v.user_id}", detail=v.user.email)
    flash(f"Approved {v.user.email}. They can now sign in.", "success")
    return redirect(url_for("admin.verifications"))


@admin_bp.route("/admin/verifications/<int:vid>/reject", methods=["POST"])
@login_required
@require_ict_email
def verify_reject(vid):
    v = EmailVerification.query.get_or_404(vid)
    v.status = "rejected"
    v.reviewed_by_id = current_user.id
    v.reviewed_at = datetime.utcnow()
    v.review_note = request.form.get("note", "")
    db.session.commit()
    audit("verify_reject", target=f"User:{v.user_id}", detail=v.user.email)
    flash(f"Rejected {v.user.email}.", "info")
    return redirect(url_for("admin.verifications"))


# ─── STUDENT MANAGEMENT ─────────────────────────────────────────────────
@admin_bp.route("/admin/students", methods=["GET"])
@login_required
@require_ict_email
def students():
    grade = request.args.get("grade", "")
    q = request.args.get("q", "").strip()
    query = Student.query
    if grade:
        query = query.filter_by(grade=grade)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            Student.full_name.ilike(like),
            Student.admission_number.ilike(like),
        ))
    students = query.order_by(Student.grade, Student.admission_number).all()
    return render_template("admin/students.html",
                          students=students, grade=grade, q=q, all_grades=ALL_GRADES)


# ─── ADD NEW STUDENT ───────────────────────────────────────────────────
@admin_bp.route("/admin/students/new", methods=["GET", "POST"])
@login_required
@require_ict_email
def student_new():
    if request.method == "POST":
        adm = (request.form.get("admission_number") or "").strip().upper()
        name = (request.form.get("full_name") or "").strip()
        grade = (request.form.get("grade") or "").strip()
        fees_cleared = request.form.get("fees_cleared") == "y"
        try:
            fees_balance = int(request.form.get("fees_balance") or 0)
        except (TypeError, ValueError):
            fees_balance = 0
        pin = (request.form.get("pin") or "1234").strip()

        if not adm or not name or not grade:
            flash("Admission number, name, and grade are required.", "danger")
            return render_template("admin/student_new.html", all_grades=ALL_GRADES,
                                  form_adm=adm, form_name=name, form_grade=grade)

        if Student.query.filter_by(admission_number=adm).first():
            flash(f"Admission number {adm} already exists.", "danger")
            return render_template("admin/student_new.html", all_grades=ALL_GRADES,
                                  form_adm=adm, form_name=name, form_grade=grade)

        if not (pin.isdigit() and len(pin) == 4):
            flash("PIN must be exactly 4 digits.", "danger")
            return render_template("admin/student_new.html", all_grades=ALL_GRADES,
                                  form_adm=adm, form_name=name, form_grade=grade)

        s = Student(
            admission_number=adm,
            full_name=name,
            grade=grade,
            fees_cleared=fees_cleared,
            fees_balance=fees_balance,
            is_on_roster=False,  # manually entered (not from the official roster)
        )
        s.set_pin(pin)
        db.session.add(s)
        db.session.commit()
        audit("student_created", target=f"Student:{s.admission_number}",
              detail=f"{s.full_name} ({s.grade})")
        flash(f"Created {s.full_name} ({adm}).", "success")
        return redirect(url_for("admin.student_edit", sid=s.id))

    return render_template("admin/student_new.html", all_grades=ALL_GRADES,
                          form_adm="", form_name="", form_grade="")


# ─── EDIT STUDENT ──────────────────────────────────────────────────────
@admin_bp.route("/admin/students/<int:sid>/edit", methods=["GET", "POST"])
@login_required
@require_ict_email
def student_edit(sid):
    s = Student.query.get_or_404(sid)
    if request.method == "POST":
        s.full_name = (request.form.get("full_name") or s.full_name).strip()
        s.grade = (request.form.get("grade") or s.grade).strip()
        try:
            s.fees_balance = int(request.form.get("fees_balance") or 0)
        except (TypeError, ValueError):
            s.fees_balance = s.fees_balance or 0
        s.fees_cleared = s.fees_balance == 0
        s.is_active = request.form.get("is_active") == "y"
        if s.parent:
            s.parent.fees_cleared = s.fees_cleared
        db.session.commit()
        audit("student_updated", target=f"Student:{s.admission_number}")
        flash(f"Updated {s.full_name}.", "success")
        return redirect(url_for("admin.student_edit", sid=s.id))

    return render_template("admin/student_edit.html", s=s)


# ─── UPLOAD / DELETE STUDENT PHOTO ────────────────────────────────────
@admin_bp.route("/admin/students/<int:sid>/photo", methods=["POST"])
@login_required
@require_ict_email
def student_photo_upload(sid):
    s = Student.query.get_or_404(sid)
    file = request.files.get("photo")
    if not file or not file.filename:
        flash("No file selected.", "warning")
        return redirect(url_for("admin.student_edit", sid=s.id))
    ok, safe, reason = validate_upload(file, "student_photo")
    if not ok:
        flash(f"Photo rejected: {reason}", "danger")
        return redirect(url_for("admin.student_edit", sid=s.id))
    # Save to static/student_photos/
    from flask import current_app
    photo_dir = os.path.join(current_app.root_path, "static", "img", "students")
    os.makedirs(photo_dir, exist_ok=True)
    from uuid import uuid4
    unique = f"{uuid4().hex}_{safe}"
    dest = os.path.join(photo_dir, unique)
    file.save(dest)
    # Delete old photo if exists
    if s.photo_path:
        old = os.path.join(current_app.root_path, "static", s.photo_path)
        if os.path.isfile(old):
            try:
                os.remove(old)
            except OSError:
                pass
    s.photo_path = f"img/students/{unique}"
    db.session.commit()
    audit("student_photo_uploaded", target=f"Student:{s.admission_number}")
    flash(f"Photo updated for {s.full_name}.", "success")
    return redirect(url_for("admin.student_edit", sid=s.id))


@admin_bp.route("/admin/students/<int:sid>/photo/delete", methods=["POST"])
@login_required
@require_ict_email
def student_photo_delete(sid):
    s = Student.query.get_or_404(sid)
    if s.photo_path:
        from flask import current_app
        old = os.path.join(current_app.root_path, "static", s.photo_path)
        if os.path.isfile(old):
            try:
                os.remove(old)
            except OSError:
                pass
        s.photo_path = None
        db.session.commit()
        audit("student_photo_deleted", target=f"Student:{s.admission_number}")
        flash(f"Photo removed for {s.full_name}.", "info")
    return redirect(url_for("admin.student_edit", sid=s.id))


@admin_bp.route("/admin/students/<int:sid>/clear-fees", methods=["POST"])
@login_required
@require_ict_email
def student_clear_fees(sid):
    s = Student.query.get_or_404(sid)
    s.fees_cleared = True
    s.fees_balance = 0
    # Also clear the linked parent's gate
    if s.parent:
        s.parent.fees_cleared = True
    db.session.commit()
    audit("fees_cleared", target=f"Student:{s.admission_number}")
    flash(f"Cleared fees for {s.full_name} ({s.admission_number}).", "success")
    return redirect(request.referrer or url_for("admin.students"))


@admin_bp.route("/admin/students/<int:sid>/reset-pin", methods=["POST"])
@login_required
@require_ict_email
def student_reset_pin(sid):
    s = Student.query.get_or_404(sid)
    new_pin = request.form.get("new_pin", "").strip()
    if not (new_pin.isdigit() and len(new_pin) == 4):
        flash("PIN must be exactly 4 digits.", "danger")
        return redirect(request.referrer or url_for("admin.students"))
    s.set_pin(new_pin)
    db.session.commit()
    audit("student_pin_reset", target=f"Student:{s.admission_number}")
    flash(f"PIN reset for {s.full_name}.", "success")
    return redirect(request.referrer or url_for("admin.students"))


@admin_bp.route("/admin/students/<int:sid>/update-fees", methods=["POST"])
@login_required
@require_ict_email
def student_update_fees(sid):
    s = Student.query.get_or_404(sid)
    amount = int(request.form.get("amount", "0"))
    s.fees_balance = amount
    s.fees_cleared = (amount == 0)
    if s.parent:
        s.parent.fees_cleared = (amount == 0)
    db.session.commit()
    audit("fees_updated", target=f"Student:{s.admission_number}",
          detail=f"Balance now KES {amount}")
    flash(f"Updated {s.full_name}'s fees to KES {amount}.", "success")
    return redirect(request.referrer or url_for("admin.students"))


# ─── EXCEL IMPORT / EXPORT ──────────────────────────────────────────────
@admin_bp.route("/admin/excel", methods=["GET"])
@login_required
@require_ict_email
def excel_io():
    return render_template("admin/excel_io.html")


@admin_bp.route("/admin/excel/students/export", methods=["GET"])
@login_required
@require_ict_email
def excel_export_students():
    """Export all students as a single-sheet xlsx workbook."""
    try:
        from openpyxl import Workbook
    except ImportError:
        flash("openpyxl not installed.", "danger")
        return redirect(url_for("admin.excel_io"))
    wb = Workbook()
    ws = wb.active
    ws.title = "Students"
    ws.append(["admission_number", "full_name", "grade", "fees_cleared",
                "fees_balance", "parent_email", "is_active"])
    for s in Student.query.order_by(Student.grade, Student.admission_number).all():
        ws.append([
            s.admission_number, s.full_name, s.grade,
            "yes" if s.fees_cleared else "no",
            s.fees_balance or 0,
            s.parent.email if s.parent else "",
            "yes" if s.is_active else "no",
        ])
    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)
    audit("excel_export", target="students")
    return send_file(
        bio,
        as_attachment=True,
        download_name=f"dorice-students-{date.today().isoformat()}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@admin_bp.route("/admin/excel/students/import", methods=["POST"])
@login_required
@require_ict_email
def excel_import_students():
    """Import students from xlsx/xls/csv.

    Expected columns (header row):
        admission_number, full_name, grade, fees_cleared (yes/no),
        fees_balance (int), is_active (yes/no)

    Rows update existing students (matched on admission_number) or
    create new ones. A dry-run mode (dry_run=1) reports what would
    change without committing.
    """
    file = request.files.get("file")
    dry_run = request.form.get("dry_run") == "1"
    ok, safe_name, reason = validate_upload(file, "bulk_excel")
    if not ok:
        flash(f"Upload rejected: {reason}", "danger")
        return redirect(url_for("admin.excel_io"))

    try:
        from openpyxl import load_workbook
    except ImportError:
        flash("openpyxl not installed.", "danger")
        return redirect(url_for("admin.excel_io"))

    rows_added = rows_updated = rows_skipped = errors = 0
    messages = []

    try:
        wb = load_workbook(filename=io.BytesIO(file.read()), data_only=True, read_only=True)
    except Exception as e:
        flash(f"Could not parse file: {e}", "danger")
        return redirect(url_for("admin.excel_io"))
    ws = wb.active
    headers = [str(c.value or "").strip().lower() for c in next(ws.iter_rows(min_row=1, max_row=1))]

    if "admission_number" not in headers or "full_name" not in headers or "grade" not in headers:
        flash("File must have at least admission_number, full_name, grade columns.", "danger")
        return redirect(url_for("admin.excel_io"))

    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r or not r[0]:
            continue
        row = dict(zip(headers, r))
        adm  = str(row.get("admission_number") or "").strip().upper()
        name = str(row.get("full_name") or "").strip()
        grd  = str(row.get("grade") or "").strip()
        if not adm or not name or not grd:
            errors += 1
            messages.append(f"Row skipped — missing data: {adm} {name}")
            continue
        fees_cleared = str(row.get("fees_cleared") or "no").lower() in ("yes", "true", "1", "y")
        try:
            fees_balance = int(row.get("fees_balance") or 0)
        except (TypeError, ValueError):
            fees_balance = 0
        is_active = str(row.get("is_active") or "yes").lower() in ("yes", "true", "1", "y")

        s = Student.query.filter_by(admission_number=adm).first()
        if s:
            s.full_name = name
            s.grade = grd
            s.fees_cleared = fees_cleared
            s.fees_balance = fees_balance
            s.is_active = is_active
            rows_updated += 1
        else:
            s = Student(
                admission_number=adm, full_name=name, grade=grd,
                fees_cleared=fees_cleared, fees_balance=fees_balance,
                is_active=is_active, is_on_roster=False,  # manually imported
            )
            s.set_pin("1234")
            db.session.add(s)
            rows_added += 1

    if dry_run:
        db.session.rollback()
        flash(f"DRY RUN: would add {rows_added}, update {rows_updated}, "
              f"skip {rows_skipped}, errors {errors}. No changes saved.", "info")
    else:
        db.session.commit()
        audit("excel_import", target="students",
              detail=f"Added {rows_added}, updated {rows_updated}, errors {errors}")
        flash(f"Imported: +{rows_added} new, ~{rows_updated} updated, "
              f"{errors} errors.", "success")
    return redirect(url_for("admin.excel_io"))


@admin_bp.route("/admin/excel/transcripts/export", methods=["GET"])
@login_required
@require_ict_email
def excel_export_transcripts():
    """Export all published transcripts as xlsx (one sheet per term)."""
    try:
        from openpyxl import Workbook
    except ImportError:
        flash("openpyxl not installed.", "danger")
        return redirect(url_for("admin.excel_io"))
    wb = Workbook()
    wb.remove(wb.active)
    transcripts = Transcript.query.order_by(Transcript.year.desc(),
                                              Transcript.term,
                                              Transcript.grade).all()
    for t in transcripts:
        sheet_name = f"{t.grade}-{t.term}-{t.year}"[:31]
        ws = wb.create_sheet(sheet_name)
        ws.append(["Subject", "Entry 1", "Mid-Term", "End-Term",
                    "Performance Level", "Comment"])
        for line in t.lines.order_by(TranscriptLine.order).all():
            ws.append([line.subject, line.entry_score, line.mid_score,
                        line.end_score, line.performance_level, line.facilitator_comment or ""])
    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)
    audit("excel_export", target="transcripts")
    return send_file(
        bio,
        as_attachment=True,
        download_name=f"dorice-transcripts-{date.today().isoformat()}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ─── TRANSCRIPT MANAGEMENT ──────────────────────────────────────────────
@admin_bp.route("/admin/transcripts", methods=["GET"])
@login_required
@require_ict_email
def transcripts():
    transcripts = (Transcript.query
                    .order_by(Transcript.year.desc(),
                              Transcript.term,
                              Transcript.grade)
                    .all())
    return render_template("admin/transcripts.html", transcripts=transcripts)


@admin_bp.route("/admin/transcripts/new", methods=["GET", "POST"])
@login_required
@require_ict_email
def transcript_new():
    """Create a new transcript for a student."""
    if request.method == "POST":
        student_id = request.form.get("student_id", type=int)
        term = request.form.get("term", "").strip()
        year = request.form.get("year", type=int, default=datetime.utcnow().year)
        learner_name = request.form.get("learner_name", "").strip()
        assessment_number = request.form.get("assessment_number", "").strip()
        upi = request.form.get("upi", "").strip()
        closing_date = request.form.get("closing_date") or None
        next_term_begins = request.form.get("next_term_begins") or None
        general_performance = request.form.get("general_performance", "").strip()
        comments = request.form.get("comments", "").strip()
        head_sig = request.form.get("head_signature", "Headteacher").strip()
        fac_sig = request.form.get("facilitator_signature", "").strip()

        student = Student.query.get_or_404(student_id)
        t = Transcript(
            student_id=student.id,
            term=term, year=year, grade=student.grade,
            phase=phase_for_grade(student.grade),
            learner_name=learner_name or student.full_name,
            assessment_number=assessment_number,
            upi=upi,
            grade_facilitator_comments=comments,
            general_performance=general_performance,
            head_signature=head_sig,
            facilitator_signature=fac_sig,
            closing_date=datetime.strptime(closing_date, "%Y-%m-%d").date() if closing_date else None,
            next_term_begins=datetime.strptime(next_term_begins, "%Y-%m-%d").date() if next_term_begins else None,
            created_by_id=current_user.id,
        )
        db.session.add(t)
        db.session.commit()

        # Add subject lines
        for idx, subj in enumerate(subjects_for_grade(student.grade)):
            entry  = request.form.get(f"score_{idx}_entry", type=int)
            mid    = request.form.get(f"score_{idx}_mid", type=int)
            end    = request.form.get(f"score_{idx}_end", type=int)
            perf   = request.form.get(f"score_{idx}_perf", type=int)
            cmt    = request.form.get(f"comment_{idx}", "").strip()
            db.session.add(TranscriptLine(
                transcript_id=t.id, subject=subj, order=idx,
                entry_score=entry, mid_score=mid, end_score=end,
                performance_level=perf, facilitator_comment=cmt,
            ))
        db.session.commit()
        audit("transcript_created", target=f"Transcript:{t.id}",
              detail=f"Student:{student.admission_number} {term} {year}")
        flash(f"Transcript created for {student.full_name}.", "success")
        return redirect(url_for("admin.transcripts"))

    students = Student.query.order_by(Student.grade, Student.admission_number).all()
    return render_template("admin/transcript_new.html",
                          students=students, all_grades=ALL_GRADES,
                          subjects_per_grade=subjects_for_grade)


@admin_bp.route("/admin/transcripts/<int:tid>/publish", methods=["POST"])
@login_required
@require_ict_email
def transcript_publish(tid):
    t = Transcript.query.get_or_404(tid)
    t.is_published = True
    t.published_at = datetime.utcnow()
    db.session.commit()
    audit("transcript_published", target=f"Transcript:{t.id}")
    flash("Transcript published — parents and students can now see it.", "success")
    return redirect(url_for("admin.transcripts"))


# ─── PER-SUBJECT SCORE EDIT ─────────────────────────────────────────────
# GET  /admin/transcripts/<tid>/lines.json   — return all lines for a transcript
# POST /admin/transcripts/<tid>/lines/<id>   — update one field on one line
# Used by the per-subject editor in admin/transcripts.html — the admin
# types a new score 1–4 (or a comment) in a single cell and presses
# Enter; only that one line updates, the rest of the transcript stays.
@admin_bp.route("/admin/transcripts/<int:tid>/lines.json", methods=["GET"])
@login_required
@require_ict_email
def transcript_lines_json(tid):
    t = Transcript.query.get_or_404(tid)
    lines = [{
        "id": l.id,
        "subject": l.subject,
        "order": l.order,
        "entry_score": l.entry_score,
        "mid_score": l.mid_score,
        "end_score": l.end_score,
        "performance_level": l.performance_level,
        "facilitator_comment": l.facilitator_comment,
    } for l in sorted(t.lines, key=lambda x: (x.order or 0, x.subject or ""))]
    return jsonify(ok=True, transcript_id=t.id, lines=lines)


@admin_bp.route("/admin/transcripts/<int:tid>/lines/<int:line_id>",
                 methods=["POST"])
@login_required
@require_ict_email
def transcript_line_update(tid, line_id):
    t = Transcript.query.get_or_404(tid)
    line = TranscriptLine.query.filter_by(id=line_id, transcript_id=t.id).first_or_404()
    data = request.get_json(silent=True) or {}
    field = data.get("field")
    if field not in {"entry_score", "mid_score", "end_score", "facilitator_comment"}:
        return jsonify(ok=False, error="Invalid field"), 400
    if field == "facilitator_comment":
        line.facilitator_comment = (data.get("value") or "").strip()[:255]
    else:
        try:
            v = int(data.get("value"))
        except (TypeError, ValueError):
            return jsonify(ok=False, error="Score must be an integer"), 400
        if v < 1 or v > 4:
            return jsonify(ok=False, error="Score must be 1–4"), 400
        setattr(line, field, v)
    t.updated_at = datetime.utcnow()
    db.session.commit()
    audit("transcript_line_updated",
          target=f"TranscriptLine:{line.id}",
          detail=f"{t.student.admission_number} {t.term} {t.year} {line.subject} {field}={data.get('value')}")
    return jsonify(ok=True, line_id=line.id, field=field,
                    value=getattr(line, field))


# ─── INLINE FEE BALANCE UPDATE ──────────────────────────────────────────
# PATCH /admin/students/<sid>/fees
# The admin clicks the ✎ button next to a roster row, types a new
# balance, and presses Enter. Only that one student's fee record is
# touched. If the new balance is 0 we also auto-clear fees.
@admin_bp.route("/admin/students/<int:sid>/fees",
                 methods=["POST"])
@login_required
@require_ict_email
def student_fees_update(sid):
    student = Student.query.get_or_404(sid)
    data = request.get_json(silent=True) or {}
    try:
        new_balance = float(data.get("fees_balance", 0))
    except (TypeError, ValueError):
        return jsonify(ok=False, error="Invalid amount"), 400
    if new_balance < 0:
        return jsonify(ok=False, error="Balance can't be negative"), 400
    student.fees_balance = new_balance
    student.fees_cleared = (new_balance == 0)
    db.session.commit()
    # Also flip the linked parent's fees_cleared so the gate works
    if student.parent_id:
        parent = User.query.get(student.parent_id)
        if parent:
            parent.fees_cleared = student.fees_cleared
            db.session.commit()
    audit("fees_updated", target=f"Student:{student.id}",
          detail=f"{student.admission_number} balance=KES {new_balance} cleared={student.fees_cleared}")
    return jsonify(ok=True, student_id=student.id,
                    fees_balance=student.fees_balance,
                    fees_cleared=student.fees_cleared)


# ─── DATABASE STATS (read-only summary for the admin) ──────────────────
# Shows row counts per table, the active DB engine, and last backup hint.
# No mutations — safe to bookmark.
@admin_bp.route("/admin/database", methods=["GET"])
@login_required
@require_ict_email
def database_stats():
    from sqlalchemy import inspect, text
    tables = {}
    inspector = inspect(db.engine)
    for name in inspector.get_table_names():
        try:
            n = db.session.execute(text(f'SELECT COUNT(*) FROM "{name}"')).scalar()
        except Exception:
            n = "?"
        tables[name] = n
    engine_kind = db.engine.dialect.name  # "postgresql" | "sqlite" | "mysql"
    is_postgres = engine_kind == "postgresql"
    return render_template(
        "admin/database.html",
        tables=tables,
        engine_kind=engine_kind,
        is_postgres=is_postgres,
        page_title="Database",
    )


# ─── DATABASE BACKUP (Postgres only — uses pg_dump via subprocess) ──────
# Returns a .sql.gz file with a full schema + data dump. The admin can
# store it off-platform for disaster recovery.
@admin_bp.route("/admin/database/backup", methods=["GET"])
@login_required
@require_ict_email
def database_backup():
    import gzip, io, subprocess, shutil
    from datetime import datetime
    from flask import send_file, current_app, abort
    if db.engine.dialect.name != "postgresql":
        abort(400, "Backup is only supported on PostgreSQL. "
                   "For SQLite, just copy instance/dorice.db.")
    # Render sets DATABASE_URL=postgres://... — pg_dump needs that
    url = os.environ.get("DATABASE_URL", "")
    if not url.startswith(("postgres://", "postgresql://")):
        abort(500, "DATABASE_URL is not set to a Postgres URL")
    if not shutil.which("pg_dump"):
        abort(500, "pg_dump is not installed on the server. "
                   "Add 'postgresql-client' to render.yaml buildCommand.")
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    filename = f"dorice-backup-{timestamp}.sql.gz"
    # pg_dump emits SQL to stdout; gzip it on the fly
    proc = subprocess.Popen(
        ["pg_dump", url],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    sql, err = proc.communicate(timeout=60)
    if proc.returncode != 0:
        current_app.logger.error(f"pg_dump failed: {err.decode('utf-8', 'replace')}")
        abort(500, f"pg_dump failed: {err.decode('utf-8', 'replace')[:200]}")
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb") as gz:
        gz.write(sql)
    buf.seek(0)
    audit("database_backup", target="postgres", detail=f"{len(tables := db.session.execute(db.text('SELECT 1')).scalar() or 0)} bytes")
    return send_file(buf, mimetype="application/gzip", as_attachment=True,
                     download_name=filename)


# ─── AUDIT LOG VIEW ─────────────────────────────────────────────────────
@admin_bp.route("/admin/audit", methods=["GET"])
@login_required
@require_ict_email
def audit_log():
    logs = (AuditLog.query
             .order_by(AuditLog.created_at.desc())
             .limit(200).all())
    return render_template("admin/audit.html", logs=logs)
