"""Forms for the M-Pesa payment flow."""
from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, NumberRange, Regexp

from ..mpesa import is_valid_kenyan_phone


class PayForm(FlaskForm):
    """STK Push form. Pre-populated with the parent's name and the
    student's grade by the route handler, so the parent only has to
    confirm the amount and enter their phone number.

    Phone accepts the formats: 0712345678, +254712345678, 254712345678
    """
    full_name = StringField(
        "Student name",
        validators=[DataRequired(), Length(1, 120)],
        render_kw={"readonly": True},
    )
    grade = StringField(
        "Grade",
        validators=[DataRequired(), Length(1, 20)],
        render_kw={"readonly": True},
    )
    amount = IntegerField(
        "Amount (KES)",
        validators=[DataRequired(), NumberRange(min=1, max=500000)],
        default=5000,
    )
    phone = StringField(
        "M-Pesa phone number",
        validators=[
            DataRequired(),
            Length(10, 13),
            Regexp(r"^(\+?254|0)?7\d{8}$",
                   message="Enter a valid Safaricom number, e.g. 0712 345 678"),
        ],
        description="The number that will receive the M-Pesa prompt",
    )
    purpose = StringField(
        "What you're paying for",
        validators=[DataRequired(), Length(1, 120)],
        default="Term fees",
    )
    submit = SubmitField("Pay with M-Pesa")


class ManualConfirmForm(FlaskForm):
    """For parents who paid to the till directly and want to submit the
    M-Pesa confirmation code for admin review."""
    amount = IntegerField(
        "Amount you paid (KES)",
        validators=[DataRequired(), NumberRange(min=1, max=500000)],
    )
    phone = StringField(
        "Phone number you paid from",
        validators=[DataRequired(), Length(10, 13)],
    )
    mpesa_code = StringField(
        "M-Pesa confirmation code",
        validators=[DataRequired(), Length(4, 20)],
        description="The code you received in the M-Pesa SMS (e.g. QJG7...)",
    )
    submit = SubmitField("Submit for verification")


class RefundForm(FlaskForm):
    """Admin-only: refund a parent via B2C (Send Money to customer)."""
    amount = IntegerField(
        "Amount to refund (KES)",
        validators=[DataRequired(), NumberRange(min=1, max=500000)],
    )
    phone = StringField(
        "Recipient M-Pesa phone number",
        validators=[
            DataRequired(),
            Length(10, 13),
            Regexp(r"^(\+?254|0)?7\d{8}$",
                   message="Enter a valid Safaricom number, e.g. 0712 345 678"),
        ],
    )
    command_id = SelectField(
        "Reason code",
        choices=[
            ("BusinessPayment",  "Business Payment — refund / reimbursement"),
            ("SalaryPayment",    "Salary Payment — staff payroll (admin use)"),
            ("PromotionPayment", "Promotion Payment — bursary / scholarship"),
        ],
        default="BusinessPayment",
    )
    remarks = StringField(
        "Remarks (visible to recipient)",
        validators=[DataRequired(), Length(1, 120)],
        default="Dorice Smart Academy refund",
    )
    submit = SubmitField("Send refund")


class RequestPaymentForm(FlaskForm):
    """Admin-only: send a payment request (STK Push / 'fetch request')
    to a specific parent's phone.

    Used when a parent calls the office and says "send me an M-Pesa
    prompt so I can pay". The school fires the prompt; the parent
    enters their PIN on their phone; the money moves.
    """
    parent_email = StringField(
        "Parent email",
        validators=[DataRequired(), Length(1, 120)],
    )
    amount = IntegerField(
        "Amount to request (KES)",
        validators=[DataRequired(), NumberRange(min=1, max=500000)],
    )
    phone = StringField(
        "Parent M-Pesa phone number",
        validators=[
            DataRequired(),
            Length(10, 13),
            Regexp(r"^(\+?254|0)?7\d{8}$",
                   message="Enter a valid Safaricom number, e.g. 0712 345 678"),
        ],
    )
    purpose = StringField(
        "What this payment is for",
        validators=[DataRequired(), Length(1, 120)],
        default="Term fees",
    )
    submit = SubmitField("Send M-Pesa request")
