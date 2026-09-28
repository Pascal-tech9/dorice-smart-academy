# Dorice Smart Academy — Project Summary for NotebookLM

> Paste this into notebooklm.google.com and ask it any question about the
> project — it has the full context of what was built, why, and how to use it.

---

## What this is

A complete web platform for **Dorice Smart Academy**, a CBC (Competency-Based
Curriculum) school in Lumakanda, Kakamega County, Kenya. The school runs
Playgroup through Grade 9 (~350 students) and uses M-Pesa (Safaricom Daraja
paybill **400222**, account **369369**) for term fee collection.

The platform handles four audiences:
- **Parents** — sign in with email/password (or Google), identify the student
  they're a guardian of, view results, pay fees via M-Pesa STK Push, message
  the school office
- **Students** — sign in with admission number (e.g. `DSA352`) + 4-digit PIN,
  see their published CBC transcripts
- **School admin (ICT lead)** — only `Doricesmartprimaryschool89@gmail.com`
  can access `/admin/*`. Manages students, fees, transcripts, approves parent
  signups, replies to messages
- **Public visitors** — browse the school, see gallery, download the
  printable M-Pesa SIM toolkit guide

## Why it was built

The school previously had no digital portal. Parents called the office for
every fee reminder. Teachers hand-wrote CBC reports three times a year. The
ICT lead (the school Gmail address) needed:
- A way to publish official MoE-format summative assessment reports
- A way to track M-Pesa payments and auto-unlock results
- A way for parents to identify their child during registration (against
  the official roster of 348+ students)
- A way to bulk-import/export data via Excel (no one wants to type 348
  names into a web form)
- A way for the school to verify the ICT lead's identity (only the school
  email can publish results or change fees)

## Tech stack

- **Flask 3** — large-app structure with 9 blueprints: `main`, `auth`,
  `auth.google`, `admissions`, `results`, `resources`, `payments`, `student`,
  `messaging`, `admin`
- **SQLAlchemy 2** with **PostgreSQL** in production (SQLite for dev)
- **Bootstrap 5** via CDN (no flask-bootstrap extension)
- **Authlib** for Google OAuth
- **ReportLab** for the printable SIM toolkit PDF
- **openpyxl** for Excel import/export
- **Gunicorn** in production (2 workers × 4 threads)
- **Daraja API** (Safaricom M-Pesa sandbox/production) for STK Push and B2C
- **Werkzeug** security for password hashing and CSRF
- **Flask-Login** for parent session management
- **Flask-WTF** for CSRF protection on all forms

## File structure

```
dorice/
├── app/
│   ├── __init__.py            App factory, 10 blueprints, security headers
│   ├── extensions.py          db, login_manager, csrf
│   ├── models.py              User, Student, Transcript, TranscriptLine,
│   │                            Message, EmailVerification, AuditLog,
│   │                            Payment, Assessment, Role
│   ├── decorators.py          @admin_required (returns 403)
│   ├── security.py            Upload firewall, audit, require_ict_email,
│   │                            rate limiting
│   ├── seed.py                Seeds 1 admin + 348 students + 1 sample transcript
│   ├── student_roster.py      DSA### → (name, grade) for all 170+ students
│   ├── mpesa.py               Daraja client + simulator (STK, B2C, tx status)
│   ├── make_sim_toolkit_pdf.py  Generates the printable PDF
│   ├── auth/
│   │   ├── routes.py          /login /register /logout /records
│   │   └── google.py          Google OAuth flow
│   ├── main/
│   │   ├── routes.py          / /staff /user/<name> /edit-profile/<id>
│   │   └── forms.py           EditProfileAdminForm
│   ├── payments/
│   │   ├── routes.py          /pay /manual /request /refund /sim-guide
│   │   └── forms.py           PayForm, ManualConfirmForm, RefundForm,
│   │                            RequestPaymentForm
│   ├── results/routes.py      / (fee-gated) /payment-reminder
│   ├── admissions/routes.py   /
│   ├── resources/routes.py    /
│   ├── student/__init__.py    /student/login (admission + 4-digit PIN)
│   ├── messaging.py           Parent ↔ admin support messages
│   ├── admin_portal.py        /admin (ICT only) — students, transcripts,
│   │                            Excel, verifications, audit
│   ├── templates/             All Jinja2 templates
│   └── static/
│       ├── css/style.css      DSA brand
│       ├── img/hero.jpg + 9 gallery
│       └── files/sim-toolkit-guide.pdf
├── config.py                  Development / Testing / Production
├── requirements.txt           Flask 3, Authlib, openpyxl, reportlab
├── wsgi.py                    Gunicorn entry + /healthz
├── Procfile                   Heroku-style process file
├── runtime.txt                Python 3.11.2
├── render.yaml                Render Blueprint (auto-provisions web + Postgres)
├── migrate.py                 Production DB migration
├── .env.example               Every env var documented
├── .gitignore                 Standard Python ignores
├── DEPLOY.md                  Step-by-step deploy guide (3 options)
├── SUMMARY.md                 Feature summary
├── NOTEBOOKLM_SUMMARY.md      This file
└── TECHNICAL_SUMMARY.md       Earlier draft of the technical summary
```

## Database schema (the important bits)

```
users              — Parents + the 1 school admin
  id, full_name, email, phone, grade, admission_number, username
  password_hash, google_id, auth_provider
  email_verified (default False — ICT must approve)
  fees_cleared (default False — flipped by M-Pesa success)
  is_active, last_login_at
  role_id → roles.id

roles              — Parent / Teacher / Admin
  id, name, permissions (1 = admin)

students           — The actual learners
  id, admission_number (DSA###, unique)
  full_name, grade
  parent_id → users.id
  photo_path (uploaded by ICT)
  pin_hash (4-digit numeric, bcrypt-hashed)
  is_on_roster (True if from official list, False if manually added)
  fees_cleared, fees_balance
  is_active

transcripts        — One row per (student, term, year)
  id, student_id, term, year, grade, phase
  learner_name, assessment_number, upi
  total_marks, total_out_of, position, out_of
  general_performance (e.g. "Meeting Expectation")
  grade_facilitator_comments
  facilitator_signature, head_signature
  closing_date, next_term_begins
  is_published (False = draft, True = parent/student can see)
  published_at, created_by_id

transcript_lines   — One row per subject in a transcript
  id, transcript_id, subject, order
  entry_score, mid_score, end_score (1-4 CBC rubric)
  performance_level (1-4)
  facilitator_comment

payments           — M-Pesa payment attempts
  id, user_id, student_id
  purpose, amount (KES)
  phone (normalised to 2547XXXXXXXX)
  merchant_request_id, checkout_request_id (Daraja IDs)
  mpesa_receipt, manual_code
  status (pending / success / failed / manual)
  paybill (400222), account_number (369369)

messages           — Parent ↔ admin support messages (threaded)
  id, thread_id (self-FK), from_user_id, to_user_id
  subject, body, is_read, created_at

email_verifications  — Pending parent signups awaiting ICT approval
  id, user_id, token
  declared_student_admission, declared_student_name
  status (pending / approved / rejected)
  reviewed_by_id, reviewed_at, review_note

audit_logs         — Who-did-what-when security log
  id, user_id, action, target, detail, ip, created_at
```

## Three separate login systems (intentionally isolated)

| System | Where | What identifies the user |
|--------|-------|---------------------------|
| Parent | `/auth/login` | email + password (or Google OAuth) |
| Student | `/student/login` | admission number (e.g. DSA091) + 4-digit PIN |
| Admin (ICT) | `/auth/login` (then `/admin`) | school email + password |

Only `Doricesmartprimaryschool89@gmail.com` can reach `/admin/*`. The
`@require_ict_email` decorator on every admin route returns 403 for
everyone else — even other users with the Admin role.

Students do **not** share a session with their parents. A leaked student
PIN cannot pivot to a parent account.

## The 348-student roster

`app/student_roster.py` is the single source of truth. It maps every
admission number (DSA000–DSA376, extracted from the school's official
Word doc) to the student name and grade.

When a parent registers at `/auth/register`:
1. They enter the admission number and the student's name
2. The app looks up the roster — if the admission number is on it AND the
   name matches, an `EmailVerification` row is created
3. The ICT lead sees it at `/admin/verifications` and clicks Approve
4. The parent's `email_verified` flips to True and they can sign in
5. The student record is auto-linked to the parent

This means parents **cannot** register as a student they're not a guardian
of. The roster check stops that at the front door.

## Three MoE transcript phases

The Kenyan MoE summative assessment form has three variants depending on
the student's grade phase. The app auto-loads the right subject list:

| Phase | Grades | Subjects |
|-------|--------|----------|
| **Pre-Primary** | Playgroup, PP1, PP2 | Mathematics, Language, Environmental, Psychomotor, Kiswahili, Kusoma, Reading, CRE |
| **Lower Primary** | Grade 1–3 | English, Kiswahili, Mathematics, Environmental, Creative Arts & Sports, Religious Education, Reading, Kusoma |
| **Junior School** | Grade 4–9 | English, Kiswahili, Mathematics, Integrated Science, Pre-Technical Studies, Social Studies, Agric/Nutrition, Creative Arts & Sports, Religious Education |

Each transcript row has: **Entry 1 → Rubric → Mid-Term → Rubric → End-Term → Rubric → Performance Level**, matching the official MoE form exactly. Rubric 1-4 maps to: 1=BE (Below Expectation), 2=AE (Approaching), 3=ME (Meeting), 4=EE (Exceeding).

**Previous transcripts are kept forever.** Every term/year/grade is a
new `Transcript` row, never overwritten. Parents and students can scroll
back through the full academic history.

## M-Pesa payment flow

School paybill: **400222** · Account: **369369** · Account name format:
`StudentName#Grade` (visible on the Daraja statement).

Five routes, each with a clear role:

| Route | Who | What |
|-------|-----|------|
| `/payments/pay` | Parent | Pre-filled STK Push form. Fires M-Pesa prompt to parent's phone, unlocks results on Daraja callback |
| `/payments/manual` | Parent | Parent paid at the till directly → submit M-Pesa code → ICT verifies |
| `/payments/request` | **Admin** (fetch request) | Sends STK Push to a *specific* parent's phone. Used when parent calls: "send me an M-Pesa prompt so I can pay" |
| `/payments/refund` | **Admin** (B2C) | Sends money from paybill back to parent's M-Pesa. For overpayments / activity refunds |
| `/payments/sim-guide` | Anyone | Downloads printable PDF guide |

The Daraja integration has two modes:
- **Real** — when `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, and
  `MPESA_PASSKEY` are set, the app talks to the real Daraja API
- **Simulated** — when those env vars are missing, a `SimulatedMpesaClient`
  returns success immediately. Lets the school demo the flow without
  Daraja credentials

## Security: the firewall

- **File upload firewall** — magic-byte check + extension whitelist + size
  cap. Blocks `.exe`, `.php`, `.svg`, `.sh`, `.py`, 30+ dangerous
  extensions. Allowed: `.pdf .jpg .jpeg .png` for records; `.xlsx .xls .csv`
  for bulk upload; `.jpg .jpeg .png` for photos
- **Access control** — `@admin_required` (any admin role) and
  `@require_ict_email` (school email only). Returns 403, not 302
- **Email verification** — new parents can't sign in until ICT approves
- **Rate limiting** — 10 student logins/min, 30 messages/min per IP
- **Audit log** — every admin action recorded with who/what/when/IP
- **CSRF** — Flask-WTF on every form
- **Session security** — HTTPOnly + SameSite=Lax + Secure (production)
- **SQLAlchemy** — parameterised queries, no SQL injection risk
- **Werkzeug `secure_filename`** — strips path components on all uploads
- **HSTS + CSP + X-Frame-Options + X-Content-Type-Options + Referrer-Policy**
  in production via `@app.after_request` hook
- **ProxyFix** in production so `url_for(_external=True)` works behind
  Render/Heroku's load balancer

## Excel as the ICT's main tool

The school office does everything in xlsx. One file, one workflow:

**Columns:** `admission_number, full_name, grade, fees_cleared, fees_balance, parent_email, is_active`

**Used for:**
- **Entering results** — export current students, add score columns, import back
- **Admitting new students** — add rows with new admission numbers (DSA500+)
- **Clearing a student** — set `is_active=no` (keeps the record but disables login)
- **Updating fees** — set `fees_balance` and `fees_cleared`
- **Bulk fee clearing** — for the whole class after a fee drive

The import has a **dry-run mode** that shows what would change without
committing. The ICT lead always runs dry-run first.

## Admin routes (all gated by `@require_ict_email`)

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard with stats + quick actions |
| `/admin/students` | Browse, search, filter by grade |
| `/admin/students/new` | Add a new student (mid-term joiner) |
| `/admin/students/<id>/edit` | Edit name, grade, fees, active status |
| `/admin/students/<id>/photo` | Upload or replace student photo |
| `/admin/students/<id>/clear-fees` | Mark fees as cleared (one click) |
| `/admin/students/<id>/reset-pin` | Reset the 4-digit PIN |
| `/admin/students/<id>/update-fees` | Set the fees balance |
| `/admin/verifications` | Approve/reject pending parent signups |
| `/admin/transcripts` | Browse all transcripts |
| `/admin/transcripts/new` | Create a new transcript (auto-loads right subject list) |
| `/admin/transcripts/<id>/publish` | Make a draft visible to parents/students |
| `/admin/excel` | Excel import/export hub |
| `/admin/excel/students/export` | Download xlsx of all students |
| `/admin/excel/students/import` | Upload xlsx (dry-run or commit) |
| `/admin/excel/transcripts/export` | Download xlsx of all published transcripts |
| `/admin/messages` | Parent support messages |
| `/admin/audit` | Who-did-what-when log |

## Production deployment

**Recommended path: Render.com (~$14/mo).**

```bash
# 1. Push to GitHub
cd dorice && git init && git add . && git commit -m "Initial"
git push origin main

# 2. Render → New → Blueprint → connect repo
#    render.yaml auto-creates the web service + Postgres

# 3. Set env vars:
SCHOOL_ADMIN_EMAIL=Doricesmartprimaryschool89@gmail.com
SECRET_KEY=auto-generated
DATABASE_URL=auto-set-by-render
# (add MPESA_* and GOOGLE_* when ready)

# 4. First deploy auto-runs migrate.py:
#    - creates all tables
#    - seeds 1 admin + 348 students
#    - seeds 1 sample CBC transcript
```

**The admin's first action after deploy: change the password** via
Render Shell. The seed default is `Onekenya2030`.

## Demo accounts (gone in production)

The original dev seed had:
- `parent@dorice.test` / `demo123` — fees cleared
- `arrears@dorice.test` / `demo123` — fees due
- `admin@dorice.test` / `demo123` — ICT lead

**These have been removed from the production seed.** Production now
only has:
- `Doricesmartprimaryschool89@gmail.com` / `Onekenya2030` — ICT lead

Real parents register themselves and the ICT lead approves each one from
`/admin/verifications`. No more test data in production.

## What's still on the roadmap

These are noted in the DEPLOY.md "Ongoing operations" section but
explicitly NOT implemented yet — the school can request them after launch:

- SMS notifications when results are published
- Email digests for parents
- Per-class attendance tracking
- Library book lending
- Cafeteria menu / payments
- Bus tracking
- Parent-teacher conference booking
- Auto-backup to S3 / Google Drive
- Two-factor auth for the admin

## Key files for context

If you want to dive deep into a specific area, here are the
highest-signal files:

| File | Lines | What's in it |
|------|-------|--------------|
| `app/__init__.py` | ~95 | App factory, blueprint registration, security headers, rubric filter |
| `app/models.py` | ~380 | All 11 database models |
| `app/security.py` | ~210 | Upload firewall, audit, rate limit, `@require_ict_email` |
| `app/admin_portal.py` | ~430 | All admin routes (students, transcripts, verifications, Excel) |
| `app/student_roster.py` | ~360 | 348-student roster + CBC subject lists per phase |
| `app/mpesa.py` | ~280 | Daraja client (STK, B2C, query) + simulator |
| `app/templates/admin/student_edit.html` | ~140 | The "ICT can do everything" UI |
| `app/templates/student/transcript.html` | ~110 | MoE-style summative assessment report |
| `DEPLOY.md` | ~250 | Step-by-step deploy guide for 3 platforms |
| `config.py` | ~120 | Dev / Test / Production configs with security headers |
| `render.yaml` | ~70 | Render Blueprint — auto-provisions web + Postgres |
