"""M-Pesa payment routes.

The flow:
    1. Parent sees the payment reminder at /results/payment-reminder
    2. Clicks "Pay with M-Pesa" -> /payments/pay
       Form is pre-populated with the student's name + grade (from the
       signed-in account). Parent enters amount + phone.
    3. Server initiates an STK push to Daraja (or the simulated client
       in dev). We persist a Payment row in the "pending" state.
    4. Parent is redirected to /payments/confirm/<id>, which polls
       /payments/status/<id> every 4s for up to 60s.
    5. When Daraja POSTs the result to /payments/callback, we mark
       the Payment + User's fees_cleared accordingly.

A manual fallback (/payments/manual) lets parents who already paid to
the till submit their M-Pesa confirmation code for admin review.
"""
import logging
import os
import secrets
import time

from flask import (
    Blueprint, render_template, redirect, url_for,
    flash, request, current_app, jsonify,
)
from flask_login import login_required, current_user

from ..extensions import db
from ..models import Payment, User
from ..decorators import admin_required
from ..mpesa import (
    get_client, normalise_phone, build_account_reference,
    SCHOOL_PAYBILL, SCHOOL_ACCOUNT_NUMBER,
)
from .forms import PayForm, ManualConfirmForm

payments_bp = Blueprint("payments", __name__)
log = logging.getLogger(__name__)


@payments_bp.route("/pay", methods=["GET", "POST"])
@login_required
def pay():
    """Show the STK Push form, pre-populated with the parent's student data."""
    form = PayForm()

    # Pre-populate on GET (and re-render on POST with errors)
    if request.method == "GET":
        form.full_name.data = current_user.full_name
        form.grade.data = current_user.grade

    if form.validate_on_submit():
        phone = normalise_phone(form.phone.data)
        try:
            client = get_client()
            account_ref = build_account_reference(
                current_user.full_name, current_user.grade
            )
            result = client.stk_push(
                phone=phone,
                amount=form.amount.data,
                account_ref=account_ref,
                description=f"Term fees — {current_user.full_name}",
            )
        except Exception as e:
            log.exception("STK push failed")
            flash(f"Could not reach M-Pesa: {e}", "danger")
            return render_template("payments/pay.html", form=form, paybill=SCHOOL_PAYBILL,
                                   account_number=SCHOOL_ACCOUNT_NUMBER,
                                   simulated=getattr(client, "_simulated", False))

        # Persist the payment attempt
        payment = Payment(
            user_id=current_user.id,
            amount=form.amount.data,
            phone=phone,
            purpose=form.purpose.data,
            merchant_request_id=result.get("MerchantRequestID"),
            checkout_request_id=result.get("CheckoutRequestID"),
            status="pending",
            result_desc=result.get("CustomerMessage") or result.get("ResponseDescription"),
        )
        db.session.add(payment)
        db.session.commit()

        # In simulated mode, mark success immediately so the demo flow
        # doesn't hang waiting for a Daraja callback.
        if result.get("_simulated"):
            payment.mark_succeeded(
                receipt=f"SIM{secrets.token_hex(4).upper()}",
                desc="Simulated M-Pesa success (demo mode)",
            )
            flash("Demo complete! Payment marked as received.", "success")
        else:
            flash("M-Pesa prompt sent. Check your phone and enter your PIN.", "info")
        return redirect(url_for("payments.confirm", payment_id=payment.id))

    return render_template(
        "payments/pay.html",
        form=form,
        paybill=SCHOOL_PAYBILL,
        account_number=SCHOOL_ACCOUNT_NUMBER,
        simulated=getattr(get_client(), "_simulated", False),
    )


@payments_bp.route("/confirm/<int:payment_id>")
@login_required
def confirm(payment_id):
    """Status polling page. Refreshes every 4s and stops when the
    payment transitions out of "pending"."""
    payment = Payment.query.get_or_404(payment_id)
    if payment.user_id != current_user.id:
        flash("That payment isn't yours.", "danger")
        return redirect(url_for("results.payment_reminder"))
    return render_template(
        "payments/confirm.html",
        payment=payment,
        paybill=SCHOOL_PAYBILL,
        account_number=SCHOOL_ACCOUNT_NUMBER,
    )


@payments_bp.route("/status/<int:payment_id>")
@login_required
def status(payment_id):
    """JSON endpoint the confirm page polls. Returns payment state."""
    payment = Payment.query.get_or_404(payment_id)
    if payment.user_id != current_user.id:
        return jsonify({"error": "forbidden"}), 403
    return jsonify({
        "id": payment.id,
        "status": payment.status,
        "result_desc": payment.result_desc,
        "mpesa_receipt": payment.mpesa_receipt,
        "fees_cleared": payment.user.fees_cleared,
    })


@payments_bp.route("/manual", methods=["GET", "POST"])
@login_required
def manual():
    """Manual fallback: parent paid to the till directly and submits
    the M-Pesa confirmation code for admin review."""
    form = ManualConfirmForm()

    if form.validate_on_submit():
        payment = Payment(
            user_id=current_user.id,
            amount=form.amount.data,
            phone=normalise_phone(form.phone.data),
            purpose="Term fees (manual — paybill 400222 / acc 369369)",
            status="manual",
            manual_code=form.mpesa_code.data,
            paybill=SCHOOL_PAYBILL,
            account_number=SCHOOL_ACCOUNT_NUMBER,
        )
        db.session.add(payment)
        db.session.commit()
        flash("Thanks — the school office will verify your payment and unlock your results shortly.", "success")
        return redirect(url_for("results.payment_reminder"))

    return render_template(
        "payments/manual.html",
        form=form,
        paybill=SCHOOL_PAYBILL,
        account_number=SCHOOL_ACCOUNT_NUMBER,
    )


@payments_bp.route("/request", methods=["GET", "POST"])
@login_required
@admin_required
def request_payment():
    """Admin-only: fetch a payment from a specific parent's phone.

    This is a "pull" — the business tells M-Pesa to fire a STK Push
    to the parent for a specific amount. Used when:
      - parent asks the school to send them a payment prompt
      - school office is on the phone with the parent
    """
    from .forms import RequestPaymentForm
    form = RequestPaymentForm()

    if request.method == "POST":
        if not form.validate_on_submit():
            return render_template("payments/request.html", form=form)

        parent = User.query.filter_by(email=form.parent_email.data).first()
        if not parent:
            flash(f"No parent found with email {form.parent_email.data}.", "danger")
            return render_template("payments/request.html", form=form)

        try:
            client = get_client()
            account_ref = build_account_reference(parent.full_name, parent.grade)
            result = client.request_payment(
                phone=normalise_phone(form.phone.data),
                amount=form.amount.data,
                account_ref=account_ref,
                description=f"Fees request — {parent.full_name}",
            )
        except Exception as e:
            log.exception("Request payment failed")
            flash(f"Could not send M-Pesa prompt: {e}", "danger")
            return render_template("payments/request.html", form=form)

        payment = Payment(
            user_id=parent.id,
            amount=form.amount.data,
            phone=normalise_phone(form.phone.data),
            purpose=f"Fetch request (admin) — {form.purpose.data}",
            merchant_request_id=result.get("MerchantRequestID"),
            checkout_request_id=result.get("CheckoutRequestID"),
            status="pending",
            result_desc=result.get("CustomerMessage") or result.get("ResponseDescription"),
        )
        db.session.add(payment)
        db.session.commit()

        if result.get("_simulated"):
            payment.mark_succeeded(
                receipt=f"SIM{secrets.token_hex(4).upper()}",
                desc="Simulated request-payment success",
            )
            flash(f"Fetch request sent and confirmed for {parent.full_name}.", "success")
        else:
            flash(f"M-Pesa prompt sent to {parent.full_name}'s phone.", "info")

        return redirect(url_for("payments.confirm", payment_id=payment.id))

    return render_template("payments/request.html", form=form)


@payments_bp.route("/refund", methods=["GET", "POST"])
@login_required
@admin_required
def refund():
    """Admin-only: B2C refund to a parent's phone.

    Used when the school has overcharged a parent or needs to reimburse
    a payment (e.g. activity cancelled). The money is sent from the
    paybill 400222 straight to the parent's M-Pesa.
    """
    from .forms import RefundForm
    form = RefundForm()

    if form.validate_on_submit():
        try:
            client = get_client()
            result = client.b2c_send_money(
                phone=normalise_phone(form.phone.data),
                amount=form.amount.data,
                command_id=form.command_id.data,
                remarks=form.remarks.data,
                occasion=form.remarks.data,
            )
        except Exception as e:
            log.exception("B2C failed")
            flash(f"Could not send refund: {e}", "danger")
            return render_template("payments/refund.html", form=form)

        # In simulated mode, mark the refund as completed immediately
        if result.get("_simulated"):
            flash(f"Refund of KES {form.amount.data} sent to {form.phone.data} (simulated).", "success")
        else:
            flash(f"Refund queued — M-Pesa will deliver to {form.phone.data} shortly.", "info")

        return redirect(url_for("main.index"))

    return render_template("payments/refund.html", form=form)


@payments_bp.route("/b2c/result", methods=["POST"])
def b2c_result():
    """B2C (refund) callback from Daraja.

    Daraja POSTs here when the B2C transaction succeeds or fails.
    We log it; the admin can see refund status from /payments/refund.
    """
    payload = request.get_json(silent=True) or {}
    log.info("M-Pesa B2C result: %s", payload)
    return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200


@payments_bp.route("/b2c/timeout", methods=["POST"])
def b2c_timeout():
    """B2C timeout URL — called by Daraja if the request sits in
    queue too long. Log it and ack."""
    payload = request.get_json(silent=True) or {}
    log.warning("M-Pesa B2C timeout: %s", payload)
    return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200


@payments_bp.route("/sim-guide")
def sim_guide():
    """Serve the printable "How to pay via M-Pesa SIM Toolkit" PDF.

    The file is generated by `app/make_sim_toolkit_pdf.py`. Re-run
    that script whenever the paybill or account number changes.
    """
    from flask import current_app, send_file
    pdf_path = os.path.join(current_app.root_path, "static",
                            "files", "sim-toolkit-guide.pdf")
    if not os.path.isfile(pdf_path):
        return ("SIM toolkit guide not generated yet. "
                "Run: python -m app.make_sim_toolkit_pdf", 404)
    return send_file(
        pdf_path,
        as_attachment=False,         # show in browser
        download_name="dorice-mpesa-sim-guide.pdf",
        mimetype="application/pdf",
    )


@payments_bp.route("/callback", methods=["POST"])
def callback():
    """Daraja STK push callback.

    The Daraja API POSTs the transaction result here. We update the
    Payment row, mark fees_cleared if successful, and return 200 so
    Daraja stops retrying.

    In dev (simulated client) this endpoint is unused; the
    _simulate_completion() background thread flips the status itself.
    """
    payload = request.get_json(silent=True) or {}
    log.info("M-Pesa callback: %s", payload)

    body = payload.get("Body", {}).get("stkCallback", {})
    checkout_id = body.get("CheckoutRequestID")
    result_code = body.get("ResultCode")  # 0 = success

    payment = Payment.query.filter_by(checkout_request_id=checkout_id).first()
    if not payment:
        # Daraja occasionally sends delayed pings; return 200 so they stop
        return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200

    if int(result_code) == 0:
        # Pull the receipt out of CallbackMetadata.Item[]
        receipt = None
        for item in body.get("CallbackMetadata", {}).get("Item", []):
            if item.get("Name") == "MpesaReceiptNumber":
                receipt = item.get("Value")
                break
        payment.mark_succeeded(receipt=receipt, desc="M-Pesa confirmed")
    else:
        payment.mark_failed(desc=body.get("ResultDesc", "Unknown failure"))

    return jsonify({"ResultCode": 0, "ResultDesc": "Accepted"}), 200
