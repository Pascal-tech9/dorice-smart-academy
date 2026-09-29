import { NextResponse } from 'next/server';
import { z } from 'zod';
import { initiateStkPush } from '@/lib/mpesa/daraja';

const RequestSchema = z.object({
  phone: z.string().min(9, 'Phone number is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  admissionNumber: z.string().min(3, 'Student admission number is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phone, amount, admissionNumber } = parsed.data;

    const result = await initiateStkPush({
      phone,
      amount,
      accountReference: admissionNumber,
      description: `Fees ${admissionNumber}`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      checkoutRequestId: result.checkoutRequestId,
      merchantRequestId: result.merchantRequestId,
      message: 'STK push prompt dispatched to your phone. Enter your M-PESA PIN to complete.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
