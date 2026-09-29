# Dorice Smart Academy — Lipa Na M-PESA Go-Live Runbook

This document details the configuration, security, and verification procedures for taking the Safaricom Daraja M-PESA integration live for **Dorice Smart Academy** (Kipkaren River, Kenya).

---

## 1. Architecture Overview

```
Parent / Guardian                Next.js Edge API               Safaricom Daraja Gateway              PostgreSQL (Supabase)
      │                                 │                                 │                                     │
      │── Click "Pay with M-PESA" ─────>│                                 │                                     │
      │   (Amount, Phone, Adm No)       │── POST /api/mpesa/stkpush ─────>│                                     │
      │                                 │   (Encrypted Passkey + Auth)    │                                     │
      │                                 │<── CheckoutRequestID ───────────│                                     │
      │<── "Check Your Phone Prompt" ───│                                 │                                     │
      │                                 │                                 │                                     │
   [Phone displays STK Prompt]          │                                 │                                     │
   [Parent inputs M-PESA PIN] ──────────┼────────────────────────────────>│                                     │
                                        │                                 │                                     │
                                        │<── Webhook POST /api/mpesa/─────│                                     │
                                        │    callback (ResultCode: 0)     │                                     │
                                        │                                 │── Idempotent INSERT ON CONFLICT ───>│
                                        │                                 │   (mpesa_receipt_number)            │
                                        │                                 │── Auto-credit Student Ledger ──────>│
```

---

## 2. Environment Variables Configuration

Set these environment variables in your deployment environment (Vercel, Supabase, or `.env.production`):

```bash
# Safaricom Daraja API Mode: 'sandbox' or 'production'
MPESA_ENVIRONMENT=production

# Safaricom Developer Portal Credentials
MPESA_CONSUMER_KEY=your_production_consumer_key_here
MPESA_CONSUMER_SECRET=your_production_consumer_secret_here

# School Paybill / Shortcode & Online Passkey
MPESA_SHORTCODE=400200
MPESA_PASSKEY=your_live_production_passkey_from_safaricom

# HTTPS Callback URL (Must be publicly accessible and valid SSL)
MPESA_CALLBACK_URL=https://portal.doricesmartacademy.sc.ke/api/mpesa/callback

# Bursar Notification Contact for Unallocated Payments
MPESA_BURSAR_ALERT_PHONE=+254700000000
```

---

## 3. Safaricom Developer Portal Go-Live Steps

1. **Register Organization:**
   - Log in to the [Safaricom Developer Portal](https://developer.safaricom.co.ke/).
   - Create an organization account for *Dorice Smart Academy*.
2. **Apply for Go-Live:**
   - Navigate to **Go-Live** in the portal.
   - Select **Shortcode Type**: `Paybill`.
   - Provide the school's Paybill number, Certificate of Incorporation / School Registration Certificate, and Headteacher / Director identification.
3. **Generate Production Credentials:**
   - Once approved, Safaricom issues:
     - Production Consumer Key & Consumer Secret.
     - Production Passkey (sent via encrypted email/SMS).
4. **Register C2B URLs (for Manual Paybill payments):**
   - Register validation and confirmation URLs:
     - Confirmation URL: `https://portal.doricesmartacademy.sc.ke/api/mpesa/c2b-callback`
     - Response type: `Completed`.

---

## 4. Idempotency & Financial Safety Controls

To comply with Kenyan financial audit standards:
- **Receipt Uniqueness:** The table `mpesa_transactions` enforces a PostgreSQL `UNIQUE (mpesa_receipt_number)`. Safaricom webhooks that replay will be acknowledged with `{ ResultCode: 0 }` but will NOT double-credit the student account.
- **Raw Payload Auditing:** The full raw JSON callback is preserved in `mpesa_transactions.raw_payload` for audit trail preservation.
- **Unallocated Queue:** Any payment made with an invalid or misspelled student admission number is automatically routed to `/staff/bursar/unallocated` where the school bursar can verify bank statements and reassign the credit.

---

## 5. Pre-Flight Verification Checklist

Before announcing online payments to parents:
- [ ] Test STK Push with a KES 10 live transaction using an authorized staff SIM card.
- [ ] Confirm receipt generated and student balance decrements accurately on the portal.
- [ ] Confirm PDF receipt (`RCT-xxxx`) can be generated and downloaded.
- [ ] Verify that an incorrect account reference routes correctly to the Bursar Unallocated Queue.
- [ ] Confirm that cancellation on phone produces a graceful retry prompt without locking the interface.
