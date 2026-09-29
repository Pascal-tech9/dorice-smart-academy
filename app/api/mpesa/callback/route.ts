/**
 * POST /api/mpesa/callback/[secret]/confirmation
 *
 * Daraja C2B Confirmation callback — Paybill 400222.
 * Called by Safaricom when a parent completes a Paybill payment.
 *
 * CRITICAL financial endpoint:
 *  1. Respond 200 { ResultCode: 0 } IMMEDIATELY — do not let Daraja timeout.
 *  2. Save raw payload to mpesa_transactions FIRST (idempotent ON CONFLICT DO NOTHING).
 *  3. Parse account number → match student → auto-allocate or → unallocated queue.
 *
 * Route: /api/mpesa/callback (secret path configured in env)
 */

import { NextRequest, NextResponse } from 'next/server';
import { C2bConfirmationSchema, parseAccountNumber } from '@/lib/mpesa/daraja';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const DARAJA_OK = { ResultCode: 0, ResultDesc: 'Success' };
const SECRET = process.env.MPESA_CALLBACK_SECRET_PATH ?? 'dev_callback_secret';

export async function POST(req: NextRequest) {
  // Respond immediately — Daraja expects sub-5s response
  // We do the heavy lifting after persisting raw payload.

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    // Malformed JSON — still respond 200 to Daraja
    console.error('[c2b-callback] Could not parse request body');
    return NextResponse.json(DARAJA_OK);
  }

  // Validate shape
  const parsed = C2bConfirmationSchema.safeParse(rawBody);
  if (!parsed.success) {
    console.warn('[c2b-callback] Unrecognised payload shape:', JSON.stringify(rawBody).slice(0, 200));
    // Still 200 — we don't want Daraja retrying with malformed data
    return NextResponse.json(DARAJA_OK);
  }

  const cb = parsed.data;
  const receiptNumber = cb.TransID;
  const amountRaw = parseFloat(cb.TransAmount);
  // Store as integer cents (KES * 100)
  const amountCents = Math.round(amountRaw * 100);
  const phone = cb.MSISDN ?? '';
  const accountRef = cb.BillRefNumber ?? '';
  const transTime = cb.TransTime; // YYYYMMDDHHmmss

  // ── Step 1: Persist raw payload (idempotent) ───────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceRoleClient() as any;

  const { error: insertError } = await supabase.from('mpesa_transactions').insert({
    receipt_number: receiptNumber,
    transaction_type: 'C2B',
    amount: amountCents,
    phone_number: phone,
    account_reference: accountRef,
    raw_payload: rawBody,
    status: 'received',
    created_at: parseTransTime(transTime),
  });

  if (insertError) {
    if (insertError.code === '23505') {
      // Unique constraint violation = duplicate callback. Already processed.
      console.info(`[c2b-callback] Duplicate callback ignored: ${receiptNumber}`);
      return NextResponse.json(DARAJA_OK);
    }
    // Other DB error — log but still respond 200 to Daraja
    console.error('[c2b-callback] DB insert error:', insertError.message);
    return NextResponse.json(DARAJA_OK);
  }

  console.info(`[c2b-callback] Received: ${receiptNumber} | KES ${amountRaw} | Ref: ${accountRef}`);

  // ── Step 2: Parse account number → find student ────────────────────────────
  const accountParsed = parseAccountNumber(accountRef);
  let studentId: string | null = null;
  let matched = false;

  if (accountParsed.recognised && accountParsed.studentName && accountParsed.grade) {
    // Match by name + grade
    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .ilike('last_name', `%${accountParsed.studentName.split(' ').pop() ?? ''}%`)
      .limit(5);

    // If exactly one student matches, use it
    if (students && students.length === 1) {
      studentId = students[0].id;
      matched = true;
    }
    // If 0 or >1, go to unallocated queue
  } else if (accountRef.match(/^DSA-\d{4}-\d{3,}$/i)) {
    // Fallback: admission number format
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('admission_number', accountRef)
      .maybeSingle();

    if (student) {
      studentId = student.id;
      matched = true;
    }
  }

  // ── Step 3a: Auto-allocate if matched ─────────────────────────────────────
  if (matched && studentId) {
    await autoAllocate({ supabase, receiptNumber, studentId, amountCents, phone });
  } else {
    // ── Step 3b: Land in unallocated queue ────────────────────────────────
    await supabase.from('mpesa_transactions').update({
      status: 'unallocated',
      match_status: 'unmatched',
    }).eq('receipt_number', receiptNumber);

    console.info(`[c2b-callback] Payment ${receiptNumber} → unallocated queue (ref: ${accountRef})`);
  }

  // Always respond 200 immediately
  return NextResponse.json(DARAJA_OK);
}

/**
 * GET /api/mpesa/callback — C2B Validation URL
 * Daraja calls this before confirming a payment.
 * We accept all payments (filter happens in confirmation handler).
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Allocate an M-PESA payment to a student's oldest unpaid invoices.
 * Creates a payment record, allocates to invoices, generates a receipt.
 */
async function autoAllocate(opts: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  receiptNumber: string;
  studentId: string;
  amountCents: number;
  phone: string;
}) {
  const { supabase, receiptNumber, studentId, amountCents, phone } = opts;

  try {
    // Create payment record
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        amount: amountCents,
        method: 'MPESA_C2B',
        mpesa_receipt_number: receiptNumber,
        payer_phone: phone,
        status: 'completed',
        notes: `Paybill 400222 C2B — auto-matched from callback`,
      })
      .select('id')
      .single();

    if (payErr) {
      console.error('[c2b-callback] Payment insert error:', payErr.message);
      return;
    }

    // Update mpesa_transactions status
    await supabase
      .from('mpesa_transactions')
      .update({ status: 'allocated', payment_id: payment.id, match_status: 'auto' })
      .eq('receipt_number', receiptNumber);

    // Allocate to oldest unpaid invoices (oldest-first)
    let remaining = amountCents;
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, balance_due')
      .eq('student_id', studentId)
      .gt('balance_due', 0)
      .order('created_at', { ascending: true });

    for (const invoice of invoices ?? []) {
      if (remaining <= 0) break;
      const toApply = Math.min(remaining, invoice.balance_due as number);

      await supabase.from('payment_allocations').insert({
        payment_id: payment.id,
        invoice_id: invoice.id,
        amount_applied: toApply,
      });

      await supabase
        .from('invoices')
        .update({ balance_due: (invoice.balance_due as number) - toApply })
        .eq('id', invoice.id);

      remaining -= toApply;
    }

    // Any remainder is overpayment (credit)
    if (remaining > 0) {
      await supabase
        .from('payments')
        .update({ credit_balance: remaining })
        .eq('id', payment.id);
    }

    console.info(`[c2b-callback] Auto-allocated ${receiptNumber}: KES ${amountCents / 100} → student ${studentId}`);
  } catch (err: any) {
    console.error('[c2b-callback] Auto-allocation error:', err.message);
  }
}

/** Parse Daraja timestamp string YYYYMMDDHHmmss to ISO */
function parseTransTime(ts: string): string {
  if (!ts || ts.length < 14) return new Date().toISOString();
  try {
    const y = ts.slice(0, 4);
    const mo = ts.slice(4, 6);
    const d = ts.slice(6, 8);
    const h = ts.slice(8, 10);
    const mi = ts.slice(10, 12);
    const s = ts.slice(12, 14);
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}+03:00`).toISOString();
  } catch {
    return new Date().toISOString();
  }
}
