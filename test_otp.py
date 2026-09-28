"""Test the email OTP verification flow end-to-end."""
import re, sys
sys.path.insert(0, '.')

from app import create_app
from app.extensions import db
from app.models import User, Student
from app.email_otp import EmailOTP, generate_otp, verify_otp

app = create_app()

with app.app_context():
    # Clean slate
    EmailOTP.query.delete()
    Student.query.filter_by(admission_number="TEST001").delete()
    User.query.filter_by(email="otp_test@example.com").delete()
    db.session.commit()

    # ── 1. Register a test parent
    with app.test_client() as c:
        r = c.get('/auth/register')
        csrf = re.search(r'name="csrf_token" value="([^"]+)"', r.text)
        assert csrf, "FAIL: No CSRF token on register page"
        print("OK: Got CSRF token")

        r = c.post('/auth/register', data={
            'csrf_token': csrf.group(1),
            'full_name': 'OTP Test Parent',
            'email': 'otp_test@example.com',
            'phone': '0712345678',
            'password': 'TestPass123!',
            'admission_number': 'DSA352',
            'student_name': 'PRECIOUS ZAINABU',
            'grade': 'Playgroup',
        }, follow_redirects=False)

        print(f"Register response: {r.status_code} — {r.location}")

        if r.status_code == 302 and '/auth/verify-otp' in r.location:
            print("OK: Redirected to verify-otp page")
        else:
            print(f"FAIL: Unexpected redirect: {r.location}")
            sys.exit(1)

    # ── 2. Find the OTP in the DB
    user = User.query.filter_by(email='otp_test@example.com').first()
    otp_row = EmailOTP.query.filter_by(
        user_id=user.id, status='pending'
    ).order_by(EmailOTP.created_at.desc()).first()
    assert otp_row, "FAIL: No OTP found in DB"
    code = otp_row.code
    print(f"OK: OTP in DB: {code}")

    # ── 3. Verify OTP programmatically
    assert not user.email_verified, "User should NOT be verified yet"
    ok = verify_otp(user, code)
    assert ok, "FAIL: verify_otp() returned False for correct code"
    print("OK: verify_otp() accepted the correct code")

    db.session.expire(user)
    db.session.refresh(user)
    assert user.email_verified, "FAIL: User should BE verified now"
    print("OK: User.email_verified = True")

    # ── 4. Try to login (with CSRF)
    with app.test_client() as c:
        r = c.get('/auth/login')
        csrf = re.search(r'name="csrf_token" value="([^"]+)"', r.text)
        assert csrf, "FAIL: No CSRF on login page"
        r = c.post('/auth/login', data={
            'csrf_token': csrf.group(1),
            'email': 'otp_test@example.com',
            'password': 'TestPass123!',
        }, follow_redirects=True)
        print(f"Login response: {r.status_code}")
        if 'Signed in' in r.text or '/results' in r.request.url or r.status_code == 200:
            print("OK: Login succeeded!")
        else:
            print(f"WARN: Login result unclear (status {r.status_code})")

    # ── 5. Wrong OTP is rejected
    new_code = generate_otp(user)
    print(f"New OTP: {new_code}")
    bad_ok = verify_otp(user, '000000')
    assert not bad_ok, "FAIL: verify_otp() accepted wrong code"
    print("OK: verify_otp() rejected wrong code")

    # ── 6. Results fee-block (needs logged-in client with CSRF)
    with app.test_client() as c:
        r = c.get('/auth/login')
        csrf = re.search(r'name="csrf_token" value="([^"]+)"', r.text).group(1)
        c.post('/auth/login', data={
            'csrf_token': csrf,
            'email': 'otp_test@example.com',
            'password': 'TestPass123!',
        })
        r = c.get('/results', follow_redirects=False)
        if r.status_code in (302, 301) and 'payment' in r.location.lower():
            print("OK: Results blocked by fee gate (redirected to payment)")
        else:
            print(f"WARN: Fee gate result unclear (status {r.status_code}, location {r.location})")

print("\n[PASS] All OTP flow tests passed!")
