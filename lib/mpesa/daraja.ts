/**
 * Daraja C2B Paybill helpers — Paybill 400222
 *
 * Dorice Smart Academy uses Paybill C2B only (no STK Push).
 * Parents pay from M-PESA menu: Lipa Na M-Pesa → Paybill → 400222
 * Account number format: 369369#StudentName,Grade (confirm with school)
 *
 * This file handles:
 *  1. Getting an OAuth access token from Daraja
 *  2. Registering C2B Validation / Confirmation URLs
 *  3. Nightly reconciliation via QueryTransaction
 *  4. Zod schemas for the C2B confirmation callback payload
 *  5. Account-number parsing (name + grade extraction)
 */

import { z } from 'zod';

// ─── Config ──────────────────────────────────────────────────────────────────

export interface DarajaConfig {
  environment: 'sandbox' | 'production';
  consumerKey: string;
  consumerSecret: string;
  /** Paybill passkey — never expose to client */
  passkey: string;
  /** Confirmed Paybill number: 400222 */
  shortcode: string;
  /** Unguessable path segment for callback URLs */
  callbackSecret: string;
}

export function getDarajaConfig(): DarajaConfig {
  return {
    environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') ?? 'sandbox',
    consumerKey: process.env.MPESA_CONSUMER_KEY ?? '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET ?? '',
    passkey: process.env.MPESA_PASSKEY ?? '',
    shortcode: process.env.MPESA_SHORTCODE ?? '400222',
    callbackSecret: process.env.MPESA_CALLBACK_SECRET_PATH ?? 'dev_only_secret',
  };
}

export function getDarajaBaseUrl(env: 'sandbox' | 'production'): string {
  return env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

// ─── Auth token ──────────────────────────────────────────────────────────────

export async function getDarajaAccessToken(): Promise<string> {
  const config = getDarajaConfig();

  if (!config.consumerKey || !config.consumerSecret) {
    // In dev/sandbox without real keys, return a mock token
    console.warn('[daraja] No credentials set — returning mock token for dev');
    return 'mock_access_token_for_dev';
  }

  const base = getDarajaBaseUrl(config.environment);
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');

  const res = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`[daraja] OAuth token request failed: ${res.status} ${await res.text()}`);
  }

  const { access_token } = await res.json();
  return access_token as string;
}

// ─── C2B URL Registration ─────────────────────────────────────────────────────

/**
 * Register C2B Validation and Confirmation URLs with Daraja.
 * Run this once during go-live setup (not on every request).
 *
 * Validation URL: GET — respond 200 { ResultCode: 0 } to accept all payments.
 * Confirmation URL: POST — receive payment details and persist them.
 */
export async function registerC2bUrls(opts: {
  validationUrl: string;
  confirmationUrl: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const config = getDarajaConfig();

  try {
    const token = await getDarajaAccessToken();
    const base = getDarajaBaseUrl(config.environment);

    const res = await fetch(`${base}/mpesa/c2b/v1/registerurl`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ShortCode: config.shortcode,
        ResponseType: 'Completed',
        ConfirmationURL: opts.confirmationUrl,
        ValidationURL: opts.validationUrl,
      }),
    });

    const json = await res.json();
    return { success: res.ok, response: json };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── C2B Callback Schemas ─────────────────────────────────────────────────────

/**
 * Daraja C2B Confirmation callback payload schema.
 * Safaricom sends this as a POST to the Confirmation URL.
 */
export const C2bConfirmationSchema = z.object({
  TransactionType: z.string(),           // e.g. "Pay Bill"
  TransID: z.string(),                   // M-PESA receipt number (unique)
  TransTime: z.string(),                 // "YYYYMMDDHHmmss"
  TransAmount: z.string(),               // Amount as string e.g. "1500.00"
  BusinessShortCode: z.string(),         // "400222"
  BillRefNumber: z.string(),             // The account number entered by parent
  InvoiceNumber: z.string().optional(),
  OrgAccountBalance: z.string().optional(),
  ThirdPartyTransID: z.string().optional(),
  MSISDN: z.string(),                    // Payer phone number (may be masked)
  FirstName: z.string().optional(),
  MiddleName: z.string().optional(),
  LastName: z.string().optional(),
});

export type C2bConfirmationPayload = z.infer<typeof C2bConfirmationSchema>;

/**
 * Daraja C2B Validation callback payload schema.
 * Safaricom sends GET request; we must respond 200 { ResultCode: 0, ResultDesc: "Success" }.
 */
export const C2bValidationSchema = z.object({
  TransactionType: z.string().optional(),
  TransID: z.string().optional(),
  TransTime: z.string().optional(),
  TransAmount: z.string().optional(),
  BusinessShortCode: z.string().optional(),
  BillRefNumber: z.string().optional(),
  MSISDN: z.string().optional(),
  FirstName: z.string().optional(),
  LastName: z.string().optional(),
});

// ─── Account Number Parsing ───────────────────────────────────────────────────

export interface ParsedAccountNumber {
  /** Raw account number string as entered */
  raw: string;
  /** Parsed student name (may be empty if format unrecognised) */
  studentName: string | null;
  /** Parsed grade label (may be empty) */
  grade: string | null;
  /** Whether the format was recognised */
  recognised: boolean;
}

/**
 * Parse the BillRefNumber from a C2B callback.
 *
 * Expected format: 369369#StudentName,Grade
 * Examples:
 *   "369369#JohnDoe,Grade3"    → { studentName: "JohnDoe", grade: "Grade3" }
 *   "DSA-2023-001"             → { studentName: null, grade: null } (admission no fallback)
 *
 * TODO: confirm the exact format with the school before go-live.
 */
export function parseAccountNumber(raw: string): ParsedAccountNumber {
  if (!raw) return { raw, studentName: null, grade: null, recognised: false };

  // Format: 369369#Name,Grade
  const hashMatch = raw.match(/^369369#([^,]+),(.+)$/i);
  if (hashMatch) {
    return {
      raw,
      studentName: hashMatch[1].trim(),
      grade: hashMatch[2].trim(),
      recognised: true,
    };
  }

  // Fallback: might be admission number like DSA-2023-001
  // We can't parse name/grade from it, but we can match by admission number
  const admissionMatch = raw.match(/^DSA-\d{4}-\d{3,}$/i);
  if (admissionMatch) {
    return { raw, studentName: null, grade: null, recognised: true };
  }

  return { raw, studentName: null, grade: null, recognised: false };
}

// ─── Phone Formatting ─────────────────────────────────────────────────────────

export function formatKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254') && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 10) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith('7') && cleaned.length === 9) return `254${cleaned}`;
  if (cleaned.startsWith('1') && cleaned.length === 9) return `254${cleaned}`;
  return cleaned;
}

// ─── Timestamp / misc ─────────────────────────────────────────────────────────

export function generateMpesaTimestamp(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
}

// ─── Reconciliation (QueryTransaction) ───────────────────────────────────────

export interface ReconciliationResult {
  found: boolean;
  receiptNumber?: string;
  amount?: number;
  status?: string;
  error?: string;
}

/**
 * Query Daraja for a transaction by its M-PESA receipt number.
 * Used by the nightly reconciliation job to catch callbacks that never arrived.
 *
 * NOTE: QueryTransaction requires an initiator name and security credential
 * which must be configured in the Daraja portal for production.
 */
export async function queryTransaction(
  receiptNumber: string
): Promise<ReconciliationResult> {
  const config = getDarajaConfig();

  if (!config.consumerKey) {
    console.warn('[daraja] No credentials — skipping live QueryTransaction');
    return { found: false, error: 'NO_CREDENTIALS' };
  }

  try {
    const token = await getDarajaAccessToken();
    const base = getDarajaBaseUrl(config.environment);

    const res = await fetch(`${base}/mpesa/transactionstatus/v1/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Initiator: process.env.MPESA_INITIATOR_NAME ?? 'testapi',
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL ?? '',
        CommandID: 'TransactionStatusQuery',
        TransactionID: receiptNumber,
        PartyA: config.shortcode,
        IdentifierType: '4',
        ResultURL: `https://${process.env.NEXT_PUBLIC_SITE_URL}/api/mpesa/reconcile/result`,
        QueueTimeOutURL: `https://${process.env.NEXT_PUBLIC_SITE_URL}/api/mpesa/reconcile/timeout`,
        Remarks: 'Reconciliation query',
        Occasion: '',
      }),
    });

    const json = await res.json();
    const code = json?.ResponseCode ?? json?.errorCode;

    if (code === '0') {
      return { found: true, status: 'queued', receiptNumber };
    }

    return { found: false, error: json?.errorMessage ?? 'QUERY_FAILED' };
  } catch (err: any) {
    return { found: false, error: err.message };
  }
}
