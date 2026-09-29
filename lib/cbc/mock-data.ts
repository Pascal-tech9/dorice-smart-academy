export type CbcRubricLevel = 'EE' | 'ME' | 'AE' | 'BE';

export interface CbcLearningAreaResult {
  code: string;
  name: string;
  strands: string[];
  formativeScore: number;
  summativeScore: number;
  rubricLevel: CbcRubricLevel;
  rubricPoints: number; // 4 = EE, 3 = ME, 2 = AE, 1 = BE
  teacherRemarks: string;
}

export interface CbcCoreCompetency {
  name: string;
  level: CbcRubricLevel;
  description: string;
}

export interface CbcReportCardData {
  reportId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  gradeLevel: string;
  term: string;
  academicYear: number;
  overallLevel: CbcRubricLevel;
  overallPoints: number;
  attendanceDays: number;
  totalDays: number;
  status: 'draft' | 'submitted' | 'approved' | 'published';
  dateOfIssue: string;
  classTeacherName: string;
  classTeacherRemarks: string;
  headteacherName: string;
  headteacherRemarks: string;
  nextTermBegins: string;
  learningAreas: CbcLearningAreaResult[];
  coreCompetencies: CbcCoreCompetency[];
  values: { name: string; rating: 'Consistent' | 'Satisfactory' | 'Needs Support' }[];
}

export const CBC_RUBRIC_CONFIG = {
  EE: {
    label: 'Exceeding Expectations',
    shortDesc: '80% - 100% (High mastery, demonstrates initiative beyond grade level)',
    stars: 4,
    points: 4,
  },
  ME: {
    label: 'Meeting Expectations',
    shortDesc: '65% - 79% (Consistently achieves expected learning competencies)',
    stars: 3,
    points: 3,
  },
  AE: {
    label: 'Approaching Expectations',
    shortDesc: '50% - 64% (Basic competence demonstrated, requires guided practice)',
    stars: 2,
    points: 2,
  },
  BE: {
    label: 'Below Expectations',
    shortDesc: '0% - 49% (Struggles with fundamental concepts, intensive support required)',
    stars: 1,
    points: 1,
  },
};

export function scoreToRubric(score: number): { level: CbcRubricLevel; points: number } {
  if (score >= 80) return { level: 'EE', points: 4 };
  if (score >= 65) return { level: 'ME', points: 3 };
  if (score >= 50) return { level: 'AE', points: 2 };
  return { level: 'BE', points: 1 };
}

export const DEMO_REPORT_CARDS: Record<string, CbcReportCardData> = {
  // Brian Kipchumba (Grade 4 East)
  'DSA-2023-014': {
    reportId: 'REP-2026-T1-014',
    studentId: 'stu-1',
    studentName: 'Brian Kipchumba',
    admissionNumber: 'DSA-2023-014',
    className: 'Grade 4 East',
    gradeLevel: 'Grade 4 (CBC Middle School)',
    term: 'Term 1',
    academicYear: 2026,
    overallLevel: 'EE',
    overallPoints: 3.71,
    attendanceDays: 63,
    totalDays: 65,
    status: 'published',
    dateOfIssue: '28 March 2026',
    classTeacherName: 'Madam Grace Chepkemoi',
    classTeacherRemarks:
      'Brian is a diligent, respectful, and inquisitive learner who consistently demonstrates leadership among his peers and takes deep initiative in group learning activities.',
    headteacherName: 'Mr. David Sang (Headteacher)',
    headteacherRemarks:
      'An outstanding academic and co-curricular performance throughout the term. Keep upholding the school motto "Inspire, Achieve, Flourish"!',
    nextTermBegins: '04 May 2026',
    learningAreas: [
      {
        code: 'MATH4',
        name: 'Mathematics Activities',
        strands: ['Numbers & Operations', 'Measurement', 'Geometry & Patterns'],
        formativeScore: 84,
        summativeScore: 88,
        rubricLevel: 'EE',
        rubricPoints: 4,
        teacherRemarks: 'Demonstrates exceptional mastery in mental calculations, 3-digit multiplication, and word problems.',
      },
      {
        code: 'ENG4',
        name: 'English Language Activities',
        strands: ['Listening & Speaking', 'Reading Fluency & Comprehension', 'Creative Writing'],
        formativeScore: 76,
        summativeScore: 79,
        rubricLevel: 'ME',
        rubricPoints: 3,
        teacherRemarks: 'Fluent in oral communication; creative in narrative composition with strong grammatical awareness.',
      },
      {
        code: 'KIS4',
        name: 'Kiswahili Language Activities',
        strands: ['Kusikiliza na Kuzungumza', 'Kusoma', 'Kuandika na Sarufi'],
        formativeScore: 80,
        summativeScore: 83,
        rubricLevel: 'EE',
        rubricPoints: 4,
        teacherRemarks: 'Kazi nzuri sana katika msamiati, nahau na usomaji fasaha wa hadithi za Kiswahili.',
      },
      {
        code: 'SCI4',
        name: 'Science & Technology Activities',
        strands: ['Living Things', 'Weather & Water', 'Simple Machines'],
        formativeScore: 82,
        summativeScore: 85,
        rubricLevel: 'EE',
        rubricPoints: 4,
        teacherRemarks: 'Shows exemplary curiosity and systematic note-taking during scientific investigations and plant growth experiments.',
      },
      {
        code: 'ART4',
        name: 'Creative Arts & Sports',
        strands: ['Art & Craft', 'Music Performance', 'Physical Education'],
        formativeScore: 88,
        summativeScore: 92,
        rubricLevel: 'EE',
        rubricPoints: 4,
        teacherRemarks: 'Talented in indigenous basketry weaving, recorder melodies, and athletics.',
      },
      {
        code: 'SST4',
        name: 'Social Studies & Christian Religious Education',
        strands: ['Physical Environment', 'Historical Traditions', 'Christian Values'],
        formativeScore: 78,
        summativeScore: 81,
        rubricLevel: 'EE',
        rubricPoints: 4,
        teacherRemarks: 'Displays strong civic consciousness, environmental care, and Christian moral discipline.',
      },
      {
        code: 'AGR4',
        name: 'Agriculture & Nutrition Activities',
        strands: ['Soil Conservation', 'Kitchen Gardening', 'Food Preservation'],
        formativeScore: 74,
        summativeScore: 76,
        rubricLevel: 'ME',
        rubricPoints: 3,
        teacherRemarks: 'Actively tended the class drip-irrigation vegetable nursery bed with great enthusiasm.',
      },
    ],
    coreCompetencies: [
      {
        name: 'Communication and Collaboration',
        level: 'EE',
        description: 'Expresses concepts clearly and collaborates willingly with peers in paired activities.',
      },
      {
        name: 'Critical Thinking and Problem Solving',
        level: 'EE',
        description: 'Capable of analyzing real-life mathematical puzzles and environmental challenges.',
      },
      {
        name: 'Imagination and Creativity',
        level: 'EE',
        description: 'Demonstrates original design flair in model constructions and artistic compositions.',
      },
      {
        name: 'Citizenship & Respect',
        level: 'EE',
        description: 'Always observant of classroom order, national values, and mutual courtesy.',
      },
      {
        name: 'Digital Literacy',
        level: 'ME',
        description: 'Comfortably navigates tablet educational software for reading and interactive math exercises.',
      },
      {
        name: 'Self-Efficacy',
        level: 'ME',
        description: 'Takes pride in work and shows resilience when faced with difficult tasks.',
      },
    ],
    values: [
      { name: 'Love & Kindness', rating: 'Consistent' },
      { name: 'Responsibility', rating: 'Consistent' },
      { name: 'Respect & Courtesy', rating: 'Consistent' },
      { name: 'Integrity', rating: 'Consistent' },
      { name: 'Peace & Unity', rating: 'Consistent' },
    ],
  },

  // Faith Chebet (PP2 Yellow)
  'DSA-2024-089': {
    reportId: 'REP-2026-T1-089',
    studentId: 'stu-2',
    studentName: 'Faith Chebet',
    admissionNumber: 'DSA-2024-089',
    className: 'PP2 Yellow',
    gradeLevel: 'Pre-Primary 2 (Early Years)',
    term: 'Term 1',
    academicYear: 2026,
    overallLevel: 'ME',
    overallPoints: 3.2,
    attendanceDays: 61,
    totalDays: 65,
    status: 'published',
    dateOfIssue: '28 March 2026',
    classTeacherName: 'Teacher Joyce Jepkosgei',
    classTeacherRemarks:
      'Faith is a joyful, energetic learner who participates eagerly in singing, story-telling, and outdoor play.',
    headteacherName: 'Mr. David Sang (Headteacher)',
    headteacherRemarks:
      'Great developmental progress made this term. Well done Faith!',
    nextTermBegins: '04 May 2026',
    learningAreas: [
      {
        code: 'PP2-MATH',
        name: 'Mathematical Activities',
        strands: ['Number Recognition 1-50', 'Shapes & Sorting', 'Grouping'],
        formativeScore: 78,
        summativeScore: 80,
        rubricLevel: 'EE',
        rubricPoints: 4,
        teacherRemarks: 'Counts accurately and recognizes two-dimensional shapes effortlessly.',
      },
      {
        code: 'PP2-LANG',
        name: 'Language Activities',
        strands: ['Letter Sounds (Phonics)', 'Pre-Writing Strokes', 'Story Re-telling'],
        formativeScore: 72,
        summativeScore: 75,
        rubricLevel: 'ME',
        rubricPoints: 3,
        teacherRemarks: 'Good phonetic blending; pencil grip is stabilizing well.',
      },
      {
        code: 'PP2-ENV',
        name: 'Environmental Activities',
        strands: ['My Family & School', 'Cleanliness & Hygiene', 'Domestic Animals'],
        formativeScore: 74,
        summativeScore: 76,
        rubricLevel: 'ME',
        rubricPoints: 3,
        teacherRemarks: 'Practices personal hygiene and handwashing routines with great responsibility.',
      },
      {
        code: 'PP2-PSYCH',
        name: 'Psychomotor & Creative Activities',
        strands: ['Coloring & Modeling', 'Gross Motor Games', 'Music & Rhymes'],
        formativeScore: 84,
        summativeScore: 86,
        rubricLevel: 'EE',
        rubricPoints: 4,
        teacherRemarks: 'Loves rhythm games, play-dough modeling, and relay runs on the school field.',
      },
      {
        code: 'PP2-REL',
        name: 'Religious Activities (CRE)',
        strands: ['God our Father & Creator', 'Prayer & Sharing'],
        formativeScore: 75,
        summativeScore: 78,
        rubricLevel: 'ME',
        rubricPoints: 3,
        teacherRemarks: 'Knows Bible memory verses and shares toys harmoniously with classmates.',
      },
    ],
    coreCompetencies: [
      {
        name: 'Communication and Collaboration',
        level: 'ME',
        description: 'Communicates needs clearly to teachers and plays cooperatively with peers.',
      },
      {
        name: 'Imagination and Creativity',
        level: 'EE',
        description: 'Vivid color choices in coloring books and expressive singing during assemblies.',
      },
      {
        name: 'Self-Efficacy',
        level: 'ME',
        description: 'Proudly displays finished drawings and puts away learning materials neatly.',
      },
    ],
    values: [
      { name: 'Sharing', rating: 'Consistent' },
      { name: 'Obedience', rating: 'Consistent' },
      { name: 'Honesty', rating: 'Satisfactory' },
      { name: 'Helpfulness', rating: 'Consistent' },
    ],
  },
};

// Aliases for 2026 demo cohort
DEMO_REPORT_CARDS['DSA/2026/001'] = DEMO_REPORT_CARDS['DSA-2023-014'];
DEMO_REPORT_CARDS['DSA-2026-0001'] = DEMO_REPORT_CARDS['DSA-2023-014'];
DEMO_REPORT_CARDS['DSA/2026/002'] = DEMO_REPORT_CARDS['DSA-2024-089'];
DEMO_REPORT_CARDS['DSA-2026-0002'] = DEMO_REPORT_CARDS['DSA-2024-089'];
DEMO_REPORT_CARDS['DSA/2026/003'] = DEMO_REPORT_CARDS['DSA-2023-014'];
DEMO_REPORT_CARDS['DSA/2026/004'] = DEMO_REPORT_CARDS['DSA-2023-014'];
DEMO_REPORT_CARDS['DSA/2026/005'] = DEMO_REPORT_CARDS['DSA-2024-089'];

