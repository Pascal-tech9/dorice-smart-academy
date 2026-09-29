# Dorice Smart Academy — Design Tokens & 60-30-10 System

> **Motto:** *"Inspire, Achieve, Flourish"*  
> **Location:** Kipkaren River, Kenya • P.O. Box 204

---

## 1. The 60-30-10 Rule (Mandatory Architecture)

Every screen, PDF report card, official receipt, and system email strictly adheres to the 60-30-10 ratio rule to ensure Dorice Smart Academy looks balanced, trustworthy, and distinctly Kenyan:

| Share | Role | Color / Semantic Token | Usage & Surfaces |
|---|---|---|---|
| **60%** | Dominant / Neutral | `--color-bg` (`#F7F0E1`), `--color-surface` (`#FFFFFF`), `--color-text` (`#10243C`) | Page backgrounds, card containers, form fields, long-form tables, report card bodies. Avoids hospital-white glare while minimizing cognitive fatigue. |
| **30%** | Secondary / Structure | `--color-primary` (`#123F70`), `--color-nav-bg`, `--color-table-header-bg` | App shell, navigation header, section headlines, primary buttons, table headers, blue-plaid pattern bands, and footers. |
| **10%** | Signature Accent | `--color-accent` (`#C4530F`), `--color-focus-ring` | The **single most critical call-to-action per view** (e.g. *Pay with M-PESA*, *Sign In*), active tab indicators, and keyboard focus outlines. |

### Rule Enforcement Discipline
1. **One Accent Button per View:** Only the highest-priority action receives the filled marigold accent button. All other actions are Navy primary, outline, or ghost.
2. **No Full-Width Orange/Red Bands:** Warmth is established by authentic photography and cream surfaces, not saturated slabs of color.
3. **Warning Gold is Distinct from Accent Marigold:** Warnings use the `chalk-butter` gold scale (`#F3E9B8` to `#8A6A00`) so parents never confuse fee alerts with payment buttons.
4. **Automated CI Enforcement:** `scripts/check-token-enforcement.ts` runs in CI and fails if arbitrary hex codes (`bg-[#...]`) or default Tailwind classes (`bg-blue-500`, `text-gray-700`) are used outside the design tokens file.

---

## 2. Three-Tier Token Architecture

1. **Tier 1: Primitives** (`app/tokens.css`): Full OKLCH scales (50–950) generated from anchor colors. Primitives are never referenced directly in application components.
2. **Tier 2: Semantics** (`app/tokens.css` & `@theme` in `app/globals.css`): The only color tokens components may reference (`bg-bg`, `bg-surface`, `text-primary`, `bg-accent`, `bg-success-soft`, etc.).
3. **Tier 3: Generated Non-CSS Tokens** (`lib/tokens.generated.ts`): Automatically extracted via `scripts/export-tokens.ts` for React-PDF receipts/statements and Resend email templates.

---

## 3. Semantic Token Registry

### 3.1 Surfaces (The 60%)
- `--color-bg`: Warm cream (`#F7F0E1`) from the school crest background.
- `--color-surface`: Crisp white (`#FFFFFF`) for card bodies and elevated panels.
- `--color-surface-muted`: Soft cream tint (`#FCF9F3`).
- `--color-surface-highlight`: Admin block butter-yellow (`#F3E9B8`) for selected rows.
- `--color-border`: Delicate cream border (`#EFE3CA`).
- `--color-border-strong`: Medium divider border (`#E5D3AF`).

### 3.2 Typography & Ink
- `--color-text`: Deep navy-tinted near-black ink (`#10243C`). Never pure black.
- `--color-text-muted`: Slate-navy secondary text (`#49607D`).
- `--color-text-inverse`: White text (`#FFFFFF`) on dark surfaces.
- `--color-link`: Navy link (`#123F70`).
- `--color-link-hover`: Darkened navy (`#0B2B50`).

### 3.3 Structure (The 30%)
- `--color-primary`: School Navy (`#123F70`). Headings, navigation, table headers.
- `--color-primary-hover`: Navy-600 (`#0E335B`).
- `--color-primary-active`: Navy-700 (`#0B2B50`).
- `--color-primary-fg`: High-contrast white (`#FFFFFF`).
- `--color-primary-soft`: Ultra-light navy tint (`#EDF6FF`).

### 3.4 Accent (The 10%)
- `--color-accent`: Marigold-strong (`#C4530F`). Passes WCAG AA contrast with white text.
- `--color-accent-hover`: Marigold-700 (`#A23F00`).
- `--color-accent-active`: Marigold-800 (`#7F2E00`).
- `--color-accent-fg`: White (`#FFFFFF`).
- `--color-accent-soft`: Cream-orange tint (`#FFF7F0`).
- `--color-focus-ring`: Marigold-strong outline with 2px offset.

### 3.5 Status Tokens (Chips & Alerts)
Each status features `-solid`, `-soft` (background), `-border`, and `-fg`:
- **Success (`flag-green`):** Paid status, completed allocations, CBC Exceeding Expectations (EE).
  - Background: `#EBFAEE` | Text: `#003703` | Border: `#95E0A7`
- **Warning (`chalk-butter / gold`):** Partial payments, pending approvals, CBC Approaching Expectations (AE).
  - Background: `#FDFBF2` | Text: `#6B5200` | Border: `#EBDD98`
- **Danger (`school-red`):** Overdue fees, failed STK push, CBC Below Expectations (BE).
  - Background: `#FFEDE9` | Text: `#700000` | Border: `#FFA899`
- **Info (`teal`):** Overpaid credit balances, notes, CBC Meeting Expectations (ME).
  - Background: `#E7F9FD` | Text: `#004459` | Border: `#88DFEE`

---

## 4. Automated WCAG AA Contrast Report

Tested using standard WCAG 2.1 relative luminance algorithms (`scripts/check-contrast.ts`):

| Token Pair | Foreground | Background | Ratio | Requirement | Status |
|---|---|---|---|---|---|
| Default text on page bg | `#10243C` | `#F7F0E1` | **13.81:1** | 4.5:1 | ✓ PASS |
| Default text on card surface | `#10243C` | `#FFFFFF` | **15.68:1** | 4.5:1 | ✓ PASS |
| Muted text on card surface | `#49607D` | `#FFFFFF` | **6.46:1** | 4.5:1 | ✓ PASS |
| Link text on page bg | `#123F70` | `#F7F0E1` | **9.39:1** | 4.5:1 | ✓ PASS |
| Link text on card surface | `#123F70` | `#FFFFFF` | **10.66:1** | 4.5:1 | ✓ PASS |
| Primary button text on navy | `#FFFFFF` | `#123F70` | **10.66:1** | 4.5:1 | ✓ PASS |
| Nav text on nav navy bg | `#FFFFFF` | `#123F70` | **10.66:1** | 4.5:1 | ✓ PASS |
| Table header text on navy | `#FFFFFF` | `#123F70` | **10.66:1** | 4.5:1 | ✓ PASS |
| Primary navy text on soft navy | `#123F70` | `#EDF6FF` | **9.76:1** | 4.5:1 | ✓ PASS |
| Accent button text on marigold | `#FFFFFF` | `#C4530F` | **4.57:1** | 3.0:1 | ✓ PASS |
| Success text on success-soft | `#003703` | `#EBFAEE` | **12.56:1** | 4.5:1 | ✓ PASS |
| Warning text on warning-soft | `#6B5200` | `#FDFBF2` | **7.15:1** | 4.5:1 | ✓ PASS |
| Danger text on danger-soft | `#700000` | `#FFEDE9` | **10.98:1** | 4.5:1 | ✓ PASS |
| Info text on info-soft | `#004459` | `#E7F9FD` | **9.83:1** | 4.5:1 | ✓ PASS |
| CBC EE text on EE-soft | `#003703` | `#EBFAEE` | **12.56:1** | 4.5:1 | ✓ PASS |
| CBC ME text on ME-soft | `#004459` | `#E7F9FD` | **9.83:1** | 4.5:1 | ✓ PASS |
| CBC AE text on AE-soft | `#6B5200` | `#FDFBF2` | **7.15:1** | 4.5:1 | ✓ PASS |
| CBC BE text on BE-soft | `#700000` | `#FFEDE9` | **10.98:1** | 4.5:1 | ✓ PASS |

---

## 5. Phase 0 60-30-10 Review Checklist

- [x] **Dominant Canvas (60%):** Cream `#F7F0E1` and surface white `#FFFFFF` provide the restful reading foundation.
- [x] **Structural Frame (30%):** Navy `#123F70` frames navigation, headers, table rows, and page anchors.
- [x] **Single CTA (10%):** Only one marigold-strong button per view.
- [x] **Subtle Plaid Pattern:** Generated with CSS gradients from `uniform-blue` at 6-8% opacity.
- [x] **Arch Motif:** Used in hero masks, badge crops, and card headers.
- [x] **Tabular Figures:** Applied to all monetary values and CBC marks.
- [x] **Mobile First:** Verified on 360px viewport widths.
