'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Search, Filter, Upload, Plus, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { DEMO_STUDENTS, type StudentRecord } from '@/lib/people/mock-data';
import { parseStudentCsv, type StudentCsvRow } from '@/lib/people/csv-import';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminStudentsPage() {
  const [students, setStudents] = React.useState<StudentRecord[]>(DEMO_STUDENTS);
  const [search, setSearch] = React.useState('');
  const [selectedClass, setSelectedClass] = React.useState('all');
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [csvText, setCsvText] = React.useState('');
  const [importStatus, setImportStatus] = React.useState<string | null>(null);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.className === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleCsvImport = () => {
    const result = parseStudentCsv(csvText);
    if (result.errors.length > 0) {
      setImportStatus(`Import Error: ${result.errors[0].message} at row ${result.errors[0].row}`);
      return;
    }

    if (result.valid.length === 0) {
      setImportStatus('No valid student rows found in CSV.');
      return;
    }

    const newRecords: StudentRecord[] = result.valid.map((r, i) => ({
      id: `imported-${Date.now()}-${i}`,
      admissionNumber: r.admission_number,
      firstName: r.first_name,
      lastName: r.last_name,
      gender: r.gender,
      dateOfBirth: r.date_of_birth,
      nemisUpi: r.nemis_upi || 'NEMIS-PENDING',
      gradeLevel: r.grade_level,
      className: `${r.grade_level} Main`,
      status: 'active',
      feeBalance: 18500,
      termFee: 18500,
      guardians: [
        {
          name: r.guardian_name,
          relationship: r.guardian_relationship as 'Father' | 'Mother' | 'Guardian',
          phone: r.guardian_phone,
          isPrimary: true,
          canPay: true,
        },
      ],
      recentResults: {
        term: 'Term 1',
        year: '2026',
        overallLevel: 'ME',
        attendanceDays: 60,
        totalDays: 64,
        remarks: 'New enrollment under onboarding review.',
      },
    }));

    setStudents((prev) => [...newRecords, ...prev]);
    setImportStatus(`Successfully imported ${newRecords.length} student records and linked guardians.`);
    setTimeout(() => {
      setShowImportModal(false);
      setImportStatus(null);
      setCsvText('');
    }, 2500);
  };

  const sampleCsvTemplate = `admission_number,first_name,last_name,gender,date_of_birth,grade_level,guardian_name,guardian_phone,guardian_relationship,nemis_upi
DSA-2026-031,Daniel,Kariuki,Male,2016-05-14,Grade 4,Grace Kariuki,0711223344,Mother,NEMIS991201
DSA-2026-032,Joy,Njeri,Female,2016-08-20,Grade 4,Grace Kariuki,0711223344,Mother,NEMIS991202`;

  return (
    <div className="min-h-screen bg-bg text-text py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1360px] mx-auto space-y-8">
        
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link href="/staff/admin/setup" className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary hover:underline mb-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Setup</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-fluid-2xl font-black text-primary">
                Learner & Guardian Directory
              </h1>
              <Badge variant="paid" label={`${students.length} Enrolled`} />
            </div>
            <p className="text-fluid-sm text-text-muted mt-1">
              Manage student enrollment, sibling linkages, and guardian contact details.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setCsvText(sampleCsvTemplate);
                setShowImportModal(true);
              }}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV Roster</span>
            </Button>

            <Button variant="accent" size="md" className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Enroll New Student</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-[12px] bg-surface border border-border shadow-sm">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by learner name, admission number..."
              className="w-full pl-10 pr-4 py-2.5 rounded-[10px] border border-border bg-bg text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-border bg-bg text-text text-fluid-sm focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              <option value="all">All Classes & Streams</option>
              <option value="Grade 4 Red">Grade 4 Red</option>
              <option value="Grade 7 Blue">Grade 7 Blue</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-primary-soft">
            <div className="flex items-center justify-between">
              <CardTitle className="text-fluid-base">Enrolled Students</CardTitle>
              <span className="text-fluid-xs font-bold text-text-muted">
                Showing {filteredStudents.length} of {students.length} Learners
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-fluid-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface text-primary font-bold">
                    <th className="py-3 px-4">Admission No.</th>
                    <th className="py-3 px-4">Learner Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Primary Guardian & Phone</th>
                    <th className="py-3 px-4">Fee Balance</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const primaryGuardian = s.guardians.find((g) => g.isPrimary) || s.guardians[0];
                    return (
                      <tr key={s.id} className="border-b border-border hover:bg-surface-muted transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">{s.admissionNumber}</td>
                        <td className="py-3 px-4 font-black text-text text-fluid-sm">
                          {s.firstName} {s.lastName}
                        </td>
                        <td className="py-3 px-4 font-semibold text-text">{s.className}</td>
                        <td className="py-3 px-4 text-text-muted">{s.gender}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-text">{primaryGuardian?.name}</div>
                          <div className="text-[11px] text-text-muted font-mono">{primaryGuardian?.phone}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold tabular-nums">
                          {s.feeBalance === 0 ? (
                            <span className="text-success-fg">Cleared</span>
                          ) : (
                            <span className="text-danger-fg">KES {s.feeBalance.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={s.status === 'active' ? 'paid' : 'unpaid'} label={s.status} showIcon={false} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CSV Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-surface rounded-[14px] border border-border shadow-2xl overflow-hidden animate-scale-in">
              <div className="p-6 border-b border-border flex items-center justify-between bg-primary-soft">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <h3 className="text-fluid-lg font-black text-primary">Import Students CSV</h3>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:bg-surface-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-fluid-xs text-text-muted">
                  Paste comma-separated student roster data below. Required headers: <code>admission_number, first_name, last_name, gender, date_of_birth, grade_level, guardian_name, guardian_phone, guardian_relationship</code>.
                </p>

                {importStatus && (
                  <div
                    className={`p-3.5 rounded-[10px] text-fluid-xs font-bold border ${
                      importStatus.startsWith('Import Error')
                        ? 'bg-danger-soft text-danger-fg border-danger-border'
                        : 'bg-success-soft text-success-fg border-success-border'
                    }`}
                  >
                    {importStatus}
                  </div>
                )}

                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-[10px] border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-focus-ring"
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowImportModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="accent" onClick={handleCsvImport}>
                    Process & Import Roster
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
