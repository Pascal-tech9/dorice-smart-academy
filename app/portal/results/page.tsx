'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Award,
  Calendar,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Sparkles,
  HelpCircle,
  FileCheck,
  Lock,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DEMO_STUDENTS, type StudentRecord } from '@/lib/people/mock-data';
import { FamilySwitcher } from '@/components/portal/family-switcher';
import { MpesaPaymentModal } from '@/components/portal/mpesa-payment-modal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CbcStars } from '@/components/ui/cbc-stars';
import {
  DEMO_REPORT_CARDS,
  CBC_RUBRIC_CONFIG,
  type CbcReportCardData,
} from '@/lib/cbc/mock-data';

export default function GuardianResultsPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [students, setStudents] = React.useState<StudentRecord[]>(DEMO_STUDENTS.slice(0, 2));
  const [activeStudent, setActiveStudent] = React.useState<StudentRecord>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('student') || localStorage.getItem('dsa_active_student_adm');
      if (param) {
        const found = DEMO_STUDENTS.find(
          (s) =>
            s.admissionNumber === param ||
            s.admissionNumber.replace(/\//g, '-') === param ||
            s.admissionNumber.replace(/-/g, '/') === param ||
            s.firstName.toLowerCase() === param.toLowerCase()
        );
        if (found) return found;
      }
    }
    return DEMO_STUDENTS[0];
  });
  const [selectedTerm, setSelectedTerm] = React.useState<string>('Term 1 2026');
  const [isDownloading, setIsDownloading] = React.useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState<boolean>(false);
  const [gateEnabled, setGateEnabled] = React.useState<boolean>(true);

  // Load live students, term fee balance, and gate setting from Supabase
  React.useEffect(() => {
    async function loadResultsAndGate() {
      try {
        // 1. Fetch gate setting
        const { data: settingData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'gate_results_on_fees')
          .maybeSingle();

        if (settingData?.value) {
          const enabled = (settingData.value as any).enabled ?? (settingData.value as any).gate_results_on_fees ?? true;
          setGateEnabled(enabled);
        }

        // 2. Fetch live guardian children & invoices
        const { data, error } = await supabase
          .from('students')
          .select(`
            id,
            admission_number,
            first_name,
            last_name,
            gender,
            date_of_birth,
            nemis_upi,
            status,
            classes:class_id ( name ),
            invoices ( total_amount, balance_due, status )
          `)
          .in('admission_number', ['DSA/2026/001', 'DSA/2026/002', 'DSA-2026-0001', 'DSA-2026-0002']);

        if (data && data.length > 0) {
          const mapped: StudentRecord[] = data.map((s: any) => {
            const inv = s.invoices?.[0];
            const feeBal = inv ? Number(inv.balance_due) : (s.admission_number?.includes('001') ? 0 : 15500);
            const feeTot = inv ? Number(inv.total_amount) : 18500;
            return {
              id: s.id,
              admissionNumber: s.admission_number,
              firstName: s.first_name,
              lastName: s.last_name,
              gender: s.gender,
              dateOfBirth: s.date_of_birth,
              nemisUpi: s.nemis_upi || 'NEMIS-PENDING',
              gradeLevel: s.classes?.name ? s.classes.name.replace(' Main', '') : (s.admission_number?.includes('001') ? 'Grade 4' : 'Grade 2'),
              className: s.classes?.name || (s.admission_number?.includes('001') ? 'Grade 4 Main' : 'Grade 2 Main'),
              status: s.status || 'active',
              feeBalance: feeBal,
              termFee: feeTot,
              guardians: [
                {
                  name: 'Mary Wanjiku',
                  relationship: 'Mother',
                  phone: '+254712345678',
                  isPrimary: true,
                  canPay: true,
                },
              ],
              recentResults: {
                term: 'Term 1',
                year: '2026',
                overallLevel: s.admission_number?.includes('001') ? 'EE' : 'ME',
                attendanceDays: s.admission_number?.includes('001') ? 63 : 61,
                totalDays: 65,
                remarks: s.admission_number?.includes('001') ? 'Outstanding academic and co-curricular performance.' : 'Good steady progress in all learning areas.',
              },
            };
          });

          setStudents(mapped);

          // Preserve active student selection
          const targetAdm =
            (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('student') : null) ||
            (typeof window !== 'undefined' ? localStorage.getItem('dsa_active_student_adm') : null) ||
            activeStudent.admissionNumber;

          const matched = mapped.find(
            (m) =>
              m.admissionNumber === targetAdm ||
              m.admissionNumber.replace(/\//g, '-') === targetAdm ||
              m.admissionNumber.replace(/-/g, '/') === targetAdm ||
              m.firstName.toLowerCase() === targetAdm?.toLowerCase() ||
              m.id === activeStudent.id
          );

          if (matched) {
            setActiveStudent(matched);
          } else if (mapped.length > 0) {
            setActiveStudent(mapped[0]);
          }
        }
      } catch (err) {
        console.warn('Using demo data in results page:', err);
      }
    }

    loadResultsAndGate();
  }, [supabase]);

  // Is results gate blocking this learner?
  const isFeesCleared = activeStudent.feeBalance <= 0;
  const isGateBlocking = gateEnabled && !isFeesCleared;

  // Retrieve student report card data with robust fallbacks
  const fallbackReport = DEMO_REPORT_CARDS['DSA-2023-014'] || Object.values(DEMO_REPORT_CARDS)[0];
  const reportData: CbcReportCardData =
    DEMO_REPORT_CARDS[activeStudent.admissionNumber] ||
    DEMO_REPORT_CARDS[activeStudent.admissionNumber.replace(/\//g, '-')] ||
    fallbackReport;

  const attendanceDays = reportData?.attendanceDays ?? 63;
  const totalDays = reportData?.totalDays ?? 65;
  const overallLevel = reportData?.overallLevel ?? 'ME';
  const rubricConfig = CBC_RUBRIC_CONFIG[overallLevel] || CBC_RUBRIC_CONFIG.ME;

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(`/api/reports/pdf/${activeStudent.admissionNumber}`);
      if (!res.ok) throw new Error('Failed to generate report card PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ReportCard-${activeStudent.admissionNumber}-Term1-2026.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Error downloading PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1240px] mx-auto space-y-8">
        
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Home</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-primary">
                CBC Academic Performance & Report Card
              </h1>
              {isFeesCleared ? (
                <Badge variant="paid" label="Term 1, 2026 ✓ Fees Cleared" />
              ) : (
                <Badge variant="unpaid" label="Fee Clearance Required" />
              )}
            </div>
            <p className="text-fluid-sm text-text-muted mt-1">
              Dorice Smart Academy • Official Competency Assessment for {activeStudent.firstName} {activeStudent.lastName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <FamilySwitcher
              students={students}
              activeStudent={activeStudent}
              onSelectStudent={setActiveStudent}
            />
          </div>
        </div>

        {/* Results Visibility Gate Blocked View */}
        {isGateBlocking ? (
          <div className="space-y-6">
            <Card className="border-2 border-border shadow-md overflow-hidden">
              <div className="p-8 sm:p-12 flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-warning-soft text-warning-fg flex items-center justify-center border border-warning-border">
                  <Lock className="w-8 h-8 text-primary" />
                </div>

                <div className="space-y-2">
                  <span className="text-fluid-xs font-bold uppercase tracking-wider text-text-muted">
                    {selectedTerm} Report Card
                  </span>
                  <h2 className="text-fluid-2xl font-black text-primary">
                    Your child&apos;s results are not yet available
                  </h2>
                  <p className="text-fluid-sm text-text-muted leading-relaxed">
                    Under school policy, term assessment report cards are released once all fee invoices for the term are cleared. 
                    Results will be visible immediately after payment is confirmed.
                  </p>
                </div>

                <div className="w-full p-4 rounded-[12px] bg-bg border border-border flex items-center justify-between">
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-text-muted uppercase">Outstanding Term Balance</div>
                    <div className="text-fluid-lg font-black text-danger-fg">
                      KES {activeStudent.feeBalance.toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="partial" label="Pending Clearance" />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-2">
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full sm:w-auto gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Pay with M-PESA (Paybill 400222)</span>
                  </Button>

                  <Link href="/portal/fees" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full">
                      View Fee Statement
                    </Button>
                  </Link>
                </div>

                <div className="text-fluid-xs text-text-muted pt-4 border-t border-border flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                  <span>Payments made via Safaricom Paybill 400222 are reconciled automatically and unlock results within 1 minute.</span>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* Results Cleared View */
          <>
            {/* Term Switcher & Top Action Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[14px] bg-surface border border-border shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-fluid-xs font-bold text-text-muted uppercase tracking-wider">
                  Academic Term:
                </span>
                <div className="flex gap-2">
                  {['Term 1 2026', 'Term 3 2025', 'Term 2 2025'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setSelectedTerm(term)}
                      className={`px-3 py-1.5 rounded-[8px] text-fluid-xs font-bold transition-colors cursor-pointer ${
                        selectedTerm === term
                          ? 'bg-primary text-primary-fg shadow-xs'
                          : 'bg-bg text-text-muted hover:text-text border border-border'
                      }`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Single 10% Accent CTA Button */}
              <div>
                <Button
                  variant="accent"
                  size="lg"
                  className="gap-2 w-full sm:w-auto shadow-md"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                >
                  <Download className="w-5 h-5" />
                  <span>{isDownloading ? 'Generating PDF...' : 'Download Official PDF Report Card'}</span>
                </Button>
              </div>
            </div>

            {/* Overall Assessment Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-2 border-border">
                <CardHeader className="pb-2">
                  <div className="text-fluid-xs font-bold text-text-muted uppercase">Overall Mastery Level</div>
                  <div className="text-fluid-xl font-black text-primary mt-1">
                    {overallLevel === 'EE' && 'Exceeding (EE)'}
                    {overallLevel === 'ME' && 'Meeting (ME)'}
                    {overallLevel === 'AE' && 'Approaching (AE)'}
                    {overallLevel === 'BE' && 'Below (BE)'}
                  </div>
                </CardHeader>
                <CardContent className="text-fluid-xs text-text-muted">
                  {rubricConfig.shortDesc || rubricConfig.label}
                </CardContent>
              </Card>

              <Card className="border-2 border-border">
                <CardHeader className="pb-2">
                  <div className="text-fluid-xs font-bold text-text-muted uppercase">Core Rubric Stars</div>
                  <div className="mt-2">
                    <CbcStars level={overallLevel} size="md" />
                  </div>
                </CardHeader>
                <CardContent className="text-fluid-xs text-text-muted">
                  {overallLevel === 'EE' ? '4 of 4 Points' : '3 of 4 Points'} (CBC Standard)
                </CardContent>
              </Card>

              <Card className="border-2 border-border">
                <CardHeader className="pb-2">
                  <div className="text-fluid-xs font-bold text-text-muted uppercase">Term Attendance</div>
                  <div className="text-fluid-xl font-black text-primary mt-1">
                    {attendanceDays} / {totalDays} Days
                  </div>
                </CardHeader>
                <CardContent className="text-fluid-xs text-text-muted">
                  {Math.round((attendanceDays / (totalDays || 1)) * 100)}% Regular Attendance
                </CardContent>
              </Card>

              <Card className="border-2 border-border">
                <CardHeader className="pb-2">
                  <div className="text-fluid-xs font-bold text-text-muted uppercase">Fee Clearance Status</div>
                  <div className="text-fluid-xl font-black text-success-fg mt-1">
                    Cleared (KES 0)
                  </div>
                </CardHeader>
                <CardContent className="text-fluid-xs text-text-muted">
                  Full access granted
                </CardContent>
              </Card>
            </div>

            {/* CBC 4-Tier Rubric Explainer Guide */}
            <div className="p-4 rounded-[12px] bg-primary-soft border border-primary/20">
              <div className="text-fluid-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Kenya Competency Based Curriculum (CBC) Grading Rubric Guide</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-fluid-xs">
                <div className="p-2.5 rounded-[8px] bg-surface border border-border">
                  <div className="font-bold text-success-fg">EE • Exceeding Expectations (4★)</div>
                  <div className="text-text-muted mt-0.5">80% - 100% • Exceptional mastery beyond grade standard.</div>
                </div>
                <div className="p-2.5 rounded-[8px] bg-surface border border-border">
                  <div className="font-bold text-primary">ME • Meeting Expectations (3★)</div>
                  <div className="text-text-muted mt-0.5">65% - 79% • Consistently achieves required learning goals.</div>
                </div>
                <div className="p-2.5 rounded-[8px] bg-surface border border-border">
                  <div className="font-bold text-warning-fg">AE • Approaching Expectations (2★)</div>
                  <div className="text-text-muted mt-0.5">50% - 64% • Developing competency; needs guided practice.</div>
                </div>
                <div className="p-2.5 rounded-[8px] bg-surface border border-border">
                  <div className="font-bold text-danger-fg">BE • Below Expectations (1★)</div>
                  <div className="text-text-muted mt-0.5">0% - 49% • Struggles with fundamentals; intensive support.</div>
                </div>
              </div>
            </div>

            {/* Detailed Learning Areas Assessment Table */}
            <Card className="overflow-hidden border-2 border-border shadow-md">
              <CardHeader className="bg-primary-soft border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <CardTitle className="text-fluid-base">Learning Area Performance Breakdown</CardTitle>
                  </div>
                  <span className="text-fluid-xs font-bold text-text-muted">
                    {(reportData?.learningAreas ?? []).length} Evaluated Areas
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-fluid-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface text-primary font-bold">
                        <th className="py-3.5 px-4">Learning Area / Subject</th>
                        <th className="py-3.5 px-4">Key Strands Assessed</th>
                        <th className="py-3.5 px-4 text-center">Formative</th>
                        <th className="py-3.5 px-4 text-center">Summative</th>
                        <th className="py-3.5 px-4 text-center">CBC Level</th>
                        <th className="py-3.5 px-4">Facilitator Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData?.learningAreas ?? []).map((area, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-border hover:bg-surface-muted transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-primary text-fluid-sm">{area.name}</div>
                            <div className="text-text-muted text-fluid-xs font-mono">{area.code}</div>
                          </td>
                          <td className="py-3.5 px-4 text-text">
                            <div className="flex flex-wrap gap-1">
                              {(area.strands ?? []).map((strand, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-[4px] bg-bg border border-border text-[11px]"
                                >
                                  {strand}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-text">
                            {area.formativeScore}%
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-black text-primary">
                            {area.summativeScore}%
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <CbcStars level={area.rubricLevel} size="sm" showLabel={true} />
                          </td>
                          <td className="py-3.5 px-4 text-text leading-relaxed">
                            &quot;{area.teacherRemarks}&quot;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* CBC Core Competencies & Values Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Core Competencies */}
              <Card className="border-2 border-border shadow-sm">
                <CardHeader className="bg-primary-soft border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <CardTitle className="text-fluid-base">CBC Core Competencies</CardTitle>
                  </div>
                  <CardDescription>
                    Continuous behavioral & cognitive assessment across school activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3.5">
                  {(reportData?.coreCompetencies ?? []).map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[10px] bg-bg border border-border flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-primary text-fluid-xs">{comp.name}</div>
                        <div className="text-text-muted text-fluid-xs leading-relaxed">
                          {comp.description}
                        </div>
                      </div>
                      <CbcStars level={comp.level} size="sm" showLabel={false} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Teacher and Headteacher Endorsements */}
              <div className="space-y-6">
                <Card className="border-2 border-border shadow-sm">
                  <CardHeader className="bg-primary-soft border-b border-border">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-primary" />
                      <CardTitle className="text-fluid-base">Facilitator Endorsements</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="p-4 rounded-[10px] bg-bg border border-border space-y-2">
                      <div className="text-fluid-xs font-bold text-primary uppercase">
                        Class Teacher&apos;s Remarks ({reportData?.classTeacherName ?? 'Teacher'})
                      </div>
                      <blockquote className="text-fluid-sm text-text italic leading-relaxed">
                        &quot;{reportData?.classTeacherRemarks ?? 'Consistent positive effort demonstrated.'}&quot;
                      </blockquote>
                    </div>

                    <div className="p-4 rounded-[10px] bg-bg border border-border space-y-2">
                      <div className="text-fluid-xs font-bold text-primary uppercase">
                        Headteacher&apos;s Remarks ({reportData?.headteacherName ?? 'Headteacher'})
                      </div>
                      <blockquote className="text-fluid-sm text-text italic leading-relaxed">
                        &quot;{reportData?.headteacherRemarks ?? 'Well done on a productive term.'}&quot;
                      </blockquote>
                    </div>
                  </CardContent>
                </Card>

                {/* School Seal Confirmation */}
                <div className="p-4 rounded-[12px] bg-surface border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-8 h-8 text-primary shrink-0" />
                    <div>
                      <div className="font-bold text-fluid-sm text-primary">
                        Verified Digital Academic Record
                      </div>
                      <div className="text-fluid-xs text-text-muted">
                        Report ID: {reportData?.reportId ?? 'REP-2026-T1'} • Issued on {reportData?.dateOfIssue ?? '28 March 2026'}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right text-fluid-xs text-text-muted">
                    Dorice Smart Academy<br />Kipkaren River
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* M-PESA Payment Modal for Instant Fee Clearance */}
        <MpesaPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          student={activeStudent}
          suggestedAmount={activeStudent.feeBalance > 0 ? activeStudent.feeBalance : 18500}
        />

      </div>
    </div>
  );
}
