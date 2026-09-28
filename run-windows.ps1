# Dorice Smart Academy — Windows run script
# Activates the venv and starts gunicorn on http://127.0.0.1:5000
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
& .\.venv\Scripts\Activate.ps1
Write-Host "Starting Dorice Smart Academy on http://127.0.0.1:5000 ..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""
gunicorn -w 2 -k gthread --threads 4 -b 127.0.0.1:5000 --access-logfile - --error-logfile - wsgi:app
