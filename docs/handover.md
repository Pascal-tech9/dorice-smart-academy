# Dorice Smart Academy — Operational Handover & Administration Runbook

> **Recipient:** Dorice Smart Academy Leadership & Administration Team  
> **Location:** Kipkaren River, Kenya • P.O. Box 204  
> **Motto:** *"Inspire, Achieve, Flourish"*  
> **System:** School Management, Fee Collection & CBC Assessment Portal

---

## 1. Executive Summary & Handover Scope

This document provides complete operational procedures for managing Dorice Smart Academy's digital portal. The system is designed to streamline school fee administration through **Safaricom Lipa Na M-PESA Paybill 400222 (C2B)** and automate **Competency Based Curriculum (CBC)** continuous assessment and term reporting.

---

## 2. User Roles & Access Administration

The system employs strict role segregation:

| Role | Operational Scope | Access Route |
|---|---|---|
| **School Administrator** (Head Teacher / Principal) | Academic calendar, classes, learning areas, staff accounts, student admissions, report approval & publishing | `/staff/admin` |
| **Bursar** (Accounts Clerk / Finance) | Fee structures, invoices, payment receipts, M-PESA reconciliation, unallocated queue | `/staff/bursar` |
| **Teacher** (Class & Subject Teachers) | Assessment mark entry, learner values evaluations, descriptive comments | `/staff/teacher/marks` |
| **Guardian** (Parents & Guardians) | Fee balance inquiry, Paybill instructions, receipts, published report cards | `/portal` |

### 2.1 Inviting New Staff or Guardians
1. Navigate to `/staff/admin/users`.
2. Click **Invite User**.
3. Enter the user's official email address and select the appropriate role (`admin`, `bursar`, `teacher`, or `guardian`).
4. An invitation email with a secure setup link will be dispatched via Resend.

---

## 3. Academic Year & Term Setup (Administrator Runbook)

At the commencement of each academic year or term:

1. **Step 1: Activate Academic Term**
   - Go to `/staff/admin` → **Setup Wizard**.
   - Create the new Academic Year (e.g. `2026`).
   - Define Term 1, Term 2, and Term 3 with respective start and end dates.
   - Set the current term active.

2. **Step 2: Review Class & Learning Area Roster**
   - Ensure all CBC grade levels (PP1 through Grade 9) have active classes and allocated class teachers.
   - Confirm learning area allocations for each class.

3. **Step 3: Student Enrollments & CSV Import**
   - For new admissions, go to `/staff/admin/students`.
   - Add students individually or use **Import CSV** using the standard template:
     `admission_number,first_name,last_name,grade_level,guardian_phone,guardian_name`

---

## 4. Financial & Fee Management (Bursar Runbook)

### 4.1 Fee Structure & Term Invoicing
1. Navigate to `/staff/bursar` → **Fee Structures**.
2. Set up standard term fee items (Tuition, Activity, Lunch, Transport, Assessment Materials).
3. Click **Generate Invoices** for the active term. Invoices will automatically be issued to all enrolled students based on their grade level.

### 4.2 Handling M-PESA Paybill Payments (Paybill 400222)
Parents pay directly from their phones via M-PESA Paybill **400222**.

1. **Automatic Processing:**
   - When a parent pays with their child's reference (e.g. `369369#JaneDoe,Grade3`), the system matches the student, applies the payment to their oldest unpaid invoice, and issues an official sequential receipt (`RCT-YYYY-NNNN`).
   - The parent's portal balance updates immediately.

2. **Resolving the Unallocated Queue:**
   - If a parent enters an unparseable or unrecognized account number, the transaction lands in the **Unallocated Queue** (`/staff/bursar` → **M-PESA Queue**).
   - The Bursar reviews the transaction details (phone number, payer name, amount, timestamp).
   - The Bursar clicks **Match Student**, searches for the student by name or admission number, and confirms allocation.
   - The payment is allocated and the receipt is generated retroactively.

### 4.3 Recording Manual Payments
For payments made via cash, direct bank deposit, or cheque:
1. Go to `/staff/bursar` → **Record Payment**.
2. Select the student, enter the amount, payment method, bank transaction slip number, and payment date.
3. Click **Submit & Issue Receipt**. An official PDF receipt is immediately generated.

---

## 5. CBC Assessment & Report Cards (Teacher & Admin Runbook)

### 5.1 Teacher Mark Entry
1. Teachers log in and navigate to `/staff/teacher/marks`.
2. Select the class and learning area.
3. Enter formative assessment ratings and summative scores for each learner.
4. Provide qualitative, constructive teacher comments on learner progress and core competencies.
5. Click **Submit to Head Teacher for Approval**.

### 5.2 Head Teacher Review & Publishing
1. Navigate to `/staff/admin/reports`.
2. Review submitted class assessments.
3. Click **Approve & Publish**.
4. Once published:
   - Automated email notifications are dispatched to guardians.
   - Official branded PDF report cards become downloadable in the Guardian Portal.

---

## 6. System Maintenance & Third-Party Services

| Service | Purpose | Dashboard URL | Key Credentials Location |
|---|---|---|---|
| **Vercel** | Web Application Hosting & Edge Routing | `vercel.com` | Environment Variables in Project Settings |
| **Supabase** | PostgreSQL Database, Auth & Storage | `supabase.com` | Project API Settings |
| **Safaricom Daraja** | Paybill 400222 C2B Gateway | `developer.safaricom.co.ke` | Daraja Portal (C2B App Credentials) |
| **Resend** | Transactional Emails & Notifications | `resend.com` | API Keys & Verified Domain Settings |

### 6.1 Routine Health Checks
- **Weekly:** Check `/staff/bursar` to ensure the Unallocated M-PESA Queue is clear.
- **Monthly:** Verify Supabase automated database backup status in Supabase Dashboard.
- **Term-End:** Export financial ledger backup via pg_dump (see [`docs/backup-and-restore.md`](./backup-and-restore.md)).

---

## 7. Emergency Contacts & Support

- **School System Administrator:** `admin@doricesmartacademy.sc.ke`
- **School Finance Office:** `accounts@doricesmartacademy.sc.ke`
- **Physical Address:** Kipkaren River, Kenya • P.O. Box 204
- **Technical Escalation:** Engineering Pair Programmer Team
