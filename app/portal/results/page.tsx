'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Award,
  Calendar,
  CheckCircle2,
  BookOpen,
  UserCheck,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { DEMO_STUDENTS, type StudentRecord } from '@/lib/people/mock-data';
import { FamilySwitcher } from '@/components/portal/family-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CbcStars } from '@/components/ui/cbc-stars';
import {
  DEMO_REPORT_CARDS,
  CBC_RUBRIC_CONFIG,
  type CbcReportCardData,
} from '@/lib/cbc/mock-data';

export default function GuardianResultsPage() {
  const familyStudents = DEMO_STUDENTS.slice(0, 2);
  const [activeStudent, setActiveStudent] = React.useState<StudentRecord>(familyStudents[0]);
  const [selectedTerm, setSelectedTerm] = React.useState<string>('Term 1 2026');
  const [isDownloading, setIsDownloading] = React.useState<boolean>(false);

  // Retrieve student report card data
  const reportData: CbcReportCardData =
    DEMO_REPORT_CARDS[activeStudent.admissionNumber] || DEMO_REPORT_CARDS['DSA-2023-014'];

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(`/api/reports/pdf/${activeStudent.admissionNumber}`);
      if (!res.ok) throw new Error('Failed to generate report card PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ReportCard-${activeStudent.admissionNumber}-Term1-2026.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Error downloading PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1240px] mx-auto space-y-8">
        
        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Home</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-primary">
                CBC Academic Performance & Report Card
              </h1>
              <Badge variant="paid" label="Official Published Report" />
            </div>
            <p className="text-fluid-sm text-text-muted mt-1">
              Dorice Smart Academy • Official Competency Assessment for {activeStudent.firstName} {activeStudent.lastName}
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

        {/* Term Switcher & Top Action Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[14px] bg-surface border border-border shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-fluid-xs font-bold text-text-muted uppercase tracking-wider">
              Academic Term:
            </span>
            <div className="flex gap-2">
              {['Term 1 2026', 'Term 3 2025', 'Term 2 2025'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSelectedTerm(term)}
                  className={`px-3 py-1.5 rounded-[8px] text-fluid-xs font-bold transition-colors cursor-pointer ${
                    selectedTerm === term
                      ? 'bg-primary text-primary-fg shadow-xs'
                      : 'bg-bg text-text-muted hover:text-text border border-border'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Single 10% Accent CTA Button */}
          <div>
            <Button
              variant="accent"
              size="lg"
              className="gap-2 w-full sm:w-auto shadow-md"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              <Download className="w-5 h-5" />
              <span>{isDownloading ? 'Generating PDF...' : 'Download Official PDF Report Card'}</span>
            </Button>
          </div>
        </div>

        {/* Overall Assessment Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 border-border">
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-text-muted uppercase">Overall Mastery Level</div>
              <div className="text-fluid-xl font-black text-primary mt-1">
                {reportData.overallLevel === 'EE' && 'Exceeding (EE)'}
                {reportData.overallLevel === 'ME' && 'Meeting (ME)'}
                {reportData.overallLevel === 'AE' && 'Approaching (AE)'}
                {reportData.overallLevel === 'BE' && 'Below (BE)'}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CbcStars level={reportData.overallLevel} size="md" />
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-text-muted uppercase">Term Attendance</div>
              <div className="text-fluid-xl font-black text-primary mt-1">
                {reportData.attendanceDays} / {reportData.totalDays} Days
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-fluid-xs text-text-muted">
              {Math.round((reportData.attendanceDays / reportData.totalDays) * 100)}% attendance rate
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-text-muted uppercase">Class & Stream</div>
              <div className="text-fluid-xl font-black text-primary mt-1">
                {reportData.className}
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-fluid-xs text-text-muted font-mono">
              Adm: {reportData.admissionNumber}
            </CardContent>
          </Card>

          <Card className="border-2 border-border">
            <CardHeader className="pb-2">
              <div className="text-fluid-xs font-bold text-text-muted uppercase">Next Term Begins</div>
              <div className="text-fluid-xl font-black text-primary mt-1">
                {reportData.nextTermBegins}
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-fluid-xs text-text-muted">
              Term 2 Academic Year 2026
            </CardContent>
          </Card>
        </div>

        {/* CBC 4-Tier Rubric Explainer Guide */}
        <div className="p-4 rounded-[12px] bg-primary-soft border border-primary/20">
          <div className="text-fluid-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>Kenya Competency Based Curriculum (CBC) Grading Rubric Guide</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-fluid-xs">
            <div className="p-2.5 rounded-[8px] bg-surface border border-border">
              <div className="font-bold text-success-fg">EE • Exceeding Expectations (4★)</div>
              <div className="text-text-muted mt-0.5">80% - 100% • Exceptional mastery beyond grade standard.</div>
            </div>
            <div className="p-2.5 rounded-[8px] bg-surface border border-border">
              <div className="font-bold text-primary">ME • Meeting Expectations (3★)</div>
              <div className="text-text-muted mt-0.5">65% - 79% • Consistently achieves required learning goals.</div>
            </div>
            <div className="p-2.5 rounded-[8px] bg-surface border border-border">
              <div className="font-bold text-warning-fg">AE • Approaching Expectations (2★)</div>
              <div className="text-text-muted mt-0.5">50% - 64% • Developing competency; needs guided practice.</div>
            </div>
            <div className="p-2.5 rounded-[8px] bg-surface border border-border">
              <div className="font-bold text-danger-fg">BE • Below Expectations (1★)</div>
              <div className="text-text-muted mt-0.5">0% - 49% • Struggles with fundamentals; intensive support.</div>
            </div>
          </div>
        </div>

        {/* Detailed Learning Areas Assessment Table */}
        <Card className="overflow-hidden border-2 border-border shadow-md">
          <CardHeader className="bg-primary-soft border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-fluid-base">Learning Area Performance Breakdown</CardTitle>
              </div>
              <span className="text-fluid-xs font-bold text-text-muted">
                {reportData.learningAreas.length} Evaluated Areas
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-fluid-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface text-primary font-bold">
                    <th className="py-3.5 px-4">Learning Area / Subject</th>
                    <th className="py-3.5 px-4">Key Strands Assessed</th>
                    <th className="py-3.5 px-4 text-center">Formative</th>
                    <th className="py-3.5 px-4 text-center">Summative</th>
                    <th className="py-3.5 px-4 text-center">CBC Level</th>
                    <th className="py-3.5 px-4">Facilitator Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.learningAreas.map((area, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-border hover:bg-surface-muted transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-primary text-fluid-sm">{area.name}</div>
                        <div className="text-text-muted text-fluid-xs font-mono">{area.code}</div>
                      </td>
                      <td className="py-3.5 px-4 text-text">
                        <div className="flex flex-wrap gap-1">
                          {area.strands.map((strand, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-[4px] bg-bg border border-border text-[11px]"
                            >
                              {strand}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-text">
                        {area.formativeScore}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-primary">
                        {area.summativeScore}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <CbcStars level={area.rubricLevel} size="sm" showLabel={true} />
                      </td>
                      <td className="py-3.5 px-4 text-text leading-relaxed">
                        &quot;{area.teacherRemarks}&quot;
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CBC Core Competencies & Values Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Core Competencies */}
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="bg-primary-soft border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-fluid-base">CBC Core Competencies</CardTitle>
              </div>
              <CardDescription>
                Continuous behavioral & cognitive assessment across school activities
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5">
              {reportData.coreCompetencies.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-[10px] bg-bg border border-border flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-primary text-fluid-xs">{comp.name}</div>
                    <div className="text-text-muted text-fluid-xs leading-relaxed">
                      {comp.description}
                    </div>
                  </div>
                  <CbcStars level={comp.level} size="sm" showLabel={false} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Teacher and Headteacher Endorsements */}
          <div className="space-y-6">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="bg-primary-soft border-b border-border">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <CardTitle className="text-fluid-base">Facilitator Endorsements</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="p-4 rounded-[10px] bg-bg border border-border space-y-2">
                  <div className="text-fluid-xs font-bold text-primary uppercase">
                    Class Teacher&apos;s Remarks ({reportData.classTeacherName})
                  </div>
                  <blockquote className="text-fluid-sm text-text italic leading-relaxed">
                    &quot;{reportData.classTeacherRemarks}&quot;
                  </blockquote>
                </div>

                <div className="p-4 rounded-[10px] bg-bg border border-border space-y-2">
                  <div className="text-fluid-xs font-bold text-primary uppercase">
                    Headteacher&apos;s Remarks ({reportData.headteacherName})
                  </div>
                  <blockquote className="text-fluid-sm text-text italic leading-relaxed">
                    &quot;{reportData.headteacherRemarks}&quot;
                  </blockquote>
                </div>
              </CardContent>
            </Card>

            {/* School Seal Confirmation */}
            <div className="p-4 rounded-[12px] bg-surface border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <div className="font-bold text-fluid-sm text-primary">
                    Verified Digital Academic Record
                  </div>
                  <div className="text-fluid-xs text-text-muted">
                    Report ID: {reportData.reportId} • Issued on {reportData.dateOfIssue}
                  </div>
                </div>
              </div>
              <div className="hidden sm:block text-right text-fluid-xs text-text-muted">
                Dorice Smart Academy<br />Kipkaren River
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
