import * as React from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Data Privacy & Protection Notice | Dorice Smart Academy',
  description: 'Compliance with Kenya Data Protection Act, 2019 at Dorice Smart Academy.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-fg py-12 pattern-plaid border-b border-border">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-fluid-xs font-black uppercase tracking-widest text-accent-soft">
              Statutory Compliance
            </span>
            <h1 className="text-fluid-2xl font-black text-primary-fg tracking-tight">
              Data Privacy & Protection Notice
            </h1>
            <p className="text-fluid-base opacity-90 max-w-2xl mx-auto">
              In accordance with the <strong>Kenya Data Protection Act, 2019</strong> and the guidelines of the
              Office of the Data Protection Commissioner (ODPC).
            </p>
          </div>
        </section>

        <section className="py-16 bg-bg">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                  <CardTitle>1. Data Controller Commitment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-fluid-sm text-text leading-relaxed">
                <p>
                  Dorice Smart Academy (P.O. Box 204, Kipkaren River, Kenya) acts as the <strong>Data Controller</strong>{' '}
                  for all personal data relating to enrolled learners, parents, guardians, and staff. We treat the confidentiality,
                  integrity, and security of children's records as our highest priority.
                </p>
                <p>
                  All processing complies strictly with the <strong>Data Protection Act, No. 24 of 2019</strong> of the Laws of Kenya.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <CardTitle>2. Categories of Data Collected</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-fluid-sm text-text leading-relaxed">
                <p>We collect and process only the minimal information necessary for school operations and statutory compliance:</p>
                <ul className="space-y-2 pl-4 list-disc marker:text-primary">
                  <li><strong>Learner Information:</strong> Legal name, birth date, admission number, NEMIS/UPI details, grade level, attendance records, and CBC competency ratings.</li>
                  <li><strong>Guardian Information:</strong> Full name, telephone number (for M-PESA reconciliation and school communication), national identification number, and relationship.</li>
                  <li><strong>Financial Data:</strong> Term fee invoices, M-PESA transaction identifiers, official payment receipts, and fee balance statements.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lock className="w-8 h-8 text-primary" />
                  <CardTitle>3. Protection of Children&apos;s Records</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-fluid-sm text-text leading-relaxed">
                <p>
                  In compliance with Section 35 of the Kenya Data Protection Act 2019 (Processing of personal data relating to children):
                </p>
                <ul className="space-y-2 pl-4 list-disc marker:text-primary">
                  <li>Data is processed only with explicit parental or legal guardian consent obtained at the time of admission.</li>
                  <li>Assessment results and report cards are private and accessible exclusively by authorized guardians and assigned class educators via encrypted sessions.</li>
                  <li>Photographs of children are never published in authenticated portal zones and appear on public informational pages only with verified parental authorization.</li>
                  <li>No learner data is ever shared with third-party marketers or commercial entities.</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Rights of Parents and Guardians</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-fluid-sm text-text leading-relaxed">
                <p>Under the Data Protection Act, parents and legal guardians have the right to:</p>
                <ul className="space-y-2 pl-4 list-disc marker:text-primary">
                  <li>Request access to their child&apos;s educational and fee records at any time.</li>
                  <li>Request correction of inaccurate or incomplete contact or student data.</li>
                  <li>Lodge an inquiry or grievance with the school Data Protection Officer at <code>privacy@doricesmartacademy.sc.ke</code> or directly with the Office of the Data Protection Commissioner (ODPC Kenya).</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
