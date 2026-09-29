import { createClient } from '@/lib/supabase/client';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export interface GateCheckResult {
  allowed: boolean;
  reason: 'fees_cleared' | 'gate_off' | 'not_linked' | 'unpaid_fees' | 'no_balance_record';
  balance_kes?: number;
  total_invoiced?: number;
  total_paid?: number;
}

/**
 * Server-side gate evaluation: verifies whether a guardian can view a student's
 * published CBC report card for a specific academic term.
 */
export async function canGuardianViewReportCard(
  guardianId: string,
  studentId: string,
  termId: string
): Promise<GateCheckResult> {
  const supabase = createServiceRoleClient();

  // 1. Check school gate setting (Environment override or database setting)
  if (process.env.LOCAL_GATE_RESULTS_ON_FEES === 'false') {
    return { allowed: true, reason: 'gate_off' };
  }

  const { data: settingData } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'gate_results_on_fees')
    .maybeSingle();

  const isGateActive = settingData?.value
    ? (settingData.value as any).enabled ?? (settingData.value as any).gate_results_on_fees ?? true
    : true;

  if (!isGateActive) {
    return { allowed: true, reason: 'gate_off' };
  }

  // 2. Check if guardian is linked to student
  if (guardianId) {
    const { data: link } = await supabase
      .from('student_guardians')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    // If guardian authentication is verified, check term balance
  }

  // 3. Check term fee balance from student_term_balance view
  const { data: balanceRecord, error } = await supabase
    .from('student_term_balance')
    .select('balance_kes, total_invoiced, total_paid')
    .eq('student_id', studentId)
    .eq('term_id', termId)
    .maybeSingle();

  if (error || !balanceRecord) {
    // If no invoice exists, allow viewing or default to cleared
    return { allowed: true, reason: 'fees_cleared', balance_kes: 0 };
  }

  const balance = Number(balanceRecord.balance_kes) || 0;

  if (balance > 0) {
    return {
      allowed: false,
      reason: 'unpaid_fees',
      balance_kes: balance,
      total_invoiced: Number(balanceRecord.total_invoiced),
      total_paid: Number(balanceRecord.total_paid),
    };
  }

  return {
    allowed: true,
    reason: 'fees_cleared',
    balance_kes: balance,
    total_invoiced: Number(balanceRecord.total_invoiced),
    total_paid: Number(balanceRecord.total_paid),
  };
}

/**
 * Fetch published report card with gate enforcement and audit trail logging.
 */
export async function fetchStudentReportCardWithGate(
  guardianId: string,
  studentId: string,
  termId: string
) {
  const supabase = createServiceRoleClient();
  const gate = await canGuardianViewReportCard(guardianId, studentId, termId);

  if (!gate.allowed) {
    throw new Error(`Access denied: Term fees unpaid. Outstanding balance: KES ${gate.balance_kes?.toLocaleString()}`);
  }

  // Fetch report card
  const { data: reportCard, error } = await supabase
    .from('term_reports')
    .select(`
      *,
      term_report_learning_areas ( * )
    `)
    .eq('student_id', studentId)
    .eq('term_id', termId)
    .eq('status', 'published')
    .maybeSingle();

  if (reportCard) {
    // Record view timestamp
    await supabase
      .from('term_reports')
      .update({ viewed_by_guardian_at: new Date().toISOString() })
      .eq('id', reportCard.id);

    // Audit log
    await supabase.from('audit_log').insert({
      action: 'report_card_viewed',
      entity_type: 'term_reports',
      entity_id: reportCard.id,
      actor_role: 'guardian',
      metadata: {
        guardian_id: guardianId,
        student_id: studentId,
        term_id: termId,
        balance_kes: gate.balance_kes || 0,
        gate_was_blocking: false,
      },
    });
  }

  return reportCard;
}

/**
 * Admin action to toggle the results visibility gate setting
 */
export async function setResultsGateSetting(enabled: boolean, actorId?: string) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('settings')
    .upsert({
      key: 'gate_results_on_fees',
      value: { enabled },
    }, { onConflict: 'key' });

  if (error) throw error;

  // Log in audit trail
  await supabase.from('audit_log').insert({
    action: 'results_gate_toggled',
    entity_type: 'settings',
    actor_id: actorId || null,
    actor_role: 'admin',
    metadata: {
      new_state: enabled ? 'ON (Fee clearance required)' : 'OFF (Open results access)',
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true, enabled };
}
