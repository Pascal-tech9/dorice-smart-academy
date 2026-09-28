# Dorice Smart Academy — Quick Start

Run the backend on your machine in 3 commands.

## 1. Install & run

```bash
unzip dorice-production.zip -d dorice && cd dorice
./run-local.sh
```

The script will:
- Create a Python virtual environment
- Install all dependencies
- Create a SQLite database at `./instance/dorice.db`
- Seed the database (1 admin + 348 students + 1 sample transcript)
- Start gunicorn on http://localhost:5000

## 2. Sign in

Open http://localhost:5000 in your browser.

**As the school admin:**
- Email: `Doricesmartprimaryschool89@gmail.com`
- Password: `Onekenya2030`
- You'll land on `/admin` (the private admin dashboard)

**As a student:**
- Admission number: `DSA091`
- 4-digit PIN: `1234`
- You'll land on `/student/dashboard`

**As a parent:**
1. Click "Apply" in the top-right
2. Enter your details + your child's admission number (e.g. `DSA091`) and name
3. The school office will approve your account

## 3. Smoke test

In another terminal:
```bash
./test-backend.sh
```

Verifies: `/healthz`, `/staff`, `/admin-profile`, `/admin` (gated), `/auth/login`, `/payments/sim-guide`, HSTS.

## 4. Push to GitHub

```bash
bash push-to-github.sh
```

This pushes to `pascal-tech9/dorice-smart-academy`.

## 5. Deploy on Render

1. Go to https://render.com → **New** → **Blueprint**
2. Pick the repo you just pushed
3. Render auto-provisions the web service + Postgres (via `render.yaml`)
4. First deploy runs `migrate.py` (creates tables + seeds)
5. Visit `https://<your-service>.onrender.com/healthz` → `{"status":"ok"}`

## 6. Change the admin password (do this!)

Via Render Shell:
```bash
python -c "
from app import create_app
from app.models import User
from app.extensions import db
app = create_app()
with app.app_context():
    u = User.query.filter_by(email='Doricesmartprimaryschool89@gmail.com').first()
    u.set_password('YOUR-NEW-STRONG-PASSWORD')
    db.session.commit()
    print('Password updated for', u.email)
"
```

## 7. Plug in M-Pesa Daraja (optional)

In Render → Environment, add:
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_PASSKEY`
- `MPESA_SHORTCODE=400222`
- `MPESA_CALLBACK_URL=https://<your-domain>/payments/callback`
- `MPESA_INITIATOR_NAME` (for B2C refunds)
- `MPESA_SECURITY_CREDENTIAL` (for B2C refunds)

## 8. Plug in Google OAuth (optional)

In Render → Environment, add:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI=https://<your-domain>/auth/google/callback`

The "Sign in with Google" button on `/auth/login` will appear automatically.

---



## Database commands

The backend uses SQLAlchemy + Alembic (via Flask-Migrate).

```bash
# Apply any pending migrations + seed
python migrate.py

# Just apply migrations (no seed)
python migrate.py upgrade

# Just seed (idempotent — safe to run multiple times)
python migrate.py seed

# Generate a new migration after a model change
flask db migrate -m "add foo table"
flask db upgrade

# DEV ONLY: drop everything, recreate, seed
FLASK_CONFIG=development python migrate.py reset

# Inspect the database via the admin UI
# (login as admin → Dashboard → Database)
# Or hit the healthcheck:
curl http://localhost:5000/healthz/db
```

## Backup and restore

```bash
# Manual backup (creates dorice-backup-<timestamp>.sql.gz)
./backup-db.sh

# Restore (DROPS existing data)
./restore-db.sh dorice-backup-20260101-120000.sql.gz
```

For production on Render, configure the **Postgres Backup** add-on
(nightly automated snapshots, 7-day retention on the Starter plan).

## Project layout

```
dorice/
├── app/                    Flask application
│   ├── __init__.py         App factory
│   ├── models.py           User, Student, Transcript, etc.
│   ├── admin_portal.py     /admin/* routes
│   ├── auth/               /auth/login, /auth/register, /auth/google/*
│   ├── results/            /results/* + fees gate
│   ├── payments/           /payments/* + M-Pesa
│   ├── student/            /student/* + 4-digit PIN
│   ├── messaging.py        /messages/* + /admin/messages
│   ├── security.py         File upload firewall
│   ├── decorators.py       @admin_required, @require_ict_email
│   ├── seed.py             1 admin + 348 students
│   ├── student_roster.py   Official 348-student roster
│   └── templates/          Jinja2 templates
├── wsgi.py                 gunicorn entry point
├── migrate.py              Run once: creates tables + seeds
├── config.py               Dev / Test / Production configs
├── requirements.txt
├── render.yaml             Render Blueprint
├── Procfile                Heroku-style fallback
├── runtime.txt             Python version pin
├── push-to-github.sh       One-command push
├── run-local.sh            One-command local run
└── test-backend.sh         Smoke test
```

## Routes overview

| Path | Who | What |
|---|---|---|
| `/` | public | School home |
| `/staff` | public | Our Staff (incl. Mrs. D. A. Chapia) |
| `/admin-profile` | public | ICT admin profile + Excel template |
| `/auth/login` | public | Parent / admin sign-in |
| `/auth/register` | public | Parent sign-up (matches against roster) |
| `/auth/claim-student` | parent | Link a child after Google sign-in |
| `/auth/google/login` | public | Start Google OAuth |
| `/auth/google/callback` | public | Google OAuth callback |
| `/results/` | parent | CBC report (gated by `fees_cleared`) |
| `/results/payment-reminder` | parent | "Pay to unlock" page |
| `/payments/pay` | parent | M-Pesa STK push |
| `/payments/manual` | parent | Manual paybill instructions |
| `/student/login` | public | Student admission + PIN |
| `/student/transcript/<id>` | student | View own transcript |
| `/admin` | admin | Admin dashboard |
| `/admin/students` | admin | Roster with inline fee editing |
| `/admin/students/new` | admin | Admit new student |
| `/admin/students/<id>/edit` | admin | Edit student |
| `/admin/students/<id>/fees` | admin | PATCH fees (AJAX) |
| `/admin/transcripts` | admin | All transcripts (per-subject editor) |
| `/admin/transcripts/new` | admin | Create transcript |
| `/admin/transcripts/<id>/publish` | admin | Publish to parents |
| `/admin/transcripts/<id>/lines.json` | admin | GET lines for per-subject editor |
| `/admin/transcripts/<id>/lines/<line_id>` | admin | PATCH one field on one line |
| `/admin/verifications` | admin | Approve new parent signups |
| `/admin/excel` | admin | Excel import/export |
| `/admin/audit` | admin | Audit log |
| `/messages` | parent | Parent ↔ admin messaging |
| `/admin/messages` | admin | Admin inbox |
| `/payments/sim-guide` | public | Printable M-Pesa guide (PDF) |
| `/healthz` | public | Health check |
