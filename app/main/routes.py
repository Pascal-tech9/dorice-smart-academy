"""Main public routes: home page with Daily Pulse, calendar, gallery,
staff directory, and the administrator profile editor (used by the
ICT lead to unlock the results portal by flipping `fees_cleared`).
"""
import os

from flask import Blueprint, render_template, redirect, url_for, flash, abort, current_app, request
from flask_login import login_required, current_user

from ..extensions import db
from ..models import User
from ..decorators import admin_required
from .forms import EditProfileAdminForm
from ..admin_portal import audit

main_bp = Blueprint("main", __name__)


# Staff directory — photos filled in as they arrive from the school.
# If a photo file is missing on disk, the template shows a generic
# silhouette so the page never looks broken.
STAFF = [
    {
        "name": "Mrs. D. A. Chapia",
        "role": "School Director & ICT Lead",
        "photo": "img/staff/director.jpg",
        "bio": "Runs the school office and the digital portal. Approves parent signups, manages student records, fees, and publishes CBC reports.",
    },
    {
        "name": "Headteacher",
        "role": "Headteacher",
        "photo": "img/staff-headteacher.jpg",
        "bio": "Day-to-day running of the school and head of the teaching staff.",
    },
    {
        "name": "Deputy Headteacher",
        "role": "Deputy Headteacher",
        "photo": "img/staff-deputy.jpg",
        "bio": "Supports the headteacher across academic and pastoral matters.",
    },
    {
        "name": "Junior Secondary Lead",
        "role": "Junior Secondary (Gr 7–9)",
        "photo": "img/staff-junior-secondary.jpg",
        "bio": "Leads the Gr 7–9 pathway, including Computer Studies and pre-technical subjects.",
    },
    {
        "name": "Lead Class Teacher",
        "role": "Lower Primary",
        "photo": "img/staff-lower-primary.jpg",
        "bio": "Anchors the Gr 1–3 classroom team.",
    },
]


def _staff_with_photo_flags(staff_list):
    """Annotate each staff row with `has_photo` so the template can
    swap in a silhouette placeholder when the file is missing."""
    img_dir = os.path.join(current_app.root_path, "static")
    for row in staff_list:
        row["has_photo"] = os.path.isfile(os.path.join(img_dir, row["photo"]))
    return staff_list


@main_bp.route("/")
def index():
    return render_template(
        "index.html",
        page_title="Home",
        # Daily Pulse data — gate hours + routine
        gate_open="07:00",
        gate_close="16:30",
        routine=[
            {"time": "07:00", "label": "Gates open"},
            {"time": "07:40", "label": "Assembly"},
            {"time": "08:00", "label": "Lessons begin"},
            {"time": "12:40", "label": "Lunch break"},
            {"time": "15:30", "label": "Games & clubs"},
            {"time": "16:30", "label": "Gates close"},
        ],
        # 2026 School Calendar (CBC-aligned)
        calendar_2026=[
            {"term": "Term 1", "window": "January – April",  "opens": "05 Jan 2026", "closes": "10 Apr 2026"},
            {"term": "Term 2", "window": "May – August",     "opens": "04 May 2026", "closes": "07 Aug 2026"},
            {"term": "Term 3", "window": "September – Nov",  "opens": "01 Sep 2026", "closes": "20 Nov 2026"},
        ],
        # 6-image gallery (the spec's required filenames)
        gallery_images=[f"img/gallery-{i}.jpg" for i in range(1, 7)],
        # extra gallery shots that already exist on disk (7-9)
        extra_gallery_images=[f"img/gallery-{i}.jpg" for i in range(7, 10)],
    )


@main_bp.route("/admin-profile")
def admin_profile():
    """Public profile of the school's ICT admin (Mrs. D. A. Chapia).
    Anyone can view this — no login required. It explains what the
    admin does and provides the Excel template for bulk student updates.
    """
    return render_template(
        "main/admin_profile.html",
        page_title="ICT Administrator",
    )


@main_bp.route("/account/change-password", methods=["GET", "POST"])
@login_required
def change_password():
    """Let any logged-in user (parent, admin, student) change their
    own password. The current password is required, the new one must
    be entered twice. Used by the admin to swap the default
    Onekenya2030 password for a strong production password after
    first deploy.
    """
    if request.method == "POST":
        current = request.form.get("current_password", "")
        new = request.form.get("new_password", "")
        confirm = request.form.get("confirm_password", "")
        if not current_user.check_password(current):
            flash("Current password is incorrect.", "danger")
        elif len(new) < 8:
            flash("New password must be at least 8 characters.", "warning")
        elif new != confirm:
            flash("New password and confirmation don't match.", "warning")
        else:
            current_user.set_password(new)
            db.session.commit()
            audit("password_changed", target=f"User:{current_user.id}")
            flash("Password updated. Sign in again next time.", "success")
            return redirect(url_for("main.change_password"))
    return render_template("main/change_password.html", page_title="Change password")


@main_bp.route("/staff")
def staff():
    return render_template(
        "staff.html",
        page_title="Our Staff",
        staff=_staff_with_photo_flags(STAFF),
    )


@main_bp.route("/user/<username>")
@login_required
def user_profile(username):
    """Public-facing profile page for a learner.

    The admin-only "Edit Profile" button is rendered conditionally by
    the template when `current_user.is_administrator()` is true.
    """
    user = User.query.filter_by(username=username).first_or_404()
    return render_template("user.html", page_title=user.full_name, user=user)


@main_bp.route("/edit-profile/<int:id>", methods=["GET", "POST"])
@login_required
@admin_required
def edit_profile_admin(id):
    """Admin-only profile editor. Used by the ICT lead to flip
    `fees_cleared` and unlock the results portal for a learner.
    """
    user = User.query.get_or_404(id)
    form = EditProfileAdminForm(user=user)

    if form.validate_on_submit():
        user.email = form.email.data
        user.username = form.username.data
        user.grade = form.grade.data or user.grade
        user.fees_cleared = form.fees_cleared.data
        user.role_id = form.role.data
        db.session.add(user)
        db.session.commit()
        flash("The student record has been updated successfully.", "success")
        return redirect(url_for("main.user_profile", username=user.username))

    # Pre-populate the form with current database values
    form.email.data = user.email
    form.username.data = user.username
    form.grade.data = user.grade
    form.fees_cleared.data = user.fees_cleared
    form.role.data = user.role_id

    return render_template("edit_profile.html", form=form, user=user)

