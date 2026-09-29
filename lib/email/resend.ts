/**
 * Resend email client — server-side only.
 * Usage: import { sendEmail } from '@/lib/email/resend'
 */
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  // Warn at module load so it surfaces early in dev, but don't crash.
  console.warn('[email] RESEND_API_KEY is not set. Emails will not be sent.');
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? 'MISSING_KEY');

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? 'Dorice Smart Academy <notifications@doricesmartacademy.sc.ke>';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  /** Optional reply-to (defaults to school contact) */
  replyTo?: string;
}

/**
 * Send a transactional email via Resend.
 * Returns { id } on success, throws on error.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ id: string }> {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo ?? 'admin@doricesmartacademy.sc.ke',
  });

  if (error) {
    console.error('[email] Resend error:', error);
    throw new Error(error.message ?? 'Failed to send email');
  }

  return { id: data!.id };
}
