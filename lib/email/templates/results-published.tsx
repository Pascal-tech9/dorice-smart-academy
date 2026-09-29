/**
 * Report card published email template.
 * Notifies guardian that a student's results are available.
 */

export interface ResultsPublishedEmailData {
  guardianName: string;
  studentName: string;
  admissionNumber: string;
  grade: string; // e.g. 'Grade 5'
  termLabel: string; // e.g. 'Term 1 2026'
  portalUrl: string;
  schoolName: string;
}

export function renderResultsPublishedEmail(data: ResultsPublishedEmailData): string {
  const navy = '#123F70';
  const marigold = '#C4530F';
  const teal = '#1799B0';
  const ink = '#10243C';

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Report Card Available – ${data.studentName}</title>
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

        <!-- Teal accent bar -->
        <tr>
          <td style="background:${teal};height:4px;"></td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px;">
            <p style="margin:0 0 8px;font-size:14px;color:#666;">Dear ${data.guardianName},</p>

            <!-- Star display -->
            <div style="text-align:center;padding:24px 0;font-size:36px;">⭐⭐⭐</div>

            <h2 style="text-align:center;margin:0 0 8px;font-size:22px;font-weight:900;color:${navy};">
              ${data.termLabel} Report Card is Ready!
            </h2>
            <p style="text-align:center;margin:0 0 24px;font-size:15px;line-height:1.6;color:#555;">
              <strong>${data.studentName}</strong>'s (${data.grade}) academic report card 
              for <strong>${data.termLabel}</strong> has been published by the school.
            </p>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#EBF8FC;border-radius:10px;border:1px solid ${teal};margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;font-size:14px;color:${navy};line-height:1.7;">
                  📋 You can now view and download <strong>${data.studentName}</strong>'s 
                  full report card, including CBC performance levels, teacher comments, 
                  and a beautifully formatted PDF.
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin:24px 0;">
              <a href="${data.portalUrl}/portal/results" 
                 style="display:inline-block;background:${marigold};color:#fff;text-decoration:none;padding:16px 32px;border-radius:10px;font-weight:700;font-size:16px;">
                View Report Card
              </a>
            </div>

            <p style="font-size:13px;color:#888;text-align:center;margin:16px 0 0;">
              Need help? Contact the school office for any queries.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${navy};padding:20px 32px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;line-height:1.8;">
              ${data.schoolName} • P.O. Box 204, Kipkaren River, Kenya<br/>
              This is an automated notification. Do not reply to this email.<br/>
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
