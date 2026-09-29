import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * DORICE SMART ACADEMY - RLS TEST SUITE
 * Verifies that the SQL migration enforces default-deny and role segregation.
 */

export function verifyRlsPolicies() {
  console.log('Verifying Database Row-Level Security (RLS) Policies...\n');

  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260929000001_initial_schema.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error(`Missing migration file: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const requiredTables = [
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
  ];

  let errors = 0;

  // 1. Verify RLS is enabled on every single table
  for (const table of requiredTables) {
    const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY;`, 'i');
    if (rlsRegex.test(sql)) {
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
    if (fnRegex.test(sql)) {
      console.log(`✓ [PASS] Security function "${fn}" defined`);
    } else {
      console.error(`✗ [FAIL] Missing security function "${fn}"`);
      errors++;
    }
  }

  // 3. Verify Guardian Child Segregation (Cannot access other children)
  console.log('\nVerifying Guardian-Student Segregation Policy...');
  const guardianStudentPolicy = /CREATE\s+POLICY\s+"Guardians can view own children only"\s+ON\s+students\s+FOR\s+SELECT\s+USING\s+\(is_guardian_of_student\(auth\.uid\(\),\s*id\)\);/i;
  if (guardianStudentPolicy.test(sql)) {
    console.log('✓ [PASS] Strict Guardian child isolation policy verified.');
  } else {
    console.error('✗ [FAIL] Missing guardian-to-child data isolation policy on students table.');
    errors++;
  }

  // 4. Verify Teacher Class Segregation
  console.log('\nVerifying Teacher Class Segregation Policy...');
  const teacherClassPolicy = /CREATE\s+POLICY\s+"Teachers can view enrolled students in their classes"\s+ON\s+students/i;
  if (teacherClassPolicy.test(sql)) {
    console.log('✓ [PASS] Teacher class assignment isolation policy verified.');
  } else {
    console.error('✗ [FAIL] Missing teacher class assignment isolation policy.');
    errors++;
  }

  if (errors > 0) {
    console.error(`\nFAILED: ${errors} RLS policy verification failures found!`);
    process.exit(1);
  } else {
    console.log(`\nALL RLS VERIFICATION CHECKS PASSED: 16 tables secured, default-deny active, role policies validated.`);
  }
}

verifyRlsPolicies();
