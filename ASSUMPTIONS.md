# Dorice Smart Academy — Project Assumptions Log

This document records architectural, design, and product decisions made during implementation in accordance with the project specification.

---

## 1. Brand & Assets (Phase 0)

1. **School Crest Badge Crop:**
   - The school badge in `dorice-logo-badge-on-orange.jpg` was photographed on ribbed orange textile with tagline "Inspire, Achieve, Flourish" below a horizontal divider.
   - We extracted and masked the arched crest into a clean, transparent PNG: `public/brand/dorice-logo-badge.png` (939x805px) for use in the navigation header, favicons, and future PDF headers.
   - **TODO for School Administration:** Request an official vector SVG master or original transparent high-resolution PNG master of the badge.

2. **Asset Resolution:**
   - Provided photos are WhatsApp-compressed. They are rendered with Next.js image optimization (`next/image`) at or below native dimensions without artificial upscaling.
   - **TODO for School Administration:** High-resolution original photography files should be archived for print production.

3. **Leadership Portrait Placeholder:**
   - Portrait `leadership-portrait-at-desk.jpg` shows a nameplate reading "D. A. Chapia".
   - We placed this as a leadership welcome placeholder on the home page with an explicit note that her full name, official title (e.g., Head Teacher / Director), and formal consent must be confirmed with the school prior to public launch.

4. **Student Photo Privacy (Kenya DPA 2019):**
   - Photographs showing children are strictly confined to public informational pages (`/`, `/about`, `/gallery`).
   - Learner photos are **never** shown inside authenticated guardian or staff portal areas as decoration, and individuals are never named in image `alt` tags.

---

## 2. Palette & Design Tokens (Phase 0)

1. **OKLCH Scales:**
   - Generated mathematically using `culori` in `scripts/generate-palette.ts`. Anchors:
     - Navy: `#123F70` (30% Structure)
     - Marigold: `#E8681C` / Marigold-Strong: `#C4530F` (10% Accent)
     - Cream: `#F7F0E1` (60% Canvas)
     - Chalk Butter / Gold: `#F3E9B8` to `#8A6A00` (Warnings, distinct from Accent)
     - Flag Green: `#1E7B45` (Success / Paid / EE)
     - School Red: `#C8282D` (Danger / Arrears / BE)
     - Teal: `#1799B0` / Teal-Strong: `#0E7C91` (Info / ME)
     - Uniform Blue: `#3B5FB4` (Plaid pattern, charts)
     - Ink: `#10243C` (Rich body text)
2. **60-30-10 Enforcement:**
   - Automated scanner `scripts/check-token-enforcement.ts` runs on all TSX/CSS files to eliminate raw hex values and default Tailwind color classes.
   - Exactly one filled accent CTA button per view.

---

## 3. Academic & Curriculum Configuration (Phases 1 & 5)

1. **CBC Levels Supported:**
   - Pre-Primary: PP1, PP2
   - Lower Primary: Grade 1, Grade 2, Grade 3
   - Upper Primary: Grade 4, Grade 5, Grade 6
   - Junior School: Grade 7, Grade 8, Grade 9
   - Senior School (Grade 10–12): Configurable schema supported, toggled off by default.
2. **CBC Performance Grading Bands:**
   - Standard 4-level rubric with 8-point sub-scale:
     - **EE (Exceeding Expectations):** EE1 (90–100%), EE2 (80–89%) — 4 Stars
     - **ME (Meeting Expectations):** ME1 (70–79%), ME2 (60–69%) — 3 Stars
     - **AE (Approaching Expectations):** AE1 (50–59%), AE2 (40–49%) — 2 Stars
     - **BE (Below Expectations):** BE1 (30–39%), BE2 (0–29%) — 1 Star
   - Default bands are seeded in migrations but fully editable by school administrators.
3. **Assessment Types:**
   - Continuous School-Based Assessment (SBA) weighted at 40%.
   - End-of-Term Summative Assessment weighted at 60%.
   - Weights are configurable per grade level in database settings.
4. **Fee-Clearance Gate for Results:**
   - School policy toggle: "Require cleared fee balance before guardian can view/download CBC report card".
   - Default setting: **OFF**, allowing schools to activate when formal term clearance is enforced.

---

## 4. Financial & M-PESA Management (Phases 3 & 4)

1. **Currency Storage:**
   - Stored as integer minor units (KES cents) or `numeric(12,2)`. Floats are strictly prohibited.
   - Formatted in UI as `Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })`.
2. **Payment Allocation:**
   - Oldest-first invoice allocation by default. Overpayments roll forward as credit balance.
3. **M-PESA Idempotency:**
   - Unique constraints on `MpesaReceiptNumber` and `CheckoutRequestID` prevent double-crediting.
4. **Unallocated C2B Payments:**
   - Payments with unparseable or mistyped admission numbers are quarantined into an unallocated queue for bursar manual assignment.
