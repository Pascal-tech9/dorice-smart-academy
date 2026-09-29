'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Download, FileText, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DEMO_STUDENTS, type StudentRecord } from '@/lib/people/mock-data';
import { FamilySwitcher } from '@/components/portal/family-switcher';
import { MpesaPaymentModal } from '@/components/portal/mpesa-payment-modal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function GuardianFeesPage() {
  const familyStudents = DEMO_STUDENTS.slice(0, 2);
  const [activeStudent, setActiveStudent] = React.useState<StudentRecord>(familyStudents[0]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState<boolean>(false);

  const invoiceItems = [
    { desc: 'Tuition & Academic CBC Materials', amount: 12000 },
    { desc: 'School Mid-day Nutrition (Lunch)', amount: 4500 },
    { desc: 'Activity & Co-Curricular Assessment', amount: 2000 },
    { desc: 'Sibling Discount Adjustment (Mary Wanjiku)', amount: -2000, isAdjustment: true },
  ];

  const paidAmount = activeStudent.termFee - activeStudent.feeBalance;

  return (
    <div className="min-h-screen bg-bg text-text py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link href="/portal" className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Home</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-primary">
                Fee Statement & Receipts
              </h1>
              <Badge
                variant={activeStudent.feeBalance === 0 ? 'paid' : 'partial'}
                label={activeStudent.feeBalance === 0 ? 'Fees Cleared' : 'Balance Pending'}
              />
            </div>
            <p className="text-fluid-sm text-text-muted mt-1">
              Dorice Smart Academy • Official Fee Ledger for {activeStudent.firstName} {activeStudent.lastName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <FamilySwitcher
              students={familyStudents}
              activeStudent={activeStudent}
              onSelectStudent={setActiveStudent}
            />
          </div>
        </div>

        {/* Balance Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-text-muted uppercase">Term Invoice Total</div>
              <div className="text-fluid-price font-black text-primary mt-1">
                KES {activeStudent.termFee.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="text-fluid-xs text-text-muted">
              Term 1 2026 Invoiced
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-success-fg uppercase">Total Payments Made</div>
              <div className="text-fluid-price font-black text-success-solid mt-1">
                KES {paidAmount.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="text-fluid-xs text-text-muted">
              Verified receipts recorded
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-danger-fg uppercase">Current Due Balance</div>
              <div className="text-fluid-price font-black text-danger-solid mt-1">
                KES {activeStudent.feeBalance.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="text-fluid-xs text-text-muted">
              {activeStudent.feeBalance === 0 ? 'No arrears outstanding' : 'Due for Term 1 2026'}
            </CardContent>
          </Card>
        </div>

        {/* Invoiced Items Breakdown */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-primary-soft">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-fluid-base">Invoice INV-2026-T1-001</CardTitle>
                <CardDescription>Issued 05 Jan 2026 • Term 1 Academic Year 2026</CardDescription>
              </div>
              <span className="font-mono text-fluid-xs font-bold text-text-muted">
                Student Adm: {activeStudent.admissionNumber}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-fluid-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface text-primary font-bold">
                    <th className="py-3 px-4">Fee Item / Line Description</th>
                    <th className="py-3 px-4 text-right">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-surface-muted transition-colors">
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${item.isAdjustment ? 'text-success-fg font-bold' : 'text-text'}`}>
                          {item.desc}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        {item.amount < 0 ? (
                          <span className="text-success-fg">- KES {Math.abs(item.amount).toLocaleString()}</span>
                        ) : (
                          <span>KES {item.amount.toLocaleString()}.00</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-primary bg-bg font-black">
                    <td className="py-3.5 px-4 text-primary text-fluid-sm">NET INVOICE PAYABLE:</td>
                    <td className="py-3.5 px-4 text-right text-primary text-fluid-sm font-mono tabular-nums">
                      KES 16,500.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment History & Downloadable Receipts */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-primary-soft">
            <CardTitle className="text-fluid-base">Payment History & Verified Receipts</CardTitle>
            <CardDescription>Numbered sequential receipts registered under the school accounts ledger</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-fluid-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface text-primary font-bold">
                    <th className="py-3 px-4">Receipt No.</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Channel / Reference</th>
                    <th className="py-3 px-4 text-right">Amount (KES)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-surface-muted transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">RCT-2026-0039</td>
                    <td className="py-3 px-4 text-text-muted">12 Jan 2026</td>
                    <td className="py-3 px-4 font-mono">CASH-REC-019</td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-text">
                      6,000.00
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => alert('Receipt RCT-2026-0039 downloaded.')}
                        className="text-primary hover:underline font-bold text-fluid-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Prompt to Pay if Balance Remains */}
        {activeStudent.feeBalance > 0 && (
          <div className="p-6 rounded-[14px] bg-primary text-primary-fg pattern-plaid flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-fluid-base font-black text-primary-fg">
                Settle Outstanding Balance: KES {activeStudent.feeBalance.toLocaleString()}
              </h3>
              <p className="text-fluid-xs opacity-90 mt-0.5">
                Pay with M-PESA Daraja prompt or use school Paybill with account <strong>{activeStudent.admissionNumber}</strong>.
              </p>
            </div>
            <div>
              <Button
                variant="accent"
                size="lg"
                className="gap-2"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <CreditCard className="w-5 h-5" />
                <span>Pay with M-PESA</span>
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* M-PESA Payment Modal */}
      <MpesaPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        student={activeStudent}
        onPaymentSuccess={(_receipt, amountPaid) => {
          setActiveStudent((prev) => ({
            ...prev,
            feeBalance: Math.max(0, prev.feeBalance - amountPaid),
          }));
        }}
      />
    </div>
  );
}
