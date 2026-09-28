@echo off
REM Dorice Smart Academy - Windows server start
REM Loads .env if present, otherwise falls back to local dev defaults.
cd /d %~dp0
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else (
    echo ERROR: .venv not found. Run install.bat first.
    pause
    exit /b 1
)

REM Try to load .env via python-dotenv so DATABASE_URL etc. are set
if exist .env (
    python -c "from dotenv import load_dotenv; load_dotenv(); import os; print('Loaded .env; DATABASE_URL=' + (os.environ.get('DATABASE_URL','(not set)')))"
) else (
    if not defined DATABASE_URL (
        set DATABASE_URL=sqlite:///dorice.db
    )
)

echo.
echo Starting Dorice Smart Academy on http://127.0.0.1:5000
echo Press Ctrl+C to stop.
echo.

REM Use waitress on Windows (gunicorn needs fcntl, doesn't work here)
waitress-serve --host=127.0.0.1 --port=5000 --threads=4 wsgi:app
