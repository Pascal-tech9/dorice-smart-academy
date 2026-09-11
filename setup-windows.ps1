# Dorice Smart Academy — Windows one-shot setup
# Run from PowerShell:  powershell -ExecutionPolicy Bypass -File setup-windows.ps1
# Or:  .\setup-windows.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Dorice Smart Academy — Windows setup" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# 1. Check Python
Write-Host "[1/6] Checking Python..." -ForegroundColor Cyan
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
Write-Host "[2/6] Creating virtual environment..." -ForegroundColor Cyan
if (-not (Test-Path .venv)) {
    python -m venv .venv
    Write-Host "  OK .venv created" -ForegroundColor Green
} else {
    Write-Host "  .venv already exists, reusing" -ForegroundColor Yellow
}
Write-Host ""

# 3. Activate venv
Write-Host "[3/6] Activating virtual environment..." -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1
Write-Host "  OK activated" -ForegroundColor Green
Write-Host ""

# 4. Install dependencies (Windows-friendly set)
Write-Host "[4/6] Installing dependencies (this can take 1-2 minutes)..." -ForegroundColor Cyan
python -m pip install --upgrade pip --quiet
pip install -r requirements-windows.txt --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X pip install failed. Scroll up to see the error." -ForegroundColor Red
    exit 1
}
Write-Host "  OK all dependencies installed" -ForegroundColor Green
Write-Host ""

# 5. Create .env if missing
Write-Host "[5/6] Setting up .env..." -ForegroundColor Cyan
if (-not (Test-Path .env)) {
    @"
FLASK_CONFIG=development
SECRET_KEY=local-dev-secret-$(Get-Random)
DATABASE_URL=sqlite:///./instance/dorice.db
SCHOOL_ADMIN_EMAIL=Doricesmartprimaryschool89@gmail.com
SCHOOL_ADMIN_PASSWORD=Onekenya2030
SCHOOL_NAME=Dorice Smart Academy
SCHOOL_PAYBILL=400222
SCHOOL_ACCOUNT_NUMBER=369369
"@ | Out-File -Encoding utf8 .env
    Write-Host "  OK .env created" -ForegroundColor Green
} else {
    Write-Host "  .env already exists, leaving it" -ForegroundColor Yellow
}
Write-Host ""

# 6. Initialize database
Write-Host "[6/6] Initializing database (creates SQLite + seeds 1 admin + 348 students)..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path instance | Out-Null
python migrate.py init
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the server, run:" -ForegroundColor Yellow
Write-Host "  .\run-windows.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Then open: http://127.0.0.1:5000" -ForegroundColor Yellow
Write-Host "Sign in as: Doricesmartprimaryschool89@gmail.com / Onekenya2030" -ForegroundColor Yellow
Write-Host ""
