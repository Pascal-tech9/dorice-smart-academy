'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CreditCard, Award, ArrowRight, Calendar, User, Phone, CheckCircle2, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DEMO_STUDENTS, type StudentRecord } from '@/lib/people/mock-data';
import { FamilySwitcher } from '@/components/portal/family-switcher';
import { MpesaPaymentModal } from '@/components/portal/mpesa-payment-modal';
import { PwaInstallBanner } from '@/components/portal/pwa-install-banner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CbcStars } from '@/components/ui/cbc-stars';

export default function GuardianPortalPage() {
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState<boolean>(false);

  // Load live guardian students and invoices from Supabase
  React.useEffect(() => {
    async function loadGuardianData() {
      try {
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
        console.warn('Using initial portal demo records:', err);
      }
    }

    loadGuardianData();
  }, [supabase]);

  const formattedBalance = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(activeStudent.feeBalance);

  const formattedTermFee = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(activeStudent.termFee);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Portal Header */}
      <header className="bg-primary text-primary-fg shadow-sm pattern-plaid sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src="/brand/dorice-logo-badge.png"
                alt="Dorice Smart Academy"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <div>
              <div className="text-fluid-xs font-semibold text-accent-soft uppercase tracking-wider">
                Parent & Guardian Portal
              </div>
              <div className="text-fluid-base font-black text-primary-fg leading-none">
                Dorice Smart Academy
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Child Switcher */}
            <FamilySwitcher
              students={students}
              activeStudent={activeStudent}
              onSelectStudent={setActiveStudent}
            />

            <Link
              href="/portal/profile"
              aria-label="My Profile"
              className="text-fluid-xs font-bold text-primary-fg opacity-80 hover:opacity-100 px-3 py-1.5 rounded-[8px] hover:bg-primary-hover transition-colors hidden sm:block"
            >
              My Profile
            </Link>
            <Link
              href="/"
              className="text-fluid-xs font-bold text-primary-fg opacity-80 hover:opacity-100 px-3 py-1.5 rounded-[8px] hover:bg-primary-hover transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Main Family Dashboard Body */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Greeting & Active Student Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[14px] bg-surface border border-border shadow-sm">
          <div className="space-y-1">
            <h1 className="text-fluid-xl font-black text-primary">
              Welcome back, Mary Wanjiku
            </h1>
            <p className="text-fluid-sm text-text-muted">
              Managing records for <strong>{activeStudent.firstName} {activeStudent.lastName}</strong> ({activeStudent.className})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={activeStudent.feeBalance === 0 ? 'paid' : 'partial'}
              label={activeStudent.feeBalance === 0 ? 'Fees Fully Paid' : 'Balance Pending'}
            />
            <span className="text-fluid-xs text-text-muted font-mono">
              Adm: {activeStudent.admissionNumber}
            </span>
          </div>
        </div>

        {/* Core Job 1 & 2 Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* JOB 1: Fee Management & M-PESA Payment (Left 6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="overflow-hidden border-2 border-border shadow-md">
              <CardHeader className="bg-primary-soft border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <CardTitle className="text-fluid-base">School Fee Summary</CardTitle>
                  </div>
                  <span className="text-fluid-xs font-bold text-text-muted">Term 1 2026</span>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="text-fluid-xs font-bold text-text-muted uppercase tracking-wider">
                    Current Outstanding Balance
                  </div>
                  <div className="text-fluid-price font-black text-primary mt-1">
                    {formattedBalance}
                  </div>
                  <div className="text-fluid-xs text-text-muted mt-1">
                    Total Term Invoiced: <span className="font-mono tabular-nums">{formattedTermFee}</span>
                  </div>
                </div>

                {/* Single 10% Accent Call to Action: Pay with M-PESA */}
                {activeStudent.feeBalance > 0 ? (
                  <div className="p-4 rounded-[12px] bg-bg border border-border space-y-3">
                    <div className="text-fluid-xs text-text leading-relaxed">
                      Pay via <strong>M-PESA Paybill 400222</strong> — open M-PESA on your phone,
                      go to <em>Lipa Na M-PESA → Paybill → 400222</em>. Your updated fee statement
                      reflects automatically within minutes.
                    </div>
                    <Button
                      variant="accent"
                      size="lg"
                      className="w-full gap-2"
                      onClick={() => setIsPaymentModalOpen(true)}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>Pay via M-PESA Paybill — View Guide</span>
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-[12px] bg-success-soft text-success-fg border border-success-border flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-success-solid shrink-0" />
                    <div>
                      <div className="font-black text-fluid-sm">All Term Fees Cleared</div>
                      <div className="text-fluid-xs opacity-90">Thank you! Your official receipt is ready for download.</div>
                    </div>
                  </div>
                )}

                {/* Quick Fee Links */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-fluid-xs">
                  <Link
                    href={`/portal/fees?student=${encodeURIComponent(activeStudent.admissionNumber)}`}
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Invoices & Receipts</span>
                  </Link>
                  <span className="text-text-muted">Account: {activeStudent.admissionNumber}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* JOB 2: CBC Academic Results Snapshot (Right 6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="overflow-hidden border-2 border-border shadow-md">
              <CardHeader className="bg-primary-soft border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-primary" />
                    <CardTitle className="text-fluid-base">Latest CBC Results Snapshot</CardTitle>
                  </div>
                  <span className="text-fluid-xs font-bold text-text-muted">
                    {activeStudent.recentResults.term} {activeStudent.recentResults.year}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between p-4 rounded-[12px] bg-bg border border-border">
                  <div>
                    <div className="text-fluid-xs text-text-muted font-bold uppercase">Overall Competency</div>
                    <div className="text-fluid-base font-black text-primary mt-0.5">
                      {activeStudent.recentResults.overallLevel === 'EE' && 'Exceeding Expectations'}
                      {activeStudent.recentResults.overallLevel === 'ME' && 'Meeting Expectations'}
                      {activeStudent.recentResults.overallLevel === 'AE' && 'Approaching Expectations'}
                      {activeStudent.recentResults.overallLevel === 'BE' && 'Below Expectations'}
                    </div>
                  </div>
                  <CbcStars level={activeStudent.recentResults.overallLevel} size="md" showLabel={false} />
                </div>

                <div className="space-y-2">
                  <div className="text-fluid-xs font-bold text-text-muted uppercase">Teacher Remarks</div>
                  <blockquote className="text-fluid-sm text-text italic bg-surface p-3.5 rounded-[10px] border border-border leading-relaxed">
                    &quot;{activeStudent.recentResults.remarks}&quot;
                  </blockquote>
                </div>

                <div className="flex items-center justify-between text-fluid-xs text-text-muted pt-2 border-t border-border">
                  <div>
                    Attendance: <strong className="text-text">{activeStudent.recentResults.attendanceDays} / {activeStudent.recentResults.totalDays} Days</strong>
                  </div>
                  <Link
                    href={`/portal/results?student=${encodeURIComponent(activeStudent.admissionNumber)}`}
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Full Report Card</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Guardian & School Support Information */}
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-fluid-sm text-text">Registered Guardians for this Learner</div>
                <div className="text-fluid-xs text-text-muted">
                  {activeStudent.guardians.map((g) => `${g.name} (${g.relationship})`).join(' • ')}
                </div>
              </div>
            </div>

            <div className="text-fluid-xs text-text-muted">
              Need assistance? Contact accounts: <strong>0700 000 000</strong>
            </div>
          </CardContent>
        </Card>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-fluid-xs text-text-muted border-t border-border">
        Dorice Smart Academy School Portal • Kipkaren River, Kenya • Motto: &quot;Inspire, Achieve, Flourish&quot;
      </footer>

      {/* M-PESA Payment Modal — Paybill C2B 400222 */}
      <MpesaPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        student={activeStudent}
      />

      {/* PWA Install Banner — Android/Chrome only */}
      <PwaInstallBanner />
    </div>
  );
}
