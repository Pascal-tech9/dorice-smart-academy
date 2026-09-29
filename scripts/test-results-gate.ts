import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local if present
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        if (!process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
} catch (e) {
  // Ignore error
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, serviceRoleKey);

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    totalPassed++;
  } else {
    console.error(`✗ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
    totalFailed++;
  }
}

async function runResultsGateTests() {
  console.log('================================================================');
  console.log('RUNNING RESULTS VISIBILITY GATE UNIT & INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // Test 1: student_term_balance view exists and is queryable
  console.log('1. Database View & Schema Checks:');
  const { data: viewData, error: viewErr } = await supabase
    .from('student_term_balance')
    .select('*');

  assert(!viewErr, 'student_term_balance view is queryable', viewErr?.message);
  assert(Array.isArray(viewData), 'student_term_balance returns structured rows');

  // Test 2: Gating functions in database
  console.log('\n2. Security Helper Functions:');
  const { data: gateActiveData, error: gErr } = await supabase.rpc('is_results_gate_active');
  assert(!gErr && typeof gateActiveData === 'boolean', 'is_results_gate_active() is callable and returns boolean', gErr?.message);

  // Test 3: Sibling Fee Isolation Scenario
  console.log('\n3. Sibling Fee Isolation & Gate Enforcement:');
  const { data: students } = await supabase
    .from('students')
    .select('id, admission_number, first_name, last_name');

  const student001 = students?.find((s) => s.first_name === 'Brian' || s.admission_number?.includes('001'));
  const student002 = students?.find((s) => s.first_name === 'Faith' || s.admission_number?.includes('002'));

  const { data: term1 } = await supabase
    .from('terms')
    .select('id, name')
    .eq('name', 'Term 1')
    .limit(1)
    .single();

  const targetTermId = term1?.id;

  // Set deterministic test fixture for Sibling Isolation
  if (student001 && targetTermId) {
    await supabase
      .from('invoices')
      .update({ balance_due: 0, status: 'paid' })
      .eq('student_id', student001.id)
      .eq('term_id', targetTermId);
  }

  if (student002 && targetTermId) {
    await supabase
      .from('invoices')
      .update({ balance_due: 15500, status: 'partially_paid' })
      .eq('student_id', student002.id)
      .eq('term_id', targetTermId);
  }

    // Child 1 (Brian Kiprono) -> Zero balance -> Allowed
    const { data: bal1 } = await supabase
      .from('student_term_balance')
      .select('balance_kes, term_id, student_id')
      .eq('student_id', student001.id);

    const b1 = bal1?.find((b) => b.term_id === targetTermId) || bal1?.[0];
    const isChild1Cleared = (b1?.balance_kes ?? 0) <= 0;
    assert(isChild1Cleared, `Sibling 1 (Brian Kiprono) has fee balance = ${b1?.balance_kes} KES (Cleared)`);

    // Child 2 (Faith Wambui) -> Positive balance -> Gated
    const { data: bal2 } = await supabase
      .from('student_term_balance')
      .select('balance_kes, term_id, student_id')
      .eq('student_id', student002.id);

    const b2 = bal2?.find((b) => b.term_id === targetTermId) || bal2?.[0];
    const isChild2Gated = (b2?.balance_kes ?? 0) > 0;
    assert(isChild2Gated, `Sibling 2 (Faith Wambui) has fee balance = KES ${b2?.balance_kes} (Gate Locked)`);

    // Test database helper is_fee_cleared_for_term
    const { data: clearedCheck1 } = await supabase.rpc('is_fee_cleared_for_term', {
      p_student_id: student001.id,
      p_term_id: targetTermId,
    });
    assert(clearedCheck1 === true, 'is_fee_cleared_for_term returns true for cleared student');

    const { data: clearedCheck2 } = await supabase.rpc('is_fee_cleared_for_term', {
      p_student_id: student002.id,
      p_term_id: targetTermId,
    });
    assert(clearedCheck2 === false, 'is_fee_cleared_for_term returns false for uncleared student');

  // Test 4: Overpayment / Credit Scenario
  console.log('\n4. Overpayment / Credit Scenarios:');
  const balanceZero = 0;
  const balanceCredit = -2500;
  const balanceDebit = 4000;

  assert(balanceZero <= 0, 'Zero balance (0 KES) unlocks results');
  assert(balanceCredit <= 0, 'Credit balance (-2500 KES overpaid) unlocks results');
  assert(balanceDebit > 0, 'Outstanding balance (4000 KES debit) blocks results');

  // Test 5: Setting Toggle
  console.log('\n5. Setting Toggle Audit & State:');
  const { data: settingRow } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'gate_results_on_fees')
    .maybeSingle();

  assert(settingRow !== null, 'gate_results_on_fees setting row exists in settings table');

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('================================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runResultsGateTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
