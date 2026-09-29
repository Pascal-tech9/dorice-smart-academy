'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield, Lock, Phone, Mail, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [authMode, setAuthMode] = React.useState<'password' | 'magic'>('password');
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<'guardian' | 'teacher' | 'bursar' | 'admin'>('guardian');
  const [submitted, setSubmitted] = React.useState(false);

  const demoAccounts = {
    guardian: {
      name: 'Mary Wanjiku (Parent of 2 learners)',
      login: 'parent.wanjiku@example.com',
      note: 'Accesses fee balances, M-PESA Daraja receipts, and CBC report cards.',
    },
    teacher: {
      name: 'Mr. John Kiptoo (Grade 4 & 7 Teacher)',
      login: 'teacher.kiptoo@doricesmartacademy.sc.ke',
      note: 'Accesses assigned classes to enter CBC marks and student comments.',
    },
    bursar: {
      name: 'Accounts Office (Bursar)',
      login: 'bursar@doricesmartacademy.sc.ke',
      note: 'Reconciles M-PESA payments, generates invoices, and manages receipts.',
    },
    admin: {
      name: 'Head Teacher / Administrator',
      login: 'admin@doricesmartacademy.sc.ke',
      note: 'Full portal setup, academic terms, staff assignments, and publishing.',
    },
  };

  const handleRoleSelect = (role: 'guardian' | 'teacher' | 'bursar' | 'admin') => {
    setSelectedRole(role);
    setIdentifier(demoAccounts[role].login);
    setPassword('DemoPass2026!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between">
      {/* Top Bar with Back to Website */}
      <div className="max-w-[1360px] w-full mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-fluid-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to School Website</span>
        </Link>
        <div className="text-fluid-xs font-bold text-text-muted">
          Dorice Smart Academy Portal
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-[16px] overflow-hidden border border-border shadow-xl bg-surface">
          
          {/* Left Side: School Identity with Blue Plaid Pattern */}
          <div className="lg:col-span-5 bg-primary text-primary-fg p-8 sm:p-10 flex flex-col justify-between pattern-plaid relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <div className="relative w-24 h-24 drop-shadow-md">
                <Image
                  src="/brand/dorice-logo-badge.png"
                  alt="Dorice Smart Academy crest"
                  fill
                  sizes="96px"
                  className="object-contain"
                  priority
                />
              </div>

              <div>
                <h2 className="text-fluid-xl font-black text-primary-fg tracking-tight">
                  Dorice Smart Academy
                </h2>
                <p className="text-fluid-xs font-bold text-accent-soft uppercase tracking-widest mt-1">
                  Inspire, Achieve, Flourish
                </p>
              </div>

              <p className="text-fluid-sm opacity-90 leading-relaxed">
                Welcome to our school portal. View CBC performance reports, monitor attendance, and settle term fees 
                seamlessly with automated M-PESA reconciliation.
              </p>
            </div>

            <div className="pt-8 border-t border-primary-hover relative z-10 text-fluid-xs opacity-80 flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent shrink-0" />
              <span>Encrypted SSL Session • Kenya DPA 2019</span>
            </div>
          </div>

          {/* Right Side: Login Form with 60-30-10 Disciplined Styling */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
            <div>
              <h3 className="text-fluid-xl font-black text-primary tracking-tight">
                Sign In to Your Account
              </h3>
              <p className="text-fluid-sm text-text-muted mt-1">
                Enter your registered school email or telephone number.
              </p>
            </div>

            {/* Demo Role Switcher (Helper for development & testing Phase 0 & 1) */}
            <div className="p-3.5 rounded-[12px] bg-bg border border-border space-y-2">
              <div className="flex items-center gap-1.5 text-fluid-xs font-black text-primary uppercase tracking-wider">
                <UserCheck className="w-3.5 h-3.5 text-accent" />
                <span>Quick Demo Role Select:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['guardian', 'teacher', 'bursar', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`px-2 py-1.5 rounded-[8px] text-fluid-xs font-bold capitalize transition-colors text-center cursor-pointer ${
                      selectedRole === role
                        ? 'bg-primary text-primary-fg shadow-sm'
                        : 'bg-surface text-text hover:bg-surface-muted border border-border'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted italic pt-1">
                {demoAccounts[selectedRole].note}
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-[12px] bg-success-soft text-success-fg border border-success-border space-y-3 text-center">
                <div className="font-black text-fluid-base">Authentication Ready</div>
                <p className="text-fluid-sm">
                  In Phase 1, Supabase Auth integration is activated. Your credentials for <strong>{identifier}</strong> will connect to the live database with role <strong>{selectedRole}</strong>.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Back to Sign In Form
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="identifier" className="block text-fluid-xs font-bold text-text mb-1">
                    Email Address or Phone Number
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. parent.wanjiku@example.com"
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-surface text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="text-fluid-xs font-bold text-text">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-fluid-xs font-bold text-primary hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your school password"
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-surface text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />
                </div>

                {/* Exactly ONE Accent Button */}
                <div className="pt-2">
                  <Button variant="accent" size="lg" type="submit" className="w-full gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* School Policy Notice */}
            <div className="pt-3 border-t border-border text-fluid-xs text-text-muted leading-relaxed">
              <strong>Invite-Only Policy:</strong> In compliance with school security rules, student and guardian accounts
              are created by the school administration office. Open self-registration is disabled. If you need login assistance,
              please visit the administration office or contact <code>support@doricesmartacademy.sc.ke</code>.
            </div>
          </div>

        </div>
      </div>

      {/* Subtle Bottom Credit */}
      <div className="py-4 text-center text-fluid-xs text-text-muted">
        © {new Date().getFullYear()} Dorice Smart Academy • Kipkaren River, Kenya
      </div>
    </div>
  );
}
