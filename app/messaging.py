"""Parent ↔ Admin support messaging.

Parents and the school admin (ICT lead) exchange messages here.
Think of it as a simple help-desk: a parent who doesn't understand
how to pay via M-Pesa can ask; the admin replies from the dashboard.
"""
from datetime import datetime
from flask import (
    Blueprint, render_template, redirect, url_for, flash, request, abort, current_app,
)
from flask_login import login_required, current_user

from .extensions import db
from .models import Message, User
from .security import audit, require_ict_email

messaging_bp = Blueprint("messaging", __name__)


@messaging_bp.route("/messages", methods=["GET"])
@login_required
def inbox():
    """Show all threads I'm part of."""
    # All messages where I'm sender OR recipient, grouped by thread
    mine = (Message.query
            .filter((Message.from_user_id == current_user.id) |
                    (Message.to_user_id == current_user.id))
            .order_by(Message.created_at.desc())
            .all())
    # Build threads: top-level messages (thread_id is None)
    threads = [m for m in mine if m.thread_id is None]
    # Mark unread ones for me
    for t in threads:
        t._unread = (t.to_user_id == current_user.id and not t.is_read)
    return render_template("messaging/inbox.html", threads=threads)


@messaging_bp.route("/messages/new", methods=["GET", "POST"])
@login_required
def new_thread():
    """Start a new thread with the school admin."""
    if request.method == "POST":
        subject = (request.form.get("subject") or "").strip()[:200]
        body    = (request.form.get("body") or "").strip()
        if not subject or not body:
            flash("Subject and message are required.", "warning")
            return render_template("messaging/new.html")
        # Find the admin (ICT lead) — try school email first, then any admin role
        admin_email = current_app.config.get(
            "SCHOOL_ADMIN_EMAIL", "doricesmartprimaryschool89@gmail.com"
        )
        admin = User.query.filter_by(email=admin_email).first()
        if not admin:
            # Fallback: any user with admin permission
            from .models import Role
            admin_role = Role.query.filter_by(permissions=1).first()
            if admin_role:
                admin = User.query.filter_by(role_id=admin_role.id).first()
        if not admin:
            flash("Could not find the school admin. Please call the office.", "danger")
            return redirect(url_for("main.index"))
        msg = Message(
            from_user_id=current_user.id,
            to_user_id=admin.id,
            subject=subject,
            body=body,
        )
        db.session.add(msg)
        db.session.commit()
        audit("message_sent", target=f"Message:{msg.id}",
              detail=f"To admin, subject: {subject}")
        flash("Message sent. The school office will reply shortly.", "success")
        return redirect(url_for("messaging.thread", message_id=msg.id))

    return render_template("messaging/new.html")


@messaging_bp.route("/messages/<int:message_id>", methods=["GET", "POST"])
@login_required
def thread(message_id):
    """View a thread and post a reply."""
    parent_msg = Message.query.get_or_404(message_id)
    # Only participants can read
    if current_user.id not in (parent_msg.from_user_id, parent_msg.to_user_id):
        abort(403)
    # Mark as read
    if parent_msg.to_user_id == current_user.id and not parent_msg.is_read:
        parent_msg.is_read = True
        db.session.commit()
    # Get replies
    replies = (Message.query
               .filter((Message.thread_id == message_id) |
                       (Message.id == message_id))
               .order_by(Message.created_at.asc())
               .all())

    if request.method == "POST":
        body = (request.form.get("body") or "").strip()
        if not body:
            flash("Type a message first.", "warning")
            return render_template("messaging/thread.html", parent=parent_msg, replies=replies)
        # Reply goes to the OTHER person
        other_id = (parent_msg.to_user_id
                    if current_user.id == parent_msg.from_user_id
                    else parent_msg.from_user_id)
        reply = Message(
            thread_id=parent_msg.id,
            from_user_id=current_user.id,
            to_user_id=other_id,
            subject="Re: " + (parent_msg.subject or ""),
            body=body,
        )
        db.session.add(reply)
        db.session.commit()
        audit("message_replied", target=f"Message:{reply.id}")
        flash("Reply sent.", "success")
        return redirect(url_for("messaging.thread", message_id=parent_msg.id))

    return render_template("messaging/thread.html", parent=parent_msg, replies=replies)


@messaging_bp.route("/admin/messages", methods=["GET"])
@login_required
@require_ict_email
def admin_inbox():
    """ICT-only: view all incoming parent messages."""
    threads = (Message.query
               .filter(Message.thread_id.is_(None))
               .order_by(Message.created_at.desc())
               .all())
    return render_template("messaging/admin_inbox.html", threads=threads)
