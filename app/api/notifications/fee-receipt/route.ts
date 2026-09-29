import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/resend';
import { renderFeeReceiptEmail } from '@/lib/email/templates/fee-receipt';
import { sendSms, buildReceiptSms } from '@/lib/sms/africastalking';
import { createServiceClient } from '@/lib/supabase/service-role';

/**
 * POST /api/notifications/fee-receipt
 *
 * Triggers after a payment is recorded. Sends an email receipt to the guardian
 * and (if SMS_ENABLED) an SMS confirmation.
 *
 * Body schema: see BodySchema below.
 * Auth: service-role calls only (webhook / server action). Guard with a shared secret.
 */

const BodySchema = z.object({
  /** The Supabase guardian profile id */
  guardianId: z.string().uuid(),
  studentId: z.string().uuid(),
  receiptNumber: z.string(),
  amountPaid: z.number().int().positive(),
  paymentMethod: z.enum(['M-PESA', 'Cash', 'Bank', 'Cheque']),
  mpesaReceiptNumber: z.string().optional(),
  transactionDate: z.string().datetime(),
  termLabel: z.string(),
  remainingBalance: z.number().int(),
});

const PORTAL_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://doricesmartacademy.sc.ke';
const SCHOOL_NAME = 'Dorice Smart Academy';
const INTERNAL_SECRET = process.env.INTERNAL_NOTIFICATION_SECRET ?? '';

export async function POST(req: NextRequest) {
  // Guard: require internal secret header to prevent abuse
  if (
    INTERNAL_SECRET &&
    req.headers.get('x-internal-secret') !== INTERNAL_SECRET
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const supabase = createServiceClient();

  // Fetch guardian and student details
  const [{ data: guardian }, { data: student }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', data.guardianId)
      .single(),
    supabase
      .from('students')
      .select('first_name, last_name, admission_number')
      .eq('id', data.studentId)
      .single(),
  ]);

  if (!guardian || !student) {
    return NextResponse.json({ error: 'Guardian or student not found' }, { status: 404 });
  }

  const studentName = `${student.first_name} ${student.last_name}`;
  const emailResults: Record<string, unknown> = {};
  const smsResults: Record<string, unknown> = {};

  // ── Email ──────────────────────────────────────────────────────────────────
  if (guardian.email) {
    try {
      const html = renderFeeReceiptEmail({
        guardianName: guardian.full_name ?? 'Guardian',
        studentName,
        admissionNumber: student.admission_number,
        receiptNumber: data.receiptNumber,
        amountPaid: data.amountPaid / 100, // stored as integer cents
        paymentMethod: data.paymentMethod,
        mpesaReceiptNumber: data.mpesaReceiptNumber,
        transactionDate: data.transactionDate,
        termLabel: data.termLabel,
        remainingBalance: data.remainingBalance / 100,
        schoolName: SCHOOL_NAME,
        portalUrl: PORTAL_URL,
      });

      const result = await sendEmail({
        to: guardian.email,
        subject: `Payment Receipt ${data.receiptNumber} – ${studentName}`,
        html,
      });

      emailResults.id = result.id;
      emailResults.status = 'sent';
    } catch (err: any) {
      console.error('[fee-receipt-notify] email error:', err.message);
      emailResults.status = 'failed';
      emailResults.error = err.message;
    }
  } else {
    emailResults.status = 'skipped_no_email';
  }

  // ── SMS ────────────────────────────────────────────────────────────────────
  if (guardian.phone) {
    const message = buildReceiptSms({
      studentName,
      amountPaid: data.amountPaid / 100,
      receiptNumber: data.receiptNumber,
      remainingBalance: data.remainingBalance / 100,
    });

    const result = await sendSms({ to: guardian.phone, message });
    smsResults.status = result.success ? 'sent' : 'skipped_or_failed';
    if (result.messageId) smsResults.messageId = result.messageId;
    if (result.error) smsResults.error = result.error;
  } else {
    smsResults.status = 'skipped_no_phone';
  }

  return NextResponse.json({ email: emailResults, sms: smsResults });
}
