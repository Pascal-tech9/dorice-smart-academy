-- Migration: CBC Academic Assessments & Term Reports
-- Tables: assessments, assessment_scores, term_reports, term_report_learning_areas

-- 1. Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('formative', 'summative', 'project', 'observation')),
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Assessment Scores
CREATE TABLE IF NOT EXISTS assessment_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  raw_score NUMERIC(5,2),
  rubric_level TEXT NOT NULL CHECK (rubric_level IN ('EE', 'ME', 'AE', 'BE')),
  rubric_points INT NOT NULL CHECK (rubric_points BETWEEN 1 AND 4),
  teacher_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (assessment_id, student_id)
);

-- 3. Term Reports
CREATE TABLE IF NOT EXISTS term_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  overall_level TEXT NOT NULL CHECK (overall_level IN ('EE', 'ME', 'AE', 'BE')),
  attendance_days INT NOT NULL DEFAULT 0,
  total_days INT NOT NULL DEFAULT 65,
  class_teacher_comment TEXT,
  headteacher_comment TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'published')),
  submitted_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, term_id)
);

-- 4. Term Report Learning Areas
CREATE TABLE IF NOT EXISTS term_report_learning_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_report_id UUID NOT NULL REFERENCES term_reports(id) ON DELETE CASCADE,
  learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('EE', 'ME', 'AE', 'BE')),
  rubric_points INT NOT NULL CHECK (rubric_points BETWEEN 1 AND 4),
  formative_score NUMERIC(5,2),
  summative_score NUMERIC(5,2),
  strand_ratings JSONB DEFAULT '[]'::jsonb,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (term_report_id, learning_area_id)
);

-- Enable RLS on all 4 tables
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_report_learning_areas ENABLE ROW LEVEL SECURITY;

-- Staff Full Access Policies
CREATE POLICY "Staff can view assessments" ON assessments
  FOR SELECT TO authenticated
  USING (is_admin() OR is_teacher());

CREATE POLICY "Staff can insert/update assessments" ON assessments
  FOR ALL TO authenticated
  USING (is_admin() OR is_teacher())
  WITH CHECK (is_admin() OR is_teacher());

CREATE POLICY "Staff can manage assessment_scores" ON assessment_scores
  FOR ALL TO authenticated
  USING (is_admin() OR is_teacher())
  WITH CHECK (is_admin() OR is_teacher());

CREATE POLICY "Staff can manage term_reports" ON term_reports
  FOR ALL TO authenticated
  USING (is_admin() OR is_teacher())
  WITH CHECK (is_admin() OR is_teacher());

CREATE POLICY "Staff can manage term_report_learning_areas" ON term_report_learning_areas
  FOR ALL TO authenticated
  USING (is_admin() OR is_teacher())
  WITH CHECK (is_admin() OR is_teacher());

-- Guardian Access Policies (Strict Isolation to their own children & published reports)
CREATE POLICY "Guardians can view assessment scores of their children" ON assessment_scores
  FOR SELECT TO authenticated
  USING (is_guardian_of_student(student_id));

CREATE POLICY "Guardians can view published term reports of their children" ON term_reports
  FOR SELECT TO authenticated
  USING (
    is_guardian_of_student(student_id) AND
    status = 'published'
  );

CREATE POLICY "Guardians can view learning areas of published reports" ON term_report_learning_areas
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM term_reports tr
      WHERE tr.id = term_report_learning_areas.term_report_id
        AND tr.status = 'published'
        AND is_guardian_of_student(tr.student_id)
    )
  );
