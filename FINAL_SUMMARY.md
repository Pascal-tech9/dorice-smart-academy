# Dorice Smart Academy — Final Build Summary

**Live preview:** https://rkjrw9s0oewc0.space.minimax.io
**Source:** `/workspace/dorice/` · **Static preview:** `/workspace/dist/static-site/`
**Stack:** Flask 3 · SQLAlchemy · Bootstrap 5 (CDN) · Authlib · ReportLab · PostgreSQL-ready

---

## What's in this build

### 1. Public site
- **Home** with Daily Pulse (gate hours + routine), 2026 school calendar, hero photo, 9-image gallery
- **Staff** page with 5 placeholder cards (Director, Headteacher, Deputy, Junior Secondary Lead, Lead Class Teacher)
- **Admissions** form
- **Resources** library
- **Results** portal (gated by `fees_cleared`)
- **Sign in** with email/password or Google (when configured)

### 2. Authentication
- Email + password (Werkzeug hashed)
- **Google OAuth** via Authlib — `/auth/google/login` → `/auth/google/callback`
  - New users auto-registered as Parents
  - Existing users get `google_id` linked
  - Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`
  - Button hidden when env vars not set

### 3. M-Pesa payment flow
School paybill: **400222** · Account: **369369** · Account name: `StudentName#Grade`

| Flow | Route | What it does |
|------|-------|--------------|
| **STK Push (parent pays)** | `/payments/pay` | Pre-filled form, fires M-Pesa prompt to parent's phone, Daraja callback unlocks results |
| **Manual confirmation** | `/payments/manual` | Parent submits M-Pesa code after paying at the till |
| **Fetch request (admin)** | `/payments/request` | Admin sends M-Pesa prompt to a specific parent's phone (the "fetch request" you asked for) |
| **B2C refund** | `/payments/refund` | Admin sends money from paybill back to parent's M-Pesa |
| **SIM toolkit guide** | `/payments/sim-guide` | Printable PDF for parents |
| **Daraja callbacks** | `/payments/callback`, `/payments/b2c/result`, `/payments/b2c/timeout` | Webhooks for real Daraja integration |

### 4. Admin tools
- **`/edit-profile/<id>`** — Flip `fees_cleared`, edit email, grade, role (gated by `@admin_required` → 403)
- **`/payments/request`** — Send "fetch request" to a parent's phone
- **`/payments/refund`** — B2C refund
- **`/payments/sim-guide`** — Download printable guide

### 5. Demo accounts
| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `parent@dorice.test` | `demo123` | Parent | Fees cleared, sees results |
| `arrears@dorice.test` | `demo123` | Parent | Fees due, sees payment reminder |
| `admin@dorice.test` | `demo123` | Admin | Can flip `fees_cleared`, send requests, refund |

### 6. QA results (29/29 passing)
```
✓ SIM guide = 200 (application/pdf, %PDF-)
✓ Public pages (home, login, staff) = 200
✓ Fee gate (arrears → /results/ = 302 → payment-reminder)
✓ Admin gate (parent → /edit-profile, /refund, /request = 403)
✓ STK push → 302, simulated success, fees_cleared=True
✓ B2C refund → 302
✓ Fetch request → 302 → /payments/confirm/<id>
✓ Pay page has "Pay with M-Pesa", 400222, 369369, print guide
✓ Google button hidden when env vars not set
✓ Demo accounts visible
```

---

## What's new in this build

1. **Google Sign-in** — `app/auth/google.py`, Authlib OAuth 2.0, "Sign in with Google" button on login
2. **Fetch request (admin)** — `app/payments/routes.py` → `request_payment()`, fires STK Push to specific parent
3. **B2C refund** — `mpesa.b2c_send_money()` + `/payments/refund` route + form
4. **Transaction status** — `mpesa.transaction_status()` for checking B2C outcomes
5. **Printable SIM toolkit PDF** — `app/make_sim_toolkit_pdf.py` → `app/static/files/sim-toolkit-guide.pdf`
6. **Payment model** — `app/models.py` → `Payment` class tracking phone, amount, paybill, account, status, receipt
7. **Callback URLs** — `/payments/callback` (STK), `/payments/b2c/result` (B2C), `/payments/b2c/timeout`

---

## How to deploy to production

### Option A: Render (recommended)
```bash
# 1. Push to GitHub
# 2. Connect on render.com → New Web Service
# 3. Build:  pip install -r requirements.txt
# 4. Start:  gunicorn wsgi:app
# 5. Add env vars in dashboard:
SECRET_KEY=<long-random-string>
DATABASE_URL=<postgres-url>
MPESA_CONSUMER_KEY=<daraja>
MPESA_CONSUMER_SECRET=<daraja>
MPESA_SHORTCODE=400222
MPESA_PASSKEY=<daraja>
MPESA_CALLBACK_URL=https://yourdomain.com/payments/callback
MPESA_ENVIRONMENT=production
GOOGLE_CLIENT_ID=<google>
GOOGLE_CLIENT_SECRET=<google>
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

### Option B: Heroku
```bash
heroku create dorice-smart-academy
heroku addons:create heroku-postgresql:essential-0
heroku config:set SECRET_KEY=... MPESA_...  GOOGLE_...
git push heroku main
heroku run python -c "from app import create_app; create_app()"
```

---

## File map

```
/workspace/dorice/
├── app/
│   ├── __init__.py            ← app factory, registers 6 blueprints
│   ├── extensions.py          ← db, login_manager, csrf
│   ├── models.py              ← User (with google_id), Role, Assessment, Payment
│   ├── decorators.py          ← @admin_required (returns 403)
│   ├── seed.py                ← 3 demo accounts + 5 CBC assessment rows
│   ├── mpesa.py               ← Daraja client + simulator (STK, B2C, tx status)
│   ├── make_sim_toolkit_pdf.py ← generates the printable PDF
│   ├── auth/
│   │   ├── routes.py          ← /login /register /logout /records
│   │   └── google.py          ← Google OAuth flow
│   ├── main/
│   │   └── routes.py          ← / /staff /user/<name> /edit-profile/<id>
│   ├── payments/
│   │   ├── routes.py          ← /pay /manual /request /refund /sim-guide /callbacks
│   │   └── forms.py           ← PayForm, ManualConfirmForm, RefundForm, RequestPaymentForm
│   ├── results/routes.py      ← / (fee-gated) /payment-reminder
│   ├── admissions/routes.py   ← /
│   ├── resources/routes.py    ← /
│   ├── templates/             ← Jinja2 templates
│   └── static/
│       ├── css/style.css      ← DSA brand
│       ├── img/hero.jpg + 9 gallery
│       └── files/sim-toolkit-guide.pdf  ← printable
├── config.py                  ← Development / Testing / Production
├── requirements.txt           ← Flask 3, Authlib, ReportLab, etc.
├── wsgi.py                    ← gunicorn entry
├── Procfile                   ← Heroku/Render
├── runtime.txt                ← Python 3.11.2
├── render.yaml                ← Render blueprint
└── FINAL_SUMMARY.md           ← you are here
```

---

## Static preview
The public-facing static preview at **https://rkjrw9s0oewc0.space.minimax.io** mirrors the live site:
- `index.html` — home with 9 photos, gallery, pay button, staff link
- `pay.html` — full M-Pesa payment form (demo)
- `request.html` — admin "fetch request" tool (demo)
- `staff.html` — staff directory with photo placeholders
- `login.html` — sign-in form with "Sign in with Google" button
- `files/sim-toolkit-guide.pdf` — downloadable PDF for parents

---

## Next steps for the school

1. **Plug in Daraja credentials** — sandbox first, then production. The simulator auto-switches.
2. **Plug in Google OAuth** — set the 3 env vars.
3. **Send school photos** — drop them in `app/static/img/staff-*.jpg` to replace the silhouettes.
4. **Set up callback URL** — must be a real HTTPS URL that Daraja can reach. Use ngrok for dev, real domain for prod.
5. **Provision Postgres** — Render / Heroku one-click. The app auto-handles the URL change.
6. **Print the SIM toolkit guide** — distribute at parent meetings.
