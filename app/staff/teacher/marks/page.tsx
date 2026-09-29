'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Send,
  BookOpen,
  Users,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CbcStars } from '@/components/ui/cbc-stars';
import { scoreToRubric, type CbcRubricLevel } from '@/lib/cbc/mock-data';

interface MarkEntryRow {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  formativeScore: number;
  summativeScore: number;
  rubricLevel: CbcRubricLevel;
  remarks: string;
}

const INITIAL_ROWS: MarkEntryRow[] = [
  {
    studentId: 'stu-1',
    studentName: 'Brian Kipchumba',
    admissionNumber: 'DSA-2023-014',
    formativeScore: 84,
    summativeScore: 88,
    rubricLevel: 'EE',
    remarks: 'Demonstrates exceptional mastery in calculations and word problems.',
  },
  {
    studentId: 'stu-3',
    studentName: 'Kevin Koech',
    admissionNumber: 'DSA-2023-042',
    formativeScore: 74,
    summativeScore: 78,
    rubricLevel: 'ME',
    remarks: 'Good grasp of multiplication; needs slight practice in geometry.',
  },
  {
    studentId: 'stu-4',
    studentName: 'Sharon Cherotich',
    admissionNumber: 'DSA-2023-055',
    formativeScore: 68,
    summativeScore: 72,
    rubricLevel: 'ME',
    remarks: 'Steady progress in division concepts; actively participates in group work.',
  },
  {
    studentId: 'stu-5',
    studentName: 'Emmanuel Kiprono',
    admissionNumber: 'DSA-2023-061',
    formativeScore: 56,
    summativeScore: 58,
    rubricLevel: 'AE',
    remarks: 'Developing competency in fractions; recommended for afternoon peer study.',
  },
];

export default function TeacherMarkEntryPage() {
  const [selectedClass, setSelectedClass] = React.useState<string>('Grade 4 East');
  const [selectedArea, setSelectedArea] = React.useState<string>('Mathematics Activities');
  const [selectedTerm, setSelectedTerm] = React.useState<string>('Term 1 2026');
  const [rows, setRows] = React.useState<MarkEntryRow[]>(INITIAL_ROWS);
  const [isSaved, setIsSaved] = React.useState<boolean>(true);
  const [isSubmitted, setIsSubmitted] = React.useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = React.useState<string>('Just now');

  const handleScoreChange = (
    index: number,
    field: 'formativeScore' | 'summativeScore',
    value: string
  ) => {
    const num = Math.min(100, Math.max(0, Number(value) || 0));
    setRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: num };
      // Re-calculate rubric level based on weighted or summative score
      const combined = Math.round(target.formativeScore * 0.4 + target.summativeScore * 0.6);
      target.rubricLevel = scoreToRubric(combined).level;
      updated[index] = target;
      return updated;
    });
    setIsSaved(false);
  };

  const handleRemarksChange = (index: number, remarks: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], remarks };
      return updated;
    });
    setIsSaved(false);
  };

  const handleSaveDraft = () => {
    setIsSaved(true);
    setLastSavedTime(new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleSubmitForApproval = () => {
    handleSaveDraft();
    setIsSubmitted(true);
    alert('Marks submitted to Headteacher David Sang for approval & publishing.');
  };

  return (
    <div className="min-h-screen bg-bg text-text py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1360px] mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Staff Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-primary">
                CBC Assessment Marks Entry Grid
              </h1>
              <Badge
                variant={isSubmitted ? 'paid' : isSaved ? 'partial' : 'arrears'}
                label={isSubmitted ? 'Submitted for Approval' : isSaved ? 'Draft Saved' : 'Unsaved Changes'}
              />
            </div>
            <p className="text-fluid-sm text-text-muted mt-1">
              Dorice Smart Academy • Fast Facilitator Mark Entry & Rubric Automation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleSaveDraft}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </Button>

            {/* Exactly one primary 10% accent button per view */}
            <Button
              variant="accent"
              size="md"
              onClick={handleSubmitForApproval}
              disabled={isSubmitted}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitted ? 'Submitted' : 'Submit for Approval'}</span>
            </Button>
          </div>
        </div>

        {/* Filter & Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-[14px] bg-surface border border-border shadow-xs">
          <div>
            <label className="block text-fluid-xs font-bold text-text-muted uppercase mb-1">
              Class / Stream
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-2 px-3 rounded-[8px] bg-bg border border-border text-fluid-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Grade 4 East">Grade 4 East (CBC Middle School)</option>
              <option value="Grade 4 West">Grade 4 West (CBC Middle School)</option>
              <option value="Grade 3 Blue">Grade 3 Blue (CBC Lower Primary)</option>
              <option value="PP2 Yellow">PP2 Yellow (Early Years Education)</option>
            </select>
          </div>

          <div>
            <label className="block text-fluid-xs font-bold text-text-muted uppercase mb-1">
              Learning Area / Subject
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full py-2 px-3 rounded-[8px] bg-bg border border-border text-fluid-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Mathematics Activities">Mathematics Activities</option>
              <option value="English Language Activities">English Language Activities</option>
              <option value="Kiswahili Language Activities">Kiswahili Language Activities</option>
              <option value="Science & Technology Activities">Science & Technology Activities</option>
              <option value="Creative Arts & Sports">Creative Arts & Sports</option>
              <option value="Social Studies & CRE">Social Studies & CRE</option>
              <option value="Agriculture & Nutrition">Agriculture & Nutrition</option>
            </select>
          </div>

          <div>
            <label className="block text-fluid-xs font-bold text-text-muted uppercase mb-1">
              Term & Academic Year
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full py-2 px-3 rounded-[8px] bg-bg border border-border text-fluid-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Term 1 2026">Term 1 2026 (Active)</option>
              <option value="Term 3 2025">Term 3 2025 (Archived)</option>
            </select>
          </div>
        </div>

        {/* Mark Entry Spreadsheet Table */}
        <Card className="overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="bg-primary-soft border-b border-border py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-fluid-base">
                  {selectedArea} • {selectedClass}
                </CardTitle>
              </div>
              <div className="text-fluid-xs text-text-muted flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-fg" />
                <span>Status: {isSaved ? `Saved (${lastSavedTime})` : 'Unsaved edits...'}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-fluid-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface text-primary font-bold">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Learner Name & Adm No.</th>
                    <th className="py-3.5 px-4 text-center w-28">Formative (40%)</th>
                    <th className="py-3.5 px-4 text-center w-28">Summative (60%)</th>
                    <th className="py-3.5 px-4 text-center w-36">CBC Rubric Level</th>
                    <th className="py-3.5 px-4 min-w-[320px]">Teacher Qualitative Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.studentId}
                      className="border-b border-border hover:bg-surface-muted transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-text-muted font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-primary text-fluid-sm">{row.studentName}</div>
                        <div className="font-mono text-text-muted text-[11px]">{row.admissionNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={row.formativeScore}
                          onChange={(e) => handleScoreChange(idx, 'formativeScore', e.target.value)}
                          className="w-20 py-1.5 px-2 text-center font-mono font-bold text-fluid-sm rounded-[6px] bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={row.summativeScore}
                          onChange={(e) => handleScoreChange(idx, 'summativeScore', e.target.value)}
                          className="w-20 py-1.5 px-2 text-center font-mono font-bold text-fluid-sm text-primary rounded-[6px] bg-bg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <CbcStars level={row.rubricLevel} size="sm" showLabel={true} />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          placeholder="Specific competency remarks..."
                          className="w-full py-1.5 px-3 rounded-[6px] bg-bg border border-border text-fluid-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Helpful Tips Card */}
        <div className="p-4 rounded-[12px] bg-primary-soft text-fluid-xs text-text flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-primary">Keyboard Navigation & Auto-Calculation Tips</div>
            <div className="text-text-muted">
              Scores automatically map to Kenyan CBC bands: <strong>80-100% = EE</strong>, <strong>65-79% = ME</strong>, <strong>50-64% = AE</strong>, <strong>0-49% = BE</strong>. Use Tab key to rapidly advance between columns.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
