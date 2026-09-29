'use client';

import * as React from 'react';
import {
  CreditCard,
  Copy,
  Check,
  X,
  Info,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StudentRecord } from '@/lib/people/mock-data';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  onPaymentSuccess?: (receiptNo: string, amount: number) => void;
}

/**
 * M-PESA Paybill C2B Payment Modal — Paybill 400222
 *
 * Parents pay through the standard M-PESA menu on their phone.
 * There is NO in-app STK Push. The school uses Paybill C2B only.
 *
 * The modal shows:
 *   1. Step-by-step Paybill payment instructions
 *   2. The correct Paybill number (400222) and account number
 *   3. One-tap copy buttons for each field
 *   4. A "Record manual payment" section for bursar-recorded payments
 */
export function MpesaPaymentModal({
  isOpen,
  onClose,
  student,
}: MpesaPaymentModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [acknowledged, setAcknowledged] = React.useState(false);

  // TODO: Confirm the exact account number format with the school.
  // Current assumption: 369369#StudentName,Grade
  // Alternatives: just the admission number, or a different prefix.
  const accountNumber = `369369#${student.firstName}${student.lastName},${student.gradeLevel ?? student.className}`;
  const paybillNumber = '400222';

  React.useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
      setCopiedField(null);
    }
  }, [isOpen]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      title: 'Open M-PESA on your phone',
      detail: 'Dial *334# or open the M-PESA app on your Safaricom SIM.',
    },
    {
      step: '2',
      title: 'Select "Lipa Na M-PESA"',
      detail: 'Choose "Pay Bill" from the menu.',
    },
    {
      step: '3',
      title: 'Enter Business Number (Paybill)',
      detail: null,
      copyValue: paybillNumber,
      copyLabel: 'paybill',
      displayValue: paybillNumber,
    },
    {
      step: '4',
      title: 'Enter Account Number',
      detail: 'Use the account number below exactly as shown.',
      copyValue: accountNumber,
      copyLabel: 'account',
      displayValue: accountNumber,
    },
    {
      step: '5',
      title: 'Enter Amount (KES)',
      detail: `Your current fee balance is KES ${student.feeBalance.toLocaleString('en-KE')}. You may pay any amount.`,
    },
    {
      step: '6',
      title: 'Enter your M-PESA PIN and confirm',
      detail: 'You will receive an SMS confirmation from M-PESA. Your fee balance will update automatically within a few minutes.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mpesa-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-primary/60 backdrop-blur-sm"
    >
      <div className="bg-surface border border-border rounded-t-[20px] sm:rounded-[16px] shadow-2xl w-full sm:max-w-[480px] max-h-[92vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-border bg-primary-soft flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-primary text-primary-fg flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5 text-accent-soft" />
            </div>
            <div>
              <h2 id="mpesa-modal-title" className="text-fluid-base font-black text-primary leading-tight">
                Pay with M-PESA
              </h2>
              <p className="text-fluid-xs text-text-muted">Paybill 400222 • Dorice Smart Academy</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 space-y-5">
          {/* Student info */}
          <div className="p-3.5 rounded-[10px] bg-bg border border-border flex items-center justify-between text-fluid-xs">
            <div>
              <div className="text-text-muted">Paying for:</div>
              <div className="font-black text-primary text-fluid-sm">
                {student.firstName} {student.lastName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-text-muted">Fee Balance:</div>
              <div className="font-mono font-black text-text text-fluid-base">
                KES {student.feeBalance.toLocaleString('en-KE')}
              </div>
            </div>
          </div>

          {/* Quick-copy reference box */}
          <div className="rounded-[12px] border-2 border-primary bg-primary-soft overflow-hidden">
            <div className="px-4 py-2 bg-primary">
              <span className="text-fluid-xs font-bold text-primary-fg uppercase tracking-wider">
                Payment Details — copy these
              </span>
            </div>
            <div className="p-4 space-y-3">
              {/* Paybill */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-fluid-xs text-text-muted">Paybill Business Number</div>
                  <div className="text-fluid-lg font-mono font-black text-primary">
                    {paybillNumber}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(paybillNumber, 'paybill')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-surface border border-border text-fluid-xs font-bold text-primary hover:bg-surface-highlight transition-colors"
                  title="Copy Paybill number"
                >
                  {copiedField === 'paybill' ? (
                    <><Check className="w-4 h-4 text-success-fg" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copy</>
                  )}
                </button>
              </div>

              {/* Account number */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-fluid-xs text-text-muted">Account Number</div>
                  <div className="text-fluid-sm font-mono font-black text-primary break-all">
                    {accountNumber}
                  </div>
                  <div className="text-fluid-xs text-text-muted mt-0.5">
                    (includes student name and grade)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(accountNumber, 'account')}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-surface border border-border text-fluid-xs font-bold text-primary hover:bg-surface-highlight transition-colors"
                  title="Copy account number"
                >
                  {copiedField === 'account' ? (
                    <><Check className="w-4 h-4 text-success-fg" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Copy</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-step guide */}
          <div>
            <h3 className="text-fluid-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              Step-by-step guide
            </h3>
            <ol className="space-y-3">
              {steps.map((s) => (
                <li key={s.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-fg text-fluid-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <div className="text-fluid-sm font-bold text-text">{s.title}</div>
                    {s.detail && (
                      <div className="text-fluid-xs text-text-muted mt-0.5">{s.detail}</div>
                    )}
                    {s.copyValue && (
                      <div className="flex items-center gap-2 mt-1.5 p-2 rounded-[8px] bg-bg border border-border">
                        <span className="font-mono font-black text-primary text-fluid-sm flex-1">
                          {s.displayValue}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(s.copyValue!, s.copyLabel!)}
                          className="text-primary hover:text-primary-hover transition-colors"
                          title="Copy"
                        >
                          {copiedField === s.copyLabel ? (
                            <Check className="w-4 h-4 text-success-fg" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Acknowledgment + Done */}
          <div className="space-y-3 pt-2">
            <label
              htmlFor="payment-acknowledged"
              className="flex items-start gap-3 p-3 rounded-[10px] border border-border bg-surface cursor-pointer hover:bg-surface-highlight transition-colors"
            >
              <input
                id="payment-acknowledged"
                type="checkbox"
                checked={acknowledged}
                onChange={() => setAcknowledged((v) => !v)}
                className="mt-0.5 w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
              />
              <span className="text-fluid-xs text-text leading-relaxed">
                I have completed the M-PESA payment. My fee balance will update within 
                a few minutes once the school confirms the transaction.
              </span>
            </label>

            {acknowledged && (
              <div className="flex items-center gap-2 p-3 rounded-[10px] bg-success-soft border border-success-border text-success-fg text-fluid-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Thank you! If your balance doesn't update within 10 minutes, 
                  please contact the school bursar with your M-PESA SMS confirmation.
                </span>
              </div>
            )}

            <Button
              variant={acknowledged ? 'primary' : 'outline'}
              className="w-full"
              onClick={onClose}
            >
              {acknowledged ? 'Done — Close' : 'Cancel'}
            </Button>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 text-fluid-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 shrink-0 text-primary mt-0.5" />
            <span>
              This is the official Dorice Smart Academy Paybill (400222). 
              Payments are processed by Safaricom and automatically reconciled 
              with the school's fee ledger.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
