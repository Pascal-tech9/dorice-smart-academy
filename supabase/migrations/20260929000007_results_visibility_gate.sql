-- ============================================================================
-- DORICE SMART ACADEMY - DATABASE SCHEMA MIGRATION 007
-- Results Visibility Gate (Fee Clearance Required)
-- Business Rule: Parents & Guardians can only view published term results
-- if all invoices for that term are fully paid (balance_due <= 0).
-- ============================================================================

-- 1. Tracking: when student's balance was cleared & when guardian viewed report
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS term_fees_cleared_at TIMESTAMPTZ;
ALTER TABLE term_reports ADD COLUMN IF NOT EXISTS viewed_by_guardian_at TIMESTAMPTZ;

-- 2. Ensure gate setting exists in settings table (default: true)
INSERT INTO settings (key, value)
VALUES ('gate_results_on_fees', '{"enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. View: Term balance per student per term
CREATE OR REPLACE VIEW student_term_balance AS
SELECT
  e.student_id,
  e.academic_year_id,
  t.id AS term_id,
  COALESCE(SUM(i.total_amount), 0) AS total_invoiced,
  COALESCE(SUM(i.total_amount - i.balance_due), 0) AS total_paid,
  COALESCE(SUM(i.balance_due), 0) AS balance_kes
FROM enrollments e
JOIN academic_years ay ON e.academic_year_id = ay.id
JOIN terms t ON t.academic_year_id = ay.id
LEFT JOIN invoices i ON i.student_id = e.student_id AND i.term_id = t.id
GROUP BY e.student_id, e.academic_year_id, t.id;

-- 4. Helper Security Definer Functions
CREATE OR REPLACE FUNCTION is_results_gate_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (value->>'enabled')::boolean,
    (value->>'gate_results_on_fees')::boolean,
    true
  )
  FROM settings
  WHERE key = 'gate_results_on_fees'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_fee_cleared_for_term(p_student_id UUID, p_term_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (balance_kes <= 0)
      FROM student_term_balance stb
      WHERE stb.student_id = p_student_id
        AND stb.term_id = p_term_id
      LIMIT 1
    ),
    true -- If no invoice exists, gate is not blocked
  );
$$;

-- 5. Hardened RLS Policy on term_reports for Guardians
DROP POLICY IF EXISTS "Guardians can view published term reports of their children" ON term_reports;
DROP POLICY IF EXISTS "guardians_can_read_term_reports_if_fees_cleared" ON term_reports;

CREATE POLICY "guardians_can_read_term_reports_if_fees_cleared" ON term_reports
  FOR SELECT TO authenticated
  USING (
    is_guardian_of_student(student_id)
    AND status = 'published'
    AND (
      is_results_gate_active() = false
      OR is_fee_cleared_for_term(student_id, term_id) = true
    )
  );

-- 6. Hardened RLS Policy on term_report_learning_areas for Guardians
DROP POLICY IF EXISTS "Guardians can view learning areas of published reports" ON term_report_learning_areas;
DROP POLICY IF EXISTS "guardians_can_view_learning_areas_if_fees_cleared" ON term_report_learning_areas;

CREATE POLICY "guardians_can_view_learning_areas_if_fees_cleared" ON term_report_learning_areas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM term_reports tr
      WHERE tr.id = term_report_learning_areas.term_report_id
        AND tr.status = 'published'
        AND is_guardian_of_student(tr.student_id)
        AND (
          is_results_gate_active() = false
          OR is_fee_cleared_for_term(tr.student_id, tr.term_id) = true
        )
    )
  );
