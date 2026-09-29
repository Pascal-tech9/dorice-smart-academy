# Dorice Smart Academy — School Portal

> **Motto:** *"Inspire, Achieve, Flourish"*  
> **Location:** Kipkaren River, Kenya • P.O. Box 204

A production-quality school portal for **Dorice Smart Academy**, built on Next.js App Router + Supabase, designed for two core missions:

1. **School Fee Management & Paybill Payment:** Invoices, M-PESA Paybill C2B (Paybill **400222**) callbacks, automated matching, receipts, statements, and arrears tracking.
2. **Student Grades & Report Cards:** Competency Based Curriculum (CBC) assessment tracking, teacher mark entry, values ratings, and branded PDF report cards.

---

## Quickstart (Under 10 Minutes)

### 1. Prerequisites
- **Node.js**: v20+ (tested on Node v24)
- **npm**: v10+
- A **Supabase** project (free tier works for dev)

### 2. Installation
```bash
git clone https://github.com/Pascal-tech9/dorice-smart-academy.git
cd dorice-smart-academy
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in:
- **Supabase** URL and keys (from your Supabase project settings)
- **Safaricom Daraja** consumer key, secret, passkey (`MPESA_SHORTCODE=400222`)
- **Resend** API key (for email notifications)

See [`.env.example`](./.env.example) for the full list with descriptions.

### 4. Apply Database Migrations
```bash
# Apply all 6 migrations in order using the Supabase CLI
npx supabase db push

# Or run manually in the Supabase SQL editor (paste each file in order):
# supabase/migrations/20260929000001_initial_schema.sql
# supabase/migrations/20260929000002_fees_and_payments.sql
# supabase/migrations/20260929000003_mpesa_daraja.sql
# supabase/migrations/20260929000004_cbc_assessments.sql
# supabase/migrations/20260929000005_c2b_schema_correction.sql
# supabase/migrations/20260929000006_phase7_hardening.sql
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## M-PESA Payment Method

This school uses **Paybill C2B only** (no STK Push). Parents pay through the standard M-PESA menu:

```
M-PESA → Lipa Na M-PESA → Paybill → 400222
Account Number: 369369#StudentName,Grade   ← confirm format with school
```

The portal receives a webhook callback, parses the account number, matches it to a student, and auto-allocates the payment to their oldest unpaid invoices. Unmatched payments go to a bursar queue.

See [`docs/mpesa-go-live.md`](./docs/mpesa-go-live.md) for the full go-live checklist.

---

## Design System & 60-30-10 Rule

This application strictly implements the **60-30-10 Design Ratio**:
- **60% Dominant Canvas:** Warm cream background (`#F7F0E1`), white card bodies, navy-ink text (`#10243C`).
- **30% Structural Frame:** School Navy (`#123F70`) for headers, section titles, and primary buttons.
- **10% Signature Accent:** Marigold-strong (`#C4530F`) reserved for the single primary CTA per view.

### Design Token Commands
```bash
# Generate tokens CSS and OKLCH scales
npm run tokens:generate

# Export typed tokens for React-PDF & Resend emails
npm run tokens:export

# Run automated token linter (bans raw hex & default Tailwind classes)
npm run tokens:check

# Run WCAG AA contrast verification suite (18 automated checks)
npm run tokens:contrast

# Run complete token test suite
npm run test:tokens
```

---

## Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start development server (with Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run test` | Run all tests |
| `npm run test:tokens` | Run design token test suite |

---

## Key Routes

| Route | Description |
|---|---|
| `/` | Public home page (hero, quick facts, gallery, welcome message) |
| `/about` | Academy mission, values, staff photos |
| `/gallery` | School photo gallery (DPA 2019 compliant) |
| `/contact` | Office location, WhatsApp inquiry, office hours |
| `/privacy` | Kenya Data Protection Act 2019 compliance notice |
| `/login` | Invite-only portal sign-in |
| `/portal` | Guardian home — fee balance, CBC results snapshot |
| `/portal/fees` | Invoices, payment history, receipts |
| `/portal/results` | Term results with CBC star ratings |
| `/portal/profile` | Guardian profile, notification settings, language (EN/SW) |
| `/staff/admin` | Admin setup wizard, student management, reports |
| `/staff/teacher/marks` | CBC mark entry grid per class |
| `/staff/bursar` | Fee collections, manual payments, unallocated M-PESA queue |
| `/design/tokens` | Design system inspector (dev-only) |

---

## User Roles

| Role | Access |
|---|---|
| **Guardian** | Portal only — view own children's fees, results, receipts |
| **Teacher** | Mark entry for assigned classes, view own class analytics |
| **Bursar** | Fee management, M-PESA queue, receipts, statements |
| **Admin** | Full access — setup wizard, users, results publishing, audit log |

---

## Documentation

| File | Description |
|---|---|
| [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) | Architectural decisions and open questions |
| [`docs/design-tokens.md`](./docs/design-tokens.md) | Token registry, contrast tables, 60-30-10 checklist |
| [`docs/mpesa-go-live.md`](./docs/mpesa-go-live.md) | Paybill 400222 C2B go-live checklist |
| [`docs/roles-and-rls.md`](./docs/roles-and-rls.md) | Row Level Security policy documentation |
| [`docs/compliance.md`](./docs/compliance.md) | Kenya DPA 2019 compliance notes |
| [`dorice-smart-academy-agent-prompt.md`](./dorice-smart-academy-agent-prompt.md) | Master product specification |

---

## Security

- All database tables have **Row Level Security (RLS)** enabled.
- No credentials are exposed to the browser — Daraja keys, service-role key, and CRON_SECRET are server-only.
- Audit log is append-only via service-role; no client INSERT is permitted by RLS.
- M-PESA receipt numbers have a `UNIQUE` constraint — duplicate callbacks are silently ignored.
- Cron endpoint (`/api/notifications/fee-reminders`) is secured by `CRON_SECRET` header.
- Notification endpoint is secured by `INTERNAL_NOTIFICATION_SECRET` header.
