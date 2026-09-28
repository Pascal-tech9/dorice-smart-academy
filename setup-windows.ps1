# Dorice Smart Academy - Windows one-shot setup
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Dorice Smart Academy - Windows setup" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# 1. Check Python
Write-Host "[1/7] Checking Python..." -ForegroundColor Cyan
$py = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $py) {
    Write-Host "  X Python is not installed or not in PATH." -ForegroundColor Red
    Write-Host "    Download from https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "    During install, check 'Add Python to PATH'." -ForegroundColor Yellow
    exit 1
}
Write-Host "  OK Python found: $($py.Source)" -ForegroundColor Green
Write-Host ""

# 2. Create venv
Write-Host "[2/7] Creating virtual environment..." -ForegroundColor Cyan
if (-not (Test-Path .venv)) {
    python -m venv .venv
    Write-Host "  OK .venv created" -ForegroundColor Green
} else {
    Write-Host "  .venv already exists, reusing" -ForegroundColor Yellow
}
Write-Host ""

# 3. Activate venv
Write-Host "[3/7] Activating virtual environment..." -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1
Write-Host "  OK activated" -ForegroundColor Green
Write-Host ""

# 4. Upgrade pip FIRST (so we get pre-built psycopg2-binary wheels)
Write-Host "[4/7] Upgrading pip (needed for pre-built Postgres wheels)..." -ForegroundColor Cyan
python -m pip install --upgrade pip --quiet
Write-Host "  OK pip upgraded" -ForegroundColor Green
Write-Host ""

# 5. Install dependencies
Write-Host "[5/7] Installing dependencies (1-2 min)..." -ForegroundColor Cyan
pip install -r requirements-windows.txt --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X pip install failed. Scroll up to see the error." -ForegroundColor Red
    exit 1
}
Write-Host "  OK all dependencies installed" -ForegroundColor Green
Write-Host ""

# 6. Create .env if missing
Write-Host "[6/7] Setting up .env..." -ForegroundColor Cyan
if (-not (Test-Path .env)) {
    $secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $envContent = "FLASK_CONFIG=development`nSECRET_KEY=$secret`nDATABASE_URL=sqlite:///dorice.db`nSCHOOL_ADMIN_EMAIL=Doricesmartprimaryschool89@gmail.com`nSCHOOL_ADMIN_PASSWORD=Onekenya2030`nSCHOOL_NAME=Dorice Smart Academy`nSCHOOL_PAYBILL=400222`nSCHOOL_ACCOUNT_NUMBER=369369"
    Set-Content -Path .env -Value $envContent -Encoding utf8
    Write-Host "  OK .env created (defaults to SQLite)" -ForegroundColor Green
    Write-Host "  To use Supabase instead, edit .env and change DATABASE_URL to your Postgres URL." -ForegroundColor Yellow
} else {
    Write-Host "  .env already exists, leaving it" -ForegroundColor Yellow
}
Write-Host ""

# 7. Initialize database
Write-Host "[7/7] Initializing database..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path instance | Out-Null
python init_db.py
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the server:" -ForegroundColor Yellow
Write-Host "  start_server.bat" -ForegroundColor White
Write-Host ""
Write-Host "Then open: http://127.0.0.1:5000" -ForegroundColor Yellow
Write-Host "Sign in as: Doricesmartprimaryschool89@gmail.com / Onekenya2030" -ForegroundColor Yellow
Write-Host ""
Write-Host "To use Supabase instead of SQLite, see SUPABASE_SETUP.md" -ForegroundColor Yellow
Write-Host ""
