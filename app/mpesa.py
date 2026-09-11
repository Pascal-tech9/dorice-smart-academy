"""Safaricom Daraja M-Pesa STK Push client (Lipa Na M-Pesa Online).

This is the production-shape integration. When MPESA_* env vars are set
the client talks to the real Daraja sandbox/production API. When they
aren't, it falls back to a local "simulated" mode so the rest of the
flow (form, status page, success redirect) still works in dev.

Required env vars in production (set these in your platform dashboard):

    MPESA_CONSUMER_KEY        Daraja app consumer key
    MPESA_CONSUMER_SECRET     Daraja app consumer secret
    MPESA_SHORTCODE           Paybill shortcode (default 400222)
    MPESA_PASSKEY             Daraja Lipa Na M-Pesa passkey
    MPESA_ENVIRONMENT         "sandbox" or "production" (default sandbox)
    MPESA_CALLBACK_URL        Publicly-reachable URL for Daraja to POST
                              the transaction result. In dev you can
                              use a service like ngrok to expose your
                              local server.

Paybill configuration (per the school's requirement):

    Paybill number:  400222
    Account number:  369369

We use the account-number field on the Daraja request to send
"369369#StudentName#Grade" so the school's books show who paid.
"""
import base64
import logging
import time
from datetime import datetime
from typing import Optional

import requests

log = logging.getLogger(__name__)


class MpesaError(Exception):
    pass


class MpesaClient:
    """Lipa Na M-Pesa Online (STK Push) client.

    Usage:
        client = MpesaClient.from_env()
        resp = client.stk_push(
            phone="254712345678",
            amount=1500,
            account_ref="369369#Achieng Atieno#Grade 5",
            description="Term 1 fees — Achieng Atieno",
        )
    """

    SANDBOX_BASE = "https://sandbox.safaricom.co.ke"
    PROD_BASE    = "https://api.safaricom.co.ke"

    def __init__(self, consumer_key, consumer_secret, shortcode,
                 passkey, environment="sandbox", callback_url=None,
                 initiator_name=None, security_credential=None):
        self.consumer_key       = consumer_key
        self.consumer_secret    = consumer_secret
        self.shortcode          = shortcode
        self.passkey            = passkey
        self.environment        = environment
        self.callback_url       = callback_url
        self.initiator_name     = initiator_name
        self.security_credential = security_credential
        self._token = None
        self._token_expiry = 0

    @classmethod
    def from_env(cls):
        """Build a client from environment variables.

        Returns None if the required credentials aren't set — the caller
        can then fall back to simulated mode.
        """
        import os
        consumer_key    = os.environ.get("MPESA_CONSUMER_KEY")
        consumer_secret = os.environ.get("MPESA_CONSUMER_SECRET")
        shortcode       = os.environ.get("MPESA_SHORTCODE", "400222")
        passkey         = os.environ.get("MPESA_PASSKEY")
        environment     = os.environ.get("MPESA_ENVIRONMENT", "sandbox")
        callback_url    = os.environ.get("MPESA_CALLBACK_URL")
        initiator_name  = os.environ.get("MPESA_INITIATOR_NAME")
        security_cred   = os.environ.get("MPESA_SECURITY_CREDENTIAL")

        if not (consumer_key and consumer_secret and passkey):
            return None
        return cls(consumer_key, consumer_secret, shortcode, passkey,
                   environment=environment, callback_url=callback_url,
                   initiator_name=initiator_name,
                   security_credential=security_cred)

    @property
    def base_url(self):
        return self.SANDBOX_BASE if self.environment == "sandbox" else self.PROD_BASE

    def _get_token(self) -> str:
        """OAuth access token; cached for 55 minutes (Daraja tokens last 60)."""
        if self._token and time.time() < self._token_expiry:
            return self._token
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        resp = requests.get(url, auth=(self.consumer_key, self.consumer_secret), timeout=15)
        resp.raise_for_status()
        data = resp.json()
        self._token = data["access_token"]
        self._token_expiry = time.time() + 55 * 60
        return self._token

    def _timestamp(self) -> str:
        return datetime.now().strftime("%Y%m%d%H%M%S")

    def _password(self) -> str:
        """Base64-encoded shortcode + passkey + timestamp."""
        raw = f"{self.shortcode}{self.passkey}{self._timestamp()}"
        return base64.b64encode(raw.encode()).decode()

    def stk_push(self, phone: str, amount: int, account_ref: str,
                 description: str) -> dict:
        """Initiate an STK push.

        phone: in Daraja format, e.g. "254712345678"
        amount: integer KES
        account_ref: short string Daraja stores on the receipt
                      (we use "369369#StudentName#Grade")
        description: shown on the customer's phone prompt
        """
        if not self.callback_url:
            raise MpesaError(
                "MPESA_CALLBACK_URL is not set. Daraja requires a public "
                "URL it can POST the result to."
            )

        token = self._get_token()
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password":          self._password(),
            "Timestamp":         self._timestamp(),
            "TransactionType":   "CustomerPayBillOnline",
            "Amount":            int(amount),
            "PartyA":            phone,
            "PartyB":            self.shortcode,
            "PhoneNumber":       phone,
            "CallBackURL":       self.callback_url,
            "AccountReference":  account_ref,
            "TransactionDesc":   description,
        }
        resp = requests.post(
            url, json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()

    def query_status(self, checkout_request_id: str) -> dict:
        """Check the status of a previously initiated STK push."""
        token = self._get_token()
        url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password":          self._password(),
            "Timestamp":         self._timestamp(),
            "CheckoutRequestID": checkout_request_id,
        }
        resp = requests.post(
            url, json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()

    # ─── B2C (Business → Customer) — refunds, payouts ────────────────────
    def b2c_send_money(self, phone: str, amount: int, command_id: str,
                       remarks: str, occasion: str = "") -> dict:
        """B2C API: business sends money to a customer.

        Common use cases:
          - Refund an overpayment
          - Pay a bursary
          - Reimburse transport / activity fees

        command_id: one of the Daraja enum values:
          "SalaryPayment", "BusinessPayment", "PromotionPayment"
        """
        if not self.callback_url:
            raise MpesaError(
                "MPESA_CALLBACK_URL is not set. Daraja requires a public "
                "URL it can POST the B2C result to."
            )
        if not self.initiator_name or not self.security_credential:
            raise MpesaError(
                "MPESA_INITIATOR_NAME and MPESA_SECURITY_CREDENTIAL must be "
                "set to use B2C. Provision them in the Daraja portal."
            )
        token = self._get_token()
        url = f"{self.base_url}/mpesa/b2c/v1/paymentrequest"
        payload = {
            "InitiatorName":      self.initiator_name,
            "SecurityCredential": self.security_credential,
            "CommandID":          command_id,
            "Amount":             int(amount),
            "PartyA":             self.shortcode,
            "PartyB":             phone,
            "Remarks":            remarks,
            "QueueTimeOutURL":    self.callback_url.replace("/payments/callback", "/payments/b2c/timeout"),
            "ResultURL":          self.callback_url.replace("/payments/callback", "/payments/b2c/result"),
            "Occasion":           occasion or remarks,
        }
        resp = requests.post(
            url, json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        resp.raise_for_status()
        return resp.json()

    # ─── Request payment (alias + docstring for clarity) ─────────────────
    def request_payment(self, phone: str, amount: int, account_ref: str,
                        description: str) -> dict:
        """Request a payment from a customer's phone.

        Thin alias for STK Push — semantically the business is
        "fetching" the payment from the customer's M-Pesa account.
        The customer receives an M-Pesa prompt on their phone, enters
        their PIN, and the money moves.
        """
        return self.stk_push(phone, amount, account_ref, description)

    # ─── Transaction status query ────────────────────────────────────────
    def transaction_status(self, transaction_id: str) -> dict:
        """Query the status of a previously submitted transaction.

        Works for STK Push, C2B, and B2C. transaction_id is the
        daraja receipt / transaction identifier returned in the
        original response.
        """
        if not self.initiator_name or not self.security_credential:
            raise MpesaError(
                "MPESA_INITIATOR_NAME and MPESA_SECURITY_CREDENTIAL must be "
                "set to query transaction status."
            )
        token = self._get_token()
        url = f"{self.base_url}/mpesa/transactionstatus/v1/query"
        payload = {
            "Initiator":          self.initiator_name,
            "SecurityCredential": self.security_credential,
            "CommandID":          "TransactionStatusQuery",
            "TransactionID":      transaction_id,
            "PartyA":             self.shortcode,
            "IdentifierType":     "4",  # 4 = Paybill shortcode
            "ResultURL":          self.callback_url.replace("/payments/callback", "/payments/txstatus/result"),
            "QueueTimeOutURL":    self.callback_url.replace("/payments/callback", "/payments/txstatus/timeout"),
            "Remarks":            "Status check",
            "Occasion":           "Status check",
        }
        resp = requests.post(
            url, json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


def normalise_phone(phone: str) -> str:
    """Normalise a Kenyan phone number to Daraja format 2547XXXXXXXX.

    Accepts: 0712345678, +254712345678, 254712345678
    Returns: 254712345678
    """
    p = phone.strip().replace(" ", "").replace("-", "")
    if p.startswith("+"):
        p = p[1:]
    if p.startswith("0"):
        p = "254" + p[1:]
    if not p.startswith("254"):
        p = "254" + p
    return p


def is_valid_kenyan_phone(phone: str) -> bool:
    """Quick check that a normalised phone looks like 2547XXXXXXXX."""
    p = normalise_phone(phone)
    return len(p) == 12 and p.startswith("2547") and p.isdigit()


# --- Simulated client (used when Daraja credentials aren't set) ---

class SimulatedMpesaClient:
    """In-process M-Pesa simulator for dev / demo / tests.

    Behaves like the real client but never hits the network. STK push
    is treated as immediately successful after a short delay; status
    queries return success. This lets the entire payment flow be
    exercised end-to-end on a machine that doesn't have Daraja access.
    """

    def __init__(self, shortcode="400222", callback_url=None):
        self.shortcode = shortcode
        self.callback_url = callback_url

    @classmethod
    def from_env(cls):
        import os
        return cls(
            shortcode=os.environ.get("MPESA_SHORTCODE", "400222"),
            callback_url=os.environ.get("MPESA_CALLBACK_URL"),
        )

    def stk_push(self, phone, amount, account_ref, description):
        import secrets
        return {
            "MerchantRequestID":  f"sim-mrch-{secrets.token_hex(6)}",
            "CheckoutRequestID":  f"sim-chk-{secrets.token_hex(8)}",
            "ResponseCode":       "0",
            "ResponseDescription":"Success. Request accepted for processing",
            "CustomerMessage":    "Success. Request accepted for processing",
            "_simulated":         True,
        }

    def request_payment(self, phone, amount, account_ref, description):
        """Semantic alias for stk_push — used by the "fetch request for
        money payment" flow (Lipa Na M-Pesa Online)."""
        return self.stk_push(phone, amount, account_ref, description)

    def query_status(self, checkout_request_id):
        return {
            "ResponseCode": "0",
            "ResponseDescription": "The service request has been accepted successfully",
            "_simulated": True,
        }

    def b2c_send_money(self, phone, amount, command_id, remarks, occasion=""):
        import secrets
        return {
            "ConversationID":           f"sim-b2c-{secrets.token_hex(8)}",
            "OriginatorConversationID": f"sim-orig-{secrets.token_hex(8)}",
            "ResponseCode":             "0",
            "ResponseDescription":      "Accept the service request successfully.",
            "_simulated":               True,
        }

    def transaction_status(self, transaction_id):
        return {
            "ResponseCode":        "0",
            "ResponseDescription": "The service request has been accepted successfully",
            "_simulated":          True,
        }


def get_client():
    """Return a real Daraja client if credentials are present,
    otherwise return the simulated client so dev still works.
    """
    c = MpesaClient.from_env()
    return c if c is not None else SimulatedMpesaClient.from_env()


# School's paybill constants — importable from anywhere.
SCHOOL_PAYBILL = "400222"
SCHOOL_ACCOUNT_NUMBER = "369369"


def build_account_reference(student_name: str, grade: str) -> str:
    """Build the AccountReference that goes to Daraja.

    Format: 369369#StudentName#Grade  (so the school can see who paid
    on their Daraja statement).
    """
    name = (student_name or "").strip().replace("#", " ")
    grade = (grade or "").strip().replace("#", " ")
    return f"{SCHOOL_ACCOUNT_NUMBER}#{name}#{grade}"


def parse_account_reference(ref: str):
    """Inverse of build_account_reference — returns (name, grade)."""
    parts = (ref or "").split("#", 2)
    if len(parts) == 3 and parts[0] == SCHOOL_ACCOUNT_NUMBER:
        return parts[1], parts[2]
    return "", ""
