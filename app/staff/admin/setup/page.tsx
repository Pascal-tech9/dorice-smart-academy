'use client';

import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Calendar, BookOpen, Layers, Award, Save, RefreshCw, Shield, Sparkles, Lock } from 'lucide-react';

export default function AdminSetupWizardPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [yearName, setYearName] = React.useState('2026');
  const [startDate, setStartDate] = React.useState('2026-01-05');
  const [endDate, setEndDate] = React.useState('2026-11-27');
  const [seeded, setSeeded] = React.useState(false);
  const [gateResultsOnFees, setGateResultsOnFees] = React.useState<boolean>(true);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

  // Load live gate setting from Supabase
  React.useEffect(() => {
    async function loadGateSetting() {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'gate_results_on_fees')
          .maybeSingle();

        if (data?.value) {
          const enabled = (data.value as any).enabled ?? (data.value as any).gate_results_on_fees ?? true;
          setGateResultsOnFees(enabled);
        }
      } catch (err) {
        console.warn('Could not fetch gate setting:', err);
      }
    }
    loadGateSetting();
  }, [supabase]);

  const steps = [
    { id: 1, title: 'Academic Year & Terms', icon: Calendar },
    { id: 2, title: 'CBC Grade Levels', icon: Layers },
    { id: 3, title: 'Classes & Streams', icon: BookOpen },
    { id: 4, title: 'Learning Areas', icon: Award },
    { id: 5, title: 'Grading Rubric', icon: Shield },
    { id: 6, title: 'Results Visibility Gate', icon: Lock },
  ];

  const gradeLevels = [
    { name: 'PP1', category: 'Pre-Primary', count: '2 streams' },
    { name: 'PP2', category: 'Pre-Primary', count: '2 streams' },
    { name: 'Grade 1', category: 'Lower Primary', count: '2 streams' },
    { name: 'Grade 2', category: 'Lower Primary', count: '2 streams' },
    { name: 'Grade 3', category: 'Lower Primary', count: '2 streams' },
    { name: 'Grade 4', category: 'Upper Primary', count: '2 streams (Red, Blue)' },
    { name: 'Grade 5', category: 'Upper Primary', count: '2 streams' },
    { name: 'Grade 6', category: 'Upper Primary', count: '2 streams' },
    { name: 'Grade 7', category: 'Junior School', count: '2 streams (Red, Blue)' },
    { name: 'Grade 8', category: 'Junior School', count: '1 stream' },
    { name: 'Grade 9', category: 'Junior School', count: '1 stream' },
  ];

  const handleQuickSeed = () => {
    setSeeded(true);
    setSavedMessage('Default 2026 Academic Structure & CBC Learning Areas initialized successfully.');
    setTimeout(() => setSavedMessage(null), 5000);
  };

  const handleStepSave = (nextStep: number) => {
    setSavedMessage(`Step ${currentStep} configuration saved.`);
    setCurrentStep(nextStep);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-bg text-text py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Top Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link href="/login" className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Home</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-primary">
                School Setup Wizard
              </h1>
              <Badge variant="paid" label="Admin Master Setup" />
            </div>
            <p className="text-fluid-sm text-text-muted mt-1">
              Configure academic years, terms, CBC grade levels, and learning areas for Dorice Smart Academy.
            </p>
          </div>

          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickSeed}
              className="gap-2 border-primary text-primary"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Initialize Standard 2026 CBC Defaults</span>
            </Button>
          </div>
        </div>

        {savedMessage && (
          <div className="p-4 rounded-[12px] bg-success-soft text-success-fg border border-success-border flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-success-solid shrink-0" />
            <span className="font-bold text-fluid-sm">{savedMessage}</span>
          </div>
        )}

        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-1.5 bg-surface rounded-[12px] border border-border shadow-sm">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id || seeded;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2.5 p-3 rounded-[10px] text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-fg shadow-sm'
                    : 'text-text hover:bg-surface-muted'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-fluid-xs font-black ${
                    isActive
                      ? 'bg-accent text-accent-fg'
                      : isCompleted
                      ? 'bg-success-soft text-success-fg border border-success-border'
                      : 'bg-primary-soft text-primary'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <span className="text-fluid-xs font-bold hidden sm:inline truncate">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step 1: Academic Year & Terms */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>1. Academic Year & Term Dates</CardTitle>
              <CardDescription>
                Define the primary operating academic year and active term calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="yearName" className="block text-fluid-xs font-bold text-text mb-1">
                    Academic Year Name
                  </label>
                  <input
                    id="yearName"
                    type="text"
                    value={yearName}
                    onChange={(e) => setYearName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-surface text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-fluid-xs font-bold text-text mb-1">
                    Opening Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-surface text-text text-fluid-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-fluid-xs font-bold text-text mb-1">
                    Closing Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-surface text-text text-fluid-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  />
                </div>
              </div>

              {/* Term Schedule */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-fluid-sm font-black text-primary mb-3">
                  Term Breakdown (2026 Calendar)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-[10px] bg-bg border-2 border-primary space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-fluid-sm text-primary">Term 1 (Current)</span>
                      <Badge variant="paid" label="Active" />
                    </div>
                    <div className="text-fluid-xs text-text-muted">Jan 05, 2026 – Apr 03, 2026</div>
                    <div className="text-[11px] text-text-muted">Next Term Opens: May 04, 2026</div>
                  </div>

                  <div className="p-4 rounded-[10px] bg-surface border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-fluid-sm text-text">Term 2</span>
                      <Badge variant="partial" label="Upcoming" />
                    </div>
                    <div className="text-fluid-xs text-text-muted">May 04, 2026 – Aug 07, 2026</div>
                    <div className="text-[11px] text-text-muted">Next Term Opens: Aug 31, 2026</div>
                  </div>

                  <div className="p-4 rounded-[10px] bg-surface border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-fluid-sm text-text">Term 3</span>
                      <Badge variant="unpaid" label="Scheduled" />
                    </div>
                    <div className="text-fluid-xs text-text-muted">Aug 31, 2026 – Nov 27, 2026</div>
                    <div className="text-[11px] text-text-muted">Year Closure: Nov 27, 2026</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full pt-4">
                <div className="text-fluid-xs text-text-muted">Step 1 of 5</div>
                <Button variant="accent" onClick={() => handleStepSave(2)}>
                  Save & Continue to Grade Levels
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: CBC Grade Levels */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>2. CBC Grade Levels</CardTitle>
              <CardDescription>
                Confirmed levels running at Dorice Smart Academy across early years, primary, and junior school.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gradeLevels.map((lvl) => (
                  <div key={lvl.name} className="p-4 rounded-[10px] bg-surface border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-fluid-base text-primary">{lvl.name}</span>
                      <Badge variant="credit" label={lvl.category} />
                    </div>
                    <div className="text-fluid-xs text-text-muted">{lvl.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button variant="accent" onClick={() => handleStepSave(3)}>
                  Save & Continue to Classes
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Classes & Streams */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>3. Active Classes & Streams</CardTitle>
              <CardDescription>
                Configure classroom streams and assigned class teachers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-fluid-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-primary-soft text-primary font-bold">
                      <th className="py-2.5 px-3">Class Name</th>
                      <th className="py-2.5 px-3">Level</th>
                      <th className="py-2.5 px-3">Stream</th>
                      <th className="py-2.5 px-3">Assigned Class Teacher</th>
                      <th className="py-2.5 px-3">Learners Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 px-3 font-bold text-text">Grade 4 Red</td>
                      <td className="py-3 px-3">Upper Primary</td>
                      <td className="py-3 px-3 font-mono">Red</td>
                      <td className="py-3 px-3 text-primary font-semibold">Mr. John Kiptoo</td>
                      <td className="py-3 px-3 font-mono font-bold tabular-nums">10 Learners</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-3 font-bold text-text">Grade 7 Blue</td>
                      <td className="py-3 px-3">Junior School</td>
                      <td className="py-3 px-3 font-mono">Blue</td>
                      <td className="py-3 px-3 text-primary font-semibold">Ms. Brenda Chebet</td>
                      <td className="py-3 px-3 font-mono font-bold tabular-nums">10 Learners</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button variant="accent" onClick={() => handleStepSave(4)}>
                  Save & Continue to Learning Areas
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Learning Areas */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>4. CBC Learning Areas (Subjects)</CardTitle>
              <CardDescription>
                Core competencies and subject learning areas evaluated in term assessments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-black text-fluid-sm text-primary mb-2">Upper Primary (Grade 4–6)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-fluid-xs">
                  {['Mathematics', 'English Language', 'Kiswahili', 'Science & Technology', 'Social Studies', 'Creative Arts'].map((area) => (
                    <div key={area} className="p-3 rounded-[8px] bg-bg border border-border flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-solid" />
                      <span className="font-bold text-text">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-black text-fluid-sm text-primary mb-2">Junior School (Grade 7–9)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-fluid-xs">
                  {['Mathematics', 'English', 'Kiswahili', 'Integrated Science', 'Pre-Technical Studies', 'Health Education'].map((area) => (
                    <div key={area} className="p-3 rounded-[8px] bg-bg border border-border flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-solid" />
                      <span className="font-bold text-text">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button variant="accent" onClick={() => handleStepSave(5)}>
                  Save & Continue to Grading Rubric
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Step 5: CBC Rubric */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>5. CBC 8-Point Performance Rubric</CardTitle>
              <CardDescription>
                Standard Kenyan Competency Based Curriculum performance levels and percentage thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-[10px] bg-level-ee-soft border border-success-border space-y-2">
                  <div className="font-black text-fluid-sm text-level-ee-fg">EE (Exceeding)</div>
                  <div className="text-fluid-xs font-mono">EE1: 90% – 100% (8 pts)</div>
                  <div className="text-fluid-xs font-mono">EE2: 80% – 89% (7 pts)</div>
                  <div className="text-[11px] text-level-ee-fg font-bold">★★★★ 4 Stars</div>
                </div>

                <div className="p-4 rounded-[10px] bg-level-me-soft border border-info-border space-y-2">
                  <div className="font-black text-fluid-sm text-level-me-fg">ME (Meeting)</div>
                  <div className="text-fluid-xs font-mono">ME1: 70% – 79% (6 pts)</div>
                  <div className="text-fluid-xs font-mono">ME2: 60% – 69% (5 pts)</div>
                  <div className="text-[11px] text-level-me-fg font-bold">★★★ 3 Stars</div>
                </div>

                <div className="p-4 rounded-[10px] bg-level-ae-soft border border-warning-border space-y-2">
                  <div className="font-black text-fluid-sm text-level-ae-fg">AE (Approaching)</div>
                  <div className="text-fluid-xs font-mono">AE1: 50% – 59% (4 pts)</div>
                  <div className="text-fluid-xs font-mono">AE2: 40% – 49% (3 pts)</div>
                  <div className="text-[11px] text-level-ae-fg font-bold">★★ 2 Stars</div>
                </div>

                <div className="p-4 rounded-[10px] bg-level-be-soft border border-danger-border space-y-2">
                  <div className="font-black text-fluid-sm text-level-be-fg">BE (Below)</div>
                  <div className="text-fluid-xs font-mono">BE1: 30% – 39% (2 pts)</div>
                  <div className="text-fluid-xs font-mono">BE2: 0% – 29% (1 pt)</div>
                  <div className="text-[11px] text-level-be-fg font-bold">★ 1 Star</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  Back
                </Button>
                <Button variant="accent" onClick={() => handleStepSave(6)}>
                  Save & Continue to Results Visibility Gate
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Step 6: Results Visibility Gate */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <CardTitle>6. Results Visibility Gate (Fee Clearance Policy)</CardTitle>
              </div>
              <CardDescription>
                Enforce automatic report card gating based on term invoice settlement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 rounded-[12px] bg-bg border border-border cursor-pointer hover:bg-surface-muted transition-colors">
                  <input
                    type="radio"
                    name="gateOption"
                    checked={gateResultsOnFees === true}
                    onChange={async () => {
                      setGateResultsOnFees(true);
                      await supabase.from('settings').upsert({
                        key: 'gate_results_on_fees',
                        value: { enabled: true },
                      }, { onConflict: 'key' });
                      setSavedMessage('Results Visibility Gate enabled (Fee clearance required).');
                      setTimeout(() => setSavedMessage(null), 4000);
                    }}
                    className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div className="space-y-1">
                    <div className="font-bold text-fluid-sm text-primary">
                      Require fees to be fully cleared before guardians can view report cards (Gate ON - Default)
                    </div>
                    <p className="text-fluid-xs text-text-muted leading-relaxed">
                      Term assessment report cards remain locked to parents and guardians until their student&apos;s invoice balance for that term is fully paid (balance = 0). Once paid, results become visible immediately.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-[12px] bg-bg border border-border cursor-pointer hover:bg-surface-muted transition-colors">
                  <input
                    type="radio"
                    name="gateOption"
                    checked={gateResultsOnFees === false}
                    onChange={async () => {
                      setGateResultsOnFees(false);
                      await supabase.from('settings').upsert({
                        key: 'gate_results_on_fees',
                        value: { enabled: false },
                      }, { onConflict: 'key' });
                      setSavedMessage('Results Visibility Gate disabled (All published results visible).');
                      setTimeout(() => setSavedMessage(null), 4000);
                    }}
                    className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                  />
                  <div className="space-y-1">
                    <div className="font-bold text-fluid-sm text-text">
                      Allow guardians to view results even with outstanding fees (Gate OFF)
                    </div>
                    <p className="text-fluid-xs text-text-muted leading-relaxed">
                      When OFF, all parents and guardians can view published report cards immediately upon release, regardless of fee balance.
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(5)}>
                  Back
                </Button>
                <Link href="/staff/admin/students">
                  <Button variant="accent">
                    Complete Setup & View Directory
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        )}

      </div>
    </div>
  );
}
