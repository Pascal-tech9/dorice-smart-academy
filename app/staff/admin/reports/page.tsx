'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  Eye,
  FileText,
  Clock,
  Download,
  AlertCircle,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CbcStars } from '@/components/ui/cbc-stars';
import { DEMO_REPORT_CARDS, type CbcReportCardData } from '@/lib/cbc/mock-data';

interface ClassSubmissionSummary {
  className: string;
  gradeLevel: string;
  teacherName: string;
  totalStudents: number;
  submittedCount: number;
  status: 'draft' | 'submitted' | 'approved' | 'published';
}

const CLASS_SUMMARIES: ClassSubmissionSummary[] = [
  {
    className: 'Grade 4 East',
    gradeLevel: 'Grade 4 (CBC Middle School)',
    teacherName: 'Madam Grace Chepkemoi',
    totalStudents: 28,
    submittedCount: 28,
    status: 'submitted',
  },
  {
    className: 'Grade 4 West',
    gradeLevel: 'Grade 4 (CBC Middle School)',
    teacherName: 'Teacher Wilson Rutto',
    totalStudents: 26,
    submittedCount: 26,
    status: 'published',
  },
  {
    className: 'Grade 3 Blue',
    gradeLevel: 'Grade 3 (CBC Lower Primary)',
    teacherName: 'Teacher Hellen Cherono',
    totalStudents: 31,
    submittedCount: 31,
    status: 'submitted',
  },
  {
    className: 'PP2 Yellow',
    gradeLevel: 'Pre-Primary 2 (Early Years)',
    teacherName: 'Teacher Joyce Jepkosgei',
    totalStudents: 22,
    submittedCount: 22,
    status: 'published',
  },
];

export default function AdminReportsApprovalPage() {
  const [classes, setClasses] = React.useState<ClassSubmissionSummary[]>(CLASS_SUMMARIES);
  const [selectedClass, setSelectedClass] = React.useState<string>('Grade 4 East');
  const [headteacherRemark, setHeadteacherRemark] = React.useState<string>(
    'An outstanding academic and co-curricular performance throughout the term. Keep upholding the school motto "Inspire, Achieve, Flourish"!'
  );
  const [isPublishing, setIsPublishing] = React.useState<boolean>(false);

  const activeSummary = classes.find((c) => c.className === selectedClass) || classes[0];

  const handlePublishClass = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setClasses((prev) =>
        prev.map((c) => (c.className === selectedClass ? { ...c, status: 'published' } : c))
      );
      setIsPublishing(false);
      alert(`Report cards for ${selectedClass} have been published. Linked guardians can now view results in the portal.`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-bg text-text py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1360px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link
              href="/staff/admin/setup"
              className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Panel</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-primary">
                CBC Report Cards Approval & Publishing
              </h1>
              <Badge variant="paid" label="Headteacher Portal" />
            </div>
            <p className="text-fluid-sm text-text-muted mt-1">
              Dorice Smart Academy • Quality Assurance, Signatures & Parent Release
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/staff/teacher/marks">
              <Button variant="outline" size="md">
                Teacher Marks Grid
              </Button>
            </Link>

            {/* Exactly one primary 10% accent button per view */}
            <Button
              variant="accent"
              size="md"
              onClick={handlePublishClass}
              disabled={activeSummary.status === 'published' || isPublishing}
              className="gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>
                {activeSummary.status === 'published'
                  ? 'All Reports Published'
                  : isPublishing
                  ? 'Publishing...'
                  : `Publish ${selectedClass} to Parents`}
              </span>
            </Button>
          </div>
        </div>

        {/* Classes Status Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {classes.map((c) => (
            <Card
              key={c.className}
              onClick={() => setSelectedClass(c.className)}
              className={`cursor-pointer transition-all border-2 ${
                selectedClass === c.className
                  ? 'border-primary shadow-md bg-surface'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-fluid-xs font-bold text-text-muted">{c.gradeLevel}</div>
                  <Badge
                    variant={c.status === 'published' ? 'paid' : c.status === 'submitted' ? 'partial' : 'arrears'}
                    label={c.status === 'published' ? 'Published' : c.status === 'submitted' ? 'Under Review' : 'Draft'}
                  />
                </div>
                <CardTitle className="text-fluid-base text-primary mt-1">{c.className}</CardTitle>
                <CardDescription className="text-fluid-xs">Facilitator: {c.teacherName}</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 border-t border-border flex items-center justify-between text-fluid-xs">
                <span className="text-text-muted">
                  {c.submittedCount} / {c.totalStudents} Marks Ready
                </span>
                <span className="font-bold text-primary">Select Class →</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Class Review & Endorsement Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Sample Learner Report Preview */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-2 border-border shadow-md overflow-hidden">
              <CardHeader className="bg-primary-soft border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-fluid-base">
                      Learner Report Card Review ({selectedClass})
                    </CardTitle>
                    <CardDescription>
                      Reviewing sample record: Brian Kipchumba (DSA-2023-014)
                    </CardDescription>
                  </div>
                  <Link
                    href="/portal/results"
                    target="_blank"
                    className="text-fluid-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Guardian Experience</span>
                  </Link>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Overall Rating Banner */}
                <div className="p-4 rounded-[12px] bg-bg border border-border flex items-center justify-between">
                  <div>
                    <div className="text-fluid-xs font-bold text-text-muted uppercase">Computed Term Level</div>
                    <div className="text-fluid-lg font-black text-primary mt-0.5">
                      Exceeding Expectations (EE) • 3.71 Points
                    </div>
                  </div>
                  <CbcStars level="EE" size="md" />
                </div>

                {/* Headteacher Endorsement Comment Editor */}
                <div className="space-y-2">
                  <label className="block text-fluid-xs font-bold text-primary uppercase tracking-wider">
                    Headteacher General Concluding Remarks (Printed on Official PDF)
                  </label>
                  <textarea
                    rows={3}
                    value={headteacherRemark}
                    onChange={(e) => setHeadteacherRemark(e.target.value)}
                    className="w-full p-3 rounded-[8px] bg-bg border border-border text-fluid-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter formal headteacher remarks..."
                  />
                  <p className="text-fluid-xs text-text-muted">
                    This endorsement is attached to all report cards in this stream upon publishing.
                  </p>
                </div>

                {/* Official PDF Preview Trigger */}
                <div className="p-4 rounded-[12px] bg-surface border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <div className="font-bold text-fluid-sm text-text">Verify Branded PDF Layout</div>
                      <div className="text-fluid-xs text-text-muted">
                        Confirm crest alignment, plaid band, and stamp area before releasing.
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/api/reports/pdf/DSA-2023-014`}
                    target="_blank"
                    className="text-fluid-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Preview PDF</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: QA Checklist & Release Policy */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-2 border-border shadow-sm">
              <CardHeader className="bg-primary-soft border-b border-border">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <CardTitle className="text-fluid-base">Quality Assurance Checklist</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 text-fluid-xs text-text">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success-fg shrink-0 mt-0.5" />
                  <span>All 7 CBC Learning Areas scored with formative & summative components.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success-fg shrink-0 mt-0.5" />
                  <span>Class Teacher remarks entered for all enrolled learners.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success-fg shrink-0 mt-0.5" />
                  <span>Attendance records cross-verified against official school register.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success-fg shrink-0 mt-0.5" />
                  <span>Row Level Security (RLS) restricts unpublished drafts from guardian visibility.</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-[12px] bg-primary text-primary-fg pattern-plaid space-y-2">
              <h4 className="font-black text-fluid-sm text-primary-fg">Ministry of Education Compliance</h4>
              <p className="text-fluid-xs opacity-90 leading-relaxed">
                Dorice Smart Academy reports comply with Kenya National Examinations Council (KNEC) and Kenya Institute of Curriculum Development (KICD) CBC reporting guidelines.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
