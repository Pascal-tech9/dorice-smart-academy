"""Email OTP utility for Dorice Smart Academy.

Provides:
  - generate_otp(user): creates a 6-digit code, saves to DB, sends via email
  - verify_otp(user, code): checks expiry + code, returns True/False
  - clear_expired(): housekeeping — removes OTPs older than 15 minutes

Email is sent via SMTP when MAIL_USERNAME/MAIL_PASSWORD env vars are set.
If SMTP is not configured, the OTP is still generated and logged to console
(so you can test without a real email account).
"""
import random
import re
from datetime import datetime, timedelta

from flask import current_app

from .extensions import db
from .models import User, AuditLog


# ─── OTP Model ────────────────────────────────────────────────────────────────

class EmailOTP(db.Model):
    """One-time 6-digit code tied to a User account.

    status: pending → used | expired
    """
    __tablename__ = "email_otps"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    code = db.Column(db.String(6), nullable=False)          # stored plain — short-lived
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    attempts = db.Column(db.Integer, default=0)              # rate-limit guesses
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("otps", lazy="dynamic"))

    @staticmethod
    def clean_old():
        """Delete expired OTPs."""
        EmailOTP.query.filter(
            EmailOTP.status == "pending",
            EmailOTP.expires_at < datetime.utcnow(),
        ).delete()
        db.session.commit()


# ─── OTP Generation ────────────────────────────────────────────────────────────

OTP_VALIDITY_MINUTES = 15
OTP_MAX_ATTEMPTS = 5


def generate_otp(user: User) -> str:
    """Generate a 6-digit OTP, save it, and email it to the user.

    Returns the raw code (caller may display it in dev mode).
    Raises RuntimeError if email sending completely fails.
    """
    EmailOTP.clean_old()

    # Invalidate any existing pending OTPs for this user
    EmailOTP.query.filter_by(user_id=user.id, status="pending").update(
        {"status": "expired"}
    )
    db.session.commit()

    code = f"{random.randint(0, 999999):06d}"
    expires = datetime.utcnow() + timedelta(minutes=OTP_VALIDITY_MINUTES)

    otp = EmailOTP(
        user_id=user.id,
        code=code,
        status="pending",
        expires_at=expires,
    )
    db.session.add(otp)
    db.session.commit()

    # Send email
    _send_otp_email(user, code)

    return code


def verify_otp(user: User, code: str) -> bool:
    """Check a 6-digit code. Returns True on match, False otherwise.

    Consumes the OTP (marks it 'used') on success.
    Tracks failed attempts up to OTP_MAX_ATTEMPTS.
    """
    code = (code or "").strip()
    if not re.fullmatch(r"^\d{6}$", code):
        return False

    otp = (
        EmailOTP.query
        .filter_by(user_id=user.id, status="pending")
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if otp is None:
        return False

    # Too many wrong attempts → expire it
    if otp.attempts >= OTP_MAX_ATTEMPTS:
        otp.status = "expired"
        db.session.commit()
        return False

    # Expired
    if otp.expires_at < datetime.utcnow():
        otp.status = "expired"
        db.session.commit()
        return False

    # Wrong code
    if otp.code != code:
        otp.attempts += 1
        db.session.commit()
        return False

    # Match! Consume it and activate the user
    otp.status = "used"
    user.email_verified = True
    user.email_verified_at = datetime.utcnow()
    db.session.commit()
    return True


# ─── Email sending ─────────────────────────────────────────────────────────────

def _send_otp_email(user: User, code: str):
    """Send the OTP code to the user via SMTP.

    Falls back to console logging if SMTP is not configured.
    """
    subject = "Verify your email — Dorice Smart Academy"
    body = f"""Hello {user.full_name},

Your Dorice Smart Academy verification code is:

    {code}

This code expires in 15 minutes. If you did not create an account at Dorice Smart Academy, please ignore this email.

Warm regards,
Dorice Smart Academy
Lumakanda, Kakamega County
Phone: 0115 622615
"""

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif; background:#F6F4EC; margin:0; padding:24px;">
  <div style="max-width:520px; margin:0 auto; background:#fff;
              border-radius:10px; overflow:hidden;
              border:1px solid #D8D3C2;">
    <div style="background:#1B4332; padding:24px 32px;">
      <h1 style="color:#D4A017; margin:0; font-size:22px;">Dorice Smart Academy</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#1A2420; font-size:15px;">Hello {user.full_name},</p>
      <p style="color:#1A2420; font-size:15px;">Your verification code is:</p>
      <div style="background:#F6F4EC; border:2px dashed #D4A017;
                  border-radius:8px; padding:20px; text-align:center;
                  margin:20px 0;">
        <span style="font-family:monospace; font-size:32px;
                     font-weight:bold; color:#1B4332; letter-spacing:8px;">
          {code}
        </span>
      </div>
      <p style="color:#4B564F; font-size:13px;">
        This code expires in <strong>15 minutes</strong>.
        If you did not create an account, ignore this email.
      </p>
    </div>
    <div style="background:#EDEADF; padding:16px 32px;
                border-top:1px solid #D8D3C2; font-size:12px; color:#4B564F;">
      Dorice Smart Academy · Lumakanda, Kakamega County · 0115 622615
    </div>
  </div>
</body>
</html>"""

    # Try real SMTP
    mail_server = current_app.config.get("MAIL_SERVER")
    if mail_server and current_app.config.get("MAIL_USERNAME"):
        _send_via_smtp(user.email, subject, body, html)
    else:
        # Dev fallback — print to console
        print(f"\n{'='*50}")
        print(f"[EMAIL] OTP for {user.email}: {code}")
        print(f"{'='*50}\n")


def _send_via_smtp(to_email: str, subject: str, body: str, html: str):
    """Send email via SMTP."""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = current_app.config["MAIL_DEFAULT_SENDER"]
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(
        current_app.config["MAIL_SERVER"],
        current_app.config["MAIL_PORT"],
    ) as server:
        if current_app.config.get("MAIL_USE_TLS"):
            server.starttls()
        server.login(
            current_app.config["MAIL_USERNAME"],
            current_app.config["MAIL_PASSWORD"],
        )
        server.sendmail(
            current_app.config["MAIL_DEFAULT_SENDER"],
            [to_email],
            msg.as_string(),
        )
