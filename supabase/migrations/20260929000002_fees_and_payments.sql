-- ============================================================================
-- DORICE SMART ACADEMY - DATABASE SCHEMA MIGRATION 002: FEES & PAYMENTS
-- Financial management, Invoicing, Manual Payments, Receipts & Statements
-- Money stored as integer minor units (KES Cents) or NUMERIC(12,2)
-- ============================================================================

-- Types
CREATE TYPE payment_method AS ENUM ('mpesa_stk', 'mpesa_c2b', 'cash', 'bank_deposit', 'cheque');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'void');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE adjustment_type AS ENUM ('bursary', 'sibling_discount', 'waiver', 'scholarship', 'late_fee');

-- 1. Fee Items (Tuition, Lunch, Transport, Activity, Uniform)
CREATE TABLE fee_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    default_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Fee Structure (Per Year, Term, Grade Level)
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE RESTRICT,
    fee_item_id UUID NOT NULL REFERENCES fee_items(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(academic_year_id, term_id, grade_level_id, fee_item_id)
);

CREATE INDEX idx_fee_structures_term ON fee_structures(term_id);
CREATE INDEX idx_fee_structures_grade ON fee_structures(grade_level_id);

-- 3. Student Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE, -- e.g. INV-2026-T1-0001
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status invoice_status NOT NULL DEFAULT 'issued',
    due_date DATE NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, academic_year_id, term_id)
);

CREATE INDEX idx_invoices_student ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- 4. Invoice Lines
CREATE TABLE invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    fee_item_id UUID REFERENCES fee_items(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- 5. Student Adjustments (Bursary, Sibling Discount, Waiver)
CREATE TABLE adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type adjustment_type NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_adjustments_student ON adjustments(student_id);

-- 6. Payments (Manual: Cash, Bank, Cheque & M-PESA)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'completed',
    reference_number TEXT NOT NULL, -- Bank slip, Cheque no., M-PESA Code
    paid_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_reference ON payments(reference_number);

-- 7. Payment Allocations (Oldest-first to invoices)
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_allocations_invoice ON payment_allocations(invoice_id);

-- 8. Sequential Official Numbered Receipts
CREATE SEQUENCE IF NOT EXISTS receipt_seq START 1;

CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL UNIQUE, -- e.g. RCT-2026-0001
    payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_receipts_student ON receipts(student_id);

-- ----------------------------------------------------------------------------
-- 9. Row Level Security on All Financial Tables
-- ----------------------------------------------------------------------------
ALTER TABLE fee_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- POLICIES: FEE ITEMS & STRUCTURES
CREATE POLICY "Authenticated users can view fee items" ON fee_items
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and bursar manage fee items" ON fee_items
    FOR ALL USING (is_bursar(auth.uid()));

CREATE POLICY "Authenticated users can view fee structures" ON fee_structures
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and bursar manage fee structures" ON fee_structures
    FOR ALL USING (is_bursar(auth.uid()));

-- POLICIES: INVOICES & LINES
CREATE POLICY "Admin and bursar manage invoices" ON invoices
    FOR ALL USING (is_bursar(auth.uid()));

CREATE POLICY "Guardians view own children invoices" ON invoices
    FOR SELECT USING (is_guardian_of_student(auth.uid(), student_id));

CREATE POLICY "Admin and bursar manage invoice lines" ON invoice_lines
    FOR ALL USING (is_bursar(auth.uid()));

CREATE POLICY "Guardians view own children invoice lines" ON invoice_lines
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM invoices inv WHERE inv.id = invoice_lines.invoice_id AND is_guardian_of_student(auth.uid(), inv.student_id))
    );

-- POLICIES: ADJUSTMENTS
CREATE POLICY "Admin and bursar manage adjustments" ON adjustments
    FOR ALL USING (is_bursar(auth.uid()));

CREATE POLICY "Guardians view own children adjustments" ON adjustments
    FOR SELECT USING (is_guardian_of_student(auth.uid(), student_id));

-- POLICIES: PAYMENTS & ALLOCATIONS
CREATE POLICY "Admin and bursar manage payments" ON payments
    FOR ALL USING (is_bursar(auth.uid()));

CREATE POLICY "Guardians view own children payments" ON payments
    FOR SELECT USING (is_guardian_of_student(auth.uid(), student_id));

CREATE POLICY "Admin and bursar manage payment allocations" ON payment_allocations
    FOR ALL USING (is_bursar(auth.uid()));

CREATE POLICY "Guardians view own children payment allocations" ON payment_allocations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM payments p WHERE p.id = payment_allocations.payment_id AND is_guardian_of_student(auth.uid(), p.student_id))
    );

-- POLICIES: RECEIPTS
CREATE POLICY "Admin and bursar manage receipts" ON receipts
    FOR ALL USING (is_bursar(auth.uid()));

CREATE POLICY "Guardians view own children receipts" ON receipts
    FOR SELECT USING (is_guardian_of_student(auth.uid(), student_id));
