# Dorice Smart Academy — Database Backup & Disaster Recovery Runbook

> **Application:** Dorice Smart Academy School Management Portal  
> **Database Engine:** PostgreSQL 15+ (Hosted on Supabase)  
> **Target RPO (Recovery Point Objective):** < 1 hour  
> **Target RTO (Recovery Time Objective):** < 2 hours

---

## 1. Backup Strategy Overview

Data integrity is mission-critical for Dorice Smart Academy, encompassing financial transactions (Lipa Na M-PESA C2B records, invoices, official receipts) and statutory CBC academic evaluations.

| Tier | Backup Type | Frequency | Retention | Storage Location |
|---|---|---|---|---|
| **Tier 1** | Automated WAL & PITR (Point-in-Time Recovery) | Continuous | 7–30 days (per Supabase plan) | Managed AWS S3 (Multi-AZ) |
| **Tier 2** | Nightly Physical Snapshot | Daily (02:00 EAT) | 30 days rolling | Supabase Managed Infrastructure |
| **Tier 3** | Cold Logical Dump (`pg_dump`) | Weekly / End-of-Term | 7 years (statutory requirement) | Encrypted Cold Storage |

---

## 2. Automated Scheduled Backups (Supabase)

Supabase provides automated database backups natively:
1. Navigate to **Supabase Dashboard** → Select **Dorice Smart Academy** project.
2. Go to **Database** → **Backups**.
3. Daily backups are captured automatically.
4. **Point-in-Time Recovery (PITR):** Enables restoring the database to any specific second within the retention window (vital in the event of an erroneous bulk update or migration failure).

---

## 3. Manual Logical Backup Procedure (`pg_dump`)

Prior to performing major schema migrations, term rollovers, or fee reconciliations, the system administrator must capture a manual logical backup.

### 3.1 Prerequisites
- PostgreSQL client utilities installed (`pg_dump`, `psql`).
- Direct connection string from Supabase:
  `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 3.2 Executing Full Logical Export
Run from a secure, authenticated workstation:

```bash
# Set export timestamp
EXPORT_DATE=$(date +%Y%m%d_%H%M%S)

# Export schema and data (excluding transient internal schemas)
pg_dump \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  -h db.[PROJECT-REF].supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -b \
  -v \
  -f "dorice_backup_${EXPORT_DATE}.dump"
```

### 3.3 Financial Data Integrity Export (CSV Safeguard)
As a supplementary audit precaution at the end of each academic term, export the financial ledger:

```sql
-- In Supabase SQL Editor:
COPY (
  SELECT p.id, p.receipt_number, p.payment_date, p.amount, p.payment_method, 
         p.transaction_reference, s.admission_number, s.first_name, s.last_name
  FROM payments p
  JOIN students s ON p.student_id = s.id
  ORDER BY p.payment_date DESC
) TO STDOUT WITH CSV HEADER;
```

---

## 4. Disaster Recovery & Restoration Drill

A disaster recovery drill must be rehearsed at least once per academic year.

### 4.1 Procedure A: Restoring via Supabase Dashboard (PITR)
1. In the Supabase project dashboard, navigate to **Settings** → **Database** → **Backups**.
2. Select **Point-in-Time Recovery**.
3. Specify the target timestamp immediately preceding the disaster incident.
4. Confirm restoration. The project will enter maintenance mode while the disk image is provisioned.
5. Verify application functionality at `https://doricesmartacademy.sc.ke`.

### 4.2 Procedure B: Restoring to a Fresh Supabase Instance from `pg_dump`
If the primary project is permanently inaccessible:
1. Create a fresh Supabase project in the desired cloud region (e.g. AWS eu-central-1 or af-south-1).
2. Restore the custom roles and extensions:
   ```bash
   pg_restore \
     -h db.[NEW-PROJECT-REF].supabase.co \
     -U postgres \
     -d postgres \
     --clean \
     --if-exists \
     --no-owner \
     --no-privileges \
     -v "dorice_backup_YYYYMMDD_HHMMSS.dump"
   ```
3. Re-run all migrations in order:
   ```bash
   npx supabase db push
   ```
4. Verify RLS policies:
   ```bash
   npm run test:rls
   ```
5. Update Vercel production environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and trigger a production redeploy.
6. Safaricom Daraja Webhook Update: If the API callback URL changes, re-register the C2B Validation and Confirmation URLs with Safaricom.

---

## 5. Verification Checklist Post-Restore

Immediately following database restoration, verify:
- [ ] Administrator sign-in is operational.
- [ ] Guardian portal renders child balance accurately.
- [ ] Most recent M-PESA C2B transactions match Safaricom Daraja Portal statements.
- [ ] Published CBC report cards render with accurate grades and teacher remarks.
- [ ] Audit log reflects the restoration event with timestamp and executor details.
