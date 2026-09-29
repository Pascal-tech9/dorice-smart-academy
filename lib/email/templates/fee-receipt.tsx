/**
 * Fee receipt email template.
 * Renders to an HTML string — no JSX runtime needed.
 * Call renderFeeReceiptEmail() and pass the result to sendEmail().
 */

export interface FeeReceiptEmailData {
  guardianName: string;
  studentName: string;
  admissionNumber: string;
  receiptNumber: string;
  amountPaid: number;
  paymentMethod: string; // 'M-PESA' | 'Cash' | 'Bank'
  mpesaReceiptNumber?: string;
  transactionDate: string; // ISO string
  termLabel: string; // e.g. 'Term 2, 2026'
  remainingBalance: number;
  schoolName: string;
  portalUrl: string;
}

function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function renderFeeReceiptEmail(data: FeeReceiptEmailData): string {
  const navy = '#123F70';
  const marigold = '#C4530F';
  const cream = '#F7F0E1';
  const green = '#1E7B45';
  const ink = '#10243C';

  const paid = formatKES(data.amountPaid);
  const balance = formatKES(data.remainingBalance);
  const dateStr = new Date(data.transactionDate).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const balanceLine =
    data.remainingBalance <= 0
      ? `<span style="color:${green};font-weight:700;">✅ Fees Fully Cleared</span>`
      : `Remaining Balance: <strong>${balance}</strong>`;

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Payment Receipt – ${data.receiptNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${ink};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe0;padding:32px 8px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(18,63,112,0.12);">

        <!-- Header -->
        <tr>
          <td style="background:${navy};padding:28px 32px;text-align:center;">
            <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">
              🏫 Dorice Smart Academy
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:2px;text-transform:uppercase;">
              Inspire, Achieve, Flourish
            </div>
          </td>
        </tr>

        <!-- Orange accent bar -->
        <tr>
          <td style="background:${marigold};height:4px;"></td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px;">
            <p style="margin:0 0 8px;font-size:14px;color:#666;">Dear ${data.guardianName},</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
              We have received your payment for <strong>${data.studentName}</strong> 
              (Admission No. ${data.admissionNumber}). Below is your official receipt.
            </p>

            <!-- Receipt box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${cream};border-radius:10px;border:1px solid rgba(18,63,112,0.12);overflow:hidden;margin-bottom:24px;">
              <tr>
                <td style="background:${navy};padding:12px 20px;">
                  <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                    Official Receipt
                  </span>
                  <span style="float:right;color:rgba(255,255,255,0.8);font-size:13px;">${data.receiptNumber}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;">
                    <tr>
                      <td style="color:#666;border-bottom:1px solid rgba(18,63,112,0.08);">Student</td>
                      <td style="text-align:right;font-weight:600;border-bottom:1px solid rgba(18,63,112,0.08);">${data.studentName}</td>
                    </tr>
                    <tr>
                      <td style="color:#666;border-bottom:1px solid rgba(18,63,112,0.08);">Term</td>
                      <td style="text-align:right;border-bottom:1px solid rgba(18,63,112,0.08);">${data.termLabel}</td>
                    </tr>
                    <tr>
                      <td style="color:#666;border-bottom:1px solid rgba(18,63,112,0.08);">Date</td>
                      <td style="text-align:right;border-bottom:1px solid rgba(18,63,112,0.08);">${dateStr}</td>
                    </tr>
                    <tr>
                      <td style="color:#666;border-bottom:1px solid rgba(18,63,112,0.08);">Method</td>
                      <td style="text-align:right;border-bottom:1px solid rgba(18,63,112,0.08);">${data.paymentMethod}</td>
                    </tr>
                    ${
                      data.mpesaReceiptNumber
                        ? `<tr>
                      <td style="color:#666;border-bottom:1px solid rgba(18,63,112,0.08);">M-PESA Ref</td>
                      <td style="text-align:right;font-family:monospace;font-size:13px;border-bottom:1px solid rgba(18,63,112,0.08);">${data.mpesaReceiptNumber}</td>
                    </tr>`
                        : ''
                    }
                    <tr>
                      <td style="color:#666;font-weight:700;font-size:16px;padding-top:12px;">Amount Paid</td>
                      <td style="text-align:right;font-weight:900;font-size:20px;color:${green};padding-top:12px;">${paid}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Balance status -->
            <p style="font-size:14px;color:#666;margin:0 0 24px;">${balanceLine}</p>

            <!-- CTA -->
            <div style="text-align:center;margin:24px 0;">
              <a href="${data.portalUrl}/portal/fees" 
                 style="display:inline-block;background:${marigold};color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;">
                View Full Statement
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${navy};padding:20px 32px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;line-height:1.8;">
              ${data.schoolName} • P.O. Box 204, Kipkaren River, Kenya<br/>
              This is an automated receipt. Do not reply to this email.<br/>
              <em>Inspire, Achieve, Flourish</em>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
