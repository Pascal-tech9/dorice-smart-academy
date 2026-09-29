/**
 * SMS notification service — Africa's Talking.
 * Feature-flagged: only active when SMS_ENABLED=true in environment.
 * The interface is minimal so it can be swapped for another provider.
 */

export interface SmsOptions {
  to: string; // E.164 format, e.g. +254700000000
  message: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const SMS_ENABLED = process.env.SMS_ENABLED === 'true';

/**
 * Send an SMS via Africa's Talking.
 * Returns { success: false } silently when SMS_ENABLED is false.
 */
export async function sendSms(opts: SmsOptions): Promise<SmsResult> {
  if (!SMS_ENABLED) {
    // Feature-flagged off — log intent but do not throw.
    console.info(`[sms] Suppressed (SMS_ENABLED=false): ${opts.to} — ${opts.message.slice(0, 40)}…`);
    return { success: false };
  }

  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME ?? 'sandbox';

  if (!apiKey) {
    console.error('[sms] AFRICASTALKING_API_KEY is not set.');
    return { success: false, error: 'SMS_API_KEY_MISSING' };
  }

  const baseUrl =
    username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com'
      : 'https://api.africastalking.com';

  try {
    const res = await fetch(`${baseUrl}/version1/messaging`, {
      method: 'POST',
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        to: opts.to,
        message: opts.message,
        // Sender ID registered with Africa's Talking
        from: 'DORICESA',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[sms] Africa\'s Talking HTTP error:', res.status, text);
      return { success: false, error: `HTTP_${res.status}` };
    }

    const json = await res.json();
    const recipient = json?.SMSMessageData?.Recipients?.[0];

    if (recipient?.status === 'Success') {
      return { success: true, messageId: recipient.messageId };
    }

    console.error('[sms] Africa\'s Talking response:', JSON.stringify(json));
    return { success: false, error: recipient?.status ?? 'UNKNOWN' };
  } catch (err: any) {
    console.error('[sms] Network error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

/** Build a short fee receipt SMS message */
export function buildReceiptSms(opts: {
  studentName: string;
  amountPaid: number;
  receiptNumber: string;
  remainingBalance: number;
}): string {
  const paid = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(opts.amountPaid);

  const balMsg =
    opts.remainingBalance <= 0
      ? 'Fees fully cleared.'
      : `Balance: KES ${opts.remainingBalance.toLocaleString('en-KE')}.`;

  return (
    `DORICE SA: Payment rcvd KES ${paid} for ${opts.studentName}. ` +
    `Receipt ${opts.receiptNumber}. ${balMsg} Portal: doricesmartacademy.sc.ke`
  );
}

/** Build a short overdue reminder SMS */
export function buildReminderSms(opts: {
  studentName: string;
  overdueAmount: number;
  termLabel: string;
  admissionNumber: string;
}): string {
  const amount = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(opts.overdueAmount);

  return (
    `DORICE SA: Reminder — ${opts.studentName}'s ${opts.termLabel} fee balance is ${amount}. ` +
    `Pay via M-PESA Paybill, Acc: ${opts.admissionNumber}. doricesmartacademy.sc.ke`
  );
}
