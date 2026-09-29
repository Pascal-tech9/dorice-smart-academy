/**
 * Fee overdue reminder email template.
 */

export interface FeeReminderEmailData {
  guardianName: string;
  studentName: string;
  admissionNumber: string;
  grade: string;
  termLabel: string;
  overdueAmount: number;
  dueDate: string; // ISO string
  portalUrl: string;
  schoolName: string;
}

function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function renderFeeReminderEmail(data: FeeReminderEmailData): string {
  const navy = '#123F70';
  const marigold = '#C4530F';
  const red = '#C8282D';
  const ink = '#10243C';

  const amount = formatKES(data.overdueAmount);
  const dueStr = new Date(data.dueDate).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Fee Reminder – ${data.studentName}</title>
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

        <!-- Red accent bar for reminder -->
        <tr>
          <td style="background:${red};height:4px;"></td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px;">
            <p style="margin:0 0 8px;font-size:14px;color:#666;">Dear ${data.guardianName},</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
              This is a friendly reminder that <strong>${data.studentName}</strong>'s 
              school fees for <strong>${data.termLabel}</strong> are outstanding.
            </p>

            <!-- Alert box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-radius:10px;border:1px solid ${red};margin-bottom:24px;">
              <tr>
                <td style="padding:20px;text-align:center;">
                  <div style="font-size:13px;color:${red};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                    Outstanding Balance
                  </div>
                  <div style="font-size:32px;font-weight:900;color:${red};">${amount}</div>
                  <div style="font-size:13px;color:#666;margin-top:8px;">Due by ${dueStr}</div>
                </td>
              </tr>
            </table>

            <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px;">
              Please pay via <strong>M-PESA Paybill</strong> using the student's admission 
              number <strong>${data.admissionNumber}</strong> as the account number, or 
              log in to the parent portal to pay online in a few taps.
            </p>

            <!-- CTA -->
            <div style="text-align:center;margin:24px 0;">
              <a href="${data.portalUrl}/portal/fees" 
                 style="display:inline-block;background:${marigold};color:#fff;text-decoration:none;padding:16px 32px;border-radius:10px;font-weight:700;font-size:16px;">
                Pay Now via M-PESA
              </a>
            </div>

            <p style="font-size:13px;color:#888;text-align:center;">
              If you have already made payment, please disregard this reminder or 
              contact the bursar to confirm allocation.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${navy};padding:20px 32px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;line-height:1.8;">
              ${data.schoolName} • P.O. Box 204, Kipkaren River, Kenya<br/>
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
