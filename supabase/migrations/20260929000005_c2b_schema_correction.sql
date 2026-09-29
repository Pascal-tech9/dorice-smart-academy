-- ============================================================================
-- DORICE SMART ACADEMY - MIGRATION 005: M-PESA C2B SCHEMA CORRECTION
-- Aligns mpesa_transactions table with Paybill C2B 400222 workflow.
-- Removes STK Push specific columns; adds C2B-specific columns.
-- ============================================================================

-- Step 1: Drop STK Push-specific enum value and add C2B-specific ones
-- (We recreate the enum to cleanly remove 'stk_push')
ALTER TABLE mpesa_transactions
    ALTER COLUMN transaction_type DROP DEFAULT;

-- Rename enum (Postgres doesn't support DROP VALUE so we migrate to a new type)
ALTER TYPE mpesa_tx_type RENAME TO mpesa_tx_type_old;
CREATE TYPE mpesa_tx_type AS ENUM ('C2B', 'manual_bursar');
ALTER TABLE mpesa_transactions
    ALTER COLUMN transaction_type TYPE mpesa_tx_type
    USING CASE
        WHEN transaction_type::text = 'stk_push' THEN 'C2B'::mpesa_tx_type
        ELSE 'C2B'::mpesa_tx_type
    END;
ALTER TABLE mpesa_transactions
    ALTER COLUMN transaction_type SET DEFAULT 'C2B';
DROP TYPE mpesa_tx_type_old;

-- Step 2: Update status enum to better reflect C2B states
ALTER TYPE mpesa_tx_status RENAME TO mpesa_tx_status_old;
CREATE TYPE mpesa_tx_status AS ENUM (
    'received',      -- Confirmation callback arrived
    'allocated',     -- Matched and auto-allocated to student invoices
    'unallocated',   -- Could not match student — in bursar queue
    'reconciled',    -- Confirmed via QueryTransaction nightly job
    'reversed'       -- Safaricom reversal received
);
ALTER TABLE mpesa_transactions
    ALTER COLUMN status DROP DEFAULT;
ALTER TABLE mpesa_transactions
    ALTER COLUMN status TYPE mpesa_tx_status
    USING CASE
        WHEN status::text IN ('initiated', 'processing') THEN 'received'::mpesa_tx_status
        WHEN status::text = 'completed' THEN 'allocated'::mpesa_tx_status
        WHEN status::text = 'unallocated' THEN 'unallocated'::mpesa_tx_status
        WHEN status::text IN ('failed', 'cancelled') THEN 'reversed'::mpesa_tx_status
        ELSE 'received'::mpesa_tx_status
    END;
ALTER TABLE mpesa_transactions
    ALTER COLUMN status SET DEFAULT 'received';
DROP TYPE mpesa_tx_status_old;

-- Step 3: Rename columns to match C2B callback field names
-- (mpesa_receipt_number → receipt_number for cleaner API matching)
ALTER TABLE mpesa_transactions
    RENAME COLUMN mpesa_receipt_number TO receipt_number;

-- Step 4: Remove STK Push-only columns no longer needed
ALTER TABLE mpesa_transactions
    DROP COLUMN IF EXISTS merchant_request_id,
    DROP COLUMN IF EXISTS checkout_request_id,
    DROP COLUMN IF EXISTS result_code,
    DROP COLUMN IF EXISTS result_desc;

-- Step 5: Add C2B-specific columns
ALTER TABLE mpesa_transactions
    ADD COLUMN IF NOT EXISTS account_reference TEXT,     -- BillRefNumber from callback (e.g. 369369#JohnDoe,Grade3)
    ADD COLUMN IF NOT EXISTS match_status TEXT CHECK (match_status IN ('auto', 'manual', 'unmatched')),
    ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS business_short_code TEXT DEFAULT '400222';

-- Step 6: Drop old index on checkout_request_id (no longer exists)
DROP INDEX IF EXISTS idx_mpesa_tx_checkout;

-- Step 7: Recreate receipt number index with new column name
DROP INDEX IF EXISTS idx_mpesa_tx_receipt;
CREATE UNIQUE INDEX idx_mpesa_tx_receipt ON mpesa_transactions(receipt_number)
    WHERE receipt_number IS NOT NULL;

-- Add account reference index for quick unallocated lookup
CREATE INDEX IF NOT EXISTS idx_mpesa_tx_account ON mpesa_transactions(account_reference);
CREATE INDEX IF NOT EXISTS idx_mpesa_tx_match_status ON mpesa_transactions(match_status);

-- Step 8: Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mpesa_transactions_updated_at
    BEFORE UPDATE ON mpesa_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE mpesa_transactions IS
    'Safaricom Paybill C2B (Paybill 400222) transaction log. Each row is an idempotent record of one M-PESA payment received from a parent. receipt_number has a UNIQUE constraint.';

COMMENT ON COLUMN mpesa_transactions.receipt_number IS
    'M-PESA transaction receipt number (e.g. NLJ78YDO). Unique constraint ensures replay callbacks never double-credit.';

COMMENT ON COLUMN mpesa_transactions.account_reference IS
    'BillRefNumber as entered by the parent. Expected format: 369369#StudentName,Grade. Confirm exact format with school before go-live.';

COMMENT ON COLUMN mpesa_transactions.match_status IS
    'auto = system matched to a student; manual = bursar manually allocated; unmatched = still in unallocated queue.';
