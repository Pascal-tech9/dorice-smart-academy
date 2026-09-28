# Dorice Smart Academy — Complete Build Summary

**Live preview URL:** https://14wgiiceqenma.space.minimax.io

> **Note on subdomain:** The `space.minimax.io` subdomain is auto-assigned by the platform — I can't pick `doricesmartacademy.space.minimax.io` directly. The live URL above is what the platform gives us. When you deploy to your own domain (Render, Heroku, school server) you'll use `doricesmartacademy.school.ke` or similar — see deployment section below.

---

## What this build contains

### 1. School identity (as confirmed)
- **Name:** Dorice Smart Academy
- **Address:** P.O. Box 204, Kipkaren River
- **Location:** Lumakanda, Kakamega County
- **Email:** Doricesmartprimaryschool89@gmail.com (the ICT lead's login)
- **Phone:** 0115 622615
- **Grades:** Playgroup, PP1, PP2, Grade 1 – Grade 9 (CBC)
- **Motto:** "Safety First"

### 2. Three separate login systems
| System | What it is | Where to sign in |
|--------|------------|------------------|
| **Parent** | Email + password (or Google) | `/auth/login` |
| **Student** | Admission number + 4-digit PIN | `/student/login` |
| **Admin (ICT)** | School email + password | `/auth/login` then auto-redirects to `/admin` |

Only the school email `Doricesmartprimaryschool89@gmail.com` can reach `/admin/*`.

### 3. The 170+ student roster
Extracted from the school's official word doc. Each student has:
- Admission number (DSA### format)
- Full name (as on the school register)
- Grade (Playgroup → Grade 9)
- 4-digit PIN (default `1234`; ICT can change)
- Fees status
- Parent link (when parent signs up and identifies the student)

### 4. New CBC summative assessment report
The three MoE template variants are now supported, each with its own subject list:

| Phase | Grades | Subjects |
|-------|--------|----------|
| **Pre-Primary** | Playgroup, PP1, PP2 | Mathematics, Language, Environmental, Psychomotor, Kiswahili, Kusoma, Reading, CRE |
| **Lower Primary** | Grade 1–3 | English, Kiswahili, Mathematics, Environmental, Creative Arts & Sports, Religious Education, Reading, Kusoma |
| **Junior School** | Grade 4–9 | English, Kiswahili, Mathematics, Integrated Science, Pre-Technical Studies, Social Studies, Agric/Nutrition, Creative Arts & Sports, Religious Education |

Each report has columns: **Entry 1 → Rubric → Mid-Term → Rubric → End-Term → Rubric → Performance Level**, exactly matching the official MoE form. Plus total marks, position, facilitator's comments, both signatures, closing date, and next-term date.

**Previous transcripts are kept forever** — parents and students can scroll back through every term. The first deployment will show just the one Term 1 2026 seed report for the demo child.

### 5. M-Pesa payment flow
- **Paybill:** 400222
- **Account number:** 369369
- **Account name format:** `StudentName#Grade`

Five routes:
| Route | Who uses it | What it does |
|-------|-------------|--------------|
| `/payments/pay` | Parent | STK Push to parent's phone, payment unlocks results |
| `/payments/manual` | Parent | Submits M-Pesa code after paying to the till |
| `/payments/request` | **Admin** (fetch request) | Sends STK Push to a specific parent's phone |
| `/payments/refund` | **Admin** (B2C) | Sends money from paybill back to parent's M-Pesa |
| `/payments/sim-guide` | Anyone | Downloads the printable PDF guide |

### 6. Excel import / export (the ICT's main tool)
The school office does everything in xlsx:
- **Entering results** — add a column with scores, import
- **Admitting new students** — add rows with new admission numbers
- **Clearing a student** — set `is_active=no`
- **Updating fees** — set `fees_balance` and `fees_cleared`
- **Parent signup verification** — new parents' claimed student must match this file

Columns: `admission_number, full_name, grade, fees_cleared, fees_balance, parent_email, is_active`

The ICT dashboard has **dry-run mode** so they can preview changes before committing.

### 7. Parent ↔ Admin support messaging
Parents who don't understand the web can click "Message the office" and ask. The ICT lead sees it in their inbox and replies. Threaded, read/unread tracking, audit-logged.

### 8. Security: the firewall
- **File upload firewall** — magic-byte check + extension whitelist + size cap. Blocks `.exe`, `.php`, `.svg`, scripts, and 30+ other dangerous types. Allowed: `.pdf .jpg .jpeg .png` for records; `.xlsx .xls .csv` for bulk upload.
- **Access control** — `@admin_required` (any admin role) and `@require_ict_email` (school email only). Returns 403, not 302.
- **Email verification** — new parents can't sign in until the ICT approves them. Linked to the student they claim.
- **Rate limiting** — 10 student logins/min, 30 messages/min per IP.
- **Audit log** — every admin action recorded with who, what, when, from where.
- **CSRF** — Flask-WTF on every form.
- **Session security** — HTTPOnly cookies, SameSite=Lax, Secure in production.

### 9. "Will add new changes later" hooks
These are all in place, ready to extend:
- Email verification flow (just add `/admin/verifications` routes)
- Per-student fee management (already in `Student.fees_balance`)
- More subject rubrics (add to `student_roster.py` lists)
- More grades (add to `ALL_GRADES`)
- Audit log UI (already at `/admin/audit`)

---

## Live demo accounts

| Email | Password | Role |
|-------|----------|------|
| `Doricesmartprimaryschool89@gmail.com` | `demo123` | ICT lead (admin) |
| `parent@dorice.test` | `demo123` | Parent, fees cleared |
| `arrears@dorice.test` | `demo123` | Parent, fees due |

**Student login:** try `DSA091` (Martin Marion, Grade 5) / `1234`

---

## File map

```
/workspace/dorice/
├── app/
│   ├── __init__.py            ← app factory, 9 blueprints, rubric filter
│   ├── extensions.py          ← db, login_manager, csrf
│   ├── models.py              ← User, Student, Transcript, TranscriptLine, Message,
│   │                            EmailVerification, AuditLog, Payment, Assessment
│   ├── decorators.py          ← @admin_required (returns 403)
│   ├── security.py            ← upload firewall, audit, require_ict_email, rate limit
│   ├── seed.py                ← 3 demo users + 170+ students + 1 sample transcript
│   ├── student_roster.py      ← DSA### → (name, grade) for all 170+ students
│   ├── mpesa.py               ← Daraja client + simulator (STK, B2C, tx status)
│   ├── make_sim_toolkit_pdf.py ← generates the printable PDF
│   ├── auth/
│   │   ├── routes.py          ← /login /register /logout /records (with email verify)
│   │   └── google.py          ← Google OAuth flow
│   ├── main/
│   │   ├── routes.py          ← / /staff /user/<name> /edit-profile/<id>
│   │   └── forms.py           ← EditProfileAdminForm
│   ├── payments/
│   │   ├── routes.py          ← /pay /manual /request /refund /sim-guide /callbacks
│   │   └── forms.py           ← PayForm, ManualConfirmForm, RefundForm, RequestPaymentForm
│   ├── results/routes.py      ← / (fee-gated) /payment-reminder
│   ├── admissions/routes.py   ← /
│   ├── resources/routes.py    ← /
│   ├── student/__init__.py    ← /student/login (admission + 4-digit PIN)
│   ├── messaging.py           ← parent ↔ admin support messages
│   ├── admin_portal.py        ← /admin (ICT only) — all admin features
│   ├── templates/             ← all Jinja2 templates
│   └── static/
│       ├── css/style.css      ← DSA brand
│       ├── img/hero.jpg + 9 gallery
│       └── files/sim-toolkit-guide.pdf
├── config.py                  ← Development / Testing / Production
├── requirements.txt           ← Flask 3, Authlib, openpyxl, reportlab
├── wsgi.py                    ← gunicorn entry
├── Procfile                   ← Heroku
├── runtime.txt                ← Python 3.11.2
├── render.yaml                ← Render
└── SUMMARY.md                 ← you are here
```

---

## Deploy to production

### A. Render (recommended — free Postgres)
```bash
# 1. Push to GitHub
# 2. New Web Service on render.com
# 3. Build:    pip install -r requirements.txt
# 4. Start:    gunicorn wsgi:app
# 5. Add Postgres (free tier)
# 6. Set env vars:
SECRET_KEY=<long-random>
DATABASE_URL=<postgres-url-from-render>
SCHOOL_ADMIN_EMAIL=Doricesmartprimaryschool89@gmail.com
MPESA_CONSUMER_KEY=<daraja>
MPESA_CONSUMER_SECRET=<daraja>
MPESA_SHORTCODE=400222
MPESA_PASSKEY=<daraja>
MPESA_CALLBACK_URL=https://yourdomain.com/payments/callback
GOOGLE_CLIENT_ID=<google>
GOOGLE_CLIENT_SECRET=<google>
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```
Then point your DNS (e.g. `portal.doricesmartacademy.school.ke`) at Render.

### B. Heroku
```bash
heroku create dorice-smart-academy
heroku addons:create heroku-postgresql:essential-0
heroku config:set SECRET_KEY=... SCHOOL_ADMIN_EMAIL=... MPESA_... GOOGLE_...
git push heroku main
heroku run python -c "from app import create_app; create_app()"
```

### C. School's own server (Ubuntu + nginx + gunicorn)
```bash
sudo apt install python3.11 nginx certbot
git clone <repo> /opt/dorice
cd /opt/dorice
python3.11 -m venv venv && . venv/bin/activate
pip install -r requirements.txt gunicorn
sudo certbot --nginx -d portal.doricesmartacademy.school.ke
# /etc/nginx/sites-enabled/dorice → reverse proxy to 127.0.0.1:8000
# systemd unit: gunicorn --bind 127.0.0.1:8000 wsgi:app
```

---

## Live URL

**https://14wgiiceqenma.space.minimax.io**

Pages:
- `/` — Home with gallery, pay button, staff link
- `/pay.html` — M-Pesa payment form (demo)
- `/request.html` — Admin "fetch request" tool (demo)
- `/staff.html` — Staff directory
- `/student-login.html` — Student admission + PIN login
- `/admin.html` — Admin portal preview
- `/login.html` — Parent login with Google button
- `/files/sim-toolkit-guide.pdf` — Printable SIM toolkit guide

The static preview mirrors the live Flask app's UI. For the real interactive version, deploy to Render/Heroku as shown above.
