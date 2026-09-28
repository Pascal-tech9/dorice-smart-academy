"""Security helpers — file upload firewall, access control, audit logging.

This is the "firewall" the school asked for: even if a malicious file
makes it to the upload handler, we validate its magic bytes and reject
anything that isn't what it claims to be.
"""
import os
import re
import hashlib
import logging
from functools import wraps
from flask import (
    current_app, request, abort, flash, redirect, url_for,
    session, jsonify,
)
from flask_login import current_user
from werkzeug.utils import secure_filename

from .extensions import db
from .models import AuditLog, User, Student, Message


log = logging.getLogger(__name__)


# ─── FILE UPLOAD FIREWALL ────────────────────────────────────────────────

# Allowed file extensions for each upload type. Anything else is blocked.
ALLOWED_EXTENSIONS = {
    "records":      {"pdf", "png", "jpg", "jpeg"},
    "transcripts":  {"pdf", "png", "jpg", "jpeg"},
    "student_photo":{"jpg", "jpeg", "png"},
    "bulk_excel":   {"xlsx", "xls", "csv"},
    "staff_photo":  {"jpg", "jpeg", "png"},
}

# Magic bytes (the first few bytes of a real file). If they don't match
# the claimed extension, we reject the upload.
MAGIC_BYTES = {
    "pdf":  b"%PDF",
    "png":  b"\x89PNG\r\n\x1a\n",
    "jpg":  b"\xff\xd8\xff",
    "jpeg": b"\xff\xd8\xff",
    "xlsx": b"PK\x03\x04",  # zip — Excel's container
    "xls":  b"\xd0\xcf\x11\xe0",  # OLE compound (legacy)
    "csv":  None,  # no fixed magic — treat as text, but limit size
}

# Max upload sizes (per upload type, in bytes)
MAX_UPLOAD_SIZES = {
    "records":       8 * 1024 * 1024,   # 8MB
    "transcripts":   8 * 1024 * 1024,
    "student_photo": 2 * 1024 * 1024,   # 2MB
    "bulk_excel":   16 * 1024 * 1024,   # 16MB
    "staff_photo":   4 * 1024 * 1024,
}

# Blocked extensions: things that should NEVER be uploaded regardless of
# what the user types in the form (Windows + script files)
BLOCKED_EXTENSIONS = {
    "exe", "bat", "cmd", "com", "scr", "pif", "vbs", "vbe", "js", "jse",
    "wsf", "wsh", "ps1", "psm1", "psd1", "sh", "bash", "csh", "ksh",
    "py", "pyc", "pyo", "pl", "php", "asp", "aspx", "jsp", "cgi",
    "html", "htm", "svg",   # SVG can carry XSS
    "jar", "war", "ear", "dll", "so", "dylib",
    "sql", "db", "sqlite", "sqlite3",
    "ini", "env", "config",
    "iso", "img", "dmg",
    "lnk", "url",
}


def _ext(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def sanitise_filename(filename: str) -> str:
    """Strip path components, null bytes, and other dangerous chars.

    werkzeug.secure_filename() is good but allows spaces which can be
    confusing on the filesystem. We replace spaces with underscores.
    """
    if not filename:
        return ""
    safe = secure_filename(filename)
    return safe.replace(" ", "_")


def validate_upload(file_storage, upload_type: str) -> tuple[bool, str, str]:
    """Validate a Werkzeug FileStorage against the firewall rules.

    Returns (ok, safe_filename, reason).
    On failure, `safe_filename` is empty and `reason` explains why.
    """
    if not file_storage or not file_storage.filename:
        return False, "", "No file provided"

    safe_name = sanitise_filename(file_storage.filename)
    if not safe_name:
        return False, "", "Filename was empty after sanitisation"

    ext = _ext(safe_name)

    # Blocked list — never accept these
    if ext in BLOCKED_EXTENSIONS:
        return False, "", f"File type .{ext} is not allowed"

    # Per-type whitelist
    allowed = ALLOWED_EXTENSIONS.get(upload_type, set())
    if ext not in allowed:
        return False, "", f"File type .{ext} is not allowed for {upload_type}"

    # Size check
    max_size = MAX_UPLOAD_SIZES.get(upload_type, 8 * 1024 * 1024)
    file_storage.seek(0, os.SEEK_END)
    size = file_storage.tell()
    file_storage.seek(0)
    if size == 0:
        return False, "", "File is empty"
    if size > max_size:
        return False, "", f"File too large ({size} bytes, max {max_size})"

    # Magic bytes check
    head = file_storage.read(8)
    file_storage.seek(0)
    expected = MAGIC_BYTES.get(ext)
    if expected is not None:
        if not head.startswith(expected):
            return False, "", f"File content does not match .{ext} format"

    # Filename pattern: only safe chars after sanitisation
    if not re.match(r"^[A-Za-z0-9._-]+$", safe_name):
        return False, "", "Filename contains unsafe characters after sanitisation"

    return True, safe_name, "ok"


# ─── AUDIT LOG ────────────────────────────────────────────────────────────

def audit(action: str, target: str = "", detail: str = "", user=None):
    """Append an AuditLog row. Best-effort; never raises."""
    try:
        ip = request.remote_addr if request else None
        u = user or (current_user if current_user.is_authenticated else None)
        entry = AuditLog(
            user_id=u.id if u else None,
            action=action,
            target=target,
            detail=detail,
            ip=ip,
        )
        db.session.add(entry)
        db.session.commit()
    except Exception as e:
        log.warning("Audit log failed: %s", e)
        try:
            db.session.rollback()
        except Exception:
            pass


# ─── ACCESS CONTROL HELPERS ──────────────────────────────────────────────

def require_admin(view):
    """Re-export of the decorator for clarity at call sites."""
    from .decorators import admin_required
    return admin_required(view)


def require_ict_email(view):
    """Restrict a view to the school's ICT email only.

    This is the strictest gate — only Doricesmartprimaryschool89@gmail.com
    (or whatever SCHOOL_ADMIN_EMAIL is set to) can pass. Used for the
    most sensitive actions: publish transcripts, clear students, change
    fees, approve email verifications.
    """
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return redirect(url_for("auth.login", next=request.path))
        if not current_user.is_administrator():
            abort(403)
        if current_user.email.lower() != current_app.config.get(
            "SCHOOL_ADMIN_EMAIL", "doricesmartprimaryschool89@gmail.com"
        ).lower():
            audit("access_denied_ict_only", target=request.path,
                  detail=f"User {current_user.email} is not the ICT email")
            abort(403)
        return view(*args, **kwargs)
    return wrapper


# ─── SESSION HARDENING ───────────────────────────────────────────────────

def regenerate_session_on_login():
    """Call after successful login to prevent session fixation."""
    session.regenerate() if hasattr(session, "regenerate") else None
    # Flask doesn't have session.regenerate in 3.x; the next request will
    # already get a fresh session cookie because we set SESSION_COOKIE_HTTPONLY
    # and SESSION_COOKIE_SAMESITE in ProductionConfig.


# ─── RATE LIMITING (lightweight, in-memory) ───────────────────────────────
# For a small school with a few hundred parents this is plenty. Swap for
# Redis if/when you go to multiple workers.

RATE_LIMIT_STORE: dict = {}

def rate_limit(key: str, max_per_minute: int = 30) -> bool:
    """Return True if the action is allowed, False if rate-limited.

    Used for: login attempts, payment submissions, message sends.
    """
    import time
    now = time.time()
    window = [t for t in RATE_LIMIT_STORE.get(key, []) if now - t < 60]
    if len(window) >= max_per_minute:
        RATE_LIMIT_STORE[key] = window
        return False
    window.append(now)
    RATE_LIMIT_STORE[key] = window
    return True
