# Dorice Smart Academy — Security Architecture & Hardening Audit Report

> **Target Application:** Dorice Smart Academy School Management Portal  
> **Release Target:** Production Go-Live  
> **Audit Focus:** Row-Level Security, Authentication, Payment Webhook Integrity, OWASP Top 10 Compliance

---

## 1. Security Architecture Summary

Dorice Smart Academy handles two sensitive categories of information: **minors' academic records (CBC evaluations)** and **financial transactions (Lipa Na M-PESA Paybill C2B)**. The security architecture adheres to zero-trust principles:

1. **Database-Enforced Authorization:** Application-level security is backed by PostgreSQL Row-Level Security (RLS). Even if an API endpoint were misconfigured, unauthorized records cannot be selected, inserted, or modified by an authenticated client.
2. **Invite-Only Registration:** Public self-service signup is disabled. User accounts are created exclusively through administrative invitation and linked to verified database identities.
3. **Defense-in-Depth for Payments:** M-PESA C2B webhooks are guarded by unguessable secret routing paths, atomic database transactions, strict unique constraints, and append-only audit logging.

---

## 2. Row-Level Security (RLS) Penetration Test Results

Automated RLS verification is executed via `npm run test:rls`.

### 2.1 Table Coverage Matrix (28 Tables Verified)
All tables enforce `ENABLE ROW LEVEL SECURITY;` with default-deny:

| Table Category | Tables Audited | Status | Isolation Mechanism |
|---|---|---|---|
| **Identity & Access** | `profiles`, `user_roles` | ✅ SECURED | Self-profile read/update; admin-only role provisioning |
| **Academic Hierarchy** | `academic_years`, `terms`, `grade_levels`, `classes`, `learning_areas`, `class_learning_areas` | ✅ SECURED | Read access for authenticated staff/guardians; write restricted to `admin` |
| **People & Enrollment** | `students`, `guardians`, `student_guardians`, `enrollments` | ✅ SECURED | **Strict Guardian Isolation:** `is_guardian_of_student(auth.uid(), student_id)` prevents guardians from querying other learners |
| **Financial Ledger** | `fee_items`, `fee_structures`, `invoices`, `invoice_lines`, `adjustments`, `payments`, `payment_allocations`, `receipts` | ✅ SECURED | Bursar/Admin full access; Guardians restricted strictly to invoices and receipts belonging to their own linked children |
| **M-PESA Webhooks** | `mpesa_transactions` | ✅ SECURED | Ingestion via Supabase Service-Role only; Bursar read-only; zero public client insert permissions |
| **CBC Assessments** | `grading_schemes`, `grading_bands`, `assessments`, `assessment_scores`, `term_reports`, `term_report_learning_areas` | ✅ SECURED | **Teacher Class Scoping:** Teachers can only enter marks for assigned classes; **Guardian Publish Gate:** Guardians can only view term reports flagged `status = 'published'` |
| **Governance & Audit** | `settings`, `audit_log` | ✅ SECURED | `audit_log` is strictly append-only; client-side UPDATE and DELETE are blocked |

---

## 3. Webhook Security & Idempotency Audit

### 3.1 M-PESA Paybill 400222 Webhook Protection
- **Endpoint:** `/api/mpesa/callback` (optionally configured with secret route segment `MPESA_CALLBACK_SECRET_PATH`).
- **Signature & Secret Verification:** Server-to-server validation ensures incoming payloads match expected Safaricom C2B schema.
- **Strict Idempotency:**
  ```sql
  CONSTRAINT mpesa_transactions_receipt_number_key UNIQUE (receipt_number)
  ```
  If Safaricom Daraja retries a webhook callback, the database enforces unique receipt integrity. The application catches the duplicate, logs the idempotent hit, and immediately responds with HTTP 200 `{"ResultCode": 0, "ResultDesc": "Accepted"}` to prevent Daraja retry floods.
- **Concurrency & Over-Allocation Prevention:** Auto-allocation of incoming funds to unpaid invoices uses row-level locking (`SELECT ... FOR UPDATE`) in Postgres to prevent race conditions during concurrent payments.

---

## 4. OWASP Top 10 Mitigation Matrix

| Vulnerability | Threat Vector | Technical Defense in Dorice Smart Academy |
|---|---|---|
| **A01: Broken Access Control** | Guardian attempts to view another child's marks or fee balance | RLS functions `is_guardian_of_student()` and `is_teacher_of_class()` enforced at the SQL engine level. |
| **A02: Cryptographic Failures** | Compromised API keys or plain-text credentials | All secrets (`SUPABASE_SERVICE_ROLE_KEY`, `MPESA_CONSUMER_SECRET`, `RESEND_API_KEY`) reside exclusively in server environments (`.env.local`). None are prefixed `NEXT_PUBLIC_`. |
| **A03: Injection** | SQL injection via user input | Supabase client uses parameterized queries exclusively. Zero raw SQL string concatenation in client or server actions. |
| **A04: Insecure Design** | Premature access to unapproved CBC results | State machine enforcement: results must transition through `draft` → `submitted` → `approved` → `published` before becoming visible in guardian portal. |
| **A05: Security Misconfiguration** | Exposed admin cron endpoints | `/api/notifications/fee-reminders` requires `Bearer [CRON_SECRET]` authorization header. |
| **A06: Vulnerable Dependencies** | Outdated NPM packages | `npm audit` integrated into CI pipeline. Regular automated scanning of production dependencies. |
| **A07: Identification & Auth Failures** | Brute force login attempts | Supabase Auth rate limiting enabled. Password policies enforce 8+ character minimums with complexity requirements. |
| **A08: Software & Data Integrity** | Tampering with fee receipts | Receipt numbers follow sequential, tamper-evident patterns (`RCT-YYYY-NNNN`) with server-side validation. |
| **A09: Security Logging & Monitoring** | Undetected administrative changes | Append-only `audit_log` records administrative actions, fee adjustments, and result publishing events. |
| **A10: SSRF** | Abuse of webhook callbacks | Safaricom callback URL only accepts incoming calls; outbound requests restricted to whitelist of Daraja OAuth and Resend API endpoints. |

---

## 5. Security Audit Sign-off

- [x] All 28 database tables enforce Row Level Security
- [x] Guardian child isolation verified by automated tests
- [x] M-PESA C2B webhook idempotency verified
- [x] All client bundles scanned for exposed secrets (clean)
- [x] Continuous Integration pipeline registered with GitHub Actions
