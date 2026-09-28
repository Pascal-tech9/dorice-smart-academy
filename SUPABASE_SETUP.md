# Dorice Smart Academy — Supabase setup

Supabase gives you a free hosted Postgres database (500 MB on the free
tier, more than enough for the school). This is the recommended way
to run the portal in production — no need to provision your own
Postgres server.

---

## 1. Create a Supabase project

1. Go to https://supabase.com and sign up (free)
2. Click **New project**
3. Fill in:
   - **Name:** `dorice-smart-academy`
   - **Database password:** a strong password (SAVE THIS — you'll need it)
   - **Region:** pick the closest to Kenya (Mumbai `ap-south-1` or Singapore)
4. Click **Create new project** — wait 2-3 minutes for it to provision

## 2. Get the connection string

1. In your Supabase project dashboard, click the **⚙️ Settings** icon
2. Go to **Database** in the left sidebar
3. Scroll to **Connection string** → **URI** tab
4. Copy the connection string. It looks like:

   ```
   postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

   Or for direct connection:
   ```
   postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

5. Replace `[YOUR-PASSWORD]` with the database password you set in step 1

**Important:** Supabase requires SSL. The app adds `?sslmode=require`
automatically — you don't need to add it.

## 3. Configure your local .env

Create a `.env` file in your `C:\dorice\` folder (or wherever you
unzipped the app):

```ini
FLASK_CONFIG=development
SECRET_KEY=some-long-random-string-at-least-32-chars
DATABASE_URL=postgresql://postgres.xxxx:YourPassword@aws-0-xxx.pooler.supabase.com:6543/postgres
SCHOOL_ADMIN_EMAIL=Doricesmartprimaryschool89@gmail.com
SCHOOL_ADMIN_PASSWORD=Onekenya2030
SCHOOL_NAME=Dorice Smart Academy
SCHOOL_PAYBILL=400222
SCHOOL_ACCOUNT_NUMBER=369369
```

The `DATABASE_URL` is the only line that changes between SQLite and
Supabase — everything else stays the same.

## 4. Test the connection

In cmd (or PowerShell):

```cmd
cd C:\dorice
.venv\Scripts\activate.bat
set DATABASE_URL=postgresql://postgres.xxxx:YourPassword@aws-0-xxx.pooler.supabase.com:6543/postgres
python test_db_connection.py
```

You should see:
```
Testing: postgresql://postgres.xxxx:****@aws-0-xxx.../postgres
Engine: postgresql
✓ Connection OK
✓ Tables in schema: []
```

## 5. Run the migration

```cmd
python init_db.py
```

This creates all 10 tables and seeds 1 admin + 348 students + 1 sample
transcript. Should take 5-10 seconds.

## 6. Start the server

```cmd
start_server.bat
```

Then open http://127.0.0.1:5000 in your browser.

---

## How to view the data

1. In Supabase dashboard, click **Table Editor** in the left sidebar
2. You'll see all 10 tables (`users`, `students`, `transcripts`, etc.)
3. Click any table to browse the data, edit rows, or run SQL

## How to back up the data

Supabase has automatic daily backups on the free tier. To make a
manual backup:

1. In Supabase dashboard, go to **Database** → **Backups**
2. Click **Create backup**

Or from your PC:

```cmd
backup-db.bat
```

(This runs `pg_dump` against your DATABASE_URL.)

## Switching back to SQLite

If you want to develop offline, just change DATABASE_URL:

```cmd
set DATABASE_URL=sqlite:///dorice.db
python init_db.py
```

The app works identically against both.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `could not translate host name` | Wrong Supabase host | Re-copy connection string from Supabase → Settings → Database |
| `password authentication failed` | Wrong password | The password is what you set when creating the project, not your Supabase login |
| `SSL connection has been closed unexpectedly` | Missing `sslmode=require` | The app adds it automatically, but if you set DATABASE_URL manually, append `?sslmode=require` |
| `permission denied for table users` | Wrong role | The `postgres` user has full access; check you're using the right connection string |
| Connection works but `init_db.py` says "permission denied to create database" | You connected to the wrong database | Supabase gives you one database called `postgres` — use that name |
