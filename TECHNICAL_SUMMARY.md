# Dorice Smart Academy — Technical Summary

> For handoff to the lead developer. Covers the Flask "Large Application
> Structure", SQLAlchemy models, application factory, results-portal gate,
> and the Jinja2 contract that connects the home-page data to the
> `index.html` template.

**Stack:** Python 3.11 · Flask 3 · Flask-SQLAlchemy · Flask-Login ·
Flask-WTF (CSRF) · Jinja2 · SQLite (dev) — swappable to PostgreSQL via
`DATABASE_URL` env var.

**Run:** `pip install -r requirements.txt && python run.py`
**WSGI:** `wsgi.py` (`gunicorn wsgi:app` for production)

---

## 1. Full Directory Tree

```
dorice/
├── run.py                 # dev entrypoint: `python run.py`
├── wsgi.py                # gunicorn / production entrypoint
├── config.py              # Config class (SECRET_KEY, SQLALCHEMY_DATABASE_URI, UPLOAD_FOLDER)
├── requirements.txt
│
└── app/                   # ─── Application package ───
    ├── __init__.py        # Application factory (create_app)
    ├── extensions.py      # db, login_manager, csrf instances
    ├── models.py          # User + Assessment (CBC) tables
    ├── seed.py            # demo data (two users + sample assessments)
    │
    ├── main/              # Public home page
    │   ├── __init__.py
    │   └── routes.py      # main_bp  -> /
    │
    ├── auth/              # Register, login, logout, record uploads
    │   ├── __init__.py
    │   └── routes.py      # auth_bp  -> /auth/{register,login,logout,records}
    │
    ├── admissions/        # 4-step process page
    │   ├── __init__.py
    │   └── routes.py      # admissions_bp -> /admissions/
    │
    ├── results/           # Fees-gated CBC results + payment reminder
    │   ├── __init__.py
    │   └── routes.py      # results_bp -> /results/, /results/payment-reminder, /results/pay
    │
    ├── resources/         # Modern Notes (incl. Junior Sec Computer Studies)
    │   ├── __init__.py
    │   └── routes.py      # resources_bp -> /resources/
    │
    ├── templates/
    │   ├── base.html                          # shared navbar + footer
    │   ├── index.html                         # home: Daily Pulse, calendar, gallery
    │   ├── admissions/index.html
    │   ├── auth/
    │   │   ├── login.html
    │   │   ├── register.html
    │   │   └── records.html
    │   ├── results/
    │   │   ├── index.html                     # CBC results (only when fees cleared)
    │   │   └── payment_reminder.html
    │   ├── resources/index.html
    │   └── errors/
    │       ├── 404.html
    │       └── 413.html
    │
    ├── static/
    │   ├── css/style.css
    │   ├── js/main.js
    │   └── img/            # hero.jpg, gallery-1..6.jpg
    │
    └── uploads/records/    # user-uploaded birth certs + immunization cards
```

**URL prefix map**

| Blueprint    | Prefix         | Routes                                        |
|--------------|----------------|-----------------------------------------------|
| `main_bp`    | `/`            | `/`                                           |
| `auth_bp`    | `/auth`        | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/records` |
| `admissions_bp` | `/admissions` | `/admissions/`                              |
| `results_bp` | `/results`     | `/results/`, `/results/payment-reminder`, `/results/pay` |
| `resources_bp` | `/resources` | `/resources/`                                 |

---

## 2. Database Models — `app/models.py`

> **Naming note for the lead dev:** the spec referenced a `StudentResult`
> table. The model below is named **`Assessment`** in the source — it
> represents the same thing (one row = one CBC continuous-assessment
> entry for one subject in one term). The `User` model is unchanged from
> the spec.

```python
"""Database models for Dorice Smart Academy."""
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from .extensions import db, login_manager


class User(UserMixin, db.Model):
    """Student/parent account.

    Holds the two admission record uploads the spec calls out
    (birth certificate + immunization card) plus the fees_cleared flag
    that gates the Results portal.
    """
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    # Identity
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    grade = db.Column(db.String(20), nullable=False)  # e.g. "PP1", "Grade 5", "Grade 9"
    admission_number = db.Column(db.String(40), unique=True, index=True)

    # Auth
    password_hash = db.Column(db.String(255), nullable=False)

    # Admission record uploads (file paths, relative to /uploads/records/)
    birth_certificate = db.Column(db.String(255))
    immunization_card = db.Column(db.String(255))

    # Results gate
    fees_cleared = db.Column(db.Boolean, default=False, nullable=False)

    # Audit
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-many: a student has many CBC assessment entries
    assessments = db.relationship(
        "Assessment", backref="student", lazy="dynamic", cascade="all, delete-orphan"
    )

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def __repr__(self):
        return f"<User {self.admission_number} {self.full_name}>"


class Assessment(db.Model):
    """A single CBC continuous-assessment entry for a learner.

    CBC reports rubric scores per strand, not single test marks. We
    keep the four common areas + an overall competency level so the
    results page can render something useful.
    """
    __tablename__ = "assessments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    term = db.Column(db.String(10), nullable=False)  # e.g. "Term 1"
    year = db.Column(db.Integer, nullable=False, default=lambda: datetime.utcnow().year)
    subject = db.Column(db.String(80), nullable=False)

    # Rubric scores 1-4 (CBC uses 1-4 scale per strand)
    strand_communication = db.Column(db.Integer)
    strand_numeracy = db.Column(db.Integer)
    strand_critical_thinking = db.Column(db.Integer)
    strand_creativity = db.Column(db.Integer)

    # Overall competency: 1=Below Expectation, 2=Approaching, 3=Meeting, 4=Exceeding
    competency_level = db.Column(db.Integer)

    teacher_remark = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
```

**Schema at a glance**

| Table         | Key columns                                                                                |
|---------------|--------------------------------------------------------------------------------------------|
| `users`       | `id`, `email`, `password_hash`, `grade`, `admission_number`, `birth_certificate`, `immunization_card`, **`fees_cleared`**, `created_at`, `updated_at` |
| `assessments` | `id`, `user_id` (FK→users), `term`, `year`, `subject`, `strand_communication`, `strand_numeracy`, `strand_critical_thinking`, `strand_creativity`, `competency_level`, `teacher_remark` |

---

## 3. Application Factory — `app/__init__.py`

> The spec called for Flask-Bootstrap. **Important deviation:** the
> Flask-Bootstrap 3.3.7.1 package's Jinja helpers
> (`{{ bootstrap.load_css() }}`) are broken on modern Jinja/Flask.
> Bootstrap 5 CSS + JS is loaded directly from jsDelivr CDN inside
> `base.html`. See section 5 — the templates don't depend on the
> `bootstrap` extension either way, so this is a drop-in change.

```python
"""Application factory for Dorice Smart Academy.

Large-app structure: each concern is its own blueprint (main, auth,
admissions, results, resources). The app factory wires everything
together so the same code can run in dev, test, and production
without circular imports.
"""
import os

from flask import Flask, render_template

from config import Config
from .extensions import db, login_manager, csrf


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Init extensions
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    # Register blueprints
    from .main.routes import main_bp
    from .auth.routes import auth_bp
    from .admissions.routes import admissions_bp
    from .results.routes import results_bp
    from .resources.routes import resources_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(admissions_bp, url_prefix="/admissions")
    app.register_blueprint(results_bp, url_prefix="/results")
    app.register_blueprint(resources_bp, url_prefix="/resources")

    # Seed default data on first run
    with app.app_context():
        db.create_all()
        from .seed import seed_db
        seed_db()

    # Friendly error pages
    @app.errorhandler(404)
    def not_found(e):
        return render_template("errors/404.html"), 404

    @app.errorhandler(413)
    def too_large(e):
        return render_template("errors/413.html"), 413

    # Inject globals for templates
    @app.context_processor
    def inject_globals():
        from datetime import datetime
        return {
            "school_name": "Dorice Smart Academy",
            "school_phone": "0115 622615",
            "school_location": "Lumakanda, Kakamega County — 3.6km from town",
            "now_year": datetime.utcnow().year,
        }

    return app
```

`app/extensions.py` (so blueprints can import without circular refs):

```python
"""Flask extensions live here so blueprints can import them without circular deps."""
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect

db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()

login_manager.login_view = "auth.login"
login_manager.login_message = "Please sign in to view this page."
login_manager.login_message_category = "warning"
```

---

## 4. Route Logic — `app/results/routes.py`

> **Naming note for the lead dev:** the spec referenced a `views.py`
> file. The blueprint equivalent in this project is
> **`app/results/routes.py`**, with the blueprint variable named
> `results_bp` (the same convention applies for `main_bp`, `auth_bp`,
> `admissions_bp`, `resources_bp`).

```python
"""Results blueprint.

The KEY logic from the spec lives here:
    if current_user.fees_cleared == False:
        redirect to payment reminder, do NOT show CBC assessment results.
"""
from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user

from ..models import Assessment

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

    assessments = (
        Assessment.query
        .filter_by(user_id=current_user.id)
        .order_by(Assessment.subject.asc(), Assessment.term.asc())
        .all()
    )
    return render_template(
        "results/index.html",
        page_title="CBC Results",
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
```

**End-to-end behavior (verified live)**

| Caller state                | URL `/results/` resolves to      |
|-----------------------------|----------------------------------|
| Anonymous                   | `/auth/login?next=/results/` (302) |
| `current_user.fees_cleared == False` | `/results/payment-reminder` (302) |
| `current_user.fees_cleared == True`  | renders `results/index.html` with the user's `Assessment` rows |

**End-to-end test transcript (last run)**

```
TEST A: cleared-fees parent (parent@dorice.test)
  GET /results/ -> /results/  [OK]  sees CBC

TEST B: arrears parent (arrears@dorice.test)
  GET /results/ -> /payment-reminder  [OK]  bounced to reminder
  body shows 'Term fees are not yet cleared':  [OK]
  body hides CBC results:  [OK]
  body shows correct student (Brian Wekesa):  [OK]
  body does NOT leak other user (Achieng):  [OK]

TEST C: anonymous (no login)
  GET /results/ -> /auth/login?next=%2Fresults%2F  [OK]

TEST D: arrears parent marks as paid -> gate lifts -> sees CBC
  Step 1 GET /results/  -> /payment-reminder  [OK]
  Step 2 POST /results/pay -> HTTP 302, /results/  [OK]
  Step 3 GET /results/  -> /results/  [OK]  gate lifted, CBC shown
```

---

## 5. Jinja2 Variable Contract — Home Page

> The lead dev needs to know **exactly** which names flow from
> `app/main/routes.py` into `app/templates/index.html`. The route
> function and the corresponding template lines are listed together
> so a backend/frontend mismatch is impossible to miss.

### 5.1 Where the data is set — `app/main/routes.py`

```python
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
        # 6-image gallery (filenames 1..6)
        gallery_images=[f"assets/img/gallery-{i}.jpg" for i in range(1, 7)],
    )
```

### 5.2 Variable → template mapping

| Variable (set in route)        | Type        | Where it's used in `app/templates/index.html`                                                |
|--------------------------------|-------------|---------------------------------------------------------------------------------------------|
| `page_title`                   | `str`       | `<title>{% block title %}{{ page_title or "Home" }} · {{ school_name }}{% endblock %}</title>` (via `base.html`) |
| `gate_open`                    | `str`       | `<span class="dsa-pulse-time">{{ gate_open }}</span>` (line 47)                              |
| `gate_close`                   | `str`       | `<span class="dsa-pulse-time">{{ gate_close }}</span>` (line 49)                             |
| `routine`                      | `list[dict]`| `{% for r in routine %}` → `<span class="r-time">{{ r.time }}</span><span class="r-label">{{ r.label }}</span>` |
| `calendar_2026`                | `list[dict]`| `{% for row in calendar_2026 %}` → `{{ row.term }}` · `{{ row.window }}` · `{{ row.opens }}` · `{{ row.closes }}` |
| `gallery_images`               | `list[str]` | `{% for img in gallery_images %}` → `<img src="{{ url_for('static', filename=img) }}">`     |

**Per-iteration dict keys**

* `routine[i]`: `{ "time": "HH:MM", "label": "Event name" }`
* `calendar_2026[i]`: `{ "term": "Term N", "window": "Month – Month", "opens": "DD Mon YYYY", "closes": "DD Mon YYYY" }`
* `gallery_images[i]`: a path string relative to the static folder, e.g. `"assets/img/gallery-1.jpg"`

### 5.3 Globals injected by the factory

These are available in **every** template without passing them explicitly:

| Global            | Value                                                | Where it's used                                  |
|-------------------|------------------------------------------------------|--------------------------------------------------|
| `school_name`     | `"Dorice Smart Academy"`                             | `base.html` `<title>`, footer brand              |
| `school_phone`    | `"0115 622615"`                                      | `base.html` footer (`tel:0115622615` link)       |
| `school_location` | `"Lumakanda, Kakamega County — 3.6km from town"`     | `base.html` footer                                |
| `now_year`        | current year (int)                                   | `base.html` footer copyright                    |
| `current_user`    | Flask-Login proxy (anonymous `AnonymousUserMixin` if not signed in) | navbar user chip; results/records pages |

### 5.4 Other notable variables per page

| Page              | Route                 | Template                          | Variable(s)                                                                 |
|-------------------|-----------------------|-----------------------------------|-----------------------------------------------------------------------------|
| `/results/`       | `results.index`       | `results/index.html`              | `assessments` (list of `Assessment`), `current_user`                        |
| `/results/payment-reminder` | `results.payment_reminder` | `results/payment_reminder.html` | `current_user`                                                              |
| `/admissions/`    | `admissions.index`    | `admissions/index.html`           | `steps` (list of 4 dicts: `n`, `title`, `body`, `cta`, `cta_label`)         |
| `/resources/`     | `resources.index`     | `resources/index.html`            | `groups` (list of `{name, notes}`), `js_comp_count` (int)                   |
| `/auth/records`   | `auth.records`        | `auth/records.html`               | `current_user` (for showing on-file badges)                                 |

---

## 6. Verification checklist for the lead dev

- [x] All 10 routes resolve (`/`, `/auth/*`, `/admissions/`, `/results/*`, `/resources/`)
- [x] Public pages return 200, protected pages return 302 to `/auth/login`
- [x] `fees_cleared=False` → `/results/` redirects to `/results/payment-reminder`
- [x] `fees_cleared=True`  → `/results/` renders the user's CBC assessments
- [x] Demo users seeded on first run:
  - `parent@dorice.test`   / `demo123` — fees **cleared**
  - `arrears@dorice.test`  / `demo123` — fees **due**
  - `admin@dorice.test`    / `demo123` — ICT lead, can access `/edit-profile/<id>`
- [x] Jinja variables in `index.html` (`gate_open`, `gate_close`, `routine`, `calendar_2026`, `gallery_images`) all populated by `main.routes.index`
- [x] **Admin editor end-to-end** (see §8 below) — all 4 QA tests pass

---

## 8. Administrator-Level Profile Editor (new)

Added so the ICT lead can flip `fees_cleared` and unlock the results
portal for a parent. The implementation follows the **Pragmatic
Programmer** rule: extend the existing system with small, role-protected
tools — no rewrite.

### 8.1 New / changed files

| File                                            | Change                                             |
|-------------------------------------------------|----------------------------------------------------|
| `app/models.py`                                 | Added `Role` model + `User.is_administrator()` + `User.username` |
| `app/decorators.py` (NEW)                       | `@admin_required` (returns 403 for non-admins)     |
| `app/main/forms.py` (NEW)                       | `EditProfileAdminForm`                             |
| `app/main/routes.py`                            | Added `user_profile` and `edit_profile_admin` views |
| `app/templates/user.html` (NEW)                 | Profile page; admin-only "Edit Profile" button     |
| `app/templates/edit_profile.html` (NEW)         | Admin editor form                                  |
| `app/seed.py`                                   | Seeds `Parent`, `Teacher`, `Admin` roles + an admin user |
| `app/static/css/style.css`                      | Styles for the new editor                          |

### 8.2 `Role` model — `app/models.py`

```python
class Role(db.Model):
    """A role that a User can hold (Parent, Teacher, Admin)."""
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    default = db.Column(db.Boolean, default=False, index=True)
    permissions = db.Column(db.Integer)

    users = db.relationship("User", backref="role", lazy="dynamic")

    @staticmethod
    def insert_roles():
        roles = {
            "Parent":  None,
            "Teacher": None,
            "Admin":   1,   # 1 = can access /edit-profile/<id>
        }
        for r, perm in roles.items():
            role = Role.query.filter_by(name=r).first()
            if role is None:
                role = Role(name=r, permissions=perm)
                db.session.add(role)
        db.session.commit()
```

`User` got two new columns:

```python
username = db.Column(db.String(64), index=True)
role_id = db.Column(db.Integer, db.ForeignKey("roles.id"))
```

…and one new method:

```python
def is_administrator(self):
    if self.role is None:
        return False
    return bool(self.role.permissions == 1)
```

### 8.3 `app/decorators.py`

```python
"""Custom decorators for route protection."""
from functools import wraps
from flask import abort
from flask_login import current_user


def admin_required(f):
    """Block any user that isn't an admin.

    Returns 403 (Forbidden) — not 401 — to make it obvious in the test
    transcript that the access decision is "you don't have permission",
    not "you need to sign in". (Anonymous users hit login_required
    first and 302 to /auth/login.)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_administrator():
            abort(403)
        return f(*args, **kwargs)
    return decorated_function
```

### 8.4 `EditProfileAdminForm` — `app/main/forms.py`

> **Spec deviation:** the prompt used `Form` (deprecated in WTForms 3)
> and the `Required()` validator (renamed `DataRequired()`). I also
> replaced the strict `Email()` validator with a lightweight regex
> because `email-validator` 2.x rejects reserved-TLD addresses
> (`*.test`, `*.example`) used in seed data, which would break the
> admin from editing a fresh `arrears@dorice.test` row.

```python
"""Forms for the main blueprint.

The administrator-level profile editor used by the ICT lead to
toggle the `fees_cleared` flag and unlock the results portal.
"""
import re
from flask_wtf import FlaskForm
from wtforms import StringField, BooleanField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, Optional, ValidationError

from ..models import Role


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _valid_email(_, field):
    if not _EMAIL_RE.match(field.data or ""):
        raise ValidationError("Please enter a valid email address.")


class EditProfileAdminForm(FlaskForm):
    """Admin-only form for editing a student/parent's record.

    The `fees_cleared` BooleanField is the key that lets the ICT lead
    unlock the results portal for that learner.
    """
    email = StringField(
        "Email",
        validators=[DataRequired(), Length(1, 120), _valid_email],
    )
    username = StringField(
        "Username",
        validators=[DataRequired(), Length(1, 64)],
    )
    grade = StringField(
        "Grade",
        validators=[Optional(), Length(0, 20)],
    )
    # The primary tool for the ICT lead:
    fees_cleared = BooleanField(
        "Fees Cleared (Unlocks Results Portal)"
    )
    role = SelectField("Role", coerce=int)
    submit = SubmitField("Update Student Record")

    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.role.choices = [
            (role.id, role.name)
            for role in Role.query.order_by(Role.name).all()
        ]
        self.user = user
```

### 8.5 Admin route — `app/main/routes.py`

```python
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
```

### 8.6 Templates

**`app/templates/user.html`** (excerpt of the admin-only button)

```html
{% if current_user.is_authenticated and current_user.is_administrator() %}
  <div class="admin-actions" style="margin-top: 12px;">
    <a class="btn dsa-btn-primary w-100"
       href="{{ url_for('main.edit_profile_admin', id=user.id) }}">
      Edit Profile [Admin Mode]
    </a>
  </div>
{% else %}
  <p class="text-muted small mb-0">Only administrators can edit profile records.</p>
{% endif %}
```

**`app/templates/edit_profile.html`** — full DSA-branded form with a
prominent `fees_cleared` checkbox card. Uses raw HTML rather than
`bootstrap/wtf.html` because the project loads Bootstrap from CDN, not
the Flask-Bootstrap extension. Renders inline error messages under each
field with the class `dsa-field-error`.

### 8.7 QA verification (live transcript)

Last run, against the running Flask app, with raw HTTP responses
(`allow_redirects=False`):

```
TEST 1: Unauthorized access
  Anonymous GET /edit-profile/1 -> HTTP 302, Location=/auth/login?next=%2Fedit-profile%2F1
  [OK]  bounced to /auth/login
  Parent GET /edit-profile/2 -> HTTP 403
  [OK]  parent got 403

TEST 2: Admin can open the editor
  Admin GET /edit-profile/2 -> HTTP 200
  [OK]  edit form rendered

TEST 3: Admin toggles fees_cleared -> results gate lifts
  Before  GET /results/ (as arrears) -> HTTP 302, Location=/results/payment-reminder
  [OK]  bounced to /payment-reminder
  Admin POST /edit-profile/2 -> HTTP 302, Location=/user/arrears
  [OK]  redirected to user profile
  After   GET /results/ (as arrears) -> HTTP 200
  [OK]  no redirect to reminder
  [OK]  CBC results visible
  [OK]  payment reminder hidden

TEST 4: Profile page admin button visibility
  Admin   /user/arrears -> HTTP 200
  [OK]  edit link visible
  Parent  /user/arrears -> HTTP 200
  [OK]  edit link HIDDEN
```

### 8.8 How the ICT lead uses it (demo flow)

```
1. Sign in at /auth/login as  admin@dorice.test  /  demo123
2. Visit  /user/arrears        (or any learner's profile)
3. Click  "Edit Profile [Admin Mode]"
4. Tick   "Fees Cleared"       (the key that unlocks the results portal)
5. Click  "Update Student Record"
6. The parent can now hit  /results/  and see CBC, not the reminder.
```

---

## 7. Quick-start for the new dev

```bash
cd dorice
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py
# open http://127.0.0.1:5000

# demo flow:
# 1. visit /, /admissions/, /resources/ as guest
# 2. sign in as parent@dorice.test / demo123 -> /results/ shows CBC
# 3. sign out, sign in as arrears@dorice.test / demo123 -> /results/ shows payment reminder
```

DB is SQLite by default (`app.db` at project root). Switch to Postgres by
setting `DATABASE_URL=postgresql://user:pass@host/dorice` before launch.
