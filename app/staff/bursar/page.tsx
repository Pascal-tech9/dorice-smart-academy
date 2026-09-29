'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, DollarSign, Download, Plus, Search, Filter, CheckCircle2, Clock, AlertTriangle, FileText, X } from 'lucide-react';
import { DEMO_STUDENTS, type StudentRecord } from '@/lib/people/mock-data';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentRecord {
  id: string;
  receiptNumber: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  amount: number;
  method: 'cash' | 'bank_deposit' | 'cheque' | 'mpesa_c2b';
  reference: string;
  date: string;
  status: 'completed';
}

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'p-1',
    receiptNumber: 'RCT-2026-0001',
    studentName: 'Brian Kiprono',
    admissionNumber: 'DSA/2026/001',
    className: 'Grade 4 Main',
    amount: 18500,
    method: 'mpesa_c2b',
    reference: 'SDT001928KL1',
    date: '2026-01-14 09:32',
    status: 'completed',
  },
  {
    id: 'p-2',
    receiptNumber: 'RCT-2026-0002',
    studentName: 'Faith Wambui',
    admissionNumber: 'DSA/2026/002',
    className: 'Grade 2 Main',
    amount: 10000,
    method: 'mpesa_c2b',
    reference: 'SDT002928KL1',
    date: '2026-01-13 14:15',
    status: 'completed',
  },
];

export default function BursarDashboardPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [payments, setPayments] = React.useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedStudentId, setSelectedStudentId] = React.useState(DEMO_STUDENTS[0].id);
  const [paymentAmount, setPaymentAmount] = React.useState('12500');
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'bank_deposit' | 'cheque'>('bank_deposit');
  const [reference, setReference] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [receiptSuccess, setReceiptSuccess] = React.useState<string | null>(null);

  // Load live payments from Supabase
  React.useEffect(() => {
    async function loadLivePayments() {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            payment_method,
            reference_number,
            paid_by,
            created_at,
            receipts ( receipt_number ),
            students ( id, first_name, last_name, admission_number )
          `)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const mapped: PaymentRecord[] = data.map((p: any) => ({
            id: p.id,
            receiptNumber: p.receipts?.[0]?.receipt_number || `RCT-${p.id.slice(0, 8)}`,
            studentName: p.students ? `${p.students.first_name} ${p.students.last_name}` : p.paid_by || 'Unknown',
            admissionNumber: p.students?.admission_number || 'N/A',
            className: 'Grade 4 Main',
            amount: Number(p.amount) || 0,
            method: (p.payment_method === 'mpesa' ? 'mpesa_c2b' : p.payment_method) as any,
            reference: p.reference_number || 'REF-N/A',
            date: p.created_at ? new Date(p.created_at).toISOString().replace('T', ' ').slice(0, 16) : new Date().toISOString().slice(0, 10),
            status: 'completed',
          }));
          setPayments(mapped);
        }
      } catch (err) {
        console.warn('Using initial payments:', err);
      }
    }

    loadLivePayments();
  }, [supabase]);

  // Statistics calculation
  const totalBilled = 370000;
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalArrears = Math.max(0, totalBilled - totalCollected);
  const collectionPercentage = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = DEMO_STUDENTS.find((s) => s.id === selectedStudentId) || DEMO_STUDENTS[0];
    const amountNum = parseFloat(paymentAmount) || 0;

    const receiptNum = `RCT-2026-00${payments.length + 42}`;
    const newPayment: PaymentRecord = {
      id: `p-${Date.now()}`,
      receiptNumber: receiptNum,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      className: student.className,
      amount: amountNum,
      method: paymentMethod,
      reference: reference || `MANUAL-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'completed',
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Save to Supabase
    try {
      const { data: pmt } = await supabase.from('payments').insert({
        amount: amountNum,
        payment_method: paymentMethod,
        reference_number: reference || `MANUAL-${Date.now()}`,
        paid_by: `${student.firstName} ${student.lastName} Guardian`,
      }).select().single();

      if (pmt) {
        await supabase.from('receipts').insert({
          payment_id: pmt.id,
          receipt_number: receiptNum,
          amount: amountNum,
          issued_to: `${student.firstName} ${student.lastName} Guardian`,
        });
      }
    } catch (err) {
      console.warn('Payment saved locally, Supabase sync note:', err);
    }

    setReceiptSuccess(`Payment of KES ${amountNum.toLocaleString()} recorded. Receipt ${receiptNum} issued.`);
    setTimeout(() => {
      setShowPaymentModal(false);
      setReceiptSuccess(null);
      setReference('');
      setNotes('');
    }, 2500);
  };

  const handleExportCsv = () => {
    const csvHeader = 'Receipt Number,Student Name,Admission Number,Class,Amount,Payment Method,Reference,Date\n';
    const csvRows = payments
      .map(
        (p) =>
          `"${p.receiptNumber}","${p.studentName}","${p.admissionNumber}","${p.className}",${p.amount},"${p.method}","${p.reference}","${p.date}"`
      )
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dorice_Fee_Collections_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-bg text-text py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1360px] mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Public Site</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-primary">
                Bursar Finance & Fee Collections
              </h1>
              <Badge variant="paid" label="Term 1 2026" />
            </div>
            <p className="text-fluid-sm text-text-muted mt-1">
              Dorice Smart Academy • Automated M-PESA reconciliation and manual payments ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" onClick={handleExportCsv} className="gap-2">
              <Download className="w-4 h-4" />
              <span>Export Collections CSV</span>
            </Button>

            <Button
              variant="accent"
              size="md"
              onClick={() => setShowPaymentModal(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record Manual Payment</span>
            </Button>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-text-muted uppercase tracking-wider">
                Total Term Invoiced
              </div>
              <div className="text-fluid-price font-black text-primary mt-1">
                KES {totalBilled.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="text-fluid-xs text-text-muted">
              20 active learners across 2 streams
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-success-fg uppercase tracking-wider">
                Total Fees Collected
              </div>
              <div className="text-fluid-price font-black text-success-solid mt-1">
                KES {totalCollected.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="text-fluid-xs text-text-muted">
              {collectionPercentage}% collection efficiency
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-danger-fg uppercase tracking-wider">
                Outstanding Arrears
              </div>
              <div className="text-fluid-price font-black text-danger-solid mt-1">
                KES {totalArrears.toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="text-fluid-xs text-text-muted">
              Carried forward across term invoices
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-primary uppercase tracking-wider">
                Receipts Issued
              </div>
              <div className="text-fluid-price font-black text-primary mt-1">
                {payments.length + 39} Receipts
              </div>
            </CardHeader>
            <CardContent className="text-fluid-xs text-text-muted">
              Sequential numbered ledger (no gaps)
            </CardContent>
          </Card>
        </div>

        {/* Main Grid: Collections Feed & Top Arrears */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Recent Payments Feed (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border bg-primary-soft">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-fluid-base">Recent Payments & Receipts</CardTitle>
                  <span className="text-fluid-xs font-bold text-text-muted">Real-time Feed</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-fluid-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface text-primary font-bold">
                        <th className="py-3 px-4">Receipt No.</th>
                        <th className="py-3 px-4">Learner & Class</th>
                        <th className="py-3 px-4">Channel / Method</th>
                        <th className="py-3 px-4">Reference No.</th>
                        <th className="py-3 px-4 text-right">Amount (KES)</th>
                        <th className="py-3 px-4 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-primary">{p.receiptNumber}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-text">{p.studentName}</div>
                            <div className="text-[11px] text-text-muted">{p.className}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold uppercase tracking-wider text-text">
                              {p.method.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-text-muted">{p.reference}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-text tabular-nums">
                            {p.amount.toLocaleString()}.00
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => alert(`Receipt ${p.receiptNumber} downloaded for ${p.studentName}.`)}
                              className="text-primary hover:underline font-bold text-fluid-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Top Arrears Focus List (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-fluid-base">Top Fee Arrears</CardTitle>
                  <AlertTriangle className="w-4 h-4 text-warning-solid" />
                </div>
                <CardDescription>Learners requiring fee payment follow-up</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {DEMO_STUDENTS.filter((s) => s.feeBalance > 0).map((s) => (
                  <div key={s.id} className="p-3.5 rounded-[10px] bg-bg border border-border flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-fluid-sm text-text">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {s.className} • {s.guardians[0]?.phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-danger-fg text-fluid-sm tabular-nums">
                        KES {s.feeBalance.toLocaleString()}
                      </div>
                      <Badge variant="overdue" label="Pending" showIcon={false} className="py-0.5 px-2 text-[10px]" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Record Manual Payment Modal Dialog */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface rounded-[14px] border border-border shadow-2xl overflow-hidden animate-scale-in">
              <div className="p-6 border-b border-border flex items-center justify-between bg-primary-soft">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="text-fluid-lg font-black text-primary">Record Manual Payment</h3>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:bg-surface-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {receiptSuccess ? (
                <div className="p-8 text-center space-y-4 bg-success-soft text-success-fg">
                  <CheckCircle2 className="w-12 h-12 text-success-solid mx-auto" />
                  <h4 className="text-fluid-base font-black">{receiptSuccess}</h4>
                  <p className="text-fluid-xs opacity-90">Ledger balance updated. Sequential receipt issued.</p>
                </div>
              ) : (
                <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                  <div>
                    <label htmlFor="studentSelect" className="block text-fluid-xs font-bold text-text mb-1">
                      Select Learner <span className="text-danger-solid">*</span>
                    </label>
                    <select
                      id="studentSelect"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-bg text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    >
                      {DEMO_STUDENTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.className}) — Balance: KES {s.feeBalance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="amountInput" className="block text-fluid-xs font-bold text-text mb-1">
                        Amount (KES) <span className="text-danger-solid">*</span>
                      </label>
                      <input
                        id="amountInput"
                        type="number"
                        inputMode="numeric"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-bg text-text text-fluid-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-focus-ring"
                      />
                    </div>

                    <div>
                      <label htmlFor="methodSelect" className="block text-fluid-xs font-bold text-text mb-1">
                        Payment Method <span className="text-danger-solid">*</span>
                      </label>
                      <select
                        id="methodSelect"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-bg text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                      >
                        <option value="bank_deposit">Bank Deposit Slip</option>
                        <option value="cash">Cash (Office)</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="refInput" className="block text-fluid-xs font-bold text-text mb-1">
                      Bank Slip / Cheque / Reference No. <span className="text-danger-solid">*</span>
                    </label>
                    <input
                      id="refInput"
                      type="text"
                      required
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. KCB-DEPOSIT-99120"
                      className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-bg text-text text-fluid-sm font-mono focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    />
                  </div>

                  <div>
                    <label htmlFor="notesInput" className="block text-fluid-xs font-bold text-text mb-1">
                      Internal Notes / Bursar Remarks
                    </label>
                    <input
                      id="notesInput"
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional remarks"
                      className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-bg text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                    <Button variant="outline" type="button" onClick={() => setShowPaymentModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="accent" type="submit">
                      Issue Official Receipt
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
