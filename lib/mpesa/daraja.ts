import { z } from 'zod';

export interface DarajaConfig {
  environment: 'sandbox' | 'production';
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  callbackUrl: string;
}

export const StkCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            })
          ),
        })
        .optional(),
    }),
  }),
});

export type StkCallbackPayload = z.infer<typeof StkCallbackSchema>;

export function getDarajaConfig(): DarajaConfig {
  return {
    environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    consumerKey: process.env.MPESA_CONSUMER_KEY || 'sandbox_consumer_key',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'sandbox_consumer_secret',
    passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://example.com/api/mpesa/callback',
  };
}

export function generateMpesaTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const min = now.getMinutes().toString().padStart(2, '0');
  const sec = now.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}${hour}${min}${sec}`;
}

export function generateStkPassword(shortcode: string, passkey: string, timestamp: string): string {
  const str = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(str).toString('base64');
}

export function formatKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 10) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith('7') && cleaned.length === 9) return `254${cleaned}`;
  if (cleaned.startsWith('1') && cleaned.length === 9) return `254${cleaned}`;
  return cleaned;
}

export interface StkPushResult {
  success: boolean;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  responseDescription?: string;
  error?: string;
}

export async function initiateStkPush({
  phone,
  amount,
  accountReference,
  description,
}: {
  phone: string;
  amount: number;
  accountReference: string;
  description: string;
}): Promise<StkPushResult> {
  const config = getDarajaConfig();
  const formattedPhone = formatKenyanPhone(phone);
  const timestamp = generateMpesaTimestamp();
  const password = generateStkPassword(config.shortcode, config.passkey, timestamp);

  // In sandbox or dev mode, return simulated active checkout request
  if (!process.env.MPESA_CONSUMER_KEY || config.consumerKey === 'sandbox_consumer_key') {
    const mockCheckoutId = `ws_CO_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      success: true,
      merchantRequestId: `MR_${Date.now()}`,
      checkoutRequestId: mockCheckoutId,
      responseDescription: 'Success. Request accepted for processing in Daraja Sandbox.',
    };
  }

  try {
    const authString = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    const authBase =
      config.environment === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    const tokenRes = await fetch(`${authBase}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` },
    });
    const { access_token } = await tokenRes.json();

    const payload = {
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: config.callbackUrl,
      AccountReference: accountReference.slice(0, 12),
      TransactionDesc: description.slice(0, 13),
    };

    const stkRes = await fetch(`${authBase}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const stkData = await stkRes.json();
    if (stkData.ResponseCode === '0') {
      return {
        success: true,
        merchantRequestId: stkData.MerchantRequestID,
        checkoutRequestId: stkData.CheckoutRequestID,
        responseDescription: stkData.ResponseDescription,
      };
    } else {
      return {
        success: false,
        error: stkData.errorMessage || stkData.ResponseDescription || 'Failed to initiate STK Push',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error communicating with Safaricom Daraja API',
    };
  }
}
