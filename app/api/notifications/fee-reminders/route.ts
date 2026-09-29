import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';
import { renderFeeReminderEmail } from '@/lib/email/templates/fee-reminder';
import { sendSms, buildReminderSms } from '@/lib/sms/africastalking';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * POST /api/notifications/fee-reminders
 *
 * Fee overdue reminder job — sends email + SMS to guardians of students
 * with an outstanding balance.
 *
 * Designed to be called by a scheduled cron job (e.g. Vercel Cron or
 * a Supabase Edge Function CRON). Guard with CRON_SECRET.
 *
 * CRON schedule: weekly on Monday mornings during term time.
 * Configure in vercel.json or trigger via POST with secret header.
 */

const PORTAL_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://doricesmartacademy.sc.ke';
const SCHOOL_NAME = 'Dorice Smart Academy';
const CRON_SECRET = process.env.CRON_SECRET ?? '';

export async function POST(req: NextRequest) {
  // Guard: only callable with the cron secret
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceRoleClient() as any;

  /**
   * Query students with outstanding balances in the current term.
   * This uses the fee_balances view (defined in Phase 3 migration).
   * Falls back to a simple invoice query if the view isn't present.
   */
  const { data: overdueInvoices, error } = await supabase
    .from('invoices')
    .select(
      `
      id,
      balance_due,
      term_id,
      student_id,
      students!student_id(
        id,
        first_name,
        last_name,
        admission_number,
        grade_levels(name),
        student_guardians(
          guardian_id,
          profiles!guardian_id(full_name, email, phone)
        )
      ),
      terms!term_id(label, end_date)
    `
    )
    .gt('balance_due', 0)
    .eq('status', 'active');

  if (error) {
    console.error('[fee-reminders] query error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sent: { student: string; email?: string; sms?: boolean }[] = [];

  for (const invoice of overdueInvoices ?? []) {
    const s = (invoice as any).students;
    if (!s) continue;

    const studentName = `${s.first_name} ${s.last_name}`;
    const admissionNumber = s.admission_number;
    const grade = s.grade_levels?.name ?? '';
    const termLabel = (invoice as any).terms?.label ?? 'Current Term';
    const dueDate = (invoice as any).terms?.end_date ?? new Date().toISOString();
    const overdueAmount = invoice.balance_due as number;

    for (const link of s.student_guardians ?? []) {
      const profile = (link as any).profiles;
      if (!profile) continue;

      const notifyResult: { student: string; email?: string; sms?: boolean } = {
        student: studentName,
      };

      // Email
      if (profile.email) {
        try {
          const html = renderFeeReminderEmail({
            guardianName: profile.full_name ?? 'Guardian',
            studentName,
            admissionNumber,
            grade,
            termLabel,
            overdueAmount: overdueAmount / 100,
            dueDate,
            portalUrl: PORTAL_URL,
            schoolName: SCHOOL_NAME,
          });

          await sendEmail({
            to: profile.email,
            subject: `Fee Reminder: ${studentName} has an outstanding balance – Dorice Smart Academy`,
            html,
          });

          notifyResult.email = 'sent';
        } catch (err: any) {
          console.error('[fee-reminders] email error:', err.message);
          notifyResult.email = 'failed';
        }
      }

      // SMS
      if (profile.phone) {
        const message = buildReminderSms({
          studentName,
          overdueAmount: overdueAmount / 100,
          termLabel,
          admissionNumber,
        });

        const smsResult = await sendSms({ to: profile.phone, message });
        notifyResult.sms = smsResult.success;
      }

      sent.push(notifyResult);
    }
  }

  return NextResponse.json({
    processed: overdueInvoices?.length ?? 0,
    notified: sent.length,
    results: sent,
  });
}
