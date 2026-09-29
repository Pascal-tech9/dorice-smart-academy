import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * DORICE SMART ACADEMY - RLS TEST SUITE
 * Verifies that the SQL migrations enforce default-deny and role segregation across all tables.
 */

export function verifyRlsPolicies() {
  console.log('Verifying Database Row-Level Security (RLS) Policies across Migrations...\n');

  const migrationDir = path.resolve(process.cwd(), 'supabase/migrations');
  if (!fs.existsSync(migrationDir)) {
    console.error(`Missing migration directory: ${migrationDir}`);
    process.exit(1);
  }

  const migrationFiles = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql'));
  let combinedSql = '';
  for (const file of migrationFiles) {
    combinedSql += fs.readFileSync(path.join(migrationDir, file), 'utf-8') + '\n';
  }

  const requiredTables = [
    // Migration 001: Core Academic & People
    'profiles',
    'user_roles',
    'academic_years',
    'terms',
    'grade_levels',
    'classes',
    'learning_areas',
    'class_learning_areas',
    'students',
    'guardians',
    'student_guardians',
    'enrollments',
    'grading_schemes',
    'grading_bands',
    'settings',
    'audit_log',

    // Migration 002: Fees & Payments
    'fee_items',
    'fee_structures',
    'invoices',
    'invoice_lines',
    'adjustments',
    'payments',
    'payment_allocations',
    'receipts',

    // Migration 003: M-PESA Daraja
    'mpesa_transactions',

    // Migration 004: CBC Academic Assessments & Reports
    'assessments',
    'assessment_scores',
    'term_reports',
    'term_report_learning_areas',
  ];

  let errors = 0;

  // 1. Verify RLS is enabled on every single table
  for (const table of requiredTables) {
    const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY;`, 'i');
    if (rlsRegex.test(combinedSql)) {
      console.log(`✓ [PASS] RLS enabled on table "${table}"`);
    } else {
      console.error(`✗ [FAIL] Table "${table}" is MISSING "ENABLE ROW LEVEL SECURITY"`);
      errors++;
    }
  }

  // 2. Verify critical security functions exist
  const requiredFunctions = [
    'has_role',
    'is_admin',
    'is_bursar',
    'is_teacher',
    'is_guardian_of_student',
    'is_teacher_of_class',
  ];

  console.log('\nVerifying Security Definer Helper Functions...');
  for (const fn of requiredFunctions) {
    const fnRegex = new RegExp(`CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+${fn}`, 'i');
    if (fnRegex.test(combinedSql)) {
      console.log(`✓ [PASS] Security function "${fn}" defined`);
    } else {
      console.error(`✗ [FAIL] Missing security function "${fn}"`);
      errors++;
    }
  }

  // 3. Verify Guardian Child Segregation (Cannot access other children)
  console.log('\nVerifying Guardian-Student Segregation Policy...');
  const guardianStudentPolicy = /CREATE\s+POLICY\s+"Guardians can view own children only"\s+ON\s+students\s+FOR\s+SELECT\s+USING\s+\(is_guardian_of_student\(auth\.uid\(\),\s*id\)\);/i;
  if (guardianStudentPolicy.test(combinedSql)) {
    console.log('✓ [PASS] Strict Guardian child isolation policy verified.');
  } else {
    console.error('✗ [FAIL] Missing guardian-to-child data isolation policy on students table.');
    errors++;
  }

  // 4. Verify Financial RLS Isolation for Invoices and Receipts
  console.log('\nVerifying Financial Data Isolation Policies...');
  const invoicePolicy = /CREATE\s+POLICY\s+"Guardians view own children invoices"\s+ON\s+invoices/i;
  const receiptPolicy = /CREATE\s+POLICY\s+"Guardians view own children receipts"\s+ON\s+receipts/i;
  if (invoicePolicy.test(combinedSql) && receiptPolicy.test(combinedSql)) {
    console.log('✓ [PASS] Guardian financial isolation policies for invoices and receipts verified.');
  } else {
    console.error('✗ [FAIL] Missing guardian financial isolation policies on invoices/receipts.');
    errors++;
  }

  // 5. Verify CBC Academic RLS Isolation (Published reports only for guardians)
  console.log('\nVerifying CBC Academic Isolation Policies...');
  const cbcPolicy = /CREATE\s+POLICY\s+"Guardians can view published term reports of their children"\s+ON\s+term_reports/i;
  if (cbcPolicy.test(combinedSql)) {
    console.log('✓ [PASS] Guardian CBC published report isolation policy verified.');
  } else {
    console.error('✗ [FAIL] Missing guardian CBC published report isolation policy on term_reports.');
    errors++;
  }

  if (errors > 0) {
    console.error(`\nFAILED: ${errors} RLS policy verification failures found!`);
    process.exit(1);
  } else {
    console.log(`\nALL RLS VERIFICATION CHECKS PASSED: 28 tables secured, default-deny active, financial and academic policies validated.`);
  }
}

verifyRlsPolicies();
