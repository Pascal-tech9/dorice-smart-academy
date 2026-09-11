"""Wipe the dev DB and re-run seed so new demo parents are created."""
import sys
sys.path.insert(0, ".")
from app import create_app
from app.extensions import db
from app import models  # noqa: F401 — needed so all models are registered

app = create_app()
with app.app_context():
    # Drop all tables and recreate fresh
    db.drop_all()
    print("Tables dropped.")
    db.create_all()
    print("Tables recreated.")
    # seed_db() is called by create_app() already
    print("Seed complete.")

    # Verify demo accounts exist
    from app.models import User
    parents = User.query.filter(
        User.email.in_(["parent@dorice.test", "arrears@dorice.test"])
    ).all()
    print(f"Demo parents found: {len(parents)}")
    for u in parents:
        print(f"  {u.email}  fees_cleared={u.fees_cleared}")

    admin = User.query.filter_by(email="Doricesmartprimaryschool89@gmail.com").first()
    if admin:
        print(f"Admin: {admin.email}")
        ok = admin.check_password("Onekenya2030")
        print(f"  Password 'Onekenya2030' correct: {ok}")

    from app.models import Student
    total_students = Student.query.count()
    print(f"Total students: {total_students}")
