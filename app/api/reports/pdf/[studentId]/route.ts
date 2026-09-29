import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import * as React from 'react';
import { CbcReportCardPdf } from '@/lib/cbc/report-card-pdf';
import { DEMO_REPORT_CARDS } from '@/lib/cbc/mock-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    
    // Look up student report card data by admission number or student id
    const reportData =
      DEMO_REPORT_CARDS[studentId] ||
      DEMO_REPORT_CARDS['DSA-2023-014']; // default fallback to primary demo student

    if (!reportData) {
      return NextResponse.json({ error: 'Report card not found' }, { status: 404 });
    }

    // react-pdf's renderToBuffer expects a ReactElement<DocumentProps>.
    // We cast here since CbcReportCardPdf returns a <Document> which satisfies
    // that constraint at runtime — TypeScript just can't verify it automatically.
    const element = React.createElement(CbcReportCardPdf, { data: reportData }) as any;
    const pdfBuffer = await renderToBuffer(element);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ReportCard-${reportData.admissionNumber}-${reportData.term.replace(/\s+/g, '')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to render PDF' }, { status: 500 });
  }
}
