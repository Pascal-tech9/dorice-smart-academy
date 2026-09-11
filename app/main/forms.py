"""Forms for the main blueprint.

The administrator-level profile editor used by the ICT lead to
toggle the `fees_cleared` flag and unlock the results portal.
"""
import re
from flask_wtf import FlaskForm
from wtforms import StringField, BooleanField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, Optional, ValidationError

from ..models import Role


# Lightweight email check — strict deliverability validation rejects
# reserved-TLD addresses (e.g. *.test, *.example) which we use in seed
# data, so we keep a simple "has @ and a dot in the domain" rule here.
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _valid_email(_, field):
    if not _EMAIL_RE.match(field.data or ""):
        raise ValidationError("Please enter a valid email address.")


class EditProfileAdminForm(FlaskForm):
    """Admin-only form for editing a student/parent's record.

    The `fees_cleared` BooleanField is the key that lets the ICT lead
    unlock the results portal for that learner.
    """
    email = StringField(
        "Email",
        validators=[DataRequired(), Length(1, 120), _valid_email],
    )
    username = StringField(
        "Username",
        validators=[DataRequired(), Length(1, 64)],
    )
    grade = StringField(
        "Grade",
        validators=[Optional(), Length(0, 20)],
    )
    # The primary tool for the ICT lead:
    fees_cleared = BooleanField(
        "Fees Cleared (Unlocks Results Portal)"
    )
    role = SelectField("Role", coerce=int)
    submit = SubmitField("Update Student Record")

    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Populate role choices from the database
        self.role.choices = [
            (role.id, role.name)
            for role in Role.query.order_by(Role.name).all()
        ]
        self.user = user
