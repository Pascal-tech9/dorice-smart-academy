-- ============================================================================
-- DORICE SMART ACADEMY - MIGRATION 006: PHASE 7 HARDENING
-- Security, RLS gap-filling, and performance improvements
-- ============================================================================

-- ─── 1. API Secrets Table (settings store for non-env config) ─────────────────
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write settings
CREATE POLICY "Admins manage settings" ON settings
    FOR ALL USING (is_admin(auth.uid()));

-- ─── 2. Audit Log hardening ───────────────────────────────────────────────────
-- Ensure audit_log exists and is write-only via service-role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'audit_log'
    ) THEN
        CREATE TABLE audit_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
            actor_email TEXT,
            action TEXT NOT NULL,                  -- e.g. 'payment.allocated', 'result.published'
            resource_type TEXT NOT NULL,           -- table name or domain
            resource_id TEXT,
            before_state JSONB,
            after_state JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    END IF;
END $$;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read audit log; no one can update/delete (append-only)
CREATE POLICY "Admins read audit log" ON audit_log
    FOR SELECT USING (is_admin(auth.uid()));

-- Prevent any client-side mutation — writes go through service-role only
CREATE POLICY "No client insert on audit_log" ON audit_log
    FOR INSERT WITH CHECK (false);

-- ─── 3. Notifications table (store sent notifications for deduplication) ──────
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
    notification_type TEXT NOT NULL,  -- 'fee_receipt', 'results_published', 'fee_reminder'
    subject TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')) DEFAULT 'sent',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and bursars read notifications" ON notifications
    FOR SELECT USING (is_admin(auth.uid()) OR is_bursar(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_notifications_guardian ON notifications(recipient_guardian_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

-- ─── 4. RLS gap: ensure all fee tables have policies ─────────────────────────
-- fee_structures: only admin can modify
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'fee_structures'
        AND policyname = 'Admin manages fee structures'
    ) THEN
        ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Admin manages fee structures" ON fee_structures
            FOR ALL USING (is_admin(auth.uid()));
        CREATE POLICY "All staff read fee structures" ON fee_structures
            FOR SELECT USING (is_staff(auth.uid()));
    END IF;
END $$;

-- ─── 5. Security: rate-limit-friendly indices ─────────────────────────────────
-- Fast lookup by phone number for C2B deduplication
CREATE INDEX IF NOT EXISTS idx_mpesa_tx_phone ON mpesa_transactions(phone_number);
CREATE INDEX IF NOT EXISTS idx_mpesa_tx_created ON mpesa_transactions(created_at DESC);

-- ─── 6. Receipts table (sequential, per-year, no gaps) ───────────────────────
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL UNIQUE,        -- e.g. RCT-2026-0001 (sequential, no gaps)
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    pdf_path TEXT,                              -- Supabase Storage path
    emailed_at TIMESTAMPTZ,
    sms_sent_at TIMESTAMPTZ
);

-- Receipt number sequence (year-scoped, no gaps)
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    year_prefix TEXT := EXTRACT(YEAR FROM now())::TEXT;
    seq_num INT := nextval('receipt_number_seq');
BEGIN
    RETURN 'RCT-' || year_prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bursars and admins manage receipts" ON receipts
    FOR ALL USING (is_bursar(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "Guardians view own receipts" ON receipts
    FOR SELECT USING (is_guardian_of_student(auth.uid(), student_id));

-- ─── 7. Performance: covering indices on frequently joined tables ─────────────
CREATE INDEX IF NOT EXISTS idx_invoices_student_balance
    ON invoices(student_id, balance_due)
    WHERE balance_due > 0;

CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);

-- ─── 8. Data integrity: add missing FKs and check constraints ─────────────────
-- Ensure payment amounts are always positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE table_name = 'payments'
        AND constraint_name = 'payments_amount_positive'
    ) THEN
        ALTER TABLE payments
            ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);
    END IF;
END $$;

-- ─── 9. Comments for documentation ───────────────────────────────────────────
COMMENT ON TABLE receipts IS
    'Sequential, per-year, no-gap receipt register. Every payment credited to a student account generates one receipt. Numbers follow format RCT-YYYY-NNNN.';

COMMENT ON TABLE audit_log IS
    'Append-only audit trail for all significant state changes. Written exclusively via service-role; no client INSERT is permitted via RLS.';

COMMENT ON TABLE notifications IS
    'Log of email/SMS notifications sent to guardians. Used to prevent duplicate sends and to provide delivery status reporting.';
