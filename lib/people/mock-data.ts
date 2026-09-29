export interface StudentRecord {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  nemisUpi: string;
  gradeLevel: string;
  className: string;
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  feeBalance: number; // in KES
  termFee: number; // in KES
  guardians: {
    name: string;
    relationship: 'Father' | 'Mother' | 'Guardian';
    phone: string;
    isPrimary: boolean;
    canPay: boolean;
  }[];
  recentResults: {
    term: string;
    year: string;
    overallLevel: 'EE' | 'ME' | 'AE' | 'BE';
    attendanceDays: number;
    totalDays: number;
    remarks: string;
  };
}

export const DEMO_STUDENTS: StudentRecord[] = [
  {
    id: 's-001',
    admissionNumber: 'DSA-2026-001',
    firstName: 'Brian',
    lastName: 'Kipchirchir',
    gender: 'Male',
    dateOfBirth: '2016-04-12',
    nemisUpi: 'NEMIS882191',
    gradeLevel: 'Grade 4',
    className: 'Grade 4 Red',
    status: 'active',
    feeBalance: 12500,
    termFee: 18500,
    guardians: [
      {
        name: 'Mary Wanjiku',
        relationship: 'Mother',
        phone: '0712 345 678',
        isPrimary: true,
        canPay: true,
      },
      {
        name: 'David Kipchirchir',
        relationship: 'Father',
        phone: '0722 890 123',
        isPrimary: false,
        canPay: true,
      },
    ],
    recentResults: {
      term: 'Term 1',
      year: '2026',
      overallLevel: 'EE',
      attendanceDays: 62,
      totalDays: 64,
      remarks: 'Brian is an enthusiastic learner with excellent mathematical and problem-solving reasoning.',
    },
  },
  {
    id: 's-002',
    admissionNumber: 'DSA-2026-002',
    firstName: 'Faith',
    lastName: 'Chepkoech',
    gender: 'Female',
    dateOfBirth: '2016-07-23',
    nemisUpi: 'NEMIS882192',
    gradeLevel: 'Grade 4',
    className: 'Grade 4 Red',
    status: 'active',
    feeBalance: 0,
    termFee: 18500,
    guardians: [
      {
        name: 'Mary Wanjiku',
        relationship: 'Mother',
        phone: '0712 345 678',
        isPrimary: true,
        canPay: true,
      },
    ],
    recentResults: {
      term: 'Term 1',
      year: '2026',
      overallLevel: 'ME',
      attendanceDays: 64,
      totalDays: 64,
      remarks: 'Faith consistently demonstrates outstanding language fluency, creative arts expression, and teamwork.',
    },
  },
  {
    id: 's-011',
    admissionNumber: 'DSA-2026-011',
    firstName: 'Victor',
    lastName: 'Kipkemboi',
    gender: 'Male',
    dateOfBirth: '2013-06-11',
    nemisUpi: 'NEMIS882201',
    gradeLevel: 'Grade 7',
    className: 'Grade 7 Blue',
    status: 'active',
    feeBalance: 4200,
    termFee: 22000,
    guardians: [
      {
        name: 'Joseph Kipkemboi',
        relationship: 'Father',
        phone: '0733 456 789',
        isPrimary: true,
        canPay: true,
      },
    ],
    recentResults: {
      term: 'Term 1',
      year: '2026',
      overallLevel: 'EE',
      attendanceDays: 63,
      totalDays: 64,
      remarks: 'Victor excels in integrated science laboratory investigations and pre-technical practicals.',
    },
  },
  {
    id: 's-012',
    admissionNumber: 'DSA-2026-012',
    firstName: 'Daisy',
    lastName: 'Jepchumba',
    gender: 'Female',
    dateOfBirth: '2013-09-02',
    nemisUpi: 'NEMIS882202',
    gradeLevel: 'Grade 7',
    className: 'Grade 7 Blue',
    status: 'active',
    feeBalance: 22000,
    termFee: 22000,
    guardians: [
      {
        name: 'Alice Jepchumba',
        relationship: 'Mother',
        phone: '0744 567 890',
        isPrimary: true,
        canPay: true,
      },
    ],
    recentResults: {
      term: 'Term 1',
      year: '2026',
      overallLevel: 'AE',
      attendanceDays: 58,
      totalDays: 64,
      remarks: 'Daisy is making steady progress in mathematical activities. Recommended for extra guided practice.',
    },
  },
];
