# Dorice Smart Academy — M-PESA Paybill C2B Go-Live Runbook

**Paybill: 400222**
**Method: C2B (Customer to Business) — standard M-PESA Paybill menu**

This document details the configuration, security, and verification procedures for going live with the Safaricom Daraja M-PESA C2B integration for **Dorice Smart Academy** (Kipkaren River, Kenya).

> **No STK Push is used.** Parents pay entirely through the M-PESA menu on their phone. The school's portal receives a webhook callback and automatically reconciles the payment.

---

## 1. How C2B Works (Architecture)

```
Parent / Guardian                    Safaricom                  Dorice SA Portal                Supabase DB
      │                                  │                             │                               │
      │── M-PESA Menu                    │                             │                               │
      │   Paybill → 400222               │                             │                               │
      │   Account: 369369#Name,Grade     │                             │                               │
      │   Amount: KES X                  │                             │                               │
      │   PIN ─────────────────────────>│                             │                               │
      │                                  │── POST /api/mpesa/callback >│                               │
      │                                  │   (Confirmation callback)   │── INSERT mpesa_transactions ─>│
      │                                  │                             │   (idempotent, ON CONFLICT)    │
      │                                  │                             │── Parse account number        │
      │                                  │                             │── Match student               │
      │                                  │                             │── Auto-allocate invoices ────>│
      │                                  │<── { ResultCode: 0 } ───── │                               │
      │<── M-PESA SMS confirmation ──── │                             │                               │
      │   "Confirmed. KES X sent to     │                             │                               │
      │    DORICE SA"                    │                             │                               │
```

---

## 2. Account Number Format

**⚠️ CONFIRM WITH THE SCHOOL BEFORE GO-LIVE**

Current assumption (from the school's brief): `369369#StudentName,Grade`

Examples:
- `369369#JohnDoe,Grade3`
- `369369#FaithWanjiku,PP2`

Alternatives the school may be using:
- Just the **admission number** (e.g. `DSA-2023-001`)
- A **numeric student ID**
- A different prefix than `369369`

The parsing logic in `lib/mpesa/daraja.ts → parseAccountNumber()` handles:
- `369369#Name,Grade` format
- Raw admission number format (`DSA-YYYY-NNN`)

If the format differs, update `parseAccountNumber()` accordingly and note it in `ASSUMPTIONS.md`.

---

## 3. Environment Variables

Set these in Vercel (or `.env.production`):

```bash
# M-PESA Mode: 'sandbox' or 'production'
MPESA_ENVIRONMENT=production

# Safaricom Developer Portal credentials
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret

# Paybill details
MPESA_SHORTCODE=400222
MPESA_PASSKEY=your_live_passkey_from_safaricom

# Unguessable webhook path segment (set on Daraja portal too)
MPESA_CALLBACK_SECRET_PATH=your_unguessable_secret_here

# Initiator credentials (for QueryTransaction reconciliation)
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_SECURITY_CREDENTIAL=your_encrypted_security_credential

# Public site URL (used in reconciliation result URLs)
NEXT_PUBLIC_SITE_URL=https://portal.doricesmartacademy.sc.ke
```

---

## 4. Registering C2B URLs with Daraja

Run this once (or re-run if your domain changes):

```bash
curl -X POST https://portal.doricesmartacademy.sc.ke/api/mpesa/register-c2b-urls \
  -H "x-internal-secret: YOUR_INTERNAL_NOTIFICATION_SECRET" \
  -H "Content-Type: application/json"
```

This registers:
- **Validation URL:** `https://portal.doricesmartacademy.sc.ke/api/mpesa/callback` (GET)
- **Confirmation URL:** `https://portal.doricesmartacademy.sc.ke/api/mpesa/callback` (POST)

Daraja responds with `{ ResponseDescription: "success" }` on success.

---

## 5. Idempotency & Financial Safety

| Control | How it works |
|---|---|
| **Duplicate callbacks** | `mpesa_transactions.receipt_number UNIQUE NOT NULL`. Second INSERT → `ON CONFLICT DO NOTHING`. |
| **Raw payload** | Full JSON saved to `mpesa_transactions.raw_payload` before any processing. |
| **Auto-allocation** | Oldest unpaid invoices first. Overpayment recorded as credit. |
| **Unallocated queue** | Ambiguous or unmatched payments go to `/staff/bursar/unallocated`. Bursar allocates manually. |
| **Reconciliation** | Nightly job at `/api/notifications/fee-reminders` + a separate nightly QueryTransaction sweep catches late callbacks. |

---

## 6. Sandbox Test Procedure

1. Set `MPESA_ENVIRONMENT=sandbox` in `.env.local`
2. Use the Safaricom Sandbox simulator at `https://developer.safaricom.co.ke/`
3. Use test credentials from the sandbox portal
4. Simulate a C2B payment:
   - Business shortcode: `600998` (sandbox Paybill equivalent)
   - Account: `369369#TestStudent,Grade3`
   - Amount: `100`
5. Verify:
   - `mpesa_transactions` row created with `status='received'`
   - Student's invoice `balance_due` decremented
   - `payment_allocations` row created
6. Simulate a duplicate callback → verify no double credit

---

## 7. Go-Live Checklist

Work through this sequentially before announcing Paybill payments to parents:

- [ ] **Paybill credentials** — production Consumer Key, Consumer Secret, and Passkey in Vercel env vars
- [ ] **C2B URLs registered** — run `POST /api/mpesa/register-c2b-urls` and confirm `success` response
- [ ] **Validation URL tested** — Safaricom sends a GET; we respond `{ ResultCode: 0 }` — check Daraja portal logs
- [ ] **Confirmation URL tested** — simulate a payment from the Daraja simulator; check DB row created
- [ ] **Account number format confirmed** — verify with the school the exact format parents should type
- [ ] **Real-phone test** — pay KES 10 from a real Safaricom SIM to Paybill 400222; confirm receipt, DB row, and student ledger update
- [ ] **Reversal** — request reversal of the test payment through Daraja portal; verify unallocated or reversal is handled
- [ ] **Duplicate callback test** — send the same confirmation callback twice; verify no double-credit
- [ ] **Unallocated queue** — pay with a wrong account number (e.g. `WRONGNAME`); verify it appears in `/staff/bursar/unallocated`
- [ ] **Bursar manual allocation** — have the bursar allocate the unallocated payment; verify receipt generated
- [ ] **Reconciliation job** — trigger `/api/notifications/fee-reminders` and confirm it runs without errors
- [ ] **HTTPS** — confirm callback URL is on a valid HTTPS domain (Daraja rejects HTTP)
- [ ] **Bursar training** — primary bursar understands the unallocated queue and knows what to do with unmatched payments
- [ ] **Backup bursar** — at least one more staff member can operate the queue
- [ ] **Parent communication** — send parents the correct Paybill number (400222) and account number format

---

## 8. Ongoing Operations

**Daily:**
- Bursar checks the unallocated queue for any payments needing manual allocation.

**Weekly (automated):**
- Vercel Cron runs `POST /api/notifications/fee-reminders` every Monday 07:00 UTC — sends overdue reminders.

**Nightly (if configured):**
- QueryTransaction sweep reconciles any callbacks that Daraja never delivered.

**Monthly:**
- Compare Daraja transaction report with `mpesa_transactions` table — spot any gaps.

---

## 9. Common Issues

| Issue | Likely cause | Fix |
|---|---|---|
| Callback not arriving | Wrong URL registered / not HTTPS | Re-register URLs; verify SSL cert |
| Payment unallocated (correct student) | Account number format mismatch | Update `parseAccountNumber()` with correct format |
| Double credit | Unique constraint not in DB | Ensure migration `20260929000004` ran; check `receipt_number UNIQUE` |
| Balance not updating | `payment_allocations` row created but `invoices.balance_due` not updated | Check `autoAllocate()` function logs |
| Reconciliation job fails | Missing `MPESA_SECURITY_CREDENTIAL` | Set initiator credential in Vercel env |
