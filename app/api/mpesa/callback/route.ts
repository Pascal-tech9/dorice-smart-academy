import { NextResponse } from 'next/server';
import { StkCallbackSchema } from '@/lib/mpesa/daraja';

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    // Validate callback structure with Zod
    const parsed = StkCallbackSchema.safeParse(rawBody);
    if (!parsed.success) {
      console.warn('[M-PESA Callback] Invalid payload structure:', parsed.error);
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid payload' }, { status: 400 });
    }

    const { stkCallback } = parsed.data.Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    console.log(`[M-PESA Callback] Received for Checkout: ${CheckoutRequestID} | ResultCode: ${ResultCode}`);

    if (ResultCode === 0 && CallbackMetadata) {
      // Extract metadata items
      let receiptNumber = '';
      let amount = 0;
      let phone = '';

      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') receiptNumber = String(item.Value);
        if (item.Name === 'Amount') amount = Number(item.Value);
        if (item.Name === 'PhoneNumber') phone = String(item.Value);
      }

      console.log(`[M-PESA Payment Success] Receipt: ${receiptNumber} | Amount: ${amount} | Phone: ${phone}`);

      // In production, execute Supabase service-role idempotent insert:
      // INSERT INTO mpesa_transactions (checkout_request_id, mpesa_receipt_number, amount, phone_number, raw_payload, status)
      // VALUES (...) ON CONFLICT (mpesa_receipt_number) DO NOTHING;
    } else {
      console.log(`[M-PESA Payment Cancelled/Failed] Checkout: ${CheckoutRequestID} | Reason: ${ResultDesc}`);
    }

    // Safaricom Daraja expects an immediate 200 response with ResultCode 0
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' }, { status: 200 });
  } catch (error: any) {
    console.error('[M-PESA Callback Exception]:', error.message);
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted with internal log' }, { status: 200 });
  }
}
