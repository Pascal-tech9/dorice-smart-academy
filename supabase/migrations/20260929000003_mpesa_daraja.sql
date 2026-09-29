-- ============================================================================
-- DORICE SMART ACADEMY - DATABASE SCHEMA MIGRATION 003: M-PESA DARAJA
-- STK Push, C2B Paybill, Idempotent Callbacks, Unallocated Queue & Reconciliation
-- ============================================================================

CREATE TYPE mpesa_tx_status AS ENUM ('initiated', 'processing', 'completed', 'failed', 'cancelled', 'unallocated');
CREATE TYPE mpesa_tx_type AS ENUM ('stk_push', 'c2b_paybill');

CREATE TABLE mpesa_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_request_id TEXT,
    checkout_request_id TEXT UNIQUE,
    mpesa_receipt_number TEXT UNIQUE, -- Enforces idempotency: replays never double-credit
    transaction_type mpesa_tx_type NOT NULL DEFAULT 'stk_push',
    phone_number TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    account_reference TEXT, -- Admission number provided by payer
    student_id UUID REFERENCES students(id) ON DELETE SET NULL, -- Null if unmatched C2B
    status mpesa_tx_status NOT NULL DEFAULT 'initiated',
    result_code INT,
    result_desc TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Preserves raw Safaricom Daraja JSON
    reconciled_at TIMESTAMPTZ,
    allocated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_mpesa_tx_checkout ON mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_tx_receipt ON mpesa_transactions(mpesa_receipt_number);
CREATE INDEX idx_mpesa_tx_student ON mpesa_transactions(student_id);
CREATE INDEX idx_mpesa_tx_status ON mpesa_transactions(status);

-- ----------------------------------------------------------------------------
-- RLS on M-PESA Transactions
-- ----------------------------------------------------------------------------
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and bursar manage mpesa transactions" ON mpesa_transactions
    FOR ALL USING (is_bursar(auth.uid()));

CREATE POLICY "Guardians view own mpesa transactions" ON mpesa_transactions
    FOR SELECT USING (
        student_id IS NOT NULL AND is_guardian_of_student(auth.uid(), student_id)
    );
