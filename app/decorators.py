"""Custom decorators for route protection."""
from functools import wraps
from flask import abort
from flask_login import current_user


def admin_required(f):
    """Block any user that isn't an admin.

    Returns 403 (Forbidden) — not 401 — to make it obvious in the test
    transcript that the access decision is "you don't have permission",
    not "you need to sign in". (Anonymous users hit the
    login_required decorator first and 302 to /auth/login.)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_administrator():
            abort(403)
        return f(*args, **kwargs)
    return decorated_function


def teacher_required(f):
    """Block non-teachers (admins are allowed)."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            abort(403)
        if current_user.role is None or current_user.role.name not in ("Teacher", "Admin"):
            abort(403)
        return f(*args, **kwargs)
    return decorated_function
