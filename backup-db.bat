@echo off
REM Dorice Smart Academy - backup the database
REM For SQLite: just copies the .db file
REM For Postgres/Supabase: runs pg_dump and gzips the output
cd /d %~dp0
if exist .venv\Scripts\activate.bat call .venv\Scripts\activate.bat
if exist .env (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do set %%a=%%b
)

if "%DATABASE_URL%"=="" (
    if exist dorice.db (
        set DATABASE_URL=sqlite:///dorice.db
    ) else (
        echo No DATABASE_URL set and no dorice.db found.
        exit /b 1
    )
)

echo Backup target: %DATABASE_URL%
echo.

REM Detect SQLite vs Postgres
echo %DATABASE_URL% | findstr /C:"sqlite" >nul
if %ERRORLEVEL% EQU 0 (
    REM SQLite: just copy the file
    for /f "tokens=3 delims=/" %%a in ("%DATABASE_URL%") do set DBNAME=%%a
    if not exist backups mkdir backups
    set OUT=backups\%DBNAME%-%date:~-4%%date:~3,2%%date:~0,2%.db
    copy /Y %DBNAME% %OUT%
    echo SQLite backup saved to %OUT%
) else (
    REM Postgres / Supabase: use pg_dump
    for /f "tokens=2 delims=/" %%a in ("%DATABASE_URL%") do set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%
    set TIMESTAMP=%TIMESTAMP: =0%
    if not exist backups mkdir backups
    set OUT=backups\dorice-%TIMESTAMP%.sql
    pg_dump "%DATABASE_URL:~0,-1%" --no-owner --no-acl -f %OUT%
    if exist %OUT% (
        REM gzip if available
        where gzip >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            gzip %OUT%
            echo Postgres backup saved to %OUT%.gz
        ) else (
            echo Postgres backup saved to %OUT%
        )
    ) else (
        echo pg_dump failed. Is PostgreSQL client installed?
        echo Download: https://www.postgresql.org/download/windows/
    )
)
