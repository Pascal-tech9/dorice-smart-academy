'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  CheckCircle2,
  Edit3,
  Save,
  X,
  Users,
  ChevronRight,
  Bell,
  BellOff,
  Languages,
} from 'lucide-react';
import { DEMO_STUDENTS } from '@/lib/people/mock-data';
import { FamilySwitcher } from '@/components/portal/family-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProfileField {
  label: string;
  value: string;
  icon: React.ReactNode;
  editable?: boolean;
}

export default function GuardianProfilePage() {
  const familyStudents = DEMO_STUDENTS.slice(0, 2);
  const [activeStudent, setActiveStudent] = React.useState(familyStudents[0]);
  const [isEditing, setIsEditing] = React.useState(false);
  const [emailNotif, setEmailNotif] = React.useState(true);
  const [smsNotif, setSmsNotif] = React.useState(true);
  const [locale, setLocale] = React.useState<'en' | 'sw'>('en');
  const [isSaving, setIsSaving] = React.useState(false);

  // Demo guardian data
  const [profile, setProfile] = React.useState({
    fullName: 'Mary Wanjiku',
    email: 'mary.wanjiku@example.com',
    phone: '+254 712 345 678',
    relationship: 'Mother',
    nationalId: '●●●●●●●●',
  });

  const [editDraft, setEditDraft] = React.useState(profile);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API save
    await new Promise((r) => setTimeout(r, 800));
    setProfile(editDraft);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditDraft(profile);
    setIsEditing(false);
  };

  const profileFields: ProfileField[] = [
    { label: 'Full Name', value: profile.fullName, icon: <User className="w-4 h-4" />, editable: true },
    { label: 'Email Address', value: profile.email, icon: <Mail className="w-4 h-4" />, editable: true },
    { label: 'Phone Number', value: profile.phone, icon: <Phone className="w-4 h-4" />, editable: true },
    { label: 'Relationship to Child', value: profile.relationship, icon: <Users className="w-4 h-4" />, editable: false },
    { label: 'National ID', value: profile.nationalId, icon: <Shield className="w-4 h-4" />, editable: false },
  ];

  return (
    <div className="min-h-screen bg-bg text-text">
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
                Parent &amp; Guardian Portal
              </div>
              <div className="text-fluid-base font-black text-primary-fg leading-none">
                Dorice Smart Academy
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FamilySwitcher
              students={familyStudents}
              activeStudent={activeStudent}
              onSelectStudent={setActiveStudent}
            />
            <Link
              href="/portal"
              className="text-fluid-xs font-semibold text-primary-fg/80 hover:text-primary-fg transition-colors hidden sm:block"
            >
              Portal Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Breadcrumb */}
        <div>
          <Link
            href="/portal"
            className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal Home</span>
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-fluid-2xl font-black text-primary">My Profile</h1>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-1">
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-1"
                >
                  {isSaving ? (
                    <span className="animate-spin">⟳</span>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
          <p className="text-fluid-sm text-text-muted mt-1">
            Manage your contact details, notification preferences and language settings.
          </p>
        </div>

        {/* Profile Avatar + Name */}
        <Card className="overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center shrink-0 relative">
                <span className="text-3xl font-black text-primary">
                  {profile.fullName.charAt(0)}
                </span>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-solid rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-fluid-lg font-black text-primary">{profile.fullName}</h2>
                <p className="text-fluid-sm text-text-muted">{profile.relationship}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="success" label="Verified Guardian" />
                  <Badge variant="info" label={`${familyStudents.length} child${familyStudents.length !== 1 ? 'ren' : ''} linked`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-fluid-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileFields.map((field) => (
              <div key={field.label} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="sm:w-44 flex items-center gap-2 text-fluid-xs font-semibold text-text-muted uppercase tracking-wide">
                  {field.icon}
                  {field.label}
                </div>
                {isEditing && field.editable && field.label !== 'Relationship to Child' ? (
                  <input
                    type={field.label.includes('Email') ? 'email' : field.label.includes('Phone') ? 'tel' : 'text'}
                    value={
                      field.label === 'Full Name'
                        ? editDraft.fullName
                        : field.label === 'Email Address'
                        ? editDraft.email
                        : editDraft.phone
                    }
                    onChange={(e) =>
                      setEditDraft((d) => ({
                        ...d,
                        ...(field.label === 'Full Name'
                          ? { fullName: e.target.value }
                          : field.label === 'Email Address'
                          ? { email: e.target.value }
                          : { phone: e.target.value }),
                      }))
                    }
                    className="flex-1 rounded-[10px] border border-border bg-surface px-3 py-2 text-fluid-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent transition"
                    inputMode={field.label.includes('Phone') ? 'tel' : 'text'}
                  />
                ) : (
                  <div className="flex-1 text-fluid-sm font-semibold text-text py-2">
                    {field.value}
                    {!field.editable && (
                      <span className="ml-2 text-fluid-xs text-text-muted font-normal">(contact school to update)</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My Children */}
        <Card>
          <CardHeader>
            <CardTitle className="text-fluid-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              My Children
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {familyStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-surface-highlight transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-fluid-xs font-black text-primary">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-fluid-sm font-bold text-text">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-fluid-xs text-text-muted">
                      {student.grade} • Adm: {student.admissionNumber}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={student.feeBalance === 0 ? 'paid' : 'partial'}
                    label={student.feeBalance === 0 ? 'Fees Cleared' : 'Balance Due'}
                  />
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            ))}
            <p className="text-fluid-xs text-text-muted pt-1">
              To link or unlink children from your account, contact the school administration.
            </p>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-fluid-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: 'email-notif',
                label: 'Email Notifications',
                description: 'Receive receipts and results notices via email',
                icon: <Mail className="w-4 h-4" />,
                checked: emailNotif,
                onChange: () => setEmailNotif((v) => !v),
              },
              {
                id: 'sms-notif',
                label: 'SMS Notifications',
                description: 'Receive short message updates on your phone',
                icon: <Phone className="w-4 h-4" />,
                checked: smsNotif,
                onChange: () => setSmsNotif((v) => !v),
              },
            ].map((pref) => (
              <label
                key={pref.id}
                htmlFor={pref.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-highlight transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {pref.icon}
                  </div>
                  <div>
                    <div className="text-fluid-sm font-bold text-text">{pref.label}</div>
                    <div className="text-fluid-xs text-text-muted">{pref.description}</div>
                  </div>
                </div>
                <button
                  id={pref.id}
                  role="switch"
                  aria-checked={pref.checked}
                  onClick={pref.onChange}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                    pref.checked ? 'bg-primary' : 'bg-border-strong'
                  }`}
                >
                  <span className="sr-only">{pref.label}</span>
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${
                      pref.checked ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="text-fluid-base flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" />
              Language / Lugha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(['en', 'sw'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLocale(lang)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 text-fluid-sm font-bold transition-all ${
                    locale === lang
                      ? 'border-primary bg-primary text-primary-fg'
                      : 'border-border bg-surface text-text hover:border-primary/50'
                  }`}
                >
                  {lang === 'en' ? '🇬🇧 English' : '🇰🇪 Kiswahili'}
                </button>
              ))}
            </div>
            <p className="text-fluid-xs text-text-muted mt-3">
              Language switching is scaffolded — full Kiswahili UI is coming in a future update.
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-fluid-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full sm:w-auto gap-2" size="sm">
              <Lock className="w-4 h-4" />
              Change Password
            </Button>
            <p className="text-fluid-xs text-text-muted">
              You will receive a password reset link to your registered email address.
              For account issues contact the school office.
            </p>
          </CardContent>
        </Card>

        {/* Portal nav */}
        <nav className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
          {[
            { href: '/portal', label: 'Portal Home', icon: '🏠' },
            { href: '/portal/fees', label: 'Fee Statement', icon: '💳' },
            { href: '/portal/results', label: 'Report Card', icon: '📋' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 p-3 rounded-xl border border-border bg-surface hover:bg-surface-highlight hover:border-primary/30 transition-colors text-fluid-xs font-semibold text-text"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
              <ChevronRight className="w-3 h-3 ml-auto text-text-muted" />
            </Link>
          ))}
        </nav>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-fg/70 mt-12 py-6 px-4 text-center text-fluid-xs">
        <div className="font-black text-primary-fg mb-1">Dorice Smart Academy</div>
        <div className="italic">Inspire, Achieve, Flourish</div>
        <div className="mt-1">P.O. Box 204, Kipkaren River, Kenya</div>
      </footer>
    </div>
  );
}
