# Dorice Smart Academy — School Portal

> **Motto:** *"Inspire, Achieve, Flourish"*  
> **Location:** Kipkaren River, Kenya • P.O. Box 204

A production-quality school portal for **Dorice Smart Academy**, engineered for two core missions:
1. **School Fee Management & Payment:** Invoices, Lipa Na M-PESA STK Push, C2B Paybill/Till integration, automated receipts, statements, and arrears tracking.
2. **Student Grades & Report Cards:** Competency Based Curriculum (CBC) assessment tracking, continuous teacher mark entry, values ratings, and branded PDF report cards.

---

## Quickstart (Under 10 Minutes)

### 1. Prerequisites
- **Node.js**: v20+ (tested on Node v24)
- **npm**: v10+

### 2. Installation
```bash
git clone <repo-url>
cd dorice-smart-academy
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```
Update `.env.local` with your Supabase, Safaricom Daraja, and Resend keys.

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Design System & 60-30-10 Rule

This application strictly implements the **60-30-10 Design Ratio**:
- **60% Dominant Canvas:** Warm cream background (`#F7F0E1`), clean white card bodies, and navy-ink text (`#10243C`).
- **30% Structural Frame:** School Navy (`#123F70`) for header navigation, section headlines, and primary buttons.
- **10% Signature Accent:** Marigold-strong (`#C4530F`) reserved for the single primary call to action per view (*Pay with M-PESA*, *Sign In*).

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

## Key Routes

- `/` — Public Home Page (arch hero, quick facts, our learners, leadership welcome)
- `/about` — Academy Mission, Vision, Core Values, and Staff
- `/gallery` — School Gallery (curated approved photos with DPA 2019 compliance)
- `/contact` — Office Location (Kipkaren River), WhatsApp inquiry, and office hours
- `/privacy` — Statutory Kenya Data Protection Act 2019 compliance notice
- `/login` — Portal Sign-in with blue-plaid panel, demo role selector, and invite-only policy
- `/design/tokens` — Interactive design system inspector, token swatches, and 60-30-10 ratio tester (dev-only)

---

## Documentation

- [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) — Architectural and design decision log.
- [`docs/design-tokens.md`](./docs/design-tokens.md) — Complete token registry, contrast tables, and 60-30-10 review checklist.
- [`dorice-smart-academy-agent-prompt.md`](./dorice-smart-academy-agent-prompt.md) — Master product specification.
