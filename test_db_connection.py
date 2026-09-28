"""Test that DATABASE_URL works — runs SELECT 1 and lists tables."""
import os
import sys
from sqlalchemy import create_engine, text


def mask_password(url):
    """Hide the password in a connection string for printing."""
    if not url or "@" not in url:
        return url
    try:
        scheme, rest = url.split("://", 1)
        userinfo, host = rest.split("@", 1)
        if ":" in userinfo:
            user, _ = userinfo.split(":", 1)
            return f"{scheme}://{user}:****@{host}"
    except Exception:
        pass
    return url


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("X DATABASE_URL is not set. Set it in your .env or shell first.")
        print("  Example (Supabase):")
        print('    set DATABASE_URL=postgresql://postgres.xxxx:pass@aws-0-xxx.../postgres')
        print("  Example (SQLite):")
        print('    set DATABASE_URL=sqlite:///dorice.db')
        sys.exit(1)

    print(f"Testing: {mask_password(url)}")
    try:
        engine = create_engine(url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print(f"OK  Engine: {engine.dialect.name}")
            # List tables (works for both postgres and sqlite)
            if engine.dialect.name == "postgresql":
                rows = conn.execute(text(
                    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
                )).fetchall()
            else:
                rows = conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
                )).fetchall()
            tables = [r[0] for r in rows]
            print(f"OK  Tables ({len(tables)}): {', '.join(tables) if tables else '(empty schema)'}")
    except Exception as e:
        print(f"X Connection failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
