'use client';

import * as React from 'react';
import {
  CreditCard,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Copy,
  Check,
  Smartphone,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StudentRecord } from '@/lib/people/mock-data';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  onPaymentSuccess?: (receiptNo: string, amount: number) => void;
}

type Step = 'form' | 'pushing' | 'awaiting_pin' | 'success' | 'error';

export function MpesaPaymentModal({
  isOpen,
  onClose,
  student,
  onPaymentSuccess,
}: MpesaPaymentModalProps) {
  const [step, setStep] = React.useState<Step>('form');
  const [amount, setAmount] = React.useState<number>(student.feeBalance || 5000);
  const [phone, setPhone] = React.useState<string>('0722 000 111');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [receiptNumber, setReceiptNumber] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<'stk' | 'manual'>('stk');
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState<number>(30);

  // Sync amount when student changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAmount(student.feeBalance > 0 ? student.feeBalance : 5000);
      setStep('form');
      setErrorMessage('');
      setCountdown(30);
    }
  }, [isOpen, student]);

  // Countdown timer for STK prompt
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'awaiting_pin' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (step === 'awaiting_pin' && countdown === 0) {
      // Auto-fallback simulation timeout or prompt
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (amount <= 0) {
      setErrorMessage('Please enter an amount greater than KES 0');
      return;
    }

    setStep('pushing');

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount,
          admissionNumber: student.admissionNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch M-PESA STK prompt');
      }

      setStep('awaiting_pin');
      setCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed. Please check phone format or use Paybill.');
      setStep('error');
    }
  };

  const handleSimulatePinApproved = () => {
    const mockReceipt = `NL${Math.floor(10000000 + Math.random() * 90000000)}DSA`;
    setReceiptNumber(mockReceipt);
    setStep('success');
    if (onPaymentSuccess) {
      onPaymentSuccess(mockReceipt, amount);
    }
  };

  const handleSimulatePinCancelled = () => {
    setErrorMessage('Request was cancelled by user on phone.');
    setStep('error');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mpesa-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-surface border-2 border-border rounded-[16px] shadow-2xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border bg-primary-soft flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-primary text-primary-fg flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5 text-accent-soft" />
            </div>
            <div>
              <h2 id="mpesa-modal-title" className="text-fluid-base font-black text-primary leading-tight">
                Lipa Na M-PESA Online
              </h2>
              <p className="text-fluid-xs text-text-muted">
                Dorice Smart Academy • Official Fee Payment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        {step === 'form' && (
          <div className="grid grid-cols-2 border-b border-border bg-bg text-fluid-xs font-bold text-center">
            <button
              type="button"
              onClick={() => setActiveTab('stk')}
              className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'stk'
                  ? 'border-primary text-primary bg-surface'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Instant STK Prompt (Direct Phone)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'manual'
                  ? 'border-primary text-primary bg-surface'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              Manual Paybill Guide
            </button>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 flex-1 space-y-6">
          {/* Target Student Info Badge */}
          <div className="p-3.5 rounded-[10px] bg-bg border border-border flex items-center justify-between text-fluid-xs">
            <div>
              <div className="text-text-muted">Paying for student:</div>
              <div className="font-bold text-primary text-fluid-sm">
                {student.firstName} {student.lastName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-text-muted">Class & Admission:</div>
              <div className="font-mono font-bold text-text">
                {student.className} • {student.admissionNumber}
              </div>
            </div>
          </div>

          {/* STEP 1: Form / STK Push Input */}
          {step === 'form' && activeTab === 'stk' && (
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              <div>
                <label htmlFor="mpesa-amount" className="block text-fluid-xs font-bold text-text mb-1">
                  Payment Amount (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-fluid-sm">
                    KES
                  </span>
                  <input
                    id="mpesa-amount"
                    type="number"
                    min="1"
                    max="150000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full pl-14 pr-4 py-2.5 rounded-[8px] bg-surface border border-border text-fluid-base font-mono font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex items-center justify-between text-fluid-xs text-text-muted mt-1">
                  <span>Current Due: KES {student.feeBalance.toLocaleString()}</span>
                  {amount === student.feeBalance && (
                    <span className="text-primary font-bold">Full balance selected</span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="mpesa-phone" className="block text-fluid-xs font-bold text-text mb-1">
                  M-PESA Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="mpesa-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-[8px] bg-surface border border-border text-fluid-sm font-mono text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-fluid-xs text-text-muted mt-1">
                  Safaricom phone number where the PIN prompt will appear.
                </p>
              </div>

              <div className="pt-2">
                <Button variant="accent" size="lg" className="w-full gap-2">
                  <Smartphone className="w-5 h-5" />
                  <span>Send M-PESA STK Push (KES {amount.toLocaleString()})</span>
                </Button>
              </div>

              <div className="p-3 rounded-[8px] bg-primary-soft text-primary text-fluid-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
                <span>
                  Official Dorice Smart Academy Safaricom Daraja Integration. Bank-grade encrypted.
                </span>
              </div>
            </form>
          )}

          {/* STEP 1 (Alternative): Manual Paybill Tab */}
          {step === 'form' && activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="text-fluid-xs text-text leading-relaxed">
                If your phone does not support STK Push or you prefer standard Paybill payment, follow these steps in your Safaricom SIM toolkit or M-PESA App:
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-[10px] bg-bg border border-border flex items-center justify-between">
                  <div>
                    <div className="text-fluid-xs text-text-muted">1. Paybill Business Number</div>
                    <div className="text-fluid-base font-mono font-black text-primary">400200</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('400200', 'paybill')}
                    className="p-2 rounded-[6px] hover:bg-surface-muted text-primary cursor-pointer"
                    title="Copy Paybill"
                  >
                    {copiedField === 'paybill' ? <Check className="w-4 h-4 text-success-fg" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-3.5 rounded-[10px] bg-bg border border-border flex items-center justify-between">
                  <div>
                    <div className="text-fluid-xs text-text-muted">2. Account Number (Student Adm No.)</div>
                    <div className="text-fluid-base font-mono font-black text-primary">{student.admissionNumber}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(student.admissionNumber, 'account')}
                    className="p-2 rounded-[6px] hover:bg-surface-muted text-primary cursor-pointer"
                    title="Copy Account"
                  >
                    {copiedField === 'account' ? <Check className="w-4 h-4 text-success-fg" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-3.5 rounded-[10px] bg-bg border border-border">
                  <div className="text-fluid-xs text-text-muted">3. Amount</div>
                  <div className="text-fluid-base font-mono font-black text-text">Any amount (e.g. KES {student.feeBalance.toLocaleString()})</div>
                </div>

                <div className="p-3.5 rounded-[10px] bg-bg border border-border">
                  <div className="text-fluid-xs text-text-muted">4. Complete with your M-PESA PIN</div>
                  <div className="text-fluid-xs text-text-muted mt-0.5">
                    Our accounts system matches payments automatically via your child&apos;s Admission Number.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-surface-muted text-fluid-xs text-text-muted flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-primary" />
                <span>
                  Allow 2–5 minutes for Paybill SMS confirmations to synchronize with the student ledger.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Dispatching STK push */}
          {step === 'pushing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="space-y-1">
                <h3 className="text-fluid-base font-black text-primary">
                  Connecting to Safaricom Daraja...
                </h3>
                <p className="text-fluid-xs text-text-muted max-w-xs">
                  Dispatching instant STK push prompt to <strong>{phone}</strong> for KES {amount.toLocaleString()}.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Awaiting PIN on phone */}
          {step === 'awaiting_pin' && (
            <div className="py-6 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center text-primary animate-pulse">
                  <Smartphone className="w-10 h-10" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-fg text-fluid-xs font-mono font-black flex items-center justify-center border-2 border-surface">
                  {countdown}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-fluid-lg font-black text-primary">
                  Check Your Phone Now
                </h3>
                <p className="text-fluid-xs text-text leading-relaxed max-w-sm">
                  An M-PESA prompt for <strong>KES {amount.toLocaleString()}</strong> has been dispatched to <strong>{phone}</strong>.
                  Please enter your secret <strong>M-PESA PIN</strong> to confirm.
                </p>
              </div>

              <div className="w-full p-4 rounded-[12px] bg-bg border border-border space-y-2 text-fluid-xs text-left">
                <div className="flex justify-between font-mono">
                  <span className="text-text-muted">Paybill / Merchant:</span>
                  <span className="font-bold text-primary">Dorice Smart Academy</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-text-muted">Account Ref:</span>
                  <span className="font-bold text-primary">{student.admissionNumber}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-text-muted">Amount:</span>
                  <span className="font-bold text-text">KES {amount.toLocaleString()}.00</span>
                </div>
              </div>

              {/* Dev Simulation Controls for instant testing */}
              <div className="w-full pt-4 border-t border-border space-y-2">
                <div className="text-fluid-xs text-text-muted font-semibold uppercase tracking-wider">
                  Developer Sandbox Simulation
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSimulatePinApproved}
                    className="text-success-fg border-success-border hover:bg-success-soft"
                  >
                    Simulate PIN Approved
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSimulatePinCancelled}
                    className="text-danger-fg border-danger-border hover:bg-danger-soft"
                  >
                    Simulate Cancelled
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success confirmation */}
          {step === 'success' && (
            <div className="py-6 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-success-soft text-success-solid flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-fluid-lg font-black text-primary">
                  Payment Confirmed!
                </h3>
                <p className="text-fluid-xs text-text-muted">
                  Funds received and credited to student fee ledger.
                </p>
              </div>

              <div className="w-full p-4 rounded-[12px] bg-bg border border-border space-y-2 text-fluid-xs text-left">
                <div className="flex justify-between font-mono">
                  <span className="text-text-muted">M-PESA Receipt:</span>
                  <span className="font-bold text-success-fg">{receiptNumber}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-text-muted">Amount Credited:</span>
                  <span className="font-bold text-text">KES {amount.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-text-muted">Student:</span>
                  <span className="font-bold text-primary">{student.firstName} {student.lastName}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-text-muted">Date & Time:</span>
                  <span className="text-text">{new Date().toLocaleString('en-KE')}</span>
                </div>
              </div>

              <div className="w-full flex gap-3">
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  onClick={onClose}
                >
                  Done & View Statement
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: Error state */}
          {step === 'error' && (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-danger-soft text-danger-solid flex items-center justify-center">
                <AlertCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-fluid-lg font-black text-danger-fg">
                  Payment Unsuccessful
                </h3>
                <p className="text-fluid-xs text-text-muted max-w-sm">
                  {errorMessage || 'The STK push transaction could not be completed.'}
                </p>
              </div>

              <div className="w-full flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('form')}
                >
                  Try Again
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    setActiveTab('manual');
                    setStep('form');
                  }}
                >
                  Use Paybill Instead
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
