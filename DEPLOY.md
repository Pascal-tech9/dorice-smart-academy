# Deploy Dorice Smart Academy to Production

This guide walks you through deploying the school portal to a real
server, step by step. Three options are covered — pick the one that
matches your school's situation.

---

## Option A — Render.com (recommended, ~5 minutes)

Render gives you free HTTPS, free Postgres (90 days), and one-click
deploys from GitHub. This is the easiest path for a school.

### 1. Push to GitHub

```bash
cd /workspace/dorice
git init
git add .
git commit -m "Dorice Smart Academy — initial deploy"
git branch -M main
git remote add origin https://github.com/<your-org>/dorice-smart-academy.git
git push -u origin main
```

### 2. Connect Render

1. Go to https://render.com → **New** → **Blueprint**
2. Point it at your GitHub repo
3. Render reads `render.yaml` and creates:
   - Web service: `dorice-smart-academy` (Starter plan, $7/mo)
   - Postgres: `dorice-db` (Starter plan, $7/mo)
4. Click **Apply**

### 3. Set the secret env vars

In the Render dashboard → your service → **Environment** tab, add:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | (auto-generated, leave it) |
| `SCHOOL_ADMIN_EMAIL` | `Doricesmartprimaryschool89@gmail.com` |
| `MPESA_CONSUMER_KEY` | from Safaricom Daraja |
| `MPESA_CONSUMER_SECRET` | from Safaricom Daraja |
| `MPESA_PASSKEY` | from Safaricom Daraja |
| `MPESA_CALLBACK_URL` | `https://<your-app>.onrender.com/payments/callback` |
| `GOOGLE_CLIENT_ID` | (optional) from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | (optional) |

### 4. Wait for first deploy

The `buildCommand` in `render.yaml` runs:
```
pip install --upgrade pip
pip install -r requirements.txt
python -c "from app import create_app; create_app()"
```

This creates all tables and seeds the demo data (170+ students, 3 users).

### 5. Custom domain (optional)

Render dashboard → your service → **Settings** → **Custom Domains**:
- Add `portal.doricesmartacademy.school.ke`
- Update your DNS: CNAME `portal` → `<your-app>.onrender.com`
- Render auto-provisions Let's Encrypt SSL

### 6. Change the admin password

1. Sign in at `https://<your-app>.onrender.com/auth/login`
2. Use `Doricesmartprimaryschool89@gmail.com` / `demo123`
3. Go to `/admin` → **Manage students** → click your admin user
4. There's no public "change password" UI yet — the fastest way is:
   ```bash
   # SSH into Render (paid plans) OR run locally against the prod DB
   heroku run python -c "from app import create_app; from app.extensions import db; from app.models import User; app = create_app(); 
   with app.app_context():
       u = User.query.filter_by(email='Doricesmartprimaryschool89@gmail.com').first()
       u.set_password('YOUR-NEW-STRONG-PASSWORD')
       db.session.commit()
       print('Password updated.')"
   ```

### Render pricing
- Web service Starter: $7/mo (free tier available for low traffic)
- Postgres Starter: $7/mo (256MB)
- Total: ~$14/mo for a real production deployment

---

## Option B — Heroku

```bash
# Install Heroku CLI first: https://devcenter.heroku.com/articles/heroku-cli
heroku login
heroku create dorice-smart-academy
heroku addons:create heroku-postgresql:essential-0
heroku config:set \
  FLASK_CONFIG=production \
  SCHOOL_ADMIN_EMAIL=Doricesmartprimaryschool89@gmail.com \
  MPESA_SHORTCODE=400222 \
  MPESA_ENVIRONMENT=production
# (set the secret keys too)
git push heroku main
heroku run python migrate.py
heroku run python -c "..."  # change admin password
```

---

## Option C — Ubuntu VPS (full control, cheapest long-term)

If you want to host on the school's own server or a $5/mo VPS:

### 1. Provision

```bash
# On a fresh Ubuntu 22.04
sudo apt update && sudo apt install -y python3.11 python3.11-venv nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

### 2. Database

```bash
sudo -u postgres psql
CREATE USER dorice WITH PASSWORD 'STRONG-DB-PASSWORD';
CREATE DATABASE dorice OWNER dorice;
\q
```

### 3. App

```bash
sudo useradd -m -s /bin/bash dorice
sudo -u dorice git clone <repo> /opt/dorice
cd /opt/dorice
python3.11 -m venv venv
. venv/bin/activate
pip install -r requirements.txt gunicorn

# .env
cat > /opt/dorice/.env <<EOF
FLASK_CONFIG=production
SECRET_KEY=$(python -c "import secrets;print(secrets.token_hex(32))")
DATABASE_URL=postgresql://dorice:STRONG-DB-PASSWORD@localhost:5432/dorice
SCHOOL_ADMIN_EMAIL=Doricesmartprimaryschool89@gmail.com
MPESA_SHORTCODE=400222
MPESA_ENVIRONMENT=production
# (add Daraja + Google keys too)
EOF

python migrate.py
```

### 4. systemd service

```bash
sudo tee /etc/systemd/system/dorice.service <<'EOF'
[Unit]
Description=Dorice Smart Academy
After=network.target postgresql.service

[Service]
User=dorice
WorkingDirectory=/opt/dorice
EnvironmentFile=/opt/dorice/.env
ExecStart=/opt/dorice/venv/bin/gunicorn -w 2 -k gthread --threads 4 -b 127.0.0.1:8000 wsgi:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now dorice
sudo systemctl status dorice
```

### 5. nginx reverse proxy

```bash
sudo tee /etc/nginx/sites-available/dorice <<'EOF'
server {
    listen 80;
    server_name portal.doricesmartacademy.school.ke;

    client_max_body_size 16M;  # allow 16MB Excel uploads

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /static/ {
        alias /opt/dorice/app/static/;
        expires 7d;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/dorice /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. HTTPS

```bash
sudo certbot --nginx -d portal.doricesmartacademy.school.ke
```

### 7. DNS

Point `portal.doricesmartacademy.school.ke` at the VPS's public IP.

---

## Post-deploy checklist

- [ ] **Change admin password** — `demo123` is the seed default, must be replaced
- [ ] **Verify HTTPS** — visit `https://yourdomain.com/healthz` → should return `{"status": "ok"}`
- [ ] **Test student login** — try `DSA091` / `1234` (Martin Marion, Grade 5)
- [ ] **Print the SIM toolkit guide** — share with parents at the next meeting
- [ ] **Set up Daraja callback** — your `MPESA_CALLBACK_URL` must be the real HTTPS domain
- [ ] **Set up backup** — for Postgres, enable Render/Heroku automated backups ($1/mo extra)
- [ ] **Add monitoring** — Render/Heroku dashboards show request latency, error rate
- [ ] **Configure Google OAuth** — set the 3 env vars in the dashboard
- [ ] **Change the school admin email** — currently `Doricesmartprimaryschool89@gmail.com`; can be changed in the env var if needed

---

## Ongoing operations

### Backups
- **Render Postgres:** Settings → Backups → Enable (daily, $1/mo)
- **Heroku Postgres:** `heroku pg:backups:schedule DATABASE_URL --at '02:00 UTC'`
- **VPS:** cron job that runs `pg_dump` nightly

### Updating the app
```bash
git pull
# Render: auto-deploys on push to main
# Heroku: git push heroku main
# VPS: sudo systemctl restart dorice
```

### Viewing logs
- **Render:** Dashboard → Logs tab (live tail)
- **Heroku:** `heroku logs --tail`
- **VPS:** `sudo journalctl -u dorice -f`

### Scaling
- **Render:** Bump plan from Starter → Standard → Pro in the dashboard
- **Heroku:** `heroku ps:scale web=4` (4 dynos)
- **VPS:** Edit `/etc/systemd/system/dorice.service` gunicorn `-w` count, then `sudo systemctl restart dorice`

---

## Security checklist (run before going live)

- [x] `SECRET_KEY` is a long random string (not the default)
- [x] `FLASK_CONFIG=production` is set
- [x] HTTPS is enforced (certbot or platform default)
- [x] Database password is strong and not the same as the app password
- [x] Admin password changed from `demo123`
- [x] File upload firewall enabled (already in `app/security.py`)
- [x] CSRF protection on all forms (Flask-WTF, already enabled)
- [x] Session cookies are HTTPOnly + SameSite=Lax (set in ProductionConfig)
- [x] SQLAlchemy is using parameterised queries (no SQL injection risk)
- [x] Werkzeug `secure_filename` on all uploads
- [x] Rate limiting on login + messages (already in `app/security.py`)
- [x] Audit log captures who-did-what-when

---

## Troubleshooting

### "Address already in use" on Render
Render assigns a `$PORT` automatically. Don't hardcode 5000.

### M-Pesa callback not received
Daraja needs a public HTTPS URL. Set `MPESA_CALLBACK_URL` to your
real domain. Locally, use ngrok (`ngrok http 8000`).

### Students can't log in after deployment
The seed creates students with PIN `1234`. ICT must share the PIN
with each student (or reset it via `/admin/students`).

### "SECRET_KEY is not set" warning
Render auto-generates this on first deploy. If you see the warning,
check the env var is present in the dashboard.

### "Attempt to write a readonly database" 
You're on the wrong DB. Production should use `DATABASE_URL=postgresql://...`
not sqlite. Check the env var.
