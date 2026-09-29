-- ============================================================================
-- DORICE SMART ACADEMY - SEED DATA (Demo & Testing)
-- Contains synthetic, non-real data for local testing and demonstration.
-- ============================================================================

-- 1. Academic Year & Terms
INSERT INTO academic_years (id, name, start_date, end_date, is_current)
VALUES ('00000000-0000-0000-0000-000000000001', '2026', '2026-01-05', '2026-11-27', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO terms (id, academic_year_id, name, start_date, end_date, is_current, next_term_start_date)
VALUES 
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Term 1', '2026-01-05', '2026-04-03', true, '2026-05-04'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Term 2', '2026-05-04', '2026-08-07', false, '2026-08-31'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Term 3', '2026-08-31', '2026-11-27', false, '2027-01-04')
ON CONFLICT (academic_year_id, name) DO NOTHING;

-- 2. Grade Levels
INSERT INTO grade_levels (id, name, category, order_index, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 'PP1', 'Pre-Primary', 1, true),
  ('10000000-0000-0000-0000-000000000002', 'PP2', 'Pre-Primary', 2, true),
  ('10000000-0000-0000-0000-000000000003', 'Grade 1', 'Lower Primary', 3, true),
  ('10000000-0000-0000-0000-000000000004', 'Grade 2', 'Lower Primary', 4, true),
  ('10000000-0000-0000-0000-000000000005', 'Grade 3', 'Lower Primary', 5, true),
  ('10000000-0000-0000-0000-000000000006', 'Grade 4', 'Upper Primary', 6, true),
  ('10000000-0000-0000-0000-000000000007', 'Grade 5', 'Upper Primary', 7, true),
  ('10000000-0000-0000-0000-000000000008', 'Grade 6', 'Upper Primary', 8, true),
  ('10000000-0000-0000-0000-000000000009', 'Grade 7', 'Junior School', 9, true),
  ('10000000-0000-0000-0000-000000000010', 'Grade 8', 'Junior School', 10, true),
  ('10000000-0000-0000-0000-000000000011', 'Grade 9', 'Junior School', 11, true)
ON CONFLICT (name) DO NOTHING;

-- 3. CBC Standard Grading Scheme & Bands
INSERT INTO grading_schemes (id, name, version, is_active)
VALUES ('20000000-0000-0000-0000-000000000001', 'CBC Standard 8-Point Rubric', 1, true)
ON CONFLICT DO NOTHING;

INSERT INTO grading_bands (id, scheme_id, level, sub_level, min_percentage, max_percentage, stars, points, label) VALUES
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'EE', 'EE1', 90.00, 100.00, 4, 8, 'Exceeding Expectations (Advanced Mastery)'),
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'EE', 'EE2', 80.00, 89.99, 4, 7, 'Exceeding Expectations (High Mastery)'),
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'ME', 'ME1', 70.00, 79.99, 3, 6, 'Meeting Expectations (Solid Competence)'),
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'ME', 'ME2', 60.00, 69.99, 3, 5, 'Meeting Expectations (Developing Competence)'),
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'AE', 'AE1', 50.00, 59.99, 2, 4, 'Approaching Expectations (Guided Mastery)'),
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'AE', 'AE2', 40.00, 49.99, 2, 3, 'Approaching Expectations (Basic Acquisition)'),
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'BE', 'BE1', 30.00, 39.99, 1, 2, 'Below Expectations (Needs Remediation)'),
  (gen_random_uuid(), '20000000-0000-0000-0000-000000000001', 'BE', 'BE2', 0.00, 29.99, 1, 1, 'Below Expectations (Critical Intervention)')
ON CONFLICT DO NOTHING;

-- 4. Learning Areas for Grade 4 (Upper Primary) & Grade 7 (Junior School)
INSERT INTO learning_areas (id, grade_level_id, name, code, description) VALUES
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000006', 'Mathematics', 'MATH-4', 'Mathematical concepts and problem solving'),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000006', 'English Language', 'ENG-4', 'Communication, reading, and grammar'),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000006', 'Kiswahili', 'KISW-4', 'Lugha na Insha'),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000006', 'Science & Technology', 'SCI-4', 'Inquiry, digital literacy, and environmental care'),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000006', 'Social Studies', 'SOC-4', 'Citizenship, governance, and geography'),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000006', 'Creative Arts', 'ART-4', 'Visual arts, crafts, and performing arts'),
  
  -- Junior School (Grade 7)
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000009', 'Mathematics', 'MATH-7', 'Advanced algebraic and geometric problem solving'),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000009', 'English', 'ENG-7', 'Literature, comprehension, and functional writing'),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000009', 'Kiswahili', 'KISW-7', 'Fasihi simulizi na sarufi'),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000009', 'Integrated Science', 'ISCI-7', 'Physics, chemistry, and biological foundations'),
  (gen_random_uuid(), '10000000-0000-0000-0000-000000000009', 'Pre-Technical Studies', 'PTS-7', 'Technical drawing, materials, and computing')
ON CONFLICT DO NOTHING;

-- 5. Classes
INSERT INTO classes (id, grade_level_id, name, stream) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'Grade 4 Red', 'Red'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000009', 'Grade 7 Blue', 'Blue')
ON CONFLICT DO NOTHING;

-- 6. Sample Demo Students (20 Learners)
INSERT INTO students (id, admission_number, first_name, last_name, date_of_birth, gender, nemis_upi, status) VALUES
  ('40000000-0000-0000-0000-000000000001', 'DSA-2026-001', 'Brian', 'Kipchirchir', '2016-04-12', 'Male', 'NEMIS882191', 'active'),
  ('40000000-0000-0000-0000-000000000002', 'DSA-2026-002', 'Faith', 'Chepkoech', '2016-07-23', 'Female', 'NEMIS882192', 'active'),
  ('40000000-0000-0000-0000-000000000003', 'DSA-2026-003', 'Emmanuel', 'Kiptoo', '2016-02-18', 'Male', 'NEMIS882193', 'active'),
  ('40000000-0000-0000-0000-000000000004', 'DSA-2026-004', 'Mercy', 'Jerotich', '2016-11-05', 'Female', 'NEMIS882194', 'active'),
  ('40000000-0000-0000-0000-000000000005', 'DSA-2026-005', 'Kevin', 'Kipruto', '2016-08-30', 'Male', 'NEMIS882195', 'active'),
  ('40000000-0000-0000-0000-000000000006', 'DSA-2026-006', 'Brenda', 'Chebet', '2016-03-14', 'Female', 'NEMIS882196', 'active'),
  ('40000000-0000-0000-0000-000000000007', 'DSA-2026-007', 'Dennis', 'Kiplangat', '2016-09-22', 'Male', 'NEMIS882197', 'active'),
  ('40000000-0000-0000-0000-000000000008', 'DSA-2026-008', 'Sharon', 'Jepkemoi', '2016-01-19', 'Female', 'NEMIS882198', 'active'),
  ('40000000-0000-0000-0000-000000000009', 'DSA-2026-009', 'Collins', 'Kiprono', '2016-10-10', 'Male', 'NEMIS882199', 'active'),
  ('40000000-0000-0000-0000-000000000010', 'DSA-2026-010', 'Dorcas', 'Cherotich', '2016-05-25', 'Female', 'NEMIS882200', 'active'),
  ('40000000-0000-0000-0000-000000000011', 'DSA-2026-011', 'Victor', 'Kipkemboi', '2013-06-11', 'Male', 'NEMIS882201', 'active'),
  ('40000000-0000-0000-0000-000000000012', 'DSA-2026-012', 'Daisy', 'Jepchumba', '2013-09-02', 'Female', 'NEMIS882202', 'active'),
  ('40000000-0000-0000-0000-000000000013', 'DSA-2026-013', 'Ian', 'Kiprotich', '2013-12-14', 'Male', 'NEMIS882203', 'active'),
  ('40000000-0000-0000-0000-000000000014', 'DSA-2026-014', 'Gladys', 'Chepngetich', '2013-04-08', 'Female', 'NEMIS882204', 'active'),
  ('40000000-0000-0000-0000-000000000015', 'DSA-2026-015', 'Silas', 'Koech', '2013-08-19', 'Male', 'NEMIS882205', 'active'),
  ('40000000-0000-0000-0000-000000000016', 'DSA-2026-016', 'Naomi', 'Jeruto', '2013-02-28', 'Female', 'NEMIS882206', 'active'),
  ('40000000-0000-0000-0000-000000000017', 'DSA-2026-017', 'Alex', 'Kimutai', '2013-05-17', 'Male', 'NEMIS882207', 'active'),
  ('40000000-0000-0000-0000-000000000018', 'DSA-2026-018', 'Ruth', 'Chepkirui', '2013-11-21', 'Female', 'NEMIS882208', 'active'),
  ('40000000-0000-0000-0000-000000000019', 'DSA-2026-019', 'Titus', 'Kipngetich', '2013-03-05', 'Male', 'NEMIS882209', 'active'),
  ('40000000-0000-0000-0000-000000000020', 'DSA-2026-020', 'Abigael', 'Jebet', '2013-07-16', 'Female', 'NEMIS882210', 'active')
ON CONFLICT (admission_number) DO NOTHING;

-- 7. Enrollments for Term 1 2026
-- Students 1-10 enrolled in Grade 4 Red
INSERT INTO enrollments (student_id, class_id, academic_year_id)
SELECT id, '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'
FROM students WHERE admission_number IN (
  'DSA-2026-001', 'DSA-2026-002', 'DSA-2026-003', 'DSA-2026-004', 'DSA-2026-005',
  'DSA-2026-006', 'DSA-2026-007', 'DSA-2026-008', 'DSA-2026-009', 'DSA-2026-010'
)
ON CONFLICT DO NOTHING;

-- Students 11-20 enrolled in Grade 7 Blue
INSERT INTO enrollments (student_id, class_id, academic_year_id)
SELECT id, '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'
FROM students WHERE admission_number IN (
  'DSA-2026-011', 'DSA-2026-012', 'DSA-2026-013', 'DSA-2026-014', 'DSA-2026-015',
  'DSA-2026-016', 'DSA-2026-017', 'DSA-2026-018', 'DSA-2026-019', 'DSA-2026-020'
)
ON CONFLICT DO NOTHING;

-- 8. School System Settings
INSERT INTO settings (key, value, description) VALUES
  ('fee_clearance_gate', '{"enabled": false}'::jsonb, 'Require cleared fee balance before guardian can view report card'),
  ('school_profile', '{"name": "Dorice Smart Academy", "po_box": "P.O. Box 204, Kipkaren River, Kenya", "motto": "Inspire, Achieve, Flourish"}'::jsonb, 'School identity and statutory contact')
ON CONFLICT (key) DO NOTHING;
