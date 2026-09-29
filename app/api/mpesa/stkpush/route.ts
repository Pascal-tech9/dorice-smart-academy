/**
 * POST /api/mpesa/register-c2b-urls
 *
 * One-time utility: registers the C2B Validation and Confirmation URLs
 * with Safaricom Daraja for Paybill 400222.
 *
 * Call this once during go-live setup (or re-run if URLs change).
 * Secured by INTERNAL_NOTIFICATION_SECRET.
 *
 * NOTE: STK Push is NOT used. This school uses Paybill C2B only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerC2bUrls } from '@/lib/mpesa/daraja';

const INTERNAL_SECRET = process.env.INTERNAL_NOTIFICATION_SECRET ?? '';

export async function POST(req: NextRequest) {
  if (INTERNAL_SECRET && req.headers.get('x-internal-secret') !== INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const callbackSecret = process.env.MPESA_CALLBACK_SECRET_PATH ?? 'dev_callback_secret';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://doricesmartacademy.sc.ke';

  const validationUrl = `${siteUrl}/api/mpesa/callback`;
  const confirmationUrl = `${siteUrl}/api/mpesa/callback`;

  const result = await registerC2bUrls({ validationUrl, confirmationUrl });

  if (!result.success) {
    return NextResponse.json(
      { error: 'Failed to register C2B URLs', details: result.error ?? result.response },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    validationUrl,
    confirmationUrl,
    darajaResponse: result.response,
    note: `Paybill 400222 C2B URLs registered. Callback secret path: ${callbackSecret}`,
  });
}
