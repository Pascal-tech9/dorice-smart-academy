# Dorice Smart Academy — Flask web app

A Flask web app for **Dorice Smart Academy** (Lumakanda, Kakamega County, PP1 – Grade 9).
Follows the **Kenyan CBC curriculum** and uses a "Safety First" approach.

## Stack
- Flask + Flask-Bootstrap (Large App Structure, blueprints)
- SQLAlchemy + Flask-Login
- Jinja2 templates with the same forest-green / gold look as the static site

## Directory layout
```
dorice/
├── run.py                  # dev entrypoint
├── wsgi.py                 # gunicorn entrypoint
├── config.py
├── requirements.txt
└── app/
    ├── __init__.py         # app factory
    ├── extensions.py       # db, login_manager, csrf, bootstrap
    ├── models.py           # User, Assessment
    ├── seed.py             # demo users + CBC assessments
    ├── main/routes.py      # /        -> home (Daily Pulse, calendar, gallery)
    ├── auth/routes.py      # /auth/*  -> register, login, records
    ├── admissions/routes.py# /admissions  -> 4-step process
    ├── results/routes.py   # /results -> fees-gated CBC results
    ├── resources/routes.py # /resources   -> Modern Notes + JS Computer Studies
    ├── templates/
    │   ├── base.html
    │   ├── index.html
    │   ├── auth/{login,register,records}.html
    │   ├── admissions/index.html
    │   ├── results/{index,payment_reminder}.html
    │   ├── resources/index.html
    │   └── errors/{404,413}.html
    ├── static/
    │   ├── css/style.css
    │   ├── js/main.js
    │   └── img/             # gallery-1..6.jpg, hero.jpg, etc.
    └── uploads/records/    # admission record uploads
```

## Run locally
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py
# open http://127.0.0.1:5000
```

## Demo accounts (password: `demo123`)
- `parent@dorice.test`   — fees cleared (full CBC results)
- `arrears@dorice.test`  — fees due (redirected to payment reminder)

## Key behavior the spec asked for
1. **Base template** — `base.html` uses Flask-Bootstrap, includes the navbar
   (Home, Admissions, Results, Learning Resources) and a footer with
   phone `0115 622615` and location `3.6km from Lumakanda town`.
2. **Home** — `index.html` has a "Daily Pulse" sidebar (gates `07:00 – 16:30`,
   assembly 7:40, games 15:30), a 2026 calendar table, and a 6-image
   gallery (`assets/img/gallery-1.jpg` … `gallery-6.jpg`).
3. **Admissions** — 4-step process: Call Office → Submit Records → Meet Teacher → Enroll.
4. **User model** — `User` with `fees_cleared` boolean and fields
   for `birth_certificate` + `immunization_card` uploads.
5. **Results gate** — `results/routes.py`:
   ```python
   if current_user.fees_cleared == False:
       return redirect(url_for("results.payment_reminder"))
   ```
6. **Learning Resources** — Junior Secondary (Gr 7–9) Computer Studies
   and pre-technical studies each have their own section.
