# AGENT BRIEF: Dorice Smart Academy School Portal

You are a senior full-stack engineer and product designer. Build a production-quality school portal for **Dorice Smart Academy** (Kipkaren River, Kenya; P.O. Box 204; motto **"Inspire, Achieve, Flourish"**). The portal has two core jobs:

1. **School fee management and payment** (invoices, M-PESA payments, receipts, statements, arrears).
2. **Student grades and report cards** under Kenya's **Competency Based Curriculum (CBC)**.

Work in phases (Section 14). Make sensible decisions yourself and record them in `ASSUMPTIONS.md` instead of stopping to ask. Ask me only if you are truly blocked.

---

## 1. Who uses it and what matters most

- **Parents/guardians** (the main users). Mostly on mid-range Android phones with patchy data. They need to see fee balance, pay with M-PESA in a few taps, get a receipt, and read their child's results. Mobile-first, fast, and simple.
- **Bursar/accounts**: records payments, reconciles M-PESA, issues invoices, applies bursaries/discounts, and prints statements.
- **Teachers**: enter assessment results for their classes/learning areas and write comments.
- **School admin/head teacher**: sets up the year, terms, classes, fee structures and staff; approves and publishes results; sees dashboards.
- **Students** do not log in (primary/junior learners). Their data is accessed through guardian accounts.

Non-negotiables:
- **Money and children's data are handled correctly.** No shortcuts on auth, authorization, idempotency, or audit trails.
- The interface must feel like **this school**, warm, proud and trustworthy, not like a generic SaaS template (Section 3).
- Works well on slow connections and small screens.

---

## 2. Assets provided (`dorice-smart-academy-assets.zip`)

The assets arrive already renamed and organised in `dorice-smart-academy-assets.zip`. Unzip it and place the `public/` folder at the project root so the files land at the paths below. Do not rename them again. Optimise with `next/image` (WebP/AVIF, responsive `sizes`, blur placeholders). Write meaningful `alt` text describing the scene. Do not name or identify individuals in alt text.

| Path (under project root) | Content | Use |
|---|---|---|
| `public/brand/dorice-logo-badge-on-orange.jpg` | School badge logo (arched crest, open teal book, five stars, cream ring on textured orange background). Tagline "Inspire, Achieve, Flourish" | Brand source. Crop the badge out for the header, favicon, PDFs. See note below. |
| `public/photos/preprimary-children-red-sweaters.jpg` | Pre-primary children in red sweaters, hands raised, in front of the admin block, with a teacher | Landing hero option, login page art |
| `public/photos/primary-pupils-navy-uniforms.jpg` | Primary pupils in navy uniforms waving in front of the admin block | Landing page, "Our learners" section |
| `public/photos/junior-pupils-blue-plaid-uniforms.jpg` | Older pupils in blue-plaid uniforms posing in front of the admin block | About/gallery, "Junior school" section |
| `public/photos/teaching-staff-group.jpg` | Teaching staff group photo in front of the admin block | About/"Our team" |
| `public/photos/leadership-portrait-at-desk.jpg` | Portrait of a woman seated at a desk with a nameplate reading "D. A. Chapia" | Placeholder for a leadership/welcome message. **Confirm her name, title and consent with the school before publishing anywhere.** |

Notes:
- The logo is a raster on a textured orange background. Crop the badge from `dorice-logo-badge-on-orange.jpg`, and generate a transparent PNG for now (save it as `public/brand/dorice-logo-badge.png`). Add a `TODO` to request a vector (SVG) or transparent master from the client. Never stretch or recolour the badge.
- These are WhatsApp-compressed images. Do not upscale them. Use them at or below native size, and note in `ASSUMPTIONS.md` that higher-resolution originals should be requested.
- Photos show children. Use them only on public pages the school has approved. **Never** show them inside authenticated areas as decoration, and never expose learner photos or details publicly.

---

## 3. Brand and design system

### 3.1 Palette (sampled from the logo and school photos)

The palette comes from what is actually on the school's walls, uniforms and crest. Values were picked by eye, so **verify with an eyedropper against the assets and adjust to match** before locking them.

| Token | Hex (approx.) | Where it comes from | Role |
|---|---|---|---|
| `navy` | `#123F70` | Crest ring and tagline lettering | Primary (the 30%): headings, nav, primary buttons, table headers |
| `marigold` | `#E8681C` | The orange backdrop of the logo | Signature accent (the 10%): the key call-to-action, highlights, badges, star fills |
| `marigold-strong` | `#C4530F` | Darkened marigold | Orange buttons/links **with white text** (passes AA) |
| `school-red` | `#C8282D` | "DORICE SMART ACADEMY" lettering; the red sweaters | Supporting: danger, destructive actions, overdue states, small brand marks |
| `teal` | `#1799B0` | The open book and stars | Supporting: info, charts, small decorative touches |
| `teal-strong` | `#0E7C91` | Darkened teal | Teal text/links/buttons (passes AA) |
| `cream` | `#F7F0E1` | The crest's cream fill | Page and card surface (replaces stark white) |
| `chalk-butter` | `#F3E9B8` | The admin block's painted wall | Soft highlight panels, callouts, selected rows |
| `uniform-blue` | `#3B5FB4` | The blue-plaid school uniform | Plaid pattern, links on dark surfaces, chart series |
| `flag-green` | `#1E7B45` | Kenyan flag stripes painted on the wall; the surrounding eucalyptus | Success, "Paid", "Exceeding" |
| `peach` | `#F2C7A0` | The hands on the crest | Avatars, illustration fills, soft accent |
| `ink` | `#10243C` | Navy-tinted near-black | Body text (never pure black) |

Build full 50 to 950 scales for `navy`, `marigold`, `teal`, `red` and `green` from these anchors (use OKLCH interpolation). These are primitives: feature code reaches them only through the semantic tokens in Section 3.1b.

Also add a **`gold`** scale anchored on `chalk-butter` (e.g. `gold-100 #F3E9B8`, `gold-700 #8A6A00`). It is the **warning** colour, so warnings are never confused with the marigold call-to-action accent.

### 3.1a The 60-30-10 rule (mandatory)

Apply the 60-30-10 rule to every screen, PDF and email so the product looks balanced and unmistakably Dorice:

| Share | Role | Colour | Where it appears |
|---|---|---|---|
| **60%** | Dominant / neutral | `cream` page background, `white` cards, `ink` text, soft `cream` borders | Page backgrounds, cards, tables, forms, long-form text, most of the report card |
| **30%** | Secondary / structure | `navy` | App shell and navigation, page/section headings, primary buttons, table headers, the plaid header band, footers, links on light surfaces |
| **10%** | Accent / attention | `marigold` (use `marigold-strong` for filled controls with white text) | The single most important action per view (for example **Pay with M-PESA**), active-nav indicator, key highlights and badges, star fills, focus ring |

Discipline that makes the rule work:
- **Everything else is supporting cast and shares the 10% budget with marigold.** `teal`, `uniform-blue`, `school-red`, `flag-green`, `gold` and `peach` appear only as semantic status colours, chart series, small illustration fills and icons, never as large surfaces or backgrounds.
- **One accent-filled button per view.** All other buttons are navy (primary), outline or ghost.
- **No large marigold, red or teal areas.** No full-width orange bands or orange page backgrounds. Photos and cream carry the warmth instead.
- Marketing pages follow the same ratio. The hero is a photo on cream with navy text and one accent button.
- Provide a `/design/tokens` route (development only, excluded from production builds) that shows every swatch, the semantic mapping, contrast results, and sample screens, so the ratio can be reviewed by eye. Add a "60-30-10 review" checklist to `docs/design-tokens.md` and tick it for each phase.

### 3.1b Colour tokens (implementation)

Use a **three-tier token system**, defined once in CSS and consumed everywhere else. This is what makes theming, rebranding and the ratio rule enforceable.

**Tier 1: primitive tokens** (raw scales, never used directly in components)
- `--navy-50 ... --navy-950`, `--marigold-50 ... --marigold-950`, `--teal-*`, `--red-*`, `--green-*`, `--gold-*`, `--blue-*` (uniform blue), `--cream-*`, `--ink-*`, plus `--peach-500`.
- Generate the scales from the anchor hexes in the table above using OKLCH interpolation, and commit the generator script (`scripts/generate-palette.ts`) so anchors can be adjusted after eyedropper verification.

**Tier 2: semantic tokens** (the only colours components may reference)
- Surfaces (the 60%): `--color-bg`, `--color-surface`, `--color-surface-muted`, `--color-surface-highlight` (butter tint), `--color-border`, `--color-border-strong`.
- Text: `--color-text`, `--color-text-muted`, `--color-text-inverse`, `--color-link`, `--color-link-hover`.
- Structure (the 30%): `--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-primary-fg`, `--color-primary-soft`, `--color-nav-bg`, `--color-nav-fg`, `--color-table-header-bg`, `--color-table-header-fg`.
- Accent (the 10%): `--color-accent`, `--color-accent-hover`, `--color-accent-active`, `--color-accent-fg`, `--color-accent-soft`, `--color-focus-ring`.
- Status, each with `-solid`, `-soft` (background), `-border` and `-fg` variants: `--color-success-*` (green), `--color-warning-*` (gold), `--color-danger-*` (red), `--color-info-*` (teal).
- Data visualisation: `--chart-1 ... --chart-6` in this order: navy, teal, marigold, uniform-blue, green, red. Charts also use direct labels or patterns so colour is never the only cue.
- CBC performance levels: `--level-ee`, `--level-me`, `--level-ae`, `--level-be` (mapped to green, teal, gold, red), each with `-soft` and `-fg`, always displayed with the text code and stars.

**Tier 3: component tokens** (optional, only where a component needs its own knob), e.g. `--button-accent-bg: var(--color-accent)`, `--chip-paid-bg: var(--color-success-soft)`.

Implementation requirements:
1. **Single source of truth:** `app/tokens.css` holds Tier 1 and Tier 2 as CSS custom properties. Expose them to Tailwind v4 through `@theme` so utilities such as `bg-bg`, `bg-surface`, `text-text`, `bg-primary`, `text-primary-fg`, `bg-accent`, `border-border`, `bg-success-soft` exist. Do **not** expose the raw primitive scales as utilities (`bg-navy-700` must not be available in feature code). Only semantic names are exposed.
2. **shadcn/ui** variables (`--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--destructive`, `--ring`, `--border`, `--muted`, etc.) are mapped onto the semantic tokens. Do not leave shadcn's default greys or blues in place.
3. **Enforcement:** add lint rules (Stylelint and ESLint, with `eslint-plugin-tailwindcss` or an equivalent custom rule) that **fail CI** on raw hex/rgb/hsl values, arbitrary Tailwind colour values (`bg-[#...]`), and Tailwind default palette classes (`bg-blue-500`, `text-gray-700`, etc.) anywhere outside `app/tokens.css` and the palette generator. Add a test that fails if a component imports a primitive token.
4. **One source for non-CSS surfaces:** a script (`scripts/export-tokens.ts`) generates `lib/tokens.generated.ts` from `tokens.css`, so **react-pdf** documents (receipts, statements, report cards), email templates (Resend) and chart libraries use the same values. No hand-copied hex codes.
5. **Theming safety:** keep tokens swappable at `:root` level so a future dark mode or a rebrand is a token change, not a component rewrite. Dark mode is **out of scope** for the first release, but do not block it: never hardcode `white` or `black`.
6. **Print:** define a `@media print` token override so statements and report cards print correctly in greyscale-friendly contrast (navy headings, no coloured fills beyond thin borders and stars).
7. **Documentation:** `docs/design-tokens.md` lists every token with its value, purpose, allowed usage and a "do / don't" example, plus the contrast table and the 60-30-10 checklist.

**Accessibility:** run automated contrast checks on every foreground/background token pair that the semantic mapping allows (a script that fails CI below thresholds) and record results in `docs/design-tokens.md`. Target WCAG AA (4.5:1 body, 3:1 large text and UI components). White text on plain `marigold` or plain `teal` fails, so filled buttons and small text use the `-strong` variants (or navy text on marigold). Never use colour alone to convey state (always add a label or icon).

### 3.2 Personal touches (use with restraint)

- **The arch.** The crest is an arch over a circle. Echo it in avatar frames, hero image masks (rounded-top "arch" crops), section dividers and the login card.
- **Five stars = performance.** Use star icons to visualise CBC levels (Section 7): EE ★★★★, ME ★★★, AE ★★, BE ★. Always include the text code beside the stars.
- **Blue plaid.** Create a subtle plaid pattern (CSS gradients, no image) from `uniform-blue` at 5-8% opacity for the report card header and the login side panel.
- **Warm cream, not clinical white.** Cards sit on cream with soft navy-tinted shadows.
- **Motto.** "Inspire, Achieve, Flourish" appears in the footer, login screen and printed documents.
- Keep motion light (short fades/slides). Respect `prefers-reduced-motion`.

### 3.3 Typography

- Body and UI: **Lato** (400/700/900), loaded with `next/font` (self-hosted). It is openly licensed and highly legible on small screens.
- Display accents (hero headline, report card title, empty states): **Fredoka** (Google Fonts via `next/font`), used sparingly for a friendly school feel.
- Do **not** use proprietary or system-only fonts (for example Chalkduster). Everything must be self-hosted and openly licensed.
- Scale: fluid type using `clamp()`. Headings weight 800-900, line-height 1.2; h3/h4 line-height 1.3; body 16-18px, line-height 1.6. Use tabular numbers for all money and marks.

### 3.4 Shape, spacing, components

- Radii: cards 12px, inputs/buttons 10px, pills 9999px, avatars in arch or circle.
- Content width 1080px, wide layouts 1360px. Dashboards use a 12-column grid.
- Build a component library on **shadcn/ui** (Radix primitives), themed to the tokens above: Button (primary/accent/outline/ghost/destructive), Input, Select, Combobox, DatePicker, Tabs, Dialog/Sheet, Toast, DataTable (TanStack Table with sorting, filters, pagination, CSV export), Badge/Chip, Stat card, Empty state, Skeletons, Stepper, and Money/Amount display.
- Status chips use semantic tokens only: Paid (`success`), Partial (`warning`, gold), Unpaid (navy outline, `primary`), Overdue (`danger`), Credit/overpaid (`info`). Each has an icon and text.
- Forms use React Hook Form + Zod with inline, plain-language errors.
- Touch targets at least 44px. Numeric keypad for amount and phone fields (`inputMode="numeric"`).

---

## 4. Type, spacing and layout scales

Define these once as design tokens (alongside the colour tokens in Section 3.1b) so every screen shares the same rhythm.

**Type scale (fluid, using `clamp()`):**

| Token | Size |
|---|---|
| `text-xs` / `text-small` | 12px / 13px |
| `text-sm` | clamp(14px, 0.875rem + ..., 16px) |
| `text-base` | clamp(16px, 1rem + ..., 18px) |
| `text-lg` | clamp(18px, 1.125rem + ..., 24px) |
| `text-xl` | clamp(23px, 1.438rem + ..., 35px) |
| `text-2xl` (hero/page title) | clamp(33px, 2.063rem + ..., 50px) |
| `text-price` (fee balance, amounts) | clamp(27px, 1.688rem + ..., 35px) |

Headings: h1-h3 weight 900 (Lato Black), h4 weight 700. Line-height 1.2 for h1/h2, 1.3 for h3/h4, 1.6 for body. Money and marks use tabular figures.

**Spacing scale (fluid steps):** 0.2rem, 0.44rem, 0.8rem, then fluid steps `clamp(.8rem, .8rem + (1vw - 0.48rem), 1.4rem)`, `clamp(1.1rem, ..., 2.4rem)`, `clamp(1.4rem, ..., 2.8rem)`, `clamp(2.5rem, 8vw, 4rem)`, `clamp(3.75rem, 10vw, 7rem)`. Expose as spacing tokens and use them for section padding and gaps instead of ad-hoc values.

**Layout widths:** content width 1080px, wide layouts 1360px (dashboards may go full-bleed inside the app shell). Radii follow Section 3.4.

**Reusable UI patterns to build:**
- An **outline button** variant (navy border, transparent fill) for secondary actions.
- **Check-list bullets** (a small tick icon in `success`) for fee inclusions, feature lists and onboarding checklists.
- A **tabbed panel** component (tabs on desktop, select on mobile) for dashboards and the report-card term switcher.
- Card, stat-card and highlighted callout patterns on the `surface` / `surface-highlight` tokens.

---

## 5. Stack and architecture (decided; do not re-litigate)

- **Next.js** (App Router, latest stable) + **TypeScript** in strict mode.
- **Tailwind CSS v4** (CSS-first `@theme`; if the scaffold yields v3, use `tailwind.config` instead) + shadcn/ui.
- **Postgres via Supabase**. Schema managed with **Supabase CLI SQL migrations** (committed). Generate types with `supabase gen types typescript`. No second ORM.
- **Auth: Supabase Auth** (do not build auth yourself). Chosen over Auth.js because Row Level Security uses the same identity. Email + password and magic link; accounts are **invited/created by the school** (no open sign-up). Phone OTP is a later phase.
- **Storage: Supabase Storage** with private buckets and signed URLs (payment proof uploads, generated PDFs, teacher/staff files). A public bucket only for approved brand imagery.
- Server-side mutations via **Server Actions / Route Handlers** with Zod validation. Use `@supabase/ssr` for cookie sessions. The **service-role key is used only in server code** (webhooks, jobs), never in the browser.
- **PDFs** (receipts, statements, report cards): `@react-pdf/renderer`, with the crest, palette and motto.
- **Email**: Resend. **SMS** (fee reminders, receipt confirmations): Africa's Talking, behind an interface so it can be swapped or disabled; feature-flagged and off by default.
- **Hosting**: Vercel (app) + Supabase. Prefer the Supabase region closest to Kenya (e.g. `af-south-1`) if available. Use environment-specific config, `.env.example`, and never commit secrets.
- **Testing**: Vitest (unit), Playwright (critical flows), plus **database-level RLS tests** (pgTAP or scripted checks) proving one parent cannot read another family's data.
- **i18n-ready** (`next-intl`): English now, Kiswahili strings structured for phase 2.
- **PWA-installable** (manifest, icons from the crest, sensible caching of static assets only, never cache financial data).
- Observability: structured logging, optional Sentry, and an `audit_log` table (Section 9).

---

## 6. Roles and permissions

Roles: `admin`, `bursar`, `teacher`, `guardian`. Store in a `user_roles` table. Enforce with **RLS**, not only in UI code.

| Capability | admin | bursar | teacher | guardian |
|---|---|---|---|---|
| Manage users, year/terms, classes | yes | no | no | no |
| Manage students and guardians | yes | read | read (own classes) | read (own children) |
| Fee structures, invoices, adjustments | yes | yes | no | no |
| Record/reconcile payments | yes | yes | no | no |
| View own child's fees, pay via M-PESA, download receipts | n/a | n/a | n/a | yes |
| Enter marks/comments | yes | no | yes (assigned class + learning area only) | no |
| Approve/publish results | yes | no | no | no |
| View published results/report cards | yes | no | own classes | own children only |
| Audit log | yes | read (finance) | no | no |

Guardians can be linked to several children (siblings) and a child can have several guardians. A guardian sees a **family dashboard** with a switcher per child.

---

## 7. CBC academic module

Kenya's CBC structure (make all of this **configurable data, not hardcoded**, and confirm with the school which levels it actually runs):

- Pre-Primary (PP1, PP2), Lower Primary (Grade 1-3), Upper Primary (Grade 4-6), Junior School (Grade 7-9). Support Senior School (Grade 10-12) as configurable but off by default.
- **Learning areas** per level (seed sensible defaults, admin-editable), for example: Pre-Primary (Language, Mathematical, Environmental, Psychomotor & Creative, Religious activities); Lower Primary (Literacy, Kiswahili, English, Mathematical, Environmental, Hygiene & Nutrition, Religious Education, Movement & Creative); Upper Primary (English, Kiswahili, Mathematics, Science & Technology, Social Studies, Agriculture & Nutrition, Religious Education, Creative Arts, Physical & Health Education); Junior School (English, Kiswahili, Mathematics, Integrated Science, Health Education, Pre-Technical Studies, Social Studies, Religious Education, Business Studies, Agriculture, Life Skills, Sports & PE, Creative Arts).
- **Performance levels** (seed defaults; make the grading scheme configurable per level and versioned): the four levels **EE** (Exceeding Expectations), **ME** (Meeting), **AE** (Approaching), **BE** (Below), with the common 8-point sub-scale (EE1, EE2, ME1, ME2, AE1, AE2, BE1, BE2) and configurable percentage bands and points. **Confirm the exact bands with the school** and note them in `ASSUMPTIONS.md`.
- **Assessment types**: continuous/school-based assessments (SBA) and end-of-term exams, each with a configurable weighting. A term result per learning area is computed from the weighted components.
- Also capture on the report card: **core competencies** and **values** ratings, attendance summary, class teacher and head teacher comments, and next-term dates (all configurable sections).

Teacher workflow: select class -> learning area -> assessment -> enter marks in a fast spreadsheet-like grid (keyboard navigation, autosave drafts, validation, CSV import/export). Status flow: `draft -> submitted -> approved -> published`. Only **published** results are visible to guardians. Edits after publishing create an audited revision.

Report cards: per learner per term, generated on demand as a branded PDF (crest, plaid header, motto, star indicators plus EE/ME/AE/BE text, comments, signatures area) and viewable on mobile. Provide class summaries and per-learning-area analytics for admin/teachers (distribution by level, term-over-term trend).

**Fee-clearance gate:** provide a setting "require cleared fees before guardian can view report card". Default **off**, and document that it is a school policy decision.

---

## 8. Fees and M-PESA module

Fee setup:
- Per academic year and term, per grade level: fee items (tuition, transport, lunch, boarding if any, uniform, activity fees, etc.), each optional/mandatory, with amounts.
- Student-level adjustments: bursary, sibling discount, waiver, scholarship, late fee, with reason and approver (audited).
- **Invoices** are generated per student per term from the structure, plus adjustments. Balances carry forward as **arrears** across terms.
- Money is stored as **integer minor units** (KES cents) or `numeric(12,2)`, never floats. Display with `Intl.NumberFormat('en-KE', {style:'currency', currency:'KES'})`.

Payment channels:
1. **M-PESA STK Push (Daraja / Lipa Na M-PESA Online)**: guardian enters a phone number (default from profile) and amount, gets the prompt on their phone, and the UI polls/subscribes (Supabase Realtime) for confirmation.
2. **M-PESA Paybill/Till (C2B)**: parents can also pay from the M-PESA menu using the **student's admission number as the account number**. Register C2B validation/confirmation URLs and auto-match by admission number.
3. **Manual entries by bursar**: cash, bank deposit, cheque, with optional proof upload to Supabase Storage.

Correctness rules (critical):
- Callbacks/webhooks are **idempotent**: `MpesaReceiptNumber` / transaction id has a **unique constraint**; replays never double-credit.
- Webhook endpoints respond `200` quickly, verify shape with Zod, use an unguessable secret path segment, and do heavy work after storing the raw payload in `mpesa_transactions` (keep the raw JSON).
- A **reconciliation job** queries Daraja's Transaction Status API for pending STK requests after a timeout and marks them `succeeded/failed/cancelled`.
- Unmatched C2B payments (wrong/unknown account number) land in an **"unallocated payments"** queue the bursar can allocate manually.
- Allocate payments to invoices oldest-first by default (configurable); support overpayment as **credit**.
- Every payment produces a numbered **receipt** (sequential, per-year, no gaps), PDF-downloadable and emailable/SMS-able.
- Provide **statements** (per student, date range) and a **fee-collection dashboard** (collected vs expected per class/term, top arrears, daily M-PESA feed) with CSV export.
- All Daraja credentials live in server env vars. Sandbox vs production selectable by env. Never expose keys to the client. Include a **sandbox test harness** and a documented go-live checklist (Paybill/Till, shortcode, passkey, callback URLs on HTTPS).
- Optional reminders (email/SMS) for upcoming and overdue balances, feature-flagged.

---

## 9. Data model (starting point; refine as needed, all in migrations)

`profiles`, `user_roles`, `academic_years`, `terms`, `grade_levels`, `classes` (streams), `learning_areas`, `class_learning_areas` (with assigned teacher), `students` (admission_number unique, status), `guardians`, `student_guardians` (relationship, is_primary, can_pay), `enrollments` (student, class, year), `grading_schemes`, `grading_bands`, `assessments`, `assessment_scores`, `term_results`, `competency_ratings`, `report_cards` (status, published_at, pdf_path), `comments`, `fee_items`, `fee_structures`, `invoices`, `invoice_lines`, `adjustments`, `payments`, `payment_allocations`, `mpesa_transactions` (raw payload, checkout_request_id, receipt no unique), `receipts`, `notifications`, `files` (Storage metadata), `audit_log` (who, what, before/after, when, ip), `settings`.

Requirements:
- Foreign keys, check constraints, indexes on all lookup paths, `created_at/updated_at`, soft-delete for people/records where sensible.
- **RLS on every table**, default-deny. Write and test policies for each role (Section 6). Guardians reach data only via `student_guardians`. Teachers only via `class_learning_areas` assignment.
- Database views/functions for balances and term results so numbers have one source of truth.
- Provide `supabase/seed.sql` (or a seed script) creating: one academic year with 3 terms, grade levels, learning areas, a grading scheme, sample fee structure, demo staff of each role, and ~20 fake students with guardians. **Fake data only.**

---

## 10. Security and privacy

- Children's data is sensitive. Kenya's **Data Protection Act, 2019** applies: collect only what is needed, define retention, allow correction requests, and note in `docs/compliance.md` that the school (as data controller) should register with the ODPC and hold consent records. Provide a privacy notice page.
- Strong session handling, rate limiting on login and payment endpoints, CSRF-safe mutations, strict input validation, security headers/CSP, no PII in logs, secrets only in env.
- Invite-only onboarding with password reset and optional guardian phone verification later.
- Audit logging for all money movement, adjustments, results edits/publishing and role changes.
- Backups: document Supabase backup/restore steps; add a data export for the school.
- Storage buckets private by default with signed, expiring URLs.

---

## 11. Pages and routes

Public (light, on-brand marketing):
- `/` Home (hero with an arch-cropped school photo, motto, "Parent Login" CTA, quick facts), `/about` (welcome message placeholder, staff photo), `/gallery`, `/contact` (P.O. Box 204 Kipkaren River, form or WhatsApp link, map placeholder), `/privacy`, `/login`.

Guardian portal (`/portal`):
- Family dashboard (child switcher, fee balance card with a big **Pay with M-PESA** button, latest results snapshot)
- `/portal/fees` (invoices, payments, statements, receipts) and a pay flow
- `/portal/results` (term picker, per-learning-area levels with stars, comments, report card PDF download)
- `/portal/profile`

Staff (`/staff`):
- Teacher: my classes, mark entry grid, comments, class analytics.
- Bursar: collections dashboard, invoices, record payment, unallocated M-PESA queue, adjustments, statements, reports.
- Admin: setup wizard (year/terms/classes/learning areas/grading scheme/fee structure), users and roles, students and guardians (with CSV import), results approval/publishing, audit log, settings.

Global: role-aware navigation, empty and error states with helpful copy, toasts, loading skeletons, breadcrumbs, and a print stylesheet for statements/receipts.

---

## 12. UX and quality bar

- **Mobile first.** Test at 360px width. Bottom-sheet pay flow on phones. Large, clear balance and status.
- Plain, kind language ("You have KES 12,500 to pay this term"). Avoid jargon.
- Performance: Lighthouse mobile >= 90 on public pages; keep JS bundle small; server components by default; lazy-load heavy client widgets (mark grid, charts).
- Accessibility: WCAG 2.2 AA, keyboard navigable, visible focus rings (marigold-strong), labelled inputs, `aria-live` for payment status.
- Empty/edge cases: no invoices yet, unpublished results, failed or cancelled STK push, duplicate callbacks, partial payments, sibling accounts, term rollover.
- Error handling: never show raw errors to users. Log with correlation ids.

---

## 13. Repo hygiene and documentation

- Clear folder structure (`app/`, `components/`, `lib/`, `server/`, `supabase/migrations/`, `docs/`), ESLint + Prettier, strict TS, absolute imports, commit-ready scripts (`dev`, `build`, `lint`, `test`, `db:reset`, `db:types`).
- Deliver: `README.md` (setup in under 10 minutes), `.env.example`, `ASSUMPTIONS.md`, `docs/design-tokens.md` (tokens, contrast table, 60-30-10 checklist), `docs/mpesa-go-live.md`, `docs/compliance.md`, `docs/roles-and-rls.md`.
- CI (GitHub Actions): typecheck, lint, unit tests, migration check.

---

## 14. Delivery phases (complete, verify, then move on)

0. **Foundations**: scaffold, three-tier colour tokens (`app/tokens.css`, palette generator, token export script), Tailwind `@theme` wiring, shadcn variables mapped to semantic tokens, lint rules banning raw colours, fonts, logo/photos processed, dev-only `/design/tokens` page, design-tokens doc with contrast report and 60-30-10 checklist, layout shells, public home page.
1. **Auth and setup**: Supabase project wiring, invite-only auth, roles, RLS scaffolding + tests, admin setup wizard (year, terms, grade levels, classes, learning areas).
2. **People**: students, guardians, links, enrollments, CSV import, guardian family switcher.
3. **Fees (manual first)**: fee structures, invoices, adjustments, manual payments, allocation, receipts (PDF), statements, bursar dashboard.
4. **M-PESA**: STK Push, C2B, callbacks, idempotency, reconciliation, unallocated queue, sandbox harness, go-live doc.
5. **CBC results**: grading schemes, assessment setup, mark-entry grid, term results, comments, approval/publish flow, report card PDF, analytics.
6. **Parent polish and notifications**: results and fees UI polish, email (Resend), optional SMS, reminders, PWA install, Kiswahili scaffolding.
7. **Hardening**: security review, RLS penetration tests, load test of webhooks, accessibility audit, Lighthouse pass, backup/restore drill, handover docs.

**Definition of done for each phase:** it runs locally from a clean checkout, has tests for the critical logic, passes lint/typecheck, has RLS tests where data is touched, is verified on a 360px viewport, and is summarised in a short changelog entry. At the end of each phase, list what you built, what you assumed, and what you need from me.

---

## 15. Start now

1. Unzip the assets so `public/brand/` and `public/photos/` exist, then view every image yourself.
2. Confirm the palette by sampling the logo and photos, adjust the anchor hex values if needed, generate the primitive scales, define the semantic tokens following the 60-30-10 rule (Section 3.1a-3.1b), and write `docs/design-tokens.md`.
3. Scaffold the project and complete **Phase 0**, then proceed phase by phase.

Do not invent real student, parent or staff data. Do not hardcode secrets. Do not skip RLS.
