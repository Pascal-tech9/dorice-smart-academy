-- ============================================================================
-- DORICE SMART ACADEMY - DATABASE SCHEMA MIGRATION 001
-- School Motto: "Inspire, Achieve, Flourish"
-- Kenya Data Protection Act 2019 & CBC Compliant
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE user_role AS ENUM ('admin', 'bursar', 'teacher', 'guardian');
CREATE TYPE learner_status AS ENUM ('active', 'inactive', 'transferred', 'graduated');
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian', 'sponsor');
CREATE TYPE cbc_performance_level AS ENUM ('EE', 'ME', 'AE', 'BE');

-- ----------------------------------------------------------------------------
-- 1. Profiles & Roles (Supabase Auth linked)
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    national_id TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ----------------------------------------------------------------------------
-- 2. Academic Calendar (Years, Terms)
-- ----------------------------------------------------------------------------
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g. '2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Term 1', 'Term 2', 'Term 3'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    next_term_start_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(academic_year_id, name)
);

CREATE INDEX idx_terms_academic_year ON terms(academic_year_id);

-- ----------------------------------------------------------------------------
-- 3. CBC Academic Structure (Grade Levels, Classes, Learning Areas)
-- ----------------------------------------------------------------------------
CREATE TABLE grade_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g. 'PP1', 'PP2', 'Grade 1', 'Grade 7'
    category TEXT NOT NULL CHECK (category IN ('Pre-Primary', 'Lower Primary', 'Upper Primary', 'Junior School', 'Senior School')),
    order_index INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE RESTRICT,
    name TEXT NOT NULL, -- e.g. 'Grade 4 Red', 'Grade 7 Blue'
    stream TEXT NOT NULL DEFAULT 'Main',
    class_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(grade_level_id, stream)
);

CREATE INDEX idx_classes_grade_level ON classes(grade_level_id);
CREATE INDEX idx_classes_class_teacher ON classes(class_teacher_id);

CREATE TABLE learning_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Mathematics Activities'
    code TEXT NOT NULL, -- e.g. 'MATH'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(grade_level_id, code)
);

CREATE INDEX idx_learning_areas_grade_level ON learning_areas(grade_level_id);

CREATE TABLE class_learning_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    learning_area_id UUID NOT NULL REFERENCES learning_areas(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(class_id, learning_area_id)
);

CREATE INDEX idx_cla_class ON class_learning_areas(class_id);
CREATE INDEX idx_cla_teacher ON class_learning_areas(teacher_id);

-- ----------------------------------------------------------------------------
-- 4. Students & Guardians (Kenya DPA 2019 Privacy Model)
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
    nemis_upi TEXT,
    status learner_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_students_status ON students(status);

CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relationship_description TEXT,
    primary_phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(profile_id)
);

CREATE TABLE student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    relationship relationship_type NOT NULL DEFAULT 'guardian',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    can_pay BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, guardian_id)
);

CREATE INDEX idx_sg_student ON student_guardians(student_id);
CREATE INDEX idx_sg_guardian ON student_guardians(guardian_id);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    enrolled_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(student_id, academic_year_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_enrollments_year ON enrollments(academic_year_id);

-- ----------------------------------------------------------------------------
-- 5. CBC Grading Scheme & Bands
-- ----------------------------------------------------------------------------
CREATE TABLE grading_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE grading_bands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID NOT NULL REFERENCES grading_schemes(id) ON DELETE CASCADE,
    level cbc_performance_level NOT NULL,
    sub_level TEXT NOT NULL, -- EE1, EE2, ME1, ME2, AE1, AE2, BE1, BE2
    min_percentage NUMERIC(5,2) NOT NULL,
    max_percentage NUMERIC(5,2) NOT NULL,
    stars INT NOT NULL CHECK (stars BETWEEN 1 AND 4),
    points INT NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(scheme_id, sub_level)
);

-- ----------------------------------------------------------------------------
-- 6. Settings & Audit Logging
-- ----------------------------------------------------------------------------
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    before_data JSONB,
    after_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ----------------------------------------------------------------------------
-- 7. Helper Security & RLS Functions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_role(check_user_id UUID, check_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = check_user_id AND role = check_role
    );
$$;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT has_role(user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION is_bursar(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT has_role(user_id, 'bursar') OR has_role(user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION is_teacher(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT has_role(user_id, 'teacher') OR has_role(user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION is_guardian_of_student(auth_user_id UUID, target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM student_guardians sg
        JOIN guardians g ON g.id = sg.guardian_id
        WHERE g.profile_id = auth_user_id AND sg.student_id = target_student_id
    );
$$;

CREATE OR REPLACE FUNCTION is_teacher_of_class(auth_user_id UUID, target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM classes WHERE id = target_class_id AND class_teacher_id = auth_user_id
    ) OR EXISTS (
        SELECT 1 FROM class_learning_areas WHERE class_id = target_class_id AND teacher_id = auth_user_id
    ) OR is_admin(auth_user_id);
$$;

-- ----------------------------------------------------------------------------
-- 8. Enable Row Level Security (RLS) Default-Deny on All Tables
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_learning_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 9. RLS Policies
-- ----------------------------------------------------------------------------

-- PROFILES
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin and bursar can read all profiles" ON profiles
    FOR SELECT USING (is_admin(auth.uid()) OR is_bursar(auth.uid()));

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can manage profiles" ON profiles
    FOR ALL USING (is_admin(auth.uid()));

-- USER ROLES
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage user roles" ON user_roles
    FOR ALL USING (is_admin(auth.uid()));

-- ACADEMIC YEARS & TERMS (Public read for active portal, admin manage)
CREATE POLICY "Authenticated users can read academic years" ON academic_years
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage academic years" ON academic_years
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can read terms" ON terms
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage terms" ON terms
    FOR ALL USING (is_admin(auth.uid()));

-- GRADE LEVELS & CLASSES & LEARNING AREAS
CREATE POLICY "Authenticated users can read grade levels" ON grade_levels
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage grade levels" ON grade_levels
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can read classes" ON classes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage classes" ON classes
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can read learning areas" ON learning_areas
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage learning areas" ON learning_areas
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can view assigned class learning areas" ON class_learning_areas
    FOR SELECT USING (teacher_id = auth.uid() OR is_admin(auth.uid()) OR is_bursar(auth.uid()));

CREATE POLICY "Admin can manage class learning areas" ON class_learning_areas
    FOR ALL USING (is_admin(auth.uid()));

-- STUDENTS (Admin full, Bursar read, Teacher own classes, Guardian own children)
CREATE POLICY "Admin can manage all students" ON students
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Bursar can read all students" ON students
    FOR SELECT USING (is_bursar(auth.uid()));

CREATE POLICY "Guardians can view own children only" ON students
    FOR SELECT USING (is_guardian_of_student(auth.uid(), id));

CREATE POLICY "Teachers can view enrolled students in their classes" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.student_id = students.id
            AND is_teacher_of_class(auth.uid(), e.class_id)
        )
    );

-- GUARDIANS & STUDENT_GUARDIANS
CREATE POLICY "Admin can manage guardians" ON guardians
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Guardians can view own guardian record" ON guardians
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admin can manage student guardians" ON student_guardians
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Guardians can view own student guardian links" ON student_guardians
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM guardians g WHERE g.id = student_guardians.guardian_id AND g.profile_id = auth.uid())
    );

-- ENROLLMENTS
CREATE POLICY "Admin can manage enrollments" ON enrollments
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Bursar can read enrollments" ON enrollments
    FOR SELECT USING (is_bursar(auth.uid()));

CREATE POLICY "Guardians can view own children enrollments" ON enrollments
    FOR SELECT USING (is_guardian_of_student(auth.uid(), student_id));

CREATE POLICY "Teachers can view enrollments in their classes" ON enrollments
    FOR SELECT USING (is_teacher_of_class(auth.uid(), class_id));

-- GRADING SCHEMES & BANDS
CREATE POLICY "Authenticated users can read grading schemes" ON grading_schemes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage grading schemes" ON grading_schemes
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can read grading bands" ON grading_bands
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage grading bands" ON grading_bands
    FOR ALL USING (is_admin(auth.uid()));

-- SETTINGS
CREATE POLICY "Authenticated users can read settings" ON settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage settings" ON settings
    FOR ALL USING (is_admin(auth.uid()));

-- AUDIT LOG (Admin full, Bursar read financial events)
CREATE POLICY "Admin can read audit log" ON audit_log
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Bursar can read finance audit log" ON audit_log
    FOR SELECT USING (is_bursar(auth.uid()) AND table_name IN ('payments', 'invoices', 'adjustments', 'mpesa_transactions'));
