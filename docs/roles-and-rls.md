# Dorice Smart Academy — Roles & Row Level Security (RLS)

> **Motto:** *"Inspire, Achieve, Flourish"*  
> **Privacy Standard:** Kenya Data Protection Act, 2019

---

## 1. Role Definitions

User access is strictly role-governed using the `user_roles` table and Supabase Auth identities. Open registration is disabled; accounts are provisioned exclusively through invitation.

| Role | Target Persona | Scope of Access |
|---|---|---|
| `admin` | Head Teacher / Principal / Systems Administrator | Full management over academic calendar, grade levels, classes, staff assignments, fee structures, results approval/publishing, and audit logs. |
| `bursar` | Accounts Clerk / Finance Office | Fee structure management, invoice generation, manual and M-PESA payment reconciliation, receipts, statements, and financial audit review. |
| `teacher` | Class Teachers & Subject Instructors | Continuous assessment mark entry, learner comments, and performance analytics for **assigned classes and learning areas only**. |
| `guardian` | Parents & Legal Guardians | Family dashboard, fee balance inquiry, M-PESA Paybill 400222 payments, receipt downloads, and published CBC report cards for **own linked children only**. |

---

## 2. Capabilities Matrix

| Capability | `admin` | `bursar` | `teacher` | `guardian` |
|---|---|---|---|---|
| Manage users, academic years, terms, classes | Yes | No | No | No |
| Manage students and guardians | Yes | Read | Read (own classes) | Read (own children) |
| Fee structures, invoices, adjustments | Yes | Yes | No | No |
| Record/reconcile payments | Yes | Yes | No | No |
| View own child's fees & Paybill details | N/A | N/A | N/A | Yes |
| Enter CBC marks & comments | Yes | No | Yes (assigned class/subject) | No |
| Approve & publish term report cards | Yes | No | No | No |
| View published report cards | Yes | No | Own classes | Own children only |
| View system audit log | Full | Finance events | No | No |

---

## 3. RLS Architecture & Security Definer Functions

Every table in PostgreSQL has `ENABLE ROW LEVEL SECURITY;` with a default-deny policy. Data access is enforced through database-level functions:

1. **`has_role(user_id, role)`**: Confirms whether the calling user has the specified role.
2. **`is_admin(user_id)`**: Convenience helper for administrator authorization.
3. **`is_bursar(user_id)`**: Grants finance permissions to bursars and admins.
4. **`is_teacher(user_id)`**: Grants academic permissions to teachers and admins.
5. **`is_guardian_of_student(auth_user_id, student_id)`**: Traverses `student_guardians` and `guardians` to verify parental relationship. Prevents parents from viewing other families' data.
6. **`is_teacher_of_class(auth_user_id, class_id)`**: Verifies class teacher or subject teacher assignment in `classes` or `class_learning_areas`.

---

## 4. Protected Tables (28 Tables Verified)

1. **Core Identity & Organization:** `profiles`, `user_roles`, `academic_years`, `terms`, `grade_levels`, `classes`, `learning_areas`, `class_learning_areas`
2. **People & Enrollments:** `students`, `guardians`, `student_guardians`, `enrollments`
3. **Financial Ledger:** `fee_items`, `fee_structures`, `invoices`, `invoice_lines`, `adjustments`, `payments`, `payment_allocations`, `receipts`
4. **M-PESA Paybill C2B:** `mpesa_transactions`
5. **CBC Academic Assessments:** `grading_schemes`, `grading_bands`, `assessments`, `assessment_scores`, `term_reports`, `term_report_learning_areas`
6. **Governance & Audit:** `settings`, `audit_log`

---

## 5. Verification
Run the automated RLS policy test suite:
```bash
npm run test:rls
```
This tests that all 28 tables have RLS enabled, all helper functions are registered, and isolation policies are in effect.
