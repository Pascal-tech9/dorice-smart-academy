'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle2, Search, ArrowRight, UserCheck, Check } from 'lucide-react';
import { DEMO_STUDENTS } from '@/lib/people/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UnallocatedPayment {
  id: string;
  receiptNumber: string;
  payerPhone: string;
  amount: number;
  enteredAccount: string;
  date: string;
  notes: string;
}

const INITIAL_UNALLOCATED: UnallocatedPayment[] = [
  {
    id: 'un-1',
    receiptNumber: 'QKD99210XA',
    payerPhone: '0712 345 678',
    amount: 12500,
    enteredAccount: 'BRIAN KIP', // Mistyped instead of DSA-2026-001
    date: '2026-01-14 11:20',
    notes: 'Account name does not match standard admission format DSA-2026-XXX',
  },
  {
    id: 'un-2',
    receiptNumber: 'QKD77341BB',
    payerPhone: '0744 567 890',
    amount: 5000,
    enteredAccount: 'GRADE 7 FEES', // General text instead of student admission
    date: '2026-01-13 16:45',
    notes: 'No admission number provided in paybill account reference',
  },
];

export default function UnallocatedPaymentsPage() {
  const [unallocated, setUnallocated] = React.useState<UnallocatedPayment[]>(INITIAL_UNALLOCATED);
  const [selectedPayment, setSelectedPayment] = React.useState<UnallocatedPayment | null>(null);
  const [targetStudentId, setTargetStudentId] = React.useState(DEMO_STUDENTS[0].id);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    const student = DEMO_STUDENTS.find((s) => s.id === targetStudentId)!;
    setUnallocated((prev) => prev.filter((p) => p.id !== selectedPayment.id));
    setSuccessMessage(
      `Payment ${selectedPayment.receiptNumber} (KES ${selectedPayment.amount.toLocaleString()}) allocated to ${student.firstName} ${student.lastName} (${student.admissionNumber}).`
    );
    setSelectedPayment(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-bg text-text py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link href="/staff/bursar" className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Bursar Collections</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-primary">
                Unallocated M-PESA Payments Queue
              </h1>
              <Badge variant="overdue" label={`${unallocated.length} Unmatched`} />
            </div>
            <p className="text-fluid-sm text-text-muted mt-1">
              Payments received where guardians entered mistyped or missing student admission numbers.
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 rounded-[12px] bg-success-soft text-success-fg border border-success-border flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-success-solid shrink-0" />
            <span className="font-bold text-fluid-sm">{successMessage}</span>
          </div>
        )}

        {/* Unallocated Table */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary-soft border-b border-border">
            <CardTitle className="text-fluid-base">Pending C2B Paybill Transactions</CardTitle>
            <CardDescription>
              Review payer details and match with registered learners to update fee balances.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {unallocated.length === 0 ? (
              <div className="p-12 text-center text-fluid-sm text-text-muted">
                <Check className="w-10 h-10 text-success-solid mx-auto mb-2" />
                All M-PESA C2B transactions have been successfully allocated!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-fluid-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface text-primary font-bold">
                      <th className="py-3 px-4">Receipt No.</th>
                      <th className="py-3 px-4">Payer Phone</th>
                      <th className="py-3 px-4">Entered Account Ref</th>
                      <th className="py-3 px-4 text-right">Amount (KES)</th>
                      <th className="py-3 px-4">Received Time</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unallocated.map((p) => (
                      <tr key={p.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{p.receiptNumber}</td>
                        <td className="py-3 px-4 font-mono text-text">{p.payerPhone}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded bg-bg border border-border font-mono font-bold text-danger-fg">
                            {p.enteredAccount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-text tabular-nums">
                          {p.amount.toLocaleString()}.00
                        </td>
                        <td className="py-3 px-4 text-text-muted">{p.date}</td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedPayment(p)}
                            className="gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Allocate to Learner</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Modal Dialog */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface rounded-[14px] border border-border shadow-2xl overflow-hidden animate-scale-in">
              <div className="p-6 border-b border-border bg-primary-soft">
                <h3 className="text-fluid-lg font-black text-primary">
                  Allocate Payment: {selectedPayment.receiptNumber}
                </h3>
                <p className="text-fluid-xs text-text-muted mt-1">
                  Amount: <strong>KES {selectedPayment.amount.toLocaleString()}.00</strong> • Paid from: {selectedPayment.payerPhone}
                </p>
              </div>

              <form onSubmit={handleAllocate} className="p-6 space-y-4">
                <div className="p-3 rounded-[8px] bg-bg border border-border text-fluid-xs text-text-muted">
                  <strong>Payer Typed:</strong> &quot;{selectedPayment.enteredAccount}&quot;
                </div>

                <div>
                  <label htmlFor="studentSelect" className="block text-fluid-xs font-bold text-text mb-1">
                    Select Target Learner <span className="text-danger-solid">*</span>
                  </label>
                  <select
                    id="studentSelect"
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-bg text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  >
                    {DEMO_STUDENTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.admissionNumber}) — {s.className}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <Button variant="outline" type="button" onClick={() => setSelectedPayment(null)}>
                    Cancel
                  </Button>
                  <Button variant="accent" type="submit">
                    Confirm Allocation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
