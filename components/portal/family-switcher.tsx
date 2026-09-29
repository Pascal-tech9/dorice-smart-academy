'use client';

import * as React from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';
import type { StudentRecord } from '@/lib/people/mock-data';

interface FamilySwitcherProps {
  students: StudentRecord[];
  activeStudent: StudentRecord;
  onSelectStudent: (student: StudentRecord) => void;
}

export function FamilySwitcher({ students, activeStudent, onSelectStudent }: FamilySwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-3 px-4 py-2 rounded-[10px] bg-surface border border-border hover:bg-surface-muted transition-colors cursor-pointer shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-focus-ring"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-black text-fluid-xs shrink-0">
          {activeStudent.firstName[0]}
          {activeStudent.lastName[0]}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Viewing Learner:
          </span>
          <span className="text-fluid-sm font-black text-primary leading-tight">
            {activeStudent.firstName} {activeStudent.lastName} ({activeStudent.className})
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-text-muted ml-1" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-[12px] bg-surface border border-border shadow-xl z-50 p-2 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-text-muted uppercase border-b border-border">
            Family Learner Switcher ({students.length} Enrolled Siblings)
          </div>
          {students.map((student) => {
            const isSelected = student.id === activeStudent.id;
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  onSelectStudent(student);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-[8px] text-left transition-colors cursor-pointer ${
                  isSelected ? 'bg-primary-soft text-primary font-bold' : 'hover:bg-surface-muted text-text'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-fluid-xs font-black">
                    {student.firstName[0]}
                  </div>
                  <div>
                    <div className="text-fluid-xs font-bold text-text">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {student.className} • Adm: {student.admissionNumber}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
