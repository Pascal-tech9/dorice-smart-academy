# Dorice Smart Academy — Regulatory Compliance & Data Protection

> **Governing Legislation:** Kenya Data Protection Act, 2019 (DPA 2019)  
> **Regulatory Body:** Office of the Data Protection Commissioner (ODPC), Kenya  
> **School:** Dorice Smart Academy, Kipkaren River, Kenya • P.O. Box 204  
> **Motto:** *"Inspire, Achieve, Flourish"*

---

## 1. Statutory Context & Executive Summary

Dorice Smart Academy acts as a **Data Controller** and **Data Processor** under the Kenya Data Protection Act, 2019 (Act No. 24 of 2019). The school processes sensitive personal data belonging to minors (pupils) and personal data of guardians, teachers, and administrative personnel.

This document establishes the architecture, policy guidelines, technical controls, and operational workflows implemented within the school management system to guarantee compliance with ODPC regulations.

---

## 2. Processing of Personal Data Relating to Children (Section 32)

Under Section 32 of the DPA 2019, personal data relating to children must be processed with heightened safeguards:

1. **Parental / Guardian Consent:**
   - No learner account or record may be processed without verified parental/guardian consent obtained during physical school admission.
   - The digital enrollment record links each learner directly to one or more verified guardians via the `student_guardians` junction table.

2. **Best Interests of the Child:**
   - All academic, behavioral, values assessments, and attendance records are processed solely for educational instruction, progress monitoring, and reporting.
   - Learner data is never monetized, profiled for commercial exploitation, or shared with third-party advertisers.

3. **Appropriate Age-Verification Safeguards:**
   - Direct independent student logins are disabled.
   - Learner academic performance and financial records are accessible exclusively through authenticated, verified guardian accounts.

---

## 3. Photographic Media & Digital Identity Policy

To protect learner privacy and physical security:

1. **Public vs Portal Boundary:**
   - Photographs depicting learners are permitted **strictly and exclusively** on public informational web pages (`/`, `/about`, `/gallery`).
   - Learner photos are **strictly prohibited** inside authenticated portal areas (Guardian portal, Staff portals) as arbitrary decorative elements.
   - Learner avatars in the system default to initials-based SVG badges; personal headshots are never required for system operation.

2. **Marketing Consent Register:**
   - Only photographs with explicit, signed parental media release forms archived in physical admissions files may be published in the public gallery.
   - Any guardian may revoke photographic consent at any time, requiring the school administration to unpublish or blur the learner's image within 7 business days.

3. **No Individual Naming on Public Assets:**
   - HTML `alt` tags and photo captions on public pages must **never** identify pupils by full name, grade level, or admission number (e.g., use `"Dorice Smart Academy learners collaborating during a science lesson"` instead of `"Jane Doe, Grade 4"`).

---

## 4. Technical Data Protection Safeguards

### 4.1 Row-Level Security (RLS) & Default-Deny
- Every database table in PostgreSQL enforces `ENABLE ROW LEVEL SECURITY;`.
- Default behavior without an explicit policy is complete denial of read/write access.
- Security definer helper functions (`is_guardian_of_student()`, `is_teacher_of_class()`, `is_bursar()`, `is_admin()`) cryptographically isolate data by `auth.uid()`.
- **Guardian Isolation Guarantee:** A guardian querying the database can only view their own linked children, invoices, receipts, and published report cards. Cross-family traversal is blocked at the database engine level.

### 4.2 Append-Only Audit Logging
- System administrative operations, grade publishing, invoice modifications, and payment reconciliations write immutable records to the `audit_log` table.
- Client applications are forbidden by RLS from executing `UPDATE` or `DELETE` statements on audit logs.
- Audit records store:
  - Timestamp (UTC)
  - Actor ID (`user_id`)
  - Target table and row identifier
  - Operation type (`INSERT`, `UPDATE`, `DELETE`, `RECONCILE`)
  - Correlation identifier for traceability

### 4.3 Payment & Financial Data Protection
- **No Card or Banking Data Stored:** Credit card numbers and bank credentials are never collected, processed, or stored on school servers.
- **M-PESA C2B Transactions:** Payment processing occurs natively within Safaricom's encrypted network. The school system stores only confirmation metadata (M-PESA receipt number, timestamp, amount, and originating phone number) strictly necessary for receipt issuance and audit reconciliation.
- **Data Minimization:** Originating phone numbers in bursar exports are masked where full numbers are not legally required for reconciliation.

---

## 5. Data Subject Rights & Fulfillment Procedures

Under Part IV of the DPA 2019, guardians and staff members possess the following enforceable statutory rights:

| Right | Description | Fulfillment Mechanism in Dorice Smart Academy Portal |
|---|---|---|
| **Right to Access** (Sec. 26a) | Inquire about personal data held by the school | Guardians can inspect child profiles, enrollments, invoice histories, and CBC assessments on the `/portal` dashboard at any time. |
| **Right to Rectification** (Sec. 26b) | Request correction of inaccurate or incomplete data | Guardians submit profile updates or contact the administration; admins review and commit updates via `/staff/admin/students`. |
| **Right to Erasure** (Sec. 40) | Request deletion of personal data | Handled by School DPO. Subject to statutory educational record retention laws (see Section 6). |
| **Right to Data Portability** (Sec. 38) | Receive data in structured, machine-readable format | Official PDF Report Cards and PDF Fee Statements are downloadable instantly from the portal. |
| **Right to Object** (Sec. 26c) | Object to automated processing or direct communications | Opt-out toggles for SMS reminders and non-statutory email notifications provided in `/portal/profile`. |

---

## 6. Data Retention & Archival Schedule

Educational records in Kenya are subject to statutory retention schedules under the Basic Education Act (No. 14 of 2013) and the Public Archives and Documentation Service Act:

1. **Academic Transcripts & CBC Report Cards:**
   - Retained permanently (or minimum 20 years post-graduation) to allow learners to verify academic credentials and obtain replacement certificates.
2. **Financial Records, Invoices & Receipts:**
   - Retained for a minimum of 7 years in compliance with Kenya Revenue Authority (KRA) and Tax Procedures Act requirements.
3. **M-PESA Raw Callback Payloads:**
   - Active online retention for 24 months, then transferred to encrypted cold backup archives.
4. **Staff Employment Records:**
   - Retained for 7 years following separation of employment.

---

## 7. Data Breach Response Protocol

In the event of a suspected or confirmed security breach affecting personal data:

1. **Identification & Containment (Hour 0–2):**
   - The Systems Administrator immediately revokes compromised API tokens or session keys and isolates affected services.
2. **Impact Assessment (Hour 2–12):**
   - Review Supabase audit logs and connection logs to quantify the breach scope, affected individuals, and compromised data fields.
3. **Statutory Notification to ODPC (Within 72 Hours):**
   - In accordance with Section 43 of the DPA 2019, notify the Data Protection Commissioner where there is a real risk of harm to data subjects.
4. **Data Subject Notification:**
   - Where a breach involves high-risk data (e.g. contact numbers, financial status), notify affected guardians directly via verified email and SMS detailing mitigation steps.
5. **Remediation & Review:**
   - Patch identified vulnerability, conduct full penetration test, and update this compliance record.

---

## 8. Administrative Oversight & Inquiries

For privacy concerns, data subject requests, or regulatory audits:

- **School Administration:** Dorice Smart Academy, Kipkaren River, Kenya
- **Postal Address:** P.O. Box 204
- **Portal Compliance Inquiries:** `privacy@doricesmartacademy.sc.ke`
- **Regulatory Oversight:** Office of the Data Protection Commissioner (ODPC), Nairobi, Kenya (`www.odpc.go.ke`)
