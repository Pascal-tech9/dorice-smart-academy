'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CreditCard, Award, ArrowRight, Calendar, User, Phone, CheckCircle2, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { DEMO_STUDENTS, type StudentRecord } from '@/lib/people/mock-data';
import { FamilySwitcher } from '@/components/portal/family-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CbcStars } from '@/components/ui/cbc-stars';

export default function GuardianPortalPage() {
  // Demo family: Mary Wanjiku has 2 children (Brian and Faith)
  const familyStudents = DEMO_STUDENTS.slice(0, 2);
  const [activeStudent, setActiveStudent] = React.useState<StudentRecord>(familyStudents[0]);

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
              students={familyStudents}
              activeStudent={activeStudent}
              onSelectStudent={setActiveStudent}
            />

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
                      Settle your child&apos;s balance instantly via <strong>Lipa Na M-PESA Online (STK Push)</strong>.
                      A receipt SMS and updated statement will be generated automatically.
                    </div>
                    <Button variant="accent" size="lg" className="w-full gap-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Pay {formattedBalance} with M-PESA</span>
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
                  <Link href="/portal/fees" className="font-bold text-primary hover:underline flex items-center gap-1">
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
                  <Link href="/portal/results" className="font-bold text-primary hover:underline flex items-center gap-1">
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
    </div>
  );
}
